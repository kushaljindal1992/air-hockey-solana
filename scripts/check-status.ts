import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { EscrowFee } from "../target/types/escrow_fee";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs";

async function checkStatus() {
  console.log("🔍 Air Hockey Smart Contract - Status Check\n");
  console.log("=".repeat(60));

  try {
    // Setup provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.EscrowFee as Program<EscrowFee>;

    // 1. Check Connection
    console.log("\n📡 CONNECTION");
    console.log("-".repeat(60));
    try {
      const version = await provider.connection.getVersion();
      console.log("✅ RPC Connected:", provider.connection.rpcEndpoint);
      console.log("   Solana Version:", version["solana-core"]);
      
      const slot = await provider.connection.getSlot();
      console.log("   Current Slot:", slot);
      
      const blockHeight = await provider.connection.getBlockHeight();
      console.log("   Block Height:", blockHeight);
    } catch (error) {
      console.log("❌ Cannot connect to RPC");
      console.log("   Error:", error.message);
      console.log("   💡 Make sure validator is running: solana-test-validator");
      return;
    }

    // 2. Check Wallet
    console.log("\n💼 WALLET");
    console.log("-".repeat(60));
    const wallet = provider.wallet as anchor.Wallet;
    const balance = await provider.connection.getBalance(wallet.publicKey);
    console.log("✅ Wallet Address:", wallet.publicKey.toString());
    console.log("   Balance:", (balance / LAMPORTS_PER_SOL).toFixed(4), "SOL");
    
    if (balance < 0.1 * LAMPORTS_PER_SOL) {
      console.log("   ⚠️  Low balance! Airdrop more SOL:");
      console.log("   Command: solana airdrop 2");
    } else if (balance < 1 * LAMPORTS_PER_SOL) {
      console.log("   ⚠️  Balance getting low, consider airdrop");
    } else {
      console.log("   ✅ Sufficient balance");
    }

    // 3. Check Program
    console.log("\n🔧 PROGRAM");
    console.log("-".repeat(60));
    console.log("✅ Program ID:", program.programId.toString());
    
    try {
      const programInfo = await provider.connection.getAccountInfo(program.programId);
      if (programInfo) {
        console.log("   Status: Deployed ✅");
        console.log("   Executable: Yes");
        console.log("   Data Size:", programInfo.data.length, "bytes");
        console.log("   Owner:", programInfo.owner.toString());
        console.log("   Lamports:", (programInfo.lamports / LAMPORTS_PER_SOL).toFixed(4), "SOL");
      } else {
        console.log("   Status: Not deployed ❌");
        console.log("   💡 Action: Run 'anchor deploy'");
      }
    } catch (error) {
      console.log("   Status: Error checking program ❌");
      console.log("   Error:", error.message);
    }

    // 4. Check Platform State
    console.log("\n🏛️  PLATFORM STATE");
    console.log("-".repeat(60));
    
    const [platformStatePDA, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_state")],
      program.programId
    );
    console.log("   PDA Address:", platformStatePDA.toString());
    console.log("   Bump:", bump);

    try {
      const platformState = await program.account.platformState.fetch(platformStatePDA);
      console.log("   Status: Initialized ✅");
      console.log("");
      console.log("   📊 Platform Details:");
      console.log("   ├─ Admin:", platformState.admin.toString());
      console.log("   ├─ Fee Percentage:", platformState.feePercentage + "%");
      console.log("   ├─ Total Games:", platformState.totalGames.toString());
      console.log("   └─ Fees Collected:", 
        (platformState.totalFeesCollected.toNumber() / LAMPORTS_PER_SOL).toFixed(4), 
        "SOL"
      );
      
      // Check PDA balance
      const pdaBalance = await provider.connection.getBalance(platformStatePDA);
      console.log("");
      console.log("   💰 PDA Balance:", (pdaBalance / LAMPORTS_PER_SOL).toFixed(4), "SOL");
      
      // Check if user is admin
      if (platformState.admin.toString() === wallet.publicKey.toString()) {
        console.log("   ✅ You are the admin");
      } else {
        console.log("   ℹ️  You are not the admin");
        console.log("   Admin is:", platformState.admin.toString());
      }
      
    } catch (error) {
      console.log("   Status: Not initialized ❌");
      console.log("   💡 Action: Run 'yarn init-admin' or 'ts-node scripts/initialize-admin.ts'");
      console.log("   Error:", error.message);
    }

    // 5. Check Config File
    console.log("\n📄 CONFIGURATION FILES");
    console.log("-".repeat(60));
    
    // Check admin-config.json
    if (fs.existsSync("admin-config.json")) {
      const config = JSON.parse(fs.readFileSync("admin-config.json", "utf-8"));
      console.log("✅ admin-config.json exists");
      console.log("   ├─ Cluster:", config.cluster);
      console.log("   ├─ Admin:", config.admin);
      console.log("   ├─ Fee:", config.feePercentage + "%");
      console.log("   └─ Initialized:", config.initializedAt);
      
      if (config.programId !== program.programId.toString()) {
        console.log("   ⚠️  Program ID mismatch!");
        console.log("   Config:", config.programId);
        console.log("   Current:", program.programId.toString());
      }
    } else {
      console.log("❌ admin-config.json not found");
      console.log("   💡 Will be created after running 'yarn init-admin'");
    }
    
    // Check .program_id file
    if (fs.existsSync(".program_id")) {
      const savedProgramId = fs.readFileSync(".program_id", "utf-8").trim();
      console.log("\n✅ .program_id file exists");
      console.log("   Program ID:", savedProgramId);
      
      if (savedProgramId === program.programId.toString()) {
        console.log("   ✅ Matches current program");
      } else {
        console.log("   ⚠️  Doesn't match current program");
      }
    }

    // 6. Check Build Artifacts
    console.log("\n🔨 BUILD ARTIFACTS");
    console.log("-".repeat(60));
    
    const artifactsExist = {
      idl: fs.existsSync("target/idl/escrow_fee.json"),
      types: fs.existsSync("target/types/escrow_fee.ts"),
      keypair: fs.existsSync("target/deploy/escrow_fee-keypair.json"),
      so: fs.existsSync("target/deploy/escrow_fee.so"),
    };
    
    console.log("   IDL:", artifactsExist.idl ? "✅" : "❌");
    console.log("   TypeScript Types:", artifactsExist.types ? "✅" : "❌");
    console.log("   Program Keypair:", artifactsExist.keypair ? "✅" : "❌");
    console.log("   Compiled Program:", artifactsExist.so ? "✅" : "❌");
    
    if (!Object.values(artifactsExist).every(v => v)) {
      console.log("\n   💡 Some artifacts missing. Run: anchor build");
    }

    // 7. Test Status
    console.log("\n🧪 TEST STATUS");
    console.log("-".repeat(60));
    
    if (fs.existsSync("tests/escrow-fee.ts")) {
      console.log("✅ Test file exists: tests/escrow-fee.ts");
      
      // Try to count tests
      const testContent = fs.readFileSync("tests/escrow-fee.ts", "utf-8");
      const testMatches = testContent.match(/it\(/g);
      if (testMatches) {
        console.log("   Test cases found:", testMatches.length);
      }
      
      console.log("   💡 Run tests: yarn test");
    } else {
      console.log("❌ Test file not found");
    }

    // 8. System Requirements
    console.log("\n⚙️  SYSTEM INFORMATION");
    console.log("-".repeat(60));
    console.log("✅ Anchor SDK loaded");
    console.log("✅ TypeScript running");
    console.log("   Node version:", process.version);
    console.log("   Platform:", process.platform);
    console.log("   Architecture:", process.arch);

    // 9. Available Games (if any)
    console.log("\n🎮 ACTIVE GAMES");
    console.log("-".repeat(60));
    try {
      const allAccounts = await provider.connection.getProgramAccounts(program.programId);
      const gameAccounts = allAccounts.filter(acc => acc.account.data.length > 100); // Filter for game accounts
      
      if (gameAccounts.length > 0) {
        console.log(`   Found ${gameAccounts.length} game account(s)`);
        
        // Try to decode and show first few
        for (let i = 0; i < Math.min(3, gameAccounts.length); i++) {
          try {
            const gameData = await program.account.gameAccount.fetch(gameAccounts[i].pubkey);
            console.log(`\n   Game #${i + 1}:`);
            console.log("   └─ Game ID:", gameData.gameId.toString());
            console.log("      Status:", Object.keys(gameData.status)[0]);
            console.log("      Stake:", (gameData.stakeAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(4), "SOL");
          } catch (err) {
            // Not a game account or can't decode
          }
        }
        
        if (gameAccounts.length > 3) {
          console.log(`\n   ... and ${gameAccounts.length - 3} more`);
        }
      } else {
        console.log("   No active games found");
        console.log("   💡 Games will appear here after creation");
      }
    } catch (error) {
      console.log("   Could not fetch game accounts");
    }

    // 10. Quick Actions
    console.log("\n🚀 QUICK ACTIONS");
    console.log("-".repeat(60));
    console.log("Build program:        anchor build");
    console.log("Deploy program:       anchor deploy");
    console.log("Run tests:            yarn test");
    console.log("Initialize admin:     yarn init-admin");
    console.log("Airdrop SOL:          solana airdrop 2");
    console.log("View logs:            solana logs " + program.programId.toString().substring(0, 20) + "...");
    console.log("Check balance:        solana balance");
    console.log("Program info:         solana program show " + program.programId.toString().substring(0, 20) + "...");

    // 11. Health Summary
    console.log("\n🏥 SYSTEM HEALTH");
    console.log("-".repeat(60));
    
    const checks = {
      connection: true,
      wallet: balance >= 0.1 * LAMPORTS_PER_SOL,
      program: false,
      platform: false,
      config: fs.existsSync("admin-config.json"),
      artifacts: Object.values(artifactsExist).every(v => v),
    };
    
    try {
      const programInfo = await provider.connection.getAccountInfo(program.programId);
      checks.program = programInfo !== null;
      
      const platformState = await program.account.platformState.fetch(platformStatePDA);
      checks.platform = true;
    } catch (error) {
      // Already false
    }
    
    const healthScore = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.keys(checks).length;
    const healthPercent = Math.round((healthScore / totalChecks) * 100);
    
    console.log(`   Overall Health: ${healthScore}/${totalChecks} (${healthPercent}%)`);
    
    Object.entries(checks).forEach(([key, value]) => {
      const status = value ? "✅" : "❌";
      const name = key.charAt(0).toUpperCase() + key.slice(1);
      console.log(`   ${status} ${name}`);
    });
    
    console.log("");
    if (healthPercent === 100) {
      console.log("   🎉 All systems operational!");
    } else if (healthPercent >= 75) {
      console.log("   ⚠️  Minor issues detected");
    } else if (healthPercent >= 50) {
      console.log("   ⚠️  Several issues need attention");
    } else {
      console.log("   ❌ Major issues - review setup steps");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Status check complete!\n");

  } catch (error) {
    console.error("\n❌ Error during status check:");
    console.error(error);
    console.log("\n🔧 TROUBLESHOOTING:");
    console.log("-".repeat(60));
    console.log("1. Is solana-test-validator running?");
    console.log("   → Start with: solana-test-validator --reset");
    console.log("");
    console.log("2. Is the program built?");
    console.log("   → Run: anchor build");
    console.log("");
    console.log("3. Is Solana CLI configured correctly?");
    console.log("   → Check: solana config get");
    console.log("   → Set: solana config set --url http://localhost:8899");
    console.log("");
    console.log("4. Do you have a wallet?");
    console.log("   → Check: solana address");
    console.log("   → Create: solana-keygen new");
    console.log("");
  }
}

checkStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });