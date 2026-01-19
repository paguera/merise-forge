import { memo } from 'react';
import type { PresenceUser } from '@/hooks/useRealtimePresence';

interface Props {
  users: PresenceUser[];
}

export const CollaboratorCursors = memo(function CollaboratorCursors({ users }: Props) {
  return (
    <>
      {users.map((user) => {
        if (!user.cursor) return null;
        
        return (
          <div
            key={user.id}
            className="fixed pointer-events-none z-50 transition-all duration-75"
            style={{
              left: user.cursor.x,
              top: user.cursor.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor arrow */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="drop-shadow-lg"
            >
              <path
                d="M5.65685 5.65685L5.65685 18.3137L10.4142 13.5563H16.9706L5.65685 5.65685Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            
            {/* Username badge */}
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap shadow-lg"
              style={{
                backgroundColor: user.color,
                color: 'white',
              }}
            >
              {user.username}
            </div>
          </div>
        );
      })}
    </>
  );
});
