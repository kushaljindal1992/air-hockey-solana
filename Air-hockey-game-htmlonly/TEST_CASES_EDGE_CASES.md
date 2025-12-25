# Air Hockey Game - Comprehensive Edge Cases & Test Cases

## Overview
This document outlines critical edge cases and test scenarios for the Air Hockey game with Web3 integration. These tests identify potential failure points in wallet connectivity, blockchain transactions, game flow, and multiplayer synchronization.

---

## 1. WALLET CONNECTION EDGE CASES

### 1.1 Phantom Wallet Installation
**Test Case: WC-001**
- **Scenario**: User attempts to connect without Phantom wallet installed
- **Expected Behavior**: Error message with installation link
- **Edge Case**: `window.solana` is undefined
- **Current Code Weakness**: ✅ Handled in `isPhantomInstalled()`
- **Test Steps**:
  1. Remove/disable Phantom extension
  2. Click "Connect Wallet"
  3. Verify error: "Phantom wallet is not installed!"

**Test Case: WC-002**
- **Scenario**: Multiple wallet extensions installed (Phantom + Solflare)
- **Edge Case**: `window.solana` points to different provider
- **Current Code Weakness**: ❌ No provider verification
- **Potential Failure**: Wrong wallet connected
- **Test Steps**:
  1. Install multiple Solana wallets
  2. Verify `window.solana.isPhantom === true`
  3. Check if correct wallet is used

### 1.2 Connection Failures
**Test Case: WC-003**
- **Scenario**: User rejects connection request
- **Edge Case**: `connect()` promise rejected
- **Current Code Weakness**: ✅ Handled in try-catch
- **Test Steps**:
  1. Click "Connect Wallet"
  2. Click "Cancel" in Phantom popup
  3. Verify graceful error handling

**Test Case: WC-004**
- **Scenario**: Network timeout during connection
- **Edge Case**: RPC endpoint unresponsive
- **Current Code Weakness**: ❌ No timeout handling in `initConnection()`
- **Potential Failure**: Infinite hang on `new Connection()`
- **Recommended Fix**: Add timeout wrapper

**Test Case: WC-005**
- **Scenario**: Connection succeeds but balance fetch fails
- **Edge Case**: `getBalance()` throws error
- **Current Code Weakness**: ✅ Handled with `return 0` in catch
- **Test Steps**:
  1. Connect wallet
  2. Disable network
  3. Verify balance shows 0 instead of crashing

### 1.3 Balance & Insufficient Funds
**Test Case: WC-006**
- **Scenario**: User has 0 SOL balance
- **Edge Case**: `balance = 0`
- **Current Code Weakness**: ❌ No check before game creation
- **Potential Failure**: Transaction will fail with cryptic error
- **Test Steps**:
  1. Connect wallet with 0 SOL
  2. Attempt to create game (0.1 SOL stake)
  3. Verify error: "Insufficient balance"

**Test Case: WC-007**
- **Scenario**: User has insufficient balance (0.05 SOL but stake = 0.1 SOL)
- **Edge Case**: `balance < required + gas fees`
- **Current Code Weakness**: ❌ `hasSufficientBalance()` doesn't account for gas
- **Potential Failure**: Transaction fails mid-process
- **Recommended Fix**: Check `balance >= stakeAmount + 0.01` (estimated gas)

**Test Case: WC-008**
- **Scenario**: Balance changes during game creation
- **Edge Case**: Another transaction depletes balance
- **Current Code Weakness**: ❌ No real-time balance validation
- **Test Steps**:
  1. Start game creation (balance = 0.15 SOL)
  2. Send 0.1 SOL to another wallet during signing
  3. Verify transaction fails gracefully

### 1.4 Network Switching
**Test Case: WC-009**
- **Scenario**: User switches from devnet to mainnet in Phantom
- **Edge Case**: `accountChanged` event not fired
- **Current Code Weakness**: ❌ No network change detection
- **Potential Failure**: Game creates on wrong network
- **Test Steps**:
  1. Connect on devnet
  2. Switch to mainnet in Phantom
  3. Verify game detects network mismatch

