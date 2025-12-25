// use anchor_lang::prelude::*;

// declare_id!("EnnZ9wCtv5z2XgcZZpKBATNoSBCQayW9aEBQ6MVYaiuC");

// #[program]
// pub mod escrow_fee {
//     use super::*;

//     pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
//         msg!("Greetings from: {:?}", ctx.program_id);
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// pub struct Initialize {}

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("3KzkUzoaSFt7xF9sW389YFE1JTwD5Fcu3aM9sReU4jgr");

#[program]
pub mod escrow_fee {
    use super::*;

    /// Initialize the platform with admin wallet and fee percentage
    pub fn initialize(ctx: Context<Initialize>, fee_percentage: u8) -> Result<()> {
        require!(fee_percentage <= 100, ErrorCode::InvalidFeePercentage);
        
        let platform_state = &mut ctx.accounts.platform_state;
        platform_state.admin = ctx.accounts.admin.key();
        platform_state.fee_percentage = fee_percentage;
        platform_state.total_games = 0;
        platform_state.total_fees_collected = 0;
        
        msg!("Platform initialized with {}% fee", fee_percentage);
        Ok(())
    }

    /// Create a new game match with stake amount
    pub fn create_game(ctx: Context<CreateGame>, game_id: u64, stake_amount: u64) -> Result<()> {
        require!(stake_amount > 0, ErrorCode::InvalidStakeAmount);
        require!(stake_amount >= 10_000_000, ErrorCode::StakeTooLow); // Min 0.01 SOL
        
        let game_account = &mut ctx.accounts.game_account;
        game_account.game_id = game_id;
        game_account.player1 = ctx.accounts.player1.key();
        game_account.player2 = Pubkey::default(); // Not joined yet
        game_account.stake_amount = stake_amount;
        game_account.status = GameStatus::WaitingForPlayer;
        game_account.winner = Pubkey::default();
        game_account.created_at = Clock::get()?.unix_timestamp;
        
        // Transfer stake from player1 to game escrow
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player1.to_account_info(),
                to: ctx.accounts.game_account.to_account_info(),
            },
        );
        transfer(cpi_context, stake_amount)?;
        
        msg!("Game {} created by player1 with stake: {} lamports", game_id, stake_amount);
        Ok(())
    }

    /// Player 2 joins the game with matching stake
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let game_account = &mut ctx.accounts.game_account;
        
        require!(
            game_account.status == GameStatus::WaitingForPlayer,
            ErrorCode::GameNotAvailable
        );
        require!(
            game_account.player1 != ctx.accounts.player2.key(),
            ErrorCode::CannotPlaySelf
        );
        
        game_account.player2 = ctx.accounts.player2.key();
        game_account.status = GameStatus::InProgress;
        
        // Transfer stake from player2 to game escrow
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player2.to_account_info(),
                to: game_account.to_account_info(),
            },
        );
        transfer(cpi_context, game_account.stake_amount)?;
        
        msg!("Player2 joined game {}", game_account.game_id);
        Ok(())
    }

    /// Complete the game and distribute winnings
    pub fn complete_game(ctx: Context<CompleteGame>, winner: Pubkey) -> Result<()> {
        let game_account = &mut ctx.accounts.game_account;
        let platform_state = &mut ctx.accounts.platform_state;
        
        require!(
            game_account.status == GameStatus::InProgress,
            ErrorCode::GameNotInProgress
        );
        require!(
            winner == game_account.player1 || winner == game_account.player2,
            ErrorCode::InvalidWinner
        );
        
        // Calculate distribution
        let total_pool = game_account.stake_amount.checked_mul(2).unwrap();
        let fee_amount = total_pool
            .checked_mul(platform_state.fee_percentage as u64)
            .unwrap()
            .checked_div(100)
            .unwrap();
        let winner_amount = total_pool.checked_sub(fee_amount).unwrap();
        
        // Store game_id before we transfer (to avoid borrow issues)
        let game_id = game_account.game_id;
        
        // Update game state
        game_account.winner = winner;
        game_account.status = GameStatus::Completed;
        
        // Update platform stats
        platform_state.total_games += 1;
        platform_state.total_fees_collected += fee_amount;
        
        // Transfer winnings to winner (do this after updating game_account)
        **game_account.to_account_info().try_borrow_mut_lamports()? -= winner_amount;
        **ctx.accounts.winner_account.try_borrow_mut_lamports()? += winner_amount;
        
        // Transfer fee to admin
        **game_account.to_account_info().try_borrow_mut_lamports()? -= fee_amount;
        **ctx.accounts.admin.try_borrow_mut_lamports()? += fee_amount;
        
        msg!(
            "Game {} completed. Winner: {} received {} lamports, Platform fee: {} lamports",
            game_id,
            winner,
            winner_amount,
            fee_amount
        );
        
        Ok(())
    }

    /// Cancel game if player2 hasn't joined (refund player1)
    pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
        let game_account = &mut ctx.accounts.game_account;
        
        require!(
            game_account.status == GameStatus::WaitingForPlayer,
            ErrorCode::CannotCancelInProgress
        );
        require!(
            game_account.player1 == ctx.accounts.player1.key(),
            ErrorCode::Unauthorized
        );
        
        let refund_amount = game_account.stake_amount;
        let game_id = game_account.game_id;
        
        // Refund stake to player1
        **game_account.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx.accounts.player1.try_borrow_mut_lamports()? += refund_amount;
        
        game_account.status = GameStatus::Cancelled;
        
        msg!("Game {} cancelled, refunded {} lamports to player1", game_id, refund_amount);
        Ok(())
    }

   

  /// Admin: Withdraw collected fees
