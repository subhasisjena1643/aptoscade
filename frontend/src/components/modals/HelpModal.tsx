'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  RetroButton,
  RetroTypewriter 
} from '@/components/RetroAnimations';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
  const [selectedSection, setSelectedSection] = useState('getting-started');

  if (!isOpen) return null;

  const helpSections = {
    'getting-started': {
      title: '🚀 Getting Started',
      content: [
        '• Welcome to Aptoscade - the retro arcade with DeFi rewards!',
        '• Click "ENTER ARCADE" to browse available games',
        '• Start with TAP RACER for the full experience',
        '• Earn APTOS tokens by playing and achieving high scores',
        '• Chat with Piper, your AI companion, anytime'
      ]
    },
    'games': {
      title: '🎮 Games Guide',
      content: [
        'TAP RACER 🏎️',
        '• Use arrow keys to steer your car',
        '• Avoid obstacles and collect power-ups',
        '• Higher speeds = more points and tokens',
        '',
        'RHYTHM RUSH 🎵 (Coming Soon)',
        '• Match beats to earn combo multipliers',
        '• Perfect timing yields maximum rewards',
        '',
        'PIXEL FIGHT ⚔️ (Coming Soon)',
        '• Combat arena with strategic gameplay',
        '• Win battles to earn rare NFT rewards'
      ]
    },
    'controls': {
      title: '🎯 Controls',
      content: [
        'General Navigation:',
        '• Mouse: Click to interact with buttons',
        '• ESC: Close modals and menus',
        '• Enter: Confirm selections',
        '',
        'TAP RACER:',
        '• ↑ Arrow: Accelerate',
        '• ↓ Arrow: Brake/Reverse',
        '• ← → Arrows: Steer left/right',
        '• Space: Boost (when available)',
        '',
        'Chat with Pixel:',
        '• Click "💬 PIXEL" in taskbar',
        '• Type your message and press Enter',
        '• Ask about anything - Pixel loves to chat!'
      ]
    },
    'rewards': {
      title: '💰 Rewards System',
      content: [
        'APTOS Tokens:',
        '• Earned through gameplay achievements',
        '• Higher scores = more tokens',
        '• Bonus tokens for daily play streaks',
        '',
        'Leaderboards:',
        '• Global rankings for each game',
        '• Weekly and monthly competitions',
        '• Top players earn exclusive rewards',
        '',
        'NFT Achievements:',
        '• Unlock unique digital collectibles',
        '• Rare achievements for special feats',
        '• Trade with other players (coming soon)'
      ]
    },
    'piper': {
      title: '🤖 Piper AI Guide',
      content: [
        'Meet Piper - Your AI Companion:',
        '• Intelligent arcade assistant',
        '• Discusses any topic you want',
        '• Automatically optimizes your experience',
        '• Provides game tips and strategies',
        '',
        'Piper can help with:',
        '• Game strategies and tips',
        '• Interface adjustments (brightness, etc.)',
        '• General conversation on any topic',
        '• Technical questions about the platform',
        '',
        'Auto-Optimization Features:',
        '• Adjusts brightness based on time of day',
        '• Reduces eye strain during long sessions',
        '• Optimizes interface for accessibility'
      ]
    }
  };

  const sections = Object.keys(helpSections);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="retro-window p-6 w-[600px] h-[500px] flex flex-col"
      >
        {/* Main Header */}
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
            ❓ HELP & SUPPORT
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-48 pr-4 border-r border-cyan-400/30">
            <div className="pixel-text text-cyan-400 mb-4" style={{ fontSize: '10px' }}>
              📋 TOPICS
            </div>
            
            <div className="space-y-1">
              {sections.map((section) => (
                <RetroButton
                  key={section}
                  onClick={() => setSelectedSection(section)}
                  variant={selectedSection === section ? "default" : "secondary"}
                  className="w-full p-2"
                >
                  <span className="pixel-text" style={{ fontSize: '8px' }}>
                    {helpSections[section as keyof typeof helpSections].title}
                  </span>
                </RetroButton>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 pl-4">
            <div className="pixel-text text-cyan-400 mb-4" style={{ fontSize: '10px' }}>
              {helpSections[selectedSection as keyof typeof helpSections].title}
            </div>

            <div className="retro-hologram p-4 h-80 overflow-y-auto">
              <div className="space-y-2">
                {helpSections[selectedSection as keyof typeof helpSections].content.map((line, index) => (
                  <div 
                    key={index} 
                    className={`pixel-text ${line.startsWith('•') ? 'text-white ml-2' : 
                              line === '' ? '' : 
                              line.includes(':') ? 'text-yellow-400 font-bold' : 'text-gray-300'}`}
                    style={{ fontSize: '8px', lineHeight: '1.4' }}
                  >
                    {line || <br />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
