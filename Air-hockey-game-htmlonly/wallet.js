/**
 * Phantom Wallet Integration Module
 * Handles wallet connection, balance checking, and transaction signing
 */

class WalletManager {
  constructor() {
    this.provider = null;
    this.publicKey = null;
    this.connected = false;
    this.connection = null;
    this.balance = 0;
    this.network = 'devnet'; // 'devnet' or 'mainnet-beta'
    this.GAS_FEE_BUFFER = 0.01; // Reserve 0.01 SOL for gas fees
    this.connectionTimeout = 30000; // 30 seconds
  }

  /**
   * Initialize Solana connection
   */
  initConnection() {
    const endpoint = this.network === 'devnet' 
      ? 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
    
    this.connection = new solanaWeb3.Connection(endpoint, 'confirmed');
    console.log(`✅ Connected to Solana ${this.network}`);
  }

  /**
   * Check if Phantom wallet is installed
   */
  isPhantomInstalled() {
    return window.solana && window.solana.isPhantom;
  }

  /**
   * Connect to Phantom wallet
   */
  async connect() {
    try {
      if (!this.isPhantomInstalled()) {
        throw new Error('Phantom wallet is not installed! Please install it from https://phantom.app/');
      }

      // Initialize connection if not already done
      if (!this.connection) {
        this.initConnection();
      }

      // Request connection to Phantom with timeout
      const response = await this.withTimeout(
        window.solana.connect(),
        this.connectionTimeout,
        'Wallet connection timeout. Please try again.'
      );
      this.provider = window.solana;
      this.publicKey = response.publicKey;
      this.connected = true;

      // Get initial balance
      await this.updateBalance();

      console.log('✅ Wallet connected:', this.publicKey.toString());
      
      // Listen for account changes
      this.provider.on('accountChanged', (publicKey) => {
        if (publicKey) {
          this.publicKey = publicKey;
          this.updateBalance();
          console.log('🔄 Account changed:', publicKey.toString());
        } else {
          this.disconnect();
        }
      });

      // Listen for disconnection
      this.provider.on('disconnect', () => {
        console.log('⚠️ Wallet disconnected');
        this.disconnect();
        
        // Emit custom event for game cleanup
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('walletDisconnected'));
        }
      });

      return {
        success: true,
        publicKey: this.publicKey.toString(),
        balance: this.balance
      };

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    if (this.provider) {
      try {
        await this.provider.disconnect();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
    
    this.provider = null;
    this.publicKey = null;
    this.connected = false;
    this.balance = 0;
    
    console.log('👋 Wallet disconnected');
  }

  /**
   * Get current wallet balance in SOL
   */
  async updateBalance() {
    if (!this.publicKey || !this.connection) {
      return 0;
    }

    try {
      const lamports = await this.connection.getBalance(this.publicKey);
      this.balance = lamports / solanaWeb3.LAMPORTS_PER_SOL;
      return this.balance;
    } catch (error) {
      console.error('❌ Failed to fetch balance:', error);
      return 0;
    }
  }

  /**
   * Get formatted balance
   */
  getFormattedBalance() {
    return this.balance.toFixed(4) + ' SOL';
  }

  /**
   * Get short wallet address (first 4 and last 4 characters)
   */
  getShortAddress() {
    if (!this.publicKey) return '';
    const addr = this.publicKey.toString();
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }

  /**
   * Check if wallet has sufficient balance (including gas fees)
   */
  hasSufficientBalance(requiredSOL) {
    return this.balance >= (requiredSOL + this.GAS_FEE_BUFFER);
  }

  /**
   * Get estimated total cost including gas
   */
  getTotalCost(requiredSOL) {
    return requiredSOL + this.GAS_FEE_BUFFER;
  }

  /**
   * Sign and send transaction
   */
  async signAndSendTransaction(transaction) {
    if (!this.connected || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      // Sign transaction with Phantom
      const signed = await this.provider.signTransaction(transaction);

      // Send transaction
      const signature = await this.connection.sendRawTransaction(signed.serialize());

      console.log('📤 Transaction sent:', signature);

      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }

      console.log('✅ Transaction confirmed:', signature);

      // Update balance after transaction
      await this.updateBalance();

      return {
        success: true,
        signature: signature
      };

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Switch network (devnet/mainnet)
   */
  switchNetwork(network) {
    if (network !== 'devnet' && network !== 'mainnet-beta') {
      console.error('Invalid network. Use "devnet" or "mainnet-beta"');
      return;
    }
    
    this.network = network;
    this.initConnection();
    
    if (this.connected) {
      this.updateBalance();
    }
  }

  /**
   * Get wallet address (public key as string)
   */
  getWalletAddress() {
    return this.publicKey ? this.publicKey.toString() : null;
  }

  /**
   * Get wallet info
   */
  getWalletInfo() {
    return {
      connected: this.connected,
      publicKey: this.publicKey ? this.publicKey.toString() : null,
      shortAddress: this.getShortAddress(),
      balance: this.balance,
      formattedBalance: this.getFormattedBalance(),
      network: this.network
    };
  }

  /**
   * Timeout wrapper for promises
   */
  withTimeout(promise, timeoutMs, errorMessage) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      )
    ]);
  }

  /**
   * Request airdrop (devnet only)
   */
  async requestAirdrop(amount = 1) {
    if (this.network !== 'devnet') {
      throw new Error('Airdrops only available on devnet');
    }

    if (!this.publicKey || !this.connection) {
      throw new Error('Wallet not connected');
    }

    // Validate amount
    if (amount <= 0 || amount > 5) {
      throw new Error('Airdrop amount must be between 0 and 5 SOL');
    }

    try {
      const signature = await this.connection.requestAirdrop(
        this.publicKey,
        amount * solanaWeb3.LAMPORTS_PER_SOL
      );

      await this.connection.confirmTransaction(signature);
      await this.updateBalance();

      console.log(`✅ Airdrop successful: ${amount} SOL`);
      return { success: true, amount: amount };
    } catch (error) {
      console.error('❌ Airdrop failed:', error);
      
      // Parse error message
      let errorMsg = error.message || error.toString();
      
      if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('airdrop limit')) {
        throw new Error('RATE_LIMIT');
      } else if (errorMsg.includes('airdrop faucet has run dry')) {
        throw new Error('FAUCET_EMPTY');
      } else {
        throw new Error('AIRDROP_FAILED: ' + errorMsg);
      }
    }
  }
}

// Create global wallet instance
const walletManager = new WalletManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WalletManager, walletManager };
}
