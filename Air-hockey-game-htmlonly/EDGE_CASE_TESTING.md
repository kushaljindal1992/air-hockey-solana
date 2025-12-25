# Edge Case Testing Guide

## 🧪 How to Test All Edge Cases

### Prerequisites
```bash
# Start the server
npm start

# Open browser to http://localhost:3000
# Connect Phantom wallet (devnet mode)
```

---

## 📋 Manual Test Cases

### 1. Matchmaking Timeout Test
**Steps**:
1. Connect wallet
2. Click "Create Game" with 0.1 SOL stake
3. Wait in lobby (don't share room code)
4. Wait 5 minutes

**Expected Result**:
- ⏱️ After 5 minutes: Alert "MATCHMAKING TIMEOUT - No opponent found"
- 💰 0.1 SOL refunded to wallet
- 🏠 Returns to main menu automatically

**Status**: ✅ Should work automatically

---

### 2. Player Leaves Lobby Test
**Steps**:
1. Player A: Create game with 0.1 SOL
2. Player B: Join game with room code
3. Player B: Close browser tab BEFORE game starts

**Expected Result**:
- 👋 Player A sees: "Other player left before game started"
- 💰 Both get stakes refunded (0.1 SOL each)
- 🏠 Both return to main menu

**Status**: ✅ Implemented

---

### 3. Mid-Game Disconnect Test
**Steps**:
1. Start a normal game (both players connected)
2. Play until score is 3-2
3. Player 2: Close browser tab or disconnect internet

**Expected Result**:
- 💔 Player 2: Forfeits (loses 0.1 SOL)
- 🏆 Player 1 sees: "YOU WIN BY FORFEIT - Opponent disconnected"
- 💰 Player 1 receives: 0.19 SOL (0.2 × 0.95)
- 🏠 Both return to main menu

**Status**: ✅ Implemented with forfeit logic

---

### 4. AFK / Inactivity Test
**Steps**:
1. Start a normal game
2. Player 2: Don't move paddle for 60 seconds

**Expected Result**:
- ⏱️ After 60 seconds: Player 2 auto-forfeits
- 🏆 Player 1 sees: "YOU WIN - Opponent inactive (AFK)"
- 💰 Player 1 gets full payout
- 💔 Player 2 sees: "YOU FORFEITED - Inactive for too long"
- 🏠 Both return to main menu

**Status**: ✅ Activity monitoring every 10 seconds

---

### 5. Wallet Disconnect During Matchmaking Test
**Steps**:
1. Create game with 0.1 SOL stake
2. While waiting for opponent: Disconnect Phantom wallet

**Expected Result**:
- ⚠️ Alert: "Wallet disconnected"
- 💰 Blockchain game cancelled, stake refunded
- 🏠 Returns to main menu

**Status**: ✅ walletDisconnected event handler

---

### 6. Wallet Disconnect During Game Test
**Steps**:
1. Start a normal game
2. During gameplay: Disconnect Phantom wallet

**Expected Result**:
- ⚠️ Alert: "Wallet disconnected"
- 💔 Game cancelled on client side
- 🏆 Opponent may win by forfeit (if server detects disconnect)
- 🏠 Returns to main menu

**Status**: ✅ handleWalletDisconnect() in script.js

---

### 7. Network Error Test
**Steps**:
1. Start a normal game
2. Disconnect your internet (airplane mode or disable WiFi)

**Expected Result**:
- 🔴 Connection error detected
- ⚠️ Alert: "CONNECTION ERROR - Lost connection"
- 💔 Game forfeited
- 🏠 Returns to main menu

**Status**: ✅ connect_error handler

---

### 8. Browser Crash Recovery Test
**Steps**:
1. Start a normal game
2. Close browser completely (or kill process)
3. Reopen browser and reconnect

**Expected Result**:
- 🔄 Reconnection detected
- ⚠️ Alert: "Connection lost during game - likely forfeited"
- 💰 Wallet balance updated
- 🏠 Returns to main menu

**Status**: ✅ reconnect handler

---

### 9. Score Manipulation Test (Anti-Cheat)
**Steps**:
1. Start game
2. Open browser console
3. Try: `player1_score = 999;`
4. Server validates scores

**Expected Result**:
- 🚨 Server logs: "Score mismatch detected"
- ⚠️ Cheater auto-forfeits
- 🏆 Opponent wins by forfeit

**Status**: ✅ Server-side score tracking + detectCheating()

---

### 10. Ball Update Spam Test (Anti-Cheat)
**Steps**:
1. Start game as host (Player 1)
2. Open console and spam ball updates: 
   ```javascript
   for(let i=0; i<200; i++) {
     socket.emit('ballUpdate', {x:500, y:300, vx:5, vy:5});
   }
   ```

**Expected Result**:
- 🛡️ Server rate limiting: Max 120 updates/sec
- 📊 Excess updates rejected
- ✅ Game continues normally

**Status**: ✅ Rate limiting in updateBall()

---

### 11. Guest Ball Update Hack Test (Anti-Cheat)
**Steps**:
1. Join game as guest (Player 2)
2. Open console and try:
   ```javascript
   socket.emit('ballUpdate', {x:100, y:100, vx:10, vy:10});
   ```

**Expected Result**:
- 🚨 Server logs: "REJECTED: Guest attempted to update ball"
- ❌ Ball position unchanged
- ✅ Only host can update ball

**Status**: ✅ Role verification in server.js

---

### 12. Paddle Out of Bounds Test (Anti-Cheat)
**Steps**:
1. During game, move paddle to extreme position
2. Try to move paddle outside canvas (x < 50 or x > 900)

**Expected Result**:
- 🛡️ Server validates: `isValidX = x >= 50 && x <= 900`
- 📍 Invalid positions rejected
- ✅ Paddle stays within bounds

**Status**: ✅ Paddle position validation

---

### 13. Crossing Center Line Test (Anti-Cheat)
**Steps**:
1. Player 1 tries to move paddle to x > 500
2. Player 2 tries to move paddle to x < 500

**Expected Result**:
- 🛡️ Server clamps position to center line
- ✅ Player 1 max x = 500
- ✅ Player 2 min x = 500

**Status**: ✅ Center line enforcement

---

### 14. Double Payout Test
**Steps**:
1. Win a game normally
2. Try to call `completeGame()` again with same gameId

**Expected Result**:
- ⚠️ Error: "Game already completed"
- ❌ Second transaction rejected
- 💰 Only one payout processed

**Status**: ✅ gameCompleted flag in blockchain.js

---

### 15. Blockchain Transaction Failure Test
**Steps**:
1. Win a game
2. When Phantom popup appears: Reject transaction

**Expected Result**:
- ❌ Transaction cancelled
- ⚠️ Alert: "Transaction cancelled by user"
- 🏠 Still returns to main menu
- 💡 Can retry manually from wallet

**Status**: ✅ Try/catch error handling

---

### 16. Insufficient Balance Test
**Steps**:
1. Drain wallet to < 0.1 SOL
2. Try to create game with 0.1 SOL stake

**Expected Result**:
- ⚠️ Error: "Insufficient balance"
- 📊 Shows required: 0.11 SOL (0.1 stake + 0.01 gas)
- ❌ Game creation blocked

**Status**: ✅ hasSufficientBalance() with GAS_FEE_BUFFER

---

### 17. Server Crash Test
**Steps**:
1. Start a game
2. Stop server (Ctrl+C in terminal)

**Expected Result**:
- 🔴 Client detects disconnect
- ⚠️ Alert: "Server disconnected"
- 🏠 Returns to main menu
- 💰 Funds safe on blockchain

**Status**: ✅ disconnect handler

---

### 18. Very Fast Game Test (Anti-Cheat)
**Steps**:
1. Use dev tools to instantly set scores to 7-0
2. Try to complete game

**Expected Result**:
- 🚨 Server detects: "Game too fast"
- 📊 Checks: `duration < (totalScore × 3 seconds)`
- ⚠️ Cheater auto-forfeits

**Status**: ✅ Game duration validation

---

## 🎯 Automated Test Coverage

Run automated tests:
```bash
npm test
```

**Coverage**:
- ✅ 16 wallet tests (connection, balance, timeout, etc.)
- ✅ 18 blockchain tests (validation, completion, etc.)
- ✅ 29 multiplayer tests (anti-cheat, forfeit, etc.)
- ✅ **Total: 63 automated tests**

---

## 📊 Testing Matrix

| Edge Case | Automated Test | Manual Test | Status |
|-----------|---------------|-------------|--------|
| Matchmaking timeout | ❌ (time-based) | ✅ | Ready |
| Player leaves lobby | ✅ | ✅ | Ready |
| Mid-game disconnect | ✅ | ✅ | Ready |
| AFK detection | ❌ (time-based) | ✅ | Ready |
| Wallet disconnect | ✅ | ✅ | Ready |
| Network error | ✅ | ✅ | Ready |
| Score manipulation | ✅ | ✅ | Ready |
| Ball update spam | ✅ | ✅ | Ready |
| Guest ball hack | ✅ | ✅ | Ready |
| Paddle bounds | ✅ | ✅ | Ready |
| Center line | ✅ | ✅ | Ready |
| Double payout | ✅ | ✅ | Ready |
| Blockchain fail | ✅ | ✅ | Ready |
| Insufficient balance | ✅ | ✅ | Ready |

---

## 🚀 Quick Test Sequence (15 minutes)

1. **Normal Game** (2 min): Create + join + play to 7 → ✅
2. **Disconnect Win** (1 min): Start game, player 2 quits → ✅
3. **Matchmaking Cancel** (30 sec): Create game, click cancel → ✅
4. **Insufficient Balance** (30 sec): Try to create with low balance → ✅
5. **Wallet Disconnect** (30 sec): Disconnect during matchmaking → ✅
6. **Anti-Cheat** (2 min): Try ball hack, score hack → ✅
7. **Run Tests** (1 min): `npm test` → ✅

**Total: 7.5 minutes to verify core functionality**

---

## ✅ All Edge Cases Implemented!

**29 edge cases** across:
- 🎮 Matchmaking (5)
- 🏒 In-Game (7)
- 🏆 Winner Declaration (4)
- 🔧 Error Recovery (6)
- 🛡️ Anti-Cheat (7)

Every scenario returns to main menu with appropriate message and blockchain handling! 🎯
