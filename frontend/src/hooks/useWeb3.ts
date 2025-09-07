'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, handleAPIError, type NFTReward, type StakingPosition, type GovernanceProposal } from '@/lib/api-client';

export interface GameSessionData {
  gameType: string;
  difficulty: string;
  playerCount: number;
  metadata?: Record<string, unknown>;
}

export interface GameSessionUpdateData {
  score?: number;
  completed?: boolean;
  achievements?: string[];
  metadata?: Record<string, unknown>;
}

export interface GameSession {
  id: string;
  gameType: string;
  score?: number;
  completed: boolean;
  startTime: string;
  endTime?: string;
  achievements: string[];
}

export interface UserStats {
  totalGames: number;
  totalScore: number;
  averageScore: number;
  gamesWon: number;
  winRate: number;
  favoriteGame: string;
  totalPlayTime: number;
  achievements: number;
  rank: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: string;
  unlockedAt: string;
  gameType?: string;
}

export interface UseWeb3Return {
  nftRewards: NFTReward[];
  stakingPositions: StakingPosition[];
  governanceProposals: GovernanceProposal[];
  analytics: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
  createWeb3Project: (projectData: Record<string, unknown>) => Promise<unknown>;
  contributeWeb3: (contributionData: Record<string, unknown>) => Promise<unknown>;
  stakeTokens: (stakingData: Record<string, unknown>) => Promise<StakingPosition>;
  createProposal: (proposalData: Record<string, unknown>) => Promise<GovernanceProposal>;
  voteOnProposal: (proposalId: string, voteData: Record<string, unknown>) => Promise<unknown>;
  refreshData: () => Promise<void>;
}

export function useWeb3(walletAddress?: string): UseWeb3Return {
  const [nftRewards, setNftRewards] = useState<NFTReward[]>([]);
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [governanceProposals, setGovernanceProposals] = useState<GovernanceProposal[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeb3Data = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [nfts, staking, proposals, analyticsData] = await Promise.all([
        apiClient.getNFTRewards(walletAddress),
        apiClient.getStakingPositions(walletAddress),
        apiClient.getGovernanceProposals(),
        apiClient.getWeb3Analytics(walletAddress)
      ]);

      setNftRewards(nfts);
      setStakingPositions(staking);
      setGovernanceProposals(proposals);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadWeb3Data();
  }, [loadWeb3Data]);

  const createWeb3Project = async (projectData: Record<string, unknown>): Promise<unknown> => {
    try {
      setError(null);
      return await apiClient.createWeb3Project(projectData);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const contributeWeb3 = async (contributionData: Record<string, unknown>): Promise<unknown> => {
    try {
      setError(null);
      return await apiClient.web3Contribute(contributionData);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const stakeTokens = async (stakingData: Record<string, unknown>): Promise<StakingPosition> => {
    try {
      setError(null);
      const position = await apiClient.stakeTokens(stakingData);
      await loadWeb3Data(); // Refresh data
      return position;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const createProposal = async (proposalData: Record<string, unknown>): Promise<GovernanceProposal> => {
    try {
      setError(null);
      const proposal = await apiClient.createGovernanceProposal(proposalData);
      await loadWeb3Data(); // Refresh data
      return proposal;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const voteOnProposal = async (proposalId: string, voteData: Record<string, unknown>): Promise<unknown> => {
    try {
      setError(null);
      const result = await apiClient.voteOnProposal(proposalId, voteData);
      await loadWeb3Data(); // Refresh data
      return result;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshData = async (): Promise<void> => {
    await loadWeb3Data();
  };

  return {
    nftRewards,
    stakingPositions,
    governanceProposals,
    analytics,
    isLoading,
    error,
    createWeb3Project,
    contributeWeb3,
    stakeTokens,
    createProposal,
    voteOnProposal,
    refreshData
  };
}
