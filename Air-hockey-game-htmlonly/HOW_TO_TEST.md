# Air Hockey Game - How to Run Tests

## Overview
This guide explains how to run automated tests and perform manual testing for all edge cases.

---

## 🚀 Quick Start

### 1. Install Test Dependencies
```bash
cd Air-hockey-game-htmlonly

# Install Jest and testing tools
npm install --save-dev jest @solana/web3.js jest-environment-jsdom
```

### 2. Run All Tests
```bash
npm test
```

### 3. Run Specific Test Suites
```bash
# Wallet edge case tests
npm run test:wallet

# Blockchain transaction tests  
npm run test:blockchain

# Multiplayer synchronization tests
npm run test:multiplayer

# Watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 📋 Test Coverage

### ✅ Automated Tests Implemented

**Wallet Tests** (`tests/wallet.test.js` - 15 tests)
- WC-001: Phantom wallet installation detection
- WC-002: Multiple wallet extension handling
- WC-003: Connection rejection handling
- WC-006: Zero balance prevention
- WC-007: Insufficient balance + gas fees check
- AD-001: Mainnet airdrop rejection
- AD-004: Invalid airdrop amounts

**Blockchain Tests** (`tests/blockchain.test.js` - 18 tests)
- BC-001: Negative/invalid stake amounts
- BC-002: Excessive stake amounts (>1000 SOL)
- BC-003: Game ID uniqueness
- BC-006: Insufficient balance validation
- BC-011: Invalid winner address
- BC-012: Double completion prevention

**Multiplayer Tests** (`tests/multiplayer.test.js` - 20+ tests)
- MP-009: Ball update rate limiting (anti-spam)
- MP-010: Paddle position validation
- MP-011: Ball update authorization (host only)
- MP-015: Server-side score verification
- GL-007: Center line crossing prevention

**Total:** 53+ automated test cases

---

## 🧪 Manual Testing Guide

### Critical Tests to Perform Manually

#### Test 1: Zero Balance Prevention (WC-006)
```
1. Create wallet with 0 SOL
2. Connect to game
3. Try to create 0.1 SOL game
4. ✅ EXPECT: Error "Insufficient balance"
5. ✅ EXPECT: No blockchain transaction sent
```

#### Test 2: Gas Fee Buffer (WC-007)
```
1. Wallet has exactly 0.1 SOL
2. Try to create 0.1 SOL game
3. ✅ EXPECT: Rejected (needs 0.11 SOL total)
4. ✅ EXPECT: Error mentions gas fees
```

#### Test 3: Double Completion (BC-012)
```
1. Complete a game normally
2. Open console, run: blockchainManager.completeGame('address')
3. ✅ EXPECT: Error "already been completed"
```

#### Test 4: Guest Ball Updates (MP-011)
```
1. Join as Player 2 (guest)
2. Open console
3. Run: socket.emit('ballUpdate', {x:100, y:100})
4. ✅ EXPECT: Server rejects update
5. ✅ EXPECT: Server log "REJECTED: Guest attempted"
```

#### Test 5: Wallet Disconnect (WC-011)
```
1. Start multiplayer game
2. Disconnect wallet in Phantom
3. ✅ EXPECT: Alert "Wallet disconnected"
4. ✅ EXPECT: Game exits gracefully
```

---

## 📊 Running Tests - Step by Step

### Initial Setup (One Time)

```powershell
# Navigate to game directory
cd \\wsl.localhost\Ubuntu\home\pratham\escrow-fee\Air-hockey-game-htmlonly

# Install dependencies
npm install --save-dev jest @solana/web3.js jest-environment-jsdom

# Verify installation
npm test -- --version
```

### Run Tests

```powershell
# Run all tests
npm test

# Run with detailed output
npm test -- --verbose

# Run specific test file
npm test tests/wallet.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Balance"

# Generate HTML coverage report
npm run test:coverage
# Opens coverage report in: coverage/lcov-report/index.html
```

### Watch Mode (Development)

```powershell
# Auto-rerun tests on file changes
npm run test:watch

# In watch mode, press:
# • a - Run all tests
# • f - Run only failed tests
# • p - Filter by filename pattern
# • t - Filter by test name pattern
# • q - Quit watch mode
```

---

## 🔍 Understanding Test Results

### Successful Test Run
```
PASS  tests/wallet.test.js
  ✓ WC-001: Phantom wallet detection (5ms)
  ✓ WC-006: Zero balance prevention (3ms)
  ✓ WC-007: Gas fee buffer (2ms)

Test Suites: 3 passed, 3 total
Tests:       53 passed, 53 total
Time:        2.5s
```

### Failed Test
```
FAIL  tests/blockchain.test.js
  ✕ BC-012: Double completion prevention (10ms)

  ● BC-012: Double completion prevention
  
    Expected: { success: false, error: 'already completed' }
    Received: { success: true }
    
    at Object.<anonymous> (tests/blockchain.test.js:145:7)
