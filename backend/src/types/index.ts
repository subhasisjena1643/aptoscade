export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  aptosAddress?: string;
  totalScore: number;
  gamesPlayed: number;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  name: string;
  description?: string;
  category: string;
  minScore: number;
  maxScore: number;
  isActive: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameScore {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  duration?: number;
  gameData?: any;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  txHash: string;
  amount: string;
  tokenType: string;
  transactionType: TransactionType;
  status: TransactionStatus;
  aptosData?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  gameId: string;
  score: number;
  rank: number;
  period: LeaderboardPeriod;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  imageUrl?: string;
  conditions: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  REWARD = 'REWARD',
  PURCHASE = 'PURCHASE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum LeaderboardPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GameScoreCreateData {
  gameId: string;
  score: number;
  duration?: number;
  gameData?: any;
}

export interface UserRegistrationData {
  email: string;
  username: string;
  password: string;
  aptosAddress?: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}
