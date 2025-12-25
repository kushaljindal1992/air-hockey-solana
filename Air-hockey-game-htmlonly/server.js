const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Load blockchain configuration
let blockchainConfig = null;
try {
  blockchainConfig = JSON.parse(fs.readFileSync('../admin-config.json', 'utf-8'));
  console.log('✅ Loaded blockchain configuration');
} catch (error) {
  console.warn('⚠️  Blockchain config not found. Running without Web3 features.');
}

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the main game file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Game rooms storage
const rooms = new Map();

// Matchmaking queue - stores players searching for matches
// Key: stake amount (in SOL), Value: array of waiting players
const matchmakingQueue = new Map();

// Track online players count
let onlinePlayers = 0;

// Generate random room ID
function generateRoomId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Room class to manage game state
class GameRoom {
  constructor(roomId, gameId = null, stakeAmount = 0) {
    this.roomId = roomId;
    this.players = [];
    this.gameState = {
      ball: { x: 500, y: 300, vx: 0, vy: 0 },
      paddles: {
        player1: { x: 150, y: 300 },
        player2: { x: 850, y: 300 }
      },
      scores: { player1: 0, player2: 0 },
      gameStarted: false,
      gameRunning: false
    };
    this.lastUpdate = Date.now();
    
    // Blockchain tracking
    this.gameId = gameId;
    this.stakeAmount = stakeAmount;
    this.gameCompleted = false;
    this.winner = null;
    
    // Enhanced tracking for security
    this.gameStartTime = null;
    this.gameEndTime = null;
    this.serverScores = { player1: 0, player2: 0 }; // Server-side score tracking
    this.gameActive = false;
    
    // Store wallet addresses for blockchain payout
    this.walletAddresses = { player1: null, player2: null };
    
    // Rate limiting for anti-spam
    this.ballUpdateCount = 0;
    this.lastBallUpdateReset = Date.now();
    this.MAX_BALL_UPDATES_PER_SECOND = 120; // Max 120 updates/sec (2x game loop)
    
    // Inactivity/AFK detection
    this.lastActivityTime = { player1: Date.now(), player2: Date.now() };
    this.INACTIVITY_TIMEOUT = 60000; // 60 seconds of no activity = forfeit
    this.activityCheckInterval = null;
    
    // Matchmaking timeout
    this.matchmakingTimeout = null;
    this.MATCHMAKING_TIMEOUT_MS = 300000; // 5 minutes
    
    // Disconnect/forfeit handling
    this.gameForfeited = false;
    this.forfeitReason = null;
  }

  addPlayer(socket, walletAddress = null, playerName = null) {
    if (this.players.length >= 2) {
      return false; // Room is full
    }

    const playerNumber = this.players.length + 1;
    const player = {
      id: socket.id,
      socket: socket,
      playerNumber: playerNumber,
      role: playerNumber === 1 ? 'host' : 'guest',
      name: playerName || `Player ${playerNumber}`,
      walletAddress: walletAddress
    };

    this.players.push(player);
    socket.join(this.roomId);
    
    // Store wallet address for blockchain payout
    if (walletAddress) {
      this.walletAddresses[`player${playerNumber}`] = walletAddress;
    }

    // Notify player of their role
    socket.emit('playerAssigned', {
      playerNumber: playerNumber,
      role: player.role,
      roomId: this.roomId
    });

    // If room is full, start the game
    if (this.players.length === 2) {
      this.startGame();
    }

    return true;
  }

