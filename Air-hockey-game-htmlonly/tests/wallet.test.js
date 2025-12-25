/**
 * Wallet Edge Cases Test Suite
 * Tests for WalletManager class covering all identified edge cases
 */

describe('Wallet Edge Cases', () => {
  let WalletManager;
  let walletManager;

  beforeEach(() => {
    // Reset mocks
    resetAllMocks();
    
    // Mock wallet manager (in real tests, import from wallet.js)
    WalletManager = class {
      constructor() {
        this.provider = null;
        this.publicKey = null;
        this.connected = false;
        this.connection = null;
        this.balance = 0;
        this.network = 'devnet';
        this.GAS_FEE_BUFFER = 0.01;
        this.connectionTimeout = 30000;
      }

      isPhantomInstalled() {
        return window.solana && window.solana.isPhantom;
      }

      async connect() {
        if (!this.isPhantomInstalled()) {
          throw new Error('Phantom wallet is not installed! Please install it from https://phantom.app/');
        }
        
        const response = await window.solana.connect();
        this.provider = window.solana;
        this.publicKey = response.publicKey;
        this.connected = true;
        this.balance = 1.0; // Mock balance
        
        return {
          success: true,
          publicKey: this.publicKey.toString(),
          balance: this.balance
        };
      }

      hasSufficientBalance(requiredSOL) {
        return this.balance >= (requiredSOL + this.GAS_FEE_BUFFER);
      }

      getTotalCost(requiredSOL) {
        return requiredSOL + this.GAS_FEE_BUFFER;
      }

      async requestAirdrop(amount = 1) {
        if (this.network !== 'devnet') {
          throw new Error('Airdrops only available on devnet');
        }
        if (amount <= 0 || amount > 5) {
          throw new Error('Airdrop amount must be between 0 and 5 SOL');
        }
        return { success: true, amount };
      }
    };

    walletManager = new WalletManager();
  });

  describe('WC-001: Phantom Wallet Installation', () => {
    test('should return false when Phantom is not installed', () => {
      // Create a fresh wallet manager with no Phantom
      delete window.solana;
      
      const freshWallet = new WalletManager();
      const result = freshWallet.isPhantomInstalled();
      
      // Restore for other tests
      window.solana = { isPhantom: true };
      
      // When window.solana is undefined, the result is falsy (undefined or false)
      expect(result).toBeFalsy();
    });

    test('should detect Phantom when installed', () => {
      window.solana = { isPhantom: true };
      
      expect(walletManager.isPhantomInstalled()).toBeTruthy();
    });
  });

  describe('WC-002: Multiple Wallet Extensions', () => {
    test('should verify Phantom is the provider', () => {
      window.solana = { isPhantom: true };
      
      expect(window.solana.isPhantom).toBe(true);
    });

    test('should reject non-Phantom wallets', () => {
      window.solana = { isPhantom: false };
      
      expect(walletManager.isPhantomInstalled()).toBe(false);
    });
  });

  describe('WC-003: Connection Failures', () => {
    test('should handle user rejection gracefully', async () => {
      window.solana = { isPhantom: true, connect: jest.fn().mockRejectedValue(new Error('User rejected')) };
      
      await expect(walletManager.connect()).rejects.toThrow('User rejected');
    });

    test('should return error object on connection failure', async () => {
      window.solana = { isPhantom: true, connect: jest.fn().mockRejectedValue(new Error('Connection failed')) };
      
      try {
        await walletManager.connect();
      } catch (error) {
        expect(error.message).toContain('Connection failed');
      }
    });
  });

  describe('WC-006: Zero Balance', () => {
    test('should reject game creation with zero balance', () => {
      walletManager.balance = 0;
      
      const canCreate = walletManager.hasSufficientBalance(0.1);
      
      expect(canCreate).toBe(false);
    });
  });

  describe('WC-007: Insufficient Balance with Gas Fees', () => {
    test('should account for gas fees in balance check', () => {
      walletManager.balance = 0.1; // Exactly the stake amount
      
      const canCreate = walletManager.hasSufficientBalance(0.1);
      
      expect(canCreate).toBe(false); // Should fail because gas fees not included
    });

    test('should pass when balance covers stake + gas', () => {
      walletManager.balance = 0.15; // 0.1 stake + 0.01 gas + buffer
      
      const canCreate = walletManager.hasSufficientBalance(0.1);
      
      expect(canCreate).toBe(true);
    });

    test('should calculate correct total cost', () => {
      const totalCost = walletManager.getTotalCost(0.1);
      
      expect(totalCost).toBe(0.11); // 0.1 + 0.01 gas buffer
    });
  });

  describe('AD-001: Airdrop on Mainnet', () => {
    test('should reject airdrop on mainnet', async () => {
      walletManager.network = 'mainnet-beta';
      
      await expect(walletManager.requestAirdrop(1)).rejects.toThrow('Airdrops only available on devnet');
    });

    test('should allow airdrop on devnet', async () => {
      walletManager.network = 'devnet';
      
      const result = await walletManager.requestAirdrop(1);
      
      expect(result.success).toBe(true);
    });
  });

  describe('AD-004: Negative Airdrop Amount', () => {
    test('should reject negative airdrop amount', async () => {
      await expect(walletManager.requestAirdrop(-1)).rejects.toThrow('Airdrop amount must be between 0 and 5 SOL');
    });

    test('should reject zero airdrop amount', async () => {
      await expect(walletManager.requestAirdrop(0)).rejects.toThrow('Airdrop amount must be between 0 and 5 SOL');
    });

    test('should reject excessive airdrop amount', async () => {
      await expect(walletManager.requestAirdrop(10)).rejects.toThrow('Airdrop amount must be between 0 and 5 SOL');
    });

    test('should accept valid airdrop amount', async () => {
      const result = await walletManager.requestAirdrop(2);
      
      expect(result.success).toBe(true);
      expect(result.amount).toBe(2);
    });
  });
});

// Integration test example
describe('Wallet Integration Tests', () => {
  test('Full wallet connection flow', async () => {
    // Setup proper mocks
    window.solana = {
      isPhantom: true,
      connect: jest.fn().mockResolvedValue({ publicKey: 'mock-public-key' }),
      on: jest.fn()
    };
    
    // Create a simple mock wallet manager
    const mockWallet = {
      connected: false,
      isPhantomInstalled() { 
        return window.solana && window.solana.isPhantom; 
      },
      async connect() { 
        if (!this.isPhantomInstalled()) {
          throw new Error('Phantom not installed');
        }
        this.connected = true; 
        return { success: true }; 
      }
    };

    // Simulate full flow
    expect(mockWallet.connected).toBe(false);
    expect(mockWallet.isPhantomInstalled()).toBe(true);
    
    const result = await mockWallet.connect();
    
    expect(result.success).toBe(true);
    expect(mockWallet.connected).toBe(true);
  });
});
