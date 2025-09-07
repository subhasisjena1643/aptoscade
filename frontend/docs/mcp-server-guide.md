# Aptoscade MCP Server Guide

## Overview

The Aptoscade MCP (Model Context Protocol) Server provides AI-powered DeFi automation tools that integrate seamlessly with the gaming platform. It enables real-time cross-chain operations, yield optimization, and portfolio management triggered by gameplay events.

## Available Tools

### 1. Cross-Chain Bridge (`cross_chain_bridge`)
Automatically bridges tokens between different blockchains based on game outcomes.

**Parameters:**
- `fromChain`: Source blockchain (ethereum, solana, polygon, etc.)
- `toChain`: Destination blockchain
- `tokenAmount`: Amount of tokens to bridge
- `tokenSymbol`: Token symbol (ETH, SOL, USDC, etc.)
- `gameContext`: Game context that triggered the bridge (optional)

**Example Usage:**
```json
{
  "name": "cross_chain_bridge",
  "arguments": {
    "fromChain": "ethereum",
    "toChain": "polygon",
    "tokenAmount": 100,
    "tokenSymbol": "USDC",
    "gameContext": {
      "game": "racing",
      "result": "win",
      "score": 1250
    }
  }
}
```

### 2. Yield Optimizer (`yield_optimizer`)
Automatically stakes winnings in highest-yield protocols based on risk preferences.

**Parameters:**
- `amount`: Amount to optimize for yield
- `riskLevel`: Risk tolerance (conservative, moderate, aggressive)
- `preferredProtocols`: Preferred DeFi protocols (optional)
- `duration`: Expected staking duration (optional)

**Example Usage:**
```json
{
  "name": "yield_optimizer",
  "arguments": {
    "amount": 1000,
    "riskLevel": "moderate",
    "preferredProtocols": ["aave", "compound"],
    "duration": "30 days"
  }
}
```

### 3. Liquidity Manager (`liquidity_manager`)
Provides or removes liquidity based on player portfolio and market conditions.

**Parameters:**
- `action`: Liquidity action (add, remove, rebalance)
- `poolPair`: Trading pair for liquidity pool (e.g., ETH/USDC)
- `amount`: Amount for liquidity operation
- `slippageTolerance`: Maximum slippage tolerance percentage (optional)

### 4. Arbitrage Scout (`arbitrage_scout`)
Finds and executes arbitrage opportunities from game rewards.

**Parameters:**
- `tokenPair`: Token pair to scout (e.g., ETH/USDC)
- `minProfitThreshold`: Minimum profit threshold percentage
- `maxGasPrice`: Maximum acceptable gas price (optional)
- `exchanges`: Exchanges to check (optional)

### 5. Portfolio Rebalancer (`portfolio_rebalancer`)
AI-driven asset allocation based on risk preferences and market conditions.

**Parameters:**
- `currentPortfolio`: Current portfolio composition
- `targetAllocation`: Target asset allocation percentages
- `rebalanceThreshold`: Threshold for triggering rebalance (optional)
- `riskProfile`: Risk profile for strategy (conservative, moderate, aggressive)

### 6. NFT Marketplace (`nft_marketplace`)
Mints and trades game achievements as valuable NFTs.

**Parameters:**
- `action`: NFT action (mint, list, buy, transfer)
- `achievementData`: Game achievement data for minting (optional)
- `price`: Price for listing or buying (optional)
- `marketplace`: Target NFT marketplace (optional)

## Setup and Configuration

### 1. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# API Keys
INFURA_PROJECT_ID=your_infura_project_id
ALCHEMY_API_KEY=your_alchemy_api_key

# AI Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Security
PRIVATE_KEY=your_private_key_for_transactions
WALLET_ADDRESS=your_wallet_address
```

### 2. Running the Server

```bash
# Development mode
cd mcp-server
npm run dev

# Production mode
npm start
```

### 3. Integration with AI Clients

The MCP server can be integrated with various AI clients that support the Model Context Protocol:

- **Claude Desktop**: Add server configuration to Claude's settings
- **Custom AI Applications**: Use the MCP SDK to connect
- **Aptoscade Frontend**: Direct integration for real-time game events

## Game Integration Examples

### Racing Game Integration
When a player wins a race, the system automatically:
1. Bridges winnings to the optimal chain
2. Stakes tokens in highest-yield protocols
3. Rebalances portfolio based on risk profile
4. Mints achievement NFT

### Arbitrage Game Integration
During rhythm-based arbitrage gameplay:
1. Scouts real arbitrage opportunities
2. Executes profitable trades automatically
3. Compounds profits into yield strategies
4. Updates portfolio allocation

### Yield Farm Runner Integration
In the endless runner game:
1. Collects yield opportunities as game items
2. Automatically stakes collected tokens
3. Rebalances portfolio in real-time
4. Optimizes for maximum APY

## Security Features

- **Multi-signature support** for high-value transactions
- **Slippage protection** for all DeFi operations
- **Gas price optimization** to minimize costs
- **Risk assessment** for all strategies
- **Transaction simulation** before execution

## Monitoring and Analytics

The MCP server provides detailed logging and analytics:
- Real-time transaction monitoring
- Performance metrics for each strategy
- Risk assessment reports
- Yield optimization results
- Cross-chain operation status

## API Response Format

All tools return responses in the following format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Detailed operation results and status information"
    }
  ]
}
```

## Error Handling

The server includes comprehensive error handling:
- Invalid parameter validation
- Network failure recovery
- Transaction failure handling
- Rate limiting protection
- Graceful degradation

## Future Enhancements

- **Real blockchain integration** (currently simulated)
- **Advanced AI strategies** using machine learning
- **Multi-chain governance** token support
- **Automated tax optimization**
- **MEV protection** mechanisms
- **Social trading features**

---

For technical support or feature requests, please refer to the main Aptoscade documentation or contact the development team.
