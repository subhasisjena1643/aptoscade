'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  RetroButton,
  RetroTypewriter 
} from '@/components/RetroAnimations';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal = ({ isOpen, onClose }: LeaderboardModalProps) => {
  const [selectedGame, setSelectedGame] = useState('TAP_RACER');

  if (!isOpen) return null;

  const leaderboardData = {
    TAP_RACER: [
      { rank: 1, player: 'SpeedDemon', score: 15420, tokens: 1250, country: '🇺🇸' },
      { rank: 2, player: 'RacingAce', score: 14890, tokens: 1100, country: '🇯🇵' },
      { rank: 3, player: 'TurboPixel', score: 14320, tokens: 950, country: '🇩🇪' },
      { rank: 4, player: 'NeonRider', score: 13750, tokens: 800, country: '🇬🇧' },
      { rank: 5, player: 'CyberRacer', score: 13200, tokens: 650, country: '🇫🇷' },
      { rank: 6, player: 'QuantumSpeed', score: 12890, tokens: 500, country: '🇨🇦' },
      { rank: 7, player: 'PixelPilot', score: 12450, tokens: 400, country: '🇦🇺' },
      { rank: 8, player: 'RetroRush', score: 12100, tokens: 350, country: '🇰🇷' },
      { rank: 9, player: 'ArcadeKing', score: 11750, tokens: 300, country: '🇧🇷' },
      { rank: 10, player: 'You', score: 8420, tokens: 125, country: '🌍' }
    ],
    RHYTHM_RUSH: [
      { rank: 1, player: 'BeatMaster', score: 9850, tokens: 890, country: '🇯🇵' },
      { rank: 2, player: 'SyncKing', score: 9420, tokens: 750, country: '🇰🇷' },
      { rank: 3, player: 'RhythmAce', score: 9100, tokens: 650, country: '🇺🇸' }
    ],
    PIXEL_FIGHT: [
      { rank: 1, player: 'WarriorX', score: 7650, tokens: 980, country: '🇷🇺' },
      { rank: 2, player: 'FightClub', score: 7200, tokens: 820, country: '🇺🇸' },
      { rank: 3, player: 'PixelPunch', score: 6890, tokens: 700, country: '🇯🇵' }
    ]
  };

  const games = [
    { id: 'TAP_RACER', name: 'TAP RACER', icon: '🏎️' },
    { id: 'RHYTHM_RUSH', name: 'RHYTHM RUSH', icon: '🎵' },
    { id: 'PIXEL_FIGHT', name: 'PIXEL FIGHT', icon: '⚔️' }
  ];

  const currentData = leaderboardData[selectedGame as keyof typeof leaderboardData] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="retro-window p-6 w-[500px] max-h-[600px] overflow-y-auto"
      >
        <div className="retro-window-header mb-4 flex justify-between items-center">
          <div className="retro-window-controls">
            <button className="retro-btn minimize">-</button>
            <button className="retro-btn maximize">□</button>
            <button 
              onClick={onClose}
              className="retro-btn close"
            >
              ✕
            </button>
          </div>
          <div className="pixel-text" style={{ fontSize: '10px' }}>
            🏆 GLOBAL LEADERBOARDS
          </div>
        </div>

        {/* Game Selection */}
        <div className="flex gap-2 mb-4">
          {games.map((game) => (
            <RetroButton
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              variant={selectedGame === game.id ? "default" : "secondary"}
              className="flex items-center gap-1 px-3 py-1"
            >
              <span className="pixel-text" style={{ fontSize: '8px' }}>
                {game.icon} {game.name}
              </span>
            </RetroButton>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="retro-hologram p-4">
          <div className="grid grid-cols-5 gap-2 mb-3 pb-2 border-b border-cyan-400/30">
            <div className="pixel-text text-cyan-400" style={{ fontSize: '8px' }}>RANK</div>
            <div className="pixel-text text-cyan-400" style={{ fontSize: '8px' }}>PLAYER</div>
            <div className="pixel-text text-cyan-400" style={{ fontSize: '8px' }}>SCORE</div>
            <div className="pixel-text text-cyan-400" style={{ fontSize: '8px' }}>TOKENS</div>
            <div className="pixel-text text-cyan-400" style={{ fontSize: '8px' }}>REGION</div>
          </div>

          <div className="space-y-2">
            {currentData.map((entry, index) => (
              <div 
                key={index}
                className={`grid grid-cols-5 gap-2 py-1 px-2 rounded ${
                  entry.player === 'You' ? 'bg-yellow-600/20 border border-yellow-400/30' : ''
                }`}
              >
                <div className={`pixel-text ${entry.rank <= 3 ? 'text-yellow-400' : 'text-white'}`} 
                     style={{ fontSize: '8px' }}>
                  #{entry.rank}
                </div>
                <div className={`pixel-text ${entry.player === 'You' ? 'text-yellow-400' : 'text-white'}`} 
                     style={{ fontSize: '8px' }}>
                  {entry.player}
                </div>
                <div className="pixel-text text-green-400" style={{ fontSize: '8px' }}>
                  {entry.score.toLocaleString()}
                </div>
                <div className="pixel-text text-cyan-400" style={{ fontSize: '8px' }}>
                  {entry.tokens} APTOS
                </div>
                <div style={{ fontSize: '8px' }}>
                  {entry.country}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="mt-4 retro-panel p-3">
          <div className="pixel-text text-cyan-400 mb-2" style={{ fontSize: '8px' }}>
            📊 YOUR STATS
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="pixel-text text-yellow-400" style={{ fontSize: '10px' }}>RANK</div>
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>#10</div>
            </div>
            <div className="text-center">
              <div className="pixel-text text-yellow-400" style={{ fontSize: '10px' }}>BEST</div>
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>8,420</div>
            </div>
            <div className="text-center">
              <div className="pixel-text text-yellow-400" style={{ fontSize: '10px' }}>EARNED</div>
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>125 APTOS</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
