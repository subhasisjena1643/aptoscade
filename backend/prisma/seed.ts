import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample games
  const games = await Promise.all([
    prisma.game.upsert({
      where: { name: 'Snake Classic' },
      update: {},
      create: {
        name: 'Snake Classic',
        description: 'Classic snake game with modern twist',
        category: 'Arcade',
        minScore: 0,
        maxScore: 10000,
        isActive: true,
        metadata: {
          difficulty: 'medium',
          controls: 'arrow_keys',
          powerups: ['speed', 'score_multiplier'],
        },
      },
    }),
    prisma.game.upsert({
      where: { name: 'Tetris Blocks' },
      update: {},
      create: {
        name: 'Tetris Blocks',
        description: 'Stack blocks and clear lines to score points',
        category: 'Puzzle',
        minScore: 0,
        maxScore: 50000,
        isActive: true,
        metadata: {
          difficulty: 'hard',
          controls: 'keyboard',
          levels: 10,
        },
      },
    }),
    prisma.game.upsert({
      where: { name: 'Space Shooter' },
      update: {},
      create: {
        name: 'Space Shooter',
        description: 'Defend against alien invasion',
        category: 'Action',
        minScore: 0,
        maxScore: 25000,
        isActive: true,
        metadata: {
          difficulty: 'easy',
          controls: 'mouse_keyboard',
          weapons: ['laser', 'plasma', 'missile'],
        },
      },
    }),
    prisma.game.upsert({
      where: { name: 'Puzzle Master' },
      update: {},
      create: {
        name: 'Puzzle Master',
        description: 'Solve challenging puzzles to earn points',
        category: 'Puzzle',
        minScore: 0,
        maxScore: 15000,
        isActive: true,
        metadata: {
          difficulty: 'hard',
          controls: 'mouse',
          puzzleTypes: ['logic', 'pattern', 'memory'],
        },
      },
    }),
    prisma.game.upsert({
      where: { name: 'Racing Thunder' },
      update: {},
      create: {
        name: 'Racing Thunder',
        description: 'High-speed racing action',
        category: 'Racing',
        minScore: 0,
        maxScore: 30000,
        isActive: true,
        metadata: {
          difficulty: 'medium',
          controls: 'keyboard',
          tracks: ['city', 'desert', 'mountain'],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${games.length} games`);

  // Create sample achievements
  const achievements = await Promise.all([
    prisma.achievement.upsert({
      where: { name: 'First Steps' },
      update: {},
      create: {
        name: 'First Steps',
        description: 'Play your first game',
        category: 'Beginner',
        points: 10,
        conditions: {
          type: 'games_played',
          value: 1,
        },
        isActive: true,
      },
    }),
    prisma.achievement.upsert({
      where: { name: 'Score Hunter' },
      update: {},
      create: {
        name: 'Score Hunter',
        description: 'Reach 1000 total points',
        category: 'Scoring',
        points: 50,
        conditions: {
          type: 'total_score',
          value: 1000,
        },
        isActive: true,
      },
    }),
    prisma.achievement.upsert({
      where: { name: 'Game Master' },
      update: {},
      create: {
        name: 'Game Master',
        description: 'Play 10 different games',
        category: 'Exploration',
        points: 100,
        conditions: {
          type: 'games_played',
          value: 10,
        },
        isActive: true,
      },
    }),
    prisma.achievement.upsert({
      where: { name: 'High Scorer' },
      update: {},
      create: {
        name: 'High Scorer',
        description: 'Achieve a score of 5000 in any game',
        category: 'Scoring',
        points: 75,
        conditions: {
          type: 'single_game_score',
          value: 5000,
        },
        isActive: true,
      },
    }),
    prisma.achievement.upsert({
      where: { name: 'Dedicated Player' },
      update: {},
      create: {
        name: 'Dedicated Player',
        description: 'Play games for 7 consecutive days',
        category: 'Dedication',
        points: 150,
        conditions: {
          type: 'consecutive_days',
          value: 7,
        },
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${achievements.length} achievements`);

  // Create some configuration entries
  const configs = await Promise.all([
    prisma.config.upsert({
      where: { key: 'daily_reward_amount' },
      update: {},
      create: {
        key: 'daily_reward_amount',
        value: '100',
      },
    }),
    prisma.config.upsert({
      where: { key: 'max_scores_per_game_per_day' },
      update: {},
      create: {
        key: 'max_scores_per_game_per_day',
        value: '10',
      },
    }),
    prisma.config.upsert({
      where: { key: 'leaderboard_refresh_interval' },
      update: {},
      create: {
        key: 'leaderboard_refresh_interval',
        value: '3600', // 1 hour in seconds
      },
    }),
    prisma.config.upsert({
      where: { key: 'maintenance_mode' },
      update: {},
      create: {
        key: 'maintenance_mode',
        value: 'false',
      },
    }),
  ]);

  console.log(`✅ Created ${configs.length} configuration entries`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
