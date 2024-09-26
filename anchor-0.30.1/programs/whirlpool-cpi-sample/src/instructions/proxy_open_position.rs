use anchor_lang::prelude::*;
use anchor_spl::{token::{self, Token}, associated_token::AssociatedToken};
use whirlpool_cpi::{self, state::*, program::Whirlpool as WhirlpoolProgram};

#[derive(Accounts)]
pub struct ProxyOpenPosition<'info> {
  pub whirlpool_program: Program<'info, WhirlpoolProgram>,

  #[account(mut)]
  pub funder: Signer<'info>,

  /// CHECK: safe (the owner of position_token_account)
  pub owner: UncheckedAccount<'info>,

  /// CHECK: init by whirlpool
  #[account(mut)]
  pub position: UncheckedAccount<'info>,

  /// CHECK: init by whirlpool
  #[account(mut)]
  pub position_mint: Signer<'info>,

  /// CHECK: init by whirlpool
  #[account(mut)]
  pub position_token_account: UncheckedAccount<'info>,

  pub whirlpool: Box<Account<'info, Whirlpool>>,

  #[account(address = token::ID)]
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
  pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(
  ctx: Context<ProxyOpenPosition>,
  tick_lower_index: i32,
  tick_upper_index: i32,
) -> Result<()> {
  let cpi_program = ctx.accounts.whirlpool_program.to_account_info();

  let cpi_accounts = whirlpool_cpi::cpi::accounts::OpenPosition {
    funder: ctx.accounts.funder.to_account_info(),
    owner: ctx.accounts.owner.to_account_info(),
    position: ctx.accounts.position.to_account_info(),
    position_mint: ctx.accounts.position_mint.to_account_info(),
    position_token_account: ctx.accounts.position_token_account.to_account_info(),
    whirlpool: ctx.accounts.whirlpool.to_account_info(),
    token_program: ctx.accounts.token_program.to_account_info(),
    system_program: ctx.accounts.system_program.to_account_info(),
    rent: ctx.accounts.rent.to_account_info(),
    associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
  };

  let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

  // execute CPI
  msg!("CPI: whirlpool open_position instruction");
  whirlpool_cpi::cpi::open_position(
    cpi_ctx,
    whirlpool_cpi::state::OpenPositionBumps { position_bump: 0 }, // passed bump is no longer used
    tick_lower_index,
    tick_upper_index,
  )?;

  Ok(())
}