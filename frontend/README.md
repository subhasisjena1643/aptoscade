# 🕹️ Aptoscade - Retro Web3 Gaming Arcade

> *Where nostalgic gaming meets cutting-edge blockchain technology*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Aptos](https://img.shields.io/badge/Aptos-Blockchain-green)](https://aptoslabs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Overview

Aptoscade is a revolutionary retro-style arcade platform that combines the nostalgia of 90s gaming with modern Web3 technology. Players can enjoy classic-style games, earn cryptocurrency rewards, and interact with an AI companion named Piper, all while experiencing authentic retro aesthetics.

### ✨ Key Features

- **🎮 Multiplayer Racing Game**: Real-time 4-player racing with WebSocket technology
- **🤖 AI Companion (Piper)**: OpenAI-powered gaming buddy with proactive messaging
- **💰 Web3 Integration**: Earn APT tokens and NFT rewards through gameplay
- **🛒 Marketplace**: Buy NFTs and swap tokens across multiple blockchains
- **📱 Mobile Responsive**: Perfect gaming experience on all devices
- **🎨 Authentic Retro Design**: 90s arcade aesthetic with modern UX

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/subhasisjena1643/Solarcade.git
cd Solarcade

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application in action!

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## 🎮 Game Features

### 🏎️ TAP_RACER.EXE
- **Real Multiplayer**: 4-player real-time racing
- **Reward System**: Earn 10 APT (1st), 5 APT (2nd), 2 APT (3rd)
- **Touch Controls**: Optimized for mobile and desktop
- **WebSocket Technology**: Smooth, lag-free multiplayer experience

### 🎵 Rhythm Games (Coming Soon)
- Music-based gameplay mechanics
- Synchronized beat matching
- Cross-game tournament compatibility

## 🤖 AI Companion - Piper

Piper is your intelligent arcade companion powered by OpenAI technology:

- **Natural Conversations**: Chat about anything with advanced AI
- **Gaming Tips**: Personalized advice and coaching
- **Proactive Messaging**: Helpful suggestions and encouragement
- **Website Control**: Adjust settings and optimize your experience
- **Quirky Personality**: Friendly, helpful, and entertaining

## 💰 Web3 Integration

### Supported Blockchains
- **Aptos** (Primary gaming rewards)
- **Ethereum** (Cross-chain swaps)
- **Solana** (Token conversions)
- **Polygon** (Fast transactions)

### Reward System
- **APT Tokens**: Earned through gameplay
- **NFT Achievements**: Unlock unique collectibles
- **Cross-chain Swaps**: Convert to USDT, USDC, ETH, SOL, MATIC
- **Sponsored Transactions**: Gasless gaming experience

### Smart Contract
```
Aptos Contract: 0x762779f87715b377314b79420b866ca7edef615a86d0d998f733e3f5c7113f89
```

## 🛠️ Technical Architecture

### Frontend Stack
- **Next.js 15.5.2**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety
- **Framer Motion**: Smooth animations
- **Tailwind CSS**: Utility-first styling

### Backend Integration
- **WebSocket**: Real-time multiplayer communication
- **OpenAI API**: AI companion powered conversations
- **Aptos SDK**: Blockchain interaction
- **Performance API**: Accurate system monitoring

### Key Components
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── page.tsx           # Homepage
│   ├── race/              # Racing game
│   └── api/               # API routes
├── components/
│   ├── modals/           # Modal components
│   ├── game/             # Game components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions
```

## 🎨 Design System

### Retro Aesthetic
- **Color Palette**: Neon greens, electric blues, retro oranges
- **Typography**: Pixel-perfect fonts (6px, 8px, 10px, 12px)
- **Animations**: CRT scanlines, matrix effects, holographic displays
- **Components**: Retro windows, buttons, and panels

### UI Components
- `RetroButton`: Authentic arcade-style buttons
- `RetroWindow`: Classic OS-style windows
- `RetroAnimations`: CRT effects, matrix rain, scanlines
- `RetroStatusBar`: System monitoring displays

## 🔧 Development

### Project Structure
```
aptoscade/
├── src/                   # Source code
├── public/               # Static assets
├── docs/                 # Documentation
├── tasks/                # Development tasks
├── server/               # Backend services
└── mcp-server/          # Legacy MCP components
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

### Code Quality
- **ESLint**: Code linting and formatting
- **TypeScript**: Full type checking
- **Production Ready**: Optimized builds
- **Mobile First**: Responsive design principles

## 🌐 API Integration

### OpenAI API
```typescript
// AI Chat endpoint
POST /api/ai-chat
{
  "message": "Hello Piper!",
  "context": "gaming"
}
```

### Performance Monitoring
```typescript
// Real CPU monitoring
const cpuUsage = measurePerformance();
const memoryUsage = getMemoryStats();
```

## 📱 Mobile Experience

- **Touch Controls**: Optimized tap-to-race mechanics
- **Responsive Design**: Perfect on phones and tablets
- **Performance**: 60fps gaming on mobile devices
- **PWA Ready**: Can be installed as a mobile app

## 🔐 Security Features

- **Keyless Authentication**: Google Sign-In integration
- **Sponsored Transactions**: Gasless user experience
- **Secure Wallet Integration**: Multiple wallet support
- **Production Ready**: Security best practices

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow existing code style
- Write TypeScript with proper typing
- Test on multiple devices
- Maintain retro aesthetic consistency

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Retro Gaming Community**: For inspiration and feedback
- **Aptos Ecosystem**: For blockchain infrastructure
- **Open Source Libraries**: For making development possible
- **Beta Testers**: For valuable feedback and bug reports

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/subhasisjena1643/Solarcade/issues)
- **Documentation**: [Full project docs](./docs/)
- **Discord**: [Join our gaming community](https://discord.gg/aptoscade)

---

## 🎯 Roadmap

### Current Version (v1.0)
- ✅ Multiplayer racing game
- ✅ AI companion (Piper)
- ✅ Web3 rewards system
- ✅ Marketplace functionality

### Coming Soon (v1.1)
- 🔄 Rhythm-based games
- 🔄 Tournament system
- 🔄 Enhanced social features
- 🔄 Mobile app (PWA)

### Future (v2.0)
- 🔮 VR gaming integration
- 🔮 More blockchain networks
- 🔮 Advanced AI features
- 🔮 Community-generated content

---

**Made with ❤️ for the gaming and Web3 communities**

*Experience the future of retro gaming at [Aptoscade](https://aptoscade.vercel.app)*
