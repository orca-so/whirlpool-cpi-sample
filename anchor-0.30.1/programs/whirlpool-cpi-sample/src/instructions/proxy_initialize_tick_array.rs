use anchor_lang::prelude::*;
use whirlpool_cpi::{self, state::*, program::Whirlpool as WhirlpoolProgram};

#[derive(Accounts)]
pub struct ProxyInitializeTickArray<'info> {
  pub whirlpool_program: Program<'info, WhirlpoolProgram>,

  pub whirlpool: Account<'info, Whirlpool>,

  #[account(mut)]
  pub funder: Signer<'info>,

  /// CHECK: init by whirlpool
  #[account(mut)]
  pub tick_array: UncheckedAccount<'info>,

  pub system_program: Program<'info, System>,
}

pub fn handler(
  ctx: Context<ProxyInitializeTickArray>,
  start_tick_index: i32,
) -> Result<()> {
  let cpi_program = ctx.accounts.whirlpool_program.to_account_info();

  let cpi_accounts = whirlpool_cpi::cpi::accounts::InitializeTickArray {
    whirlpool: ctx.accounts.whirlpool.to_account_info(),
    funder: ctx.accounts.funder.to_account_info(),
    tick_array: ctx.accounts.tick_array.to_account_info(),
    system_program: ctx.accounts.system_program.to_account_info(),
  };

  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

  // execute CPI
  msg!("CPI: whirlpool initialize_tick_array instruction");
  whirlpool_cpi::cpi::initialize_tick_array(
    cpi_ctx,
    start_tick_index,
  )?;

  Ok(())
}