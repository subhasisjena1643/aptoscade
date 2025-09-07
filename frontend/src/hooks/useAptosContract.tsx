// Aptos Smart Contract Integration - connecting to teammates' deployed infrastructure
"use client";

import { useCallback } from 'react';
import { 
  AnyRawTransaction,
  SimpleTransaction,
  EntryFunctionABI,
} from "@aptos-labs/ts-sdk";
import { 
  aptos, 
  APTOSCADE_CONTRACT_ADDRESS, 
  getContractFunction, 
  RACING_CONFIG,
  formatAPTAmount,
  toAPTUnits,
  AptosError 
} from '@/lib/aptos';
import { useAptosWallet, TransactionResult } from './useAptosWallet';

// Racing game result structure
export interface RaceResult {
  playerId: string;
  position: number; // 1, 2, 3, or 4
  finishTime: number;
  tapsCount: number;
}

// Racing reward information
export interface RaceReward {
  position: number;
  aptReward: number;
  nftReward?: {
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Participation';
    tokenId?: string;
  };
}

// Project contribution structure (for integration with teammates' crowdfunding platform)
export interface ProjectContribution {
  projectId: string;
  amount: number;
  contributor: string;
  timestamp?: number;
}

// Hook for smart contract interactions
export function useAptosContract() {
  const { account, signAndSubmitTransaction, isConnected } = useAptosWallet();

  // Racing Game Contract Functions

  // Record race completion and distribute rewards
  const completeRace = useCallback(async (
    raceId: string,
    raceResults: RaceResult[]
  ): Promise<TransactionResult> => {
    if (!isConnected || !account) {
      throw new AptosError('Wallet not connected');
    }

    if (raceResults.length !== RACING_CONFIG.MAX_PLAYERS_PER_RACE) {
      throw new AptosError('Invalid race results: must have exactly 4 players');
    }

    try {
      // Sort results by position to ensure correct reward distribution
      const sortedResults = [...raceResults].sort((a, b) => a.position - b.position);

      // Build transaction for race completion
      const transaction = {
        function: `${APTOSCADE_CONTRACT_ADDRESS}::main_contract::complete_race`,
        type_arguments: [],
        arguments: [
          raceId,
          sortedResults.map(result => result.playerId),
          sortedResults.map(result => result.position),
          sortedResults.map(result => result.finishTime),
          sortedResults.map(result => result.tapsCount)
        ]
      };

      const result = await signAndSubmitTransaction(transaction);
      
      if (result.success) {
        console.log(`Race ${raceId} completed successfully. Transaction: ${result.hash}`);
      }

      return result;
    } catch (error) {
      console.error('Error completing race:', error);
      throw new AptosError(`Failed to complete race: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isConnected, account, signAndSubmitTransaction]);

  // Get player's APT balance (mock APT tokens from teammates' system)
  const getPlayerBalance = useCallback(async (playerAddress?: string): Promise<number> => {
    const address = playerAddress || account?.address;
    if (!address) {
      throw new AptosError('No player address provided');
    }

    try {
      const resources = await aptos.getAccountResources({ accountAddress: address });
      
      // Look for teammates' Mock APT resource
      const mockAPTResource = resources.find(r => 
        r.type.includes('MockAPT') || r.type.includes('mock_apt')
      );
      
      if (mockAPTResource && mockAPTResource.data) {
        return parseInt((mockAPTResource.data as any).value || '0');
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching player balance:', error);
      return 0;
    }
  }, [account]);

  // Convert APT to raffle tickets using teammates' system
  const convertAPTToTickets = useCallback(async (aptAmount: number): Promise<TransactionResult> => {
    if (!isConnected || !account) {
      throw new AptosError('Wallet not connected');
    }

    if (aptAmount <= 0) {
      throw new AptosError('APT amount must be greater than 0');
    }

    try {
      const transaction = {
        function: `${APTOSCADE_CONTRACT_ADDRESS}::main_contract::convert_apt_to_tickets`,
        type_arguments: [],
        arguments: [toAPTUnits(aptAmount)]
      };

      const result = await signAndSubmitTransaction(transaction);
      
      if (result.success) {
        const ticketsReceived = aptAmount * RACING_CONFIG.APT_TO_TICKETS_RATE;
        console.log(`Converted ${aptAmount} APT to ${ticketsReceived} raffle tickets`);
      }

      return result;
    } catch (error) {
      console.error('Error converting APT to tickets:', error);
      throw new AptosError(`Failed to convert APT to tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isConnected, account, signAndSubmitTransaction]);

  // Crowdfunding Platform Integration (leveraging teammates' infrastructure)

  // Contribute racing earnings to a crowdfunding project
  const contributeToProject = useCallback(async (
    projectId: string,
    aptAmount: number
  ): Promise<TransactionResult> => {
    if (!isConnected || !account) {
      throw new AptosError('Wallet not connected');
    }

    try {
      const transaction = {
        function: `${APTOSCADE_CONTRACT_ADDRESS}::main_contract::contribute_to_project`,
        type_arguments: [],
        arguments: [projectId, toAPTUnits(aptAmount)]
      };

      const result = await signAndSubmitTransaction(transaction);
      
      if (result.success) {
        console.log(`Contributed ${aptAmount} APT to project ${projectId}`);
      }

      return result;
    } catch (error) {
      console.error('Error contributing to project:', error);
      throw new AptosError(`Failed to contribute to project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isConnected, account, signAndSubmitTransaction]);

  // Staking Integration (using teammates' staking system)

  // Stake racing earnings for governance participation
  const stakeAPT = useCallback(async (aptAmount: number): Promise<TransactionResult> => {
    if (!isConnected || !account) {
      throw new AptosError('Wallet not connected');
    }

    try {
      const transaction = {
        function: `${APTOSCADE_CONTRACT_ADDRESS}::main_contract::stake_tokens`,
        type_arguments: [],
        arguments: [toAPTUnits(aptAmount)]
      };

      return await signAndSubmitTransaction(transaction);
    } catch (error) {
      console.error('Error staking APT:', error);
      throw new AptosError(`Failed to stake APT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isConnected, account, signAndSubmitTransaction]);

  // NFT Rewards Integration (using teammates' NFT system)

  // Mint racing achievement NFT
  const mintRacingNFT = useCallback(async (
    achievementType: string,
    metadata: Record<string, any>
  ): Promise<TransactionResult> => {
    if (!isConnected || !account) {
      throw new AptosError('Wallet not connected');
    }

    try {
      const transaction = {
        function: `${APTOSCADE_CONTRACT_ADDRESS}::reward_nft::mint_achievement_nft`,
        type_arguments: [],
        arguments: [achievementType, JSON.stringify(metadata)]
      };

      return await signAndSubmitTransaction(transaction);
    } catch (error) {
      console.error('Error minting racing NFT:', error);
      throw new AptosError(`Failed to mint racing NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isConnected, account, signAndSubmitTransaction]);

  // Utility Functions

  // Get race rewards for given position
  const getRaceRewards = useCallback((position: number): RaceReward => {
    const aptReward = RACING_CONFIG.POSITION_REWARDS[position as keyof typeof RACING_CONFIG.POSITION_REWARDS] || 0;
    
    let nftTier: RaceReward['nftReward'];
    if (position === 1) nftTier = { tier: 'Platinum' };
    else if (position === 2) nftTier = { tier: 'Gold' };
    else if (position === 3) nftTier = { tier: 'Silver' };
    else nftTier = { tier: 'Participation' }; // 4th place gets participation NFT

    return {
      position,
      aptReward,
      nftReward: nftTier
    };
  }, []);

  // Calculate raffle tickets for APT amount
  const calculateRaffleTickets = useCallback((aptAmount: number): number => {
    return aptAmount * RACING_CONFIG.APT_TO_TICKETS_RATE;
  }, []);

  // Get player racing statistics (this will integrate with teammates' analytics)
  const getPlayerRacingStats = useCallback(async (playerAddress?: string) => {
    const address = playerAddress || account?.address;
    if (!address) return null;

    try {
      // This will eventually integrate with teammates' GraphQL analytics system
      // For now, we'll return a placeholder structure
      return {
        racesPlayed: 0,
        racesWon: 0,
        totalAPTEarned: 0,
        averagePosition: 0,
        achievements: []
      };
    } catch (error) {
      console.error('Error fetching racing stats:', error);
      return null;
    }
  }, [account]);

  return {
    // Racing Game Functions
    completeRace,
    getRaceRewards,
    
    // Token Functions
    getPlayerBalance,
    convertAPTToTickets,
    calculateRaffleTickets,
    
    // Platform Integration
    contributeToProject,
    stakeAPT,
    
    // NFT Functions  
    mintRacingNFT,
    
    // Analytics
    getPlayerRacingStats,
    
    // Utilities
    isReady: isConnected && !!account,
    contractAddress: APTOSCADE_CONTRACT_ADDRESS
  };
}