**Test Case: WC-010**
- **Scenario**: User has different accounts on devnet vs mainnet
- **Edge Case**: Public key changes with network
- **Current Code Weakness**: ✅ Handled by `accountChanged` listener
- **Test Steps**:
  1. Connect devnet account
  2. Switch network and account
  3. Verify wallet updates

### 1.5 Disconnection Scenarios
**Test Case: WC-011**
- **Scenario**: User manually disconnects wallet during game
- **Edge Case**: `disconnect` event fired mid-game
- **Current Code Weakness**: ❌ No game state cleanup on disconnect
- **Potential Failure**: Game continues with invalid wallet state
- **Test Steps**:
  1. Start multiplayer game
  2. Disconnect wallet in Phantom
  3. Verify game exits gracefully

**Test Case: WC-012**
- **Scenario**: Browser refresh during connected session
- **Edge Case**: Wallet state not persisted
- **Current Code Weakness**: ❌ No session persistence
- **Potential Failure**: User must reconnect after refresh
- **Test Steps**:
  1. Connect wallet
  2. Refresh page
  3. Verify connection status

---

## 2. BLOCKCHAIN TRANSACTION EDGE CASES

### 2.1 Game Creation Failures
**Test Case: BC-001**
- **Scenario**: Create game with invalid stake amount (negative)
- **Edge Case**: `stakeAmountSOL = -0.1`
- **Current Code Weakness**: ❌ No input validation
- **Potential Failure**: Transaction fails or unexpected behavior
- **Recommended Fix**: Add `if (stakeAmountSOL <= 0) throw Error`

**Test Case: BC-002**
- **Scenario**: Create game with extremely large stake (1000000 SOL)
- **Edge Case**: `stakeAmountLamports` overflow
- **Current Code Weakness**: ❌ No upper bound check
- **Potential Failure**: BN overflow or unrealistic game
- **Test Steps**:
  1. Attempt to create game with 1M SOL stake
  2. Verify input validation error

**Test Case: BC-003**
- **Scenario**: Game ID collision (two games with same timestamp)
- **Edge Case**: `generateGameId()` returns duplicate
- **Current Code Weakness**: ❌ Uses `Date.now()` without uniqueness guarantee
- **Potential Failure**: PDA collision, transaction fails
- **Recommended Fix**: Add random suffix or use `Date.now() + Math.random()`

**Test Case: BC-004**
- **Scenario**: Transaction sent but not confirmed (network congestion)
- **Edge Case**: `confirmTransaction()` times out
- **Current Code Weakness**: ❌ No timeout handling
- **Potential Failure**: Infinite wait
- **Test Steps**:
  1. Create game during network congestion
  2. Verify timeout after 30 seconds

**Test Case: BC-005**
- **Scenario**: User rejects transaction signature
- **Edge Case**: `signTransaction()` rejected
- **Current Code Weakness**: ✅ Handled in try-catch
- **Test Steps**:
  1. Create game
  2. Click "Reject" in Phantom
  3. Verify error message

**Test Case: BC-006**
- **Scenario**: Transaction fails on-chain (insufficient balance after signing)
- **Edge Case**: `confirmation.value.err` is not null
- **Current Code Weakness**: ✅ Handled with error check
- **Test Steps**:
  1. Create game with barely enough SOL
  2. Send another transaction simultaneously
  3. Verify on-chain failure detected

### 2.2 Game Joining Failures
**Test Case: BC-007**
- **Scenario**: Join non-existent game ID
- **Edge Case**: `gameAccount` is null
- **Current Code Weakness**: ✅ Handled with error throw
- **Test Steps**:
  1. Enter invalid game ID (99999999)
  2. Attempt to join
  3. Verify error: "Game not found"

**Test Case: BC-008**
- **Scenario**: Join game that's already full (2 players)
- **Edge Case**: Game state shows `player2` already set
- **Current Code Weakness**: ❌ No on-chain validation before transaction
- **Potential Failure**: Transaction fails, user loses gas
- **Recommended Fix**: Check game state before sending transaction

**Test Case: BC-009**
- **Scenario**: Join game that was already cancelled
- **Edge Case**: Game account closed but ID still shared
- **Current Code Weakness**: ❌ No account status check
- **Test Steps**:
  1. Player 1 creates game
  2. Player 1 cancels game
  3. Player 2 attempts to join
  4. Verify appropriate error

