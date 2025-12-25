# 🧪 Testing Guide - Web3 Air Hockey

## Quick Start

### 1. Install Dependencies
```bash
cd Air-hockey-game-htmlonly
npm install
```

### 2. Start Server
```bash
npm start
```
Server will run on `http://localhost:3000`

### 3. Setup Phantom Wallets

You need **2 Phantom wallet accounts** for testing:

#### Account 1 (Player 1):
1. Open Phantom browser extension
2. Switch to Devnet (Settings → Developer Settings → Testnet Mode → Devnet)
3. Get free SOL: https://faucet.solana.com/
4. Copy your wallet address

#### Account 2 (Player 2):
1. Create a second Phantom account (or use another browser/device)
2. Switch to Devnet
3. Get free SOL from faucet
4. Copy wallet address

---

## 🎮 Test Flow

### Window 1 (Player 1 - Host)

1. **Open Browser 1**
   ```
   http://localhost:3000
   ```

2. **Connect Wallet**
   - Click "Connect Phantom Wallet"
   - Approve connection
   - Verify balance shows (should have ~2 SOL from faucet)

3. **Create Game**
   - Enter player name (e.g., "Alice")
   - Click "🔒 Private Room"
   - Select stake amount: **0.1 SOL**
   - Click "Confirm & Create Game"
   - Approve transaction in Phantom
   - Wait for confirmation (5-10 seconds)

4. **Get Room Code**
   - Room code will appear (e.g., "A7K9M2")
   - Copy the room code

5. **Share Room Code**
   - Send room code to Player 2
   - Wait for Player 2 to join

6. **Play Game**
   - Move paddle with mouse
   - First to 7 wins
   - Try to score!

7. **Win & Get Payout**
   - If you win, payout happens automatically
   - Check transaction in modal
   - Check your balance (should increase by ~0.19 SOL)

---

### Window 2 (Player 2 - Guest)

1. **Open Browser 2** (different profile or device)
   ```
   http://localhost:3000
   ```

2. **Connect Wallet**
   - Use different Phantom account
   - Click "Connect Phantom Wallet"
   - Verify balance

3. **Join Game**
   - Enter player name (e.g., "Bob")
   - Paste room code from Player 1
   - Click "🎮 Join Game"
   - Verify stake amount (0.1 SOL)
   - Click "Confirm & Create Game"
   - Approve transaction in Phantom
   - Wait for confirmation

4. **Play Game**
   - Game starts automatically
   - Move paddle with mouse
   - Compete to win!

5. **If You Win**
   - Payout happens automatically
   - Check balance increase

---

## ✅ What to Verify

### Before Game:
- [ ] Both wallets connected to devnet
- [ ] Both have sufficient balance (>0.11 SOL each)
- [ ] Wallet addresses display correctly
- [ ] Balance shows in UI

### During Game Creation:
- [ ] Betting modal appears
- [ ] Stake options work (0.05, 0.1, 0.25, 0.5)
- [ ] Bet summary calculates correctly
  - Stake: 0.1 SOL
  - Total Pool: 0.2 SOL
  - Winner Gets: 0.19 SOL (95%)
  - Platform Fee: 0.01 SOL (5%)
- [ ] Transaction modal appears
- [ ] Phantom asks for approval
- [ ] Transaction succeeds
- [ ] Room code appears
- [ ] Explorer link works

### During Game Join:
- [ ] Room code validation works
- [ ] Stake amount matches host
- [ ] Transaction approved in Phantom
- [ ] Both players see "Game Start"

### During Gameplay:
- [ ] Paddles move smoothly
- [ ] Ball physics work
- [ ] Score updates for both players
- [ ] Sound effects play

### After Game Ends:
- [ ] Winner detected correctly
- [ ] Payout transaction triggers automatically
- [ ] Winner receives ~0.19 SOL (0.2 × 0.95)
- [ ] Platform fee deducted (0.01 SOL)
- [ ] Balance updates in UI
- [ ] Transaction visible in Solana Explorer

---

## 🔍 Debugging

### Check Browser Console
```javascript
// Open DevTools (F12)
// Look for these logs:

"✅ Wallet connected successfully"
"✅ Blockchain initialized"
"🎮 Creating game..."
"✅ Game created successfully!"
"🏆 Game completed!"
"✅ Payout successful!"
```

### Check Server Console
```bash
# Look for these logs:

"Room created: A7K9M2"
"  Game ID: 1732531200000, Stake: 0.1 SOL"
"Alice (socket123) joined room A7K9M2"
"🏆 Game A7K9M2 completed! Winner: Player 1"
"   Game ID: 1732531200000"
```

### Check Solana Explorer
1. Copy transaction signature from modal
2. Visit: https://explorer.solana.com/?cluster=devnet
3. Paste signature in search
4. Verify:
   - Transaction succeeded
   - SOL transferred correctly
   - Platform fee deducted

### Common Issues

**Issue: "Wallet not detected"**
- Install Phantom: https://phantom.app/
- Refresh page after installing

**Issue: "Insufficient balance"**
- Get more SOL: https://faucet.solana.com/
- Wait 30 seconds between requests

**Issue: "Transaction failed"**
- Check you're on devnet (not mainnet!)
- Verify program is deployed
- Check balance > stake + 0.01 (for fees)

**Issue: "Room not found"**
- Room code expires after 30 mins
- Check spelling (case-sensitive)
- Create new room

**Issue: "Payout not happening"**
- Check browser console for errors
- Verify game ID matches
- Check winner wallet is connected
- Try manual payout (future feature)

---

## 📊 Expected Results

### Successful Test:
```
Player 1 Balance Before: 2.0000 SOL
Player 2 Balance Before: 2.0000 SOL

After Creating Game (P1): 1.9000 SOL (-0.1 stake)
After Joining Game (P2): 1.9000 SOL (-0.1 stake)

After P1 Wins:
  P1 Balance: 2.0900 SOL (+0.19 winnings)
  P2 Balance: 1.9000 SOL (lost stake)
  Platform: +0.01 SOL (5% fee)

Total: 2.09 + 1.90 + 0.01 = 4.00 SOL ✅
```

### Blockchain Verification:
```bash
# Check game account
solana account <GAME_PDA> --url devnet

# Check transactions
# Transaction 1: Create Game (P1 stakes 0.1 SOL)
# Transaction 2: Join Game (P2 stakes 0.1 SOL)
# Transaction 3: Complete Game (Winner gets 0.19 SOL, Platform gets 0.01 SOL)
```

---

## 🎯 Success Criteria

Week 2 is complete when:
- [x] Wallet connects successfully
- [x] Balance displays correctly
- [x] Player 1 can create game with stake
- [x] Player 2 can join game with matching stake
- [x] Game plays normally
- [x] Winner is detected correctly
- [x] Payout happens automatically
- [x] Winner receives 95% of pool
- [x] Platform receives 5% fee
- [x] All transactions visible in Explorer

---

## 🚀 Next: Week 3

After confirming everything works:
- [ ] Add security verification
- [ ] Implement cheat prevention
- [ ] Add timeout/cancellation
- [ ] Improve error handling
- [ ] Add retry logic
- [ ] Deploy to mainnet (after thorough testing!)

---

## 📞 Need Help?

**Check these first:**
1. Browser console (F12) for JavaScript errors
2. Server console for backend logs
3. Solana Explorer for transaction status
4. Phantom wallet settings (ensure devnet!)

**Program ID:** `3KzkUzoaSFt7xF9sW389YFE1JTwD5Fcu3aM9sReU4jgr`
**Network:** Devnet
**Endpoint:** https://api.devnet.solana.com
