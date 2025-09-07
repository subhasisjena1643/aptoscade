import express from 'express';
import {
  getMyNFTRewards,
  getNFTDetails,
  getMyStakingRecords,
  createStakePosition,
  unstakeTokens,
} from '../controllers/web3Controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Web3
 *   description: Web3 features including NFT rewards and staking
 */

// NFT endpoints
router.get('/nfts/my-rewards', authenticate, getMyNFTRewards);
router.get('/nfts/:tokenAddress', getNFTDetails);

// Staking endpoints
router.get('/staking/my-stakes', authenticate, getMyStakingRecords);
router.post('/staking/stake', authenticate, createStakePosition);
router.post('/staking/:id/unstake', authenticate, unstakeTokens);

export { router as web3Routes };
