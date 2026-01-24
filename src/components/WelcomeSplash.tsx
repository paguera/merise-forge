import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeSplashProps {
  onComplete: () => void;
}

export function WelcomeSplash({ onComplete }: WelcomeSplashProps) {
  const [phase, setPhase] = useState<'logo' | 'split' | 'done'>('logo');

  useEffect(() => {
    // Logo appears and stays for 1.5s
    const logoTimer = setTimeout(() => setPhase('split'), 1500);
    // Split animation for 1s then complete
    const completeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background gradient effects */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/20 via-transparent to-transparent rounded-full blur-3xl" />
          </motion.div>

          {/* Logo Container */}
          <div className="relative flex items-center justify-center">
            {/* Left half - "RESSOU" */}
            <motion.div
              className="overflow-hidden"
              initial={{ x: 0 }}
              animate={phase === 'split' ? { x: -200, opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            >
              <motion.span
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                RESSOU
              </motion.span>
            </motion.div>

            {/* Center sparkle effect */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={phase === 'split' ? { opacity: 1, scale: 1.5 } : { opacity: 0.5, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_30px_10px_hsl(var(--primary))]" />
            </motion.div>

            {/* Right half - "MERISE" */}
            <motion.div
              className="overflow-hidden"
              initial={{ x: 0 }}
              animate={phase === 'split' ? { x: 200, opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            >
              <motion.span
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-accent via-emerald-400 to-accent bg-clip-text text-transparent tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              >
                MERISE
              </motion.span>
            </motion.div>
          </div>

          {/* Particles effect during split */}
          {phase === 'split' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-primary rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 500,
                    y: (Math.random() - 0.5) * 300,
                    opacity: 0,
                    scale: Math.random() * 2 + 1,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: Math.random() * 0.2,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Subtitle */}
          <motion.p
            className="absolute bottom-1/3 text-muted-foreground text-lg tracking-widest uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={phase === 'logo' ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            Modélisation de bases de données
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
