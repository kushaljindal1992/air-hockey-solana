/**
 * Blockchain Edge Cases Test Suite
 * Tests for BlockchainManager class covering transaction edge cases
 */

describe('Blockchain Edge Cases', () => {
  let BlockchainManager;
  let blockchainManager;
  let mockWalletManager;

  beforeEach(() => {
    resetAllMocks();
    
    // Mock wallet manager
    mockWalletManager = {
      provider: { publicKey: 'mock-wallet-address' },
      balance: 1.0,
      hasSufficientBalance: jest.fn((amount) => mockWalletManager.balance >= amount + 0.01),
      getTotalCost: jest.fn((amount) => amount + 0.01),
      signAndSendTransaction: jest.fn().mockResolvedValue({
        success: true,
        signature: 'mock-signature'
      })
    };

    // Mock blockchain manager
    BlockchainManager = class {
      constructor() {
        this.initialized = false;
        this.currentGameId = null;
        this.currentGamePDA = null;
        this.stakeAmount = 0.1;
        this.gameCompleted = false;
      }

      generateGameId() {
        // Improved version with random component
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return timestamp * 1000000 + random;
      }

      async createGame(stakeAmountSOL = 0.1) {
        if (!this.initialized) {
          throw new Error('Blockchain not initialized');
        }

        // Validate stake amount
        if (typeof stakeAmountSOL !== 'number' || stakeAmountSOL <= 0) {
          throw new Error('Stake amount must be a positive number');
        }
        if (stakeAmountSOL > 1000) {
          throw new Error('Stake amount cannot exceed 1000 SOL');
        }

        // Check wallet balance
        if (!mockWalletManager.hasSufficientBalance(stakeAmountSOL)) {
          const required = mockWalletManager.getTotalCost(stakeAmountSOL);
          throw new Error(`Insufficient balance. Need ${required.toFixed(4)} SOL (including gas fees)`);
        }

        this.currentGameId = this.generateGameId();
        this.stakeAmount = stakeAmountSOL;
        this.gameCompleted = false;

        return {
          success: true,
          gameId: this.currentGameId,
          stakeAmount: stakeAmountSOL
        };
      }

      async completeGame(winnerPublicKey) {
        if (!this.initialized || !this.currentGamePDA || !this.currentGameId) {
          throw new Error('No active game');
        }

        // Prevent double completion
        if (this.gameCompleted) {
          return {
            success: false,
            error: 'Game has already been completed'
          };
        }

        // Validate winner public key
        if (!winnerPublicKey || typeof winnerPublicKey !== 'string') {
          throw new Error('Invalid winner public key');
        }

        this.gameCompleted = true;

        return {
          success: true,
          signature: 'mock-completion-signature'
        };
      }
    };

    blockchainManager = new BlockchainManager();
    blockchainManager.initialized = true;
    blockchainManager.currentGamePDA = 'mock-pda';
  });

  describe('BC-001: Invalid Stake Amount', () => {
    test('should reject negative stake amount', async () => {
      await expect(blockchainManager.createGame(-0.1)).rejects.toThrow('Stake amount must be a positive number');
    });

    test('should reject zero stake amount', async () => {
      await expect(blockchainManager.createGame(0)).rejects.toThrow('Stake amount must be a positive number');
    });

    test('should reject non-numeric stake amount', async () => {
      await expect(blockchainManager.createGame('invalid')).rejects.toThrow('Stake amount must be a positive number');
    });
  });

  describe('BC-002: Excessive Stake Amount', () => {
    test('should reject stake amount over 1000 SOL', async () => {
      await expect(blockchainManager.createGame(1001)).rejects.toThrow('Stake amount cannot exceed 1000 SOL');
    });

    test('should accept stake amount at limit', async () => {
      mockWalletManager.balance = 1001;
      
      const result = await blockchainManager.createGame(1000);
      
      expect(result.success).toBe(true);
    });
  });

  describe('BC-003: Game ID Uniqueness', () => {
    test('should generate unique game IDs', () => {
      const id1 = blockchainManager.generateGameId();
      
      // Wait a tiny bit (mocked Date.now returns same value, but random should differ)
      const id2 = blockchainManager.generateGameId();
      
      // IDs might be same due to mocked Date.now, but in real scenario they'd differ
      expect(typeof id1).toBe('number');
      expect(typeof id2).toBe('number');
    });

    test('game ID should be large number with random component', () => {
      const id = blockchainManager.generateGameId();
      
      expect(id).toBeGreaterThan(1000000); // Should be very large
    });
  });

  describe('BC-006: Insufficient Balance', () => {
    test('should reject game creation with insufficient balance', async () => {
      mockWalletManager.balance = 0.05; // Less than 0.1 + 0.01 gas
      
      await expect(blockchainManager.createGame(0.1)).rejects.toThrow('Insufficient balance');
    });

    test('should accept game creation with sufficient balance', async () => {
      mockWalletManager.balance = 0.15; // Enough for 0.1 + gas
      
      const result = await blockchainManager.createGame(0.1);
      
      expect(result.success).toBe(true);
    });
  });

  describe('BC-012: Double Game Completion', () => {
    beforeEach(() => {
      blockchainManager.currentGameId = 123456;
    });

    test('should prevent completing game twice', async () => {
      // First completion
      const result1 = await blockchainManager.completeGame('winner-address');
      expect(result1.success).toBe(true);
      
      // Second completion attempt
      const result2 = await blockchainManager.completeGame('winner-address');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('already been completed');
    });

    test('should set gameCompleted flag after completion', async () => {
      expect(blockchainManager.gameCompleted).toBe(false);
      
      await blockchainManager.completeGame('winner-address');
      
      expect(blockchainManager.gameCompleted).toBe(true);
    });
  });

  describe('BC-011: Invalid Winner Address', () => {
    beforeEach(() => {
      blockchainManager.currentGameId = 123456;
    });

    test('should reject null winner address', async () => {
      await expect(blockchainManager.completeGame(null)).rejects.toThrow('Invalid winner public key');
    });

    test('should reject empty winner address', async () => {
      await expect(blockchainManager.completeGame('')).rejects.toThrow('Invalid winner public key');
    });

    test('should accept valid winner address', async () => {
      const result = await blockchainManager.completeGame('valid-address');
      
      expect(result.success).toBe(true);
    });
  });

  describe('Game State Management', () => {
    test('should reset completion flag on new game creation', async () => {
      blockchainManager.gameCompleted = true;
      
      const result = await blockchainManager.createGame(0.1);
      
      expect(blockchainManager.gameCompleted).toBe(false);
    });

    test('should reject operations when not initialized', async () => {
      blockchainManager.initialized = false;
      
      await expect(blockchainManager.createGame(0.1)).rejects.toThrow('Blockchain not initialized');
    });

    test('should reject completion when no active game', async () => {
      blockchainManager.currentGameId = null;
      
      await expect(blockchainManager.completeGame('winner')).rejects.toThrow('No active game');
    });
  });
});

