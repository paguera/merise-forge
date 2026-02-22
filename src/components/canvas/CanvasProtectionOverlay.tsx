import { useState, useEffect, useCallback } from 'react';
import { Crown, Lock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CanvasProtectionOverlayProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

export function CanvasProtectionOverlay({ isPremium, onUpgrade }: CanvasProtectionOverlayProps) {
  const [screenshotDetected, setScreenshotDetected] = useState(false);

  const triggerBlock = useCallback(() => {
    setScreenshotDetected(true);
    setTimeout(() => setScreenshotDetected(false), 3000);
  }, []);

  useEffect(() => {
    if (isPremium) return;

    // Detect screenshot keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const isScreenshotKey =
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) ||
        (e.metaKey && e.key === 'PrintScreen') ||
        // Windows: Win+Shift+S (Snipping Tool)
        (e.metaKey && e.shiftKey && e.key === 'S') ||
        (e.metaKey && e.shiftKey && e.key === 's');

      if (isScreenshotKey) {
        e.preventDefault();
        triggerBlock();
      }
    };

    // Detect when page loses focus (common with screenshot tools)
    const handleBlur = () => {
      // Brief trigger — many screenshot tools cause a blur event
      triggerBlock();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPremium, triggerBlock]);

  if (isPremium) return null;

  return (
    <>
      {/* Persistent watermark overlay — visible on any screenshot */}
      <div className="absolute inset-0 z-40 pointer-events-none select-none overflow-hidden">
        {/* Dense repeating watermark text */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 80px,
                hsl(var(--primary) / 0.04) 80px,
                hsl(var(--primary) / 0.04) 82px
              )
            `,
          }}
        />

        {/* Watermark text grid — renders on screenshot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute"
            style={{
              width: '200%',
              height: '200%',
              top: '-50%',
              left: '-50%',
              transform: 'rotate(-30deg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, 300px)',
              gridTemplateRows: 'repeat(auto-fill, 120px)',
              gap: '0px',
              opacity: 0.06,
            }}
          >
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-foreground font-bold text-lg whitespace-nowrap select-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                RESSOU MERISE — NON LICENCIÉ
              </div>
            ))}
          </div>
        </div>

        {/* Lock indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50 pointer-events-auto">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Protection anti-capture</span>
        </div>

        {/* Upgrade button */}
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
      </div>

      {/* Full black overlay on screenshot detection */}
      <AnimatePresence>
        {screenshotDetected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
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
