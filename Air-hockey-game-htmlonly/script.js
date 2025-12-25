// Air Hockey Game JavaScript

// Avatar Image System
const AVATAR_IMAGES = [
  'avtar_imges/androgynous-avatar-non-binary-queer-person.jpg',
  'avtar_imges/93f50dd8-9dec-4f20-ad88-d40acc26dec5.jpg',
  'avtar_imges/7309681.jpg',
  'avtar_imges/9434619.jpg',
  'avtar_imges/a39c74b4-2bfe-4404-97d5-daca5a22b51d.jpg',
  'avtar_imges/11475221.jpg',
  'avtar_imges/9439678.jpg',
  'avtar_imges/9440461.jpg',
  'avtar_imges/10491837.jpg'
];

let currentPlayerAvatar = null;
let currentOpponentAvatar = null;
let avatarChangeInterval = null;

// Function to get random avatar
function getRandomAvatar() {
  return AVATAR_IMAGES[Math.floor(Math.random() * AVATAR_IMAGES.length)];
}

// Function to start avatar rotation animation
function startAvatarRotation() {
  const container = document.getElementById('avatarScrollContainer');
  if (!container) {
    console.error('Avatar scroll container not found!');
    return;
  }
  
  // Clear any existing interval
  if (avatarChangeInterval) {
    clearInterval(avatarChangeInterval);
  }
  
  console.log('Starting avatar rotation with', AVATAR_IMAGES.length, 'images');
  
  // Show first image
  let currentIndex = 0;
  container.innerHTML = '';
  
  const img = document.createElement('img');
  img.className = 'avatar-rotating-img';
  img.src = AVATAR_IMAGES[currentIndex];
  img.alt = 'Avatar';
  container.appendChild(img);
  
  // Change image every 1 second
  avatarChangeInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % AVATAR_IMAGES.length;
    
    const newImg = document.createElement('img');
    newImg.className = 'avatar-rotating-img';
    newImg.src = AVATAR_IMAGES[currentIndex];
    newImg.alt = 'Avatar';
    
    // Replace old image with new one
    container.innerHTML = '';
    container.appendChild(newImg);
  }, 1000);
}

// Function to stop avatar rotation
function stopAvatarRotation() {
  console.log('🛑 Stopping avatar rotation, interval ID:', avatarChangeInterval);
  if (avatarChangeInterval) {
    clearInterval(avatarChangeInterval);
    avatarChangeInterval = null;
  }
  
  // Also clear the container to stop any ongoing rotation
  const container = document.getElementById('avatarScrollContainer');
  if (container) {
    container.innerHTML = '';
  }
  
  console.log('✅ Avatar rotation stopped');
}

// Function to initialize avatar scroll animation (legacy - now using rotation)
function initializeAvatarScroll() {
  startAvatarRotation();
}

// Function to set player avatar
function setPlayerAvatar(playerId, avatarPath) {
  const avatarImg = document.getElementById(playerId);
  if (avatarImg) {
    avatarImg.src = avatarPath;
  }
}

// Function to reveal opponent avatar
function revealOpponentAvatar(avatarPath) {
  console.log('🎯 Revealing opponent avatar:', avatarPath);
  
  // Stop rotation animation FIRST and clear it
  stopAvatarRotation();
  
  const scrollContainer = document.getElementById('avatarScrollContainer');
  const foundAvatar = document.getElementById('player2Avatar');
  
  if (scrollContainer && foundAvatar) {
    // Completely hide and stop scroll container
    scrollContainer.style.display = 'none';
    scrollContainer.style.visibility = 'hidden';
    scrollContainer.innerHTML = ''; // Clear any remaining images
    
    // Set and show found avatar with the selected random image
    foundAvatar.src = avatarPath;
    foundAvatar.style.display = 'block';
    foundAvatar.style.visibility = 'visible';
    foundAvatar.style.zIndex = '10';
    
    // Small delay to ensure display change registers
    setTimeout(() => {
      foundAvatar.classList.add('show');
    }, 50);
    
    console.log('✅ Avatar revealed successfully, rotation container hidden');
  }
}

// Game variables
var canvas, ctx;
var gameMode = null; // 'computer' or 'multiplayer'
var gameRunning = false;
var ball_speed = 12;
var xspeed = 0;
var yspeed = 0;
var player1_score = 0;
var player2_score = 0;
var x_min = 50;
var x_max = 900;
var y_min = 50;
var y_max = 500;

// Particle system for hit effects
var particles = [];

// Multiplayer variables
var socket = null;
var isMultiplayer = false;
var playerRole = null; // 'host' or 'guest'
var playerNumber = null; // 1 or 2
var currentRoomId = null;
var isConnected = false;
var waitingForPlayer = false;

// Button debouncing to prevent multiple rapid clicks
var isCreatingGame = false;
var isJoiningGame = false;
var lastButtonClick = 0;
var BUTTON_DEBOUNCE_MS = 2000; // 2 second cooldown

// Game completion tracking
var isGameCompleted = false;

// Button debouncing to prevent multiple rapid clicks
var isCreatingGame = false;
var isJoiningGame = false;
var lastButtonClick = 0;
var BUTTON_DEBOUNCE_MS = 2000; // 2 second cooldown

// Network optimization variables
var lastPaddleUpdate = 0;
var paddleUpdateInterval = 0; // Send every frame for maximum smoothness
var lastSentPaddleX = 0;
var lastSentPaddleY = 0;
var paddleMovementThreshold = 0; // Send all movements

// Paddle interpolation for smooth multiplayer movement
var opponentPaddleTarget = { x: 0, y: 0 };
var paddleInterpolationSpeed = 0.85; // Very fast interpolation

// Ball update throttling
var lastBallUpdate = 0;
var ballUpdateInterval = 16; // Send ball updates every 16ms (60fps) - match game loop

// Ball interpolation for smooth guest rendering
var ballServerState = { x: 0, y: 0, vx: 0, vy: 0, timestamp: 0 };
var ballPreviousState = { x: 0, y: 0, vx: 0, vy: 0, timestamp: 0 };
var renderTimestamp = 30; // Render 30ms in the past for smooth interpolation (reduced from 100ms)

// Ball stuck detection
var ballStuckTimer = 0;
var lastBallX = 0;
var lastBallY = 0;
var stuckThreshold = 180; // 3 seconds at 60fps

// FPS and Ping tracking
var fps = 0;
var lastFrameTime = Date.now();
var frameCount = 0;
var fpsUpdateInterval = 500; // Update FPS every 500ms
var lastFpsUpdate = Date.now();
var ping = 0;
var lastPingTime = 0;
var pingInterval = 2000; // Send ping every 2 seconds

// Color themes
var colorThemes = {
  green: {
    bg1: '#2e7d32', bg2: '#4caf50', bg3: '#2e7d32',
    line: '#ffffff', accent: '#81c784'
  },
  blue: {
    bg1: '#1565c0', bg2: '#2196f3', bg3: '#1565c0',
    line: '#ffffff', accent: '#64b5f6'
  },
  purple: {
    bg1: '#7b1fa2', bg2: '#9c27b0', bg3: '#7b1fa2',
    line: '#ffffff', accent: '#ba68c8'
  },
  red: {
    bg1: '#c62828', bg2: '#f44336', bg3: '#c62828',
    line: '#ffffff', accent: '#ef5350'
  },
  orange: {
    bg1: '#ef6c00', bg2: '#ff9800', bg3: '#ef6c00',
    line: '#ffffff', accent: '#ffb74d'
  },
  teal: {
    bg1: '#00695c', bg2: '#009688', bg3: '#00695c',
    line: '#ffffff', accent: '#4db6ac'
  }
};

var currentTheme = 'green';
var currentBallColor = 'white';

// Ball color options
var ballColors = {
  white: '#ffffff',
  yellow: '#fbbf24',
  orange: '#fb923c',
  red: '#f87171',
  pink: '#f472b6',
  purple: '#a78bfa',
  blue: '#60a5fa',
  green: '#4ade80'
};

// Audio context for sound effects
var audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playHitSound() {
  // Play the tennis ball hit audio
  const hitAudio = document.getElementById('hitSound');
  if (hitAudio) {
    // Reset audio to beginning for rapid hits
    hitAudio.currentTime = 0;
    hitAudio.volume = 0.6; // Set volume to 60%
    
    // Play the tennis ball hit sound
    hitAudio.play().catch(error => {
      console.log('Could not play hit audio:', error);
    });
  }
}

function playGoalSound() {
  // Use only the crowd cheering audio
  playCheerSound();
}

function playCheerSound() {
  // Play only the real crowd cheering audio
  const crowdCheerAudio = document.getElementById('crowdCheerSound');
  if (crowdCheerAudio) {
    // Reset audio to beginning in case it's already playing
    crowdCheerAudio.currentTime = 0;
    crowdCheerAudio.volume = 0.8; // Set volume to 80%
    
    // Play the crowd cheering sound
    crowdCheerAudio.play().catch(error => {
      console.log('Could not play crowd cheer audio:', error);
    });
  }
}

function initializeAudioFiles() {
  // Pre-load and test audio files
  const crowdCheerAudio = document.getElementById('crowdCheerSound');
  if (crowdCheerAudio) {
    crowdCheerAudio.volume = 0.8;
    crowdCheerAudio.load();
  }
  
  const hitAudio = document.getElementById('hitSound');
  if (hitAudio) {
    hitAudio.volume = 0.6;
    hitAudio.load();
  }
  
  const winningAudio = document.getElementById('winningSound');
  if (winningAudio) {
    winningAudio.volume = 0.8;
    winningAudio.load();
  }
  
  const wallAudio = document.getElementById('wallSound');
  if (wallAudio) {
    wallAudio.volume = 0.5;
    wallAudio.load();
  }
}

function showGoalCelebration(playerNumber) {
  // Add screen shake effect
  document.body.style.animation = 'screenShake 0.5s ease-in-out';
  setTimeout(() => {
    document.body.style.animation = '';
  }, 500);
  
  // Create celebration overlay
  const celebration = document.createElement('div');
  celebration.className = 'goal-celebration';
  celebration.innerHTML = `
    <div class="celebration-content">
      <div class="goal-text">GOAL!</div>
      <div class="scorer-text">Player ${playerNumber} Scores!</div>
    </div>
  `;
  
  document.body.appendChild(celebration);
  
  // Remove celebration after animation
  setTimeout(() => {
    if (celebration.parentNode) {
      celebration.parentNode.removeChild(celebration);
    }
  }, 3000);
}

function playWallSound() {
  // Play the ball hitting table audio
  const wallAudio = document.getElementById('wallSound');
  if (wallAudio) {
    // Reset audio to beginning for rapid hits
    wallAudio.currentTime = 0;
    wallAudio.volume = 0.5; // Set volume to 50%
    
    // Play the ball hitting table sound
    wallAudio.play().catch(error => {
      console.log('Could not play wall audio:', error);
    });
  }
}

function createBeep(frequency, duration, type) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// Multiplayer paddle interpolation function
function updatePaddleInterpolation() {
  if (!isMultiplayer || !isConnected) return;
  
  // Very fast interpolation for opponent's paddle - nearly instant
  // Your own paddle is already updated instantly in mouseMoveHandler
  if (playerNumber === 1) {
    // Player 1 sees Player 2 paddle with minimal lag
    player2Mallet.x += (opponentPaddleTarget.x - player2Mallet.x) * paddleInterpolationSpeed;
    player2Mallet.y += (opponentPaddleTarget.y - player2Mallet.y) * paddleInterpolationSpeed;
  } else if (playerNumber === 2) {
    // Player 2 sees Player 1 paddle with minimal lag
    player1Mallet.x += (opponentPaddleTarget.x - player1Mallet.x) * paddleInterpolationSpeed;
    player1Mallet.y += (opponentPaddleTarget.y - player1Mallet.y) * paddleInterpolationSpeed;
  }
}

// Particle system functions
function createHitEffect(x, y, ballColor) {
  // Create 3-4 particles spreading from the hit point
  var particleCount = Math.floor(Math.random() * 2) + 3; // 3-4 particles
  
  for (var i = 0; i < particleCount; i++) {
    var particle = new Particle(x, y, ballColors[ballColor]);
    particles.push(particle);
  }
}