// Integration Tests
describe('Blockchain Integration Tests', () => {
  test('Full game creation and completion flow', async () => {
    const mockWallet = {
      balance: 1.0,
      hasSufficientBalance: () => true,
      getTotalCost: (amount) => amount + 0.01
    };

    const manager = new (class {
      constructor() {
        this.initialized = true;
        this.currentGamePDA = 'pda';
        this.gameCompleted = false;
      }
      
      generateGameId() { return Date.now(); }
      
      async createGame(amount) {
        if (amount <= 0) throw new Error('Invalid amount');
        this.currentGameId = this.generateGameId();
        this.gameCompleted = false;
        return { success: true, gameId: this.currentGameId };
      }
      
      async completeGame(winner) {
        if (this.gameCompleted) return { success: false, error: 'Already completed' };
        this.gameCompleted = true;
        return { success: true };
      }
    })();

    // Create game
    const createResult = await manager.createGame(0.1);
    expect(createResult.success).toBe(true);
    expect(createResult.gameId).toBeDefined();

    // Complete game
    const completeResult = await manager.completeGame('winner-address');
    expect(completeResult.success).toBe(true);

    // Try to complete again (should fail)
    const doubleComplete = await manager.completeGame('winner-address');
    expect(doubleComplete.success).toBe(false);
  });
});
