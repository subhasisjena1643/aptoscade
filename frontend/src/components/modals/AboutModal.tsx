'use client';

import { motion } from 'framer-motion';
import { 
  RetroButton,
  RetroTypewriter,
  RetroGlitch
} from '@/components/RetroAnimations';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  if (!isOpen) return null;

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
            ℹ️ ABOUT APTOSCADE
          </div>
        </div>

        <div className="space-y-4">
          {/* Logo and Title */}
          <div className="text-center retro-hologram p-4">
            <div className="text-4xl mb-2">🚀</div>
            <div style={{ fontSize: '16px' }}>
              <RetroGlitch className="pixel-text text-cyan-400 mb-2">
                APTOSCADE
              </RetroGlitch>
            </div>
            <div className="pixel-text text-gray-400" style={{ fontSize: '8px' }}>
              Retro Gaming Meets DeFi Innovation
            </div>
          </div>

          {/* Description */}
          <div className="retro-panel p-4">
            <div className="pixel-text text-cyan-400 mb-2" style={{ fontSize: '10px' }}>
              🎮 WHAT IS APTOSCADE?
            </div>
            <div className="pixel-text text-white" style={{ fontSize: '8px', lineHeight: '1.5' }}>
              Aptoscade is a revolutionary gaming platform that combines the nostalgia of classic arcade games 
              with cutting-edge DeFi technology. Play retro-style games, earn real cryptocurrency rewards, 
              and experience the future of gaming with our AI companion, Piper.
            </div>
          </div>

          {/* Features */}
          <div className="retro-panel p-4">
            <div className="pixel-text text-cyan-400 mb-2" style={{ fontSize: '10px' }}>
              ✨ KEY FEATURES
            </div>
            <div className="space-y-1">
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>
                • 🎯 Skill-based arcade games with real rewards
              </div>
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>
                • 🤖 Piper AI - Your intelligent gaming companion
              </div>
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>
                • 💰 Earn APTOS tokens through gameplay
              </div>
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>
                • 🏆 Global leaderboards and competitions
              </div>
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>
                • 🎨 NFT achievements and collectibles
              </div>
              <div className="pixel-text text-white" style={{ fontSize: '8px' }}>
                • 🔗 Cross-chain DeFi integration
              </div>
            </div>
          </div>

          {/* Technology */}
          <div className="retro-panel p-4">
            <div className="pixel-text text-cyan-400 mb-2" style={{ fontSize: '10px' }}>
              🔧 TECHNOLOGY STACK
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="pixel-text text-yellow-400" style={{ fontSize: '8px' }}>Frontend:</div>
                <div className="pixel-text text-white" style={{ fontSize: '7px' }}>
                  • Next.js 15<br/>
                  • TypeScript<br/>
                  • Framer Motion<br/>
                  • Anime.js
                </div>
              </div>
              <div>
                <div className="pixel-text text-yellow-400" style={{ fontSize: '8px' }}>Backend:</div>
                <div className="pixel-text text-white" style={{ fontSize: '7px' }}>
                  • AI Integration<br/>
                  • Web3 APIs<br/>
                  • Real-time Data<br/>
                  • Smart Contracts
                </div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="retro-panel p-4">
            <div className="pixel-text text-cyan-400 mb-2" style={{ fontSize: '10px' }}>
              👥 DEVELOPMENT TEAM
            </div>
            <div className="pixel-text text-white" style={{ fontSize: '8px', lineHeight: '1.5' }}>
              Aptoscade is built by a passionate team of developers, designers, and blockchain enthusiasts 
              who believe in the future of decentralized gaming. Our mission is to create engaging 
              experiences that reward skill and bring communities together.
            </div>
          </div>

          {/* Version Info */}
          <div className="retro-panel p-4">
            <div className="pixel-text text-cyan-400 mb-2" style={{ fontSize: '10px' }}>
              📋 VERSION INFO
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="pixel-text text-yellow-400" style={{ fontSize: '8px' }}>Version:</div>
                <div className="pixel-text text-white" style={{ fontSize: '8px' }}>v1.0.0-beta</div>
              </div>
              <div>
                <div className="pixel-text text-yellow-400" style={{ fontSize: '8px' }}>Build:</div>
                <div className="pixel-text text-white" style={{ fontSize: '8px' }}>2024.12.28</div>
              </div>
              <div>
                <div className="pixel-text text-yellow-400" style={{ fontSize: '8px' }}>License:</div>
                <div className="pixel-text text-white" style={{ fontSize: '8px' }}>MIT</div>
              </div>
              <div>
                <div className="pixel-text text-yellow-400" style={{ fontSize: '8px' }}>Platform:</div>
                <div className="pixel-text text-white" style={{ fontSize: '8px' }}>Web3</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center retro-panel p-3">
            <div className="pixel-text text-gray-400" style={{ fontSize: '7px' }}>
              Made with ❤️ for the gaming and DeFi communities
            </div>
            <div className="pixel-text text-gray-400 mt-1" style={{ fontSize: '6px' }}>
              © 2024 Aptoscade. All rights reserved.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
