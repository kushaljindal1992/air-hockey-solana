#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Air Hockey Smart Contract Deployment${NC}\n"

# Check environment
CLUSTER=${1:-localnet}
echo -e "${GREEN}Deploying to: $CLUSTER${NC}"

# Set Solana config
if [ "$CLUSTER" == "localnet" ]; then
    solana config set --url http://localhost:8899
elif [ "$CLUSTER" == "devnet" ]; then
    solana config set --url https://api.devnet.solana.com
elif [ "$CLUSTER" == "mainnet" ]; then
    solana config set --url https://api.mainnet-beta.solana.com
fi

# Show current config
echo -e "\n${BLUE}Current Configuration:${NC}"
solana config get

# Check balance
echo -e "\n${BLUE}Wallet Balance:${NC}"
solana balance

# Build program
echo -e "\n${BLUE}Building program...${NC}"
anchor build

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/escrow_fee-keypair.json)
echo -e "\n${GREEN}Program ID: $PROGRAM_ID${NC}"

# Update lib.rs with program ID
echo -e "\n${BLUE}Updating program ID in lib.rs...${NC}"
sed -i "s/YOUR_PROGRAM_ID_HERE/$PROGRAM_ID/g" programs/escrow-fee/src/lib.rs

# Update Anchor.toml
echo -e "\n${BLUE}Updating Anchor.toml...${NC}"
sed -i "s/escrow_fee = \".*\"/escrow_fee = \"$PROGRAM_ID\"/g" Anchor.toml

# Rebuild with correct program ID
echo -e "\n${BLUE}Rebuilding with correct program ID...${NC}"
anchor build

# Deploy
echo -e "\n${BLUE}Deploying program...${NC}"
anchor deploy --provider.cluster $CLUSTER

# Verify deployment
echo -e "\n${BLUE}Verifying deployment...${NC}"
solana program show $PROGRAM_ID

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}Program ID: $PROGRAM_ID${NC}"
echo -e "${GREEN}Cluster: $CLUSTER${NC}"

# Save program ID to file
echo $PROGRAM_ID > .program_id
echo -e "\n${BLUE}Program ID saved to .program_id${NC}"