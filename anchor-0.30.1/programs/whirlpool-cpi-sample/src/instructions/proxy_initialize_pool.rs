use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Mint};
use whirlpool_cpi::{self, state::*, program::Whirlpool as WhirlpoolProgram};

#[derive(Accounts)]
pub struct ProxyInitializePool<'info> {
  pub whirlpool_program: Program<'info, WhirlpoolProgram>,

  pub whirlpools_config: Box<Account<'info, WhirlpoolsConfig>>,

  pub token_mint_a: Account<'info, Mint>,
  pub token_mint_b: Account<'info, Mint>,

  #[account(mut)]
  pub funder: Signer<'info>,

  /// CHECK: init by whirlpool
  #[account(mut)]
  pub whirlpool: UncheckedAccount<'info>,

  /// CHECK: init by whirlpool
  #[account(mut)]
  pub token_vault_a: Signer<'info>,

  /// CHECK: init by whirlpool
  #[account(mut)]
  pub token_vault_b: Signer<'info>,

  #[account(has_one = whirlpools_config)]
  pub fee_tier: Account<'info, FeeTier>,

  #[account(address = token::ID)]
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
  ctx: Context<ProxyInitializePool>,
  tick_spacing: u16,
  initial_sqrt_price: u128,
) -> Result<()> {
  let cpi_program = ctx.accounts.whirlpool_program.to_account_info();

  let cpi_accounts = whirlpool_cpi::cpi::accounts::InitializePool {
    whirlpools_config: ctx.accounts.whirlpools_config.to_account_info(),
    token_mint_a: ctx.accounts.token_mint_a.to_account_info(),
    token_mint_b: ctx.accounts.token_mint_b.to_account_info(),
    funder: ctx.accounts.funder.to_account_info(),
    whirlpool: ctx.accounts.whirlpool.to_account_info(),
    token_vault_a: ctx.accounts.token_vault_a.to_account_info(),
    token_vault_b: ctx.accounts.token_vault_b.to_account_info(),
    fee_tier: ctx.accounts.fee_tier.to_account_info(),
    token_program: ctx.accounts.token_program.to_account_info(),
    system_program: ctx.accounts.system_program.to_account_info(),
    rent: ctx.accounts.rent.to_account_info(),
  };

  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

  // execute CPI
  msg!("CPI: whirlpool initialize_pool instruction");
  whirlpool_cpi::cpi::initialize_pool(
    cpi_ctx,
    whirlpool_cpi::state::WhirlpoolBumps { whirlpool_bump: 0 }, // passed bump is no longer used
    tick_spacing,
    initial_sqrt_price,
  )?;

  Ok(())
}