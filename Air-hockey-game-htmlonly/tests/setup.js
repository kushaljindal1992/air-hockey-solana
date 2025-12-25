/**
 * Test Setup Configuration
 * Initializes test environment and mocks
 */

// Mock window.solana (Phantom wallet)
global.window = {
  solana: {
    isPhantom: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
    on: jest.fn(),
    publicKey: null
  },
  dispatchEvent: jest.fn(),
  addEventListener: jest.fn(),
  CustomEvent: class CustomEvent {
    constructor(name, params) {
      this.name = name;
      this.detail = params?.detail;
    }
  }
};

// Mock Solana Web3
global.solanaWeb3 = {
  Connection: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue(1000000000), // 1 SOL
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: 'mock-blockhash'
    }),
    sendRawTransaction: jest.fn().mockResolvedValue('mock-signature'),
    confirmTransaction: jest.fn().mockResolvedValue({
      value: { err: null }
    }),
    getAccountInfo: jest.fn().mockResolvedValue({
      data: Buffer.from('mock-account-data')
    }),
    requestAirdrop: jest.fn().mockResolvedValue('mock-airdrop-signature')
  })),
  PublicKey: jest.fn().mockImplementation((key) => ({
    toString: () => key,
    toBuffer: () => Buffer.from(key)
  })),
  Transaction: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockReturnThis(),
    serialize: jest.fn().mockReturnValue(Buffer.from('serialized'))
  })),
  TransactionInstruction: jest.fn(),
  SystemProgram: {
    programId: 'system-program-id'
  },
  LAMPORTS_PER_SOL: 1000000000
};

// Mock BN (Big Number)
global.BN = class BN {
  constructor(value) {
    this.value = value;
  }
  toArrayLike(type, endian, length) {
    return Buffer.alloc(length);
  }
};

// Mock Buffer if not available
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Mock console methods to reduce test noise (optional)
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Helper to reset all mocks
global.resetAllMocks = () => {
  jest.clearAllMocks();
};

// Helper to wait for async operations
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Date.now for predictable timestamps
const mockNow = 1700000000000;
global.Date.now = jest.fn(() => mockNow);

console.log('✅ Test environment initialized');
