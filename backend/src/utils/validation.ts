import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(30).alphanum().required(),
  password: Joi.string().min(6).required(),
  aptosAddress: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30).alphanum().optional(),
  avatar: Joi.string().uri().optional(),
  aptosAddress: Joi.string().optional(),
});

// Game validation schemas
export const submitScoreSchema = Joi.object({
  score: Joi.number().integer().min(0).required(),
  duration: Joi.number().integer().min(0).optional(),
  gameData: Joi.object().optional(),
});

// Transaction validation schemas
export const submitTransactionSchema = Joi.object({
  txHash: Joi.string().required(),
  amount: Joi.string().required(),
  tokenType: Joi.string().required(),
  transactionType: Joi.string().valid('DEPOSIT', 'WITHDRAWAL', 'REWARD', 'PURCHASE', 'TRANSFER').required(),
  aptosData: Joi.object().optional(),
});

// Pagination validation schema
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Aptos validation schemas
export const aptosAddressSchema = Joi.object({
  address: Joi.string().required(),
});

export const faucetRequestSchema = Joi.object({
  address: Joi.string().required(),
  amount: Joi.number().integer().min(1).max(1000000000).default(100000000), // Max 10 APT
});
