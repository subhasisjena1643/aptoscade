# Next Steps for Hackathon Integration 🚀

## ✅ What's Been Built

Your Web3 component is now **fully complete** and ready for integration! Here's what you have:

### 🏗️ Smart Contract (Move)

- **Crowdfunding platform** with project creation, contributions, and withdrawals
- **User profiles** with reputation tracking
- **Admin controls** for fee management and pausing
- **Event emission** for real-time updates
- Located in: `contracts/sources/main_contract.move`

### 🔧 TypeScript SDK

- **Type-safe interfaces** for all contract functions
- **Wallet integration** (Petra, Martian wallets)
- **Event listening** for real-time blockchain events
- **API service** for backend connectivity
- **Configuration management** for different environments
- Located in: `src/` directory

### 📦 Complete Project Structure

```
web3/
├── contracts/               # Move smart contracts ✅
├── src/                    # TypeScript SDK ✅
├── scripts/                # Deployment scripts ✅
├── tests/                  # Test files ✅
├── package.json            # Dependencies ✅
├── README.md               # Documentation ✅
└── .env.example            # Configuration template ✅
```

## 🚀 Quick Deployment Guide

### 1. Install Aptos CLI

```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
aptos --version
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Deploy to Testnet

```bash
npm run deploy:testnet
```

This will:

- ✅ Compile contracts
- ✅ Run tests
- ✅ Deploy to testnet
- ✅ Update .env with contract address
- ✅ Fund account from faucet

## 🤝 Integration with Backend Team

### API Endpoints Your Backend Should Implement:

```typescript
// Projects
POST   /api/projects          # Create project record
GET    /api/projects          # List all projects
GET    /api/projects/:id      # Get project details
PUT    /api/projects/:id      # Update project status

// Users
GET    /api/users/:address    # Get user profile
PUT    /api/users/:address    # Update user profile

// Transactions
POST   /api/transactions      # Record blockchain transaction
GET    /api/transactions/:address # Get transaction history

// Stats
GET    /api/stats             # Platform statistics
GET    /health                # Health check
```

### Backend Integration Example:

```typescript
import { APIService } from "./src/api";

const api = new APIService("http://your-backend-url");

// When user creates a project on blockchain:
await api.createProject({
  title: "New Project",
  description: "Description",
  targetAmount: 1000000,
  duration: 86400,
  creatorAddress: "0x...",
});

// When transaction is submitted:
await api.submitTransaction({
  hash: "0x...",
  type: "contribution",
  userAddress: "0x...",
  projectId: 1,
  amount: 100000,
});
```

## 🎨 Integration with Frontend Team

### Frontend Integration Example:

```typescript
import {
  AptosHackathonSDK,
  WalletManager,
  EventListener,
} from "aptos-web3-hackathon";

// Initialize SDK
const sdk = new AptosHackathonSDK(
  "testnet",
  process.env.REACT_APP_CONTRACT_ADDRESS
);

// Connect wallet
const walletManager = new WalletManager();
const connection = await walletManager.connectWallet("petra");

// Listen for events
const eventListener = new EventListener();
eventListener.onProjectCreated((event) => {
  console.log("New project:", event.data);
  // Update your UI here
});
```

### React Component Example:

```jsx
import { useEffect, useState } from "react";
import { AptosHackathonSDK } from "aptos-web3-hackathon";

function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const sdk = new AptosHackathonSDK("testnet", CONTRACT_ADDRESS);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const count = await sdk.getProjectCount();
      const projectList = [];

      for (let i = 1; i <= count; i++) {
        const project = await sdk.getProjectInfo(i);
        projectList.push(project);
      }

      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <div>Loading projects...</div>
      ) : (
        projects.map((project) => (
          <div key={project.id}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <div>
              Progress: {project.currentAmount} / {project.targetAmount} APT
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

## 🔄 Real-time Updates

### Event Listening for Live Updates:

```typescript
import { EventListener, EVENT_TYPES } from "./src/events";

const eventListener = new EventListener();

// Listen for all project events
eventListener.onProjectCreated((event) => {
  // Update UI with new project
  updateProjectList();
});

eventListener.onContributionMade((event) => {
  // Update project progress
  updateProjectProgress(event.projectId, event.data.newTotal);
});

eventListener.startListening();
```

## 🌍 Environment Configuration

### Development (.env):

```bash
APTOS_NETWORK=testnet
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
CONTRACT_ADDRESS=0x... # Set after deployment
API_PORT=3001
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3002
```

### Production (.env):

```bash
APTOS_NETWORK=mainnet
APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
CONTRACT_ADDRESS=0x... # Set after mainnet deployment
NODE_ENV=production
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Test contracts
npm run test-contracts

# Run specific tests
npm test sdk.test.ts
```

## 📱 Mobile/Web Wallet Integration

The SDK supports popular Aptos wallets:

- **Petra Wallet** (Browser extension)
- **Martian Wallet** (Browser extension)
- **Pontem Wallet** (Mobile & Browser)

```typescript
// Check available wallets
const availableWallets = walletManager.getAvailableWallets();

// Connect to user's preferred wallet
const connection = await walletManager.connectWallet("petra");

// Sign transactions
const txHash = await sdk.createProject(
  connection.account,
  "My Project",
  "Description",
  1000000,
  86400
);
```

## 🔒 Security Checklist

- ✅ Never commit private keys to git
- ✅ Use environment variables for sensitive data
- ✅ Validate all user inputs
- ✅ Test thoroughly before mainnet deployment
- ✅ Implement proper error handling
- ✅ Use HTTPS for all API calls

## 🚨 Important Notes for Team

1. **Contract Address**: After deployment, update all three teams with the contract address
2. **Network Sync**: Ensure all teams use the same network (testnet/mainnet)
3. **API Consistency**: Backend endpoints must match the API service interface
4. **Error Handling**: Implement consistent error handling across all components
5. **Loading States**: Handle blockchain transaction delays in the UI

## 🎉 You're Ready!

Your Web3 component is **production-ready** and includes:

- ✅ Smart contracts with comprehensive functionality
- ✅ Type-safe SDK for easy integration
- ✅ Wallet connectivity
- ✅ Real-time event system
- ✅ API integration layer
- ✅ Deployment automation
- ✅ Comprehensive testing
- ✅ Full documentation

**Next steps:**

1. Deploy to testnet: `npm run deploy:testnet`
2. Share contract address with backend/frontend teams
3. Integrate using the provided examples
4. Test end-to-end functionality
5. Deploy to mainnet when ready: `npm run deploy:mainnet`

**Good luck with your hackathon! 🏆**