  removePlayer(socketId) {
    const playerIndex = this.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
      const disconnectedPlayer = this.players[playerIndex];
      const remainingPlayer = this.players.find(p => p.id !== socketId);
      
      // If game is active, disconnected player forfeits
      if (this.gameActive && !this.gameCompleted && remainingPlayer) {
        console.log(`⚠️  Player ${disconnectedPlayer.playerNumber} disconnected during active game - FORFEIT`);
        console.log(`   Game ID: ${this.gameId}`);
        console.log(`   Stake: ${this.stakeAmount} SOL`);
        console.log(`   Winner: Player ${remainingPlayer.playerNumber}`);
        console.log(`   Winner Wallet: ${remainingPlayer.walletAddress}`);
        
        this.gameForfeited = true;
        this.forfeitReason = 'disconnect';
        this.gameCompleted = true;
        this.endGame(remainingPlayer);
        
        // Validate we have all necessary data
        if (!remainingPlayer.walletAddress) {
          console.error('❌ Missing wallet address for remaining player!');
        }
        
        if (!this.gameId) {
          console.error('❌ Missing game ID!');
        }
        
        // Notify remaining player they won by forfeit
        remainingPlayer.socket.emit('playerDisconnected', {
          forfeit: true,
          gameId: this.gameId,
          winnerWallet: remainingPlayer.walletAddress,
          winnerNumber: remainingPlayer.playerNumber,
          stakeAmount: this.stakeAmount,
          reason: 'disconnect',
          message: 'Opponent disconnected - you win by forfeit!'
        });
        
        console.log('✅ Forfeit notification sent to remaining player');
      } else if (this.players.length === 2 && !this.gameActive && !this.gameCompleted) {
        // Player left during matchmaking/lobby (but game never started and never completed)
        if (remainingPlayer) {
          remainingPlayer.socket.emit('playerLeftLobby', {
            message: 'Other player left before game started'
          });
        }
      } else if (remainingPlayer && !this.gameCompleted) {
        // Generic disconnect notification (only if game not completed)
        remainingPlayer.socket.emit('playerDisconnected', {
          message: 'Other player disconnected'
        });
      }
      // If game is already completed, don't send any notification - winner already got payout
      
      this.players.splice(playerIndex, 1);
      this.gameState.gameRunning = false;
      
      // Stop activity monitoring
      this.stopActivityMonitoring();
      
      return true;
    }
    return false;
  }

  startGame() {
    this.gameState.gameStarted = true;
    this.gameState.gameRunning = true;
    this.gameActive = true;
    this.gameStartTime = Date.now();
    
    // Reset game state
    this.gameState.ball = { x: 500, y: 300, vx: 0, vy: 0 };
    this.gameState.scores = { player1: 0, player2: 0 };
    this.serverScores = { player1: 0, player2: 0 };
    
    // Start activity monitoring
    this.startActivityMonitoring();
    
    // Notify both players to start the game
    this.players.forEach(player => {
      player.socket.emit('gameStart', {
        gameState: this.gameState,
        playerRole: player.role,
        player1Name: this.players[0]?.name || 'Player 1',
        player2Name: this.players[1]?.name || 'Player 2'
      });
    });

    console.log(`Game started in room ${this.roomId}`);
  }
  
  startActivityMonitoring() {
    // Check for inactivity every 10 seconds
    this.activityCheckInterval = setInterval(() => {
      if (!this.gameActive || this.gameCompleted) {
        this.stopActivityMonitoring();
        return;
      }
      
      const now = Date.now();
      
      // Check each player for inactivity
      this.players.forEach(player => {
        const playerKey = `player${player.playerNumber}`;
        const lastActivity = this.lastActivityTime[playerKey];
        const inactiveDuration = now - lastActivity;
        
        if (inactiveDuration > this.INACTIVITY_TIMEOUT) {
          console.log(`⏱️  Player ${player.playerNumber} inactive for ${inactiveDuration}ms - FORFEIT`);
          
          // Player is AFK - they forfeit
          const otherPlayer = this.players.find(p => p.playerNumber !== player.playerNumber);
          
          if (otherPlayer) {
            this.gameForfeited = true;
            this.forfeitReason = 'inactivity';
            this.gameCompleted = true;
            this.endGame(otherPlayer);
            
            // Notify winner
            otherPlayer.socket.emit('opponentForfeited', {
              gameId: this.gameId,
              winnerWallet: otherPlayer.walletAddress,
              winnerNumber: otherPlayer.playerNumber,
              stakeAmount: this.stakeAmount,
              reason: 'inactivity',
              message: 'Opponent inactive (AFK) - you win!'
            });
            
            // Notify inactive player
            player.socket.emit('youForfeited', {
              reason: 'inactivity',
              message: 'You were inactive for too long and forfeited the game'
            });
            
            this.stopActivityMonitoring();
          }
        }
      });
    }, 10000); // Check every 10 seconds
  }
  
  stopActivityMonitoring() {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
  }
  
  recordActivity(playerNumber) {
    const playerKey = `player${playerNumber}`;
    this.lastActivityTime[playerKey] = Date.now();
  }
  
  updateServerScore(player, score) {
    // Server-side score tracking for anti-cheat
    if (player === 'player1') {
      this.serverScores.player1 = score;
    } else if (player === 'player2') {
      this.serverScores.player2 = score;
    }
    console.log(`Server score update - P1: ${this.serverScores.player1}, P2: ${this.serverScores.player2}`);
  }
  
  getGameDuration() {
    if (this.gameStartTime && this.gameEndTime) {
      return Math.floor((this.gameEndTime - this.gameStartTime) / 1000);
    }
    return 0;
  }
  
  endGame(winner) {
    this.gameEndTime = Date.now();
    this.gameActive = false;
    this.gameState.gameRunning = false;
    this.winner = winner;
    this.stopActivityMonitoring();
  }
  
  detectCheating() {
    // Check for impossible game states
    const issues = [];
    
    // Check 1: Score mismatch between client and server
    if (this.gameState.scores.player1 !== this.serverScores.player1) {
      issues.push(`Player 1 score mismatch: client=${this.gameState.scores.player1}, server=${this.serverScores.player1}`);
    }
    if (this.gameState.scores.player2 !== this.serverScores.player2) {
      issues.push(`Player 2 score mismatch: client=${this.gameState.scores.player2}, server=${this.serverScores.player2}`);
    }
    
    // Check 2: Game duration too short for score
    const duration = this.getGameDuration();
    const totalScore = this.serverScores.player1 + this.serverScores.player2;
    const minExpectedDuration = totalScore * 3; // At least 3 seconds per goal
    
    if (duration < minExpectedDuration && duration > 0) {
      issues.push(`Game too fast: ${duration}s for ${totalScore} goals (min expected: ${minExpectedDuration}s)`);
    }
    
    // Check 3: Impossible scores (negative or too high)
    if (this.serverScores.player1 < 0 || this.serverScores.player2 < 0) {
      issues.push(`Negative score detected`);
    }
    if (this.serverScores.player1 > 20 || this.serverScores.player2 > 20) {
      issues.push(`Unusually high score: P1=${this.serverScores.player1}, P2=${this.serverScores.player2}`);
    }
    
    return issues;
  }
  
  cancelGame() {
    this.gameEndTime = Date.now();
    this.gameActive = false;
    this.gameState.gameRunning = false;
  }
  
  isValidGame() {
    // Validate game integrity
    return this.players.length === 2 && 
           this.gameId && this.stakeAmount > 0 &&
           this.gameCompleted;
  }

  updatePaddle(playerNumber, x, y) {
    // Record player activity
    this.recordActivity(playerNumber);
    
    // Validate paddle coordinates are within bounds
    const isValidX = x >= 50 && x <= 900;
    const isValidY = y >= 50 && y <= 500;
    
    if (!isValidX || !isValidY) {
      console.warn(`Invalid paddle position from player ${playerNumber}: (${x}, ${y})`);
      return; // Reject invalid positions
    }
    
    // Validate player doesn't cross center line
    if (playerNumber === 1 && x > 500) {
      x = 500; // Clamp to center line
    } else if (playerNumber === 2 && x < 500) {
      x = 500; // Clamp to center line
    }
    
    if (playerNumber === 1) {
      this.gameState.paddles.player1 = { x, y };
    } else if (playerNumber === 2) {
      this.gameState.paddles.player2 = { x, y };
    }

    // Broadcast paddle update to all players in room
    this.broadcast('paddleUpdate', {
      playerNumber,
      x,
      y
    });
  }

  updateBall(ballData) {
    // Record host (player 1) activity since only host sends ball updates
    this.recordActivity(1);
    
    // Rate limiting check - reset counter every second
    const now = Date.now();
    if (now - this.lastBallUpdateReset > 1000) {
      this.ballUpdateCount = 0;
      this.lastBallUpdateReset = now;
    }
    
    this.ballUpdateCount++;
    if (this.ballUpdateCount > this.MAX_BALL_UPDATES_PER_SECOND) {
      console.warn(`Rate limit exceeded for ball updates in room ${this.roomId}`);
      return; // Drop excessive updates
    }
    
    // Validate ball position is within bounds
    if (ballData.x < 0 || ballData.x > 1000 || ballData.y < 0 || ballData.y > 600) {
      console.warn(`Invalid ball position in room ${this.roomId}: (${ballData.x}, ${ballData.y})`);
      return; // Reject invalid positions
    }
    
    this.gameState.ball = ballData;
    this.broadcast('ballUpdate', ballData);
  }

  updateScore(scores) {
    this.gameState.scores = scores;
    this.broadcast('scoreUpdate', scores);
    
    // Check for winner (first to 7)
    if (scores.player1 >= 7 || scores.player2 >= 7) {
      this.handleGameComplete(scores);
    }
  }
  
  async handleGameComplete(scores) {
    if (this.gameCompleted) return;
    
    this.gameCompleted = true;
    const winnerNumber = scores.player1 >= 7 ? 1 : 2;
    const winnerPlayer = this.players.find(p => p.playerNumber === winnerNumber);
    
    if (!winnerPlayer) {
      console.error('Winner player not found!');
      return;
    }
    
    this.winner = winnerPlayer;
    
    console.log(`🏆 Game ${this.roomId} completed! Winner: Player ${winnerNumber}`);
    console.log(`   Game ID: ${this.gameId}`);
    console.log(`   Stake: ${this.stakeAmount} SOL`);
    console.log(`   Winner Wallet: ${winnerPlayer.walletAddress}`);
    
    // Notify players
    this.broadcast('gameComplete', {
      winner: winnerNumber === 1 ? 'player1' : 'player2',
      scores: scores,
      gameId: this.gameId,
      stakeAmount: this.stakeAmount,
      winnerWallet: winnerPlayer.walletAddress,
      player1Score: scores.player1,
      player2Score: scores.player2,
      duration: Math.floor((Date.now() - this.gameStartTime) / 1000)
    });
  }

  broadcast(event, data) {
    this.players.forEach(player => {
      player.socket.emit(event, data);
    });
  }

  broadcastToOthers(senderSocketId, event, data) {
    this.players.forEach(player => {
      if (player.id !== senderSocketId) {
        player.socket.emit(event, data);
      }
    });
  }
}

