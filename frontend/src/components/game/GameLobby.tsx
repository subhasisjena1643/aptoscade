'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAptosWallet } from '@/hooks/useAptosWallet';

interface Player {
  id: string;
  name: string;
  walletAddress: string;
  ready: boolean;
  avatar: string;
}

interface GameLobbyProps {
  players: Player[];
  onStartGame: () => void;
  onLeaveGame: () => void;
  isHost: boolean;
}

export default function GameLobby({ players, onStartGame, onLeaveGame, isHost }: GameLobbyProps) {
  const { account } = useAptosWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const canStart = players.length >= 2 && players.every(p => p.ready);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Lobby Header */}
      <div className="retro-panel p-4 text-center">
        <h2 className="text-xl font-bold text-retro-accent mb-2 font-mono tracking-wider">
          🏁 RACING LOBBY
        </h2>
        <p className="text-retro-text-dim text-sm font-mono">
          &gt; Waiting for players to join the championship...
        </p>
      </div>

      {/* Player Slots */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, index) => {
          const player = players[index];
          const isEmpty = !player;

          return (
            <motion.div
              key={index}
              className={`retro-panel p-4 ${
                isEmpty 
                  ? 'opacity-50 border-dashed' 
                  : player.ready 
                    ? 'bg-retro-success/20 border-retro-success' 
                    : 'bg-retro-warning/20 border-retro-warning'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-center space-y-2">
                {isEmpty ? (
                  <>
                    <div className="text-3xl opacity-50">👤</div>
                    <div className="font-mono text-xs text-retro-text-dim">
                      WAITING FOR PLAYER...
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl">{player.avatar || '🏎️'}</div>
                    <div className="font-mono text-sm font-bold text-retro-text">
                      PLAYER {index + 1}
                    </div>
                    <div className="font-mono text-xs text-retro-text-dim">
                      {formatAddress(player.walletAddress)}
                    </div>
                    <div className={`font-mono text-xs font-bold ${
                      player.ready ? 'text-retro-success' : 'text-retro-warning'
                    }`}>
                      {player.ready ? '✓ READY' : '⏳ NOT READY'}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Race Rules */}
      <div className="retro-panel p-4 bg-retro-warning/10">
        <div className="font-mono text-sm text-retro-warning mb-3 text-center">
          ⚡ CHAMPIONSHIP RULES
        </div>
        <ul className="text-xs text-retro-text-dim font-mono space-y-1">
          <li>&gt; Tap spacebar or click as fast as possible</li>
          <li>&gt; First to reach 100% wins the race</li>
          <li>&gt; Winners earn APT tokens: 1st: 10 APT, 2nd: 5 APT, 3rd: 2 APT</li>
          <li>&gt; All finishers receive racing achievement NFTs</li>
          <li>&gt; Race duration: 60 seconds maximum</li>
        </ul>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 justify-center">
        {isHost && (
          <motion.button
            onClick={onStartGame}
            disabled={!canStart}
            className={`retro-button px-6 py-3 font-mono font-bold ${
              canStart 
                ? 'text-retro-text hover:brightness-110' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            whileHover={canStart ? { scale: 1.05 } : {}}
            whileTap={canStart ? { scale: 0.95 } : {}}
          >
            🚀 START RACE
          </motion.button>
        )}
        
        <motion.button
          onClick={onLeaveGame}
          className="retro-button px-6 py-2 font-mono text-retro-danger"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🚪 LEAVE LOBBY
        </motion.button>
      </div>

      {/* Connection Status */}
      <div className="retro-panel p-3 text-center text-xs font-mono text-retro-secondary">
        <div className="space-y-1">
          <div>🔗 Connected to Aptoscade Racing Network</div>
          <div className="opacity-80 text-retro-text-dim">
            &gt; {players.length}/4 players ready for championship
          </div>
        </div>
      </div>

      {/* Waiting Animation */}
      {players.length < 4 && (
        <div className="flex justify-center items-center space-x-2 py-4">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-retro-accent rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
