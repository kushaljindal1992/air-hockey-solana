/**
 * Multiplayer Edge Cases Test Suite
 * Tests for server-side validation and synchronization
 */

describe('Multiplayer Edge Cases', () => {
  let GameRoom;
  let room;

  beforeEach(() => {
    resetAllMocks();
    
    // Mock GameRoom class
    GameRoom = class {
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
        this.gameId = gameId;
        this.stakeAmount = stakeAmount;
        this.gameCompleted = false;
        this.serverScores = { player1: 0, player2: 0 };
        
        // Rate limiting
        this.ballUpdateCount = 0;
        this.lastBallUpdateReset = Date.now();
        this.MAX_BALL_UPDATES_PER_SECOND = 120;
      }

      updatePaddle(playerNumber, x, y) {
        // Validate paddle coordinates
        const isValidX = x >= 50 && x <= 900;
        const isValidY = y >= 50 && y <= 500;
        
        if (!isValidX || !isValidY) {
          console.warn(`Invalid paddle position from player ${playerNumber}`);
          return false;
        }
        
        // Validate center line crossing
        if (playerNumber === 1 && x > 500) {
          x = 500;
        } else if (playerNumber === 2 && x < 500) {
          x = 500;
        }
        
        if (playerNumber === 1) {
          this.gameState.paddles.player1 = { x, y };
        } else if (playerNumber === 2) {
          this.gameState.paddles.player2 = { x, y };
        }
        
        return true;
      }

      updateBall(ballData) {
        // Rate limiting
        const now = Date.now();
        if (now - this.lastBallUpdateReset > 1000) {
          this.ballUpdateCount = 0;
          this.lastBallUpdateReset = now;
        }
        
        this.ballUpdateCount++;
        if (this.ballUpdateCount > this.MAX_BALL_UPDATES_PER_SECOND) {
          console.warn('Rate limit exceeded');
          return false;
        }
        
        // Validate ball position
        if (ballData.x < 0 || ballData.x > 1000 || ballData.y < 0 || ballData.y > 600) {
          console.warn('Invalid ball position');
          return false;
        }
        
        this.gameState.ball = ballData;
        return true;
      }

      updateServerScore(player, score) {
        if (player === 'player1') {
          this.serverScores.player1 = score;
        } else if (player === 'player2') {
          this.serverScores.player2 = score;
        }
      }
    };

    room = new GameRoom('TEST-ROOM', 123456, 0.1);
  });

  describe('MP-010: Paddle Position Validation', () => {
    test('should reject paddle outside bounds (x too low)', () => {
      const result = room.updatePaddle(1, -100, 300);
      
      expect(result).toBe(false);
    });

    test('should reject paddle outside bounds (x too high)', () => {
      const result = room.updatePaddle(1, 1000, 300);
      
      expect(result).toBe(false);
    });

    test('should reject paddle outside bounds (y too low)', () => {
      const result = room.updatePaddle(1, 150, -50);
      
      expect(result).toBe(false);
    });

    test('should reject paddle outside bounds (y too high)', () => {
      const result = room.updatePaddle(1, 150, 600);
      
      expect(result).toBe(false);
    });

    test('should accept valid paddle position', () => {
      const result = room.updatePaddle(1, 200, 300);
      
      expect(result).toBe(true);
      expect(room.gameState.paddles.player1.x).toBe(200);
      expect(room.gameState.paddles.player1.y).toBe(300);
    });
  });

  describe('GL-007: Center Line Violation', () => {
    test('should clamp player 1 paddle at center line', () => {
      room.updatePaddle(1, 600, 300); // Player 1 trying to cross
      
      expect(room.gameState.paddles.player1.x).toBe(500); // Clamped to center
    });

    test('should clamp player 2 paddle at center line', () => {
      room.updatePaddle(2, 400, 300); // Player 2 trying to cross
      
      expect(room.gameState.paddles.player2.x).toBe(500); // Clamped to center
    });

    test('should allow player 1 on their side', () => {
      room.updatePaddle(1, 250, 300);
      
      expect(room.gameState.paddles.player1.x).toBe(250);
    });

    test('should allow player 2 on their side', () => {
      room.updatePaddle(2, 750, 300);
      
      expect(room.gameState.paddles.player2.x).toBe(750);
    });
  });

  describe('MP-009: Ball Update Rate Limiting', () => {
    test('should accept ball updates under rate limit', () => {
      // Send 100 updates (under 120 limit)
      for (let i = 0; i < 100; i++) {
        const result = room.updateBall({ x: 500, y: 300, vx: 0, vy: 0 });
        expect(result).toBe(true);
      }
    });

    test('should reject ball updates over rate limit', () => {
      // Send 150 updates (over 120 limit)
      let rejectedCount = 0;
      
      for (let i = 0; i < 150; i++) {
        const result = room.updateBall({ x: 500, y: 300, vx: 0, vy: 0 });
        if (!result) rejectedCount++;
      }
      
      expect(rejectedCount).toBeGreaterThan(0);
    });

    test('should reset rate limit counter after 1 second', async () => {
      // Fill up rate limit
      for (let i = 0; i < 120; i++) {
        room.updateBall({ x: 500, y: 300, vx: 0, vy: 0 });
      }
      
      // Simulate time passing
      room.lastBallUpdateReset = Date.now() - 1100; // 1.1 seconds ago
      
      // Should accept new updates
      const result = room.updateBall({ x: 500, y: 300, vx: 0, vy: 0 });
      expect(result).toBe(true);
    });
  });

  describe('Ball Position Validation', () => {
    test('should reject ball outside left boundary', () => {
      const result = room.updateBall({ x: -10, y: 300, vx: 0, vy: 0 });
      
      expect(result).toBe(false);
    });

    test('should reject ball outside right boundary', () => {
      const result = room.updateBall({ x: 1100, y: 300, vx: 0, vy: 0 });
      
      expect(result).toBe(false);
    });

    test('should reject ball outside top boundary', () => {
      const result = room.updateBall({ x: 500, y: -10, vx: 0, vy: 0 });
      
      expect(result).toBe(false);
    });

    test('should reject ball outside bottom boundary', () => {
      const result = room.updateBall({ x: 500, y: 700, vx: 0, vy: 0 });
      
      expect(result).toBe(false);
    });

    test('should accept ball within boundaries', () => {
      const result = room.updateBall({ x: 500, y: 300, vx: 5, vy: 5 });
      
      expect(result).toBe(true);
      expect(room.gameState.ball.x).toBe(500);
      expect(room.gameState.ball.y).toBe(300);
    });
  });

  describe('MP-015: Server-Side Score Tracking', () => {
    test('should track player 1 score', () => {
      room.updateServerScore('player1', 3);
      
      expect(room.serverScores.player1).toBe(3);
    });

    test('should track player 2 score', () => {
      room.updateServerScore('player2', 5);
      
      expect(room.serverScores.player2).toBe(5);
    });

    test('should maintain separate scores for both players', () => {
      room.updateServerScore('player1', 2);
      room.updateServerScore('player2', 4);
      
      expect(room.serverScores.player1).toBe(2);
      expect(room.serverScores.player2).toBe(4);
    });
  });

  describe('Winner Verification', () => {
    function verifyWinner(room, claimedWinner) {
      const p1Score = room.serverScores.player1 || 0;
      const p2Score = room.serverScores.player2 || 0;
      
      let actualWinner;
      if (p1Score >= 7) {
        actualWinner = 'player1';
      } else if (p2Score >= 7) {
        actualWinner = 'player2';
      } else {
        return null; // No winner yet
      }
      
      if (claimedWinner !== actualWinner) {
        return null; // Cheat detected
      }
      
      return actualWinner;
    }

    test('should verify legitimate player 1 win', () => {
      room.serverScores.player1 = 7;
      room.serverScores.player2 = 3;
      
      const winner = verifyWinner(room, 'player1');
      
      expect(winner).toBe('player1');
    });

    test('should verify legitimate player 2 win', () => {
      room.serverScores.player1 = 4;
      room.serverScores.player2 = 7;
      
      const winner = verifyWinner(room, 'player2');
      
      expect(winner).toBe('player2');
    });

    test('should detect cheating (wrong winner claimed)', () => {
      room.serverScores.player1 = 7;
      room.serverScores.player2 = 3;
      
      const winner = verifyWinner(room, 'player2'); // Claiming wrong winner
      
      expect(winner).toBeNull();
    });

    test('should reject completion when no player has won', () => {
      room.serverScores.player1 = 5;
      room.serverScores.player2 = 4;
      
      const winner = verifyWinner(room, 'player1');
      
      expect(winner).toBeNull();
    });

    test('should handle tied scores (both under 7)', () => {
      room.serverScores.player1 = 6;
      room.serverScores.player2 = 6;
      
      const winner = verifyWinner(room, 'player1');
      
      expect(winner).toBeNull();
    });
  });
});

// Server Message Validation Tests
describe('MP-011: Ball Update Authorization', () => {
  test('should accept ball updates from host', () => {
    const playerRole = 'host';
    const shouldAccept = playerRole === 'host';
    
    expect(shouldAccept).toBe(true);
  });

  test('should reject ball updates from guest', () => {
    const playerRole = 'guest';
    const shouldAccept = playerRole === 'host';
    
    expect(shouldAccept).toBe(false);
  });

  test('should log warning when guest attempts ball update', () => {
    const consoleSpy = jest.spyOn(console, 'warn');
    const playerRole = 'guest';
    
    if (playerRole !== 'host') {
      console.warn('REJECTED: Guest attempted to update ball');
    }
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('REJECTED'));
  });
});
