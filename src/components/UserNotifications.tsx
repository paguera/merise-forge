import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Info, AlertTriangle, CheckCircle, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_type: string;
  created_at: string;
  expires_at: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  announcement: <Megaphone className="w-5 h-5 text-primary" />,
};

const typeColors: Record<string, string> = {
  info: 'border-blue-500/30 bg-blue-500/5',
  warning: 'border-yellow-500/30 bg-yellow-500/5',
  success: 'border-green-500/30 bg-green-500/5',
  announcement: 'border-primary/30 bg-primary/5',
};

export function UserNotifications() {
  const { user, isPremium } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    fetchNotifications();
    fetchReadNotifications();
  }, [user, isPremium]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Filter based on target_type and expiration
      const filtered = data.filter((n) => {
        // Check expiration
        if (n.expires_at && new Date(n.expires_at) < new Date()) return false;
        
        // Check target type
        if (n.target_type === 'all') return true;
        if (n.target_type === 'premium' && isPremium) return true;
        
        return false;
      });

      setNotifications(filtered);
    }
  };

  const fetchReadNotifications = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id);

    if (data) {
      setReadIds(new Set(data.map((r) => r.notification_id)));
    }
  };

  useEffect(() => {
    // Show unread notifications
    const unread = notifications
      .filter((n) => !readIds.has(n.id))
      .map((n) => n.id);
    setVisible(unread);
  }, [notifications, readIds]);

  const dismissNotification = async (id: string) => {
    setVisible((prev) => prev.filter((v) => v !== id));

    if (user) {
      await supabase.from('notification_reads').insert({
        notification_id: id,
        user_id: user.id,
      });
    }
  };

  const visibleNotifications = notifications.filter((n) => visible.includes(n.id));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ delay: index * 0.1 }}
            className={`
              pointer-events-auto rounded-lg border-2 p-4 shadow-lg backdrop-blur-md
              ${typeColors[notification.type] || typeColors.info}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {typeIcons[notification.type] || typeIcons.info}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                  {notification.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 -mr-2 -mt-2 h-8 w-8"
                onClick={() => dismissNotification(notification.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
