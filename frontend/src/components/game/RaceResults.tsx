'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAptosContract } from '@/hooks/useAptosContract';
import { useAptosWallet } from '@/hooks/useAptosWallet';

interface RaceResult {
  playerId: string;
  playerName: string;
  position: number;
  taps: number;
  finishTime: number;
  rewards: {
    apt: number;
    nft?: string;
  };
}

interface RaceResultsProps {
  results: RaceResult[];
  userResult: RaceResult;
  onContinue: () => void;
  onPlayAgain: () => void;
}

export default function RaceResults({ results, userResult, onContinue, onPlayAgain }: RaceResultsProps) {
  const { account } = useAptosWallet();
  const { completeRace } = useAptosContract();
  const [mounted, setMounted] = useState(false);
  const [rewardsDistributed, setRewardsDistributed] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Auto-show stats after a delay
    setTimeout(() => setShowStats(true), 2000);
    
    // Distribute rewards
    if (account && userResult.rewards.apt > 0) {
      handleRewardDistribution();
    }
  }, []);

  const handleRewardDistribution = async () => {
    try {
      const raceId = `race_${Date.now()}`; // Generate race ID
      const raceResults = results.map(result => ({
        playerId: result.playerId,
        position: result.position,
        finishTime: result.finishTime,
        tapsCount: result.taps
      }));
      
      await completeRace(raceId, raceResults);
      setRewardsDistributed(true);
    } catch (error) {
      console.error('Failed to distribute rewards:', error);
    }
  };

  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏁';
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-retro-text-dim';
    }
  };

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Victory Animation */}
      <AnimatePresence>
        {!showStats && (
          <motion.div
            className="text-center space-y-6"
            exit={{ opacity: 0, y: -50 }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, delay: 0.5 }}
              className="text-8xl"
            >
              {getPositionEmoji(userResult.position)}
            </motion.div>
            
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="space-y-2"
            >
              <div className={`font-mono text-3xl font-bold ${getPositionColor(userResult.position)}`}>
                {userResult.position === 1 ? 'VICTORY!' :
                 userResult.position === 2 ? '2ND PLACE!' :
                 userResult.position === 3 ? '3RD PLACE!' :
                 'RACE COMPLETE!'}
              </div>
              <div className="font-mono text-lg text-retro-accent">
                Position: {userResult.position}/4
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Race Results */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Results Header */}
            <div className="retro-panel p-4 text-center">
              <h2 className="text-xl font-bold text-retro-accent mb-2 font-mono tracking-wider">
                🏁 RACE RESULTS
              </h2>
              <p className="text-retro-text-dim text-sm font-mono">
                &gt; Championship standings and rewards
              </p>
            </div>

            {/* Leaderboard */}
            <div className="space-y-3">
              {results.map((result, index) => (
                <motion.div
                  key={result.playerId}
                  className={`retro-panel p-4 ${
                    result.playerId === userResult.playerId 
                      ? 'bg-retro-accent/20 border-retro-accent' 
                      : ''
                  }`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        {getPositionEmoji(result.position)}
                      </div>
                      <div className="font-mono">
                        <div className={`font-bold ${getPositionColor(result.position)}`}>
                          {result.position === 1 ? '1ST' :
                           result.position === 2 ? '2ND' :
                           result.position === 3 ? '3RD' :
                           '4TH'} PLACE
                          {result.playerId === userResult.playerId && 
                            <span className="text-retro-accent"> (YOU)</span>
                          }
                        </div>
                        <div className="text-sm text-retro-text-dim">
                          {result.taps} taps • {(result.finishTime / 1000).toFixed(2)}s
                        </div>
                      </div>
                    </div>

                    {/* Rewards */}
                    <div className="text-right font-mono text-sm">
                      {result.rewards.apt > 0 && (
                        <div className="text-retro-warning font-bold">
                          +{result.rewards.apt} APT
                        </div>
                      )}
                      {result.rewards.nft && (
                        <div className="text-retro-secondary text-xs">
                          +Racing NFT
                        </div>
                      )}
                      {result.rewards.apt === 0 && !result.rewards.nft && (
                        <div className="text-retro-text-dim text-xs">
                          No rewards
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Your Performance */}
            <div className="retro-panel p-4 bg-retro-warning/10">
              <div className="font-mono text-sm text-retro-warning mb-3 text-center font-bold">
                📊 YOUR PERFORMANCE
              </div>
              <div className="grid grid-cols-3 gap-4 text-center font-mono text-sm">
                <div>
                  <div className="text-retro-secondary text-xs">FINAL POSITION</div>
                  <div className={`font-bold text-lg ${getPositionColor(userResult.position)}`}>
                    #{userResult.position}
                  </div>
                </div>
                <div>
                  <div className="text-retro-secondary text-xs">TOTAL TAPS</div>
                  <div className="font-bold text-lg text-retro-accent">
                    {userResult.taps}
                  </div>
                </div>
                <div>
                  <div className="text-retro-secondary text-xs">AVG SPEED</div>
                  <div className="font-bold text-lg text-retro-success">
                    {Math.round(userResult.taps / (userResult.finishTime / 1000))} T/S
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards Earned */}
            {userResult.rewards.apt > 0 && (
              <motion.div
                className="retro-panel p-4 bg-retro-success/20 border-retro-success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="text-center space-y-3">
                  <div className="font-mono text-lg font-bold text-retro-success">
                    🎉 REWARDS EARNED!
                  </div>
                  <div className="flex justify-center items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl text-retro-warning">💰</div>
                      <div className="font-mono font-bold text-retro-warning">
                        {userResult.rewards.apt} APT
                      </div>
                      <div className="text-xs text-retro-text-dim font-mono">
                        {rewardsDistributed ? '✓ Transferred' : '⏳ Transferring...'}
                      </div>
                    </div>
                    {userResult.rewards.nft && (
                      <div className="text-center">
                        <div className="text-2xl text-retro-secondary">🏆</div>
                        <div className="font-mono font-bold text-retro-secondary">
                          Racing NFT
                        </div>
                        <div className="text-xs text-retro-text-dim font-mono">
                          Achievement Badge
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={onPlayAgain}
                className="retro-button px-6 py-3 font-mono font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 RACE AGAIN
              </motion.button>
              
              <motion.button
                onClick={onContinue}
                className="retro-button px-6 py-3 font-mono"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🏠 BACK TO APTOSCADE
              </motion.button>
            </div>

            {/* Stats Footer */}
            <div className="retro-panel p-3 text-center text-xs font-mono text-retro-secondary">
              <div className="space-y-1">
                <div>🔗 Rewards distributed via Aptos blockchain</div>
                <div className="opacity-80 text-retro-text-dim">
                  &gt; Thank you for playing Tap Racing Championship!
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
