import { Crown, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface CanvasProtectionOverlayProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

export function CanvasProtectionOverlay({ isPremium, onUpgrade }: CanvasProtectionOverlayProps) {
  if (isPremium) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 pointer-events-none select-none"
      style={{
        background: 'repeating-linear-gradient(45deg, transparent, transparent 30px, hsl(var(--primary) / 0.03) 30px, hsl(var(--primary) / 0.03) 60px)',
      }}
    >
      {/* Watermark pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-muted-foreground/10 font-bold text-xl sm:text-2xl whitespace-nowrap transform -rotate-45 select-none"
            style={{
              left: `${(i % 4) * 30}%`,
              top: `${Math.floor(i / 4) * 35}%`,
            }}
          >
            RESSOU MERISE © PREMIUM
          </div>
        ))}
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

      {/* Lock icon indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border/50">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Protection anti-capture</span>
      </div>
    </motion.div>
  );
}