```

**What to do:** Fix the issue in blockchain.js, then re-run tests

---

## 🎯 Test Execution Checklist

### Before Every Deploy

```
☐ Run npm test (all pass)
☐ Run npm run test:coverage (>70% coverage)
☐ Manual test: WC-006 (zero balance)
☐ Manual test: BC-012 (double completion)
☐ Manual test: MP-011 (guest ball reject)
☐ Full game flow test (wallet → game → payout)
☐ Test with 2 browsers (multiplayer)
☐ No console errors
```

---

## 🐛 Debugging Failed Tests

### Common Issues & Solutions

**Issue:** "Cannot find module 'jest'"
```powershell
# Solution: Install jest
npm install --save-dev jest
```

**Issue:** "ReferenceError: window is not defined"
```powershell
# Solution: Ensure jest config has testEnvironment: "jsdom"
# Check package.test.json
```

**Issue:** "Timeout - Async callback not invoked"
```powershell
# Solution: Increase timeout in test file
jest.setTimeout(10000); // 10 seconds
```

**Issue:** Tests pass but code doesn't work
```powershell
# Solution: Run manual tests
# Automated tests may have mocks that differ from reality
```

---

## 📈 Coverage Report

After running `npm run test:coverage`, check:

```
File              | % Stmts | % Branch | % Funcs | % Lines
------------------|---------|----------|---------|--------
wallet.js         |   85.2  |   78.5   |   90.0  |   85.0
blockchain.js     |   82.5  |   75.0   |   88.0  |   82.0
script.js         |   65.0  |   60.0   |   70.0  |   65.0
All files         |   75.5  |   70.0   |   80.0  |   75.0
```

**Goal:** All files > 70% coverage

---

## 🔄 Continuous Integration (CI)

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd Air-hockey-game-htmlonly
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

---

## 📝 Test Results Template

### Record Your Test Results

```markdown
## Test Execution - [Date]

### Automated Tests
- ✅ All wallet tests passed (15/15)
- ✅ All blockchain tests passed (18/18)
- ⚠️ Multiplayer tests: 19/20 passed
  - ❌ Failed: MP-009 rate limiting
  - Fix: Increase rate limit threshold

### Manual Tests
- ✅ WC-006: Zero balance blocked
- ✅ BC-012: Double completion prevented
- ✅ MP-011: Guest ball updates rejected
- ✅ WC-011: Wallet disconnect handled

### Coverage
- Overall: 75.5%
- wallet.js: 85.2%
- blockchain.js: 82.5%
- script.js: 65.0% (needs improvement)

### Issues Found
1. None - all tests passing

### Recommendation
✅ READY FOR DEPLOYMENT
```

---

## 🎓 Test Examples

### Example 1: Running Wallet Tests

```powershell
PS> npm run test:wallet

> air-hockey-tests@1.0.0 test:wallet
> jest tests/wallet.test.js

 PASS  tests/wallet.test.js
  Wallet Edge Cases
    WC-001: Phantom Wallet Installation
      ✓ should throw error when Phantom is not installed (2ms)
      ✓ should detect Phantom when installed (1ms)
    WC-007: Insufficient Balance with Gas Fees
      ✓ should account for gas fees in balance check (2ms)
      ✓ should pass when balance covers stake + gas (1ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        1.234s
```

### Example 2: Manual Test in Browser Console

```javascript
// Test: BC-003 - Game ID Uniqueness
const id1 = blockchainManager.generateGameId();
console.log('Game ID 1:', id1);

const id2 = blockchainManager.generateGameId();
console.log('Game ID 2:', id2);

console.log('IDs are unique:', id1 !== id2);
// Expected: true

console.log('IDs are large numbers:', id1 > 1000000000000);
// Expected: true
```

---

## 🚦 Pass/Fail Criteria

### ✅ PASS Criteria
- All automated tests pass (100%)
- Code coverage > 70%
- All critical manual tests pass
- No console errors during gameplay
- Full game flow works end-to-end

### ❌ FAIL Criteria (Do NOT deploy)
- Any automated test fails
- Coverage < 70%
- Critical manual tests fail
- Errors in console during normal gameplay
- Blockchain transactions don't complete

---

## 📞 Support

If tests fail or you need help:

1. Check error messages carefully
2. Review TEST_CASES_EDGE_CASES.md for detailed scenarios
3. Verify all dependencies installed correctly
4. Check Node.js version (should be 16+)
5. Try clearing node_modules and reinstalling:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   npm test
   ```

---

**Remember:** Tests are your safety net. Don't skip them! 🎮✨