// Matchmaking Queue Functions
function addToMatchmakingQueue(socket, playerData) {
  const { stakeAmount, playerName, gameId, walletAddress } = playerData;
  const stakeKey = stakeAmount.toString();
  
  // Get or create queue for this stake amount
  if (!matchmakingQueue.has(stakeKey)) {
    matchmakingQueue.set(stakeKey, []);
  }
  
  const queue = matchmakingQueue.get(stakeKey);
  
  // Add player to queue
  const playerEntry = {
    socket: socket,
    socketId: socket.id,
    playerName: playerName,
    gameId: gameId,
    stakeAmount: stakeAmount,
    walletAddress: walletAddress,
    joinedAt: Date.now()
  };
  
  queue.push(playerEntry);
  console.log(`➕ Player added to matchmaking queue (Stake: ${stakeAmount} SOL, Queue size: ${queue.length})`);
  
  // Broadcast updated queue stats
  broadcastQueueStats();
  
  // Try to match with another player
  tryMatchPlayers(stakeKey);
}

function tryMatchPlayers(stakeKey) {
  const queue = matchmakingQueue.get(stakeKey);
  
  if (!queue || queue.length < 2) {
    return; // Need at least 2 players
  }
  
  // Get first two players from queue
  const player1 = queue.shift();
  const player2 = queue.shift();
  
  console.log(`🎮 Matching players with stake ${stakeKey} SOL`);
  console.log(`   Player 1: ${player1.playerName} (${player1.socketId})`);
  console.log(`   Player 2: ${player2.playerName} (${player2.socketId})`);
  
  // Create game room
  const roomId = generateRoomId();
  const room = new GameRoom(roomId, player1.gameId, player1.stakeAmount);
  
  // Store wallet addresses for blockchain completion
  room.walletAddresses.player1 = player1.walletAddress;
  room.walletAddresses.player2 = player2.walletAddress;
  
  rooms.set(roomId, room);
  
  // Add player 1 (host) with wallet address
  room.addPlayer(player1.socket, player1.walletAddress);
  player1.socket.emit('matchFound', {
    roomId: roomId,
    playerNumber: 1,
    role: 'host',
    opponentName: player2.playerName,
    gameId: player1.gameId,
    stakeAmount: player1.stakeAmount
  });
  
  // Add player 2 (guest) with wallet address - need to join blockchain game
  room.addPlayer(player2.socket, player2.walletAddress);
  player2.socket.emit('matchFound', {
    roomId: roomId,
    playerNumber: 2,
    role: 'guest',
    opponentName: player1.playerName,
    gameId: player1.gameId, // Join player1's blockchain game
    stakeAmount: player1.stakeAmount
  });
  
  console.log(`✅ Match created in room ${roomId}`);
  
  // Broadcast updated queue stats
  broadcastQueueStats();
}

