import express from 'express';
import {
  getProposals,
  createProposal,
  voteOnProposal,
  getProposal,
} from '../controllers/governanceController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Governance
 *   description: Decentralized governance and voting
 */

// Public routes
router.get('/proposals', getProposals);
router.get('/proposals/:id', getProposal);

// Protected routes
router.post('/proposals', authenticate, createProposal);
router.post('/proposals/:id/vote', authenticate, voteOnProposal);

export { router as governanceRoutes };
