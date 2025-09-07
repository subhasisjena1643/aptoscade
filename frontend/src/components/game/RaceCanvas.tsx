'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAptosWallet } from '@/hooks/useAptosWallet';

interface RaceCanvasProps {
  players: any[];
  gameState: any;
  onTap: () => void;
  onGameEnd: (results: any) => void;
  taps: number;
}

export default function RaceCanvas({ players, gameState, onTap, onGameEnd, taps }: RaceCanvasProps) {
  const { account } = useAptosWallet();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showTapEffect, setShowTapEffect] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (gameState.phase === 'countdown') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Start race
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState.phase]);

  // Tap effect animation
  const handleTap = useCallback(() => {
    if (gameState.phase !== 'racing') return;
    
    onTap();
    setShowTapEffect(true);
    setTimeout(() => setShowTapEffect(false), 150);

    // Create tap ripple effect
    if (canvasRef.current) {
      const ripple = document.createElement('div');
      ripple.className = 'tap-ripple';
      ripple.style.left = Math.random() * 80 + 10 + '%';
      ripple.style.top = Math.random() * 80 + 10 + '%';
      canvasRef.current.appendChild(ripple);
      setTimeout(() => ripple.remove(), 800);
    }
  }, [gameState.phase, onTap]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleTap]);

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Countdown Phase */}
      {gameState.phase === 'countdown' && countdown > 0 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            key={countdown}
            className="text-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <div className="text-8xl font-bold text-retro-accent font-mono mb-4">
              {countdown}
            </div>
            <div className="text-xl font-mono text-retro-text">
              GET READY TO RACE!
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Race Start */}
      {gameState.phase === 'countdown' && countdown === 0 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            // Signal race start
            setTimeout(() => {
              // This would trigger the actual race start
            }, 1000);
          }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: 'spring', damping: 8 }}
          >
            <div className="text-6xl font-bold text-retro-success font-mono mb-4">
              GO! 🏁
            </div>
            <div className="text-lg font-mono text-retro-accent">
              TAP TO RACE!
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Racing Interface */}
      {gameState.phase === 'racing' && (
        <div className="space-y-4">
          {/* Tap Zone */}
          <motion.div
            ref={canvasRef}
            className={`retro-panel p-8 relative cursor-pointer select-none min-h-[300px] ${
              showTapEffect ? 'bg-retro-accent/20 border-retro-accent' : ''
            }`}
            onClick={handleTap}
            whileTap={{ scale: 0.98 }}
            style={{ 
              background: showTapEffect 
                ? 'radial-gradient(circle, var(--retro-accent)/20 0%, transparent 70%)'
                : undefined
            }}
          >
            {/* Racing Track Visual */}
            <div className="absolute inset-4 border-2 border-retro-border/30 rounded">
              <div className="w-full h-full relative overflow-hidden">
                {/* Track Lines */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-full h-0.5 bg-retro-secondary/50"
                    style={{ top: `${20 + i * 15}%` }}
                    animate={{
                      x: ['-100%', '100%']
                    }}
                    transition={{
                      duration: 2 - (taps / 1000), // Speed increases with taps
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Tap Instructions */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-center space-y-4"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-4xl">🏎️</div>
                <div className="font-mono text-lg font-bold text-retro-accent">
                  TAP TO RACE!
                </div>
                <div className="font-mono text-sm text-retro-text-dim">
                  SPACEBAR or CLICK
                </div>
                <div className="font-mono text-xs text-retro-secondary">
                  Taps: {taps}
                </div>
              </motion.div>
            </div>

            {/* Tap Effects Container */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Tap ripples will be added here dynamically */}
            </div>
          </motion.div>

          {/* Racing Stats */}
          <div className="retro-panel p-4">
            <div className="grid grid-cols-3 gap-4 text-center font-mono text-sm">
              <div>
                <div className="text-retro-secondary text-xs">SPEED</div>
                <div className="font-bold text-retro-accent">
                  {Math.round((taps / (gameState.duration / 1000)) || 0)} T/S
                </div>
              </div>
              <div>
                <div className="text-retro-secondary text-xs">TAPS</div>
                <div className="font-bold text-retro-warning">
                  {taps}
                </div>
              </div>
              <div>
                <div className="text-retro-secondary text-xs">TIME</div>
                <div className="font-bold text-retro-success">
                  {Math.floor(gameState.timeRemaining)}s
                </div>
              </div>
            </div>
          </div>

          {/* Boost Indicator */}
          {taps > 0 && taps % 10 === 0 && (
            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="retro-panel p-4 bg-retro-success/20 border-retro-success">
                <div className="text-center font-mono font-bold text-retro-success">
                  ⚡ SPEED BOOST! ⚡
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Finish Line Effect */}
      {gameState.phase === 'finished' && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center space-y-4"
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            <div className="text-6xl">🏁</div>
            <div className="font-mono text-3xl font-bold text-retro-success">
              RACE FINISHED!
            </div>
            <div className="font-mono text-lg text-retro-accent">
              Final Score: {taps} taps
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Custom CSS for effects */}
      <style jsx>{`
        .tap-ripple {
          position: absolute;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--retro-accent) 0%, transparent 70%);
          animation: ripple-burst 0.8s ease-out forwards;
          pointer-events: none;
          z-index: 10;
        }

        @keyframes ripple-burst {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
