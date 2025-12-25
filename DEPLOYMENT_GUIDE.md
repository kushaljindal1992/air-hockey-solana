# 🚀 Air Hockey Escrow - Deployment Guide

## Prerequisites
- Solana CLI installed (`solana --version`)
- Anchor CLI installed (`anchor --version`)
- Node.js & Yarn/NPM installed
- A Solana wallet with keypair at `~/.config/solana/id.json`

---

## 📍 Current Status
✅ Smart contract written  
🔄 Ready to deploy to Devnet  
⏳ Mainnet deployment (after testing)

---

## 🧪 STEP 1: Deploy to Devnet

### 1.1 Configure Solana CLI for Devnet
```bash
# Set cluster to devnet
solana config set --url devnet

# Verify configuration
solana config get

# Check your wallet address
solana address

# Check balance (need at least 2-3 SOL for deployment)
solana balance

# Get devnet SOL (run multiple times if needed)
solana airdrop 2
solana airdrop 2
```

### 1.2 Build the Program
```bash
cd ~/escrow-fee

# Clean previous builds
anchor clean

# Build the program
anchor build

# This generates:
# - target/deploy/escrow_fee.so (compiled program)
# - target/idl/escrow_fee.json (interface definition)
# - target/types/escrow_fee.ts (TypeScript types)
```

### 1.3 Get Your Program ID
```bash
# Display the program keypair address
solana address -k target/deploy/escrow_fee-keypair.json
```

**⚠️ IMPORTANT:** Copy this Program ID and update it in:
1. `programs/escrow-fee/src/lib.rs` - Line 19: `declare_id!("YOUR_PROGRAM_ID");`
2. `Anchor.toml` - Under `[programs.devnet]`

### 1.4 Rebuild After Updating Program ID
```bash
# Rebuild with correct program ID
anchor build
```

### 1.5 Deploy to Devnet
```bash
# Deploy the program to Devnet
anchor deploy --provider.cluster devnet

# Expected output:
# ✅ Program deployed successfully
# Program Id: EnnZ9wCtv5z2XgcZZpKBATNoSBCQayW9aEBQ6MVYaiuC
```

### 1.6 Verify Deployment
```bash
# Check program exists on devnet
solana program show YOUR_PROGRAM_ID --url devnet

# Check program account info
solana account YOUR_PROGRAM_ID --url devnet
```

---

## 🏗️ STEP 2: Initialize the Platform

### 2.1 Install Dependencies
```bash
cd ~/escrow-fee
npm install
# or
yarn install
```

### 2.2 Update Anchor Provider Config
Edit `Anchor.toml`:
```toml
[provider]
cluster = "Devnet"  # Changed from "Localnet"
wallet = "~/.config/solana/id.json"
```

### 2.3 Run Admin Initialization Script
```bash
# Initialize platform with 5% fee
anchor run initialize-admin

# Or directly:
ts-node scripts/initialize-admin.ts
```

**Expected Output:**
```
🔐 Air Hockey - Admin Wallet Setup

Admin Wallet: [YOUR_WALLET_ADDRESS]
Program ID: [PROGRAM_ID]
Admin Balance: X.XXXX SOL

Platform State PDA: [PDA_ADDRESS]
Bump: X

✅ Proceeding with initialization...
🏗️  Initializing platform with 5% fee...

✅ Platform initialized successfully!
Admin: [YOUR_WALLET]
Fee: 5%
Total Games: 0
Total Fees: 0.0000 SOL
```

### 2.4 Save Configuration
The script creates `admin-config.json` with:
- Program ID
- Platform PDA
- Admin wallet
- Network info

**Keep this file safe!** You'll need it for frontend integration.

---

## 🧪 STEP 3: Test on Devnet

### 3.1 Run Test Suite
```bash
# Run all tests against devnet
anchor test --skip-local-validator --provider.cluster devnet
```

### 3.2 Manual Testing (Optional)
Create a test script to simulate a game:

```bash
# Run manual game test
ts-node scripts/test-game-flow.ts
```

This should test:
1. ✅ Create game (Player 1 stakes 0.1 SOL)
2. ✅ Join game (Player 2 stakes 0.1 SOL)
3. ✅ Complete game (Winner gets 0.19 SOL, platform gets 0.01 SOL)
4. ✅ Cancel game (Refund if no player 2)

### 3.3 Verify on Solana Explorer
Visit: `https://explorer.solana.com/?cluster=devnet`

Search for:
- Your program ID
- Transaction signatures from tests
- Platform State PDA

---

## 🚀 STEP 4: Deploy to Mainnet (After Testing)

### ⚠️ Pre-Deployment Checklist
- [ ] All tests passing on Devnet
- [ ] Smart contract audited (recommended)
- [ ] Admin wallet secured (hardware wallet recommended)
- [ ] Sufficient SOL for deployment (~3-5 SOL)
- [ ] Backup of all keypairs
- [ ] Emergency pause mechanism tested