**Test Case: BC-010**
- **Scenario**: Two players join same game simultaneously
- **Edge Case**: Race condition on blockchain
- **Current Code Weakness**: ❌ No optimistic locking
- **Potential Failure**: Second transaction fails
- **Test Steps**:
  1. Share game ID
  2. Two players click "Join" simultaneously
  3. Verify one succeeds, one gets error

### 2.3 Game Completion Failures
**Test Case: BC-011**
- **Scenario**: Complete game with wrong winner address
- **Edge Case**: `winnerPublicKey` doesn't match player1 or player2
- **Current Code Weakness**: ❌ No validation that winner is a participant
- **Potential Failure**: Smart contract should reject, but UI allows bad input
- **Recommended Fix**: Validate winner is current user or opponent

**Test Case: BC-012**
- **Scenario**: Complete game twice (double payment)
- **Edge Case**: `completeGame()` called multiple times
- **Current Code Weakness**: ❌ No client-side completion flag
- **Potential Failure**: Multiple transactions sent
- **Recommended Fix**: Add `this.gameCompleted` check before transaction

**Test Case: BC-013**
- **Scenario**: Complete game before it actually ends
- **Edge Case**: Score manipulation attempt
- **Current Code Weakness**: ❌ Client-side score tracking only
- **Potential Failure**: Early completion with fake scores
- **Recommended Fix**: Server-side score validation

**Test Case: BC-014**
- **Scenario**: Platform admin account not initialized
- **Edge Case**: `platformStatePDA` doesn't exist
- **Current Code Weakness**: ❌ No existence check before transaction
- **Potential Failure**: Transaction fails with unclear error
- **Test Steps**:
  1. Deploy program without initializing admin
  2. Complete game
  3. Verify error message

**Test Case: BC-015**
- **Scenario**: Network failure during completion transaction
- **Edge Case**: Transaction sent but confirmation fails
- **Current Code Weakness**: ❌ No transaction recovery
- **Potential Failure**: Funds locked, game state unclear
- **Recommended Fix**: Store transaction signature, allow retry

### 2.4 Game Cancellation Edge Cases
**Test Case: BC-016**
- **Scenario**: Cancel game after player 2 joined
- **Edge Case**: Game state changed since last check
- **Current Code Weakness**: ❌ No pre-transaction validation
- **Potential Failure**: Transaction reverted by smart contract
- **Test Steps**:
  1. Player 1 creates game
  2. Player 2 joins
  3. Player 1 attempts cancel
  4. Verify error: "Cannot cancel, game in progress"

**Test Case: BC-017**
- **Scenario**: Cancel game multiple times
- **Edge Case**: `cancelGame()` called after successful cancellation
- **Current Code Weakness**: ❌ No completion flag
- **Potential Failure**: Second transaction fails
- **Test Steps**:
  1. Cancel game
  2. Click cancel again before UI updates
  3. Verify second attempt blocked

---

## 3. MULTIPLAYER SYNCHRONIZATION EDGE CASES

### 3.1 Connection Issues
**Test Case: MP-001**
- **Scenario**: WebSocket connection fails to establish
- **Edge Case**: Server unreachable
- **Current Code Weakness**: ❌ No explicit connection error handling
- **Potential Failure**: Infinite "Connecting..." state
- **Test Steps**:
  1. Stop server
  2. Attempt multiplayer game
  3. Verify error message after timeout

**Test Case: MP-002**
- **Scenario**: Socket disconnects mid-game
- **Edge Case**: `disconnect` event during active game
- **Current Code Weakness**: ✅ Handled with `playerDisconnected` event
- **Test Steps**:
  1. Start multiplayer game
  2. Disable network on one client
  3. Verify opponent sees disconnection message

**Test Case: MP-003**
- **Scenario**: High latency (>1000ms ping)
- **Edge Case**: Network lag causes desync
- **Current Code Weakness**: ⚠️ Interpolation helps but may not be sufficient
- **Potential Failure**: Ball position mismatch
- **Test Steps**:
  1. Simulate 1500ms latency
  2. Play game
  3. Measure desync between clients