function removeFromMatchmakingQueue(socketId) {
  let removed = false;
  
  // Search all queues for this socket
  for (const [stakeKey, queue] of matchmakingQueue.entries()) {
    const index = queue.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      queue.splice(index, 1);
      console.log(`➖ Player removed from matchmaking queue (Stake: ${stakeKey} SOL)`);
      removed = true;
      
      // Clean up empty queues
      if (queue.length === 0) {
        matchmakingQueue.delete(stakeKey);
      }
      break;
    }
  }
  
  if (removed) {
    broadcastQueueStats();
  }
  
  return removed;
}

function broadcastQueueStats() {
  const stats = {
    onlinePlayers: onlinePlayers,
    searching: 0
  };
  
  // Count total players searching
  for (const queue of matchmakingQueue.values()) {
    stats.searching += queue.length;
  }
  
  // Broadcast to all connected clients
  io.emit('queueStats', stats);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  onlinePlayers++;
  console.log(`Player connected: ${socket.id} (Online: ${onlinePlayers})`);
  broadcastQueueStats();
  
  // Debug: Log all incoming events
  socket.onAny((eventName, ...args) => {
    console.log(`📨 Event received: "${eventName}" from ${socket.id}`, args[0] || '');
  });

  // Handle automatic matchmaking
  socket.on('findMatch', (data) => {
    console.log('🔍 Player searching for match:', data);
    
    // Add player to matchmaking queue
    addToMatchmakingQueue(socket, data);
  });
  
  // Handle Player 1 creating the blockchain game after match
  socket.on('blockchainGameCreated', (data) => {
    try {
      const { roomId, gameId } = data;
      console.log(`🎮 Player 1 created blockchain game ${gameId} for room ${roomId}`);
      
      const room = rooms.get(roomId);
      if (!room) {
        console.error('❌ Room not found:', roomId);
        return;
      }
      
      room.gameId = gameId;
      
      // Notify Player 2 to join the game
      const player2 = room.players.find(p => p.socket !== socket);
      if (player2 && player2.socket) {
        player2.socket.emit('joinBlockchainGame', { gameId: gameId });
        console.log('📨 Notified Player 2 to join game:', gameId);
      } else {
        console.error('❌ Player 2 not found in room');
      }
    } catch (error) {
      console.error('❌ Error in blockchainGameCreated handler:', error);
    }
  });
  
  // Handle Player 2 confirming they've joined the blockchain game
  socket.on('player2Joined', (data) => {
    try {
      const { roomId } = data;
      console.log(`✅ Player 2 joined blockchain game for room ${roomId}`);
      
      const room = rooms.get(roomId);
      if (room) {
        // Notify BOTH players to start the game
        room.players.forEach(player => {
          player.socket.emit('startGame', { roomId: roomId });
        });
        console.log('🎮 Sent startGame signal to both players');
      }
    } catch (error) {
      console.error('❌ Error in player2Joined handler:', error);
    }
  });
  
  // Handle blockchain transaction failure (player cancelled or error)
  socket.on('blockchainTransactionFailed', (data) => {
    try {
      const { roomId, playerNumber, reason } = data;
      console.log(`⚠️ Player ${playerNumber} blockchain transaction failed in room ${roomId} - Reason: ${reason}`);
      
      const room = rooms.get(roomId);
      if (room) {
        // Notify the OTHER player
        room.players.forEach(player => {
          if (player.id !== socket.id) {
            player.socket.emit('blockchainTransactionFailed', {
              playerNumber: playerNumber,
              reason: reason
            });
          }
        });
        
        // Clean up the room
        console.log(`🗑️ Cleaning up room ${roomId} due to blockchain transaction failure`);
        
        // Clear matchmaking timeout if exists
        if (room.matchmakingTimeout) {
          clearTimeout(room.matchmakingTimeout);
        }
        
        // Stop activity monitoring if exists
        if (room.activityCheckInterval) {
          clearInterval(room.activityCheckInterval);
        }
        
        // Remove the room
        rooms.delete(roomId);
        console.log(`✅ Room ${roomId} deleted`);
      }
    } catch (error) {
      console.error('❌ Error in blockchainTransactionFailed handler:', error);
    }
  });
  
  // Handle cancel matchmaking
  socket.on('cancelMatchmaking', () => {
    removeFromMatchmakingQueue(socket.id);
  });
  
  // Test connection handler
  socket.on('testConnection', (data) => {
    console.log('🧪 Test connection received from client:', socket.id);
    socket.emit('testConnectionResponse', { success: true });
  });

  // Handle private room creation (with blockchain game ID)
  socket.on('createPrivateRoom', (data) => {
    const { playerName, roomCode, gameId, stakeAmount, walletAddress } = data;
    
    console.log(`🔒 Creating private room: ${roomCode}`);
    console.log(`  Host: ${playerName}, Game ID: ${gameId}, Stake: ${stakeAmount} SOL`);
    
    // Check if room code already exists
    if (rooms.has(roomCode)) {
      console.log(`⚠️ Room ${roomCode} already exists!`);
      socket.emit('privateRoomError', { error: 'Room code already exists. Please try again.' });
      return;
    }
    
    // Use the provided room code instead of generating one
    const room = new GameRoom(roomCode, gameId, stakeAmount);
    rooms.set(roomCode, room);
    
    console.log(`📊 Current rooms in memory: ${Array.from(rooms.keys()).join(', ')}`);
    
    // Add host to room with their name
    const success = room.addPlayer(socket, walletAddress, playerName);
    
    if (success) {
      // Set matchmaking timeout
      room.matchmakingTimeout = setTimeout(() => {
        if (room.players.length === 1 && !room.gameActive) {
          console.log(`⏱️  Private room ${roomCode} timeout - no player joined`);
          
          const hostPlayer = room.players[0];
          if (hostPlayer) {
            hostPlayer.socket.emit('privateRoomTimeout', {
              message: 'No player joined within 5 minutes',
              gameId: gameId,
              stakeAmount: stakeAmount
            });
          }
          
          rooms.delete(roomCode);
        }
      }, room.MATCHMAKING_TIMEOUT_MS);
      
      socket.emit('privateRoomCreated', {
        roomId: roomCode,
        playerName: playerName,
        gameId: gameId,
        stakeAmount: stakeAmount
      });
      
      console.log(`✅ Private room ${roomCode} created successfully`);
    }
  });
  
  // Handle getting room info for joining
  socket.on('getRoomInfo', (data) => {
    const { roomId } = data;
    console.log(`🔍 getRoomInfo request for room: ${roomId}`);
    const room = rooms.get(roomId);
    
    if (!room) {
      console.log(`❌ Room ${roomId} not found`);
      socket.emit('roomInfo', { error: 'Room not found' });
      return;
    }
    
    if (room.players.length >= 2) {
      console.log(`❌ Room ${roomId} is full`);
      socket.emit('roomInfo', { error: 'Room is full' });
      return;
    }
    
    // Get host player info
    const hostPlayer = room.players[0];
    const hostName = hostPlayer ? (hostPlayer.name || 'Player 1') : 'Host';
    
    console.log(`✅ Sending room info for ${roomId}:`, {
      hostName,
      gameId: room.gameId,
      stakeAmount: room.stakeAmount
    });
    
    socket.emit('roomInfo', {
      roomId: roomId,
      hostName: hostName,
      gameId: room.gameId,
      stakeAmount: room.stakeAmount
    });
  });
  
  // Handle canceling a private room
  socket.on('cancelRoom', (data) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    
    if (room && room.players.length === 1) {
      // Clear timeout if exists
      if (room.matchmakingTimeout) {
        clearTimeout(room.matchmakingTimeout);
      }
      
      // Delete room
      rooms.delete(roomId);
      console.log(`🚫 Private room ${roomId} canceled by host`);
    }
  });

  // Handle room creation
  socket.on('createRoom', (data) => {
    const playerName = typeof data === 'string' ? data : data.playerName;
    const gameId = data.gameId || null;
    const stakeAmount = data.stakeAmount || 0;
    const walletAddress = data.walletAddress || null;
    
    const roomId = generateRoomId();
    const room = new GameRoom(roomId, gameId, stakeAmount);
    rooms.set(roomId, room);

    // Add player to room with wallet address
    const success = room.addPlayer(socket, walletAddress);
    
    if (success) {
      // Set matchmaking timeout - auto-cancel if no one joins in 5 minutes
      room.matchmakingTimeout = setTimeout(() => {
        if (room.players.length === 1 && !room.gameActive) {
          console.log(`⏱️  Matchmaking timeout for room ${roomId} - no opponent found`);
          
          const hostPlayer = room.players[0];
          if (hostPlayer) {
            hostPlayer.socket.emit('matchmakingTimeout', {
              message: 'No opponent found within 5 minutes',
              gameId: gameId,
              stakeAmount: stakeAmount,
              shouldRefund: true
            });
          }
          
          // Clean up room
          rooms.delete(roomId);
        }
      }, room.MATCHMAKING_TIMEOUT_MS);
      
      socket.emit('roomCreated', {
        roomId: roomId,
        playerName: playerName,
        waitingForPlayer: true,
        gameId: gameId,
        stakeAmount: stakeAmount
      });
      console.log(`Room ${roomId} created by ${playerName} (${socket.id})`);
      console.log(`  Game ID: ${gameId}, Stake: ${stakeAmount} SOL, Wallet: ${walletAddress}`);
    }
  });
  
  // Handle getting game ID from room code
  socket.on('getGameId', (roomCode, callback) => {
    const room = rooms.get(roomCode);
    if (room && room.gameId) {
      callback({ success: true, gameId: room.gameId, stakeAmount: room.stakeAmount });
    } else {
      callback({ success: false, error: 'Room not found or no game ID' });
    }
  });

  // Handle room joining
  socket.on('joinRoom', (data) => {
    const { roomId, playerName, walletAddress } = data;
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('joinError', 'Room not found');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('joinError', 'Room is full');
      return;
    }

    // Verify game ID matches
    if (data.gameId && room.gameId && data.gameId !== room.gameId) {
      socket.emit('joinError', 'Game ID mismatch');
      return;
    }
    
    const success = room.addPlayer(socket, walletAddress, playerName);
    
    if (success) {
      // Clear matchmaking timeout since opponent joined
      if (room.matchmakingTimeout) {
        clearTimeout(room.matchmakingTimeout);
        room.matchmakingTimeout = null;
      }
      
      socket.emit('roomJoined', {
        roomId: roomId,
        playerName: playerName,
        gameId: room.gameId,
        stakeAmount: room.stakeAmount
      });
      
      // Notify host that player 2 joined (for private rooms)
      if (room.players.length === 2) {
        const hostPlayer = room.players[0];
        hostPlayer.socket.emit('privateRoomPlayerJoined', {
          roomId: roomId,
          player1Name: hostPlayer.name || 'Player 1',
          player2Name: playerName,
          gameId: room.gameId,
          stakeAmount: room.stakeAmount
        });
      }
      
      console.log(`${playerName} (${socket.id}) joined room ${roomId}`);
      console.log(`  Game ID: ${room.gameId}, Stake: ${room.stakeAmount} SOL, Wallet: ${walletAddress}`);
    } else {
      socket.emit('joinError', 'Failed to join room');
    }
  });

  // Handle paddle movement
  socket.on('paddleMove', (data) => {
    const room = Array.from(rooms.values()).find(r => 
      r.players.some(p => p.id === socket.id)
    );

    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        room.updatePaddle(player.playerNumber, data.x, data.y);
      }
    }
  });

  // Handle ball updates (ONLY from host - anti-cheat)
  socket.on('ballUpdate', (ballData) => {
    const room = Array.from(rooms.values()).find(r => 
      r.players.some(p => p.id === socket.id)
    );

    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      
      // CRITICAL: Only allow host (player 1) to update ball position
      if (player && player.role === 'host') {
        room.updateBall(ballData);
      } else if (player && player.role === 'guest') {
        console.warn(`🚨 REJECTED: Guest (Player 2) attempted to update ball in room ${room.roomId}`);
        // Log potential cheating attempt
      }
    }
  });

  // Handle score updates with server-side tracking
  socket.on('scoreUpdate', (data) => {
    const room = Array.from(rooms.values()).find(r => 
      r.players.some(p => p.id === socket.id)
    );

    if (room) {
      // Update server-side score tracking
      room.updateServerScore(data.player, data.score);
      
      // Broadcast to all players
      room.broadcast('scoreUpdate', {
        player1: room.serverScores.player1,
        player2: room.serverScores.player2
      });
    }
  });

  // Handle ping for latency measurement
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Handle game events
  socket.on('gameEvent', (eventData) => {
    const room = Array.from(rooms.values()).find(r => 
      r.players.some(p => p.id === socket.id)
    );

    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player && player.role === 'host') {
        room.broadcast('gameEvent', eventData);
      }
    }
  });

  // Handle game completion with anti-cheat verification
  socket.on('gameComplete', async (data) => {
    const room = Array.from(rooms.values()).find(r => 
      r.players.some(p => p.id === socket.id)
    );
    
    if (room && !room.gameCompleted) {
      console.log(`🏁 Game ${room.roomId} completed. Winner claim: ${data.winner}`);
      
      // Mark as completed
      room.gameCompleted = true;
      room.endGame(data.winner);
      
      // Verify winner using server-side scores
      const verifiedWinner = verifyWinner(room, data);
      
      if (!verifiedWinner) {
        console.error('❌ Winner verification failed for room:', room.roomId);
        socket.emit('gameError', { message: 'Winner verification failed' });
        return;
      }
      
      console.log('✅ Winner verified:', verifiedWinner);
      console.log('📊 Final scores - P1:', room.serverScores.player1, 'P2:', room.serverScores.player2);
      console.log('⏱️ Game duration:', room.getGameDuration(), 'seconds');
      
      // Get winner's wallet address for blockchain payout
      const winnerWalletAddress = verifiedWinner === 'player1' 
        ? room.walletAddresses.player1 
        : room.walletAddresses.player2;
      
      console.log('💰 Winner wallet:', winnerWalletAddress);
      
      // Emit game completion to both players with verified winner
      const gameResult = {
        winner: verifiedWinner,
        winnerWallet: winnerWalletAddress,
        gameId: room.gameId,
        stakeAmount: room.stakeAmount,
        player1Score: room.serverScores.player1,
        player2Score: room.serverScores.player2,
        duration: room.getGameDuration()
      };
      
      room.broadcast('gameComplete', gameResult);
      
      // Clean up room after 5 seconds
      setTimeout(() => {
        rooms.delete(room.roomId);
        console.log(`🧹 Room ${room.roomId} cleaned up`);
      }, 5000);
    }
  });

  // Handle game timeout/cancellation
  socket.on('cancelGame', () => {
    const room = findRoomBySocket(socket);
    if (room) {
      console.log(`❌ Game ${room.roomId} cancelled by player`);
      room.cancelGame();
      
      // Notify both players
      if (room.player1) {
        room.player1.socket.emit('gameCancelled', { 
          reason: 'Player left the game',
          refund: true 
        });
      }
      if (room.player2) {
        room.player2.socket.emit('gameCancelled', { 
          reason: 'Player left the game',
          refund: true 
        });
      }
      
      // Remove room
      const index = rooms.indexOf(room);
      if (index > -1) {
        rooms.splice(index, 1);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Find and remove player from any room
    for (const [roomId, room] of rooms.entries()) {
      if (room.removePlayer(socket.id)) {
        console.log(`Player ${socket.id} removed from room ${roomId}`);
        
        // Clear matchmaking timeout if exists
        if (room.matchmakingTimeout) {
          clearTimeout(room.matchmakingTimeout);
          room.matchmakingTimeout = null;
        }
        
        // If game was in progress and not completed, log it
        if (room.gameState.gameStarted && !room.gameCompleted && room.gameId) {
          console.warn(`⚠️  Game ${room.gameId} abandoned - player disconnected`);
          console.warn('   Forfeit logic should have triggered payout to remaining player');
        }
        
        // Remove room if empty
        if (room.players.length === 0) {
          // Clean up any intervals
          if (room.activityCheckInterval) {
            clearInterval(room.activityCheckInterval);
          }
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted - no players remaining`);
        }
        break;
      }
    }
  });
});

// Server-side winner verification (Anti-cheat)
function verifyWinner(room, data) {
  // Verify based on scores tracked by server
  const p1Score = room.serverScores.player1 || 0;
  const p2Score = room.serverScores.player2 || 0;
  const claimedWinner = data.winner;
  
  // Determine actual winner from server-tracked scores
  let actualWinner;
  if (p1Score >= 7) {
    actualWinner = 'player1';
  } else if (p2Score >= 7) {
    actualWinner = 'player2';
  } else {
    console.error('🚨 INVALID: No player reached winning score of 7');
    console.error('   P1 Score:', p1Score, 'P2 Score:', p2Score);
    return null;
  }
  
  // Check if claimed winner matches actual winner
  if (claimedWinner !== actualWinner) {
    console.error('🚨 CHEAT DETECTED! Claimed:', claimedWinner, 'Actual:', actualWinner);
    console.error('   Server scores - P1:', p1Score, 'P2:', p2Score);
    return null;
  }
  
  // Additional validation checks
  if (room.getGameDuration() < 10) {
    console.error('🚨 SUSPICIOUS: Game too short (', room.getGameDuration(), 'seconds)');
    return null;
  }
  
  if (p1Score === 0 && p2Score === 0) {
    console.error('🚨 SUSPICIOUS: No scores recorded');
    return null;
  }
  
  const loserScore = actualWinner === 'player1' ? p2Score : p1Score;
  if (loserScore >= 7) {
    console.error('🚨 SUSPICIOUS: Both players have winning scores');
    return null;
  }
  
  return actualWinner;
}

// Start server
server.listen(PORT, () => {
  console.log(`🏒 Air Hockey Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to play`);
  console.log(`🎮 Create rooms and invite friends for multiplayer action!`);
  
  if (blockchainConfig) {
    console.log(`🔗 Blockchain: Connected to ${blockchainConfig.cluster}`);
    console.log(`   Program: ${blockchainConfig.programId}`);
  } else {
    console.log(`⚠️  Running without blockchain integration`);
  }
});

// Cleanup empty rooms periodically
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`Cleaned up empty room: ${roomId}`);
    }
  }
}, 30000); // Clean up every 30 seconds