/// Admin: Withdraw collected fees
    pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
        let platform_state = &ctx.accounts.platform_state;
        
        require!(
            ctx.accounts.admin.key() == platform_state.admin,
            ErrorCode::Unauthorized
        );
        require!(
            amount <= platform_state.total_fees_collected,
            ErrorCode::InsufficientFees
        );
        
        // Get current lamports
        let pda_lamports = **ctx.accounts.platform_state.to_account_info().lamports.borrow();
        let admin_lamports = **ctx.accounts.admin.lamports.borrow();
        
        // Check sufficient balance
        require!(
            pda_lamports >= amount,
            ErrorCode::InsufficientFees
        );
        
        // Perform transfer
        **ctx.accounts.platform_state.to_account_info().lamports.borrow_mut() = pda_lamports - amount;
        **ctx.accounts.admin.lamports.borrow_mut() = admin_lamports + amount;
        
        msg!("Admin withdrew {} lamports in fees", amount);
        Ok(())
    }
}

// ============= ACCOUNTS STRUCTS =============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + PlatformState::INIT_SPACE,
        seeds = [b"platform_state"],
        bump
    )]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = player1,
        space = 8 + GameAccount::INIT_SPACE,
        seeds = [b"game", game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub game_account: Account<'info, GameAccount>,
    
    #[account(mut)]
    pub player1: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game_account: Account<'info, GameAccount>,
    
    #[account(mut)]
    pub player2: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteGame<'info> {
    #[account(mut)]
    pub game_account: Account<'info, GameAccount>,
    
    #[account(mut)]
    pub platform_state: Account<'info, PlatformState>,
    
    /// CHECK: Winner can be either player1 or player2
    #[account(mut)]
    pub winner_account: AccountInfo<'info>,
    
    #[account(mut, address = platform_state.admin)]
    /// CHECK: Admin wallet verified via platform_state
    pub admin: AccountInfo<'info>,
    
    pub authority: Signer<'info>, // Backend authority
}

#[derive(Accounts)]
pub struct CancelGame<'info> {
    #[account(mut)]
    pub game_account: Account<'info, GameAccount>,
    
    #[account(mut)]
    pub player1: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub platform_state: Account<'info, PlatformState>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
}

// ============= STATE STRUCTS =============

#[account]
#[derive(InitSpace)]
pub struct PlatformState {
    pub admin: Pubkey,           // 32
    pub fee_percentage: u8,      // 1
    pub total_games: u64,        // 8
    pub total_fees_collected: u64, // 8
}

#[account]
#[derive(InitSpace)]
pub struct GameAccount {
    pub game_id: u64,           // 8
    pub player1: Pubkey,        // 32
    pub player2: Pubkey,        // 32
    pub stake_amount: u64,      // 8
    pub status: GameStatus,     // 1 + 1 (enum discriminant)
    pub winner: Pubkey,         // 32
    pub created_at: i64,        // 8
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum GameStatus {
    WaitingForPlayer,
    InProgress,
    Completed,
    Cancelled,
}

// ============= ERROR CODES =============

#[error_code]
pub enum ErrorCode {
    #[msg("Fee percentage must be between 0 and 100")]
    InvalidFeePercentage,
    
    #[msg("Stake amount must be greater than 0")]
    InvalidStakeAmount,
    
    #[msg("Minimum stake is 0.01 SOL")]
    StakeTooLow,
    
    #[msg("Game is not available to join")]
    GameNotAvailable,
    
    #[msg("Cannot play against yourself")]
    CannotPlaySelf,
    
    #[msg("Game is not in progress")]
    GameNotInProgress,
    
    #[msg("Invalid winner address")]
    InvalidWinner,
    
    #[msg("Cannot cancel game in progress")]
    CannotCancelInProgress,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Insufficient fees to withdraw")]
    InsufficientFees,
}