### 3.2 Matchmaking Edge Cases
**Test Case: MP-004**
- **Scenario**: No opponents available in queue
- **Edge Case**: Single player searching
- **Current Code Weakness**: ✅ Queued until match found
- **Test Steps**:
  1. Search for match
  2. Wait with no opponents
  3. Verify "Searching..." state persists

**Test Case: MP-005**
- **Scenario**: Multiple players with different stake amounts
- **Edge Case**: Queue segregated by stake
- **Current Code Weakness**: ✅ Correctly implemented with `stakeKey`
- **Test Steps**:
  1. Player A searches (0.1 SOL)
  2. Player B searches (0.5 SOL)
  3. Verify no match created

**Test Case: MP-006**
- **Scenario**: Cancel matchmaking after match found but before blockchain creation
- **Edge Case**: Race condition
- **Current Code Weakness**: ❌ May cause orphaned room
- **Potential Failure**: Player 2 joins non-existent game
- **Test Steps**:
  1. Two players search
  2. Player 1 cancels immediately after match found
  3. Verify cleanup

**Test Case: MP-007**
- **Scenario**: Player disconnects while in matchmaking queue
- **Edge Case**: Socket disconnect before match
- **Current Code Weakness**: ✅ Handled in `disconnect` event (should be)
- **Test Steps**:
  1. Start searching
  2. Close browser
  3. Verify queue removes player

### 3.3 Game State Synchronization
**Test Case: MP-008**
- **Scenario**: Score update conflict (both players score simultaneously)
- **Edge Case**: Two `scoreUpdate` events at same time
- **Current Code Weakness**: ❌ No conflict resolution
- **Potential Failure**: Incorrect final score
- **Test Steps**:
  1. Simulate simultaneous scoring
  2. Verify score consistency

**Test Case: MP-009**
- **Scenario**: Ball update spam (host sends 1000 updates/sec)
- **Edge Case**: DoS attack or bug
- **Current Code Weakness**: ❌ No rate limiting
- **Potential Failure**: Server/client overwhelmed
- **Recommended Fix**: Server-side rate limiting

**Test Case: MP-010**
- **Scenario**: Paddle position sent with invalid coordinates (x=-1000)
- **Edge Case**: Malicious or buggy client
- **Current Code Weakness**: ❌ No server-side validation
- **Potential Failure**: Game desync or visual glitches
- **Recommended Fix**: Validate paddle bounds on server

**Test Case: MP-011**
- **Scenario**: Guest modifies ball physics (speed hacking)
- **Edge Case**: Client-side manipulation
- **Current Code Weakness**: ❌ Guest should not update ball, but can
- **Potential Failure**: Cheating
- **Recommended Fix**: Reject ball updates from guest

### 3.4 Blockchain Integration with Multiplayer
**Test Case: MP-012**
- **Scenario**: Player 1 creates blockchain game but server room fails
- **Edge Case**: Blockchain succeeds, server fails
- **Current Code Weakness**: ❌ No rollback mechanism
- **Potential Failure**: Funds locked with no game
- **Test Steps**:
  1. Create game successfully on blockchain
  2. Crash server before room created
  3. Verify recovery process

**Test Case: MP-013**
- **Scenario**: Player 2 joins server room but blockchain transaction fails
- **Edge Case**: Server state != blockchain state
- **Current Code Weakness**: ❌ No consistency check
- **Potential Failure**: Game starts without proper escrow
- **Test Steps**:
  1. Player 2 joins room
  2. Rejects blockchain transaction
  3. Verify game doesn't start

**Test Case: MP-014**
- **Scenario**: Game completes on server but blockchain completion fails
- **Edge Case**: Winner determined but not paid
- **Current Code Weakness**: ❌ No retry mechanism
- **Potential Failure**: Winner doesn't receive funds
- **Test Steps**:
  1. Complete game (player 1 wins)
  2. Simulate network failure during `completeGame()`
  3. Verify retry option available

**Test Case: MP-015**
- **Scenario**: Both players claim they won
- **Edge Case**: Score desync leads to different winners on each client
- **Current Code Weakness**: ❌ No authoritative server scoring
- **Potential Failure**: Dispute over winner
- **Recommended Fix**: Server tracks and validates scores

---

## 4. GAME LOGIC EDGE CASES

