import express from 'express';
import { web3Service } from '../services/web3Service';
import { ApiResponse } from '../types';

const router = express.Router();

/**
 * @swagger
 * /api/v1/health/web3:
 *   get:
 *     summary: Check Web3 service health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Web3 service status
 */
router.get('/web3', async (req, res) => {
  try {
    const isEnabled = web3Service.isEnabled();
    const status = isEnabled ? 'enabled' : 'disabled';
    
    let blockchainInfo = null;
    if (isEnabled) {
      try {
        // Try to get basic blockchain info without making actual calls
        blockchainInfo = {
          contractAddress: process.env.APTOS_CONTRACT_ADDRESS || 'not_configured',
          network: process.env.APTOS_NETWORK || 'not_configured',
          features: [
            'Project Creation',
            'Contribution Processing', 
            'NFT Rewards',
            'Staking System',
            'Governance Voting'
          ]
        };
      } catch (error) {
        blockchainInfo = { error: 'Failed to get blockchain info' };
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        web3Service: {
          status,
          enabled: isEnabled,
          blockchain: blockchainInfo,
        },
        timestamp: new Date().toISOString(),
      }
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

/**
 * @swagger
 * /api/v1/health/database:
 *   get:
 *     summary: Check database connection health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database connection status
 */
router.get('/database', async (req, res) => {
  try {
    const { prisma } = await import('../config/database');
    
    // Simple database health check
    await prisma.user.count();
    
    const response: ApiResponse = {
      success: true,
      data: {
        database: {
          status: 'connected',
          type: 'PostgreSQL',
          provider: 'Neon',
        },
        timestamp: new Date().toISOString(),
      }
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

export { router as healthRoutes };
