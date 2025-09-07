import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiResponse, GameScoreCreateData } from '../types';

/**
 * @swagger
 * /api/v1/games:
 *   get:
 *     summary: Get all games
 *     tags: [Games]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by game category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Games retrieved successfully
 */
export const getGames = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.game.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: games,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/games/{id}:
 *   get:
 *     summary: Get game by ID
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game retrieved successfully
 *       404:
 *         description: Game not found
 */
export const getGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        gameScores: {
          take: 10,
          orderBy: { score: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: game,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/games/{id}/score:
 *   post:
 *     summary: Submit game score
 *     tags: [Games]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: integer
 *               duration:
 *                 type: integer
 *               gameData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Score submitted successfully
 *       404:
 *         description: Game not found
 */
export const submitScore = async (req: any, res: Response): Promise<void> => {
  try {
    const { id: gameId } = req.params;
    const { score, duration, gameData }: Omit<GameScoreCreateData, 'gameId'> = req.body;
    const userId = req.user.id;

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    // Validate score range
    if (score < game.minScore || score > game.maxScore) {
      res.status(400).json({
        success: false,
        message: `Score must be between ${game.minScore} and ${game.maxScore}`,
      });
      return;
    }

    // Create game score
    const gameScore = await prisma.gameScore.create({
      data: {
        userId,
        gameId,
        score,
        duration,
        gameData,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        game: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Update user stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalScore: {
          increment: score,
        },
        gamesPlayed: {
          increment: 1,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: gameScore,
      message: 'Score submitted successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/v1/games/{id}/scores:
 *   get:
 *     summary: Get game scores
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Game ID
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
 *         description: Scores retrieved successfully
 */
export const getGameScores = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: gameId } = req.params;
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [scores, total] = await Promise.all([
      prisma.gameScore.findMany({
        where: { gameId },
        skip,
        take: limitNum,
        orderBy: { score: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.gameScore.count({ where: { gameId } }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: scores,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Get game scores error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
