# Aptos Web3 Hackathon Project 🚀

A comprehensive Web3 project built on the Aptos blockchain for hackathon participation. This project includes Move smart contracts, TypeScript SDK, wallet integration, and seamless backend/frontend connectivity.

## 🏗️ Project Structure

```
web3/
├── contracts/                 # Move smart contracts
│   ├── Move.toml             # Move package configuration
│   └── sources/
│       └── main_contract.move # Main crowdfunding contract
├── src/                      # TypeScript SDK source code
│   ├── index.ts             # Main SDK export
│   ├── sdk.ts               # Core Aptos SDK wrapper
│   ├── api.ts               # Backend API integration
│   ├── config.ts            # Configuration management
│   ├── events.ts            # Event listening system
│   └── wallet.ts            # Wallet connection management
├── scripts/                 # Deployment and utility scripts
│   ├── deploy-testnet.js    # Testnet deployment script
│   └── deploy-mainnet.js    # Mainnet deployment script
├── tests/                   # Test files
│   ├── setup.ts             # Test configuration
│   └── sdk.test.ts          # SDK unit tests
└── docs/                    # Documentation
```

## 🎯 Features

### Smart Contract Features

- **Project Creation**: Create crowdfunding projects with targets and deadlines
- **Contributions**: Secure APT token contributions with automatic tracking
- **Fund Withdrawal**: Secure withdrawal system for project creators
- **User Profiles**: Track user contribution history and reputation
- **Admin Controls**: Contract pausing, fee management
- **Event Emission**: Real-time event broadcasting

### TypeScript SDK Features

- **Type-Safe Integration**: Full TypeScript support with comprehensive types
- **Wallet Management**: Support for Petra, Martian, and other Aptos wallets
- **Event Listening**: Real-time blockchain event monitoring
- **API Integration**: Seamless backend/frontend connectivity
- **Error Handling**: Robust error handling and validation
- **Testing Suite**: Comprehensive test coverage

## 🛠️ Tech Stack

### Blockchain

- **Aptos Blockchain**: Layer 1 blockchain platform
- **Move Language**: Smart contract programming language
- **Aptos CLI**: Development and deployment tools

### Web3 Integration

- **@aptos-labs/ts-sdk**: Official Aptos TypeScript SDK
- **TypeScript**: Type-safe development
- **Jest**: Testing framework

### Development Tools

- **Node.js**: Runtime environment
- **npm**: Package management
- **ESLint**: Code linting
- **Prettier**: Code formatting

## 🚀 Quick Start

### Prerequisites

```bash
# Install Node.js (v18 or later)
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Verify installation
aptos --version
node --version
npm --version
```

### Installation

```bash
# Clone and setup
cd web3
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
# APTOS_NETWORK=testnet
# CONTRACT_ADDRESS=0x... (will be set after deployment)
```

### Development Setup

```bash
# Install dependencies
npm install

# Compile Move contracts
npm run compile-contracts

# Run tests
npm test

# Build TypeScript SDK
npm run build
```

### Deploy to Testnet

```bash
# Deploy smart contracts
npm run deploy:testnet

# This will:
# 1. Compile Move contracts
# 2. Run tests
# 3. Deploy to testnet
# 4. Update .env with contract address
```

## 📋 Usage Examples

### Initialize SDK

```typescript
import { AptosHackathonSDK, configManager } from "./src";

const config = configManager.getAptosConfig();
const sdk = new AptosHackathonSDK(
  config.network as any,
  config.contractAddress
);
```

### Create a Project

```typescript
import { Account } from "@aptos-labs/ts-sdk";

const creator = Account.generate();
const txHash = await sdk.createProject(
  creator,
  "My Awesome Project",
  "A revolutionary DeFi platform",
  1000000, // 0.01 APT target
  86400 // 24 hours duration
);

await sdk.waitForTransaction(txHash);
```

### Contribute to Project

```typescript
const contributor = Account.generate();
const txHash = await sdk.contributeToProject(
  contributor,
  1, // project ID
  100000 // 0.001 APT contribution
);
```

### Connect Wallet (Frontend)

```typescript
import { WalletManager } from "./src/wallet";

const walletManager = new WalletManager();
const availableWallets = walletManager.getAvailableWallets();

// Connect to Petra wallet
const connection = await walletManager.connectWallet("petra");
console.log("Connected:", connection.account?.address);
```

### Listen for Events