function updateParticles() {
  // Update and remove expired particles
  for (var i = particles.length - 1; i >= 0; i--) {
    var particle = particles[i];
    
    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Apply gravity and friction
    particle.vy += 0.15; // Slight gravity
    particle.vx *= 0.98; // Air friction
    particle.vy *= 0.98;
    
    // Decrease life
    particle.life--;
    
    // Remove dead particles
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (var i = 0; i < particles.length; i++) {
    var particle = particles[i];
    
    // Calculate opacity based on remaining life
    var opacity = particle.life / particle.maxLife;
    
    // Draw particle
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Socket.IO functions
function initializeSocket() {
  socket = io();
  
  // Connection events
  socket.on('connect', () => {
    console.log('Connected to server');
    isConnected = true;
    updateConnectionStatus('Connected', 'connected');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
    updateConnectionStatus('Disconnected', 'disconnected');
  });
  
  // Ping response handler
  socket.on('pong', () => {
    ping = Date.now() - lastPingTime;
  });
  
  // Room events
  socket.on('roomCreated', (data) => {
    console.log('Room created:', data);
    currentRoomId = data.roomId;
    waitingForPlayer = data.waitingForPlayer;
    gameRunning = false; // Don't run game while waiting for player
    updateMultiplayerUI();
    showWaitingScreen(data.roomId);
  });
  
  socket.on('roomJoined', (data) => {
    console.log('Room joined:', data);
    currentRoomId = data.roomId;
    waitingForPlayer = false;
    updateMultiplayerUI();
  });
  
  socket.on('joinError', (error) => {
    alert('Error joining room: ' + error);
  });
  
  // Private room events
  socket.on('privateRoomCreated', (data) => {
    console.log('✅ Private room created:', data);
    // Room modal is already shown by the create function
  });
  
  socket.on('privateRoomTimeout', async (data) => {
    console.log('⏱️ Private room timeout - no player joined');
    
    // Close the private room modal
    const modal = document.getElementById('privateRoomModal');
    if (modal) {
      modal.classList.remove('active');
    }
    
    alert('⏱️ Room Timeout\n\n' +
          'No player joined your room within 5 minutes.\n\n' +
          '💰 Requesting refund of your ' + data.stakeAmount + ' SOL...');
    
    // Request refund from blockchain
    try {
      console.log('🔄 Requesting refund for game:', data.gameId);
      const result = await blockchainManager.cancelGame();
      
      if (result && result.success) {
        alert('✅ Refund Successful!\n\n' +
              'Your ' + data.stakeAmount + ' SOL has been returned to your wallet.\n\n' +
              'Transaction: ' + result.signature.substring(0, 20) + '...');
        
        // Update wallet balance
        await walletManager.updateBalance();
        updateWalletUI();
      }
    } catch (error) {
      console.error('❌ Refund failed:', error);
      alert('❌ Refund failed: ' + error.message + '\n\nPlease contact support.');
    }
    
    // Return to start screen
    document.getElementById('startScreen').style.display = 'flex';
  });
  
  socket.on('testConnectionResponse', (data) => {
    console.log('✅ Test connection successful! Server is responding.');
  });
  
  socket.on('roomInfo', (roomInfo) => {
    console.log('📋 Received room info:', roomInfo);
    if (roomInfo.error) {
      alert('❌ ' + roomInfo.error);
      return;
    }
    // Show join private room modal with details
    showJoinPrivateRoomModal(roomInfo);
  });
  
  socket.on('privateRoomPlayerJoined', (data) => {
    console.log('👥 Player 2 joined private room:', data);
    
    // Close the private room modal
    const modal = document.getElementById('privateRoomModal');
    if (modal) {
      modal.classList.remove('active');
    }
    
    // Update waiting text
    const waitingText = document.getElementById('waitingText');
    if (waitingText) {
      waitingText.textContent = 'Player 2 joined! Starting game...';
    }
    
    // Store player info and blockchain game ID
    currentRoomId = data.roomId;
    playerRole = 'host';
    playerNumber = 1;
    
    // IMPORTANT: Store the blockchain game ID from when we created the room
    if (privateRoomGameId) {
      currentBlockchainGameId = privateRoomGameId;
      console.log('💼 Stored blockchain game ID for host:', currentBlockchainGameId);
    }
    
    // Start the game after brief delay
    setTimeout(() => {
      hideWaitingScreen();
      startMultiplayerGame({
        roomId: data.roomId,
        playerNumber: 1,
        role: 'host',
        player1Name: data.player1Name,
        player2Name: data.player2Name,
        player1Avatar: currentPlayerAvatar || getRandomAvatar(),
        player2Avatar: data.player2Avatar || getRandomAvatar()
      });
    }, 1500);
  });
  
  socket.on('playerAssigned', (data) => {
    console.log('Player assigned:', data);
    playerRole = data.role;
    playerNumber = data.playerNumber;
    currentRoomId = data.roomId;
    updateMultiplayerUI();
  });
  
  socket.on('playerLeftLobby', (data) => {
    console.log('⚠️ Player left during lobby:', data);
    alert('⚠️ Other player left before game started.\n\nReturning to main menu...');
    exitGame();
  });
  
  socket.on('gameStart', (data) => {
    console.log('📨 Received gameStart event from server');
    console.log(`🎮 Current flags: gameRunning=${gameRunning}, waitingForPlayer=${waitingForPlayer}, matchmakingActive=${matchmakingActive}`);
    
    // DO NOT clear flags or start game if waiting for blockchain transactions
    if (waitingForPlayer || matchmakingActive) {
      console.log('⏸️  gameStart received but BLOCKING - still waiting for blockchain transactions');
      console.log('⏳ Will wait for startGame event after blockchain transactions complete');
      
      // Just set up the game state but don't start
      isMultiplayer = true;
      hideWaitingScreen();
      startMultiplayerGame(data);
      return;
    }
    
    // If no blockchain waiting, proceed normally (legacy flow)
    console.log('✅ gameStart - no blockchain wait, starting immediately');
    waitingForPlayer = false;
    matchmakingActive = false;
    isMultiplayer = true;
    
    hideWaitingScreen();
    hideMatchmakingScreen();
    startMultiplayerGame(data);
  });
  
  socket.on('playerDisconnected', async (data) => {
    // Ignore if game is already completed
    if (isGameCompleted) {
      console.log('✅ Ignoring playerDisconnected - game already completed');
      return;
    }
    
    console.log('🚫 Player disconnected during game:', data);
    console.log('💼 Current blockchain game ID:', currentBlockchainGameId);
    console.log('🎮 Game running status:', gameRunning);
    
    // If game was active with blockchain, handle forfeit/refund
    if (data && data.forfeit && data.winnerWallet && currentBlockchainGameId) {
      // Stop the game immediately
      gameRunning = false;
      if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
      }
      
      alert('🎊 Opponent Disconnected!\n\n' +
            'You win by forfeit!\n\n' +
            '💰 Claiming your winnings...');
      
      try {
        console.log('🔗 Completing game on blockchain for forfeit win...');
        console.log('   Game ID:', currentBlockchainGameId);
        console.log('   Winner Wallet:', data.winnerWallet);
        
        const result = await blockchainManager.completeGame(data.winnerWallet);
        
        if (result && result.success) {
          const winnings = (data.stakeAmount * 2 * 0.95).toFixed(2);
          
          // Mark game as completed
          isGameCompleted = true;
          
          alert('✅ You Won by Forfeit!\n\n' +
                '💰 ' + winnings + ' SOL has been sent to your wallet!\n\n' +
                'Transaction: ' + result.signature.substring(0, 20) + '...');
          
          await walletManager.updateBalance();
          updateWalletUI();
        } else {
          throw new Error('Blockchain transaction failed');
        }
      } catch (error) {
        console.error('❌ Forfeit payout failed:', error);
        alert('❌ Payout failed: ' + error.message + '\n\nPlease contact support with game ID: ' + currentBlockchainGameId);
      }
    } else if (data && data.forfeit) {
      // Forfeit scenario but missing data
      console.error('❌ Missing blockchain data for forfeit:', {
        hasWinnerWallet: !!data.winnerWallet,
        hasGameId: !!currentBlockchainGameId,
        stakeAmount: data.stakeAmount
      });
      
      alert('⚠️ Opponent Disconnected!\n\n' +
            'You should have won, but there was an issue with the payout.\n\n' +
            'Please contact support.');
    } else {
      // No forfeit data, just a regular disconnect
      alert('Other player disconnected!');
    }
    
    exitGame();
  });
  
  // Game sync events
  socket.on('paddleUpdate', (data) => {
    // Set target position for interpolation instead of direct assignment
    if (data.playerNumber === 1 && playerNumber !== 1) {
      opponentPaddleTarget.x = data.x;
      opponentPaddleTarget.y = data.y;
    } else if (data.playerNumber === 2 && playerNumber !== 2) {
      opponentPaddleTarget.x = data.x;
      opponentPaddleTarget.y = data.y;
    }
  });
  
  socket.on('ballUpdate', (data) => {
    if (playerRole !== 'host') { // Only guests receive ball updates
      // Store server state for interpolation
      ballPreviousState = { ...ballServerState };
      ballServerState = {
        x: data.x,
        y: data.y,
        vx: data.vx,
        vy: data.vy,
        timestamp: Date.now()
      };
    }
  });
  
  socket.on('scoreUpdate', (data) => {
    player1_score = data.player1;
    player2_score = data.player2;
  });
  
  socket.on('gameEvent', (data) => {
    switch(data.type) {
      case 'goal':
        playGoalSound();
        if (data.playerNumber) {
          showGoalCelebration(data.playerNumber);
        }
        break;
      case 'hit':
        playHitSound();
        // Create particle effect on hit
        if (data.x && data.y && data.ballColor) {
          createHitEffect(data.x, data.y, data.ballColor);
        }
        break;
      case 'wall':
        playWallSound();
        break;
      case 'victory':
        // Show victory celebration for guest player
        if (data.winner) {
          showWinningCelebration(data.winner);
        }
        break;
    }
  });
  
  // Matchmaking queue events
  socket.on('queueStats', (stats) => {
    // Update online player count display
    document.getElementById('onlinePlayerCount').textContent = stats.onlinePlayers;
    document.getElementById('searchingCount').textContent = stats.searching;
  });
  
  socket.on('matchFound', async (data) => {
    console.log('🎯 Match found!', data);
    console.log('⏸️  Setting flags: waitingForPlayer=true, matchmakingActive=true, gameRunning=false');
    
    // CRITICAL: Keep game from starting until blockchain transactions complete
    waitingForPlayer = true;
    matchmakingActive = true;
    gameRunning = false;
    
    console.log('🔒 Game is now LOCKED until blockchain transactions complete');
    
    // Update UI - opponent found
    setMatchmakingStatus('Match Found! 🎉', `Opponent: ${data.opponentName}`);
    document.getElementById('player2Name').textContent = data.opponentName;
    const opponentAvatar = document.getElementById('opponentAvatar');
    opponentAvatar.classList.remove('slot-machine');
    opponentAvatar.classList.add('found');
    
    // Stop avatar rotation and select random avatar for opponent
    console.log('🎲 Selecting random avatar for opponent...');
    currentOpponentAvatar = getRandomAvatar();
    console.log('Selected avatar:', currentOpponentAvatar);
    revealOpponentAvatar(currentOpponentAvatar);
    
    // Store room and player info
    currentRoomId = data.roomId;
    playerRole = data.role;
    playerNumber = data.playerNumber;
    
    console.log(`👤 Assigned as Player ${playerNumber} (${playerRole})`);
    console.log(`🎮 Current flags: gameRunning=${gameRunning}, waitingForPlayer=${waitingForPlayer}, matchmakingActive=${matchmakingActive}`);
    
    // Start coin rush animation immediately
    setTimeout(() => {
      startCoinRushAnimation();
    }, 500);
    
    // Player 1 creates the game, Player 2 waits
    if (data.playerNumber === 1) {
      console.log('💼 Player 1: Will create blockchain game...');
      
      // Show status before wallet popup
      setMatchmakingStatus('Preparing blockchain game...', 'Wallet popup will appear shortly');
      
      // Add small delay to let UI settle before showing wallet popup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        setMatchmakingStatus('Confirm transaction in your wallet', 'Please approve the game creation transaction');
        console.log('🔗 Player 1: Creating blockchain game (wallet popup will appear)...');
        const result = await blockchainManager.createGame(data.stakeAmount);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        console.log('✅ Game created:', result.gameId);
        currentBlockchainGameId = result.gameId;
        
        // Notify server of the game ID so Player 2 can join
        socket.emit('blockchainGameCreated', {
          roomId: data.roomId,
          gameId: result.gameId
        });
        
        // Player 1 waits for Player 2 to join before starting
        setMatchmakingStatus('Transaction confirmed! ✅', 'Waiting for opponent to join...');
        console.log('⏳ Player 1: Waiting for Player 2 to join blockchain game...');
        console.log(`🎮 Flags after P1 creation: gameRunning=${gameRunning}, waitingForPlayer=${waitingForPlayer}`);
        
      } catch (error) {
        console.error('❌ Failed to create game:', error);
        
        // Check if user cancelled
        const wasCancelled = error.message.includes('User rejected') || 
                            error.message.includes('User canceled') ||
                            error.message.includes('User cancelled') ||
                            error.message.includes('rejected the request');
        
        // More helpful error message
        let errorMsg = '';
        if (wasCancelled) {
          errorMsg = '⚠️ Transaction Cancelled\n\nYou cancelled the wallet transaction.\nThe game has been cancelled and your opponent has been notified.\n\nReturning to main menu.';
        } else if (error.message.includes('Unexpected error') || error.message.includes('service worker')) {
          errorMsg = '❌ Wallet Error\n\nWallet popup blocked or failed to load.\n\nPlease:\n1. Allow popups from this site\n2. Ensure only one wallet extension is active\n3. Try refreshing the page\n\nReturning to main menu.';
        } else {
          errorMsg = '❌ Failed to Create Game\n\n' + error.message + '\n\nReturning to main menu.';
        }
        
        alert(errorMsg);
        
        // Clean up state
        gameRunning = false;
        waitingForPlayer = false;
        matchmakingActive = false;
        currentBlockchainGameId = null;
        
        // Notify server to cancel the room and inform other player
        socket.emit('blockchainTransactionFailed', {
          roomId: data.roomId,
          playerNumber: 1,
          reason: wasCancelled ? 'cancelled' : 'error'
        });
        
        // Return to main menu
        hideMatchmakingScreen();
        hideWaitingScreen();
        setTimeout(() => exitGame(), 500);
        return;
      }
    } else {
      // Player 2 waits for gameId from Player 1
      setMatchmakingStatus('Waiting for opponent...', 'Player 1 is creating the game');
      console.log('⏳ Player 2: Waiting for Player 1 to create game...');
    }
  });
  
  // Player 2 receives the game ID from Player 1 and joins
  socket.on('joinBlockchainGame', async (data) => {
    console.log('🔗 Player 2: Received game ID from Player 1:', data.gameId);
    console.log(`🎮 Flags before P2 join: gameRunning=${gameRunning}, waitingForPlayer=${waitingForPlayer}`);
    
    // Show status before wallet popup
    setMatchmakingStatus('Game created by opponent! ✅', 'Preparing to join...');
    
    // Small delay before wallet popup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      setMatchmakingStatus('Confirm transaction in your wallet', 'Please approve to join the game');
      console.log('🔗 Player 2: Joining blockchain game (wallet popup will appear)...');
      const result = await blockchainManager.joinGame(data.gameId);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log('✅ Player 2: Successfully joined game');
      currentBlockchainGameId = data.gameId;
      
      // Update status
      setMatchmakingStatus('Transaction confirmed! ✅', 'Starting game...');
      
      // Notify server that Player 2 has joined (triggers game start for both)
      console.log('📤 Player 2: Notifying server - both transactions complete');
      socket.emit('player2Joined', { roomId: currentRoomId });
      
    } catch (error) {
      console.error('❌ Failed to join game:', error);
      
      // Check if user cancelled
      const wasCancelled = error.message.includes('User rejected') || 
                          error.message.includes('User canceled') ||
                          error.message.includes('User cancelled') ||
                          error.message.includes('rejected the request');
      
      // More helpful error message
      let errorMsg = '';
      if (wasCancelled) {
        errorMsg = '⚠️ Transaction Cancelled\n\nYou cancelled the wallet transaction.\nThe game has been cancelled and your opponent has been notified.\n\nReturning to main menu.';
      } else if (error.message.includes('Unexpected error') || error.message.includes('service worker')) {
        errorMsg = '❌ Wallet Error\n\nWallet popup blocked or failed to load.\n\nPlease:\n1. Allow popups from this site\n2. Ensure only one wallet extension is active\n3. Try refreshing the page\n\nReturning to main menu.';
      } else {
        errorMsg = '❌ Failed to Join Game\n\n' + error.message + '\n\nReturning to main menu.';
      }
      
      alert(errorMsg);
      
      // Clean up state
      gameRunning = false;
      waitingForPlayer = false;
      matchmakingActive = false;
      currentBlockchainGameId = null;
      
      // Notify server to cancel the room and inform other player
      socket.emit('blockchainTransactionFailed', {
        roomId: currentRoomId,
        playerNumber: 2,
        reason: wasCancelled ? 'cancelled' : 'error'
      });
      
      // Return to main menu
      hideMatchmakingScreen();
      hideWaitingScreen();
      setTimeout(() => exitGame(), 500);
      return;
    }
  });
  
  // Both players receive this when ready to start
  socket.on('startGame', (data) => {
    console.log('🎮🎮🎮 STARTGAME EVENT RECEIVED - BLOCKCHAIN TRANSACTIONS COMPLETE! 🎮🎮🎮');
    console.log(`🎮 Flags BEFORE clearing: gameRunning=${gameRunning}, waitingForPlayer=${waitingForPlayer}, matchmakingActive=${matchmakingActive}`);
    
    // Clear all waiting flags - blockchain transactions are complete
    waitingForPlayer = false;
    matchmakingActive = false;
    gameRunning = true;
    
    console.log(`🎮 Flags AFTER clearing: gameRunning=${gameRunning}, waitingForPlayer=${waitingForPlayer}, matchmakingActive=${matchmakingActive}`);
    console.log('🚀 Game will start in 1 second...');
    
    // Hide matchmaking screen and start game
    setTimeout(() => {
      hideMatchmakingScreen();
      hideWaitingScreen();
      
      console.log('🎮 Calling startMultiplayerGame...');
      // Start the multiplayer game
      isMultiplayer = true;
      startMultiplayerGame({ playerRole: playerRole });
      
      // Force start game loop now that transactions are complete
      if (!gameLoop) {
        console.log('🔄 Force starting game loop NOW - blockchain complete!');
        gameLoop = setInterval(play, 16);
        console.log('✅✅✅ GAME LOOP STARTED - GAME IS NOW RUNNING! ✅✅✅');
      } else {
        console.log('⚠️  Game loop already running');
      }
    }, 1000);
  });
  
  // Handle game completion (winner gets payout)
  socket.on('gameComplete', async (data) => {
    console.log('🏆 Game completed!', data);
    
    // Complete game on blockchain with verified winner
    if (data.gameId && data.winnerWallet && currentBlockchainGameId) {
      const winnerNumber = data.winner === 'player1' ? 1 : 2;
      const iAmWinner = (winnerNumber === playerNumber);
      
      // Only the WINNER calls completeGame on blockchain
      if (iAmWinner) {
        // Add delay before wallet popup to prevent service worker issues
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const winnings = (data.stakeAmount * 2 * 0.95).toFixed(2); // 95% after 5% fee
        
        // Try to complete game with retry mechanism
        let success = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!success && attempts < maxAttempts) {
          attempts++;
          
          try {
            console.log(`🔗 Completing game on blockchain... (Attempt ${attempts}/${maxAttempts})`);
            console.log('   Game ID:', data.gameId);
            console.log('   Winner:', data.winner, '(Player', winnerNumber, ')');
            console.log('   Winner Wallet:', data.winnerWallet);
            
            // Call smart contract complete_game with winner's wallet address
            const result = await blockchainManager.completeGame(data.winnerWallet);
            
            if (result && result.success) {
              console.log('✅ Game completed on blockchain');
              console.log('📝 Transaction:', result.signature);
              
              // Mark game as completed
              isGameCompleted = true;
              success = true;
              
              // Clear any pending claims since we just completed successfully
              pendingClaimData = null;
              localStorage.removeItem('pendingClaim');
              hideClaimButton();
              
              setTimeout(() => {
                alert('🎊 CONGRATULATIONS! 🎊\n\n' +
                      '💰 You won ' + winnings + ' SOL!\n' +
                      '✅ Payout sent to your wallet!\n\n' +
                      'Transaction: ' + result.signature.substring(0, 20) + '...\n\n' +
                      'Check your Phantom wallet balance.');
                
                // Return to main menu
                exitGame();
              }, 2000);
              
              // Update wallet balance
              await walletManager.updateBalance();
              updateWalletUI();
              
              break; // Exit retry loop
            }
            
          } catch (error) {
            console.error(`❌ Attempt ${attempts} failed:`, error);
            
            // Check if user cancelled wallet popup
            const userCancelled = error.message && (
              error.message.includes('User rejected') || 
              error.message.includes('cancelled') ||
              error.message.includes('denied')
            );
            
            if (userCancelled && attempts < maxAttempts) {
              // Ask if they want to retry
              const retry = confirm(`⚠️ Wallet Transaction Cancelled\n\n` +
                                   `You won ${winnings} SOL but the wallet popup was cancelled.\n\n` +
                                   `Attempt ${attempts}/${maxAttempts}\n\n` +
                                   `Do you want to try again?\n` +
                                   `(Click OK to retry, Cancel to claim manually later)`);
              
              if (!retry) {
                // User chose to claim manually later
                // showManualClaimOption(data, winnings); // DISABLED
                break;
              }
              // Continue to next attempt
            } else if (attempts >= maxAttempts) {
              // Max attempts reached
              // showManualClaimOption(data, winnings); // DISABLED
              break;
            } else {
              // Other error - ask to retry
              const retry = confirm(`⚠️ Transaction Failed\n\n` +
                                   `Error: ${error.message}\n\n` +
                                   `Attempt ${attempts}/${maxAttempts}\n\n` +
                                   `Do you want to try again?`);
              
              if (!retry) {
                // showManualClaimOption(data, winnings); // DISABLED
                break;
              }
            }
          }
        }
        
      } else {
        // Loser just shows message and exits
        console.log('💔 You lost this game');
        
        // Mark game as completed so we don't try to cancel/refund
        isGameCompleted = true;
        
        setTimeout(() => {
          alert('💔 Game Over!\n\n' +
                'Winner: Player ' + winnerNumber + '\n' +
                'You lost ' + data.stakeAmount.toFixed(2) + ' SOL\n\n' +
                'Better luck next time!');
          
          // Return to main menu
          exitGame();
        }, 2000);
        
        // Update wallet balance
        await walletManager.updateBalance();
        updateWalletUI();
      }
    }
    
  });
  
  // =============================================
  // EDGE CASE EVENT HANDLERS
  // =============================================
  
  // Handle opponent forfeit (disconnect/AFK)
  socket.on('opponentForfeited', async (data) => {
    console.log('🏆 Opponent forfeited!', data);
    gameRunning = false;
    
    const winnings = (data.stakeAmount * 2 * 0.95).toFixed(2);
    
    // Try to complete game with retry mechanism
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!success && attempts < maxAttempts) {
      attempts++;
      
      try {
        console.log(`🔗 Claiming forfeit win... (Attempt ${attempts}/${maxAttempts})`);
        
        // Complete game on blockchain with your wallet as winner
        const result = await blockchainManager.completeGame(data.winnerWallet);
        
        if (result && result.success) {
          // Mark game as completed
          isGameCompleted = true;
          success = true;
          
          // Clear any pending claims since we just completed successfully
          pendingClaimData = null;
          localStorage.removeItem('pendingClaim');
          hideClaimButton();
          
          alert('🎊 YOU WIN BY FORFEIT! 🎊\n\n' +
                '💰 You won ' + winnings + ' SOL!\n' +
                'Reason: ' + data.message + '\n\n' +
                'Transaction: ' + result.signature.substring(0, 20) + '...\n\n' +
                'Check your Phantom wallet balance.');
          
          // Update wallet balance
          await walletManager.updateBalance();
          updateWalletUI();
          
          // Return to main menu
          setTimeout(() => exitGame(), 2000);
          
          break; // Exit retry loop
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed:`, error);
        
        // Check if user cancelled wallet popup
        const userCancelled = error.message && (
          error.message.includes('User rejected') || 
          error.message.includes('cancelled') ||
          error.message.includes('denied')
        );
        
        if (userCancelled && attempts < maxAttempts) {
          // Ask if they want to retry
          const retry = confirm(`⚠️ Wallet Transaction Cancelled\n\n` +
                               `You won ${winnings} SOL by forfeit but the wallet popup was cancelled.\n\n` +
                               `Attempt ${attempts}/${maxAttempts}\n\n` +
                               `Do you want to try again?\n` +
                               `(Click OK to retry, Cancel to claim manually later)`);
          
          if (!retry) {
            // User chose to claim manually later
            // showManualClaimOption(data, winnings); // DISABLED
            setTimeout(() => exitGame(), 2000);
            break;
          }
          // Continue to next attempt
        } else if (attempts >= maxAttempts) {
          // Max attempts reached
          // showManualClaimOption(data, winnings); // DISABLED
          setTimeout(() => exitGame(), 2000);
          break;
        } else {
          // Other error - ask to retry
          const retry = confirm(`⚠️ Transaction Failed\n\n` +
                               `Error: ${error.message}\n\n` +
                               `Attempt ${attempts}/${maxAttempts}\n\n` +
                               `Do you want to try again?`);
          
          if (!retry) {
            // showManualClaimOption(data, winnings); // DISABLED
            setTimeout(() => exitGame(), 2000);
            break;
          }
        }
      }
    }
  });
  
  // Handle you forfeited (AFK/kicked)
  socket.on('youForfeited', (data) => {
    console.log('💔 You forfeited the game', data);
    gameRunning = false;
    
    // Mark game as completed (you lost)
    isGameCompleted = true;
    
    alert('⚠️ YOU FORFEITED!\n\n' +
          'Reason: ' + data.message + '\n' +
          'You lost your stake.\n\n' +
          'Returning to main menu.');
    
    // Return to main menu
    setTimeout(() => exitGame(), 2000);
  });
  
  // Handle blockchain transaction failed by other player
  socket.on('blockchainTransactionFailed', async (data) => {
    console.log('⚠️ Other player\'s blockchain transaction failed', data);
    
    // Ignore if game is already completed
    if (isGameCompleted) {
      console.log('✅ Ignoring - game already completed');
      return;
    }
    
    gameRunning = false;
    waitingForPlayer = false;
    matchmakingActive = false;
    
    const playerNum = data.playerNumber === 1 ? 'Player 1 (Host)' : 'Player 2 (Guest)';
    const reason = data.reason === 'cancelled' ? 'cancelled their wallet transaction' : 'encountered an error';
    
    alert('⚠️ GAME CANCELLED\\n\\n' +
          playerNum + ' ' + reason + '.\\n\\n' +
          'The game has been cancelled.\\n' +
          'No blockchain transaction was processed.\\n\\n' +
          'Returning to main menu.');
    
    // If you already created a game, cancel it
    if (currentBlockchainGameId) {
      try {
        await blockchainManager.cancelGame(currentBlockchainGameId);
        console.log('✅ Cancelled your blockchain game');
      } catch (err) {
        console.error('Failed to cancel blockchain game:', err);
        // Don't show error to user - they're already going to menu
      }
      currentBlockchainGameId = null;
    }
    
    // Return to main menu
    hideMatchmakingScreen();
    hideWaitingScreen();
    setTimeout(() => exitGame(), 1000);
  });
  
  // Handle player left lobby before game started
  socket.on('playerLeftLobby', (data) => {
    console.log('👋 Player left lobby', data);
    
    // Ignore if game is already completed
    if (isGameCompleted) {
      console.log('✅ Ignoring playerLeftLobby - game already completed');
      return;
    }
    
    waitingForPlayer = false;
    gameRunning = false;
    
    alert('⚠️ Other player left before game started!\n\n' +
          data.message + '\n\n' +
          'Your stake has been returned.\n' +
          'Returning to main menu.');
    
    // Cancel blockchain game if it exists and not completed
    if (currentBlockchainGameId && !isGameCompleted) {
      blockchainManager.cancelGame(currentBlockchainGameId).catch(err => {
        console.error('Failed to cancel blockchain game:', err);
      });
      currentBlockchainGameId = null;
    }
    
    // Return to main menu
    setTimeout(() => exitGame(), 1000);
  });
  
  // Handle matchmaking timeout (no opponent found)
  socket.on('matchmakingTimeout', async (data) => {
    console.log('⏱️ Matchmaking timeout', data);
    waitingForPlayer = false;
    gameRunning = false;
    
    // Cancel blockchain game and get refund
    if (data.gameId && data.shouldRefund) {
      try {
        const result = await blockchainManager.cancelGame(data.gameId);
        
        if (result && result.success) {
          alert('⏱️ MATCHMAKING TIMEOUT\n\n' +
                'No opponent found within 5 minutes.\n' +
                'Your stake of ' + data.stakeAmount.toFixed(2) + ' SOL has been refunded.\n\n' +
                'Transaction: ' + result.signature.substring(0, 20) + '...\n\n' +
                'Returning to main menu.');
        }
        
        // Update wallet balance
        await walletManager.updateBalance();
        updateWalletUI();
        
      } catch (error) {
        console.error('❌ Failed to cancel game:', error);
        alert('⚠️ Matchmaking timeout!\n\n' +
              data.message + '\n\n' +
              'Error refunding stake: ' + error.message + '\n' +
              'Please check your wallet manually.');
      }
    } else {
      alert('⏱️ MATCHMAKING TIMEOUT\n\n' +
            data.message + '\n\n' +
            'Returning to main menu.');
    }
    
    currentBlockchainGameId = null;
    
    // Return to main menu
    setTimeout(() => exitGame(), 2000);
  });
  
  // Handle server errors
  socket.on('serverError', (data) => {
    console.error('🚨 Server error:', data);
    
    alert('🚨 SERVER ERROR\n\n' +
          data.message + '\n\n' +
          'The game encountered an error.\n' +
          'Returning to main menu.');
    
    // Return to main menu
    setTimeout(() => exitGame(), 1000);
  });
  
  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('🔴 Connection error:', error);
    
    if (gameRunning || waitingForPlayer) {
      alert('⚠️ CONNECTION ERROR\n\n' +
            'Lost connection to game server.\n' +
            'Your game may have been forfeited.\n\n' +
            'Returning to main menu.');
      
      exitGame();
    }
  });
  
  // Handle reconnection
  socket.on('reconnect', () => {
    console.log('🟢 Reconnected to server');
    
    // If we were in a game, it's likely been forfeited
    if (gameRunning || waitingForPlayer) {
      alert('⚠️ RECONNECTED\n\n' +
            'Connection was lost during your game.\n' +
            'Your game may have been forfeited.\n\n' +
            'Returning to main menu.');
      
      exitGame();
    }
    
    // Update wallet balance in case we missed a payout
    walletManager.updateBalance().then(() => {
      updateWalletUI();
    });
  });
}

function updateConnectionStatus(status, type) {
  const statusElement = document.getElementById('connectionStatus');
  const dotElement = document.querySelector('.status-dot');
  
  if (statusElement) {
    statusElement.textContent = status;
  }
  
  if (dotElement) {
    dotElement.className = 'status-dot ' + type;
  }
}

function updateMultiplayerUI() {
  const multiplayerStatus = document.getElementById('multiplayerStatus');
  const roomIdElement = document.getElementById('currentRoomId');
  const roleElement = document.getElementById('currentRole');
  
  if (currentRoomId && multiplayerStatus) {
    multiplayerStatus.style.display = 'block';
    
    if (roomIdElement) {
      roomIdElement.textContent = currentRoomId;
    }
    
    if (roleElement && playerRole) {
      roleElement.textContent = playerRole.charAt(0).toUpperCase() + playerRole.slice(1);
    }
    
    if (waitingForPlayer) {
      updateConnectionStatus('Waiting for player...', 'waiting');
    } else if (isConnected) {
      updateConnectionStatus('Connected', 'connected');
    }
  }
}

function showWaitingScreen(roomId) {
  const overlay = document.createElement('div');
  overlay.id = 'waitingOverlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1001;
    color: white;
    font-size: 1.5em;
  `;
  overlay.innerHTML = `
    <div style="text-align: center;">
      <div style="margin-bottom: 20px;">🎮 Room Created!</div>
      <div style="font-size: 2em; font-weight: bold; color: #60a5fa; margin-bottom: 10px;">${roomId}</div>
      <button id="copyRoomCode" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        margin-bottom: 20px;
        transition: background 0.3s ease;
      " onclick="copyRoomCode('${roomId}')">📋 Copy Code</button>
      <div style="margin-bottom: 20px;">Share this code with your friend</div>
      <div style="font-size: 1.2em; opacity: 0.8;">Waiting for player 2 to join...</div>
      <div style="width: 200px; height: 4px; background: #334155; border-radius: 2px; overflow: hidden; margin-top: 20px;">
        <div style="width: 100%; height: 100%; background: linear-gradient(45deg, #3b82f6, #6366f1); animation: loading 2s ease-in-out infinite;"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

function hideWaitingScreen() {
  const overlay = document.getElementById('waitingOverlay');
  if (overlay) {
    document.body.removeChild(overlay);
  }
}

function copyRoomCode(roomCode) {
  // Try to use the modern clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(roomCode).then(() => {
      showCopyFeedback('Code copied to clipboard!');
    }).catch(() => {
      // Fallback if clipboard API fails
      fallbackCopyTextToClipboard(roomCode);
    });
  } else {
    // Fallback for older browsers or non-secure contexts
    fallbackCopyTextToClipboard(roomCode);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showCopyFeedback('Code copied to clipboard!');
    } else {
      showCopyFeedback('Failed to copy code');
    }
  } catch (err) {
    showCopyFeedback('Failed to copy code');
  }
  
  document.body.removeChild(textArea);
}

function showCopyFeedback(message) {
  const button = document.getElementById('copyRoomCode');
  if (button) {
    const originalText = button.innerHTML;
    button.innerHTML = '✅ Copied!';
    button.style.background = '#22c55e';
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = '#3b82f6';
    }, 2000);
  }
}

// Menu functions
function startQuickMatch() {
  var playerName = document.getElementById('playerName').value.trim();
  if (!playerName) {
    alert('Please enter a player name first!');
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('airHockeyPlayerName', playerName);
  
  // Simulate finding a match
  showMatchmakingScreen();
  setTimeout(() => {
    startGame('computer'); // Start vs AI for now
  }, 2000);
}

// Private room state tracking
var pendingPrivateRoomCode = null;
var privateRoomGameId = null;

// Start private room - show betting modal first
function startPrivateRoom() {
  var playerName = document.getElementById('playerName').value.trim();
  if (!playerName) {
    alert('Please enter a player name first!');
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('airHockeyPlayerName', playerName);
  
  if (!walletManager.connected) {
    alert('Please connect your Phantom wallet first to create a private room!');
    return;
  }
  
  if (!isConnected) {
    alert('Not connected to server. Please try again.');
    return;
  }
  
  // Show betting modal for private room
  showBettingModal('createPrivate');
}

// Old createPrivateRoom function - now integrated into private room flow
function createPrivateRoom() {
  var playerName = document.getElementById('playerName').value.trim();
  if (!playerName) {
    alert('Please enter a player name first!');
    return;
  }
  
  if (!isConnected) {
    alert('Not connected to server. Please try again.');
    return;
  }
  
  // Create room via socket
  const walletAddress = walletManager.getWalletAddress();
  socket.emit('createRoom', {
    playerName: playerName,
    walletAddress: walletAddress
  });
}

// Join private room - check wallet and show room details
function joinRoom() {
  var playerName = document.getElementById('playerName').value.trim();
  var roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
  
  console.log('🎮 joinRoom called with:', { playerName, roomCode });
  
  if (!playerName) {
    alert('Please enter a player name first!');
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('airHockeyPlayerName', playerName);
  
  if (!roomCode || roomCode.length !== 6) {
    alert('Please enter a valid 6-character room code!');
    return;
  }
  
  if (!walletManager.connected) {
    alert('Please connect your Phantom wallet first to join a private room!');
    return;
  }
  
  if (!isConnected) {
    alert('Not connected to server. Please try again.');
    console.error('❌ Socket not connected. isConnected:', isConnected);
    return;
  }
  
  // Double-check socket object exists
  if (!socket || !socket.connected) {
    alert('Socket connection error. Please refresh the page.');
    console.error('❌ Socket object issue:', {socket: !!socket, connected: socket?.connected});
    return;
  }
  
  console.log('✅ All checks passed. Socket connected:', socket.connected);
  console.log('🔗 Socket ID:', socket.id);
  
  // Test if socket is actually working by emitting a test event
  console.log('🧪 Testing socket communication...');
  socket.emit('testConnection', { test: true });
  
  // Request room info from server
  console.log('🔍 Requesting room info for:', roomCode);
  socket.emit('getRoomInfo', { roomId: roomCode });
  
  // Add timeout to detect if server doesn't respond
  setTimeout(() => {
    console.log('⏰ Checking if modal was opened...');
    const modal = document.getElementById('joinPrivateRoomModal');
    if (modal && !modal.classList.contains('active')) {
      console.warn('⚠️ Modal not opened after 3 seconds. Server may not have responded.');
    }
  }, 3000);
}

function generateRoomCode() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var result = '';
  for (var i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function showMatchmakingScreen() {
  // Create a temporary matchmaking overlay
  var overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1001;
    color: white;
    font-size: 1.5em;
  `;
  overlay.innerHTML = `
    <div style="text-align: center;">
      <div style="margin-bottom: 20px;">🔍 Finding opponent...</div>
      <div style="width: 200px; height: 4px; background: #334155; border-radius: 2px; overflow: hidden;">
        <div style="width: 100%; height: 100%; background: linear-gradient(45deg, #3b82f6, #6366f1); animation: loading 2s ease-in-out;"></div>
      </div>
    </div>
  `;
  
  var style = document.createElement('style');
  style.textContent = `
    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    document.body.removeChild(overlay);
    document.head.removeChild(style);
  }, 2000);
}

function startGame(mode) {
  gameMode = mode;
  gameRunning = true;
  document.getElementById('startScreen').classList.add('hidden');
  document.querySelector('.game-container').classList.add('game-active');
  
  // Make sure canvas and game UI are visible
  const canvas = document.getElementById('canvas');
  const gameUI = document.getElementById('gameUI');
  const gameInfo = document.querySelector('.game-info');
  
  if (canvas) canvas.style.display = 'block';
  if (gameUI) gameUI.style.display = 'block';
  if (gameInfo) gameInfo.style.display = 'block';
  
  // Reset game state
  player1_score = 0;
  player2_score = 0;
  ball.x = canvas.width/2;
  ball.y = canvas.height/2;
  xspeed = 0;
  yspeed = 0;
  
  // Initialize audio context on first user interaction
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  // Initialize audio files
  initializeAudioFiles();
  
  // Start game loop
  if (!gameLoop) {
    gameLoop = setInterval(play, 16); // ~60 FPS
  }
}

function startMultiplayerGame(data) {
  console.log('📞 startMultiplayerGame() called');
  console.log('📦 Data received:', data);
  console.log(`🎮 Current flags: gameRunning=${gameRunning}, waitingForPlayer=${waitingForPlayer}, matchmakingActive=${matchmakingActive}`);
  
  gameMode = 'multiplayer';
  isMultiplayer = true;
  
  // Set player names in score panel with fallback to localStorage
  const savedPlayerName = localStorage.getItem('airHockeyPlayerName') || 'You';
  const player1Name = data.player1Name || (playerNumber === 1 ? savedPlayerName : 'Player 1');
  const player2Name = data.player2Name || (playerNumber === 2 ? savedPlayerName : 'Player 2');
  
  document.getElementById('player1Name').textContent = player1Name;
  document.getElementById('player2Name').textContent = player2Name;
  console.log('✅ Set player names - P1:', player1Name, 'P2:', player2Name);
  
  // CRITICAL: Only enable game if NOT waiting for blockchain transactions
  // If matchmakingActive or waitingForPlayer, keep gameRunning false
  if (!matchmakingActive && !waitingForPlayer) {
    console.log('✅ No blockchain wait - enabling game');
    gameRunning = true;
    waitingForPlayer = false;
    matchmakingActive = false;
  } else {
    // Keep game disabled during wallet popups
    console.log('🔒 BLOCKING GAME START - Still waiting for blockchain transactions');
    console.log(`   matchmakingActive=${matchmakingActive}, waitingForPlayer=${waitingForPlayer}`);
    gameRunning = false;
  }
  
  console.log(`🎮 After check: gameRunning=${gameRunning}`);
  
  // Initialize opponent paddle target position
  if (playerNumber === 1) {
    opponentPaddleTarget.x = player2Mallet.x;
    opponentPaddleTarget.y = player2Mallet.y;
  } else if (playerNumber === 2) {
    opponentPaddleTarget.x = player1Mallet.x;
    opponentPaddleTarget.y = player1Mallet.y;
  }
  
  // Set game state from server
  if (data.gameState) {
    ball.x = data.gameState.ball.x;
    ball.y = data.gameState.ball.y;
    xspeed = data.gameState.ball.vx;
    yspeed = data.gameState.ball.vy;
    player1_score = data.gameState.scores.player1;
    player2_score = data.gameState.scores.player2;
  }
  
  document.getElementById('startScreen').classList.add('hidden');
  document.querySelector('.game-container').classList.add('game-active');
  
  // CRITICAL: Make sure canvas and game UI are visible
  const canvas = document.getElementById('canvas');
  const gameUI = document.getElementById('gameUI');
  const gameInfo = document.querySelector('.game-info');
  
  if (canvas) {
    canvas.style.display = 'block';
    console.log('✅ Canvas made visible');
  } else {
    console.error('❌ Canvas element not found!');
  }
  
  if (gameUI) {
    gameUI.style.display = 'block';
    console.log('✅ Game UI made visible');
  } else {
    console.error('❌ Game UI element not found!');
  }
  
  if (gameInfo) {
    gameInfo.style.display = 'block';
    console.log('✅ Game info made visible');
  }
  
  // Initialize audio context on first user interaction
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  console.log('🔍 Checking if should start game loop...');
  console.log(`   matchmakingActive=${matchmakingActive}, waitingForPlayer=${waitingForPlayer}, gameRunning=${gameRunning}`);
  
  // CRITICAL: Only start game loop if blockchain transactions are complete
  if (!matchmakingActive && !waitingForPlayer && gameRunning) {
    if (!gameLoop) {
      console.log('✅✅✅ STARTING GAME LOOP - All conditions met!');
      gameLoop = setInterval(play, 16); // ~60 FPS
    } else {
      console.log('⚠️  Game loop already exists');
    }
  } else {
    console.log('🔒🔒🔒 NOT STARTING GAME LOOP - Waiting for blockchain');
    console.log('   Will start when startGame event clears flags');
  }
  
  console.log(`🎯 Multiplayer game ${gameRunning ? 'ACTIVE' : 'PREPARED (waiting)'} as ${playerRole}`);
}

function showSettings() {
  document.getElementById('settingsScreen').style.display = 'flex';
}

function hideSettings() {
  document.getElementById('settingsScreen').style.display = 'none';
}

function selectTableColor(color) {
  currentTheme = color;
  // Update selected visual
  document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
  document.querySelector(`.color-option.${color}`).classList.add('selected');
}

function selectBallColor(color) {
  currentBallColor = color;
  // Update selected visual
  document.querySelectorAll('.ball-color-option').forEach(opt => opt.classList.remove('selected'));
  document.querySelector(`.ball-color-option.ball-${color}`).classList.add('selected');
}

// Store pending claim data globally
let pendingClaimData = null;

// Show manual claim option when automatic claim fails
function showManualClaimOption(gameData, winnings) {
  console.log('💾 Saving claim data for manual claim later');
  
  // Store claim data
  pendingClaimData = {
    gameId: gameData.gameId,
    winnerWallet: gameData.winnerWallet,
    stakeAmount: gameData.stakeAmount,
    winnings: winnings,
    timestamp: Date.now()
  };
  
  // Save to localStorage as backup
  try {
    localStorage.setItem('pendingClaim', JSON.stringify(pendingClaimData));
  } catch (e) {
    console.error('Failed to save claim to localStorage:', e);
  }
  
  alert('⚠️ Transaction Failed\n\n' +
        `Your winnings of ${winnings} SOL could not be claimed automatically.\n\n` +
        `Don't worry! Your winnings are safe on the blockchain.\n\n` +
        `A "CLAIM WINNINGS" button will appear on the main menu.\n` +
        `Click it whenever you're ready to claim your ${winnings} SOL.`);
  
  // Show claim button on main menu
  setTimeout(() => {
    showClaimButton();
  }, 100);
}

// Show claim button on main menu
function showClaimButton() {
  // Check if button already exists
  let claimBtn = document.getElementById('claimWinningsBtn');
  
  if (!claimBtn) {
    // Create claim button
    claimBtn = document.createElement('button');
    claimBtn.id = 'claimWinningsBtn';
    claimBtn.className = 'claim-winnings-btn';
    claimBtn.innerHTML = '💰 CLAIM WINNINGS 💰';
    claimBtn.onclick = manualClaimWinnings;
    
    // Add to start screen
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
      startScreen.appendChild(claimBtn);
    }
  }
  
  // Make sure it's visible
  claimBtn.style.display = 'block';
}

// Hide claim button
function hideClaimButton() {
  const claimBtn = document.getElementById('claimWinningsBtn');
  if (claimBtn) {
    claimBtn.style.display = 'none';
  }
}

// Manual claim function
async function manualClaimWinnings() {
  if (!pendingClaimData) {
    alert('⚠️ No pending winnings to claim.');
    hideClaimButton();
    return;
  }
  
  const confirm = window.confirm(`💰 Claim Your Winnings\n\n` +
                                `Amount: ${pendingClaimData.winnings} SOL\n\n` +
                                `This will open your Phantom wallet.\n` +
                                `Click OK to continue.`);
  
  if (!confirm) return;
  
  try {
    console.log('🔗 Manually claiming winnings...');
    console.log('   Game ID:', pendingClaimData.gameId);
    console.log('   Winner Wallet:', pendingClaimData.winnerWallet);
    console.log('   Winnings:', pendingClaimData.winnings, 'SOL');
    
    // Call blockchain to complete game
    const result = await blockchainManager.completeGame(pendingClaimData.winnerWallet);
    
    if (result && result.success) {
      console.log('✅ Winnings claimed successfully!');
      
      alert('🎊 SUCCESS! 🎊\n\n' +
            `💰 ${pendingClaimData.winnings} SOL claimed!\n\n` +
            `Transaction: ${result.signature.substring(0, 20)}...\n\n` +
            `Check your Phantom wallet balance.`);
      
      // Clear pending claim
      pendingClaimData = null;
      localStorage.removeItem('pendingClaim');
      hideClaimButton();
      
      // Update wallet balance
      await walletManager.updateBalance();
      updateWalletUI();
    }
    
  } catch (error) {
    console.error('❌ Manual claim failed:', error);
    
    const userCancelled = error.message && (
      error.message.includes('User rejected') || 
      error.message.includes('cancelled') ||
      error.message.includes('denied')
    );
    
    if (userCancelled) {
      alert('⚠️ Transaction cancelled.\n\n' +
            'Your winnings are still safe.\n' +
            'Try again whenever you\'re ready.');
    } else {
      alert('⚠️ Claim failed: ' + error.message + '\n\n' +
            'Your winnings are still safe on the blockchain.\n' +
            'Please try again or contact support.');
    }
  }
}

// Check for pending claims on page load
function checkPendingClaims() {
  try {
    const saved = localStorage.getItem('pendingClaim');
    if (saved) {
      pendingClaimData = JSON.parse(saved);
      
      // Check if claim is not too old (7 days)
      const age = Date.now() - pendingClaimData.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (age < maxAge) {
        console.log('💾 Found pending claim:', pendingClaimData);
        showClaimButton();
      } else {
        console.log('⏰ Pending claim expired, clearing...');
        localStorage.removeItem('pendingClaim');
        pendingClaimData = null;
      }
    }
  } catch (e) {
    console.error('Failed to check pending claims:', e);
  }
}

function exitGame() {
  console.log('🚪 exitGame() called');
  
  // Show confirmation dialog if game is active
  if (gameRunning && !isGameCompleted) {
    const confirmed = confirm('⚠️ Are you sure you want to exit?\n\nExiting during an active game will forfeit the match and you will lose your stake.');
    if (!confirmed) {
      return; // User cancelled, don't exit
    }
  }
  
  gameRunning = false;
  isGameCompleted = false;
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }
  
  // Reset multiplayer state
  if (isMultiplayer) {
    isMultiplayer = false;
    playerRole = null;
    playerNumber = null;
    currentRoomId = null;
    currentBlockchainGameId = null; // Reset blockchain game ID
    
    // Hide multiplayer UI
    const multiplayerStatus = document.getElementById('multiplayerStatus');
    if (multiplayerStatus) {
      multiplayerStatus.style.display = 'none';
    }
    
    // Disconnect from current room (socket stays connected for new games)
    if (socket && isConnected) {
      socket.disconnect();
      socket.connect(); // Reconnect for next game
    }
  }
  
  // Hide all game elements
  const gameUI = document.getElementById('gameUI');
  const canvas = document.getElementById('canvas');
  const gameInfo = document.querySelector('.game-info');
  const startScreen = document.getElementById('startScreen');
  const gameContainer = document.querySelector('.game-container');
  
  if (gameUI) gameUI.style.display = 'none';
  if (canvas) canvas.style.display = 'none';
  if (gameInfo) gameInfo.style.display = 'none';
  
  // Show start screen
  if (startScreen) {
    startScreen.style.display = 'flex';
    startScreen.classList.remove('hidden');
  }
  
  if (gameContainer) gameContainer.classList.remove('game-active');
  
  // Reset scores
  player1_score = 0;
  player2_score = 0;
  
  // Reset player names to default
  document.getElementById('player1Name').textContent = 'Player 1';
  document.getElementById('player2Name').textContent = 'Player 2';
  document.getElementById('player1Score').textContent = '0';
  document.getElementById('player2Score').textContent = '0';
  
  console.log('✅ Returned to main menu');
}

