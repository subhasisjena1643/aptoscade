import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { LeaderboardPeriod } from '../types';

const router = Router();

// Get leaderboard for a specific game and period
router.get('/:gameId', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { period = 'ALL_TIME', page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const leaderboard = await prisma.leaderboardEntry.findMany({
      where: {
        gameId,
        period: period as LeaderboardPeriod,
      },
      skip,
      take: limitNum,
      orderBy: { rank: 'asc' },
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

    const total = await prisma.leaderboardEntry.count({
      where: {
        gameId,
        period: period as LeaderboardPeriod,
      },
    });

    res.json({
      success: true,
      data: leaderboard,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get global leaderboard (all games)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get top players by total score
    const topPlayers = await prisma.user.findMany({
      skip,
      take: limitNum,
      orderBy: { totalScore: 'desc' },
      select: {
        id: true,
        username: true,
        avatar: true,
        totalScore: true,
        gamesPlayed: true,
        achievements: true,
        createdAt: true,
      },
    });

    const total = await prisma.user.count();

    // Add rank to each player
    const playersWithRank = topPlayers.map((player, index) => ({
      ...player,
      rank: skip + index + 1,
    }));

    res.json({
      success: true,
      data: playersWithRank,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
