#!/bin/bash

# Air Hockey Escrow - Automated Devnet Deployment Script
# This script automates the entire deployment process to Solana Devnet

set -e  # Exit on any error

echo "🚀 Air Hockey Escrow - Devnet Deployment"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Configure Solana CLI
echo "📍 Step 1: Configuring Solana CLI for Devnet..."
solana config set --url devnet
echo -e "${GREEN}✅ Configured for Devnet${NC}"
echo ""

# Step 2: Check wallet balance
echo "💰 Step 2: Checking wallet balance..."
BALANCE=$(solana balance | awk '{print $1}')
echo "Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Low balance detected. Requesting airdrop...${NC}"
    solana airdrop 2 || echo -e "${YELLOW}Airdrop may have failed (rate limit). Continuing...${NC}"
    solana airdrop 2 || echo -e "${YELLOW}Airdrop may have failed (rate limit). Continuing...${NC}"
    sleep 2
else
    echo -e "${GREEN}✅ Sufficient balance${NC}"
fi
echo ""

# Step 3: Clean and build
echo "🏗️  Step 3: Building program..."
anchor clean
anchor build
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 4: Get Program ID
echo "🔑 Step 4: Getting Program ID..."
PROGRAM_ID=$(solana address -k target/deploy/escrow_fee-keypair.json)
echo "Program ID: $PROGRAM_ID"
echo ""

# Step 5: Check if Program ID matches in code
echo "⚙️  Step 5: Verifying Program ID in code..."
DECLARED_ID=$(grep -oP 'declare_id!\("\K[^"]+' programs/escrow-fee/src/lib.rs || echo "")

if [ "$PROGRAM_ID" != "$DECLARED_ID" ]; then
    echo -e "${YELLOW}⚠️  Program ID mismatch!${NC}"
    echo "   In code: $DECLARED_ID"
    echo "   Generated: $PROGRAM_ID"
    echo ""
    echo -e "${YELLOW}Please update the Program ID in:${NC}"
    echo "   1. programs/escrow-fee/src/lib.rs (line ~19)"
    echo "   2. Anchor.toml [programs.devnet] section"
    echo ""
    echo "Then run this script again."
    exit 1
else
    echo -e "${GREEN}✅ Program ID matches${NC}"
fi
echo ""

# Step 6: Deploy
echo "🚀 Step 6: Deploying to Devnet..."
anchor deploy --provider.cluster devnet
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# Step 7: Verify deployment
echo "🔍 Step 7: Verifying deployment..."
solana program show $PROGRAM_ID --url devnet
echo -e "${GREEN}✅ Program verified on Devnet${NC}"
echo ""

# Step 8: Initialize platform (optional)
echo "🏗️  Step 8: Initialize platform? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Running initialization script..."
    ts-node scripts/initialize-admin.ts
    echo -e "${GREEN}✅ Platform initialized${NC}"
else
    echo "Skipping initialization. You can run it later with:"
    echo "  ts-node scripts/initialize-admin.ts"
fi
echo ""

# Summary
echo "========================================"
echo -e "${GREEN}🎉 DEVNET DEPLOYMENT COMPLETE!${NC}"
echo "========================================"
echo ""
echo "Program ID: $PROGRAM_ID"
echo "Network: Devnet"
echo ""
echo "Next steps:"
echo "  1. View on Solana Explorer:"
echo "     https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "  2. Test the game flow:"
echo "     ts-node scripts/test-game-flow.ts"
echo ""
echo "  3. Check platform status:"
echo "     ts-node scripts/check-status.ts"
echo ""
echo "  4. After testing, deploy to mainnet (see DEPLOYMENT_GUIDE.md)"
echo ""
