use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use whirlpool_cpi::{self, state::*, util::unpack::unpack_tick_array, program::Whirlpool as WhirlpoolProgram};

#[derive(Accounts)]
pub struct ProxySwap<'info> {
  pub whirlpool_program: Program<'info, WhirlpoolProgram>,

  #[account(address = token::ID)]
  pub token_program: Program<'info, Token>,

  pub token_authority: Signer<'info>,

  #[account(mut)]
  pub whirlpool: Box<Account<'info, Whirlpool>>,

  #[account(mut, constraint = token_owner_account_a.mint == whirlpool.token_mint_a)]
  pub token_owner_account_a: Box<Account<'info, TokenAccount>>,
  #[account(mut, address = whirlpool.token_vault_a)]
  pub token_vault_a: Box<Account<'info, TokenAccount>>,

  #[account(mut, constraint = token_owner_account_b.mint == whirlpool.token_mint_b)]
  pub token_owner_account_b: Box<Account<'info, TokenAccount>>,
  #[account(mut, address = whirlpool.token_vault_b)]
  pub token_vault_b: Box<Account<'info, TokenAccount>>,

  #[account(mut)]
  /// CHECK: checked by whirlpool_program
  pub tick_array_0: UncheckedAccount<'info>,

  #[account(mut)]
  /// CHECK: checked by whirlpool_program
  pub tick_array_1: UncheckedAccount<'info>,

  #[account(mut)]
  /// CHECK: checked by whirlpool_program
  pub tick_array_2: UncheckedAccount<'info>,

  #[account(mut, seeds = [b"oracle", whirlpool.key().as_ref()], bump, seeds::program = whirlpool_program.key())]
  /// CHECK: checked by whirlpool_program
  pub oracle: UncheckedAccount<'info>,
}

pub fn handler(
  ctx: Context<ProxySwap>,
  amount: u64,
  other_amount_threshold: u64,
  sqrt_price_limit: u128,
  amount_specified_is_input: bool,
  a_to_b: bool,
) -> Result<()> {
  let cpi_program = ctx.accounts.whirlpool_program.to_account_info();

  // sample to access Whirlpool account
  msg!("tick_current_index: {}", ctx.accounts.whirlpool.tick_current_index);

  // TODO: revisit after updating unpack_tick_array at whirlpool_cpi
  // sample to access TickArray account (unpack packed memory to avoid compilation error)
  // let ta0 = unpack_tick_array(&ctx.accounts.tick_array_0)?;
  // msg!("start_tick_index: {}", ta0.start_tick_index);

  let cpi_accounts = whirlpool_cpi::cpi::accounts::Swap {
    whirlpool: ctx.accounts.whirlpool.to_account_info(),
    token_program: ctx.accounts.token_program.to_account_info(),
    token_authority: ctx.accounts.token_authority.to_account_info(),
    token_owner_account_a: ctx.accounts.token_owner_account_a.to_account_info(),
    token_vault_a: ctx.accounts.token_vault_a.to_account_info(),
    token_owner_account_b: ctx.accounts.token_owner_account_b.to_account_info(),
    token_vault_b: ctx.accounts.token_vault_b.to_account_info(),
    tick_array_0: ctx.accounts.tick_array_0.to_account_info(),
    tick_array_1: ctx.accounts.tick_array_1.to_account_info(),
    tick_array_2: ctx.accounts.tick_array_2.to_account_info(),
    oracle: ctx.accounts.oracle.to_account_info(),
  };

  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

  // execute CPI
  msg!("CPI: whirlpool swap instruction");
  whirlpool_cpi::cpi::swap(
    cpi_ctx,
    amount,
    other_amount_threshold,
    sqrt_price_limit,
    amount_specified_is_input,
    a_to_b,
  )?;

  Ok(())
}