// Game objects
var Mallet = function(x, y, r, color) {
  this.x = x;
  this.y = y;
  this.radius = r;
  this.color = color;
}

var Ball = function(x, y, r) {
  this.x = x;
  this.y = y;
  this.radius = r;
}

// Particle class for hit effects
var Particle = function(x, y, color) {
  this.x = x;
  this.y = y;
  this.vx = (Math.random() - 0.5) * 8; // Random horizontal velocity
  this.vy = (Math.random() - 0.5) * 8; // Random vertical velocity
  this.color = color;
  this.life = 60; // 1 second at 60fps
  this.maxLife = 60;
  this.size = Math.random() * 4 + 2; // Random size between 2-6 pixels
}

// Initialize game objects
var player1Mallet, player2Mallet, ball;
var gameLoop = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize canvas and context
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  
  // Initialize game objects
  player1Mallet = new Mallet(150, canvas.height/2, 40, '#FFD700'); // Yellow
  player2Mallet = new Mallet(850, canvas.height/2, 40, '#00FFFF'); // Cyan
  ball = new Ball(canvas.width/2, canvas.height/2, 20);
  
  // Initialize Socket.IO
  initializeSocket();
  
  // Initialize avatar system - delay to ensure DOM is ready
  setTimeout(() => {
    currentPlayerAvatar = getRandomAvatar();
    setPlayerAvatar('player1Avatar', currentPlayerAvatar);
    initializeAvatarScroll();
    console.log('✅ Avatar system initialized');
  }, 100);
  
  // Check for pending claims from previous session
  // checkPendingClaims(); // DISABLED - Manual claim feature disabled
  
  // Initialize player name from localStorage or generate random
  const savedPlayerName = localStorage.getItem('airHockeyPlayerName');
  if (savedPlayerName) {
    document.getElementById('playerName').value = savedPlayerName;
  } else {
    document.getElementById('playerName').value = 'Player' + Math.floor(Math.random() * 1000);
  }
  
  // Save player name to localStorage on change
  document.getElementById('playerName').addEventListener('input', function(e) {
    const playerName = e.target.value.trim();
    if (playerName) {
      localStorage.setItem('airHockeyPlayerName', playerName);
    }
  });
  
  // Auto-uppercase room code input
  document.getElementById('roomCode').addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });
  
  // Enter key handlers
  document.getElementById('playerName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      startQuickMatch();
    }
  });
  
  document.getElementById('roomCode').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      joinRoom();
    }
  });
});

