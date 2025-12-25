# Air Hockey Game - Complete Documentation

## Table of Contents
1. [Game Overview](#game-overview)
2. [Features](#features)
3. [Technical Architecture](#technical-architecture)
4. [File Structure](#file-structure)
5. [Code Documentation](#code-documentation)
6. [Multiplayer System](#multiplayer-system)
7. [Game Physics](#game-physics)
8. [Visual Effects](#visual-effects)
9. [Audio System](#audio-system)
10. [Customization Options](#customization-options)
11. [Installation & Setup](#installation--setup)
12. [How to Play](#how-to-play)

---

## Game Overview

**Air Hockey Championship** is a real-time multiplayer air hockey game built with modern web technologies. The game features smooth physics simulation, real-time synchronization between players, customizable themes, particle effects, and professional sound design.

### Key Highlights
- **Real-time Multiplayer**: Play with friends using Socket.IO for instant synchronization
- **Room-Based System**: Create private rooms with shareable 6-character codes
- **Responsive Controls**: Smooth paddle movement with mouse/touch controls
- **Visual Polish**: Particle effects, screen shake, goal celebrations
- **Professional Audio**: Tennis ball hits, crowd cheering, and wall bounce sounds
- **Customization**: Multiple table themes and ball colors

---

## Features

### Gameplay Features
- ✅ Real-time multiplayer with WebSocket synchronization
- ✅ Private room system with unique room codes
- ✅ Host/Guest architecture (Host controls physics, Guest receives updates)
- ✅ Smooth paddle interpolation for lag compensation
- ✅ Ball physics with realistic collision detection
- ✅ Score tracking and win conditions
- ✅ Goal celebration animations
- ✅ Screen shake effects on goals

### Visual Features
- ✅ Particle system for hit effects
- ✅ Glassmorphism UI design
- ✅ 6 customizable table color themes (Green, Blue, Purple, Red, Orange, Teal)
- ✅ 8 ball color options (White, Yellow, Orange, Red, Pink, Purple, Blue, Green)
- ✅ Animated goal celebrations
- ✅ Connection status indicators
- ✅ Professional start screen and settings menu

### Audio Features
- ✅ Tennis ball hit sound on paddle collisions
- ✅ Crowd cheering on goals
- ✅ Wall bounce sounds
- ✅ Winning celebration audio
- ✅ Volume-controlled sound effects

### Technical Features
- ✅ Network optimization with update throttling
- ✅ Paddle movement interpolation for smooth multiplayer
- ✅ Ball stuck detection and auto-reset
- ✅ Client-side prediction
- ✅ Server-authoritative physics (host controls)

---

## Technical Architecture

### Technology Stack

**Frontend:**
- **HTML5 Canvas**: Game rendering and graphics
- **JavaScript (Vanilla)**: Game logic and client-side code
- **CSS3**: Modern UI styling with glassmorphism effects
- **Socket.IO Client**: Real-time communication

**Backend:**
- **Node.js**: Runtime environment
- **Express.js**: Web server framework
- **Socket.IO**: WebSocket server for real-time multiplayer

### Architecture Pattern
```
┌─────────────────┐         ┌─────────────────┐
│   Player 1      │         │   Player 2      │
│   (Host)        │◄───────►│   (Guest)       │
│                 │         │                 │
│ • Controls      │         │ • Receives      │
│   Physics       │         │   Updates       │
│ • Sends Ball    │         │ • Sends Paddle  │
│   Updates       │         │   Position      │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    WebSocket Connection   │
         └──────────┬────────────────┘
                    │
           ┌────────▼────────┐
           │  Node.js Server │
           │  (Socket.IO)    │
           │                 │
           │ • Room Mgmt     │
           │ • Broadcasting  │
           │ • Player Sync   │
           └─────────────────┘
```

---

## File Structure

```
Air-hockey-game-htmlonly/
│
├── index.html              # Main HTML file with game UI
├── script.js              # Game logic and client-side JavaScript (1462 lines)
├── styles.css             # CSS styling and animations (917 lines)
├── server.js              # Node.js server with Socket.IO (297 lines)
├── package.json           # Dependencies and project metadata
├── README.md              # Basic project documentation
│
├── audio/                 # Sound effects directory
│   ├── hit.mp3           # Paddle hit sound
│   ├── crowd-cheer.mp3   # Goal celebration
│   ├── wall.mp3          # Wall bounce sound
│   └── winning.mp3       # Victory celebration
│
└── Images/                # Background images
    ├── Gemini_Generated_Image_cft8yscft8yscft8.png  # Start screen bg
    └── Gemini_Generated_Image_sdp0fcsdp0fcsdp0.png  # Game screen bg
```

---

## Code Documentation

### Main JavaScript File (script.js)

#### Core Game Variables
```javascript
// Game state
var canvas, ctx;              // Canvas and rendering context
var gameMode = null;          // 'computer' or 'multiplayer'
var gameRunning = false;      // Game loop status
var ball_speed = 12;          // Base ball speed
var xspeed = 0, yspeed = 0;   // Ball velocity
var player1_score = 0;        // Player 1 score
var player2_score = 0;        // Player 2 score

// Game boundaries
var x_min = 50, x_max = 900;  // Horizontal limits
var y_min = 50, y_max = 500;  // Vertical limits
```

#### Multiplayer Variables
```javascript
var socket = null;                    // Socket.IO connection
var isMultiplayer = false;            // Multiplayer mode flag
var playerRole = null;                // 'host' or 'guest'
var playerNumber = null;              // 1 or 2
var currentRoomId = null;             // Current game room ID
var isConnected = false;              // Connection status

// Network optimization
var lastPaddleUpdate = 0;             // Last paddle update timestamp
var paddleUpdateInterval = 50;        // Update every 50ms (20fps)
var paddleMovementThreshold = 2;      // Min movement to trigger update

// Interpolation
var opponentPaddleTarget = {x: 0, y: 0};  // Target position
var paddleInterpolationSpeed = 0.15;      // Smooth factor
```

#### Game Objects

**Paddle Object:**
```javascript
function Paddle(x, y, width, height, color) {
  this.x = x;           // X position
  this.y = y;           // Y position
  this.width = width;   // Paddle width
  this.height = height; // Paddle height
  this.color = color;   // Paddle color
  this.dx = 0;          // X velocity
  this.dy = 0;          // Y velocity
}
```

**Ball Object:**
```javascript
function Ball(x, y, radius, color) {
  this.x = x;           // X position
  this.y = y;           // Y position
  this.radius = radius; // Ball radius
  this.color = color;   // Ball color
  this.dx = 0;          // X velocity
  this.dy = 0;          // Y velocity
}
```

**Particle Object:**
```javascript
function Particle(x, y, color) {
  this.x = x;                           // X position
  this.y = y;                           // Y position
  this.vx = (Math.random() - 0.5) * 6;  // Random X velocity
  this.vy = Math.random() * -4 - 2;     // Upward Y velocity
  this.size = Math.random() * 3 + 2;    // Random size 2-5px
  this.color = color;                   // Particle color
  this.life = 30;                       // Lifespan in frames
  this.maxLife = 30;                    // Max life for opacity
}
```

#### Key Functions

**Game Initialization:**
```javascript
function init() {
  // Set up canvas
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  // Initialize audio
  initializeAudioFiles();
  
  // Create game objects
  player1Mallet = new Paddle(150, 300, 30, 30, '#3b82f6');
  player2Mallet = new Paddle(850, 300, 30, 30, '#ef4444');
  ball = new Ball(500, 300, 15, ballColors[currentBallColor]);
  
  // Set up event listeners
  setupMouseControls();
}
```

**Game Loop:**
```javascript
function gameLoop() {
  if (!gameRunning) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw table
  drawTable();
  
  // Update game state (host only in multiplayer)
  if (!isMultiplayer || playerRole === 'host') {
    updateBallPosition();
    checkCollisions();
    checkGoal();
  }
  
  // Update paddle interpolation
  updatePaddleInterpolation();
  
  // Update and draw particles
  updateParticles();
  drawParticles();
  
  // Draw game objects
  drawPaddles();
  drawBall();
  drawScores();
  
  // Send updates to opponent
  if (isMultiplayer && isConnected) {
    sendGameUpdates();
  }
  
  // Continue loop
  requestAnimationFrame(gameLoop);
}
```

**Collision Detection:**
```javascript
function checkCollisions() {
  // Ball-wall collisions
  if (ball.x - ball.radius <= x_min || ball.x + ball.radius >= x_max) {
    xspeed = -xspeed * 0.95;  // Damping
    playWallSound();
  }
  if (ball.y - ball.radius <= y_min || ball.y + ball.radius >= y_max) {
    yspeed = -yspeed * 0.95;
    playWallSound();
  }
  
  // Ball-paddle collisions
  if (checkPaddleCollision(player1Mallet)) {
    handlePaddleHit(player1Mallet);
  }
  if (checkPaddleCollision(player2Mallet)) {
    handlePaddleHit(player2Mallet);
  }
}

function checkPaddleCollision(paddle) {
  var dx = ball.x - Math.max(paddle.x - paddle.width/2, 
                              Math.min(ball.x, paddle.x + paddle.width/2));
  var dy = ball.y - Math.max(paddle.y - paddle.height/2, 
                              Math.min(ball.y, paddle.y + paddle.height/2));
  return (dx * dx + dy * dy) < (ball.radius * ball.radius);
}
```

**Network Synchronization:**
```javascript
function sendGameUpdates() {
  var currentTime = Date.now();
  
  // Send paddle position (throttled)
  if (currentTime - lastPaddleUpdate > paddleUpdateInterval) {
    var myPaddle = playerNumber === 1 ? player1Mallet : player2Mallet;
    
    // Check if moved enough
    if (Math.abs(myPaddle.x - lastSentPaddleX) > paddleMovementThreshold ||
        Math.abs(myPaddle.y - lastSentPaddleY) > paddleMovementThreshold) {
      
      socket.emit('paddleMove', {
        x: myPaddle.x,
        y: myPaddle.y,
        roomId: currentRoomId
      });
      
      lastPaddleUpdate = currentTime;
      lastSentPaddleX = myPaddle.x;
      lastSentPaddleY = myPaddle.y;
    }
  }
  
  // Send ball updates (host only)
  if (playerRole === 'host' && currentTime - lastBallUpdate > ballUpdateInterval) {
    socket.emit('ballUpdate', {
      x: ball.x,
      y: ball.y,
      vx: xspeed,
      vy: yspeed,
      roomId: currentRoomId
    });
    lastBallUpdate = currentTime;
  }
}
```

### Server Code (server.js)

#### Room Management
```javascript
class GameRoom {
  constructor(roomId) {
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
  }
  
  addPlayer(socket) {
    if (this.players.length >= 2) return false;
    
    const playerNumber = this.players.length + 1;
    const player = {
      id: socket.id,
      socket: socket,
      playerNumber: playerNumber,
      role: playerNumber === 1 ? 'host' : 'guest'
    };
    
    this.players.push(player);
    socket.join(this.roomId);
    
    socket.emit('playerAssigned', {
      playerNumber: playerNumber,
      role: player.role,
      roomId: this.roomId
    });
    
    if (this.players.length === 2) {
      this.startGame();
    }
    
    return true;
  }
}
```

#### Socket Event Handlers
```javascript
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  // Create private room
  socket.on('createRoom', (data) => {
    const roomId = generateRoomId();
    const room = new GameRoom(roomId);
    rooms.set(roomId, room);
    room.addPlayer(socket);
    
    socket.emit('roomCreated', {
      roomId: roomId,
      playerNumber: 1
    });
  });
  
  // Join existing room
  socket.on('joinRoom', (data) => {
    const room = rooms.get(data.roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (!room.addPlayer(socket)) {
      socket.emit('error', { message: 'Room is full' });
    }
  });
  
  // Paddle movement
  socket.on('paddleMove', (data) => {
    socket.to(data.roomId).emit('opponentPaddleMove', {
      x: data.x,
      y: data.y
    });
  });
  
  // Ball updates (host only)
  socket.on('ballUpdate', (data) => {
    socket.to(data.roomId).emit('ballSync', {
      x: data.x,
      y: data.y,
      vx: data.vx,
      vy: data.vy
    });
  });
  
  // Score updates
  socket.on('scoreUpdate', (data) => {
    socket.to(data.roomId).emit('scoreSync', {
      player1: data.player1,
      player2: data.player2
    });
  });
});
```

---

## Multiplayer System

### Room-Based Architecture

**Room Creation Flow:**
1. Player 1 clicks "Private Room"
2. Server generates unique 6-character room code (e.g., "A7K9M2")
3. Room object created and stored in server memory
4. Player 1 assigned as "Host" (Player 1)
5. Room code displayed to Player 1

**Room Joining Flow:**
1. Player 2 enters room code
2. Client sends join request to server
3. Server validates room exists and has space
4. Player 2 assigned as "Guest" (Player 2)
5. Both players notified, game starts automatically

### Network Optimization

**Paddle Update Throttling:**
- Updates sent every 50ms (20fps) instead of 60fps
- Only sent if paddle moved > 2 pixels
- Reduces network traffic by ~66%

**Paddle Interpolation:**
```javascript
function updatePaddleInterpolation() {
  // Smooth movement to target position
  opponentPaddle.x += (target.x - opponentPaddle.x) * 0.15;
  opponentPaddle.y += (target.y - opponentPaddle.y) * 0.15;
}
```
- Creates smooth 60fps visual movement
- Even with 20fps network updates
- Eliminates jerky paddle movement

**Ball Synchronization:**
- Host controls ball physics (authoritative)
- Sends ball updates at 30fps
- Guest receives and renders ball state
- Prevents desynchronization issues

### Host/Guest Roles

**Host Responsibilities:**
- Runs complete physics simulation
- Sends ball position/velocity updates
- Sends score updates
- Controls goal detection

**Guest Responsibilities:**
- Sends own paddle position
- Receives ball updates from host
- Receives score updates
- Renders synchronized game state

---

## Game Physics

### Ball Physics

**Movement:**
```javascript
function updateBallPosition() {
  ball.x += xspeed;
  ball.y += yspeed;
  
  // Apply slight friction (98% velocity retention)
  xspeed *= 0.98;
  yspeed *= 0.98;
}
```

**Collision Response:**
```javascript
function handlePaddleHit(paddle) {
  // Calculate hit angle based on paddle position
  var hitAngle = Math.atan2(ball.y - paddle.y, ball.x - paddle.x);
  
  // Add paddle velocity to ball
  var paddleSpeed = Math.sqrt(paddle.dx*paddle.dx + paddle.dy*paddle.dy);
  var speedBoost = Math.min(paddleSpeed * 0.3, 5);
  
  // Set new ball velocity
  var totalSpeed = ball_speed + speedBoost;
  xspeed = Math.cos(hitAngle) * totalSpeed;
  yspeed = Math.sin(hitAngle) * totalSpeed;
  
  // Create particle effect
  createHitEffect(ball.x, ball.y, currentBallColor);
  
  // Play sound
  playHitSound();
}
```

**Wall Bounce:**
```javascript
// Horizontal walls
if (ball.x - ball.radius <= x_min || ball.x + ball.radius >= x_max) {
  xspeed = -xspeed * 0.95;  // 5% energy loss
  playWallSound();
}

// Vertical walls
if (ball.y - ball.radius <= y_min || ball.y + ball.radius >= y_max) {
  yspeed = -yspeed * 0.95;
  playWallSound();
}
```

### Paddle Physics

**Movement:**
```javascript
function updatePaddlePosition(paddle, mouseX, mouseY) {
  // Smooth movement with interpolation
  paddle.dx = (mouseX - paddle.x) * 0.2;
  paddle.dy = (mouseY - paddle.y) * 0.2;
  
  paddle.x += paddle.dx;
  paddle.y += paddle.dy;
  
  // Constrain to player's half
  if (paddle === player1Mallet) {
    paddle.x = Math.max(x_min, Math.min(paddle.x, canvas.width/2 - 20));
  } else {
    paddle.x = Math.max(canvas.width/2 + 20, Math.min(paddle.x, x_max));
  }
  
  paddle.y = Math.max(y_min, Math.min(paddle.y, y_max));
}
```

### Goal Detection

```javascript
function checkGoal() {
  // Player 2 scores (ball in left goal)
  if (ball.x - ball.radius < x_min) {
    player2_score++;
    showGoalCelebration(2);
    playGoalSound();
    resetBall();
    sendScoreUpdate();
  }
  
  // Player 1 scores (ball in right goal)
  if (ball.x + ball.radius > x_max) {
    player1_score++;
    showGoalCelebration(1);
    playGoalSound();
    resetBall();
    sendScoreUpdate();
  }
  
  // Check for winner (first to 7)
  if (player1_score >= 7 || player2_score >= 7) {
    endGame();
  }
}
```

---

## Visual Effects

### Particle System

**Particle Creation:**
```javascript
function createHitEffect(x, y, ballColor) {
  var particleCount = Math.floor(Math.random() * 2) + 3; // 3-4 particles
  
  for (var i = 0; i < particleCount; i++) {
    particles.push(new Particle(x, y, ballColors[ballColor]));
  }
}
```

**Particle Physics:**
```javascript
function updateParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    
    // Update position
    p.x += p.vx;
    p.y += p.vy;
    
    // Apply gravity and friction
    p.vy += 0.15;  // Gravity
    p.vx *= 0.98;  // Air friction
    p.vy *= 0.98;
    
    // Decrease life
    p.life--;
    
    // Remove dead particles
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}
```

**Particle Rendering:**
```javascript
function drawParticles() {
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    var opacity = p.life / p.maxLife;  // Fade out
    
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
```

### Goal Celebration

```javascript
function showGoalCelebration(playerNumber) {
  // Screen shake
  document.body.style.animation = 'screenShake 0.5s ease-in-out';
  setTimeout(() => {
    document.body.style.animation = '';
  }, 500);
  
  // Create overlay
  const celebration = document.createElement('div');
  celebration.className = 'goal-celebration';
  celebration.innerHTML = `
    <div class="celebration-content">
      <div class="goal-text">GOAL!</div>
      <div class="scorer-text">Player ${playerNumber} Scores!</div>
    </div>
  `;
  
  document.body.appendChild(celebration);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    celebration.remove();
  }, 3000);
}
```

### Table Rendering

```javascript
function drawTable() {
  var theme = colorThemes[currentTheme];
  
  // Outer border
  ctx.fillStyle = theme.bg1;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Playing surface
  ctx.fillStyle = theme.bg2;
  ctx.fillRect(x_min, y_min, x_max - x_min, y_max - y_min);
  
  // Center line
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width/2, y_min);
  ctx.lineTo(canvas.width/2, y_max);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Center circle
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, 60, 0, Math.PI * 2);
  ctx.stroke();
  
  // Goals
  drawGoal(x_min, canvas.height/2 - 80, theme);
  drawGoal(x_max, canvas.height/2 - 80, theme);
}
```

---

## Audio System

### Sound Effects

**Available Sounds:**
1. **Hit Sound** (`audio/hit.mp3`): Tennis ball paddle hit
2. **Crowd Cheer** (`audio/crowd-cheer.mp3`): Goal celebration
3. **Wall Sound** (`audio/wall.mp3`): Ball hitting table edge
4. **Winning Sound** (`audio/winning.mp3`): Game victory

**Audio Initialization:**
```javascript
function initializeAudioFiles() {
  // Crowd cheer
  const crowdCheerAudio = document.getElementById('crowdCheerSound');
  if (crowdCheerAudio) {
    crowdCheerAudio.volume = 0.8;
    crowdCheerAudio.load();
  }
  
  // Hit sound
  const hitAudio = document.getElementById('hitSound');
  if (hitAudio) {
    hitAudio.volume = 0.6;
    hitAudio.load();
  }
  
  // Wall sound
  const wallAudio = document.getElementById('wallSound');
  if (wallAudio) {
    wallAudio.volume = 0.5;
    wallAudio.load();
  }
  
  // Winning sound
  const winningAudio = document.getElementById('winningSound');
  if (winningAudio) {
    winningAudio.volume = 0.8;
    winningAudio.load();
  }
}
```

**Sound Playback:**
```javascript
function playHitSound() {
  const hitAudio = document.getElementById('hitSound');
  if (hitAudio) {
    hitAudio.currentTime = 0;  // Reset for rapid hits
    hitAudio.volume = 0.6;
    hitAudio.play().catch(error => {
      console.log('Could not play hit audio:', error);
    });
  }
}

function playGoalSound() {
  const crowdCheerAudio = document.getElementById('crowdCheerSound');
  if (crowdCheerAudio) {
    crowdCheerAudio.currentTime = 0;
    crowdCheerAudio.volume = 0.8;
    crowdCheerAudio.play().catch(error => {
      console.log('Could not play crowd cheer audio:', error);
    });
  }
}
```

---

## Customization Options

### Table Color Themes

**Available Themes:**
```javascript
var colorThemes = {
  green: {
    bg1: '#2e7d32',     // Dark green border
    bg2: '#4caf50',     // Main green surface
    bg3: '#2e7d32',     // Dark green accent
    line: '#ffffff',    // White lines
    accent: '#81c784'   // Light green accent
  },
  blue: {
    bg1: '#1565c0',
    bg2: '#2196f3',
    bg3: '#1565c0',
    line: '#ffffff',
    accent: '#64b5f6'
  },
  purple: {
    bg1: '#7b1fa2',
    bg2: '#9c27b0',
    bg3: '#7b1fa2',
    line: '#ffffff',
    accent: '#ba68c8'
  },
  red: {
    bg1: '#c62828',
    bg2: '#f44336',
    bg3: '#c62828',
    line: '#ffffff',
    accent: '#ef5350'
  },
  orange: {
    bg1: '#ef6c00',
    bg2: '#ff9800',
    bg3: '#ef6c00',
    line: '#ffffff',
    accent: '#ffb74d'
  },
  teal: {
    bg1: '#00695c',
    bg2: '#009688',
    bg3: '#00695c',
    line: '#ffffff',
    accent: '#4db6ac'
  }
};
```

**Theme Selection:**
```javascript
function selectTableColor(color) {
  currentTheme = color;
  
  // Update UI selection
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  document.querySelector(`.color-option.${color}`).classList.add('selected');
}
```

### Ball Colors

**Available Colors:**
```javascript
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
```

**Ball Color Selection:**
```javascript
function selectBallColor(color) {
  currentBallColor = color;
  
  // Update ball color immediately if game running
  if (ball) {
    ball.color = ballColors[color];
  }
  
  // Update UI selection
  document.querySelectorAll('.ball-color-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  document.querySelector(`.ball-color-option.ball-${color}`).classList.add('selected');
}
```

---

## Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Local Installation

1. **Navigate to project directory:**
   ```bash
   cd Air-hockey-game-htmlonly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Dependencies

From `package.json`:
```json
{
  "dependencies": {
    "express": "^4.18.2",      // Web server framework
    "socket.io": "^4.7.5"      // Real-time WebSocket library
  },
  "devDependencies": {
    "nodemon": "^3.0.1"        // Auto-restart on file changes
  }
}
```

### Testing Multiplayer Locally

**Option 1: Two Browser Tabs**
1. Open `http://localhost:3000` in tab 1
2. Click "Private Room" → Note room code
3. Open `http://localhost:3000` in tab 2
4. Enter room code → Click "Join Game"

**Option 2: Two Different Browsers**
1. Open Chrome → Create private room
2. Open Firefox → Join with room code
3. Better simulation of real multiplayer

**Option 3: Different Devices (Same Network)**
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Player 1: Create room on `http://YOUR_IP:3000`
3. Player 2: Join from another device on same WiFi

---

## How to Play

### Game Rules
- **Objective**: Score goals by hitting the ball into opponent's goal
- **Win Condition**: First player to reach 7 points wins
- **Controls**: Move paddle with mouse/touchscreen
- **Restrictions**: Each player can only move paddle in their half of the table

### Starting a Game

**Quick Match:** (Not yet implemented - placeholder for future AI opponent)
- Click "Quick Match" button
- Currently shows "Coming soon" message

**Private Room:**
1. Enter your player name
2. Click "🔒 Private Room"
3. Share the generated room code with friend
4. Wait for friend to join
5. Game starts automatically when both connected

**Join Existing Room:**
1. Get room code from host
2. Enter your player name
3. Enter room code (6 characters, e.g., "A7K9M2")
4. Click "🎮 Join Game"
5. Game starts immediately

### Gameplay Tips
- **Hit Angle**: Ball bounces based on where it hits your paddle
- **Paddle Speed**: Faster paddle movement adds speed to ball
- **Defense**: Position paddle between ball and your goal
- **Offense**: Aim for sharp angles to beat opponent
- **Center Control**: Dominate center area for better positioning

### Settings

**Access Settings:**
- Click "⚙️ Settings" from main menu

**Customization Options:**
- **Table Color**: Choose from 6 color themes
- **Ball Color**: Choose from 8 ball colors
- Settings apply immediately when selected

### Exit Game
- Click "← Exit to Menu" button in top-left during game
- Returns to main menu
- Disconnects from multiplayer room
- Scores are reset

---

## Performance Optimizations

### Network Efficiency
- **Throttled Updates**: Paddle updates capped at 20fps (50ms intervals)
- **Movement Threshold**: Only send updates if moved >2 pixels
- **Ball Updates**: Host sends at 30fps (33ms intervals)
- **Interpolation**: Smooth 60fps visuals with lower network rate

### Rendering Optimizations
- **Canvas Clear**: Only clear and redraw necessary areas
- **Particle Limit**: Automatic cleanup of expired particles
- **RequestAnimationFrame**: Browser-optimized rendering loop
- **Asset Preloading**: Audio files loaded on initialization

### Memory Management
- **Particle Cleanup**: Dead particles removed from array
- **Room Cleanup**: Empty rooms removed from server memory
- **Socket Cleanup**: Disconnected players properly removed
- **Event Listeners**: Properly added/removed to prevent leaks

---

## Future Enhancement Ideas

### Gameplay Enhancements
- [ ] AI opponent for single-player mode
- [ ] Power-ups (speed boost, paddle size, multi-ball)
- [ ] Tournament mode with bracket system
- [ ] Difficulty levels (easy, medium, hard)
- [ ] Ball trail effects
- [ ] Different game modes (first to 3, 5, 10 points)

### Multiplayer Features
- [ ] Matchmaking system (random opponent pairing)
- [ ] Global leaderboard
- [ ] Player profiles and statistics
- [ ] Spectator mode
- [ ] Replay system
- [ ] Chat functionality

### Visual Improvements
- [ ] More table themes
- [ ] Custom paddle skins
- [ ] Better goal animations
- [ ] Victory screen with statistics
- [ ] Loading screen animations
- [ ] Responsive mobile design

### Technical Improvements
- [ ] Server-side physics for cheat prevention
- [ ] Database for persistent user data
- [ ] JWT authentication
- [ ] Rate limiting
- [ ] Better error handling
- [ ] Reconnection on disconnect
- [ ] Game state persistence

---

## Troubleshooting

### Common Issues

**Issue: "Room not found" error**
- **Solution**: Ensure room code is correct (case-sensitive)
- Room may have expired or been closed
- Host must create room before guest joins

**Issue: Paddle not moving**
- **Solution**: Check if mouse is within canvas bounds
- Ensure game has started
- Check browser console for JavaScript errors

**Issue: No sound effects**
- **Solution**: Ensure audio files exist in `/audio/` directory
- Check browser autoplay policy (user interaction required)
- Verify file paths in HTML audio elements

**Issue: Connection problems**
- **Solution**: Check if server is running (`npm start`)
- Verify firewall isn't blocking port 3000
- Check network connection
- Look for Socket.IO errors in console

**Issue: Ball gets stuck**
- **Solution**: Built-in stuck detection auto-resets ball
- If persists, check collision detection logic
- May occur with very high speeds

---

## Credits & License

### Technologies Used
- **HTML5 Canvas** - Graphics rendering
- **JavaScript (ES5/ES6)** - Game logic
- **Socket.IO** - Real-time communication
- **Express.js** - Web server
- **Node.js** - Server runtime

### Assets
- Background images: AI-generated (Gemini)
- Sound effects: Custom/royalty-free audio files
- Icons: Unicode emoji characters

### License
MIT License - Free to use, modify, and distribute

### Author
Developed as a multiplayer air hockey game demonstration project

---

## Code Statistics

- **Total Lines of Code**: ~2,676 lines
  - `script.js`: 1,462 lines
  - `styles.css`: 917 lines
  - `server.js`: 297 lines
- **Functions**: 50+ JavaScript functions
- **Socket Events**: 15+ multiplayer events
- **CSS Classes**: 80+ styled components
- **Game Objects**: 3 main classes (Paddle, Ball, Particle)

---

## Conclusion

This air hockey game demonstrates modern web development techniques including:
- Real-time multiplayer with WebSocket synchronization
- Client-side prediction and server reconciliation
- Smooth interpolation for network lag compensation
- Professional UI/UX with glassmorphism design
- Particle effects and physics simulation
- Modular code architecture
- Network optimization strategies

Perfect for learning game development, multiplayer networking, and HTML5 Canvas graphics!

**Enjoy the game! 🏒**