```typescript
import { EventListener, EVENT_TYPES } from "./src/events";

const eventListener = new EventListener();

eventListener.onProjectCreated((event) => {
  console.log("New project created:", event.data);
});

eventListener.startListening();
```

## 🔗 Backend Integration

### API Endpoints for Backend Team

```typescript
import { APIService } from "./src/api";

const api = new APIService("http://localhost:3000");

// Get all projects
const projects = await api.getAllProjects();

// Create project record in backend
await api.createProject({
  title: "New Project",
  description: "Description",
  targetAmount: 1000000,
  duration: 86400,
  creatorAddress: "0x...",
});

// Submit transaction record
await api.submitTransaction({
  hash: "0x...",
  type: "contribution",
  userAddress: "0x...",
  projectId: 1,
  amount: 100000,
});
```

### Recommended Backend Endpoints

```
POST   /api/projects          # Create project
GET    /api/projects          # List all projects
GET    /api/projects/:id      # Get project details
PUT    /api/projects/:id      # Update project

GET    /api/users/:address    # Get user profile
PUT    /api/users/:address    # Update user profile

POST   /api/transactions      # Submit transaction
GET    /api/transactions/:address # Get transaction history

GET    /api/stats             # Platform statistics
GET    /health                # Health check
```

## 🎨 Frontend Integration

### React Example

```typescript
import { useEffect, useState } from 'react';
import { AptosHackathonSDK, WalletManager } from 'aptos-hackathon-sdk';

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [wallet, setWallet] = useState(null);

  const sdk = new AptosHackathonSDK('testnet', process.env.REACT_APP_CONTRACT_ADDRESS);
  const walletManager = new WalletManager();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const count = await sdk.getProjectCount();
    const projectList = [];

    for (let i = 1; i <= count; i++) {
      const project = await sdk.getProjectInfo(i);
      projectList.push(project);
    }

    setProjects(projectList);
  };

  const connectWallet = async () => {
    try {
      const connection = await walletManager.connectWallet('petra');
      setWallet(connection);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div>
      <button onClick={connectWallet}>
        {wallet ? `Connected: ${wallet.account?.address}` : 'Connect Wallet'}
      </button>

      <div>
        {projects.map(project => (
          <div key={project.id}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <progress value={project.currentAmount} max={project.targetAmount} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test sdk.test.ts

# Run contract tests
npm run test-contracts
```

## 📦 Production Deployment

### Deploy to Mainnet

```bash
# ⚠️ WARNING: This uses real APT tokens
npm run deploy:mainnet

# Follow the confirmation prompts
# Update your .env to use mainnet settings
```

### Environment Configuration

```bash
# Production .env
APTOS_NETWORK=mainnet
APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
CONTRACT_ADDRESS=0x... # Your deployed contract address
NODE_ENV=production
```

## 🔒 Security Considerations

- **Private Keys**: Never commit private keys to version control
- **Environment Variables**: Use secure environment management
- **Contract Testing**: Thoroughly test contracts before mainnet deployment
- **Wallet Security**: Validate all wallet interactions
- **Input Validation**: Sanitize all user inputs
- **Error Handling**: Implement comprehensive error handling

## 🤝 Team Integration

### For Backend Developers

1. Use the API service in `src/api.ts` for standard REST endpoints
2. Implement the recommended endpoints listed above
3. Use event listeners to sync blockchain events with your database
4. Handle transaction status updates asynchronously

### For Frontend Developers

1. Use the SDK for all blockchain interactions
2. Implement wallet connection using `WalletManager`
3. Use event listeners for real-time updates
4. Handle loading states and error conditions

### For DevOps

1. Set up environment variables securely
2. Configure CI/CD pipelines with proper testing
3. Monitor contract events and transaction status
4. Implement proper logging and monitoring

## 📚 Additional Resources

- [Aptos Documentation](https://aptos.dev/)
- [Move Programming Language](https://move-language.github.io/)
- [Aptos TypeScript SDK](https://github.com/aptos-labs/aptos-ts-sdk)
- [Aptos Explorer](https://explorer.aptoslabs.com/)

## 🐛 Troubleshooting

### Common Issues

1. **Contract Address Not Set**: Make sure to deploy contracts and update .env
2. **Wallet Connection Failed**: Check if wallet extension is installed
3. **Transaction Failed**: Verify account has sufficient APT balance
4. **Build Errors**: Ensure all dependencies are installed correctly

### Getting Help

- Check the test files for usage examples
- Review the configuration in `src/config.ts`
- Ensure your .env file matches .env.example

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for Aptos Hackathon 🏆
