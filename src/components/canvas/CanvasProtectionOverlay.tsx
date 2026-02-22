import { useEffect } from 'react';
import { Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface CanvasProtectionOverlayProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

export function CanvasProtectionOverlay({ isPremium, onUpgrade }: CanvasProtectionOverlayProps) {
  // Apply blur to the canvas when not premium
  useEffect(() => {
    const canvas = document.getElementById('merise-canvas');
    if (!canvas) return;

    if (!isPremium) {
      canvas.style.filter = 'blur(6px)';
      canvas.style.pointerEvents = 'none';
      canvas.style.userSelect = 'none';
    } else {
      canvas.style.filter = '';
      canvas.style.pointerEvents = '';
      canvas.style.userSelect = '';
    }

    return () => {
      if (canvas) {
        canvas.style.filter = '';
        canvas.style.pointerEvents = '';
        canvas.style.userSelect = '';
      }
    };
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none select-none">
      {/* Central upgrade CTA */}
      <div className="pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card/90 backdrop-blur-md border border-border/50 shadow-2xl"
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-foreground">Contenu réservé Premium</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Passez Premium pour accéder au canvas sans restrictions.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUpgrade}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <Crown className="w-5 h-5" />
            <span>Passer Premium</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