// Mouse and keyboard controls
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("keydown", keyHandler, false);

function mouseMoveHandler(e) {
  if (!gameRunning) return;
  
  var rect = canvas.getBoundingClientRect();
  var relativeX = e.clientX - rect.left;
  var relativeY = e.clientY - rect.top;

  if (gameMode === 'computer') {
    // Player controls player1 mallet
    if (relativeX > 75 && relativeX < canvas.width/2 - 75) {
      player1Mallet.x = relativeX;
    }
    if (relativeY > 75 && relativeY < canvas.height - 75) {
      player1Mallet.y = relativeY;
    }
  } else if (gameMode === 'multiplayer' && isMultiplayer) {
    // Handle multiplayer paddle movement
    var currentMallet = null;
    var paddleNumber = null;
    
    if (playerNumber === 1) {
      // Player 1 controls left side
      if (relativeX > 75 && relativeX < canvas.width/2 - 75) {
        player1Mallet.x = relativeX;
        currentMallet = player1Mallet;
        paddleNumber = 1;
      }
      if (relativeY > 75 && relativeY < canvas.height - 75) {
        player1Mallet.y = relativeY;
        currentMallet = player1Mallet;
        paddleNumber = 1;
      }
    } else if (playerNumber === 2) {
      // Player 2 controls right side
      if (relativeX > canvas.width/2 + 75 && relativeX < canvas.width - 75) {
        player2Mallet.x = relativeX;
        currentMallet = player2Mallet;
        paddleNumber = 2;
      }
      if (relativeY > 75 && relativeY < canvas.height - 75) {
        player2Mallet.y = relativeY;
        currentMallet = player2Mallet;
        paddleNumber = 2;
      }
    }
    
    // Send paddle position instantly (no throttling)
    if (currentMallet && paddleNumber && socket && isConnected) {
      socket.emit('paddleMove', {
        x: currentMallet.x,
        y: currentMallet.y
      });
    }
  } else if (gameMode === 'multiplayer') {
    // Original multiplayer (local)
    if (relativeX > 75 && relativeX < canvas.width/2 - 75) {
      player1Mallet.x = relativeX;
    }
    if (relativeY > 75 && relativeY < canvas.height - 75) {
      player1Mallet.y = relativeY;
    }
  }
}

