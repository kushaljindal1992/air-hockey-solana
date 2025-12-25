# 🚀 Quick Reference - Web3 Air Hockey

## 📋 Essential Information

### Program Details
- **Program ID:** `3KzkUzoaSFt7xF9sW389YFE1JTwD5Fcu3aM9sReU4jgr`
- **Network:** Solana Devnet
- **RPC Endpoint:** `https://api.devnet.solana.com`
- **Platform Fee:** 5%
- **Winner Share:** 95%

### Stake Options
- 0.05 SOL ($5)
- 0.1 SOL ($10) ← Default
- 0.25 SOL ($25)
- 0.5 SOL ($50)

---

## ⚡ Quick Start

### Run the Game
```bash
cd Air-hockey-game-htmlonly
npm install
npm start
# Open http://localhost:3000
```

### Test with 2 Players
1. **Browser 1:** Create room → Stake 0.1 SOL → Get room code
2. **Browser 2:** Join room → Match stake → Play!
3. **Winner:** Receives 0.19 SOL automatically

---

## 🎮 Game Flow

```
Player 1 (Host)                Player 2 (Guest)
─────────────                  ─────────────
Connect Wallet                 Connect Wallet
     ↓                              ↓
Create Private Room            Enter Room Code
     ↓                              ↓
Select Stake (0.1 SOL)        Confirm Stake
     ↓                              ↓
Approve TX in Phantom         Approve TX in Phantom
     ↓                              ↓
Share Room Code    ─────────→  Join Room
     ↓                              ↓
    Wait for Player 2          Game Starts!
     ↓                              ↓
         PLAY AIR HOCKEY
              ↓
      First to 7 Wins!
              ↓
  Winner Gets 0.19 SOL Automatically
  Platform Gets 0.01 SOL Fee
```

---

## 🔧 Key Files

### Frontend
- `index.html` - Main game UI + wallet elements
- `script.js` - Game logic + wallet integration
- `wallet.js` - Phantom wallet manager
- `blockchain.js` - Smart contract calls
- `styles.css` - UI styling

### Backend
- `server.js` - Multiplayer server + game tracking
- `package.json` - Dependencies

### Documentation
- `TESTING_GUIDE.md` - How to test
- `WEB3_INTEGRATION.md` - Technical details
- `WEEK2_SUMMARY.md` - What we built

---

## 🐛 Common Issues & Fixes

### "Phantom not detected"
```
→ Install Phantom: https://phantom.app/
→ Refresh page after install
```

### "Insufficient balance"
```
→ Get devnet SOL: https://faucet.solana.com/
→ Need: Stake amount + 0.01 SOL for fees
```

### "Transaction failed"
```
→ Check you're on DEVNET (not mainnet!)
→ Verify balance is sufficient
→ Try again after 30 seconds
```

### "Room not found"
```
→ Room codes are case-sensitive
→ Rooms expire after 30 minutes
→ Create a new room
```

### "Payout not happening"
```
→ Check browser console (F12)
→ Verify winner wallet is connected
→ Check game ID matches
→ Transaction may be pending
```

---

## 📊 Transaction Verification

### Check Your Transaction
1. Copy signature from transaction modal
2. Visit: https://explorer.solana.com/?cluster=devnet
3. Paste signature
4. Verify: ✅ Success

### Expected Transactions
1. **Create Game:** Player 1 stakes 0.1 SOL
2. **Join Game:** Player 2 stakes 0.1 SOL
3. **Complete Game:** Winner gets 0.19 SOL, Platform gets 0.01 SOL

---

## 💡 Pro Tips

### For Testing
- Use Chrome or Brave (best Phantom support)
- Open 2 browser profiles for 2 players
- Keep DevTools open to see logs
- Test with minimum stake (0.05 SOL) first

### For Development
- Check browser console for errors
- Check server console for game tracking
- Use Solana Explorer to verify TXs
- Monitor wallet balances

### For Debugging
```javascript
// In browser console:
walletManager.getWalletInfo()  // Check wallet status
blockchainManager.getGameInfo() // Check game state
```

---

## 📈 Status Dashboard

### ✅ Working Features
- Wallet connection (Phantom)
- Balance display
- Stake selection
- Game creation on blockchain
- Game joining on blockchain
- Multiplayer gameplay
- Winner detection
- Automatic payout
- Platform fee collection
- Transaction verification

### ⏳ Pending (Week 3)
- Security verification
- Cheat prevention
- Game timeout
- Better error handling
- Mainnet deployment

---

## 🎯 Testing Checklist

Before each test:
- [ ] Phantom installed
- [ ] Connected to devnet
- [ ] Balance > 0.11 SOL
- [ ] Server running
- [ ] 2 browser windows ready

During test:
- [ ] Both wallets connect
- [ ] Stake amounts match
- [ ] Room code works
- [ ] Game plays smoothly
- [ ] Winner detected correctly
- [ ] Payout happens automatically
- [ ] Balances update

After test:
- [ ] Check all 3 transactions in Explorer
- [ ] Verify amounts: Winner +0.19, Platform +0.01
- [ ] No console errors

---

## 🔗 Important Links

- **Devnet Faucet:** https://faucet.solana.com/
- **Solana Explorer:** https://explorer.solana.com/?cluster=devnet
- **Phantom Wallet:** https://phantom.app/
- **Program ID:** `3KzkUzoaSFt7xF9sW389YFE1JTwD5Fcu3aM9sReU4jgr`

---

## 📞 Support Commands

### Check Server Status
```bash
# Server logs show:
✅ "Loaded blockchain configuration"
✅ "Air Hockey Server running on port 3000"
✅ "Blockchain: Connected to devnet"
```

### Check Wallet Connection
```javascript
// In browser console:
console.log(walletManager.connected);    // Should be: true
console.log(walletManager.balance);      // Should show SOL amount
console.log(walletManager.publicKey);    // Should show wallet address
```

### Check Game State
```javascript
// In browser console:
console.log(blockchainManager.currentGameId);  // Should show game ID
console.log(blockchainManager.stakeAmount);    // Should show stake
```

---

## 🎉 Success Metrics

### You know it's working when:
1. ✅ Wallet connects without errors
2. ✅ Balance displays correctly
3. ✅ Transaction modal shows success
4. ✅ Room code appears and works
5. ✅ Both players can play game
6. ✅ Winner gets payout automatically
7. ✅ Solana Explorer shows all TXs
8. ✅ No console errors

### Expected Time Per Game:
- Setup (2 players): ~1-2 minutes
- Gameplay: ~2-5 minutes
- Payout: ~10 seconds
- **Total:** ~5-10 minutes

---

## 🚀 Week 2 Status

**COMPLETE** ✅

All frontend wallet integration done:
- 8 tasks completed
- 30 hours work
- $1,050 cost
- On time & on budget!

**Ready for Week 3!**

---

*Last Updated: November 25, 2025*
*Version: 1.0 (Week 2 Complete)*
