'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RetroButton, 
  RetroScanlines, 
  RetroGlitch, 
  RetroTypewriter,
  RetroPixelRain,
  RetroHologram 
} from '@/components/RetroAnimations';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number; // in raffle tickets
  type: 'nft' | 'product' | 'token_swap';
  image: string;
  category: 'featured' | 'nfts' | 'swaps' | 'collectibles';
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  blockchain?: 'ethereum' | 'polygon' | 'solana' | 'usdt' | 'usdc';
}

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: {
    aptTokens: number;
    raffleTickets: number;
  };
}

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  // Featured Products
  {
    id: 'featured-1',
    name: 'Legendary Racing Car NFT',
    description: 'Ultra-rare racing car with +50% speed bonus',
    price: 5000,
    type: 'nft',
    image: '🏎️',
    category: 'featured',
    rarity: 'legendary'
  },
  {
    id: 'featured-2',
    name: 'Championship Trophy',
    description: 'Exclusive tournament winner trophy NFT',
    price: 3000,
    type: 'nft',
    image: '🏆',
    category: 'featured',
    rarity: 'epic'
  },
  
  // NFT Collection
  {
    id: 'nft-1',
    name: 'Retro Arcade Avatar',
    description: 'Pixel-perfect avatar for your profile',
    price: 1000,
    type: 'nft',
    image: '👾',
    category: 'nfts',
    rarity: 'rare'
  },
  {
    id: 'nft-2',
    name: 'Gaming Badge: Speed Demon',
    description: 'Achievement badge for racing champions',
    price: 750,
    type: 'nft',
    image: '⚡',
    category: 'nfts',
    rarity: 'rare'
  },
  {
    id: 'nft-3',
    name: 'Cyber Helmet',
    description: 'Futuristic gaming helmet accessory',
    price: 500,
    type: 'nft',
    image: '🪖',
    category: 'nfts',
    rarity: 'common'
  },
  
  // Token Swaps
  {
    id: 'swap-1',
    name: 'Convert to USDT',
    description: '1000 tickets = $10 USDT',
    price: 1000,
    type: 'token_swap',
    image: '💵',
    category: 'swaps',
    blockchain: 'usdt'
  },
  {
    id: 'swap-2',
    name: 'Convert to USDC',
    description: '1000 tickets = $10 USDC',
    price: 1000,
    type: 'token_swap',
    image: '💰',
    category: 'swaps',
    blockchain: 'usdc'
  },
  {
    id: 'swap-3',
    name: 'Convert to ETH',
    description: '2500 tickets = 0.004 ETH',
    price: 2500,
    type: 'token_swap',
    image: '⚫',
    category: 'swaps',
    blockchain: 'ethereum'
  },
  {
    id: 'swap-4',
    name: 'Convert to SOL',
    description: '800 tickets = 0.25 SOL',
    price: 800,
    type: 'token_swap',
    image: '🌞',
    category: 'swaps',
    blockchain: 'solana'
  },
  {
    id: 'swap-5',
    name: 'Convert to MATIC',
    description: '600 tickets = 15 MATIC',
    price: 600,
    type: 'token_swap',
    image: '🔷',
    category: 'swaps',
    blockchain: 'polygon'
  }
];

