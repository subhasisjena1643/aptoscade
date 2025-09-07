import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', authenticate, async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        aptosAddress: true,
        totalScore: true,
        gamesPlayed: true,
        achievements: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: any, res: Response) => {
  try {
    const { username, avatar, aptosAddress } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username && { username }),
        ...(avatar && { avatar }),
        ...(aptosAddress && { aptosAddress }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        aptosAddress: true,
        totalScore: true,
        gamesPlayed: true,
        achievements: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get user game history
router.get('/games', authenticate, async (req: any, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [gameScores, total] = await Promise.all([
      prisma.gameScore.findMany({
        where: { userId: req.user.id },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          game: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
      prisma.gameScore.count({ where: { userId: req.user.id } }),
    ]);

    res.json({
      success: true,
      data: gameScores,
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
