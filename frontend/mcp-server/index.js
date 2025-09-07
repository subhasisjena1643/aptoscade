#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class AptoscadeMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'aptoscade-defi-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'cross_chain_bridge',
            description: 'Bridge tokens between different blockchains based on game outcomes',
            inputSchema: {
              type: 'object',
              properties: {
                fromChain: {
                  type: 'string',
                  description: 'Source blockchain (e.g., ethereum, solana, polygon)',
                },
                toChain: {
                  type: 'string',
                  description: 'Destination blockchain',
                },
                tokenAmount: {
                  type: 'number',
                  description: 'Amount of tokens to bridge',
                },
                tokenSymbol: {
                  type: 'string',
                  description: 'Token symbol (e.g., ETH, SOL, USDC)',
                },
                gameContext: {
                  type: 'object',
                  description: 'Game context that triggered the bridge',
                },
              },
              required: ['fromChain', 'toChain', 'tokenAmount', 'tokenSymbol'],
            },
          },
          {
            name: 'yield_optimizer',
            description: 'Automatically stake winnings in highest-yield protocols',
            inputSchema: {
              type: 'object',
              properties: {
                amount: {
                  type: 'number',
                  description: 'Amount to optimize for yield',
                },
                riskLevel: {
                  type: 'string',
                  enum: ['conservative', 'moderate', 'aggressive'],
                  description: 'Risk tolerance level',
                },
                preferredProtocols: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Preferred DeFi protocols (e.g., aave, compound, uniswap)',
                },
                duration: {
                  type: 'string',
                  description: 'Expected staking duration',
                },
              },
              required: ['amount', 'riskLevel'],
            },
          },
          {
            name: 'liquidity_manager',
            description: 'Provide/remove liquidity based on player portfolio and market conditions',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['add', 'remove', 'rebalance'],
                  description: 'Liquidity management action',
                },
                poolPair: {
                  type: 'string',
                  description: 'Trading pair for liquidity pool (e.g., ETH/USDC)',
                },
                amount: {
                  type: 'number',
                  description: 'Amount for liquidity operation',
                },
                slippageTolerance: {
                  type: 'number',
                  description: 'Maximum slippage tolerance (percentage)',
                },
              },
              required: ['action', 'poolPair', 'amount'],
            },
          },
          {
            name: 'arbitrage_scout',
            description: 'Find and execute arbitrage opportunities from game rewards',
            inputSchema: {
              type: 'object',
              properties: {
                tokenPair: {
                  type: 'string',
                  description: 'Token pair to scout for arbitrage (e.g., ETH/USDC)',
                },
                minProfitThreshold: {
                  type: 'number',
                  description: 'Minimum profit threshold (percentage)',
                },
                maxGasPrice: {
                  type: 'number',
                  description: 'Maximum acceptable gas price',
                },
                exchanges: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Exchanges to check for arbitrage opportunities',
                },
              },
              required: ['tokenPair', 'minProfitThreshold'],
            },
          },
          {
            name: 'portfolio_rebalancer',
            description: 'AI-driven asset allocation based on risk preferences and market conditions',
            inputSchema: {
              type: 'object',
              properties: {
                currentPortfolio: {
                  type: 'object',
                  description: 'Current portfolio composition',
                },
                targetAllocation: {
                  type: 'object',
                  description: 'Target asset allocation percentages',
                },
                rebalanceThreshold: {
                  type: 'number',
                  description: 'Threshold percentage for triggering rebalance',
                },
                riskProfile: {
                  type: 'string',
                  enum: ['conservative', 'moderate', 'aggressive'],
                  description: 'Risk profile for rebalancing strategy',
                },
              },
              required: ['currentPortfolio', 'targetAllocation'],
            },
          },
          {
            name: 'nft_marketplace',
            description: 'Mint/trade game achievements as valuable NFTs',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['mint', 'list', 'buy', 'transfer'],
                  description: 'NFT marketplace action',
                },
                achievementData: {
                  type: 'object',
                  description: 'Game achievement data for NFT minting',
                },
                price: {
                  type: 'number',
                  description: 'Price for listing or buying NFT',
                },
                marketplace: {
                  type: 'string',
                  description: 'Target NFT marketplace',
                },
              },
              required: ['action'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'cross_chain_bridge':
            return await this.handleCrossChainBridge(args);
          case 'yield_optimizer':
            return await this.handleYieldOptimizer(args);
          case 'liquidity_manager':
            return await this.handleLiquidityManager(args);
          case 'arbitrage_scout':
            return await this.handleArbitrageScout(args);
          case 'portfolio_rebalancer':
            return await this.handlePortfolioRebalancer(args);
          case 'nft_marketplace':
            return await this.handleNFTMarketplace(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error.message}`
        );
      }
    });
  }

  async handleCrossChainBridge(args) {
    const { fromChain, toChain, tokenAmount, tokenSymbol, gameContext } = args;
    
    // Simulate cross-chain bridge operation
    const bridgeResult = {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      fromChain,
      toChain,
      amount: tokenAmount,
      token: tokenSymbol,
      estimatedTime: '2-5 minutes',
      fees: {
        bridgeFee: tokenAmount * 0.001, // 0.1% bridge fee
        gasFee: 0.005, // Estimated gas fee
      },
      gameContext,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Cross-chain bridge initiated successfully!\n\nDetails:\n- From: ${fromChain}\n- To: ${toChain}\n- Amount: ${tokenAmount} ${tokenSymbol}\n- Transaction Hash: ${bridgeResult.transactionHash}\n- Estimated Time: ${bridgeResult.estimatedTime}\n- Bridge Fee: ${bridgeResult.fees.bridgeFee} ${tokenSymbol}\n- Gas Fee: ${bridgeResult.fees.gasFee} ETH`,
        },
      ],
    };
  }

  async handleYieldOptimizer(args) {
    const { amount, riskLevel, preferredProtocols, duration } = args;
    
    // Simulate yield optimization
    const protocols = {
      conservative: [
        { name: 'Aave', apy: 4.2, risk: 'Low' },
        { name: 'Compound', apy: 3.8, risk: 'Low' },
      ],
      moderate: [
        { name: 'Uniswap V3', apy: 8.5, risk: 'Medium' },
        { name: 'Curve', apy: 7.2, risk: 'Medium' },
      ],
      aggressive: [
        { name: 'Yearn Finance', apy: 15.3, risk: 'High' },
        { name: 'Convex', apy: 12.8, risk: 'High' },
      ],
    };

    const selectedProtocols = protocols[riskLevel] || protocols.moderate;
    const bestProtocol = selectedProtocols[0];

    const optimizationResult = {
      success: true,
      selectedProtocol: bestProtocol.name,
      expectedAPY: bestProtocol.apy,
      riskLevel: bestProtocol.risk,
      amount,
      estimatedYearlyReturn: (amount * bestProtocol.apy) / 100,
      duration: duration || 'Flexible',
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Yield optimization completed!\n\nRecommendation:\n- Protocol: ${bestProtocol.name}\n- APY: ${bestProtocol.apy}%\n- Risk Level: ${bestProtocol.risk}\n- Amount: ${amount} tokens\n- Estimated Yearly Return: ${optimizationResult.estimatedYearlyReturn.toFixed(2)} tokens\n- Duration: ${optimizationResult.duration}`,
        },
      ],
    };
  }

  async handleLiquidityManager(args) {
    const { action, poolPair, amount, slippageTolerance = 1 } = args;
    
    // Simulate liquidity management
    const liquidityResult = {
      success: true,
      action,
      poolPair,
      amount,
      slippageTolerance,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      lpTokensReceived: action === 'add' ? amount * 0.98 : null, // Account for fees
      fees: amount * 0.003, // 0.3% fee
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Liquidity management executed!\n\nDetails:\n- Action: ${action}\n- Pool: ${poolPair}\n- Amount: ${amount}\n- Slippage Tolerance: ${slippageTolerance}%\n- Transaction Hash: ${liquidityResult.transactionHash}\n${action === 'add' ? `- LP Tokens Received: ${liquidityResult.lpTokensReceived}` : ''}\n- Fees: ${liquidityResult.fees}`,
        },
      ],
    };
  }

  async handleArbitrageScout(args) {
    const { tokenPair, minProfitThreshold, maxGasPrice, exchanges = ['Uniswap', 'SushiSwap', 'PancakeSwap'] } = args;
    
    // Simulate arbitrage opportunity detection
    const opportunities = exchanges.map(exchange => ({
      exchange,
      price: 1000 + Math.random() * 100 - 50, // Random price around 1000
      liquidity: Math.random() * 1000000,
    }));

    const sortedByPrice = opportunities.sort((a, b) => a.price - b.price);
    const buyExchange = sortedByPrice[0];
    const sellExchange = sortedByPrice[sortedByPrice.length - 1];
    const profitPercentage = ((sellExchange.price - buyExchange.price) / buyExchange.price) * 100;

    const arbitrageResult = {
      success: profitPercentage >= minProfitThreshold,
      tokenPair,
      profitPercentage: profitPercentage.toFixed(2),
      buyExchange: buyExchange.exchange,
      sellExchange: sellExchange.exchange,
      buyPrice: buyExchange.price.toFixed(2),
      sellPrice: sellExchange.price.toFixed(2),
      estimatedProfit: profitPercentage >= minProfitThreshold ? (profitPercentage * 1000).toFixed(2) : 0,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Arbitrage scout results:\n\nOpportunity ${arbitrageResult.success ? 'FOUND' : 'NOT FOUND'}!\n- Token Pair: ${tokenPair}\n- Profit Percentage: ${arbitrageResult.profitPercentage}%\n- Buy on: ${arbitrageResult.buyExchange} at $${arbitrageResult.buyPrice}\n- Sell on: ${arbitrageResult.sellExchange} at $${arbitrageResult.sellPrice}\n- Estimated Profit: $${arbitrageResult.estimatedProfit}\n- Threshold: ${minProfitThreshold}%`,
        },
      ],
    };
  }

  async handlePortfolioRebalancer(args) {
    const { currentPortfolio, targetAllocation, rebalanceThreshold = 5, riskProfile } = args;
    
    // Simulate portfolio rebalancing
    const rebalanceActions = [];
    const currentTotal = Object.values(currentPortfolio).reduce((sum, value) => sum + value, 0);
    
    for (const [asset, targetPercent] of Object.entries(targetAllocation)) {
      const currentPercent = ((currentPortfolio[asset] || 0) / currentTotal) * 100;
      const difference = Math.abs(currentPercent - targetPercent);
      
      if (difference > rebalanceThreshold) {
        const action = currentPercent > targetPercent ? 'sell' : 'buy';
        const amount = Math.abs((targetPercent - currentPercent) * currentTotal / 100);
        rebalanceActions.push({ asset, action, amount: amount.toFixed(2), difference: difference.toFixed(2) });
      }
    }

    const rebalanceResult = {
      success: true,
      rebalanceNeeded: rebalanceActions.length > 0,
      actions: rebalanceActions,
      riskProfile,
      currentTotal,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: 'text',
          text: `Portfolio rebalancing analysis:\n\n${rebalanceResult.rebalanceNeeded ? 'Rebalancing REQUIRED' : 'Portfolio is balanced'}\n\nActions needed:\n${rebalanceActions.map(action => `- ${action.action.toUpperCase()} ${action.amount} ${action.asset} (${action.difference}% deviation)`).join('\n') || 'None'}\n\nRisk Profile: ${riskProfile}\nTotal Portfolio Value: ${currentTotal}`,
        },
      ],
    };
  }

  async handleNFTMarketplace(args) {
    const { action, achievementData, price, marketplace = 'OpenSea' } = args;
    
    // Simulate NFT marketplace operations
    const nftResult = {
      success: true,
      action,
      marketplace,
      tokenId: Math.floor(Math.random() * 10000),
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      price,
      timestamp: new Date().toISOString(),
    };

    let actionText = '';
    switch (action) {
      case 'mint':
        actionText = `NFT minted successfully!\n- Token ID: ${nftResult.tokenId}\n- Achievement: ${achievementData?.name || 'Game Achievement'}\n- Rarity: ${achievementData?.rarity || 'Common'}`;
        break;
      case 'list':
        actionText = `NFT listed for sale!\n- Token ID: ${nftResult.tokenId}\n- Price: ${price} ETH\n- Marketplace: ${marketplace}`;
        break;
      case 'buy':
        actionText = `NFT purchased!\n- Token ID: ${nftResult.tokenId}\n- Price: ${price} ETH\n- Marketplace: ${marketplace}`;
        break;
      case 'transfer':
        actionText = `NFT transferred!\n- Token ID: ${nftResult.tokenId}`;
        break;
    }

    return {
      content: [
        {
          type: 'text',
          text: `${actionText}\n- Transaction Hash: ${nftResult.transactionHash}\n- Marketplace: ${marketplace}`,
        },
      ],
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Aptoscade DeFi MCP Server running on stdio');
  }
}

// Start the server
const server = new AptoscadeMCPServer();
server.run().catch(console.error);
