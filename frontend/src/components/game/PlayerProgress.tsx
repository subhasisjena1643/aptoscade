'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  id: string;
  name: string;
  progress: number; // 0-100
  position: number;
  taps: number;
  isLocal: boolean;
}

interface PlayerProgressProps {
  players: Player[];
  gamePhase: 'countdown' | 'racing' | 'finished';
  timeRemaining: number;
}

export default function PlayerProgress({ players, gamePhase, timeRemaining }: PlayerProgressProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Race Timer */}
      <div className="retro-panel p-3 text-center">
        <div className="font-mono text-lg font-bold text-retro-accent">
          {gamePhase === 'countdown' ? '🚦 STARTING...' : 
           gamePhase === 'racing' ? `⏱️ ${formatTime(timeRemaining)}` :
           '🏁 RACE FINISHED!'}
        </div>
      </div>

      {/* Player Progress Bars */}
      <div className="space-y-3">
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            className="retro-panel p-4"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {player.isLocal ? '🏎️' : '🚗'}
                </div>
                <div className="font-mono text-sm">
                  <div className="font-bold text-retro-text">
                    PLAYER {index + 1}
                    {player.isLocal && <span className="text-retro-accent"> (YOU)</span>}
                  </div>
                  <div className="text-xs text-retro-text-dim">
                    Taps: {player.taps} | Position: {player.position}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-xs text-retro-secondary">
                {Math.round(player.progress)}%
              </div>
            </div>

            {/* Progress Track */}
            <div className="relative">
              {/* Track Background */}
              <div className="w-full h-6 bg-retro-surface border-2 border-retro-border overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-30"
                     style={{
                       backgroundImage: `repeating-linear-gradient(
                         90deg,
                         transparent,
                         transparent 10px,
                         var(--retro-border) 10px,
                         var(--retro-border) 11px
                       )`
                     }}
                />

                {/* Progress Bar */}
                <motion.div
                  className="h-full bg-gradient-to-r from-retro-accent to-retro-secondary relative overflow-hidden"
                  style={{ width: `${player.progress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${player.progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {/* Progress Bar Animation */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ['-100%', '100%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                </motion.div>

                {/* Finish Line */}
                <div className="absolute right-2 top-0 h-full flex items-center">
                  <div className="font-mono text-xs font-bold text-retro-warning">
                    🏁
                  </div>
                </div>
              </div>

              {/* Speed Indicator */}
              {gamePhase === 'racing' && (
                <div className="mt-1 flex justify-between text-xs font-mono text-retro-text-dim">
                  <span>START</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span className="text-retro-warning">FINISH</span>
                </div>
              )}
            </div>

            {/* Position Badge */}
            {gamePhase === 'finished' && player.position <= 3 && (
              <motion.div
                className="absolute top-2 right-2"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', damping: 10 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  player.position === 1 ? 'bg-yellow-500 text-black' :
                  player.position === 2 ? 'bg-gray-400 text-black' :
                  'bg-orange-600 text-white'
                }`}>
                  {player.position}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Race Statistics */}
      {gamePhase === 'racing' && (
        <div className="retro-panel p-3">
          <div className="grid grid-cols-3 gap-4 text-center font-mono text-xs">
            <div>
              <div className="text-retro-secondary">LEADER</div>
              <div className="font-bold text-retro-success">
                Player {players.find(p => p.position === 1)?.id || 'TBD'}
              </div>
            </div>
            <div>
              <div className="text-retro-secondary">AVG SPEED</div>
              <div className="font-bold text-retro-warning">
                {Math.round(players.reduce((acc, p) => acc + p.taps, 0) / players.length)} T/S
              </div>
            </div>
            <div>
              <div className="text-retro-secondary">TOTAL TAPS</div>
              <div className="font-bold text-retro-accent">
                {players.reduce((acc, p) => acc + p.taps, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
