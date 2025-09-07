# AptosCade - Web3 Crowdfunding Platform Backend

## 🎮 Overview

AptosCade has been successfully integrated with a comprehensive Web3 crowdfunding platform built on Aptos blockchain. This backend now supports both gaming features and advanced DeFi capabilities including project crowdfunding, NFT rewards, token staking, and decentralized governance.

## 🚀 Features

### Core Gaming Platform
- User authentication and management
- Game scores and leaderboards
- Achievement system
- Transaction tracking

### 🌐 Web3 Crowdfunding Platform
- **Project Creation & Management**: Create crowdfunding projects with blockchain integration
- **Contribution System**: Support projects with APT tokens and sponsored transactions
- **NFT Reward System**: Automatic NFT minting based on contribution tiers (Bronze, Silver, Gold, Diamond)
- **Staking System**: Stake tokens with different lock periods for rewards
- **Decentralized Governance**: Community voting on project milestones and funding releases
- **Oracle Integration**: Real-time APT to USD conversion
- **Keyless Authentication**: Google OAuth integration with Aptos keyless accounts

## 📊 Database Schema

### Enhanced Models
- **User**: Extended with Web3 fields (aptosAddress, keylessAddress, staking stats)
- **Project**: Crowdfunding projects with blockchain IDs and Web3 features
- **Contribution**: Project contributions with NFT rewards and staking options
- **NFTReward**: Automated NFT rewards for contributors
- **StakingRecord**: Token staking with different tiers and lock periods
- **Milestone**: Governance proposals for project milestones
- **GovernanceVote**: Community votes on proposals

## 🛠 Tech Stack

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon hosting)
- **ORM**: Prisma
- **Authentication**: JWT + Google OAuth
- **Blockchain**: Aptos SDK
- **Documentation**: Swagger/OpenAPI

### Web3 Integration
- **Smart Contract**: 0x762779f87715b377314b79420b866ca7edef615a86d0d998f733e3f5c7113f89
- **Network**: Aptos Mainnet/Testnet
- **Features**: Project creation, contributions, NFT minting, staking, governance

## 🔗 API Endpoints

### Gaming Platform
- `GET /api/v1/games` - Game management
- `GET /api/v1/leaderboard` - Leaderboards
- `POST /api/v1/auth/login` - Authentication

### Web3 Crowdfunding
- `GET /api/v1/projects` - Browse projects
- `POST /api/v1/projects` - Create project
- `POST /api/v1/projects/:id/contribute` - Contribute to project
- `GET /api/v1/web3/nfts/my-rewards` - View NFT rewards
- `GET /api/v1/web3/staking/my-stakes` - View staking positions
- `POST /api/v1/web3/staking/stake` - Create stake position
- `GET /api/v1/governance/proposals` - View governance proposals
- `POST /api/v1/governance/proposals/:id/vote` - Vote on proposals

### Health & Status
- `GET /api/v1/health/web3` - Web3 service status
- `GET /api/v1/health/database` - Database connection status
- `GET /api-docs` - API documentation

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Aptos Blockchain
APTOS_NETWORK="mainnet"
APTOS_CONTRACT_ADDRESS="0x762779f87715b377314b79420b866ca7edef615a86d0d998f733e3f5c7113f89"
APTOS_PRIVATE_KEY="0x..."

# Authentication
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Features
WEB3_ENABLED="true"
NFT_REWARDS_ENABLED="true"
STAKING_ENABLED="true"
GOVERNANCE_ENABLED="true"

# Oracle
PRICE_ORACLE_URL="https://api.coingecko.com/api/v3"
```

## 🏗 Architecture

```
src/
├── controllers/          # API route handlers
│   ├── projectController.ts     # Crowdfunding projects
│   ├── web3Controller.ts        # NFT & staking
│   └── governanceController.ts  # DAO governance
├── services/
│   └── web3Service.ts          # Blockchain integration
├── routes/              # API route definitions
├── middleware/          # Auth, validation, error handling
├── config/             # Database & environment config
└── types/              # TypeScript type definitions
```

## 🚀 Getting Started

1. **Clone and install**:
   ```bash
   git clone <repository>
   cd aptoscade-backend
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup database**:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 📈 Web3 Integration Status

### ✅ Completed Features
- [x] Database schema with Web3 models
- [x] Project creation and management
- [x] Contribution processing
- [x] NFT reward system architecture
- [x] Staking system implementation
- [x] Governance voting system
- [x] API endpoints for all Web3 features
- [x] Swagger documentation
- [x] Health check endpoints

### 🔄 Integration Points
- **Smart Contract**: Ready for deployment and integration
- **Aptos SDK**: Configured and ready for blockchain calls
- **NFT Minting**: Automated tier-based reward system
- **Oracle Integration**: Price feed for APT/USD conversion
- **Governance**: Community-driven milestone voting

### 🎯 Next Steps
1. Deploy smart contracts to Aptos network
2. Test blockchain integration end-to-end
3. Implement frontend integration
4. Add real-time notifications
5. Optimize gas costs and sponsored transactions

## 📚 Documentation

- **API Docs**: Available at `/api-docs` when running
- **Database Schema**: See `prisma/schema.prisma`
- **Web3 Integration**: See `src/services/web3Service.ts`
- **Smart Contract**: Integration ready for deployment

## 🤝 Contributing

This is a hackathon project showcasing the integration of traditional gaming with Web3 crowdfunding features on Aptos blockchain. The architecture is designed to be modular and extensible for future DeFi features.

---

**Built for Aptos Hackathon** 🏆
*Combining Gaming + DeFi + Community Governance*