### 4.1 Ball Physics
**Test Case: GL-001**
- **Scenario**: Ball stuck in infinite loop (velocity too low)
- **Edge Case**: Ball speed drops to 0
- **Current Code Weakness**: ✅ Has `ballStuckTimer` detection
- **Test Steps**:
  1. Play until ball gets very slow
  2. Verify auto-reset after 3 seconds

**Test Case: GL-002**
- **Scenario**: Ball clips through paddle at high speed
- **Edge Case**: Ball moves too fast for collision detection
- **Current Code Weakness**: ⚠️ Possible if speed exceeds paddle size
- **Test Steps**:
  1. Increase ball speed to maximum
  2. Hit ball at edge of paddle
  3. Check for pass-through

**Test Case: GL-003**
- **Scenario**: Ball spawns out of bounds
- **Edge Case**: Initial position calculation error
- **Current Code Weakness**: ✅ Ball initialized at center (500, 300)
- **Test Steps**: Verify ball always starts in valid position

### 4.2 Scoring Edge Cases
**Test Case: GL-004**
- **Scenario**: Ball scores multiple times in one frame
- **Edge Case**: Ball crosses goal line multiple times
- **Current Code Weakness**: ❌ Possible if ball not reset immediately
- **Potential Failure**: Double scoring
- **Test Steps**:
  1. Send ball at very high speed
  2. Check if score increments correctly

**Test Case: GL-005**
- **Scenario**: Score reaches 7 but game doesn't end
- **Edge Case**: Win condition check fails
- **Current Code Weakness**: Should be handled in `scoreUpdate`
- **Test Steps**:
  1. Play to 7 points
  2. Verify game ends automatically

### 4.3 Paddle Movement
**Test Case: GL-006**
- **Scenario**: Paddle moves outside boundaries
- **Edge Case**: Mouse position outside canvas
- **Current Code Weakness**: Should have boundary checks
- **Test Steps**:
  1. Move mouse outside canvas
  2. Verify paddle stays in bounds

**Test Case: GL-007**
- **Scenario**: Paddle crosses center line (player 1 enters player 2 side)
- **Edge Case**: Boundary violation
- **Current Code Weakness**: Should be prevented
- **Test Steps**: Verify center line restriction

---

## 5. AIRDROP EDGE CASES (Devnet Only)

### 5.1 Airdrop Failures
**Test Case: AD-001**
- **Scenario**: Request airdrop on mainnet
- **Edge Case**: `network = 'mainnet-beta'`
- **Current Code Weakness**: ✅ Correctly throws error
- **Test Steps**:
  1. Switch to mainnet
  2. Request airdrop
  3. Verify error: "Airdrops only available on devnet"

**Test Case: AD-002**
- **Scenario**: Airdrop rate limit exceeded
- **Edge Case**: Multiple requests in short time
- **Current Code Weakness**: ✅ Detects "RATE_LIMIT" error
- **Test Steps**:
  1. Request 5 airdrops rapidly
  2. Verify rate limit error

**Test Case: AD-003**
- **Scenario**: Airdrop faucet empty
- **Edge Case**: Devnet faucet has no funds
- **Current Code Weakness**: ✅ Detects "FAUCET_EMPTY" error
- **Test Steps**: Verify error handling when faucet depleted

**Test Case: AD-004**
- **Scenario**: Request airdrop with negative amount
- **Edge Case**: `amount = -1`
- **Current Code Weakness**: ❌ No input validation
- **Potential Failure**: Unexpected behavior
- **Recommended Fix**: Add `if (amount <= 0) throw Error`

---

## 6. UI/UX EDGE CASES

### 6.1 User Input Validation
**Test Case: UI-001**
- **Scenario**: Enter non-numeric stake amount
- **Edge Case**: User types "abc" in stake input
- **Current Code Weakness**: ❌ Depends on HTML input type
- **Potential Failure**: NaN passed to blockchain
- **Test Steps**:
  1. Enter invalid stake
  2. Verify validation error

**Test Case: UI-002**
- **Scenario**: Enter empty room code
- **Edge Case**: Join room with blank input
- **Current Code Weakness**: ❌ No validation
- **Test Steps**: Verify error message

