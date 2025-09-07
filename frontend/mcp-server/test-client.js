#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

class AptoscadeMCPClient {
  constructor() {
    this.client = new Client(
      {
        name: 'aptoscade-test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async connect() {
    // Spawn the MCP server process
    const serverProcess = spawn('node', ['index.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    // Create transport using the server process
    const transport = new StdioClientTransport({
      reader: serverProcess.stdout,
      writer: serverProcess.stdin,
    });

    await this.client.connect(transport);
    console.log('Connected to Aptoscade MCP Server');
    
    return serverProcess;
  }

  async testTools() {
    try {
      // List available tools
      console.log('\n=== Available Tools ===');
      const toolsResponse = await this.client.request(
        { method: 'tools/list' },
        { method: 'tools/list' }
      );
      
      toolsResponse.tools.forEach(tool => {
        console.log(`- ${tool.name}: ${tool.description}`);
      });

      // Test Cross-Chain Bridge
      console.log('\n=== Testing Cross-Chain Bridge ===');
      const bridgeResult = await this.client.request(
        { method: 'tools/call' },
        {
          method: 'tools/call',
          params: {
            name: 'cross_chain_bridge',
            arguments: {
              fromChain: 'ethereum',
              toChain: 'polygon',
              tokenAmount: 100,
              tokenSymbol: 'USDC',
              gameContext: {
                game: 'racing',
                result: 'win',
                score: 1250
              }
            }
          }
        }
      );
      console.log(bridgeResult.content[0].text);

      // Test Yield Optimizer
      console.log('\n=== Testing Yield Optimizer ===');
      const yieldResult = await this.client.request(
        { method: 'tools/call' },
        {
          method: 'tools/call',
          params: {
            name: 'yield_optimizer',
            arguments: {
              amount: 1000,
              riskLevel: 'moderate',
              preferredProtocols: ['aave', 'compound'],
              duration: '30 days'
            }
          }
        }
      );
      console.log(yieldResult.content[0].text);

      // Test Arbitrage Scout
      console.log('\n=== Testing Arbitrage Scout ===');
      const arbitrageResult = await this.client.request(
        { method: 'tools/call' },
        {
          method: 'tools/call',
          params: {
            name: 'arbitrage_scout',
            arguments: {
              tokenPair: 'ETH/USDC',
              minProfitThreshold: 2.5,
              maxGasPrice: 50,
              exchanges: ['Uniswap', 'SushiSwap', 'PancakeSwap']
            }
          }
        }
      );
      console.log(arbitrageResult.content[0].text);

      // Test Portfolio Rebalancer
      console.log('\n=== Testing Portfolio Rebalancer ===');
      const portfolioResult = await this.client.request(
        { method: 'tools/call' },
        {
          method: 'tools/call',
          params: {
            name: 'portfolio_rebalancer',
            arguments: {
              currentPortfolio: {
                ETH: 5000,
                USDC: 3000,
                BTC: 2000
              },
              targetAllocation: {
                ETH: 50,
                USDC: 30,
                BTC: 20
              },
              rebalanceThreshold: 5,
              riskProfile: 'moderate'
            }
          }
        }
      );
      console.log(portfolioResult.content[0].text);

      // Test NFT Marketplace
      console.log('\n=== Testing NFT Marketplace ===');
      const nftResult = await this.client.request(
        { method: 'tools/call' },
        {
          method: 'tools/call',
          params: {
            name: 'nft_marketplace',
            arguments: {
              action: 'mint',
              achievementData: {
                name: 'Racing Champion',
                rarity: 'Legendary',
                score: 1250,
                game: 'DeFi Racing Championship'
              },
              marketplace: 'OpenSea'
            }
          }
        }
      );
      console.log(nftResult.content[0].text);

    } catch (error) {
      console.error('Error testing tools:', error);
    }
  }

  async disconnect() {
    await this.client.close();
    console.log('\nDisconnected from MCP Server');
  }
}

// Run the test
async function runTest() {
  const client = new AptoscadeMCPClient();
  let serverProcess;
  
  try {
    serverProcess = await client.connect();
    await client.testTools();
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.disconnect();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runTest().catch(console.error);
