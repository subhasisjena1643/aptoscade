import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse } from '../types';

/**
 * @swagger
 * /api/v1/web3/nfts/my-rewards:
 *   get:
 *     summary: Get user's NFT rewards
 *     tags: [NFT Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: NFT rewards retrieved successfully
 */
export const getMyNFTRewards = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const nftRewards = await prisma.nFTReward.findMany({
      where: { ownerId: userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        contribution: {
          select: {
            amount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format NFTs with metadata
    const enhancedNFTs = nftRewards.map((nft: any) => ({
      ...nft,
      amount: Number(nft.contribution?.amount || 0),
      metadata: {
        name: nft.name,
        description: nft.description,
        image: nft.imageUrl,
        attributes: [
          { trait_type: 'Tier', value: nft.tier },
          { trait_type: 'Project', value: nft.project.title },
          { trait_type: 'Contribution', value: `${Number(nft.contribution?.amount || 0)} APT` },
        ],
      },
    }));

    const response: ApiResponse = {
      success: true,
      data: enhancedNFTs,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/web3/staking/my-stakes:
 *   get:
 *     summary: Get user's staking records
 *     tags: [Staking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staking records retrieved successfully
 */
export const getMyStakingRecords = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const stakingRecords = await prisma.stakingRecord.findMany({
      where: { userId },
      orderBy: { stakedAt: 'desc' },
    });

    // Calculate rewards and status for each stake
    const enhancedRecords = stakingRecords.map((record: any) => {
      // Calculate basic rewards locally
      const daysSinceStaking = Math.floor(
        (Date.now() - record.stakedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Simple APR calculation based on tier
      let apr = 0.08; // Bronze default
      if (record.tier === 'SILVER') apr = 0.10;
      else if (record.tier === 'GOLD') apr = 0.12;
      else if (record.tier === 'DIAMOND') apr = 0.15;
      
      const currentRewards = (Number(record.amount) * apr * daysSinceStaking) / 365;

      return {
        ...record,
        amount: Number(record.amount), // Convert Decimal to number
        currentRewards: Math.max(0, currentRewards),
        isLocked: record.unlocksAt > new Date(),
        daysUntilUnlock: Math.max(0, Math.ceil(
          (record.unlocksAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )),
      };
    });

    const response: ApiResponse = {
      success: true,
      data: enhancedRecords,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/web3/staking/stake:
 *   post:
 *     summary: Create a new staking position
 *     tags: [Staking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - lockPeriodDays
 *             properties:
 *               amount:
 *                 type: number
 *               lockPeriodDays:
 *                 type: number
 *                 enum: [30, 90, 180, 365]
 *     responses:
 *       201:
 *         description: Staking position created successfully
 */
export const createStakePosition = async (req: any, res: Response): Promise<void> => {
  try {
    const { amount, lockPeriodDays } = req.body;
    const userId = req.user.id;

    // Calculate unlock date
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + Number(lockPeriodDays));

    // Determine tier based on lock period
    let tier = 'BRONZE';
    if (lockPeriodDays >= 365) tier = 'DIAMOND';
    else if (lockPeriodDays >= 180) tier = 'GOLD';
    else if (lockPeriodDays >= 90) tier = 'SILVER';

    // Create staking record (without Web3 integration for now)
    const stakingRecord = await prisma.stakingRecord.create({
      data: {
        userId,
        userAddress: '', // Will be populated when Web3 integration is complete
        amount: Number(amount),
        tier: tier as any,
        lockPeriodDays: Number(lockPeriodDays),
        unlocksAt: unlockDate,
        stakeTransactionHash: `pending_${Date.now()}`, // Temporary hash
        status: 'PENDING' as any,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        stakingRecord: {
          ...stakingRecord,
          amount: Number(stakingRecord.amount), // Convert Decimal
        },
        message: 'Staking position created (Web3 integration pending)',
      },
      message: 'Staking position created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/web3/analytics:
 *   get:
 *     summary: Get Web3 platform analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Platform analytics retrieved successfully
 */
export const getWeb3Analytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get platform statistics
    const [
      totalProjects,
      totalContributions,
      totalNFTRewards,
      totalStakingRecords,
      totalContributionAmount,
      totalStakedAmount
    ] = await Promise.all([
      prisma.project.count(),
      prisma.contribution.count(),
      prisma.nFTReward.count(),
      prisma.stakingRecord.count(),
      prisma.contribution.aggregate({
        _sum: { amount: true }
      }),
      prisma.stakingRecord.aggregate({
        _sum: { amount: true }
      })
    ]);

    const analytics = {
      projects: {
        total: totalProjects,
        funded: await prisma.project.count({ where: { status: 'FUNDED' } }),
        active: await prisma.project.count({ where: { status: 'ACTIVE' } }),
      },
      contributions: {
        total: totalContributions,
        totalAmount: Number(totalContributionAmount._sum.amount || 0),
      },
      nftRewards: {
        total: totalNFTRewards,
        byTier: {
          bronze: await prisma.nFTReward.count({ where: { tier: 'BRONZE' } }),
          silver: await prisma.nFTReward.count({ where: { tier: 'SILVER' } }),
          gold: await prisma.nFTReward.count({ where: { tier: 'GOLD' } }),
          diamond: await prisma.nFTReward.count({ where: { tier: 'DIAMOND' } }),
        }
      },
      staking: {
        totalPositions: totalStakingRecords,
        totalStaked: Number(totalStakedAmount._sum.amount || 0),
        activeStakes: await prisma.stakingRecord.count({ where: { status: 'ACTIVE' } }),
      }
    };

    const response: ApiResponse = {
      success: true,
      data: analytics,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Simplified placeholder functions
export const getNFTDetails = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'NFT details endpoint - to be implemented with Web3 integration'
  });
};

export const unstakeTokens = async (req: any, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Unstaking endpoint - to be implemented with Web3 integration'
  });
};
