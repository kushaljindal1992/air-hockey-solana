/**
 * Blockchain Integration Module
 * Handles interaction with Solana Escrow Smart Contract
 */

class BlockchainManager {
  constructor() {
    this.programId = new solanaWeb3.PublicKey('3KzkUzoaSFt7xF9sW389YFE1JTwD5Fcu3aM9sReU4jgr');
    this.connection = null;
    this.provider = null;
    this.program = null;
    this.platformStatePDA = null;
    this.initialized = false;
    
    // Game tracking
    this.currentGameId = null;
    this.currentGamePDA = null;
    this.stakeAmount = 0.1; // Default 0.1 SOL
    this.gameCompleted = false; // Prevent double completion
  }

  /**
   * Initialize blockchain connection
   */
  async initialize(walletProvider, network = 'devnet') {
    try {
      // Check if Buffer is available
      if (typeof Buffer === 'undefined') {
        throw new Error('Buffer is not defined. Please ensure buffer polyfill is loaded.');
      }
      
      // Check if BN is available
      if (typeof BN === 'undefined') {
        throw new Error('BN is not defined. Please ensure bn.js library is loaded.');
      }
      
      const endpoint = network === 'devnet' 
        ? 'https://api.devnet.solana.com'
        : 'https://api.mainnet-beta.solana.com';
      
      this.connection = new solanaWeb3.Connection(endpoint, 'confirmed');
      this.provider = walletProvider;

      // Derive platform state PDA
      const [platformPDA, bump] = await solanaWeb3.PublicKey.findProgramAddress(
        [Buffer.from('platform_state')],
        this.programId
      );
      this.platformStatePDA = platformPDA;

      console.log('✅ Blockchain initialized');
      console.log('   Program ID:', this.programId.toString());
      console.log('   Platform PDA:', this.platformStatePDA.toString());
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate unique game ID with timestamp and random component
   */
  generateGameId() {
    // Combine timestamp with random number to prevent collisions
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return timestamp * 1000000 + random;
  }

  /**
   * Derive game account PDA
   */
  async getGamePDA(gameId) {
    const gameIdBuffer = Buffer.allocUnsafe(8);
    gameIdBuffer.writeBigUInt64LE(BigInt(gameId));

    const [gamePDA, bump] = await solanaWeb3.PublicKey.findProgramAddress(
      [Buffer.from('game'), gameIdBuffer],
      this.programId
    );

    return gamePDA;
  }

  /**
   * Create a new game (Player 1)
   * @param {number} stakeAmountSOL - Amount to stake in SOL
   * @returns {Object} - Transaction result
   */
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

    // Check wallet balance (including gas fees)
    if (!walletManager.hasSufficientBalance(stakeAmountSOL)) {
      const required = walletManager.getTotalCost(stakeAmountSOL);
      throw new Error(`Insufficient balance. Need ${required.toFixed(4)} SOL (including gas fees), have ${walletManager.balance.toFixed(4)} SOL`);
    }

    try {
      // Generate game ID
      this.currentGameId = this.generateGameId();
      this.stakeAmount = stakeAmountSOL;
      
      // Get game PDA
      this.currentGamePDA = await this.getGamePDA(this.currentGameId);

      console.log('🎮 Creating game...');
      console.log('   Game ID:', this.currentGameId);
      console.log('   Stake:', stakeAmountSOL, 'SOL');
      console.log('   Game PDA:', this.currentGamePDA.toString());

      // Build transaction
      // Convert SOL to lamports using BN.js
      const lamportsPerSol = 1000000000; // 1 SOL = 1 billion lamports
      const stakeAmountLamports = new BN(Math.floor(stakeAmountSOL * lamportsPerSol));
      
      const gameIdBuffer = Buffer.allocUnsafe(8);
      gameIdBuffer.writeBigUInt64LE(BigInt(this.currentGameId));

      const instruction = new solanaWeb3.TransactionInstruction({
        programId: this.programId,
        keys: [
          { pubkey: this.currentGamePDA, isSigner: false, isWritable: true },
          { pubkey: this.provider.publicKey, isSigner: true, isWritable: true },
          { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.concat([
          Buffer.from([124, 69, 75, 66, 184, 220, 72, 206]), // create_game discriminator
          gameIdBuffer,
          stakeAmountLamports.toArrayLike(Buffer, 'le', 8)
        ])
      });

      const transaction = new solanaWeb3.Transaction().add(instruction);

      // Send transaction through wallet
      const result = await walletManager.signAndSendTransaction(transaction);

      if (result.success) {
        console.log('✅ Game created successfully!');
        console.log('   Transaction:', result.signature);
        
        // Reset completion flag for new game
        this.gameCompleted = false;
        
        return {
          success: true,
          gameId: this.currentGameId,
          gamePDA: this.currentGamePDA.toString(),
          signature: result.signature,
          stakeAmount: stakeAmountSOL
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to create game:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Join existing game (Player 2)
   * @param {number} gameId - Game ID to join
   * @returns {Object} - Transaction result
   */
  async joinGame(gameId) {
    if (!this.initialized) {
      throw new Error('Blockchain not initialized');
    }

    try {
      // Get game PDA
      const gamePDA = await this.getGamePDA(gameId);
      
      // Fetch game account to get stake amount
      const gameAccount = await this.connection.getAccountInfo(gamePDA);
      if (!gameAccount) {
        throw new Error('Game not found');
      }

      console.log('🎮 Joining game...');
      console.log('   Game ID:', gameId);
      console.log('   Game PDA:', gamePDA.toString());

      const instruction = new solanaWeb3.TransactionInstruction({
        programId: this.programId,
        keys: [
          { pubkey: gamePDA, isSigner: false, isWritable: true },
          { pubkey: this.provider.publicKey, isSigner: true, isWritable: true },
          { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([107, 112, 18, 38, 56, 173, 60, 128]) // join_game discriminator
      });

      const transaction = new solanaWeb3.Transaction().add(instruction);

      // Send transaction
      const result = await walletManager.signAndSendTransaction(transaction);

      if (result.success) {
        console.log('✅ Successfully joined game!');
        console.log('   Transaction:', result.signature);
        
        this.currentGameId = gameId;
        this.currentGamePDA = gamePDA;
        
        return {
          success: true,
          gameId: gameId,
          gamePDA: gamePDA.toString(),
          signature: result.signature
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to join game:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Complete game and distribute winnings
   * @param {string} winnerPublicKey - Winner's public key
   * @returns {Object} - Transaction result
   */
  async completeGame(winnerPublicKey) {
    if (!this.initialized || !this.currentGamePDA || !this.currentGameId) {
      throw new Error('No active game');
    }

    // Prevent double completion
    if (this.gameCompleted) {
      console.warn('⚠️ Game already completed');
      return {
        success: false,
        error: 'Game has already been completed'
      };
    }

    // Validate winner is a valid public key
    try {
      new solanaWeb3.PublicKey(winnerPublicKey);
    } catch (error) {
      throw new Error('Invalid winner public key');
    }

    try {
      const winnerPubkey = new solanaWeb3.PublicKey(winnerPublicKey);
      
      console.log('🏆 Completing game...');
      console.log('   Game ID:', this.currentGameId);
      console.log('   Winner:', winnerPublicKey);

      // Fetch platform state to get admin
      const platformAccount = await this.connection.getAccountInfo(this.platformStatePDA);
      if (!platformAccount) {
        throw new Error('Platform state not found');
      }

      // Parse admin from platform state (skip 8 byte discriminator, admin is next 32 bytes)
      const adminPubkey = new solanaWeb3.PublicKey(platformAccount.data.slice(8, 40));

      const instruction = new solanaWeb3.TransactionInstruction({
        programId: this.programId,
        keys: [
          { pubkey: this.currentGamePDA, isSigner: false, isWritable: true },
          { pubkey: this.platformStatePDA, isSigner: false, isWritable: true },
          { pubkey: winnerPubkey, isSigner: false, isWritable: true },
          { pubkey: adminPubkey, isSigner: false, isWritable: true },
          { pubkey: this.provider.publicKey, isSigner: true, isWritable: false },
        ],
        data: Buffer.concat([
          Buffer.from([105, 69, 184, 5, 143, 182, 92, 132]), // complete_game discriminator
          winnerPubkey.toBuffer()
        ])
      });

      const transaction = new solanaWeb3.Transaction().add(instruction);

      // Send transaction
      const result = await walletManager.signAndSendTransaction(transaction);

      if (result.success) {
        console.log('✅ Game completed! Winner paid.');
        console.log('   Transaction:', result.signature);
        
        // Mark as completed
        this.gameCompleted = true;
        
        // Reset game state
        const completedGameId = this.currentGameId;
        this.currentGameId = null;
        this.currentGamePDA = null;
        
        return {
          success: true,
          gameId: completedGameId,
          winner: winnerPublicKey,
          signature: result.signature
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to complete game:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel game (only if player 2 hasn't joined)
   * @returns {Object} - Transaction result
   */
  async cancelGame() {
    if (!this.initialized || !this.currentGamePDA || !this.currentGameId) {
      throw new Error('No active game');
    }

    try {
      console.log('❌ Cancelling game...');
      console.log('   Game ID:', this.currentGameId);

      const instruction = new solanaWeb3.TransactionInstruction({
        programId: this.programId,
        keys: [
          { pubkey: this.currentGamePDA, isSigner: false, isWritable: true },
          { pubkey: this.provider.publicKey, isSigner: true, isWritable: true },
        ],
        data: Buffer.from([121, 194, 154, 118, 103, 235, 149, 52]) // cancel_game discriminator
      });

      const transaction = new solanaWeb3.Transaction().add(instruction);

      // Send transaction
      const result = await walletManager.signAndSendTransaction(transaction);

      if (result.success) {
        console.log('✅ Game cancelled and refunded');
        console.log('   Transaction:', result.signature);
        
        this.currentGameId = null;
        this.currentGamePDA = null;
        
        return {
          success: true,
          signature: result.signature
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to cancel game:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get game info
   */
  getGameInfo() {
    return {
      gameId: this.currentGameId,
      gamePDA: this.currentGamePDA ? this.currentGamePDA.toString() : null,
      stakeAmount: this.stakeAmount
    };
  }

  /**
   * Check if game exists on blockchain
   */
  async gameExists(gameId) {
    try {
      const gamePDA = await this.getGamePDA(gameId);
      const account = await this.connection.getAccountInfo(gamePDA);
      return account !== null;
    } catch (error) {
      return false;
    }
  }
}

// Create global blockchain instance
const blockchainManager = new BlockchainManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlockchainManager, blockchainManager };
}
