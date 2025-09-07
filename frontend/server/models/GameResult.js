// server/models/GameResult.js
// Mongoose schema for storing race game results

const mongoose = require('mongoose')

const PlayerResultSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  finalPosition: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  tapCount: {
    type: Number,
    required: true,
    min: 0
  },
  isWinner: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const GameResultSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  gameType: {
    type: String,
    default: 'tap_racing',
    enum: ['tap_racing']
  },
  players: [PlayerResultSchema],
  winner: {
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    }
  },
  duration: {
    type: Number, // milliseconds
    required: true,
    min: 0
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  metadata: {
    totalTaps: {
      type: Number,
      default: 0
    },
    averageTapsPerSecond: {
      type: Number,
      default: 0
    },
    maxPosition: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true,
  collection: 'game_results'
})

// Indexes for efficient queries
GameResultSchema.index({ 'players.userId': 1 })
GameResultSchema.index({ 'winner.userId': 1 })
GameResultSchema.index({ startTime: -1 })
GameResultSchema.index({ duration: 1 })
GameResultSchema.index({ gameType: 1, startTime: -1 })

// Virtual for game duration in seconds
GameResultSchema.virtual('durationSeconds').get(function() {
  return Math.round(this.duration / 1000)
})

// Static methods for querying
GameResultSchema.statics.findByPlayer = function(userId, limit = 10) {
  return this.find({ 'players.userId': userId })
    .sort({ startTime: -1 })
    .limit(limit)
}

GameResultSchema.statics.findWinsByPlayer = function(userId, limit = 10) {
  return this.find({ 'winner.userId': userId })
    .sort({ startTime: -1 })
    .limit(limit)
}

GameResultSchema.statics.getPlayerStats = async function(userId) {
  const results = await this.aggregate([
    { $match: { 'players.userId': userId } },
    { $unwind: '$players' },
    { $match: { 'players.userId': userId } },
    {
      $group: {
        _id: '$players.userId',
        totalGames: { $sum: 1 },
        totalWins: {
          $sum: {
            $cond: [{ $eq: ['$winner.userId', userId] }, 1, 0]
          }
        },
        totalTaps: { $sum: '$players.tapCount' },
        averagePosition: { $avg: '$players.finalPosition' },
        averageDuration: { $avg: '$duration' },
        bestTime: { $min: '$duration' },
        maxTaps: { $max: '$players.tapCount' }
      }
    },
    {
      $addFields: {
        winRate: {
          $round: [
            { $multiply: [{ $divide: ['$totalWins', '$totalGames'] }, 100] },
            2
          ]
        },
        averageTapsPerGame: {
          $round: [{ $divide: ['$totalTaps', '$totalGames'] }, 0]
        }
      }
    }
  ])

  return results[0] || {
    _id: userId,
    totalGames: 0,
    totalWins: 0,
    totalTaps: 0,
    averagePosition: 0,
    averageDuration: 0,
    bestTime: 0,
    maxTaps: 0,
    winRate: 0,
    averageTapsPerGame: 0
  }
}

GameResultSchema.statics.getLeaderboard = function(limit = 10) {
  return this.aggregate([
    { $unwind: '$players' },
    {
      $group: {
        _id: '$players.userId',
        username: { $first: '$players.username' },
        totalGames: { $sum: 1 },
        totalWins: {
          $sum: {
            $cond: [{ $eq: ['$winner.userId', '$players.userId'] }, 1, 0]
          }
        },
        totalTaps: { $sum: '$players.tapCount' },
        averagePosition: { $avg: '$players.finalPosition' },
        bestTime: { $min: '$duration' }
      }
    },
    {
      $addFields: {
        winRate: {
          $round: [
            { $multiply: [{ $divide: ['$totalWins', '$totalGames'] }, 100] },
            2
          ]
        }
      }
    },
    { $match: { totalGames: { $gte: 3 } } }, // Minimum 3 games to appear on leaderboard
    { $sort: { winRate: -1, totalWins: -1 } },
    { $limit: limit }
  ])
}

// Instance methods
GameResultSchema.methods.calculateMetadata = function() {
  const totalTaps = this.players.reduce((sum, player) => sum + player.tapCount, 0)
  const durationSeconds = this.duration / 1000
  const averageTapsPerSecond = durationSeconds > 0 ? totalTaps / durationSeconds : 0

  this.metadata = {
    totalTaps,
    averageTapsPerSecond: Math.round(averageTapsPerSecond * 100) / 100,
    maxPosition: Math.max(...this.players.map(p => p.finalPosition))
  }

  return this
}

// Pre-save middleware to calculate metadata
GameResultSchema.pre('save', function(next) {
  if (this.isNew) {
    this.calculateMetadata()
  }
  next()
})

const GameResult = mongoose.model('GameResult', GameResultSchema)

module.exports = GameResult
