import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { web3Service } from '../services/web3Service';
import { ApiResponse } from '../types';
import logger from '../utils/logger';

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - targetAmount
 *         - deadline
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *         targetAmount:
 *           type: number
 *         deadline:
 *           type: string
 *           format: date-time
 *         nftRewardsEnabled:
 *           type: boolean
 *         stakingEnabled:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all crowdfunding projects
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, FUNDED, CANCELLED, COMPLETED]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 */
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true,
              aptosAddress: true,
            },
          },
          contributions: {
            select: {
              amount: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    // Enhance with Web3 analytics if enabled
    const enhancedProjects = await Promise.all(
      projects.map(async (project) => {
        let analytics = null;
        if (web3Service.isEnabled() && project.blockchainId) {
          try {
            // analytics = await web3Service.getProjectAnalytics(project.blockchainId);
            analytics = null; // Skip for now since this method doesn't exist in our interface
          } catch (error) {
            logger.warn('Failed to fetch Web3 analytics for project', project.id);
          }
        }

        return {
          ...project,
          analytics,
          progress: Number(project.targetAmount) > 0 
            ? Number(((Number(project.currentAmount) / Number(project.targetAmount)) * 100).toFixed(2))
            : 0,
        };
      })
    );

    const response: ApiResponse = {
      success: true,
      data: enhancedProjects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new crowdfunding project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Invalid project data
 */
export const createProject = async (req: any, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      targetAmount,
      deadline,
      imageUrl,
      nftRewardsEnabled = true,
      stakingEnabled = true,
      governanceEnabled = true,
    } = req.body;

    const userId = req.user.id;

    // Get user for creator address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aptosAddress: true, keylessAddress: true },
    });

    const creatorAddress = user?.aptosAddress || user?.keylessAddress;
    
    if (!creatorAddress && web3Service.isEnabled()) {
      res.status(400).json({
        success: false,
        message: 'User must have a blockchain address to create projects',
      });
      return;
    }

    // Calculate duration in days
    const durationDays = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    let web3Result = null;
    
    // Create project on blockchain if Web3 is enabled
    if (web3Service.isEnabled() && creatorAddress) {
      try {
        web3Result = await web3Service.createProject({
          title,
          description,
          targetAmount: Number(targetAmount),
          durationDays,
          creatorAddress,
          enableRewards: nftRewardsEnabled,
        });
      } catch (error) {
        logger.error('Failed to create project on blockchain:', error);
        // Continue with database creation even if blockchain fails
      }
    }

    // Convert target amount to USD if possible (skip for now as we don't have convertAPTToUSD)
    let targetAmountUSD = null;
    // if (web3Service.isEnabled()) {
    //   try {
    //     targetAmountUSD = await web3Service.convertAPTToUSD(Number(targetAmount));
    //   } catch (error) {
    //     console.warn('Failed to convert APT to USD:', error);
    //   }
    // }

    // Create project in database
    const project = await prisma.project.create({
      data: {
        title,
        description,
        category: category || 'Technology',
        targetAmount: Number(targetAmount),
        targetAmountUSD,
        deadline: new Date(deadline),
        imageUrl,
        creatorId: userId,
        creatorAddress: creatorAddress || '',
        blockchainId: web3Result?.projectId?.toString() || '',
        transactionHash: web3Result?.transactionHash,
        nftCollectionAddress: web3Result?.projectId ? `nft_collection_${web3Result.projectId}` : null,
        nftRewardsEnabled,
        stakingEnabled,
        governanceEnabled,
        status: web3Result ? 'ACTIVE' : 'DRAFT',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
            aptosAddress: true,
          },
        },
      },
    });

    // Update user stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalProjectsCreated: {
          increment: 1,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        ...project,
        web3: web3Result,
      },
      message: 'Project created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID with Web3 analytics
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *       404:
 *         description: Project not found
 */
