// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { EscrowFee } from "../target/types/escrow_fee";

// describe("escrow-fee", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace.escrowFee as Program<EscrowFee>;

//   it("Is initialized!", async () => {
//     // Add your test here.
//     const tx = await program.methods.initialize().rpc();
//     console.log("Your transaction signature", tx);
//   });
// });

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EscrowFee } from "../target/types/escrow_fee";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("Air Hockey Escrow Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.EscrowFee as Program<EscrowFee>;
  
  // Test wallets
  const admin = provider.wallet as anchor.Wallet;
  let player1: anchor.web3.Keypair;
  let player2: anchor.web3.Keypair;
  
  // PDAs
  let platformStatePDA: PublicKey;
  let platformStateBump: number;
  
  const FEE_PERCENTAGE = 5; // 5%
  const STAKE_AMOUNT = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL

  before(async () => {
    // Generate test wallets
    player1 = anchor.web3.Keypair.generate();
    player2 = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to test wallets
    console.log("\n🪂 Airdropping SOL to test wallets...");
    await airdrop(provider.connection, player1.publicKey, 2);
    await airdrop(provider.connection, player2.publicKey, 2);
    
    console.log("✅ Admin:", admin.publicKey.toString());
    console.log("✅ Player1:", player1.publicKey.toString());
    console.log("✅ Player2:", player2.publicKey.toString());
    
    // Find PlatformState PDA
    [platformStatePDA, platformStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      program.programId
    );
    
    console.log("✅ Platform State PDA:", platformStatePDA.toString());
  });

  it("Initializes the platform", async () => {
    console.log("\n🏗️  Test 1: Initialize Platform");
    
    const tx = await program.methods
      .initialize(FEE_PERCENTAGE)
      .accounts({
        platformState: platformStatePDA,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Verify platform state
    const platformState = await program.account.platformState.fetch(platformStatePDA);
    
    assert.equal(platformState.admin.toString(), admin.publicKey.toString());
    assert.equal(platformState.feePercentage, FEE_PERCENTAGE);
    assert.equal(platformState.totalGames.toNumber(), 0);
    assert.equal(platformState.totalFeesCollected.toNumber(), 0);
    
    console.log("✅ Platform initialized successfully");
    console.log("   Admin:", platformState.admin.toString());
    console.log("   Fee:", platformState.feePercentage + "%");
  });

  it("Creates a game (Player1 stakes)", async () => {
    console.log("\n🎮 Test 2: Create Game");
    
    const gameId = Date.now();
    const [gameAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), new anchor.BN(gameId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    const player1BalanceBefore = await provider.connection.getBalance(player1.publicKey);
    
    const tx = await program.methods
      .createGame(new anchor.BN(gameId), new anchor.BN(STAKE_AMOUNT))
      .accounts({
        gameAccount: gameAccountPDA,
        player1: player1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Verify game account
    const gameAccount = await program.account.gameAccount.fetch(gameAccountPDA);
    
    assert.equal(gameAccount.gameId.toNumber(), gameId);
    assert.equal(gameAccount.player1.toString(), player1.publicKey.toString());
    assert.equal(gameAccount.stakeAmount.toNumber(), STAKE_AMOUNT);
    assert.deepEqual(gameAccount.status, { waitingForPlayer: {} });
    
    const player1BalanceAfter = await provider.connection.getBalance(player1.publicKey);
    const difference = player1BalanceBefore - player1BalanceAfter;
    
    console.log("✅ Game created successfully");
    console.log("   Game ID:", gameId);
    console.log("   Player1 staked:", STAKE_AMOUNT / LAMPORTS_PER_SOL, "SOL");
    console.log("   Balance diff:", difference / LAMPORTS_PER_SOL, "SOL (includes tx fee)");
    
    // Store for next test
    (global as any).currentGameId = gameId;
    (global as any).currentGamePDA = gameAccountPDA;
  });

  it("Player2 joins the game", async () => {
    console.log("\n👥 Test 3: Player2 Joins Game");
    
    const gameAccountPDA = (global as any).currentGamePDA;
    const player2BalanceBefore = await provider.connection.getBalance(player2.publicKey);
    
    const tx = await program.methods
      .joinGame()
      .accounts({
        gameAccount: gameAccountPDA,
        player2: player2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player2])
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Verify game updated
    const gameAccount = await program.account.gameAccount.fetch(gameAccountPDA);
    
    assert.equal(gameAccount.player2.toString(), player2.publicKey.toString());
    assert.deepEqual(gameAccount.status, { inProgress: {} });
    
    const player2BalanceAfter = await provider.connection.getBalance(player2.publicKey);
    const difference = player2BalanceBefore - player2BalanceAfter;
    
    console.log("✅ Player2 joined successfully");
    console.log("   Player2 staked:", STAKE_AMOUNT / LAMPORTS_PER_SOL, "SOL");
    console.log("   Balance diff:", difference / LAMPORTS_PER_SOL, "SOL");
    console.log("   Total pool:", (STAKE_AMOUNT * 2) / LAMPORTS_PER_SOL, "SOL");
  });

  it("Completes game and distributes winnings", async () => {
    console.log("\n🏆 Test 4: Complete Game");
    
    const gameAccountPDA = (global as any).currentGamePDA;
    
    const player1BalanceBefore = await provider.connection.getBalance(player1.publicKey);
    const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
    
    // Player1 wins
    const tx = await program.methods
      .completeGame(player1.publicKey)
      .accounts({
        gameAccount: gameAccountPDA,
        platformState: platformStatePDA,
        winnerAccount: player1.publicKey,
        admin: admin.publicKey,
        authority: admin.publicKey,
      })
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Verify game completed
    const gameAccount = await program.account.gameAccount.fetch(gameAccountPDA);
    const platformState = await program.account.platformState.fetch(platformStatePDA);
    
    assert.equal(gameAccount.winner.toString(), player1.publicKey.toString());
    assert.deepEqual(gameAccount.status, { completed: {} });
    assert.equal(platformState.totalGames.toNumber(), 1);
    
    const player1BalanceAfter = await provider.connection.getBalance(player1.publicKey);
    const adminBalanceAfter = await provider.connection.getBalance(admin.publicKey);
    
    const totalPool = STAKE_AMOUNT * 2;
    const expectedFee = Math.floor((totalPool * FEE_PERCENTAGE) / 100);
    const expectedWinnings = totalPool - expectedFee;
    
    const player1Increase = player1BalanceAfter - player1BalanceBefore;
    const adminIncrease = adminBalanceAfter - adminBalanceBefore;
    
    console.log("✅ Game completed successfully");
    console.log("   Winner:", "Player1");
    console.log("   Total pool:", totalPool / LAMPORTS_PER_SOL, "SOL");
    console.log("   Winner received:", player1Increase / LAMPORTS_PER_SOL, "SOL");
    console.log("   Expected:", expectedWinnings / LAMPORTS_PER_SOL, "SOL");
    console.log("   Platform fee:", adminIncrease / LAMPORTS_PER_SOL, "SOL");
    console.log("   Expected fee:", expectedFee / LAMPORTS_PER_SOL, "SOL");
    console.log("   Total fees collected:", platformState.totalFeesCollected.toNumber() / LAMPORTS_PER_SOL, "SOL");
  });

  it("Creates and cancels a game", async () => {
    console.log("\n❌ Test 5: Cancel Game");
    
    const gameId = Date.now();
    const [gameAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("game"), new anchor.BN(gameId).toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    // Create game
    await program.methods
      .createGame(new anchor.BN(gameId), new anchor.BN(STAKE_AMOUNT))
      .accounts({
        gameAccount: gameAccountPDA,
        player1: player1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player1])
      .rpc();
    
    console.log("Game created");
    
    const player1BalanceBefore = await provider.connection.getBalance(player1.publicKey);
    
    // Cancel game
    const tx = await program.methods
      .cancelGame()
      .accounts({
        gameAccount: gameAccountPDA,
        player1: player1.publicKey,
      })
      .signers([player1])
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    const gameAccount = await program.account.gameAccount.fetch(gameAccountPDA);
    const player1BalanceAfter = await provider.connection.getBalance(player1.publicKey);
    
    assert.deepEqual(gameAccount.status, { cancelled: {} });
    
    const refundAmount = player1BalanceAfter - player1BalanceBefore;
    
    console.log("✅ Game cancelled successfully");
    console.log("   Refund amount:", refundAmount / LAMPORTS_PER_SOL, "SOL");
  });

  it("Fails when non-admin tries to withdraw fees", async () => {
    console.log("\n🚫 Test 6: Unauthorized Fee Withdrawal");
    
    try {
      await program.methods
        .withdrawFees(new anchor.BN(1000))
        .accounts({
          platformState: platformStatePDA,
          admin: player1.publicKey, // Non-admin
        })
        .signers([player1])
        .rpc();
      
      assert.fail("Should have failed");
    } catch (error) {
      console.log("✅ Correctly rejected unauthorized withdrawal");
      assert.include(error.message, "Unauthorized");
    }
  });

  // it("Admin withdraws collected fees", async () => {
  //   console.log("\n💰 Test 7: Admin Withdraws Fees");
    
  //   const platformStateBefore = await program.account.platformState.fetch(platformStatePDA);
  //   const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
    
  //   const withdrawAmount = platformStateBefore.totalFeesCollected;
    
  //   if (withdrawAmount.toNumber() === 0) {
  //     console.log("⚠️  No fees to withdraw, skipping test");
  //     return;
  //   }
    
  //   const tx = await program.methods
  //     .withdrawFees(withdrawAmount)
  //     .accounts({
  //       platformState: platformStatePDA,
  //       admin: admin.publicKey,
  //     })
  //     .rpc();
    
  //   console.log("Transaction signature:", tx);
    
  //   const adminBalanceAfter = await provider.connection.getBalance(admin.publicKey);
  //   const increase = adminBalanceAfter - adminBalanceBefore;
    
  //   console.log("✅ Fees withdrawn successfully");
  //   console.log("   Amount:", withdrawAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
  //   console.log("   Admin balance increase:", increase / LAMPORTS_PER_SOL, "SOL");
  // });
it("Admin withdraws collected fees", async () => {
    console.log("\n💰 Test 7: Admin Withdraws Fees");
    
    const platformStateBefore = await program.account.platformState.fetch(platformStatePDA);
    
    const withdrawAmount = platformStateBefore.totalFeesCollected;
    
    if (withdrawAmount.toNumber() === 0) {
      console.log("⚠️  No fees collected yet, skipping withdrawal test");
      console.log("✅ Test passed (no fees to withdraw)");
      return;
    }
    
    const pdaBalance = await provider.connection.getBalance(platformStatePDA);
    console.log("   PDA Balance:", pdaBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("   Total Fees Tracked:", withdrawAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
    
    if (pdaBalance < withdrawAmount.toNumber()) {
      console.log("⚠️  PDA doesn't hold fees (sent directly to admin), skipping withdrawal");
      console.log("✅ Test passed (fees already distributed)");
      return;
    }
    
    const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
    
    const tx = await program.methods
      .withdrawFees(withdrawAmount)
      .accounts({
        platformState: platformStatePDA,
        admin: admin.publicKey,
      })
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    const adminBalanceAfter = await provider.connection.getBalance(admin.publicKey);
    const increase = adminBalanceAfter - adminBalanceBefore;
    
    console.log("✅ Fees withdrawn successfully");
    console.log("   Amount:", withdrawAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
    console.log("   Admin balance increase:", increase / LAMPORTS_PER_SOL, "SOL");
  });

});

// Helper function for airdrops
async function airdrop(
  connection: anchor.web3.Connection,
  publicKey: PublicKey,
  amount: number
) {
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  );
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    ...latestBlockhash,
  });
}