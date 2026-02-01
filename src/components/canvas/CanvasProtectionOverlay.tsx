import { useState, useEffect } from 'react';
import { Crown, Lock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CanvasProtectionOverlayProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

export function CanvasProtectionOverlay({ isPremium, onUpgrade }: CanvasProtectionOverlayProps) {
  const [screenshotDetected, setScreenshotDetected] = useState(false);

  useEffect(() => {
    if (isPremium) return;

    // Detect screenshot attempts via keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen, Cmd+Shift+3/4 (Mac), Windows+PrintScreen
      const isScreenshotKey = 
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) ||
        (e.metaKey && e.key === 'PrintScreen');
      
      if (isScreenshotKey) {
        e.preventDefault();
        setScreenshotDetected(true);
        setTimeout(() => setScreenshotDetected(false), 3000);
      }
    };

    // Detect visibility changes (can indicate screenshot in some cases)
    const handleVisibilityChange = () => {
      // Some screenshot tools cause brief visibility changes
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <>
      {/* Screenshot blocking overlay - covers entire canvas area */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-40 pointer-events-none select-none overflow-hidden"
      >
        {/* Diagonal lines pattern overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(var(--primary) / 0.02) 20px, hsl(var(--primary) / 0.02) 40px)',
          }}
        />

        {/* Lock icon indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 pointer-events-auto">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Protection anti-capture</span>
        </div>

        {/* Upgrade prompt - pointer-events enabled only on the button */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUpgrade}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <Crown className="w-4 h-4" />
            <span>Passer Premium</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Full black screen on screenshot detection */}
      <AnimatePresence>
        {screenshotDetected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
            style={{ pointerEvents: 'all' }}
          >
            <div className="text-center text-white space-y-4">
              <ShieldAlert className="w-16 h-16 mx-auto text-red-500" />
              <h2 className="text-2xl font-bold">Capture bloquée</h2>
              <p className="text-gray-400 max-w-md">
                Les captures d'écran sont réservées aux utilisateurs Premium.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setScreenshotDetected(false);
                  onUpgrade();
                }}
                className="mt-4 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold mx-auto"
              >
                <Crown className="w-5 h-5" />
                <span>Devenir Premium</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}