function keyHandler(e) {
  if (e.key === 'Escape') {
    gameRunning = false;
    if (gameLoop) {
      clearInterval(gameLoop);
      gameLoop = null;
    }
    document.getElementById('startScreen').classList.remove('hidden');
    document.querySelector('.game-container').classList.remove('game-active');
  }
}

// Drawing functions
function drawBackground() {
  var theme = colorThemes[currentTheme];
  
  // Create gradient background
  var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, theme.bg1);
  gradient.addColorStop(0.5, theme.bg2);
  gradient.addColorStop(1, theme.bg3);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawScoreBoard() {
  // Update HTML score display
  document.getElementById('player1Score').textContent = player1_score;
  document.getElementById('player2Score').textContent = player2_score;
  
  // Draw FPS and Ping on canvas (top right corner)
  ctx.save();
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  
  // FPS Counter
  ctx.fillStyle = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
  ctx.fillText(`FPS: ${fps}`, canvas.width - 10, 25);
  
  // Ping display (only in multiplayer)
  if (isMultiplayer && isConnected) {
    const pingColor = ping < 50 ? '#00ff00' : ping < 100 ? '#ffff00' : ping < 200 ? '#ff9900' : '#ff0000';
    ctx.fillStyle = pingColor;
    ctx.fillText(`Ping: ${ping}ms`, canvas.width - 10, 45);
    
    // Connection quality indicator
    const quality = ping < 50 ? '●●●' : ping < 100 ? '●●○' : ping < 200 ? '●○○' : '○○○';
    ctx.fillStyle = pingColor;
    ctx.fillText(quality, canvas.width - 10, 65);
  }
  
  ctx.restore();
}

function drawTable() {
  var theme = colorThemes[currentTheme];
  
  // Table border
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  
  // Center line (dashed)
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width/2, 50);
  ctx.lineTo(canvas.width/2, canvas.height - 50);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Center circle
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, 60, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner center circle
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, 15, 0, Math.PI * 2);
  ctx.stroke();
  
  // Goal areas
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;
  
  // Left goal
  ctx.beginPath();
  ctx.arc(50, canvas.height/2, 80, -Math.PI/2, Math.PI/2);
  ctx.stroke();
  
  // Right goal
  ctx.beginPath();
  ctx.arc(canvas.width - 50, canvas.height/2, 80, Math.PI/2, -Math.PI/2);
  ctx.stroke();
}

