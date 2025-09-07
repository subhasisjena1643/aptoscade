// Aptos SDK configuration - connecting to teammates' deployed infrastructure
import { Aptos, AptosConfig, Network, NetworkToNetworkName } from "@aptos-labs/ts-sdk";

// Smart contract address deployed by teammates (from updated.txt)
export const APTOSCADE_CONTRACT_ADDRESS = "0x762779f87715b377314b79420b866ca7edef615a86d0d998f733e3f5c7113f89";

// Network configuration for Aptos
export const APTOS_NETWORK = Network.TESTNET; // Use testnet as specified by teammates

// Aptos client configuration
const config = new AptosConfig({ 
  network: APTOS_NETWORK,
  // Adding RPC endpoint for better reliability
  fullnode: "https://fullnode.testnet.aptoslabs.com/v1",
  faucet: "https://faucet.testnet.aptoslabs.com"
});

export const aptos = new Aptos(config);

// Network details for display
export const NETWORK_INFO = {
  name: NetworkToNetworkName[APTOS_NETWORK],
  chainId: APTOS_NETWORK === Network.TESTNET ? 2 : 1,
  nodeUrl: "https://fullnode.testnet.aptoslabs.com/v1",
  faucetUrl: "https://faucet.testnet.aptoslabs.com",
  explorerUrl: `https://explorer.aptoslabs.com/?network=${NetworkToNetworkName[APTOS_NETWORK].toLowerCase()}`
};

// Contract module names (based on teammates' implementation)
export const CONTRACT_MODULES = {
  MAIN_CONTRACT: "main_contract",
  NFT_REWARDS: "reward_nft", 
  STAKING: "staking",
  GOVERNANCE: "governance"
} as const;

// Racing game specific configuration
export const RACING_CONFIG = {
  // APT rewards for racing positions (as specified in aptoscade_details.txt)
  POSITION_REWARDS: {
    1: 10, // 1st place: 10 APT
    2: 5,  // 2nd place: 5 APT  
    3: 2,  // 3rd place: 2 APT
    4: 0   // 4th place: 0 APT (but gets participation NFT)
  },
  // Raffle ticket conversion rate
  APT_TO_TICKETS_RATE: 100, // 1 APT = 100 raffle tickets
  // Maximum players per race
  MAX_PLAYERS_PER_RACE: 4
} as const;

// Helper function to get contract function identifier
export function getContractFunction(module: keyof typeof CONTRACT_MODULES, functionName: string): string {
  return `${APTOSCADE_CONTRACT_ADDRESS}::${CONTRACT_MODULES[module]}::${functionName}`;
}

// Error handling for Aptos operations
export class AptosError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AptosError';
  }
}

// Validation helper for Aptos addresses
export function isValidAptosAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address) || /^0x[a-fA-F0-9]{1,63}$/.test(address);
}

// Format APT amount for display (8 decimal places)
export function formatAPTAmount(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (numAmount / 100000000).toFixed(8); // APT has 8 decimal places
}

// Convert APT to smallest unit (for blockchain transactions)
export function toAPTUnits(amount: number): number {
  return Math.floor(amount * 100000000); // Convert to 8 decimal places
}