export const getProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
            aptosAddress: true,
            keylessAddress: true,
          },
        },
        contributions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            nftReward: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        nftRewards: {
          include: {
            owner: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        milestones: {
          include: {
            votes: {
              include: {
                voter: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
          orderBy: { proposedAt: 'desc' },
        },
      },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    // Get Web3 analytics if available
    let analytics = null;
    if (web3Service.isEnabled() && project.blockchainId) {
      try {
        // analytics = await web3Service.getProjectAnalytics(project.blockchainId);
        analytics = null; // Skip for now since this method doesn't exist in our interface
      } catch (error) {
        logger.warn('Failed to fetch Web3 analytics:', error);
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        ...project,
        analytics,
        progress: Number(project.targetAmount) > 0 
          ? Number(((Number(project.currentAmount) / Number(project.targetAmount)) * 100).toFixed(2))
          : 0,
        daysLeft: Math.max(0, Math.ceil(
          (project.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/projects/{id}/contribute:
 *   post:
 *     summary: Contribute to a project with NFT rewards
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               anonymous:
 *                 type: boolean
 *               autoStake:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Contribution successful
 *       404:
 *         description: Project not found
 */
export const contributeToProject = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const { amount, anonymous = false, autoStake = false } = req.body;
    const userId = req.user.id;

    // Check if project exists and is active
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    if (project.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        message: 'Project is not accepting contributions',
      });
      return;
    }

    // Get contributor address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aptosAddress: true, keylessAddress: true },
    });

    const contributorAddress = user?.aptosAddress || user?.keylessAddress;

    if (!contributorAddress && web3Service.isEnabled()) {
      res.status(400).json({
        success: false,
        message: 'User must have a blockchain address to contribute',
      });
      return;
    }

    let web3Result = null;
    
    // Process contribution on blockchain if Web3 is enabled
    if (web3Service.isEnabled() && contributorAddress) {
      try {
        web3Result = await web3Service.processContribution({
          projectId: (parseInt(project.blockchainId || '0') || project.id) as number,
          contributorAddress: contributorAddress || '',
          amount: Number(amount),
        });
      } catch (error) {
        logger.error('Failed to process contribution on blockchain:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to process blockchain transaction',
        });
        return;
      }
    }

    // Convert amount to USD if possible (skip for now)
    let amountUSD = null;
    // if (web3Service.isEnabled()) {
    //   try {
    //     amountUSD = await web3Service.convertAPTToUSD(Number(amount));
    //   } catch (error) {
    //     console.warn('Failed to convert APT to USD:', error);
    //   }
    // }

    // Create contribution record
    const contribution = await prisma.contribution.create({
      data: {
        userId,
        projectId,
        amount: Number(amount),
        amountUSD,
        contributorAddress: contributorAddress || '',
        transactionHash: web3Result?.transactionHash || `offline_${Date.now()}`,
        status: web3Result ? 'CONFIRMED' : 'PENDING',
        sponsored: false, // Remove web3Result?.sponsored since it doesn't exist in our interface
        anonymous,
      },
    });

    // Create NFT reward if applicable
    let nftReward = null;
    if (web3Result?.rewardNFT && project.nftRewardsEnabled) {
      nftReward = await prisma.nFTReward.create({
        data: {
          tokenAddress: web3Result.rewardNFT.tokenId,
          tokenId: web3Result.rewardNFT.tokenId.split('_')[2] || '1',
          collectionAddress: project.nftCollectionAddress || '',
          tier: 'BRONZE' as any, // Default tier
          ownerId: userId,
          projectId,
          contributionId: contribution.id,
          mintTransactionHash: web3Result.transactionHash || '',
          name: `${project.title} - Contributor NFT`,
          description: `NFT reward for contributing ${amount} APT to ${project.title}`,
          imageUrl: project.imageUrl,
        },
      });

      // Update contribution with NFT reward
      await prisma.contribution.update({
        where: { id: contribution.id },
        data: {
          nftRewardId: nftReward.id,
          nftRewardTier: 'BRONZE' as any, // Default tier
        },
      });
    }

    // Create staking record if auto-stake is enabled (skip for now as interface doesn't match)
    let stakingRecord = null;
    // if (web3Result?.stakingRecord && autoStake) {
    //   const unlockDate = new Date();
    //   unlockDate.setDate(unlockDate.getDate() + (web3Result.stakingRecord.lockDays || 30));

    //   stakingRecord = await prisma.stakingRecord.create({
    //     data: {
    //       userId,
    //       userAddress: contributorAddress || '',
    //       amount: web3Result.stakingRecord.amount,
    //       tier: web3Result.stakingRecord.tier as any,
    //       lockPeriodDays: web3Result.stakingRecord.lockPeriodDays || 30,
    //       unlocksAt: unlockDate,
    //       stakeTransactionHash: web3Result.stakingRecord.stakeTransactionHash,
    //       status: 'ACTIVE',
    //     },
    //   });
    // }

    // Update project and user statistics
    await Promise.all([
      prisma.project.update({
        where: { id: projectId },
        data: {
          currentAmount: {
            increment: Number(amount),
          },
          uniqueContributors: {
            increment: 1,
          },
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          totalContributed: {
            increment: Number(amount),
          },
          totalProjectsBacked: {
            increment: 1,
          },
          stakedAmount: stakingRecord ? {
            increment: 0, // Since stakingRecord is null, use 0
          } : undefined,
        },
      }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        contribution,
        nftReward,
        stakingRecord,
        web3: web3Result,
      },
      message: 'Contribution successful',
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Contribute to project error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
