// server/socket/raceHandler.js
// Socket.IO event handlers for 1v1 tap racing game

const { v4: uuidv4 } = require('uuid')

class RaceGameManager {
  constructor() {
    this.waitingPlayers = new Map() // Players waiting for match
    this.activeGames = new Map()    // Active game rooms
    this.playerRooms = new Map()    // Player ID to room mapping
  }

  // Handle player looking for match
  findMatch(socket, playerData) {
    const { userId, username, avatar } = playerData
    
    console.log(`Player ${username} looking for match`)
    
    // Check if there's a waiting player
    if (this.waitingPlayers.size > 0) {
      // Match found! Create game room
      const waitingPlayer = this.waitingPlayers.values().next().value
      this.waitingPlayers.delete(waitingPlayer.userId)
      
      const roomId = uuidv4()
      const gameRoom = {
        id: roomId,
        players: {
          player1: waitingPlayer,
          player2: { userId, username, avatar, socketId: socket.id, position: 0 }
        },
        status: 'matched',
        startTime: null,
        positions: { [waitingPlayer.userId]: 0, [userId]: 0 },
        tapCounts: { [waitingPlayer.userId]: 0, [userId]: 0 }
      }
      
      this.activeGames.set(roomId, gameRoom)
      this.playerRooms.set(waitingPlayer.userId, roomId)
      this.playerRooms.set(userId, roomId)
      
      // Join both players to room
      socket.join(roomId)
      socket.to(waitingPlayer.socketId).socketsJoin(roomId)
      
      // Notify both players
      socket.to(roomId).emit('matchFound', {
        roomId,
        players: gameRoom.players
      })
      
      socket.emit('matchFound', {
        roomId,
        players: gameRoom.players
      })
      
      // Start countdown after 1 second
      setTimeout(() => this.startCountdown(roomId), 1000)
      
    } else {
      // Add to waiting queue
      this.waitingPlayers.set(userId, {
        userId,
        username,
        avatar,
        socketId: socket.id,
        position: 0
      })
      
      console.log(`Player ${username} added to waiting queue`)
    }
  }

  // Cancel matchmaking
  cancelMatch(socket, userId) {
    if (this.waitingPlayers.has(userId)) {
      this.waitingPlayers.delete(userId)
      console.log(`Player ${userId} cancelled matchmaking`)
    }
  }

  // Start game countdown
  startCountdown(roomId) {
    const gameRoom = this.activeGames.get(roomId)
    if (!gameRoom) return
    
    let countdown = 3
    gameRoom.status = 'countdown'
    
    const countdownInterval = setInterval(() => {
      // Emit countdown to room
      global.io.to(roomId).emit('gameCountdown', { countdown })
      
      countdown--
      
      if (countdown < 0) {
        clearInterval(countdownInterval)
        this.startRace(roomId)
      }
    }, 1000)
  }

  // Start the race
  startRace(roomId) {
    const gameRoom = this.activeGames.get(roomId)
    if (!gameRoom) return
    
    gameRoom.status = 'racing'
    gameRoom.startTime = Date.now()
    
    // Reset positions and tap counts
    Object.keys(gameRoom.players).forEach(playerKey => {
      const player = gameRoom.players[playerKey]
      gameRoom.positions[player.userId] = 0
      gameRoom.tapCounts[player.userId] = 0
    })
    
    global.io.to(roomId).emit('gameStart')
    console.log(`Race started in room ${roomId}`)
  }

  // Handle player tap
  handlePlayerTap(socket, data) {
    const { roomId } = data
    const gameRoom = this.activeGames.get(roomId)
    
    if (!gameRoom || gameRoom.status !== 'racing') return
    
    // Find player by socket ID
    let playerId = null
    Object.values(gameRoom.players).forEach(player => {
      if (player.socketId === socket.id) {
        playerId = player.userId
      }
    })
    
    if (!playerId) return
    
    // Increment tap count and update position
    gameRoom.tapCounts[playerId]++
    
    // Calculate new position (each tap = 2% progress with some randomness)
    const tapBoost = 1.5 + Math.random() * 1.0 // 1.5-2.5% per tap
    gameRoom.positions[playerId] = Math.min(
      gameRoom.positions[playerId] + tapBoost,
      100
    )
    
    // Update player position in game room
    Object.keys(gameRoom.players).forEach(playerKey => {
      const player = gameRoom.players[playerKey]
      if (player.userId === playerId) {
        player.position = gameRoom.positions[playerId]
      }
    })
    
    // Broadcast position update
    global.io.to(roomId).emit('playerMove', {
      playerId,
      position: gameRoom.positions[playerId],
      tapCount: gameRoom.tapCounts[playerId]
    })
    
    // Check for winner
    if (gameRoom.positions[playerId] >= 100) {
      this.endRace(roomId, playerId)
    }
  }

