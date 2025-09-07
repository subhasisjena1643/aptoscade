import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { web3Service } from '../services/web3Service';
import { ApiResponse } from '../types';

/**
 * @swagger
 * /api/v1/governance/proposals:
 *   get:
 *     summary: Get all governance proposals
 *     tags: [Governance]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, PASSED, REJECTED, EXECUTED]
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proposals retrieved successfully
 */
export const getProposals = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, projectId } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const proposals = await prisma.milestone.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
            creatorId: true,
          },
        },
        proposer: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        votes: {
          include: {
            voter: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: { proposedAt: 'desc' },
    });

    // Calculate voting statistics
    const enhancedProposals = proposals.map((proposal) => {
      const yesVotes = proposal.votes.filter(vote => vote.support).length;
      const noVotes = proposal.votes.filter(vote => !vote.support).length;
      const totalVotes = yesVotes + noVotes;

      return {
        ...proposal,
        votingStats: {
          yesVotes,
          noVotes,
          totalVotes,
          yesPercentage: totalVotes > 0 ? Math.round((yesVotes / totalVotes) * 100) : 0,
          participationRate: totalVotes, // This would need total eligible voters in real implementation
        },
        daysLeft: Math.max(0, Math.ceil(
          (proposal.votingEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )),
      };
    });

    const response: ApiResponse = {
      success: true,
      data: enhancedProposals,
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
 * /api/v1/governance/proposals:
 *   post:
 *     summary: Create a new governance proposal
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - title
 *               - description
 *               - milestoneAmount
 *               - votingDurationDays
 *             properties:
 *               projectId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               milestoneAmount:
 *                 type: number
 *               votingDurationDays:
 *                 type: number
 *               evidenceUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proposal created successfully
 */
export const createProposal = async (req: any, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      title,
      description,
      milestoneAmount,
      votingDurationDays = 7,
      evidenceUrl,
    } = req.body;
    const userId = req.user.id;

    // Check if project exists and if user has permission to create proposals
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: true,
        contributions: {
          where: { userId },
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

    // Check if user is project creator or a significant contributor
    const isCreator = project.creatorId === userId;
    const totalContributed = project.contributions.reduce((sum, c) => sum + c.amount, 0);
    const isSignificantContributor = totalContributed >= (project.targetAmount * 0.05); // 5% threshold

    if (!isCreator && !isSignificantContributor) {
      res.status(403).json({
        success: false,
        message: 'Only project creators or significant contributors can create proposals',
      });
      return;
    }

    // Calculate voting end date
    const votingEndsAt = new Date();
    votingEndsAt.setDate(votingEndsAt.getDate() + votingDurationDays);

    let web3Result = null;

    // Create proposal on blockchain if enabled
    if (web3Service.isEnabled() && project.blockchainId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { aptosAddress: true, keylessAddress: true },
        });

        const proposerAddress = user?.aptosAddress || user?.keylessAddress;

        if (proposerAddress) {
          web3Result = await web3Service.createGovernanceProposal(proposerAddress, {
            projectId: project.blockchainId,
            title,
            description,
            milestoneAmount: Number(milestoneAmount),
            votingDurationDays,
          });
        }
      } catch (error) {
        // Continue with database creation even if blockchain fails
      }
    }

    // Create proposal in database
    const proposal = await prisma.milestone.create({
      data: {
        projectId,
        proposerId: userId,
        title,
        description,
        milestoneAmount: Number(milestoneAmount),
        evidenceUrl,
        proposedAt: new Date(),
        votingEndsAt,
        blockchainId: web3Result?.proposalId,
        transactionHash: web3Result?.transactionHash,
        status: 'ACTIVE',
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        proposer: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: {
        proposal,
        web3: web3Result,
      },
      message: 'Proposal created successfully',
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
 * /api/v1/governance/proposals/{id}/vote:
 *   post:
 *     summary: Vote on a governance proposal
 *     tags: [Governance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Proposal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - support
 *             properties:
 *               support:
 *                 type: boolean
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vote submitted successfully
 *       400:
 *         description: Invalid vote or voting period ended
 *       404:
 *         description: Proposal not found
 */
export const voteOnProposal = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: proposalId } = req.params;
    const { support, reason } = req.body;
    const userId = req.user.id;

    // Check if proposal exists and is still active
    const proposal = await prisma.milestone.findUnique({
      where: { id: proposalId },
      include: {
        project: true,
        votes: {
          where: { voterId: userId },
        },
      },
    });

    if (!proposal) {
      res.status(404).json({
        success: false,
        message: 'Proposal not found',
      });
      return;
    }

    if (proposal.status !== 'ACTIVE') {
      res.status(400).json({
        success: false,
        message: 'Proposal is not active for voting',
      });
      return;
    }

    if (proposal.votingEndsAt < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Voting period has ended',
      });
      return;
    }

    // Check if user has already voted
    if (proposal.votes.length > 0) {
      res.status(400).json({
        success: false,
        message: 'User has already voted on this proposal',
      });
      return;
    }

    // Calculate voting power based on user's contributions to the project
    const userContributions = await prisma.contribution.findMany({
      where: {
        userId,
        projectId: proposal.projectId,
        status: 'CONFIRMED',
      },
    });

    const votingPower = userContributions.reduce((sum, contribution) => sum + contribution.amount, 0);

    if (votingPower === 0) {
      res.status(403).json({
        success: false,
        message: 'Only project contributors can vote',
      });
      return;
    }

    let web3Result = null;

    // Submit vote on blockchain if enabled
    if (web3Service.isEnabled() && proposal.blockchainId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { aptosAddress: true, keylessAddress: true },
        });

        const voterAddress = user?.aptosAddress || user?.keylessAddress;

        if (voterAddress) {
          web3Result = await web3Service.voteOnProposal(voterAddress, {
            proposalId: proposal.blockchainId,
            support,
            votingPower,
          });
        }
      } catch (error) {
        // Continue with database vote even if blockchain fails
      }
    }

    // Create vote record
    const vote = await prisma.governanceVote.create({
      data: {
        milestoneId: proposalId,
        voterId: userId,
        voterAddress: '', // Would be set from user data in real implementation
        support,
        votingPower,
        reason,
        transactionHash: web3Result?.transactionHash,
      },
      include: {
        voter: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Update proposal vote counts
    const allVotes = await prisma.governanceVote.findMany({
      where: { milestoneId: proposalId },
    });

    const yesVotes = allVotes.filter(v => v.support).length;
    const noVotes = allVotes.filter(v => !v.support).length;
    const totalVotingPower = allVotes.reduce((sum, v) => sum + v.votingPower, 0);

    // Check if proposal should be decided (simple majority for now)
    let newStatus = proposal.status;
    const totalVotes = yesVotes + noVotes;
    
    if (totalVotes >= 10 || proposal.votingEndsAt < new Date()) { // Minimum votes threshold
      newStatus = yesVotes > noVotes ? 'PASSED' : 'REJECTED';
    }

    // Update proposal if status changed
    if (newStatus !== proposal.status) {
      await prisma.milestone.update({
        where: { id: proposalId },
        data: { status: newStatus },
      });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        vote,
        proposalStatus: newStatus,
        votingStats: {
          yesVotes,
          noVotes,
          totalVotes,
          totalVotingPower,
        },
        web3: web3Result,
      },
      message: 'Vote submitted successfully',
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
 * /api/v1/governance/proposals/{id}:
 *   get:
 *     summary: Get proposal details with voting information
 *     tags: [Governance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Proposal ID
 *     responses:
 *       200:
 *         description: Proposal details retrieved successfully
 *       404:
 *         description: Proposal not found
 */
export const getProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const proposal = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            category: true,
            creatorId: true,
            currentAmount: true,
            targetAmount: true,
          },
        },
        proposer: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        votes: {
          include: {
            voter: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!proposal) {
      res.status(404).json({
        success: false,
        message: 'Proposal not found',
      });
      return;
    }

    // Calculate detailed voting statistics
    const yesVotes = proposal.votes.filter(vote => vote.support);
    const noVotes = proposal.votes.filter(vote => !vote.support);
    const totalVotingPower = proposal.votes.reduce((sum, vote) => sum + vote.votingPower, 0);
    const yesVotingPower = yesVotes.reduce((sum, vote) => sum + vote.votingPower, 0);

    const response: ApiResponse = {
      success: true,
      data: {
        ...proposal,
        votingStats: {
          yesVotes: yesVotes.length,
          noVotes: noVotes.length,
          totalVotes: proposal.votes.length,
          yesVotingPower,
          noVotingPower: totalVotingPower - yesVotingPower,
          totalVotingPower,
          yesPercentage: totalVotingPower > 0 
            ? Math.round((yesVotingPower / totalVotingPower) * 100)
            : 0,
        },
        timeLeft: {
          daysLeft: Math.max(0, Math.ceil(
            (proposal.votingEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )),
          hoursLeft: Math.max(0, Math.ceil(
            (proposal.votingEndsAt.getTime() - Date.now()) / (1000 * 60 * 60)
          )),
          isActive: proposal.votingEndsAt > new Date(),
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
