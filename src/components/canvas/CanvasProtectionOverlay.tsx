import { useEffect } from 'react';
import { Crown, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// 🔓 TEMPORAIRE : désactive complètement la protection (auth + premium)
// Remets à `true` pour réactiver le flou non-connecté et le bouton Premium.
const PROTECTION_ENABLED = false;

interface CanvasProtectionOverlayProps {
  isPremium: boolean;
  isAuthenticated: boolean;
  onUpgrade: () => void;
}

export function CanvasProtectionOverlay({ isPremium, isAuthenticated, onUpgrade }: CanvasProtectionOverlayProps) {
  const navigate = useNavigate();

  // Apply blur to canvas when not authenticated
  useEffect(() => {
    const canvas = document.getElementById('merise-canvas');
    if (!canvas) return;

    if (PROTECTION_ENABLED && !isAuthenticated) {
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
  }, [isAuthenticated]);

  // Protection désactivée → accès totalement libre
  if (!PROTECTION_ENABLED) {
    return null;
  }

  // Not authenticated — blur + login CTA
  if (!isAuthenticated) {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none select-none">
        <div className="pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card/90 backdrop-blur-md border border-border/50 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">Connexion requise</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Connectez-vous pour accéder au canvas et modéliser vos schémas.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <LogIn className="w-5 h-5" />
              <span>Se connecter</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Authenticated but not premium — just show upgrade button
  if (!isPremium) {
    return (
      <div className="absolute inset-0 z-40 pointer-events-none select-none overflow-hidden">
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

  return null;
}
