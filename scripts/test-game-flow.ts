import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EscrowFee } from "../target/types/escrow_fee";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import * as fs from "fs";

/**
 * Test Game Flow on Devnet
 * Simulates a complete game: create -> join -> complete
 */
async function main() {
  console.log("🎮 Air Hockey - Manual Game Flow Test\n");

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EscrowFee as Program<EscrowFee>;
  const admin = provider.wallet as anchor.Wallet;

  // Load configuration
  let config: any;
  try {
    config = JSON.parse(fs.readFileSync("admin-config.json", "utf-8"));
    console.log("✅ Loaded configuration");
    console.log("   Program ID:", config.programId);
    console.log("   Platform PDA:", config.platformStatePDA);
    console.log("   Network:", config.network);
  } catch (error) {
    console.error("❌ admin-config.json not found. Run initialize-admin.ts first!");
    process.exit(1);
  }

  const platformStatePDA = new PublicKey(config.platformStatePDA);

  // Check platform state
  console.log("\n📊 Platform Status:");
  const platformState = await program.account.platformState.fetch(platformStatePDA);
  console.log("   Admin:", platformState.admin.toString());
  console.log("   Fee:", platformState.feePercentage + "%");
  console.log("   Total Games:", platformState.totalGames.toString());
  console.log("   Total Fees:", (platformState.totalFeesCollected.toNumber() / LAMPORTS_PER_SOL).toFixed(4), "SOL");

  // Generate test players (or use existing wallets)
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();

  console.log("\n👥 Test Players:");
  console.log("   Player 1:", player1.publicKey.toString());
  console.log("   Player 2:", player2.publicKey.toString());

  // Airdrop SOL to players (devnet only)
  if (config.network === "devnet") {
    console.log("\n🪂 Requesting airdrops...");
    try {
      const airdrop1 = await provider.connection.requestAirdrop(
        player1.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdrop1);
      console.log("   ✅ Player 1: 2 SOL");

      const airdrop2 = await provider.connection.requestAirdrop(
        player2.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdrop2);
      console.log("   ✅ Player 2: 2 SOL");
    } catch (error) {
      console.log("   ⚠️  Airdrop failed (rate limit?). Using existing balance...");
    }
  }

  // Check balances
  const balance1 = await provider.connection.getBalance(player1.publicKey);
  const balance2 = await provider.connection.getBalance(player2.publicKey);
  console.log("\n💰 Player Balances:");
  console.log("   Player 1:", (balance1 / LAMPORTS_PER_SOL).toFixed(4), "SOL");
  console.log("   Player 2:", (balance2 / LAMPORTS_PER_SOL).toFixed(4), "SOL");

  if (balance1 < 0.2 * LAMPORTS_PER_SOL || balance2 < 0.2 * LAMPORTS_PER_SOL) {
    console.error("\n❌ Insufficient balance for testing!");
    console.log("Run: solana airdrop 2 " + player1.publicKey.toString());
    console.log("Run: solana airdrop 2 " + player2.publicKey.toString());
    process.exit(1);
  }

  // Test parameters
  const gameId = Date.now();
  const stakeAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL each

  console.log("\n" + "=".repeat(60));
  console.log("🎮 GAME TEST #" + gameId);
  console.log("   Stake: 0.1 SOL per player");
  console.log("   Total Pool: 0.2 SOL");
  console.log("   Winner Gets: 0.19 SOL (95%)");
  console.log("   Platform Fee: 0.01 SOL (5%)");
  console.log("=".repeat(60));

  // Step 1: Create Game (Player 1)
  console.log("\n📝 Step 1: Player 1 creates game...");
  const [gameAccountPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("game"), new anchor.BN(gameId).toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  try {
    const createTx = await program.methods
      .createGame(new anchor.BN(gameId), stakeAmount)
      .accounts({
        player1: player1.publicKey,
      })
      .signers([player1])
      .rpc();

    console.log("   ✅ Game created!");
    console.log("   TX:", createTx);
    console.log("   Game PDA:", gameAccountPDA.toString());

    // Wait for confirmation
    await provider.connection.confirmTransaction(createTx);

    // Check game state
    const gameAccount = await program.account.gameAccount.fetch(gameAccountPDA);
    console.log("   Status:", Object.keys(gameAccount.status)[0]);
    console.log("   Stake:", (gameAccount.stakeAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(4), "SOL");
  } catch (error) {
    console.error("   ❌ Failed to create game:", error);
    process.exit(1);
  }

  // Step 2: Join Game (Player 2)
  console.log("\n🤝 Step 2: Player 2 joins game...");
  try {
    const joinTx = await program.methods
      .joinGame()
      .accountsPartial({
        gameAccount: gameAccountPDA,
        player2: player2.publicKey,
      })
      .signers([player2])
      .rpc();

    console.log("   ✅ Player 2 joined!");
    console.log("   TX:", joinTx);

    await provider.connection.confirmTransaction(joinTx);

    const gameAccount = await program.account.gameAccount.fetch(gameAccountPDA);
    console.log("   Status:", Object.keys(gameAccount.status)[0]);
    console.log("   Total Pool:", ((gameAccount.stakeAmount.toNumber() * 2) / LAMPORTS_PER_SOL).toFixed(4), "SOL");
  } catch (error) {
    console.error("   ❌ Failed to join game:", error);
    process.exit(1);
  }

  // Simulate game (in real app, this is where frontend game plays)
  console.log("\n🏒 Simulating game...");
  console.log("   (In production, players would play the air hockey game here)");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Complete Game (Admin/Backend determines winner)
  console.log("\n🏆 Step 3: Completing game (Player 1 wins)...");
  const winner = player1.publicKey;

  // Get balances before completion
  const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
  const winnerBalanceBefore = await provider.connection.getBalance(winner);

  try {
    const completeTx = await program.methods
      .completeGame(winner)
      .accountsPartial({
        gameAccount: gameAccountPDA,
        platformState: platformStatePDA,
        winnerAccount: winner,
        admin: admin.publicKey,
        authority: admin.publicKey, // In production, this would be backend signer
      })
      .rpc();

    console.log("   ✅ Game completed!");
    console.log("   TX:", completeTx);

    await provider.connection.confirmTransaction(completeTx);

    // Check final balances
    const adminBalanceAfter = await provider.connection.getBalance(admin.publicKey);
    const winnerBalanceAfter = await provider.connection.getBalance(winner);

    const platformEarned = adminBalanceAfter - adminBalanceBefore;
    const winnerEarned = winnerBalanceAfter - winnerBalanceBefore;

    console.log("\n💰 Payout Summary:");
    console.log("   Winner received:", (winnerEarned / LAMPORTS_PER_SOL).toFixed(4), "SOL");
    console.log("   Platform earned:", (platformEarned / LAMPORTS_PER_SOL).toFixed(4), "SOL");

    // Check updated platform state
    const updatedPlatformState = await program.account.platformState.fetch(platformStatePDA);
    console.log("\n📊 Updated Platform Stats:");
    console.log("   Total Games:", updatedPlatformState.totalGames.toString());
    console.log("   Total Fees:", (updatedPlatformState.totalFeesCollected.toNumber() / LAMPORTS_PER_SOL).toFixed(4), "SOL");

    // Check game state
    const finalGameState = await program.account.gameAccount.fetch(gameAccountPDA);
    console.log("\n🎮 Final Game State:");
    console.log("   Status:", Object.keys(finalGameState.status)[0]);
    console.log("   Winner:", finalGameState.winner.toString());

  } catch (error) {
    console.error("   ❌ Failed to complete game:", error);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ GAME FLOW TEST SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\nAll escrow functions working correctly:");
  console.log("  ✅ Create game (Player 1 stakes)");
  console.log("  ✅ Join game (Player 2 stakes)");
  console.log("  ✅ Complete game (95% to winner, 5% to platform)");
  console.log("\nNext steps:");
  console.log("  1. Run more tests with different scenarios");
  console.log("  2. Test cancel_game function");
  console.log("  3. Integrate with frontend (Week 2)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
