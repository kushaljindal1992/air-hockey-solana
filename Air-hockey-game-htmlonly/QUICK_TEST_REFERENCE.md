# 🚀 Quick Test Commands

## Installation (One Time)
```bash
cd Air-hockey-game-htmlonly
npm install --save-dev jest @solana/web3.js jest-environment-jsdom
```

## Run Tests

### All Tests
```bash
npm test
```

### Specific Suites
```bash
npm run test:wallet          # Wallet edge cases
npm run test:blockchain      # Blockchain transactions
npm run test:multiplayer     # Multiplayer sync
```

### Coverage
```bash
npm run test:coverage        # Generate coverage report
```

### Watch Mode
```bash
npm run test:watch           # Auto-rerun on changes
```

---

## 🎯 Critical Manual Tests

### Test 1: Zero Balance
```javascript
// Wallet with 0 SOL → Try to create game
// ✅ EXPECT: Error "Insufficient balance"
```

### Test 2: Double Completion
```javascript
// In console after game completes:
blockchainManager.completeGame('winner')
// ✅ EXPECT: Error "already been completed"
```

### Test 3: Guest Ball Updates
```javascript
// As Player 2, in console:
socket.emit('ballUpdate', {x:100, y:100})
// ✅ EXPECT: Server rejects with warning
```

### Test 4: Wallet Disconnect
```javascript
// During game, disconnect wallet in Phantom
// ✅ EXPECT: Alert + graceful exit
```

---

## 📊 Expected Output

```
Test Suites: 3 passed, 3 total
Tests:       53 passed, 53 total
Time:        2.5s

Coverage:
  wallet.js:     85.2%
  blockchain.js: 82.5%
  All files:     75.5% ✅
```

---

## 🐛 If Tests Fail

1. Check error message in terminal
2. Review TEST_CASES_EDGE_CASES.md
3. Fix the code
4. Re-run: `npm test`

---

## 📚 Full Documentation

- `TEST_CASES_EDGE_CASES.md` - All 70+ edge cases
- `HOW_TO_TEST.md` - Detailed testing guide
- `IMPLEMENTATION_SUMMARY.md` - What was fixed

---

## ✅ Pre-Deploy Checklist

```
☐ npm test (all pass)
☐ npm run test:coverage (>70%)
☐ Manual test: Zero balance
☐ Manual test: Double completion
☐ Manual test: Guest ball reject
☐ Full game flow test
☐ No console errors
```

---

**Quick Tip:** Run `npm test` before every commit! 🎮