  // End the race
  endRace(roomId, winnerId) {
    const gameRoom = this.activeGames.get(roomId)
    if (!gameRoom) return
    
    gameRoom.status = 'finished'
    gameRoom.winner = winnerId
    gameRoom.endTime = Date.now()
    gameRoom.duration = gameRoom.endTime - gameRoom.startTime
    
    // Emit game end
    global.io.to(roomId).emit('gameEnd', {
      winner: winnerId,
      finalPositions: gameRoom.positions,
      tapCounts: gameRoom.tapCounts,
      duration: gameRoom.duration
    })
    
    console.log(`Race ended in room ${roomId}, winner: ${winnerId}`)
    
    // Save game results to database (implement this)
    this.saveGameResults(gameRoom)
    
    // Clean up room after 30 seconds
    setTimeout(() => {
      this.cleanupRoom(roomId)
    }, 30000)
  }

  // Handle player disconnect
  handleDisconnect(socket) {
    // Find player in waiting queue
    for (const [userId, player] of this.waitingPlayers.entries()) {
      if (player.socketId === socket.id) {
        this.waitingPlayers.delete(userId)
        console.log(`Waiting player ${userId} disconnected`)
        return
      }
    }
    
    // Find player in active games
    for (const [roomId, gameRoom] of this.activeGames.entries()) {
      Object.values(gameRoom.players).forEach(player => {
        if (player.socketId === socket.id) {
          // Handle disconnect during game
          if (gameRoom.status === 'racing') {
            // End game, other player wins
            const otherPlayer = Object.values(gameRoom.players).find(p => p.socketId !== socket.id)
            if (otherPlayer) {
              this.endRace(roomId, otherPlayer.userId)
            }
          } else {
            // Clean up room
            this.cleanupRoom(roomId)
          }
        }
      })
    }
  }

  // Clean up game room
  cleanupRoom(roomId) {
    const gameRoom = this.activeGames.get(roomId)
    if (!gameRoom) return
    
    // Remove player room mappings
    Object.values(gameRoom.players).forEach(player => {
      this.playerRooms.delete(player.userId)
    })
    
    // Remove game room
    this.activeGames.delete(roomId)
    
    console.log(`Cleaned up room ${roomId}`)
  }

  // Save game results to database
  async saveGameResults(gameRoom) {
    try {
      // Implement database save logic here
      const gameResult = {
        roomId: gameRoom.id,
        players: Object.values(gameRoom.players).map(p => ({
          userId: p.userId,
          username: p.username,
          finalPosition: gameRoom.positions[p.userId],
          tapCount: gameRoom.tapCounts[p.userId]
        })),
        winner: gameRoom.winner,
        duration: gameRoom.duration,
        startTime: gameRoom.startTime,
        endTime: gameRoom.endTime
      }
      
      console.log('Game result to save:', gameResult)
      // await GameResult.create(gameResult) // Implement with your database
      
    } catch (error) {
      console.error('Failed to save game results:', error)
    }
  }
}

// Initialize game manager
const raceGameManager = new RaceGameManager()

// Socket.IO event handlers
function setupRaceHandlers(io, socket) {
  // Store io instance globally for access in game manager
  global.io = io
  
  socket.on('findMatch', (data) => {
    raceGameManager.findMatch(socket, data)
  })
  
  socket.on('cancelMatch', (data) => {
    raceGameManager.cancelMatch(socket, data.userId)
  })
  
  socket.on('playerTap', (data) => {
    raceGameManager.handlePlayerTap(socket, data)
  })
  
  socket.on('disconnect', () => {
    raceGameManager.handleDisconnect(socket)
  })
}

module.exports = {
  setupRaceHandlers,
  raceGameManager
}
