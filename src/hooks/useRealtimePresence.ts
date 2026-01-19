import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound, getMuted } from '@/lib/notificationSound';
import { toast } from 'sonner';

interface CursorPosition {
  x: number;
  y: number;
}

export interface PresenceUser {
  id: string;
  username: string;
  color: string;
  cursor: CursorPosition | null;
  lastSeen: number;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useRealtimePresence(projectId: string | null, username: string) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [myUserId] = useState(() => generateUserId());
  const [myColor] = useState(() => getRandomColor());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const cursorRef = useRef<CursorPosition | null>(null);
  const initialSyncDone = useRef(false);
  // Track users we've already notified about to prevent duplicate notifications
  const notifiedUsers = useRef<Set<string>>(new Set());

  const updateCursor = useCallback((x: number, y: number) => {
    cursorRef.current = { x, y };
    if (channelRef.current && projectId) {
      channelRef.current.track({
        id: myUserId,
        username: username || 'Anonyme',
        color: myColor,
        cursor: cursorRef.current,
        lastSeen: Date.now(),
      });
    }
  }, [projectId, myUserId, username, myColor]);

  useEffect(() => {
    if (!projectId || !username) {
      setUsers([]);
      initialSyncDone.current = false;
      notifiedUsers.current.clear();
      return;
    }

    const channel = supabase.channel(`presence-${projectId}`, {
      config: {
        presence: {
          key: myUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presentUsers: PresenceUser[] = [];
        
        Object.entries(state).forEach(([_key, presences]) => {
          const presence = (presences as unknown[])[0] as PresenceUser;
          if (presence && presence.id !== myUserId) {
            presentUsers.push(presence);
            // Mark existing users as already notified during initial sync
            if (!initialSyncDone.current) {
              notifiedUsers.current.add(presence.id);
            }
          }
        });
        
        setUsers(presentUsers);
        initialSyncDone.current = true;
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Play sound and show toast when someone NEW joins (after initial sync)
        if (initialSyncDone.current && newPresences.length > 0) {
          const joiner = newPresences[0] as unknown as PresenceUser;
          // Only notify if we haven't notified about this user before
          if (joiner.id !== myUserId && !notifiedUsers.current.has(joiner.id)) {
            notifiedUsers.current.add(joiner.id);
            playNotificationSound('join');
            if (!getMuted()) {
              toast.success(`${joiner.username} a rejoint le projet`, {
                duration: 3000,
              });
            }
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Show toast when someone leaves and remove from notified set
        if (initialSyncDone.current && leftPresences.length > 0) {
          const leaver = leftPresences[0] as unknown as PresenceUser;
          if (leaver.id !== myUserId) {
            // Remove from notified set so they can be notified again if they rejoin
            notifiedUsers.current.delete(leaver.id);
            if (!getMuted()) {
              toast.info(`${leaver.username} a quitté le projet`, {
                duration: 3000,
              });
            }
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: myUserId,
            username: username || 'Anonyme',
            color: myColor,
            cursor: null,
            lastSeen: Date.now(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId, myUserId, username, myColor]);

  return {
    users,
    myUserId,
    myColor,
    updateCursor,
  };
}