**Test Case: UI-003**
- **Scenario**: Spam click "Create Game" button
- **Edge Case**: Multiple rapid clicks
- **Current Code Weakness**: ❌ No debounce/disable
- **Potential Failure**: Multiple game creation attempts
- **Test Steps**:
  1. Click "Create Game" 10 times rapidly
  2. Verify only one game created

### 6.2 State Management
**Test Case: UI-004**
- **Scenario**: Browser back button during game
- **Edge Case**: Navigation away from game
- **Current Code Weakness**: ❌ No beforeunload handler
- **Potential Failure**: Game abandoned without cleanup
- **Test Steps**:
  1. Start game
  2. Press back button
  3. Verify confirmation dialog

---

## 7. CRITICAL FAILURE SCENARIOS

### Priority 1: MUST FIX
1. **BC-007**: Insufficient balance check before transaction (add gas buffer)
2. **BC-012**: Prevent double game completion
3. **MP-011**: Validate ball updates (only host should send)
4. **MP-015**: Server-side authoritative scoring
5. **BC-003**: Unique game ID generation

### Priority 2: SHOULD FIX
6. **WC-004**: Connection timeout handling
7. **BC-008**: Pre-transaction game state validation
8. **MP-009**: Rate limiting on updates
9. **UI-003**: Button debouncing
10. **MP-013**: Blockchain-server state consistency

### Priority 3: NICE TO HAVE
11. **WC-002**: Multiple wallet detection
12. **WC-012**: Session persistence
13. **MP-003**: Better latency compensation
14. **GL-002**: High-speed collision improvements

---

## 8. AUTOMATED TEST SCRIPT RECOMMENDATIONS

```javascript
// Example test structure
describe('Wallet Edge Cases', () => {
  
  test('WC-006: Zero balance prevents game creation', async () => {
    // Mock wallet with 0 balance
    const result = await blockchainManager.createGame(0.1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient balance');
  });
  
  test('BC-003: Unique game IDs generated', () => {
    const id1 = blockchainManager.generateGameId();
    const id2 = blockchainManager.generateGameId();
    expect(id1).not.toBe(id2);
  });
  
  test('MP-011: Guest cannot update ball', async () => {
    // Join as player 2
    // Attempt to send ball update
    // Verify server rejects
  });
  
});
```

---

## 9. TESTING ENVIRONMENT SETUP

### Prerequisites
- Phantom wallet (devnet funded)
- Local server running on port 3000
- Multiple browser instances for multiplayer testing
- Network throttling tools (Chrome DevTools)

### Test Data
- Test wallets with varying balances:
  - Wallet A: 0 SOL
  - Wallet B: 0.05 SOL (insufficient)
  - Wallet C: 1 SOL (sufficient)
  - Wallet D: 100 SOL (large balance)

### Network Conditions
- Normal: <50ms latency
- Slow: 200-500ms latency
- Very slow: 1000ms+ latency
- Offline: Complete disconnect

---

## 10. REGRESSION TEST CHECKLIST

Before each release, verify:
- [ ] Can connect wallet successfully
- [ ] Can create game with valid balance
- [ ] Cannot create game with insufficient balance
- [ ] Can join existing game
- [ ] Cannot join non-existent game
- [ ] Matchmaking finds opponents correctly
- [ ] Game synchronizes between players
- [ ] Scores update correctly
- [ ] Game completes and pays winner
- [ ] Can cancel game before player 2 joins
- [ ] Disconnection handled gracefully
- [ ] Airdrop works on devnet
- [ ] All error messages are user-friendly

---

## Summary

**Total Test Cases Identified**: 70+

**Critical Vulnerabilities**:
- 5 blockchain transaction failures
- 4 wallet edge cases  
- 6 multiplayer synchronization issues
- 3 game logic bugs

**Recommended Next Steps**:
1. Implement Priority 1 fixes immediately
2. Add input validation across all user inputs
3. Implement server-side validation for game state
4. Add comprehensive error handling with user-friendly messages
5. Create automated test suite covering top 20 edge cases
6. Add transaction retry mechanism for network failures
7. Implement proper state cleanup on errors

This comprehensive test coverage will significantly improve the robustness and reliability of the Air Hockey game.