export function MarketplaceModal({ isOpen, onClose, userBalance }: MarketplaceModalProps) {
  const [activeCategory, setActiveCategory] = useState<'featured' | 'nfts' | 'swaps' | 'collectibles'>('featured');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [conversionRate] = useState(100); // 1 APT = 100 raffle tickets

  const filteredItems = MARKETPLACE_ITEMS.filter(item => item.category === activeCategory);

  const handleConvertAPTToTickets = () => {
    // This would integrate with the teammate's token conversion system
    console.log('Converting APT to raffle tickets...');
  };

  const handlePurchase = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setShowPurchaseConfirm(true);
  };

  const confirmPurchase = () => {
    if (!selectedItem) return;
    
    if (userBalance.raffleTickets >= selectedItem.price) {
      // Process purchase through teammate's smart contract system
      console.log('Processing purchase:', selectedItem);
      
      if (selectedItem.type === 'token_swap') {
        console.log(`Swapping ${selectedItem.price} tickets for ${selectedItem.blockchain}`);
      } else {
        console.log(`Minting NFT: ${selectedItem.name}`);
      }
      
      setShowPurchaseConfirm(false);
      setSelectedItem(null);
    }
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400 retro-glow-gold';
      case 'epic': return 'text-purple-400 retro-glow-purple';
      case 'rare': return 'text-blue-400 retro-glow-blue';
      default: return 'text-green-400';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <RetroScanlines />
        <RetroPixelRain />
        
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Main Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="relative bg-black/95 border-2 border-cyan-400 retro-glow-cyan w-[95%] max-w-6xl h-[85%] max-h-[800px] overflow-hidden"
          style={{
            boxShadow: '0 0 50px rgba(0, 255, 255, 0.3), inset 0 0 50px rgba(0, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)'
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-cyan-400/30">
            <div>
              <RetroGlitch>
                <h2 className="pixel-text text-cyan-400 text-2xl">
                  🛒 APTOSCADE MARKETPLACE
                </h2>
              </RetroGlitch>
              <div className="pixel-text text-white mt-2" style={{ fontSize: '8px' }}>
                <RetroTypewriter text="Buy NFTs, Products & Convert Tokens" speed={50} />
              </div>
            </div>
            
            {/* Balance Display */}
            <div className="retro-panel p-4 border border-green-400/50">
              <div className="pixel-text text-green-400" style={{ fontSize: '8px' }}>
                💰 YOUR BALANCE
              </div>
              <div className="pixel-text text-white mt-1" style={{ fontSize: '10px' }}>
                🪙 {userBalance.aptTokens} APT
              </div>
              <div className="pixel-text text-yellow-400" style={{ fontSize: '10px' }}>
                🎫 {userBalance.raffleTickets} Tickets
              </div>
              <RetroButton
                onClick={handleConvertAPTToTickets}
                className="mt-2 text-xs px-2 py-1"
              >
                Convert APT → Tickets (1:{conversionRate})
              </RetroButton>
            </div>
            
            <RetroButton onClick={onClose} className="text-red-400 border-red-400">
              ✕
            </RetroButton>
          </div>

          {/* Category Navigation */}
          <div className="flex border-b border-cyan-400/30 p-4 space-x-4">
            {[
              { key: 'featured' as const, label: '⭐ FEATURED', icon: '🌟' },
              { key: 'nfts' as const, label: '🎨 NFT COLLECTION', icon: '🖼️' },
              { key: 'swaps' as const, label: '💱 TOKEN SWAPS', icon: '🔄' },
            ].map(category => (
              <RetroButton
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`px-4 py-2 ${activeCategory === category.key ? 'border-yellow-400 text-yellow-400' : ''}`}
                variant={activeCategory === category.key ? 'accent' : 'default'}
              >
                <span className="pixel-text" style={{ fontSize: '8px' }}>
                  {category.icon} {category.label}
                </span>
              </RetroButton>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="retro-panel border border-cyan-400/50 retro-glow-cyan-soft hover:retro-glow-cyan transition-all duration-300"
                >
                  <div className="p-4">
                    {/* Item Image/Icon */}
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2 retro-hologram">
                        <RetroHologram>{item.image}</RetroHologram>
                      </div>
                      {item.rarity && (
                        <div className={`pixel-text ${getRarityColor(item.rarity)}`} style={{ fontSize: '6px' }}>
                          ✦ {item.rarity.toUpperCase()} ✦
                        </div>
                      )}
                    </div>
                    
                    {/* Item Info */}
                    <div className="mb-4">
                      <h3 className="pixel-text text-white font-bold mb-2" style={{ fontSize: '10px' }}>
                        {item.name}
                      </h3>
                      <p className="pixel-text text-gray-300" style={{ fontSize: '8px', lineHeight: '1.4' }}>
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Price & Purchase */}
                    <div className="flex justify-between items-center">
                      <div className="pixel-text text-yellow-400" style={{ fontSize: '9px' }}>
                        🎫 {item.price} tickets
                      </div>
                      <RetroButton
                        onClick={() => handlePurchase(item)}
                        className="px-3 py-1 text-xs"
                        variant={userBalance.raffleTickets >= item.price ? 'accent' : 'default'}
                      >
                        {userBalance.raffleTickets >= item.price ? '💳 BUY' : '❌ Need More Tickets'}
                      </RetroButton>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Purchase Confirmation Modal */}
        {showPurchaseConfirm && selectedItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-60"
          >
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowPurchaseConfirm(false)} />
            
            <div className="relative retro-panel border-2 border-yellow-400 retro-glow-gold p-6 max-w-md">
              <h3 className="pixel-text text-yellow-400 text-center mb-4" style={{ fontSize: '12px' }}>
                🛒 CONFIRM PURCHASE
              </h3>
              
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">{selectedItem.image}</div>
                <div className="pixel-text text-white" style={{ fontSize: '10px' }}>
                  {selectedItem.name}
                </div>
                <div className="pixel-text text-yellow-400 mt-2" style={{ fontSize: '9px' }}>
                  Price: 🎫 {selectedItem.price} tickets
                </div>
              </div>
              
              <div className="flex space-x-4">
                <RetroButton
                  onClick={confirmPurchase}
                  className="flex-1"
                  variant="accent"
                >
                  ✅ CONFIRM
                </RetroButton>
                <RetroButton
                  onClick={() => setShowPurchaseConfirm(false)}
                  className="flex-1"
                >
                  ❌ CANCEL
                </RetroButton>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}

export default MarketplaceModal;
