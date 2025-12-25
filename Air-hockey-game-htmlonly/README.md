# Air Hockey Multiplayer Game

A real-time multiplayer air hockey game built with HTML5 Canvas, JavaScript, Node.js, Express, and Socket.IO.

## Features

- **Real-time multiplayer**: Play with friends in real-time
- **Room system**: Create private rooms with shareable codes
- **Host/Guest roles**: Host controls game physics, guest receives updates
- **Paddle synchronization**: Both players' movements are synced in real-time
- **Score tracking**: Real-time score updates for both players
- **Connection status**: Visual indicators for connection and player status
- **Sound effects**: Synchronized sound effects for all game events
- **Professional UI**: Modern design with glassmorphism effects

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will start on `http://localhost:3000`

### 3. Test Multiplayer (Same Computer)

**Player 1 (Host):**
1. Open `http://localhost:3000` in your first browser tab
2. Enter a player name
3. Click **"🔒 Private Room"**
4. A room code will be displayed (e.g., `A7K9M2`)
5. Share this code with Player 2

**Player 2 (Guest):**
1. Open `http://localhost:3000` in a second browser tab
2. Enter a player name
3. Enter the room code from Player 1
4. Click **"🎮 Join Game"**

**Game Start:**
- Once both players are connected, the game starts automatically
- Host (Player 1) controls the left paddle
- Guest (Player 2) controls the right paddle
- Both players see the same synchronized game state

## Game Controls

- **Mouse Movement**: Control your paddle
- **ESC Key**: Exit to main menu

## Architecture

### Server Side (`server.js`)
- **Express.js**: Web server for serving static files
- **Socket.IO**: Real-time bidirectional communication
- **Room Management**: Create, join, and manage game rooms
- **Game State**: Centralized game state management

### Client Side (`script.js`)
- **Socket.IO Client**: Real-time communication with server
- **Game Physics**: Host handles physics, guest receives updates
- **Paddle Sync**: Real-time paddle position synchronization
- **Event Handling**: Mouse controls and game events

### Key Components

1. **Room System**:
   - Random 6-character room codes
   - Maximum 2 players per room
   - Automatic game start when room is full

2. **Role Assignment**:
   - **Host**: First player, controls game physics and ball movement
   - **Guest**: Second player, receives game state updates

3. **Real-time Sync**:
   - Paddle positions (60 FPS)
   - Ball position and velocity
   - Score updates
   - Sound effect events

## Socket Events

### Client → Server
- `createRoom(playerName)`: Create a new game room
- `joinRoom({roomId, playerName})`: Join existing room
- `paddleMove({x, y})`: Send paddle position
- `ballUpdate({x, y, vx, vy})`: Send ball state (host only)
- `scoreUpdate({player1, player2})`: Send score update (host only)
- `gameEvent({type})`: Send game events (host only)

### Server → Client
- `roomCreated({roomId, playerName, waitingForPlayer})`: Room creation confirmation
- `roomJoined({roomId, playerName})`: Room join confirmation
- `playerAssigned({playerNumber, role, roomId})`: Player role assignment
- `gameStart({gameState, playerRole})`: Game start signal
- `paddleUpdate({playerNumber, x, y})`: Paddle position update
- `ballUpdate({x, y, vx, vy})`: Ball state update
- `scoreUpdate({player1, player2})`: Score update
- `gameEvent({type})`: Game events (goal, hit, wall)
- `playerDisconnected()`: Player disconnection notification

## Development

### Development Mode with Auto-restart
```bash
npm run dev
```

### File Structure
```
├── server.js          # Node.js server with Socket.IO
├── package.json       # Dependencies and scripts
├── index.html         # Main game HTML
├── styles.css         # Game styling
├── script.js          # Client-side game logic
└── README.md          # This file
```

## Testing Scenarios

1. **Local Testing**: Use two browser tabs on the same computer
2. **Network Testing**: Connect from different devices on the same network
3. **Internet Testing**: Deploy to a cloud platform for remote testing

## Troubleshooting

### Connection Issues
- Ensure the server is running on port 3000
- Check browser console for connection errors
- Verify Socket.IO client library is loaded

### Game Sync Issues
- Only the host should handle game physics
- Check that paddle movements are being emitted
- Verify ball updates are only sent by the host

### Performance
- Game runs at 60 FPS with real-time synchronization
- Paddle positions are synced on every movement
- Ball position is updated continuously by the host

## Browser Compatibility

- Modern browsers with WebSocket support
- HTML5 Canvas support required
- ES6+ JavaScript features used

Enjoy playing Air Hockey with your friends! 🏒🎮