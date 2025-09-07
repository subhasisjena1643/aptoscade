// server/routes/gameResults.js
// REST API routes for game results and statistics

const express = require('express')
const GameResult = require('../models/GameResult')
const router = express.Router()

// GET /api/game-results - Get recent game results with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const results = await GameResult.find()
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await GameResult.countDocuments()

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching game results:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game results'
    })
  }
})

// GET /api/game-results/player/:userId - Get results for specific player
router.get('/player/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const limit = parseInt(req.query.limit) || 10

    const results = await GameResult.findByPlayer(userId, limit)

    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error fetching player results:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player results'
    })
  }
})

// GET /api/game-results/player/:userId/stats - Get player statistics
router.get('/player/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params
    const stats = await GameResult.getPlayerStats(userId)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching player stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player statistics'
    })
  }
})

// GET /api/game-results/leaderboard - Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const leaderboard = await GameResult.getLeaderboard(limit)

    res.json({
      success: true,
      data: leaderboard
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    })
  }
})

// POST /api/game-results - Create new game result
router.post('/', async (req, res) => {
  try {
    const {
      roomId,
      players,
      winner,
      duration,
      startTime,
      endTime
    } = req.body

    // Validate required fields
    if (!roomId || !players || !winner || !duration || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      })
    }

    // Validate players array
    if (!Array.isArray(players) || players.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Exactly 2 players required'
      })
    }

    // Mark winner in players array
    const processedPlayers = players.map(player => ({
      ...player,
      isWinner: player.userId === winner.userId
    }))

    const gameResult = new GameResult({
      roomId,
      players: processedPlayers,
      winner,
      duration,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    })

    await gameResult.save()

    res.status(201).json({
      success: true,
      data: gameResult
    })
  } catch (error) {
    console.error('Error creating game result:', error)
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Game result already exists for this room'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create game result'
    })
  }
})

// GET /api/game-results/:roomId - Get specific game result
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params
    const result = await GameResult.findOne({ roomId }).lean()

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Game result not found'
      })
    }

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching game result:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game result'
    })
  }
})

// GET /api/game-results/stats/summary - Get overall game statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await GameResult.aggregate([
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalPlayers: { $addToSet: '$players.userId' },
          averageDuration: { $avg: '$duration' },
          totalTaps: { $sum: '$metadata.totalTaps' },
          averageTapsPerGame: { $avg: '$metadata.totalTaps' }
        }
      },
      {
        $addFields: {
          totalUniquePlayers: { $size: '$totalPlayers' },
          averageDurationSeconds: { $round: [{ $divide: ['$averageDuration', 1000] }, 1] }
        }
      },
      {
        $project: {
          _id: 0,
          totalPlayers: 0
        }
      }
    ])

    const summary = stats[0] || {
      totalGames: 0,
      totalUniquePlayers: 0,
      averageDuration: 0,
      averageDurationSeconds: 0,
      totalTaps: 0,
      averageTapsPerGame: 0
    }

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('Error fetching game stats summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game statistics'
    })
  }
})

module.exports = router
