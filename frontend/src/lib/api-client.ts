import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Types for API responses
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface GameStats {
  totalPlayers: number;
  activeGames: number;
  rewardsPool: number;
  liveTournaments: number;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  gameType: string;
  avatar?: string;
  rank: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  category: string;
  status: 'active' | 'funded' | 'ended';
  creatorId: string;
  endDate: string;
  rewards: RewardTier[];
  progress: number;
}

export interface RewardTier {
  id: string;
  title: string;
  description: string;
  amount: number;
  quantity?: number;
  deliveryDate?: string;
  type: 'digital' | 'physical' | 'experience';
}

export interface Contribution {
  id: string;
  projectId: string;
  userId: string;
  amount: number;
  rewardTierId?: string;
  transactionHash?: string;
  createdAt: string;
}

export interface NFTReward {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  rarity: string;
  projectId?: string;
  ownerId: string;
  createdAt: string;
}

export interface StakingPosition {
  id: string;
  userId: string;
  amount: number;
  duration: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'withdrawn';
  rewards: number;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  status: 'active' | 'passed' | 'failed';
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  votingEndTime: string;
  createdAt: string;
}

class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status
          const { status, data } = error.response;
          throw new APIError(status, data.message || 'API Error', data);
        } else if (error.request) {
          // Network error
          throw new APIError(0, 'Network Error - Please check your connection');
        } else {
          // Other error
          throw new APIError(500, error.message || 'Unknown Error');
        }
      }
    );

    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('aptoscade_token');
      if (storedToken) {
        this.setToken(storedToken);
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('aptoscade_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aptoscade_token');
    }
  }

  // Authentication endpoints
  async register(username: string, email: string, password: string, walletAddress?: string): Promise<AuthResponse> {
    const response = await this.client.post<APIResponse<AuthResponse>>('/auth/register', {
      username,
      email,
      password,
      walletAddress
    });
    
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    
    throw new APIError(400, response.data.message || 'Registration failed');
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<APIResponse<AuthResponse>>('/auth/login', {
      email,
      password
    });
    
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }
    
    throw new APIError(400, response.data.message || 'Login failed');
  }

  async getProfile(): Promise<User> {
    const response = await this.client.get<APIResponse<User>>('/auth/profile');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new APIError(400, response.data.message || 'Failed to get profile');
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await this.client.put<APIResponse<User>>('/auth/profile', updates);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new APIError(400, response.data.message || 'Failed to update profile');
  }

  // Gaming endpoints
  async getGames(): Promise<any[]> {
    const response = await this.client.get<APIResponse<any[]>>('/games');
    return response.data.data || [];
  }

  async createGame(gameData: any): Promise<any> {
    const response = await this.client.post<APIResponse<any>>('/games', gameData);
    return response.data.data;
  }

  async getLeaderboard(gameType?: string, timeframe?: string, limit?: number): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams();
    if (gameType) params.append('gameType', gameType);
    if (timeframe) params.append('timeframe', timeframe);
    if (limit) params.append('limit', limit.toString());

    const response = await this.client.get<APIResponse<LeaderboardEntry[]>>(`/leaderboard?${params}`);
    return response.data.data || [];
  }

  async createAchievement(achievementData: any): Promise<any> {
    const response = await this.client.post<APIResponse<any>>('/achievements', achievementData);
    return response.data.data;
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const response = await this.client.get<APIResponse<any[]>>(`/users/${userId}/achievements`);
    return response.data.data || [];
  }

  async createGameSession(gameData: any): Promise<any> {
    const response = await this.client.post<APIResponse<any>>('/game-sessions', gameData);
    return response.data.data;
  }

  async updateGameSession(sessionId: string, sessionData: any): Promise<any> {
    const response = await this.client.put<APIResponse<any>>(`/game-sessions/${sessionId}`, sessionData);
    return response.data.data;
  }

  async getUserStats(userId: string): Promise<any> {
    const response = await this.client.get<APIResponse<any>>(`/users/${userId}/stats`);
    return response.data.data;
  }

  // Crowdfunding endpoints
  async getProjects(params?: { category?: string; status?: string; page?: number; limit?: number }): Promise<Project[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.client.get<APIResponse<Project[]>>(`/projects?${queryParams}`);
    return response.data.data || [];
  }

  async createProject(projectData: Omit<Project, 'id' | 'progress'>): Promise<Project> {
    const response = await this.client.post<APIResponse<Project>>('/projects', projectData);
    return response.data.data!;
  }

  async getProject(projectId: string): Promise<Project> {
    const response = await this.client.get<APIResponse<Project>>(`/projects/${projectId}`);
    return response.data.data!;
  }

  async contributeToProject(projectId: string, contributionData: { amount: number; rewardTierId?: string; anonymous?: boolean }): Promise<Contribution> {
    const response = await this.client.post<APIResponse<Contribution>>(`/projects/${projectId}/contribute`, contributionData);
    return response.data.data!;
  }

  async getProjectContributions(projectId: string): Promise<Contribution[]> {
    const response = await this.client.get<APIResponse<Contribution[]>>(`/projects/${projectId}/contributions`);
    return response.data.data || [];
  }

  // Web3 endpoints
  async createWeb3Project(projectData: any): Promise<any> {
    const response = await this.client.post<APIResponse<any>>('/web3/projects', projectData);
    return response.data.data;
  }

  async web3Contribute(contributionData: any): Promise<any> {
    const response = await this.client.post<APIResponse<any>>('/web3/contribute', contributionData);
    return response.data.data;
  }

  async getNFTRewards(walletAddress?: string, projectId?: string): Promise<NFTReward[]> {
    const params = new URLSearchParams();
    if (walletAddress) params.append('walletAddress', walletAddress);
    if (projectId) params.append('projectId', projectId);

    const response = await this.client.get<APIResponse<NFTReward[]>>(`/web3/nft-rewards?${params}`);
    return response.data.data || [];
  }

  async stakeTokens(stakingData: any): Promise<StakingPosition> {
    const response = await this.client.post<APIResponse<StakingPosition>>('/web3/stake', stakingData);
    return response.data.data!;
  }

  async getStakingPositions(walletAddress?: string): Promise<StakingPosition[]> {
    const params = new URLSearchParams();
    if (walletAddress) params.append('walletAddress', walletAddress);

    const response = await this.client.get<APIResponse<StakingPosition[]>>(`/web3/staking-positions?${params}`);
    return response.data.data || [];
  }

  async createGovernanceProposal(proposalData: any): Promise<GovernanceProposal> {
    const response = await this.client.post<APIResponse<GovernanceProposal>>('/web3/governance/propose', proposalData);
    return response.data.data!;
  }

  async voteOnProposal(proposalId: string, voteData: any): Promise<any> {
    const response = await this.client.post<APIResponse<any>>(`/web3/governance/vote`, {
      proposalId,
      ...voteData
    });
    return response.data.data;
  }

  async getGovernanceProposals(status?: string): Promise<GovernanceProposal[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await this.client.get<APIResponse<GovernanceProposal[]>>(`/web3/governance?${params}`);
    return response.data.data || [];
  }

  async getWeb3Analytics(walletAddress?: string): Promise<any> {
    const params = new URLSearchParams();
    if (walletAddress) params.append('walletAddress', walletAddress);

    const response = await this.client.get<APIResponse<any>>(`/web3/analytics?${params}`);
    return response.data.data;
  }

  // System status endpoint
  async getSystemStatus(): Promise<GameStats> {
    const response = await this.client.get<APIResponse<GameStats>>('/system/status');
    return response.data.data || {
      totalPlayers: 0,
      activeGames: 0,
      rewardsPool: 0,
      liveTournaments: 0
    };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get<APIResponse<{ status: string; timestamp: string }>>('/health');
    return response.data.data || { status: 'unknown', timestamp: new Date().toISOString() };
  }
}

// Create and export the API client instance
export const apiClient = new APIClient();

// Export error class for use in components
export { APIError };

// Utility function for error handling in components
export const handleAPIError = (error: any): string => {
  if (error instanceof APIError) {
    return error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || 'An unexpected error occurred';
};