function drawMallet(mallet) {
  // Mallet shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(mallet.x + 3, mallet.y + 3, mallet.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Mallet body
  ctx.fillStyle = mallet.color;
  ctx.beginPath();
  ctx.arc(mallet.x, mallet.y, mallet.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Mallet border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Mallet highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.arc(mallet.x - 8, mallet.y - 8, mallet.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawBall() {
  // Ball shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Ball body
  ctx.fillStyle = ballColors[currentBallColor];
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Ball border
  ctx.strokeStyle = currentBallColor === 'white' ? '#ccc' : '#333';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Ball highlight
  ctx.fillStyle = currentBallColor === 'white' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(ball.x - 5, ball.y - 5, ball.radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function distance(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function computerAI() {
  if (gameMode !== 'computer') return;
  
  var targetX = ball.x;
  var targetY = ball.y;
  
  // Predict ball position
  if (ball.y < canvas.height/2 && yspeed < 0) {
    targetX = ball.x + xspeed * 10;
    targetY = ball.y + yspeed * 10;
  }
  
  // Keep computer mallet on its side
  if (player2Mallet.x < canvas.width/2 + 50) {
    player2Mallet.x = canvas.width/2 + 50;
  }
  
  // Move towards target
  var speed = 4;
  if (player2Mallet.x < targetX - 10) {
    player2Mallet.x += speed;
  } else if (player2Mallet.x > targetX + 10) {
    player2Mallet.x -= speed;
  }
  
  if (player2Mallet.y < targetY - 10) {
    player2Mallet.y += speed;
  } else if (player2Mallet.y > targetY + 10) {
    player2Mallet.y -= speed;
  }
  
  // Keep within bounds
  if (player2Mallet.x > canvas.width - 90) player2Mallet.x = canvas.width - 90;
  if (player2Mallet.y < 90) player2Mallet.y = 90;
  if (player2Mallet.y > canvas.height - 90) player2Mallet.y = canvas.height - 90;
}

function updatePhysics() {
  // In multiplayer mode, only the host handles authoritative physics
  if (isMultiplayer && playerRole !== 'host') {
    // Guest: Interpolate ball between server updates for smooth rendering
    if (ballServerState.timestamp > 0 && ballPreviousState.timestamp > 0) {
      const now = Date.now();
      const renderTime = now - renderTimestamp;
      
      // If we have two server states, interpolate between them
      if (ballServerState.timestamp > ballPreviousState.timestamp) {
        const timeBetweenStates = ballServerState.timestamp - ballPreviousState.timestamp;
        const alpha = (renderTime - ballPreviousState.timestamp) / timeBetweenStates;
        
        // Clamp alpha between 0 and 1
        const clampedAlpha = Math.max(0, Math.min(1, alpha));
        
        // Smooth interpolation
        ball.x = ballPreviousState.x + (ballServerState.x - ballPreviousState.x) * clampedAlpha;
        ball.y = ballPreviousState.y + (ballServerState.y - ballPreviousState.y) * clampedAlpha;
        xspeed = ballPreviousState.vx + (ballServerState.vx - ballPreviousState.vx) * clampedAlpha;
        yspeed = ballPreviousState.vy + (ballServerState.vy - ballPreviousState.vy) * clampedAlpha;
      } else {
        // Use latest server state
        ball.x = ballServerState.x;
        ball.y = ballServerState.y;
        xspeed = ballServerState.vx;
        yspeed = ballServerState.vy;
      }
    }
    return; // Guest doesn't run physics simulation
  }
  
  // Host: Run authoritative physics
  ball.x += xspeed;
  ball.y += yspeed;
  
  var scoreChanged = false;
  var soundEvent = null;
  var scoringPlayer = null; // Track which player scored
  
  // Wall collisions with better boundary detection
  if (ball.x - ball.radius <= 50) {
    // Check if it's a goal (left side)
    if (ball.y > canvas.height/2 - 80 && ball.y < canvas.height/2 + 80) {
      player2_score++;
      console.log("Player 2 scores!");
      playGoalSound();
      showGoalCelebration(2);
      resetBall();
      scoreChanged = true;
      soundEvent = 'goal';
      scoringPlayer = 2; // Player 2 scored
      
      // Send score update to server
      if (socket && isConnected && isMultiplayer) {
        socket.emit('scoreUpdate', {
          player: 'player2',
          score: player2_score,
          roomId: currentRoomId
        });
      }
      
      checkWinCondition();
    } else {
      ball.x = 50 + ball.radius;
      xspeed *= -0.8;
      playWallSound();
      soundEvent = 'wall';
    }
  }
  
  if (ball.x + ball.radius >= canvas.width - 50) {
    // Check if it's a goal (right side)
    if (ball.y > canvas.height/2 - 80 && ball.y < canvas.height/2 + 80) {
      player1_score++;
      console.log("Player 1 scores!");
      playGoalSound();
      showGoalCelebration(1);
      resetBall();
      scoreChanged = true;
      soundEvent = 'goal';
      scoringPlayer = 1; // Player 1 scored
      
      // Send score update to server
      if (socket && isConnected && isMultiplayer) {
        socket.emit('scoreUpdate', {
          player: 'player1',
          score: player1_score,
          roomId: currentRoomId
        });
      }
      
      checkWinCondition();
    } else {
      ball.x = canvas.width - 50 - ball.radius;
      xspeed *= -0.8;
      playWallSound();
      soundEvent = 'wall';
    }
  }
  
  if (ball.y - ball.radius <= 50) {
    ball.y = 50 + ball.radius;
    yspeed *= -0.8;
    playWallSound();
    soundEvent = 'wall';
  }
  
  if (ball.y + ball.radius >= canvas.height - 50) {
    ball.y = canvas.height - 50 - ball.radius;
    yspeed *= -0.8;
    playWallSound();
    soundEvent = 'wall';
  }
  
  // Mallet collisions with improved collision handling
  var hitOccurred = false;
  var hitPosition = null; // Track where hit occurred for particle effects
  
  if (handleMalletCollision(player1Mallet)) {
    hitOccurred = true;
    hitPosition = { x: ball.x, y: ball.y };
  }
  if (handleMalletCollision(player2Mallet)) {
    hitOccurred = true;
    hitPosition = { x: ball.x, y: ball.y };
  }
  
  if (hitOccurred) {
    soundEvent = 'hit';
  }
  
  // Apply friction
  xspeed *= 0.995;
  yspeed *= 0.995;
  
  // Only HOST sends authoritative updates to network
  // Guest plays locally and receives corrections
  if (isMultiplayer && socket && isConnected && playerRole === 'host') {
    const now = Date.now();
    
    // Send ball position update at 60fps for smooth experience
    if ((now - lastBallUpdate) > ballUpdateInterval) {
      socket.emit('ballUpdate', {
        x: ball.x,
        y: ball.y,
        vx: xspeed,
        vy: yspeed
      });
      lastBallUpdate = now;
    }
    
    // Send score update if changed (only host is authoritative)
    if (scoreChanged && playerRole === 'host') {
      socket.emit('scoreUpdate', {
        player1: player1_score,
        player2: player2_score
      });
    }
    
    // Send sound event (only host)
    if (soundEvent && playerRole === 'host') {
      const eventData = { type: soundEvent };
      // Include player number for goal celebrations
      if (soundEvent === 'goal' && scoringPlayer) {
        eventData.playerNumber = scoringPlayer;
      }
      // Include position and color for hit particle effects
      if (soundEvent === 'hit' && hitPosition) {
        eventData.x = hitPosition.x;
        eventData.y = hitPosition.y;
        eventData.ballColor = currentBallColor;
      }
      socket.emit('gameEvent', eventData);
    }
  } else if (isMultiplayer && playerRole !== 'host') {
    // Guest detects local collisions for immediate feedback
    // but doesn't broadcast them (host is authoritative)
    if (soundEvent) {
      // Play sounds locally even as guest
      switch(soundEvent) {
        case 'goal': playGoalSound(); break;
        case 'hit': playHitSound(); break;
        case 'wall': playWallSound(); break;
      }
    }
  }
  
  // Keep mallets in bounds
  constrainMallet(player1Mallet, true);
  constrainMallet(player2Mallet, false);
}

function resetBall() {
  ball.x = canvas.width/2;
  ball.y = canvas.height/2;
  xspeed = 0;
  yspeed = 0;
}

function checkWinCondition() {
  if (player1_score >= 7 || player2_score >= 7) {
    const winner = player1_score >= 7 ? 1 : 2;
    
    // Stop the game immediately
    gameRunning = false;
    if (gameLoop) {
      clearInterval(gameLoop);
      gameLoop = null;
    }
    
    // Emit game completion to server with scores
    if (socket && isConnected && isMultiplayer) {
      socket.emit('gameComplete', {
        winner: winner === 1 ? 'player1' : 'player2',
        player1Score: player1_score,
        player2Score: player2_score,
        roomId: currentRoomId
      });
      
      // Send victory celebration event (only host)
      if (playerRole === 'host') {
        socket.emit('gameEvent', {
          type: 'victory',
          winner: winner
        });
      }
    }
    
    // Start epic winning celebration
    showWinningCelebration(winner);
  }
}

function showWinningCelebration(winner) {
  // Play the winning audio
  const winningAudio = document.getElementById('winningSound');
  if (winningAudio) {
    winningAudio.currentTime = 0;
    winningAudio.volume = 0.8;
    winningAudio.play().catch(error => {
      console.log('Could not play winning audio:', error);
    });
  }
  
  // Create epic winning overlay
  const celebration = document.createElement('div');
  celebration.className = 'winning-celebration';
  celebration.innerHTML = `
    <div class="winning-content">
      <div class="champion-crown">👑</div>
      <div class="winner-text">CHAMPION!</div>
      <div class="player-winner">Player ${winner} Wins!</div>
      <div class="victory-message">🏆 VICTORY! 🏆</div>
      
    
      
      <div class="confetti-container">
        ${generateConfetti(30)}
      </div>
      
      <div class="return-message">Returning to main menu...</div>
    </div>
    
    <div class="epic-background-effects">
      <div class="light-ray ray1"></div>
      <div class="light-ray ray2"></div>
      <div class="light-ray ray3"></div>
      <div class="light-ray ray4"></div>
    </div>
  `;
  
  document.body.appendChild(celebration);
  
  // Add screen shake effect for 2 seconds
  document.body.style.animation = 'epicScreenShake 2s ease-in-out';
  setTimeout(() => {
    document.body.style.animation = '';
  }, 2000);
  
  // Return to main menu after 10 seconds
  setTimeout(() => {
    if (celebration.parentNode) {
      celebration.parentNode.removeChild(celebration);
    }
    
    // Reset game and return to main menu
    resetGameToMainMenu();
  }, 10000);
}

function generateConfetti(count) {
  let confettiHTML = '';
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const animationDelay = Math.random() * 3;
    const animationDuration = 3 + Math.random() * 2;
    
    confettiHTML += `
      <div class="confetti" 
           style="left: ${left}%; 
                  background-color: ${color}; 
                  animation-delay: ${animationDelay}s;
                  animation-duration: ${animationDuration}s;">
      </div>`;
  }
  
  return confettiHTML;
}

function resetGameToMainMenu() {
  // Reset all game variables
  player1_score = 0;
  player2_score = 0;
  gameRunning = false;
  gameMode = null;
  
  // Reset multiplayer variables
  if (isMultiplayer) {
    isMultiplayer = false;
    playerRole = null;
    playerNumber = null;
    currentRoomId = null;
    
    // Hide multiplayer status
    const multiplayerStatus = document.getElementById('multiplayerStatus');
    if (multiplayerStatus) {
      multiplayerStatus.style.display = 'none';
    }
  }
  
  // Show main menu and hide game
  document.getElementById('startScreen').classList.remove('hidden');
  document.querySelector('.game-container').classList.remove('game-active');
  
  // Reset ball and mallets
  if (ball && player1Mallet && player2Mallet) {
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    player1Mallet.x = 150;
    player1Mallet.y = canvas.height/2;
    player2Mallet.x = 850;
    player2Mallet.y = canvas.height/2;
    xspeed = 0;
    yspeed = 0;
  }
}

function handleMalletCollision(mallet) {
  var dist = distance(mallet.x, mallet.y, ball.x, ball.y);
  var minDistance = mallet.radius + ball.radius;
  
  if (dist < minDistance && dist > 0) {
    playHitSound();
    
    // Create hit effect particles at collision point
    createHitEffect(ball.x, ball.y, currentBallColor);
    
    // Calculate collision vector
    var dx = ball.x - mallet.x;
    var dy = ball.y - mallet.y;
    
    // Normalize the collision vector
    var length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
    } else {
      // If ball is exactly on mallet center, push it away randomly
      dx = (Math.random() - 0.5) * 2;
      dy = (Math.random() - 0.5) * 2;
      length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }
    
    // Push ball completely outside mallet
    ball.x = mallet.x + dx * (minDistance + 2);
    ball.y = mallet.y + dy * (minDistance + 2);
    
    // Set new velocity based on collision
    var speed = Math.max(ball_speed * 0.8, Math.sqrt(xspeed * xspeed + yspeed * yspeed));
    xspeed = dx * speed;
    yspeed = dy * speed;
    
    // Ensure ball stays within bounds after collision
    if (ball.x - ball.radius < 50) ball.x = 50 + ball.radius;
    if (ball.x + ball.radius > canvas.width - 50) ball.x = canvas.width - 50 - ball.radius;
    if (ball.y - ball.radius < 50) ball.y = 50 + ball.radius;
    if (ball.y + ball.radius > canvas.height - 50) ball.y = canvas.height - 50 - ball.radius;
    
    return true; // Collision occurred
  }
  
  return false; // No collision
}

function constrainMallet(mallet, isPlayer1) {
  if (isPlayer1) {
    // Player 1 (left side) constraints
    if (mallet.x < 90) mallet.x = 90;
    if (mallet.x > canvas.width/2 - 50) mallet.x = canvas.width/2 - 50;
  } else {
    // Player 2 (right side) constraints
    if (mallet.x < canvas.width/2 + 50) mallet.x = canvas.width/2 + 50;
    if (mallet.x > canvas.width - 90) mallet.x = canvas.width - 90;
  }
  
  // Common Y constraints for both players
  if (mallet.y < 90) mallet.y = 90;
  if (mallet.y > canvas.height - 90) mallet.y = canvas.height - 90;
}

function play() {
  // Don't run game during matchmaking or while waiting for blockchain transactions
  if (!gameRunning || matchmakingActive || waitingForPlayer) {
    // Only log every 60 frames to avoid spam
    if (Math.random() < 0.016) { // ~1 per second at 60fps
      console.log(`⏸️  play() blocked: gameRunning=${gameRunning}, matchmakingActive=${matchmakingActive}, waitingForPlayer=${waitingForPlayer}`);
    }
    return;
  }
  
  // Calculate FPS
  frameCount++;
  const currentTime = Date.now();
  if (currentTime - lastFpsUpdate >= fpsUpdateInterval) {
    fps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = currentTime;
  }
  
  // Send ping to server periodically (multiplayer only)
  if (isMultiplayer && socket && isConnected) {
    if (currentTime - lastPingTime >= pingInterval) {
      lastPingTime = currentTime;
      socket.emit('ping');
    }
  }
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw everything
  drawBackground();
  drawTable();
  drawScoreBoard();
  
  // Check if ball is stuck
  checkBallStuck();
  
  // Update game logic
  computerAI();
  updatePhysics();
  
  // Update multiplayer paddle interpolation
  updatePaddleInterpolation();
  
  // Update particles
  updateParticles();
  
  // Draw game objects
  drawMallet(player1Mallet);
  drawMallet(player2Mallet);
  drawBall();
  
  // Draw particles on top
  drawParticles();
}

function checkBallStuck() {
  // Check if ball has barely moved
  var ballMoved = Math.abs(ball.x - lastBallX) + Math.abs(ball.y - lastBallY);
  var ballSpeed = Math.abs(xspeed) + Math.abs(yspeed);
  
  if (ballMoved < 1 && ballSpeed < 0.5) {
    ballStuckTimer++;
    if (ballStuckTimer > stuckThreshold) {
      console.log("Ball appears stuck, freeing it...");
      freeBall();
      ballStuckTimer = 0;
    }
  } else {
    ballStuckTimer = 0;
  }
  
  lastBallX = ball.x;
  lastBallY = ball.y;
}

function freeBall() {
  // Move ball to center and give it a random push
  ball.x = canvas.width/2 + (Math.random() - 0.5) * 100;
  ball.y = canvas.height/2 + (Math.random() - 0.5) * 100;
  
  // Ensure ball is within bounds
  if (ball.x < 70) ball.x = 70;
  if (ball.x > canvas.width - 70) ball.x = canvas.width - 70;
  if (ball.y < 70) ball.y = 70;
  if (ball.y > canvas.height - 70) ball.y = canvas.height - 70;
  
  // Give ball a random velocity
  var angle = Math.random() * Math.PI * 2;
  xspeed = Math.cos(angle) * ball_speed * 0.7;
  yspeed = Math.sin(angle) * ball_speed * 0.7;
  
  playWallSound(); // Play sound to indicate ball was freed
}

// =====================================
// Web3 Wallet Integration Functions
// =====================================

var selectedStakeAmount = 1; // Default stake
var pendingGameAction = null; // 'create' or 'join'
var pendingRoomCode = null;

// Connect Phantom Wallet
async function connectWallet() {
  try {
    const walletButton = document.getElementById('walletButton');
    const walletButtonText = document.getElementById('walletButtonText');
    
    // Show loading state
    walletButtonText.textContent = 'Connecting...';
    walletButton.disabled = true;
    
    // Connect wallet
    const result = await walletManager.connect();
    
    if (result.success) {
      // Initialize blockchain
      await blockchainManager.initialize(walletManager.provider, 'devnet');
      
      // Update UI
      updateWalletUI();
      
      // Enable game buttons
      enableGameButtons();
      
      console.log('✅ Wallet connected successfully');
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Failed to connect wallet:', error);
    alert('Failed to connect wallet: ' + error.message);
    
    // Reset button
    document.getElementById('walletButtonText').textContent = 'Connect Phantom Wallet';
    document.getElementById('walletButton').disabled = false;
  }
}

// Update wallet UI
function updateWalletUI() {
  const walletInfo = walletManager.getWalletInfo();
  
  if (walletInfo.connected) {
    // Update button
    const walletButton = document.getElementById('walletButton');
    const walletButtonText = document.getElementById('walletButtonText');
    walletButton.classList.add('connected');
    walletButtonText.textContent = '✓ ' + walletInfo.shortAddress;
    walletButton.disabled = false;
    walletButton.onclick = disconnectWallet;
    
    // Show wallet info
    document.getElementById('walletInfo').style.display = 'block';
    document.getElementById('walletAddress').textContent = walletInfo.shortAddress;
    document.getElementById('walletBalance').textContent = walletInfo.formattedBalance;
    document.getElementById('walletNetwork').textContent = walletInfo.network;
    
    // Show airdrop button and help link only on devnet
    const airdropButton = document.getElementById('airdropButton');
    const airdropHelp = document.getElementById('airdropHelp');
    
    if (airdropButton) {
      if (walletInfo.network === 'devnet') {
        airdropButton.style.display = 'block';
        if (airdropHelp) airdropHelp.style.display = 'block';
      } else {
        airdropButton.style.display = 'none';
        if (airdropHelp) airdropHelp.style.display = 'none';
      }
    }
  } else {
    // Reset UI
    const walletButton = document.getElementById('walletButton');
    const walletButtonText = document.getElementById('walletButtonText');
    walletButton.classList.remove('connected');
    walletButtonText.textContent = 'Connect Phantom Wallet';
    walletButton.disabled = false;
    walletButton.onclick = connectWallet;
    
    // Hide wallet info
    document.getElementById('walletInfo').style.display = 'none';
    
    // Hide airdrop button and help
    const airdropButton = document.getElementById('airdropButton');
    const airdropHelp = document.getElementById('airdropHelp');
    
    if (airdropButton) {
      airdropButton.style.display = 'none';
    }
    if (airdropHelp) {
      airdropHelp.style.display = 'none';
    }
    
    // Disable game buttons
    disableGameButtons();
  }
}

// Disconnect wallet
async function disconnectWallet() {
  if (confirm('Are you sure you want to disconnect your wallet?')) {
    await walletManager.disconnect();
    updateWalletUI();
    console.log('👋 Wallet disconnected');
  }
}

// Handle wallet disconnect during active game
function handleWalletDisconnect() {
  console.log('⚠️ Wallet disconnected - cleaning up game state');
  
  // If in active multiplayer game, exit gracefully
  if (gameRunning && isMultiplayer && isConnected) {
    alert('⚠️ Wallet disconnected! Exiting game...');
    
    // Cancel blockchain game if applicable
    if (currentBlockchainGameId && blockchainManager.currentGameId) {
      try {
        blockchainManager.cancelGame().catch(err => {
          console.error('Failed to cancel blockchain game:', err);
        });
      } catch (error) {
        console.error('Error canceling game:', error);
      }
    }
    
    // Exit game
    exitGame();
  }
  
  // Update UI
  updateWalletUI();
}

// Handle wallet disconnect during active game
function handleWalletDisconnect() {
  console.log('⚠️ Wallet disconnected - cleaning up game state');
  
  // If in active multiplayer game, exit gracefully
  if (gameRunning && isMultiplayer && isConnected) {
    alert('⚠️ Wallet disconnected! Exiting game...');
    
    // Cancel blockchain game if applicable
    if (currentBlockchainGameId && blockchainManager.currentGameId) {
      try {
        blockchainManager.cancelGame().catch(err => {
          console.error('Failed to cancel blockchain game:', err);
        });
      } catch (error) {
        console.error('Error canceling game:', error);
      }
    }
    
    // Exit game
    exitGame();
  }
  
  // Update UI
  updateWalletUI();
}

// Enable/disable game buttons based on wallet connection
function enableGameButtons() {
  const quickMatchBtn = document.getElementById('quickMatchBtn');
  const buttons = document.querySelectorAll('.game-button');
  
  buttons.forEach(button => {
    button.disabled = false;
  });
  
  // Quick Match requires wallet
  if (quickMatchBtn) {
    quickMatchBtn.disabled = false;
  }
}

function disableGameButtons() {
  const quickMatchBtn = document.getElementById('quickMatchBtn');
  
  // Only disable Quick Match (requires wallet)
  if (quickMatchBtn) {
    quickMatchBtn.disabled = true;
  }
  
  // Private room and other buttons stay enabled (free play)
}

// Show betting modal
function showBettingModal(action, roomCode = null) {
  pendingGameAction = action;
  pendingRoomCode = roomCode;
  
  const modal = document.getElementById('bettingModal');
  const confirmBtn = document.getElementById('confirmBetBtn');
  const availableBalance = document.getElementById('availableBalance');
  const customStakeInput = document.getElementById('customStakeInput');
  
  // Update available balance
  if (availableBalance && walletManager.connected) {
    availableBalance.textContent = walletManager.getFormattedBalance();
  }
  
  // Clear custom input
  if (customStakeInput) {
    customStakeInput.value = '';
  }
  
  // Update button text based on action
  if (confirmBtn) {
    if (action === 'create') {
      confirmBtn.textContent = 'Confirm & Find Match';
    } else if (action === 'join') {
      confirmBtn.textContent = 'Confirm & Join Game';
    } else if (action === 'createPrivate') {
      confirmBtn.textContent = 'Confirm & Create Room';
    }
  }
  
  modal.classList.add('active');
  updateBetSummary();
}

// Close betting modal
function closeBettingModal() {
  const modal = document.getElementById('bettingModal');
  modal.classList.remove('active');
  pendingGameAction = null;
  pendingRoomCode = null;
}

// Select stake amount
function selectStake(amount) {
  selectedStakeAmount = amount;
  
  // Clear custom input
  const customStakeInput = document.getElementById('customStakeInput');
  if (customStakeInput) {
    customStakeInput.value = '';
  }
  
  // Update UI
  const options = document.querySelectorAll('.stake-option');
  options.forEach(option => {
    option.classList.remove('selected');
    if (parseFloat(option.textContent) === amount) {
      option.classList.add('selected');
    }
  });
  
  updateBetSummary();
}

// Select custom stake amount
function selectCustomStake() {
  const customStakeInput = document.getElementById('customStakeInput');
  const value = parseFloat(customStakeInput.value);
  
  // Deselect preset buttons
  const options = document.querySelectorAll('.stake-option');
  options.forEach(option => {
    option.classList.remove('selected');
  });
  
  if (value && value > 0) {
    selectedStakeAmount = value;
  } else {
    // If invalid, reset to default
    selectedStakeAmount = 1;
  }
  
  updateBetSummary();
}

// Update bet summary
function updateBetSummary() {
  const totalPool = selectedStakeAmount * 2;
  const platformFee = totalPool * 0.05;
  const winnerAmount = totalPool - platformFee;
  const requiredBalance = selectedStakeAmount + 0.01; // +0.01 for fees
  
  document.getElementById('stakeAmount').textContent = selectedStakeAmount.toFixed(2) + ' SOL';
  document.getElementById('totalPool').textContent = totalPool.toFixed(2) + ' SOL';
  document.getElementById('winnerAmount').textContent = winnerAmount.toFixed(2) + ' SOL (95%)';
  document.getElementById('platformFee').textContent = platformFee.toFixed(2) + ' SOL (5%)';
  
  // Update balance warning
  const balanceWarning = document.getElementById('balanceWarning');
  const requiredAmountSpan = document.getElementById('requiredAmount');
  
  if (walletManager.connected && !walletManager.hasSufficientBalance(requiredBalance)) {
    if (balanceWarning) {
      balanceWarning.style.display = 'block';
      if (requiredAmountSpan) {
        requiredAmountSpan.textContent = requiredBalance.toFixed(2);
      }
    }
  } else {
    if (balanceWarning) {
      balanceWarning.style.display = 'none';
    }
  }
}

// Matchmaking variables
var matchmakingActive = false;
var matchmakingTimeout = null;

// Show matchmaking screen
function showMatchmakingScreen() {
  const screen = document.getElementById('matchmakingScreen');
  const startScreen = document.getElementById('startScreen');
  const gameContainer = document.querySelector('.game-container');
  const playerName = document.getElementById('playerName').value.trim() || 'You';
  
  // Hide start screen and game canvas
  if (startScreen) {
    startScreen.classList.add('hidden');
  }
  
  // Remove game-active class to hide canvas
  if (gameContainer) {
    gameContainer.classList.remove('game-active');
  }
  
  // Update player 1 info with actual SOL amount
  document.getElementById('player1Name').textContent = playerName;
  document.getElementById('player1Stake').textContent = selectedStakeAmount.toFixed(2);
  
  // Update pool amount (total winnings = stake x 2)
  const poolAmount = (selectedStakeAmount * 2).toFixed(2);
  document.getElementById('matchPoolAmount').textContent = poolAmount;
  
  // Reset opponent info with same stake amount
  document.getElementById('player2Name').textContent = 'Searching...';
  document.getElementById('player2Stake').textContent = selectedStakeAmount.toFixed(2);
  
  // Reset avatar animations
  const opponentAvatar = document.getElementById('opponentAvatar');
  const foundAvatar = document.getElementById('player2Avatar');
  const scrollContainer = document.getElementById('avatarScrollContainer');
  
  console.log('🔄 Resetting avatar animations...');
  
  opponentAvatar.classList.add('slot-machine');
  opponentAvatar.classList.remove('found');
  
  // Reset scroll container and hide found avatar
  if (scrollContainer) {
    scrollContainer.style.display = 'flex';
    scrollContainer.style.visibility = 'visible';
    scrollContainer.style.opacity = '1';
    startAvatarRotation();
    console.log('✅ Avatar rotation started');
  }
  if (foundAvatar) {
    foundAvatar.style.display = 'none';
    foundAvatar.classList.remove('show');
  }
  
  // Show screen
  screen.classList.add('active');
  matchmakingActive = true;
  waitingForPlayer = true;
  gameRunning = false; // Ensure game doesn't run during matchmaking
  
  // Start status message rotation
  updateMatchmakingStatus();
  
  // Start automatic matchmaking - no timeout, waiting for real match
  // The match will be found via server matchmaking queue
}

// Rotate status messages to show progress
let statusMessageIndex = 0;
let statusMessageInterval = null;

function updateMatchmakingStatus() {
  const messages = [
    { main: 'Finding opponent with matching stake...', sub: 'Searching globally for players' },
    { main: 'Scanning player pool...', sub: 'Looking for available opponents' },
    { main: 'Matching skill levels...', sub: 'Finding the perfect opponent' },
    { main: 'Checking wallet balances...', sub: 'Verifying stake amounts' },
    { main: 'Almost there...', sub: 'Preparing your match' }
  ];
  
  // Clear any existing interval
  if (statusMessageInterval) {
    clearInterval(statusMessageInterval);
  }
  
  // Update message every 3 seconds
  statusMessageIndex = 0;
  statusMessageInterval = setInterval(() => {
    if (!matchmakingActive) {
      clearInterval(statusMessageInterval);
      return;
    }
    
    const message = messages[statusMessageIndex];
    const textEl = document.getElementById('searchText');
    const subtextEl = document.getElementById('searchSubtext');
    
    if (textEl && message) {
      textEl.textContent = message.main;
    }
    if (subtextEl && message) {
      subtextEl.textContent = message.sub;
    }
    
    statusMessageIndex = (statusMessageIndex + 1) % messages.length;
  }, 3000);
}

function setMatchmakingStatus(mainText, subText) {
  const textEl = document.getElementById('searchText');
  const subtextEl = document.getElementById('searchSubtext');
  
  if (textEl) textEl.textContent = mainText;
  if (subtextEl) subtextEl.textContent = subText;
  
  // Clear interval when custom message is set
  if (statusMessageInterval) {
    clearInterval(statusMessageInterval);
    statusMessageInterval = null;
  }
}

// Start automatic matchmaking with blockchain game creation
async function startAutomaticMatchmaking() {
  try {
    const playerName = document.getElementById('playerName').value.trim() || `Player${Math.floor(Math.random() * 1000)}`;
    
    console.log('🎮 Joining matchmaking queue...');
    
    // Join matchmaking queue WITHOUT creating blockchain game
    // Player 1 will create after match, Player 2 will join
    socket.emit('findMatch', {
      playerName: playerName,
      stakeAmount: selectedStakeAmount,
      walletAddress: walletManager.publicKey.toString()
    });
    
    console.log('🔍 Waiting to be matched...');
    
  } catch (error) {
    console.error('❌ Failed to start matchmaking:', error);
    hideMatchmakingScreen();
    
    alert('⚠️ Failed to start matchmaking!\\n\\n' +
          'Error: ' + error.message + '\\n\\n' +
          'Please try again or check your wallet connection.');
  }
}

// Hide matchmaking screen
function hideMatchmakingScreen() {
  const screen = document.getElementById('matchmakingScreen');
  const startScreen = document.getElementById('startScreen');
  
  screen.classList.remove('active');
  matchmakingActive = false;
  
  // Show start screen again
  if (startScreen) {
    startScreen.classList.remove('hidden');
  }
  
  // Clear status message interval
  if (statusMessageInterval) {
    clearInterval(statusMessageInterval);
    statusMessageInterval = null;
  }
  
  if (matchmakingTimeout) {
    clearTimeout(matchmakingTimeout);
    matchmakingTimeout = null;
  }
}

// Cancel matchmaking
function cancelMatchmaking() {
  // Notify server to remove from queue
  socket.emit('cancelMatchmaking');
  
  // Try to cancel blockchain game if created
  if (currentBlockchainGameId) {
    blockchainManager.cancelGame()
      .then(result => {
        if (result.success) {
          console.log('✅ Blockchain game cancelled and refunded');
        }
      })
      .catch(error => {
        console.error('❌ Failed to cancel blockchain game:', error);
      });
    
    currentBlockchainGameId = null;
  }
  
  hideMatchmakingScreen();
  alert('❌ Matchmaking cancelled');
}

// Casino-style coin rush animation
function startCoinRushAnimation() {
  const player1Card = document.getElementById('player1Card');
  const player2Card = document.getElementById('player2Card');
  const poolCounter = document.querySelector('.pool-counter');
  const poolAmount = document.getElementById('matchPoolAmount');
  const coinContainer = document.getElementById('coinContainer');
  
  // Use actual SOL amounts (total winnings = stake * 2)
  const totalWinnings = selectedStakeAmount * 2;
  
  // Get positions
  const player1Rect = player1Card.getBoundingClientRect();
  const player2Rect = player2Card.getBoundingClientRect();
  const poolRect = poolCounter.getBoundingClientRect();
  
  const player1Center = {
    x: player1Rect.left + player1Rect.width / 2,
    y: player1Rect.top + player1Rect.height / 2
  };
  
  const player2Center = {
    x: player2Rect.left + player2Rect.width / 2,
    y: player2Rect.top + player2Rect.height / 2
  };
  
  const poolCenter = {
    x: poolRect.left + poolRect.width / 2,
    y: poolRect.top + poolRect.height / 2
  };
  
  // Phase 1: Launch coins from both players
  const coinsPerPlayer = 12;
  const totalCoins = coinsPerPlayer * 2;
  let coinsLanded = 0;
  
  // Launch from player 1
  for (let i = 0; i < coinsPerPlayer; i++) {
    setTimeout(() => {
      launchCoin(player1Center, poolCenter, coinContainer, () => {
        coinsLanded++;
        updatePoolCounter(poolAmount, coinsLanded, totalCoins, totalWinnings);
      });
    }, i * 50);
  }
  
  // Launch from player 2
  for (let i = 0; i < coinsPerPlayer; i++) {
    setTimeout(() => {
      launchCoin(player2Center, poolCenter, coinContainer, () => {
        coinsLanded++;
        updatePoolCounter(poolAmount, coinsLanded, totalCoins, totalWinnings);
      });
    }, i * 50);
  }
}

function launchCoin(startPos, endPos, container, onComplete) {
  const coin = document.createElement('div');
  coin.className = 'coin';
  coin.textContent = '💰';
  
  // Random spread for parabolic effect
  const spread = 100;
  const randomX = (Math.random() - 0.5) * spread;
  const randomY = (Math.random() - 0.5) * spread;
  
  const midX = (endPos.x - startPos.x) / 2 + randomX;
  const midY = (endPos.y - startPos.y) / 2 - 150 + randomY; // Arc upward
  const endX = endPos.x - startPos.x;
  const endY = endPos.y - startPos.y;
  
  coin.style.left = startPos.x + 'px';
  coin.style.top = startPos.y + 'px';
  coin.style.setProperty('--mid-x', midX + 'px');
  coin.style.setProperty('--mid-y', midY + 'px');
  coin.style.setProperty('--end-x', endX + 'px');
  coin.style.setProperty('--end-y', endY + 'px');
  coin.style.setProperty('--duration', (0.8 + Math.random() * 0.4) + 's');
  
  container.appendChild(coin);
  
  // Remove coin and trigger callback after animation
  setTimeout(() => {
    coin.remove();
    if (onComplete) onComplete();
  }, 1200);
}

function updatePoolCounter(element, current, total, finalAmount) {
  const progress = current / total;
  const currentValue = (finalAmount * progress).toFixed(2);
  
  // Add rolling effect
  element.classList.add('rolling');
  element.textContent = currentValue;
  
  // Phase 3: Final flash when complete
  if (current === total) {
    setTimeout(() => {
      element.classList.remove('rolling');
      element.textContent = finalAmount.toFixed(2);
      
      const poolCounter = document.querySelector('.pool-counter');
      poolCounter.classList.add('flash');
      
      // Play final burst animation
      createWinBurst();
      
      setTimeout(() => {
        poolCounter.classList.remove('flash');
      }, 500);
    }, 100);
  }
}

function createWinBurst() {
  const poolCounter = document.querySelector('.pool-counter');
  const poolRect = poolCounter.getBoundingClientRect();
  const coinContainer = document.getElementById('coinContainer');
  
  const centerX = poolRect.left + poolRect.width / 2;
  const centerY = poolRect.top + poolRect.height / 2;
  
  // Create burst of coins
  for (let i = 0; i < 20; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin burst';
    coin.textContent = '💰';
    coin.style.left = centerX + 'px';
    coin.style.top = centerY + 'px';
    
    const angle = (Math.PI * 2 * i) / 20;
    const distance = 150 + Math.random() * 100;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;
    
    coin.style.setProperty('--end-x', endX + 'px');
    coin.style.setProperty('--end-y', endY + 'px');
    
    coinContainer.appendChild(coin);
    
    setTimeout(() => coin.remove(), 600);
  }
}

// Find opponent (simulated for now)
function findOpponent() {
  // Random opponent names
  const opponents = [
    { name: 'Guest_' + Math.floor(Math.random() * 100000000), flag: '🇺🇸', icon: '👤' },
    { name: 'Guest_' + Math.floor(Math.random() * 100000000), flag: '🇬🇧', icon: '👤' },
    { name: 'Guest_' + Math.floor(Math.random() * 100000000), flag: '🇨🇦', icon: '👤' },
    { name: 'Guest_' + Math.floor(Math.random() * 100000000), flag: '🇦🇺', icon: '👤' },
    { name: 'Guest_' + Math.floor(Math.random() * 100000000), flag: '🇩🇪', icon: '👤' },
    { name: 'Guest_' + Math.floor(Math.random() * 100000000), flag: '🇫🇷', icon: '👤' },
    { name: 'Guest_' + Math.floor(Math.random() * 100000000), flag: '🇯🇵', icon: '👤' },
    { name: 'Guest_' + Math.floor(Math.random() * 100000000), flag: '🇧🇷', icon: '👤' }
  ];
  
  const opponent = opponents[Math.floor(Math.random() * opponents.length)];
  
  // Stop slot machine animation
  const opponentAvatar = document.getElementById('opponentAvatar');
  opponentAvatar.classList.remove('slot-machine');
  opponentAvatar.classList.add('found');
  
  // Select random opponent avatar and reveal it
  console.log('🎲 Selecting random avatar for opponent...');
  currentOpponentAvatar = getRandomAvatar();
  console.log('Selected avatar:', currentOpponentAvatar);
  revealOpponentAvatar(currentOpponentAvatar);
  
  // Update opponent info
  document.getElementById('player2Name').textContent = opponent.name;
  document.querySelector('.player-2 .avatar-circle').classList.remove('searching');
  document.querySelector('.searching-flag').textContent = opponent.flag;
  document.querySelector('.searching-flag').classList.remove('searching-flag');
  document.querySelector('.searching-text').classList.remove('searching-text');
  document.querySelector('.searching-stake').classList.remove('searching-stake');
  
  // Update search status
  document.getElementById('searchText').textContent = '✅ Opponent found! Starting coin rush...';
  document.querySelector('.search-spinner').style.display = 'none';
  
  // Start coin rush animation after 1 second
  setTimeout(() => {
    startCoinRushAnimation();
  }, 1000);
  
  // Create blockchain game and start after coin animation completes
  setTimeout(async () => {
    await createGameOnBlockchain();
  }, 4000);
}

// Create game on blockchain (Player 1 creates the room)
async function createGameOnBlockchain() {
  try {
    console.log('🔗 Creating game on blockchain...');
    
    const playerName = document.getElementById('playerName').value.trim() || 'Player';
    
    // Call smart contract create_game
    const { gameId, signature } = await blockchainManager.createGame(selectedStakeAmount);
    
    console.log('✅ Game created on blockchain:', gameId);
    console.log('📝 Transaction:', signature);
    
    // Store game ID for later completion
    currentBlockchainGameId = gameId;
    
    // Get wallet address
    const walletAddress = walletManager.getWalletAddress();
    
    // Emit to server with blockchain game ID and wallet address
    socket.emit('createRoom', {
      playerName: playerName,
      gameId: gameId,
      stakeAmount: selectedStakeAmount,
      walletAddress: walletAddress
    });
    
    // Hide matchmaking and show waiting screen
    hideMatchmakingScreen();
    showWaitingScreen();
    
  } catch (error) {
    console.error('❌ Failed to create blockchain game:', error);
    hideMatchmakingScreen();
    
    alert('⚠️ Failed to create game on blockchain!\n\n' +
          'Error: ' + error.message + '\n\n' +
          'Please try again or check your wallet connection.');
  }
}

// Join game on blockchain (Player 2 joins the room)
async function joinGameOnBlockchain(roomGameId) {
  try {
    console.log('🔗 Joining game on blockchain:', roomGameId);
    
    // Call smart contract join_game
    const { signature } = await blockchainManager.joinGame(roomGameId, selectedStakeAmount);
    
    console.log('✅ Joined game on blockchain');
    console.log('📝 Transaction:', signature);
    
    // Store game ID for later completion
    currentBlockchainGameId = roomGameId;
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to join blockchain game:', error);
    
    alert('⚠️ Failed to join game on blockchain!\n\n' +
          'Error: ' + error.message + '\n\n' +
          'Please try again or check your wallet connection.');
    
    return false;
  }
}

// Complete game on blockchain (Called when game ends)
async function completeGameOnBlockchain(winner) {
  try {
    console.log('🔗 Completing game on blockchain...');
    console.log('🏆 Winner:', winner);
    
    if (!currentBlockchainGameId) {
      console.warn('⚠️ No blockchain game ID found');
      return;
    }
    
    // Determine winner address (1 or 2)
    const winnerNumber = winner === 'player1' ? 1 : 2;
    
    // Call smart contract complete_game
    const { signature } = await blockchainManager.completeGame(
      currentBlockchainGameId,
      winnerNumber
    );
    
    console.log('✅ Game completed on blockchain');
    console.log('📝 Transaction:', signature);
    console.log('💰 Winner receives payout!');
    
    // Show success message
    if (winner === 'player1' || winner === 'player2') {
      const isWinner = (winner === 'player1' && !isPlayer2) || 
                       (winner === 'player2' && isPlayer2);
      
      if (isWinner) {
        const winnings = (selectedStakeAmount * 2 * 0.95).toFixed(2); // 95% after 5% fee
        setTimeout(() => {
          alert('🎊 CONGRATULATIONS! 🎊\n\n' +
                '💰 You won ' + winnings + ' SOL!\n' +
                '✅ Payout sent to your wallet!\n\n' +
                'Check your Phantom wallet balance.');
        }, 1000);
      }
    }
    
    // Clear game ID
    currentBlockchainGameId = null;
    
  } catch (error) {
    console.error('❌ Failed to complete blockchain game:', error);
    
    alert('⚠️ Failed to process payout!\n\n' +
          'Error: ' + error.message + '\n\n' +
          'Please contact support with your game ID: ' + currentBlockchainGameId);
  }
}

// Track current blockchain game
var currentBlockchainGameId = null;

// Confirm bet and create/join game
async function confirmBet() {
  // Route to the appropriate handler based on action
  if (pendingGameAction === 'createPrivate') {
    await confirmPrivateRoomBet();
    return;
  }
  
  const requiredBalance = selectedStakeAmount + 0.01; // +0.01 for fees
  
  // Validate stake amount
  if (selectedStakeAmount <= 0) {
    alert('❌ Please select or enter a valid stake amount!');
    return;
  }
  
  // Validate minimum stake
  if (selectedStakeAmount < 0.01) {
    alert('❌ Minimum stake is 0.01 SOL!');
    return;
  }
  
  // Check balance
  if (!walletManager.hasSufficientBalance(requiredBalance)) {
    alert('❌ Insufficient SOL balance!\n\n' +
          'Required: ' + requiredBalance.toFixed(2) + ' SOL\n' +
          'Available: ' + walletManager.getFormattedBalance() + '\n\n' +
          '💡 Click the "💰 Get 1 SOL" button to get test SOL');
    return;
  }
  
  closeBettingModal();
  
  console.log('🎮 Starting matchmaking with stake:', selectedStakeAmount, 'SOL');
  
  // Show matchmaking screen immediately
  showMatchmakingScreen();
  
  // Start blockchain game creation and matchmaking
  setTimeout(async () => {
    await startAutomaticMatchmaking();
  }, 500);
}

// Create game on blockchain
async function createGameOnBlockchain() {
  try {
    showTxModal('Creating game on blockchain...', false);
    
    // Create game on blockchain
    const result = await blockchainManager.createGame(selectedStakeAmount);
    
    if (result.success) {
      showTxModal('✅ Game created successfully!', true, result.signature);
      
      // Create room on server with blockchain game ID
      const playerName = document.getElementById('playerName').value.trim();
      const walletAddress = walletManager.getWalletAddress();
      socket.emit('createRoom', {
        playerName: playerName,
        gameId: result.gameId,
        stakeAmount: selectedStakeAmount,
        walletAddress: walletAddress
      });
      
      setTimeout(() => closeTxModal(), 2000);
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Failed to create game:', error);
    showTxModal('❌ Transaction failed: ' + error.message, true);
  }
}

// Join game on blockchain
async function joinGameOnBlockchain(roomCode) {
  try {
    showTxModal('Joining game on blockchain...', false);
    
    // Get game ID from server
    socket.emit('getGameId', roomCode, async (response) => {
      if (!response.success) {
        showTxModal('❌ Failed to get game info', true);
        return;
      }
      
      // Join game on blockchain
      const result = await blockchainManager.joinGame(response.gameId);
      
      if (result.success) {
        showTxModal('✅ Successfully joined game!', true, result.signature);
        
        // Get wallet address
        const walletAddress = walletManager.getWalletAddress();
        
        // Join room on server
        const playerName = document.getElementById('playerName').value.trim();
        socket.emit('joinRoom', { 
          roomId: roomCode, 
          playerName: playerName,
          gameId: response.gameId,
          walletAddress: walletAddress
        });
        
        setTimeout(() => closeTxModal(), 2000);
      } else {
        throw new Error(result.error);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to join game:', error);
    showTxModal('❌ Transaction failed: ' + error.message, true);
  }
}

// Show transaction modal
function showTxModal(message, showClose, signature = null) {
  const modal = document.getElementById('txModal');
  const txMessage = document.getElementById('txMessage');
  const txSignature = document.getElementById('txSignature');
  const txLink = document.getElementById('txLink');
  const txCloseButton = document.getElementById('txCloseButton');
  
  modal.classList.add('active');
  txMessage.textContent = message;
  
  if (signature) {
    txSignature.style.display = 'block';
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    txLink.href = explorerUrl;
    txLink.textContent = signature.substring(0, 20) + '...' + signature.substring(signature.length - 20);
  } else {
    txSignature.style.display = 'none';
  }
  
  if (showClose) {
    txCloseButton.style.display = 'block';
  } else {
    txCloseButton.style.display = 'none';
  }
}

// Close transaction modal
function closeTxModal() {
  const modal = document.getElementById('txModal');
  modal.classList.remove('active');
}

// Override original startQuickMatch function to add blockchain
const originalStartQuickMatch = startQuickMatch;
startQuickMatch = function() {
  var playerName = document.getElementById('playerName').value.trim();
  if (!playerName) {
    alert('Please enter a player name first!');
    return;
  }
  
  if (!walletManager.connected) {
    alert('Please connect your Phantom wallet first to play Quick Match!');
    return;
  }
  
  if (!isConnected) {
    alert('Not connected to server. Please try again.');
    return;
  }
  
  // Show betting modal for Quick Match
  showBettingModal('create');
};

// Airdrop cooldown tracking
var lastAirdropTime = 0;
var airdropCooldown = 60000; // 60 seconds

// Request airdrop (devnet only)
async function requestAirdrop() {
  if (!walletManager.connected) {
    alert('Please connect your wallet first!');
    return;
  }
  
  if (walletManager.network !== 'devnet') {
    alert('Airdrops are only available on devnet!');
    return;
  }
  
  // Check cooldown
  const now = Date.now();
  const timeSinceLastAirdrop = now - lastAirdropTime;
  
  if (timeSinceLastAirdrop < airdropCooldown && lastAirdropTime > 0) {
    const remainingSeconds = Math.ceil((airdropCooldown - timeSinceLastAirdrop) / 1000);
    alert(`⏰ Please wait ${remainingSeconds} seconds before requesting another airdrop.\n\nAlternatively, use:\nhttps://faucet.solana.com/`);
    return;
  }
  
  const airdropButton = document.getElementById('airdropButton');
  const originalText = airdropButton.innerHTML;
  
  try {
    // Disable button
    airdropButton.disabled = true;
    airdropButton.innerHTML = '<span>⏳</span> Requesting...';
    
    console.log('Requesting airdrop...');
    
    // Request 1 SOL airdrop
    const result = await walletManager.requestAirdrop(1);
    
    // Update balance
    await walletManager.updateBalance();
    updateWalletUI();
    
    // Update last airdrop time
    lastAirdropTime = Date.now();
    
    // Success feedback
    airdropButton.innerHTML = '<span>✅</span> Received 1 SOL!';
    
    setTimeout(() => {
      airdropButton.innerHTML = originalText;
      airdropButton.disabled = false;
    }, 3000);
    
    alert('✅ Successfully received 1 SOL!\n\nYour new balance: ' + walletManager.getFormattedBalance() + '\n\n⏰ Wait 60 seconds before next airdrop.');
    
  } catch (error) {
    console.error('Airdrop failed:', error);
    
    airdropButton.innerHTML = '<span>❌</span> Failed';
    
    let errorMessage = '';
    let disableFor = 3000;
    
    if (error.message === 'RATE_LIMIT') {
      errorMessage = '⚠️ Rate Limit Reached!\n\n' +
                    'You can request airdrops once per minute.\n\n' +
                    '💡 Alternative options:\n' +
                    '1. Wait 60 seconds and try again\n' +
                    '2. Use: https://faucet.solana.com/\n' +
                    '3. Try: https://faucet.quicknode.com/solana/devnet';
      disableFor = 60000; // Disable for 60 seconds
      lastAirdropTime = Date.now(); // Track failed attempt
    } else if (error.message === 'FAUCET_EMPTY') {
      errorMessage = '😥 Faucet Temporarily Empty\n\n' +
                    'The devnet faucet has run out of SOL.\n\n' +
                    '💡 Try these alternatives:\n' +
                    '• https://faucet.solana.com/\n' +
                    '• https://faucet.quicknode.com/solana/devnet\n' +
                    '• Wait a few minutes and try again';
      disableFor = 120000; // Disable for 2 minutes
    } else {
      errorMessage = '❌ Airdrop Failed\n\n' + error.message + '\n\n' +
                    '💡 Try:\n' +
                    '• Check your internet connection\n' +
                    '• Use: https://faucet.solana.com/';
    }
    
    alert(errorMessage);
    
    setTimeout(() => {
      airdropButton.innerHTML = originalText;
      airdropButton.disabled = false;
    }, disableFor);
  }
}

// ==================== PRIVATE ROOM FUNCTIONS ====================

// Show private room info modal after blockchain transaction
function showPrivateRoomModal(roomCode, stakeAmount, gameId) {
  pendingPrivateRoomCode = roomCode;
  privateRoomGameId = gameId;
  
  const modal = document.getElementById('privateRoomModal');
  const playerName = document.getElementById('playerName').value.trim();
  
  // Update modal content
  document.getElementById('privateRoomCode').textContent = roomCode;
  document.getElementById('roomPlayerName').textContent = playerName;
  document.getElementById('roomBetValue').textContent = stakeAmount.toFixed(2);
  
  const totalPool = stakeAmount * 2;
  const winnerAmount = totalPool * 0.95;
  
  document.getElementById('roomTotalPool').textContent = totalPool.toFixed(2) + ' SOL';
  document.getElementById('roomWinnerAmount').textContent = winnerAmount.toFixed(2) + ' SOL';
  document.getElementById('roomTxStatus').innerHTML = '✅ Confirmed';
  
  modal.classList.add('active');
}

// Copy room code to clipboard
function copyRoomCode() {
  const roomCode = document.getElementById('privateRoomCode').textContent;
  
  // Copy to clipboard
  navigator.clipboard.writeText(roomCode).then(() => {
    const btn = document.querySelector('.copy-code-btn');
    const originalText = btn.textContent;
    btn.textContent = '✅ Copied!';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = 'linear-gradient(135deg, #8b5cf6, #a855f7)';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy code. Please copy manually: ' + roomCode);
  });
}

// Cancel private room
function cancelPrivateRoom() {
  const modal = document.getElementById('privateRoomModal');
  modal.classList.remove('active');
  
  // Notify server to cancel room
  if (pendingPrivateRoomCode) {
    socket.emit('cancelRoom', { roomId: pendingPrivateRoomCode });
    pendingPrivateRoomCode = null;
    privateRoomGameId = null;
  }
  
  // Return to start screen
  const startScreen = document.getElementById('startScreen');
  startScreen.style.display = 'flex';
}

// Show join private room modal with room details
function showJoinPrivateRoomModal(roomInfo) {
  console.log('📱 Opening join modal with room info:', roomInfo);
  
  const modal = document.getElementById('joinPrivateRoomModal');
  
  if (!modal) {
    console.error('❌ joinPrivateRoomModal element not found!');
    alert('Error: Join modal not found. Please refresh the page.');
    return;
  }
  
  // Update modal content
  const elements = {
    joinRoomCode: document.getElementById('joinRoomCode'),
    joinHostName: document.getElementById('joinHostName'),
    joinBetValue: document.getElementById('joinBetValue'),
    joinTotalPool: document.getElementById('joinTotalPool'),
    joinWinnerAmount: document.getElementById('joinWinnerAmount')
  };
  
  // Check if all elements exist
  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`❌ Element ${key} not found!`);
    }
  }
  
  if (elements.joinRoomCode) elements.joinRoomCode.textContent = roomInfo.roomId;
  if (elements.joinHostName) elements.joinHostName.textContent = roomInfo.hostName;
  if (elements.joinBetValue) elements.joinBetValue.textContent = roomInfo.stakeAmount.toFixed(2);
  
  const totalPool = roomInfo.stakeAmount * 2;
  const winnerAmount = totalPool * 0.95;
  
  if (elements.joinTotalPool) elements.joinTotalPool.textContent = totalPool.toFixed(2) + ' SOL';
  if (elements.joinWinnerAmount) elements.joinWinnerAmount.textContent = winnerAmount.toFixed(2) + ' SOL';
  
  // Store room info for joining
  pendingRoomCode = roomInfo.roomId;
  selectedStakeAmount = roomInfo.stakeAmount;
  privateRoomGameId = roomInfo.gameId;
  
  console.log('✅ Showing join modal');
  modal.classList.add('active');
}

// Close join private room modal
function closeJoinPrivateRoomModal() {
  const modal = document.getElementById('joinPrivateRoomModal');
  modal.classList.remove('active');
  pendingRoomCode = null;
  privateRoomGameId = null;
}

// Confirm join private room and complete Solana transaction
async function confirmJoinPrivateRoom() {
  const requiredBalance = selectedStakeAmount + 0.01; // +0.01 for fees
  
  // Check balance
  if (!walletManager.hasSufficientBalance(requiredBalance)) {
    alert('❌ Insufficient SOL balance!\n\n' +
          'Required: ' + requiredBalance.toFixed(2) + ' SOL\n' +
          'Available: ' + walletManager.getFormattedBalance() + '\n\n' +
          '💡 Click the "💰 Get 1 SOL" button to get test SOL');
    return;
  }
  
  // Store values BEFORE closing modal (which clears them)
  const roomCodeToJoin = pendingRoomCode;
  const gameIdToJoin = privateRoomGameId;
  const stakeAmount = selectedStakeAmount;
  
  // Validate we have the required data
  if (!roomCodeToJoin || !gameIdToJoin) {
    alert('❌ Missing room information. Please try again.');
    console.error('Missing data:', { roomCodeToJoin, gameIdToJoin, stakeAmount });
    return;
  }
  
  closeJoinPrivateRoomModal();
  
  console.log('🎮 Joining private room:', roomCodeToJoin, 'Game ID:', gameIdToJoin, 'Stake:', stakeAmount, 'SOL');
  
  try {
    // Show transaction modal
    showTxModal('Processing transaction...', false);
    
    // Join game on blockchain
    console.log('🔗 Calling blockchainManager.joinGame with gameId:', gameIdToJoin);
    const result = await blockchainManager.joinGame(gameIdToJoin, stakeAmount);
    
    if (result.success) {
      showTxModal('✅ Transaction successful!', true, result.signature);
      
      // Join room on server
      const playerName = document.getElementById('playerName').value.trim();
      const walletAddress = walletManager.getWalletAddress();
      
      socket.emit('joinRoom', { 
        roomId: roomCodeToJoin, 
        playerName: playerName,
        gameId: gameIdToJoin,
        stakeAmount: stakeAmount,
        walletAddress: walletAddress
      });
      
      // IMPORTANT: Store blockchain game ID for player 2
      currentBlockchainGameId = gameIdToJoin;
      console.log('💼 Stored blockchain game ID for player 2:', currentBlockchainGameId);
      
      setTimeout(() => closeTxModal(), 2000);
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Failed to join game:', error);
    showTxModal('❌ Transaction failed: ' + error.message, true);
    
    // Re-enable UI
    setTimeout(() => {
      closeTxModal();
    }, 3000);
  }
}

// Handle private room bet confirmation
async function confirmPrivateRoomBet() {
  const requiredBalance = selectedStakeAmount + 0.01; // +0.01 for fees
  
  // Validate stake amount
  if (selectedStakeAmount <= 0) {
    alert('❌ Please select or enter a valid stake amount!');
    return;
  }
  
  // Validate minimum stake
  if (selectedStakeAmount < 0.01) {
    alert('❌ Minimum stake is 0.01 SOL!');
    return;
  }
  
  // Check balance
  if (!walletManager.hasSufficientBalance(requiredBalance)) {
    alert('❌ Insufficient SOL balance!\n\n' +
          'Required: ' + requiredBalance.toFixed(2) + ' SOL\n' +
          'Available: ' + walletManager.getFormattedBalance() + '\n\n' +
          '💡 Click the "💰 Get 1 SOL" button to get test SOL');
    return;
  }
  
  closeBettingModal();
  
  console.log('🎮 Creating private room with stake:', selectedStakeAmount, 'SOL');
  
  try {
    // Show transaction modal
    showTxModal('Creating game on blockchain...', false);
    
    // Create game on blockchain
    const result = await blockchainManager.createGame(selectedStakeAmount);
    
    if (result.success) {
      showTxModal('✅ Game created successfully!', true, result.signature);
      
      // Generate room code
      const roomCode = generateRoomCode();
      
      // Create room on server with blockchain game ID
      const playerName = document.getElementById('playerName').value.trim();
      const walletAddress = walletManager.getWalletAddress();
      
      socket.emit('createPrivateRoom', {
        playerName: playerName,
        roomCode: roomCode,
        gameId: result.gameId,
        stakeAmount: selectedStakeAmount,
        walletAddress: walletAddress
      });
      
      setTimeout(() => {
        closeTxModal();
        // Hide start screen
        document.getElementById('startScreen').style.display = 'none';
        // Show private room modal
        showPrivateRoomModal(roomCode, selectedStakeAmount, result.gameId);
      }, 2000);
    } else {
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Failed to create game:', error);
    showTxModal('❌ Transaction failed: ' + error.message, true);
    
    // Re-enable UI
    setTimeout(() => {
      closeTxModal();
    }, 3000);
  }
}

// ==================== END PRIVATE ROOM FUNCTIONS ====================

// Initialize on page load
window.addEventListener('load', () => {
  // Disable game buttons initially
  disableGameButtons();
  
  // Check if Phantom is installed
  if (!walletManager.isPhantomInstalled()) {
    alert('Phantom wallet not detected! Please install Phantom from https://phantom.app/');
  }
  
  // Listen for wallet disconnection
  window.addEventListener('walletDisconnected', handleWalletDisconnect);
});