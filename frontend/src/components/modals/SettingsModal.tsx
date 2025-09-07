'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  RetroButton,
  RetroTypewriter 
} from '@/components/RetroAnimations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrightnessChange: (level: number) => void;
  onContrastChange: (level: number) => void;
  onFontSizeChange: (level: number) => void;
  onReducedMotionToggle: () => void;
}

export const SettingsModal = ({ 
  isOpen, 
  onClose, 
  onBrightnessChange,
  onContrastChange,
  onFontSizeChange,
  onReducedMotionToggle
}: SettingsModalProps) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [fontSize, setFontSize] = useState(100);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    onBrightnessChange(value);
  };

  const handleContrastChange = (value: number) => {
    setContrast(value);
    onContrastChange(value);
  };

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    onFontSizeChange(value);
  };

  const handleReducedMotionToggle = () => {
    setReducedMotion(!reducedMotion);
    onReducedMotionToggle();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="retro-window p-6 w-96 max-h-[500px] overflow-y-auto"
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
            ⚙️ SETTINGS
          </div>
        </div>

        <div className="space-y-4">
          {/* Display Settings */}
          <div className="retro-hologram p-4">
            <div className="pixel-text text-cyan-400 mb-3" style={{ fontSize: '10px' }}>
              🖥️ DISPLAY
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="pixel-text text-white" style={{ fontSize: '8px' }}>Brightness</span>
                  <span className="pixel-text text-gray-400" style={{ fontSize: '8px' }}>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                  className="w-full retro-slider"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="pixel-text text-white" style={{ fontSize: '8px' }}>Contrast</span>
                  <span className="pixel-text text-gray-400" style={{ fontSize: '8px' }}>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => handleContrastChange(Number(e.target.value))}
                  className="w-full retro-slider"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="pixel-text text-white" style={{ fontSize: '8px' }}>Font Size</span>
                  <span className="pixel-text text-gray-400" style={{ fontSize: '8px' }}>{fontSize}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="120"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                  className="w-full retro-slider"
                />
              </div>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="retro-hologram p-4">
            <div className="pixel-text text-cyan-400 mb-3" style={{ fontSize: '10px' }}>
              ♿ ACCESSIBILITY
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="pixel-text text-white" style={{ fontSize: '8px' }}>Reduced Motion</span>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={handleReducedMotionToggle}
                  className="retro-checkbox"
                />
              </label>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="retro-hologram p-4">
            <div className="pixel-text text-cyan-400 mb-3" style={{ fontSize: '10px' }}>
              🔊 AUDIO
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="pixel-text text-white" style={{ fontSize: '8px' }}>Sound Effects</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="retro-checkbox"
                />
              </label>
            </div>
          </div>

          {/* Reset Button */}
          <RetroButton
            onClick={() => {
              handleBrightnessChange(100);
              handleContrastChange(100);
              handleFontSizeChange(100);
              if (reducedMotion) handleReducedMotionToggle();
              setSoundEnabled(true);
            }}
            className="w-full"
          >
            <span className="pixel-text" style={{ fontSize: '8px' }}>
              🔄 RESET TO DEFAULTS
            </span>
          </RetroButton>
        </div>
      </motion.div>
    </div>
  );
};