### 4.1 Configure for Mainnet
```bash
# Switch to mainnet-beta
solana config set --url mainnet-beta

# Verify you have sufficient SOL
solana balance

# ⚠️ MAINNET SOL costs real money!
# You'll need ~3-5 SOL for deployment
```

### 4.2 Generate New Program Keypair (Recommended)
```bash
# Generate fresh keypair for mainnet
solana-keygen new -o target/deploy/escrow_fee-mainnet-keypair.json

# Get the address
solana address -k target/deploy/escrow_fee-mainnet-keypair.json
```

### 4.3 Update Program ID for Mainnet
1. Update `declare_id!()` in `lib.rs` with mainnet program ID
2. Update `Anchor.toml` under `[programs.mainnet]`
3. Rebuild: `anchor build`

### 4.4 Deploy to Mainnet
```bash
# Deploy to mainnet-beta
anchor deploy --provider.cluster mainnet-beta --program-keypair target/deploy/escrow_fee-mainnet-keypair.json

# ⚠️ This will cost real SOL!
```

### 4.5 Initialize Platform on Mainnet
```bash
# Update Anchor.toml to mainnet
[provider]
cluster = "Mainnet"

# Run initialization
ts-node scripts/initialize-admin.ts
```

### 4.6 Verify Mainnet Deployment
```bash
# Check program on mainnet
solana program show YOUR_MAINNET_PROGRAM_ID --url mainnet-beta

# Visit Solana Explorer (Mainnet)
# https://explorer.solana.com/address/YOUR_PROGRAM_ID
```

---

## 📊 Post-Deployment Monitoring

### Check Platform Stats
```bash
# Run status check script
ts-node scripts/check-status.ts
```

Expected output:
- Total games played
- Total fees collected
- Current admin wallet
- Fee percentage

### Admin Operations

**Withdraw Fees:**
```typescript
// In scripts, create withdraw-fees.ts
const tx = await program.methods
  .withdrawFees(new BN(amount_in_lamports))
  .accounts({
    platformState: platformStatePDA,
    admin: admin.publicKey,
  })
  .rpc();
```

---

## 🛡️ Security Best Practices

1. **Secure Admin Wallet**
   - Use hardware wallet (Ledger) for mainnet
   - Never commit private keys to git
   - Use environment variables for sensitive data

2. **Program Upgrades**
   ```bash
   # Make program immutable after testing (optional)
   solana program set-upgrade-authority YOUR_PROGRAM_ID --final
   ```

3. **Monitoring**
   - Set up alerts for large transactions
   - Monitor platform state regularly
   - Keep logs of all admin operations

4. **Emergency Procedures**
   - Have a pause/upgrade mechanism
   - Document recovery procedures
   - Keep backup admin wallets

---

## 🐛 Troubleshooting

### "Insufficient funds"
```bash
# Devnet: Request airdrop
solana airdrop 2

# Mainnet: Transfer SOL to your wallet
```

### "Program not found"
```bash
# Verify deployment
solana program show YOUR_PROGRAM_ID --url [devnet|mainnet-beta]
```

### "Account already initialized"
Platform was already initialized. Check with:
```bash
ts-node scripts/check-status.ts
```

### Build Errors
```bash
# Clean and rebuild
anchor clean
rm -rf target
anchor build
```

---

## 📝 Quick Command Reference

```bash
# Devnet Deployment
solana config set --url devnet
solana airdrop 2
anchor build
anchor deploy --provider.cluster devnet
ts-node scripts/initialize-admin.ts

# Check Status
solana config get
solana balance
solana program show PROGRAM_ID
ts-node scripts/check-status.ts

# Mainnet Deployment (after testing)
solana config set --url mainnet-beta
anchor deploy --provider.cluster mainnet-beta
ts-node scripts/initialize-admin.ts
```

---

## 📞 Support & Resources

- **Solana Docs:** https://docs.solana.com
- **Anchor Docs:** https://www.anchor-lang.com
- **Solana Explorer:** https://explorer.solana.com
- **Program ID:** Check `admin-config.json` after deployment

---

## ✅ Deployment Checklist

### Devnet
- [ ] Solana CLI configured for devnet
- [ ] Airdrop 2-3 SOL for testing
- [ ] `anchor build` successful
- [ ] Program ID updated in code
- [ ] `anchor deploy` successful
- [ ] Platform initialized (5% fee)
- [ ] Tests passing
- [ ] Configuration saved

### Mainnet (After Devnet Testing)
- [ ] All devnet tests successful
- [ ] Smart contract audited
- [ ] 3-5 SOL in deployment wallet
- [ ] New program keypair generated
- [ ] Program ID updated for mainnet
- [ ] `anchor build` successful
- [ ] `anchor deploy` to mainnet successful
- [ ] Platform initialized on mainnet
- [ ] Verified on Solana Explorer
- [ ] Admin configuration backed up
- [ ] Monitoring set up

---

**Next Steps:** After successful deployment, proceed to Week 2 - Frontend Wallet Integration
