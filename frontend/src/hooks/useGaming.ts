'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, handleAPIError, type LeaderboardEntry, type GameStats } from '@/lib/api-client';

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

export interface UseGamingReturn {
  leaderboard: LeaderboardEntry[];
  gameStats: GameStats;
  userStats: UserStats;
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;
  createGameSession: (gameData: GameSessionData) => Promise<GameSession>;
  updateGameSession: (sessionId: string, sessionData: GameSessionUpdateData) => Promise<GameSession>;
  getLeaderboard: (gameType?: string, timeframe?: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useGaming(userId?: string): UseGamingReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalPlayers: 0,
    activeGames: 0,
    rewardsPool: 0,
    liveTournaments: 0
  });
  const [userStats, setUserStats] = useState<UserStats>({
    totalGames: 0,
    totalScore: 0,
    averageScore: 0,
    gamesWon: 0,
    winRate: 0,
    favoriteGame: '',
    totalPlayTime: 0,
    achievements: 0,
    rank: 0
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load game stats
      const stats = await apiClient.getSystemStatus();
      setGameStats(stats);

      // Load leaderboard
      const leaderboardData = await apiClient.getLeaderboard(undefined, 'weekly', 10);
      setLeaderboard(leaderboardData);

      // Load user-specific data if userId is provided
      if (userId) {
        const [userStatsData, userAchievements] = await Promise.all([
          apiClient.getUserStats(userId),
          apiClient.getUserAchievements(userId)
        ]);
        setUserStats(userStatsData || {
          totalGames: 0,
          totalScore: 0,
          averageScore: 0,
          gamesWon: 0,
          winRate: 0,
          favoriteGame: '',
          totalPlayTime: 0,
          achievements: 0,
          rank: 0
        });
        setAchievements(userAchievements || []);
      }
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const createGameSession = async (gameData: GameSessionData): Promise<GameSession> => {
    try {
      setError(null);
      return await apiClient.createGameSession(gameData);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateGameSession = async (sessionId: string, sessionData: GameSessionUpdateData): Promise<GameSession> => {
    try {
      setError(null);
      const updatedSession = await apiClient.updateGameSession(sessionId, sessionData);
      
      // Refresh stats and leaderboard after game session update
      await loadInitialData();
      
      return updatedSession;
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getLeaderboard = async (gameType?: string, timeframe?: string): Promise<void> => {
    try {
      setError(null);
      const leaderboardData = await apiClient.getLeaderboard(gameType, timeframe, 20);
      setLeaderboard(leaderboardData);
    } catch (err) {
      setError(handleAPIError(err));
    }
  };

  const refreshStats = async (): Promise<void> => {
    await loadInitialData();
  };

  return {
    leaderboard,
    gameStats,
    userStats,
    achievements,
    isLoading,
    error,
    createGameSession,
    updateGameSession,
    getLeaderboard,
    refreshStats
  };
}

  return {
    leaderboard,
    gameStats,
    userStats,
    achievements,
    isLoading,
    error,
    createGameSession,
    updateGameSession,
    getLeaderboard,
    refreshStats
  };
}
