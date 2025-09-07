'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAptosWallet, type SupportedWallet } from '@/hooks/useAptosWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RetroScanlines,
  RetroPixelRain,
  RetroParticleSystem,
  RetroFloatingElements,
  RetroGridLines,
  RetroDataStream,
  RetroTypewriter,
  RetroButton,
  RetroGlitch
} from '@/components/RetroAnimations';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORTED_WALLETS = [
  {
    name: 'Petra',
    type: 'petra' as SupportedWallet,
    icon: '🪙',
    description: 'Official Aptos wallet by Petra',
    downloadUrl: 'https://petra.app/',
    windowKey: 'aptos'
  },
  {
    name: 'Martian',
    type: 'martian' as SupportedWallet,
    icon: '🚀',
    description: 'Multi-chain wallet with Aptos support',
    downloadUrl: 'https://martianwallet.xyz/',
    windowKey: 'martian'
  },
  {
    name: 'Pontem',
    type: 'pontem' as SupportedWallet,
    icon: '🔗',
    description: 'Aptos native wallet by Pontem',
    downloadUrl: 'https://chromewebstore.google.com/detail/phkbamefinggmakgklpkljjmgibohnba?utm_source=item-share-cb',
    windowKey: 'pontem'
  }
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { 
    connectionState,
    account, 
    balance, 
    connect, 
    disconnect,
    isConnected,
    isLoading,
    error
  } = useAptosWallet();
  
  const [selectedWallet, setSelectedWallet] = useState<SupportedWallet | ''>('');
  const [showBalance, setShowBalance] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<typeof SUPPORTED_WALLETS>([]);

  // Check available wallets with better detection
  const getAvailableWallets = useCallback(() => {
    if (typeof window === 'undefined') return [];
    
    return SUPPORTED_WALLETS.filter(wallet => {
      const walletAPI = (window as unknown as Record<string, unknown>)[wallet.windowKey];
      return walletAPI !== undefined && walletAPI !== null;
    });
  }, []);

  // Update available wallets on mount and when window changes
  useEffect(() => {
    const updateAvailableWallets = () => {
      const available = getAvailableWallets();
      setAvailableWallets(available);
    };

    // Initial check
    updateAvailableWallets();

    // Check again after a short delay to allow wallet extensions to load
    const timer = setTimeout(updateAvailableWallets, 1000);

    // Listen for wallet injection events
    const handleWalletInjection = () => updateAvailableWallets();
    window.addEventListener('load', handleWalletInjection);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleWalletInjection);
    };
  }, [getAvailableWallets]);

  useEffect(() => {
    if (isConnected && account) {
      setShowBalance(true);
      // Don't auto-close modal to prevent wallet window glitches
      // Let user manually close after seeing the success state
    }
  }, [isConnected, account]);

  const handleConnect = async (walletType: SupportedWallet) => {
    setSelectedWallet(walletType);
    try {
      await connect(walletType);
      // Connection successful - modal will remain open to show success state
    } catch (error: unknown) {
      const errorMessage = (error as Error)?.message || String(error) || 'Unknown error';
      
      // Don't log sensitive error details in production
      console.error('Wallet connection failed:', errorMessage);
      
      // Check if it's a wallet not installed error
      if (errorMessage.includes('not installed')) {
        // The wallet modal will show the "INSTALL" button and download link
        // Don't close modal - keep it open for user to install
        setSelectedWallet('');
        return;
      }
      
      // For user-rejected connections, just reset the state but keep modal open
      if (errorMessage.includes('rejected') || errorMessage.includes('User rejected')) {
        setSelectedWallet('');
        return;
      }
      
      // For timeout or other connection errors, reset state but keep modal open
      if (errorMessage.includes('timeout') || errorMessage.includes('Connection timeout')) {
        setSelectedWallet('');
        return;
      }
      
      // For other errors, reset state and keep modal open to show error
      setSelectedWallet('');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowBalance(false);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: { apt: number; formattedAPT: string }) => {
    return balance.formattedAPT;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background Effects - same as homepage */}
      <RetroScanlines />
      <RetroPixelRain count={20} />
      <RetroParticleSystem count={15} />
      <RetroFloatingElements count={10} />
      <RetroGridLines />
      <RetroDataStream lines={3} />
      
      <div className="absolute inset-0 bg-black bg-opacity-80" onClick={onClose} />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 500 }}
        className="retro-window w-full max-w-lg mx-4 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar - Matching Homepage Style Exactly */}
        <div className="retro-window-header">
          <div className="flex items-center gap-2">
            <span className="pixel-text" style={{ fontSize: '6px' }}>💰</span>
            <span className="pixel-text tracking-wider" style={{ fontSize: '8px' }}>APTOS_WALLET.EXE</span>
          </div>
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
        </div>

        {/* Content Area - Matching Homepage Terminal Style */}
        <div className="retro-window-content p-6">
          {!isConnected ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="text-center space-y-4">
                <div className="retro-panel bg-black text-green-400 font-mono text-xs p-4 retro-hologram">
                  <RetroGlitch>
                    <h2 className="pixel-text text-retro-accent mb-2 tracking-wider" style={{ fontSize: '10px' }}>
                      CONNECT WALLET
                    </h2>
                  </RetroGlitch>
                  <div className="pixel-text text-cyan-400" style={{ fontSize: '8px' }}>
                    <RetroTypewriter 
                      text="&gt; Choose your Aptos wallet to join the racing championship"
                      speed={50}
                      className=""
                    />
                  </div>
                </div>

                {/* Error Display */}
                {connectionState === 'error' && error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="retro-panel p-3 bg-red-900/20 border border-red-500"
                  >
                    <div className="pixel-text text-red-400 text-center" style={{ fontSize: '8px' }}>
                      ⚠️ CONNECTION FAILED
                    </div>
                    <div className="pixel-text text-red-300 text-center mt-1" style={{ fontSize: '7px' }}>
                      {error}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Wallet Selection */}
              <div className="space-y-3">
                {SUPPORTED_WALLETS.map((wallet, index) => {
                  const isAvailable = availableWallets.some((w: typeof wallet) => w.type === wallet.type);
                  const isConnecting = connectionState === 'connecting' && selectedWallet === wallet.type;
                  
                  return (
                    <motion.div
                      key={wallet.name}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <RetroButton
                        onClick={() => isAvailable ? handleConnect(wallet.type) : window.open(wallet.downloadUrl, '_blank')}
                        variant={!isAvailable ? "secondary" : "default"}
                        className={`w-full p-4 relative overflow-hidden ${
                          isConnecting ? 'retro-pulse' : ''
                        }`}
                      >
                        {isConnecting && (
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-retro-accent/30 to-transparent"
                            style={{ animation: 'scan 2s infinite linear' }}
                          />
                        )}
                        
                        <div className="flex items-center gap-4 relative z-10">
                          <span className="text-3xl">{wallet.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="pixel-text font-bold tracking-wide text-retro-text" style={{ fontSize: '10px' }}>
                              {isConnecting ? 'CONNECTING...' : wallet.name.toUpperCase()}
                            </div>
                            <div className="pixel-text opacity-70 font-mono text-retro-text-dim" style={{ fontSize: '8px' }}>
                              &gt; {wallet.description}
                            </div>
                          </div>
                          {!isAvailable ? (
                            <div className="retro-button px-3 py-1 pixel-text font-bold bg-retro-warning text-black" style={{ fontSize: '8px' }}>
                              INSTALL
                            </div>
                          ) : (
                            <div className="retro-button px-3 py-1 pixel-text font-bold bg-retro-success text-black" style={{ fontSize: '8px' }}>
                              CONNECT
                            </div>
                          )}
                        </div>
                      </RetroButton>

                      {!isAvailable && (
                        <motion.div
                          className="block pixel-text text-retro-secondary ml-4 font-mono opacity-70"
                          style={{ fontSize: '8px' }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          &gt; Click above to install from Chrome Web Store
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer Info with Setup Guidance */}
              <div className="retro-panel p-4 text-center text-xs font-mono text-retro-success">
                <div className="space-y-2">
                  <div>🔒 SECURE CONNECTION TO APTOS TESTNET</div>
                  <div className="opacity-80 text-retro-text-dim">&gt; Your wallet stays under your control</div>
                  
                  {/* Setup Instructions */}
                  <div className="text-yellow-400 opacity-90 mt-3 space-y-1" style={{ fontSize: '7px' }}>
                    <div>⚠️ WALLET SETUP REQUIRED:</div>
                    <div>&gt; Unlock your wallet extension first</div>
                    <div>&gt; Create/import wallet if not done yet</div>
                    <div>&gt; Grant connection permission when prompted</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Connected Header */}
                <div className="text-center space-y-4">
                  <div className="retro-panel p-4">
                    <h2 className="pixel-text font-bold text-retro-success mb-2 font-mono tracking-wider" style={{ fontSize: '12px' }}>
                      🎉 WALLET CONNECTED
                    </h2>
                    <p className="pixel-text text-retro-text-dim font-mono" style={{ fontSize: '8px' }}>
                      &gt; Ready for championship racing
                    </p>
                  </div>
                  
                  {/* Connection Details */}
                  <div className="retro-panel p-4">
                    <div className="space-y-2 pixel-text font-mono" style={{ fontSize: '8px' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-retro-secondary">ADDRESS:</span> 
                        <span className="font-bold text-retro-success">
                          {account ? formatAddress(account.address) : '...'}
                        </span>
                      </div>
                      {showBalance && balance && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-between items-center"
                        >
                          <span className="text-retro-secondary">BALANCE:</span> 
                          <span className="font-bold text-retro-warning">
                            {formatBalance(balance)} APT
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Racing Status */}
                <div className="retro-panel p-4 text-center font-mono bg-retro-warning/20">
                  <div className="space-y-2">
                    <div className="pixel-text font-bold text-retro-warning" style={{ fontSize: '10px' }}>🏆 READY TO RACE!</div>
                    <div className="pixel-text text-retro-text-dim" style={{ fontSize: '8px' }}>
                      &gt; Win races to earn APT tokens and exclusive NFTs
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <RetroButton
                    onClick={() => {
                      console.log('START RACING button clicked - navigating to race page');
                      onClose();
                      // Navigate to the racing game
                      window.location.href = '/race';
                    }}
                    className="flex-1 py-3 px-4"
                  >
                    <span className="pixel-text font-mono font-bold tracking-wide" style={{ fontSize: '10px' }}>
                      🎮 START RACING
                    </span>
                  </RetroButton>
                  <RetroButton
                    onClick={handleDisconnect}
                    variant="secondary"
                    className="px-4 py-3"
                  >
                    <span className="pixel-text font-mono text-retro-danger" style={{ fontSize: '10px' }}>
                      DISCONNECT
                    </span>
                  </RetroButton>
                </div>

                {/* Additional Info */}
                <div className="retro-panel p-3 text-center pixel-text font-mono text-retro-secondary" style={{ fontSize: '8px' }}>
                  <div className="space-y-1">
                    <div>⚡ Connected to teammates&apos; Web3 infrastructure</div>
                    <div className="opacity-80 text-retro-text-dim">&gt; Earn rewards through racing championships</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
