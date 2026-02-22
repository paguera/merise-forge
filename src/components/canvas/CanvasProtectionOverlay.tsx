import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface CanvasProtectionOverlayProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

export function CanvasProtectionOverlay({ isPremium, onUpgrade }: CanvasProtectionOverlayProps) {
  if (isPremium) return null;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none select-none overflow-hidden">
      {/* Upgrade button — bottom right */}
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
  );
}
