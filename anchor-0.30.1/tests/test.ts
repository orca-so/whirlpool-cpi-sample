import * as anchor from "@coral-xyz/anchor";

// Anchor 0.30.1
import { Program, AnchorProvider, Wallet as AnchorWallet } from "@coral-xyz/anchor";

import { WhirlpoolCpiSample } from "../target/types/whirlpool_cpi_sample";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, Connection } from "@solana/web3.js";

// Orca SDK may use older Anchor client internally
import {
  ORCA_WHIRLPOOL_PROGRAM_ID, ORCA_WHIRLPOOLS_CONFIG,
  PDAUtil, PriceMath, SwapUtils,
  swapQuoteByInputToken, WhirlpoolContext, buildWhirlpoolClient,
  increaseLiquidityQuoteByInputToken, decreaseLiquidityQuoteByLiquidity,
  PoolUtil, IGNORE_CACHE, TickUtil,
} from "@orca-so/whirlpools-sdk";
import { TransactionBuilder, resolveOrCreateATA, DecimalUtil, Percentage, Wallet, TransactionBuilderOptions } from "@orca-so/common-sdk";

import { createMint } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID, AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { assert, expect } from "chai";
import BN from "bn.js";

const SOL = {mint: new PublicKey("So11111111111111111111111111111111111111112"), decimals: 9};
const SAMO = {mint: new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"), decimals: 9};
const USDC = {mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), decimals: 6};

// this is just test wallet at localvalidator (no secret info)
const TEST_PROVIDER_URL = "http://localhost:8899";
const TEST_WALLET_SECRET = [171,47,220,229,16,25,41,67,249,72,87,200,99,166,155,51,227,166,151,173,73,247,62,43,121,185,218,247,54,154,12,174,176,136,16,247,145,71,131,112,92,104,49,155,204,211,96,225,184,95,61,41,136,83,9,18,137,122,214,38,247,37,158,162];

describe("whirlpool-cpi-sample", () => {
  const connection = new Connection(TEST_PROVIDER_URL, "confirmed");
  const testWallet = Keypair.fromSecretKey(new Uint8Array(TEST_WALLET_SECRET));
  const program = anchor.workspace.WhirlpoolCpiSample as Program<WhirlpoolCpiSample>;
  const provider = new AnchorProvider(connection, new AnchorWallet(testWallet), {commitment: "confirmed"});
  const wallet = provider.wallet as Wallet;

  const whirlpool_ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
  const fetcher = whirlpool_ctx.fetcher;
  const whirlpool_client = buildWhirlpoolClient(whirlpool_ctx);

  const transaction_builder_opts: TransactionBuilderOptions = {
    defaultBuildOption: { maxSupportedTransactionVersion: "legacy", blockhashCommitment: "confirmed" },
    defaultConfirmationCommitment: "confirmed",
    defaultSendOption: {
      skipPreflight: true,
    },
  };

  const sol_usdc_whirlpool_pubkey = PDAUtil.getWhirlpool(ORCA_WHIRLPOOL_PROGRAM_ID, ORCA_WHIRLPOOLS_CONFIG, SOL.mint, USDC.mint, 64).publicKey;
  const samo_usdc_whirlpool_pubkey = PDAUtil.getWhirlpool(ORCA_WHIRLPOOL_PROGRAM_ID, ORCA_WHIRLPOOLS_CONFIG, SAMO.mint, USDC.mint, 64).publicKey;

  const position_mint_keypair = Keypair.generate();
  const position_mint = position_mint_keypair.publicKey;
  const position_pda = PDAUtil.getPosition(ORCA_WHIRLPOOL_PROGRAM_ID, position_mint);

  const verify_log = (logs: string[], message: string) => { expect(logs).includes(`Program log: verify! ${message}`); };
  const rent_ta = async () => { return connection.getMinimumBalanceForRentExemption(AccountLayout.span) }
  const sleep = (second) => new Promise(resolve => setTimeout(resolve, second * 1000));

  it("load whirlpools config account", async () => {
    const config = await fetcher.getConfig(ORCA_WHIRLPOOLS_CONFIG);

    const signature = await program.methods.verifyWhirlpoolsConfigAccount().accounts({whirlpoolsConfig: ORCA_WHIRLPOOLS_CONFIG}).rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const transaction = await connection.getParsedTransaction(signature, "confirmed");
    const logs = transaction.meta.logMessages;

    // verification
    verify_log(logs, `fee_authority: ${config.feeAuthority.toBase58()}`);
    verify_log(logs, `collect_protocol_fees_authority: ${config.collectProtocolFeesAuthority.toBase58()}`);
    verify_log(logs, `reward_emissions_super_authority: ${config.rewardEmissionsSuperAuthority.toBase58()}`);
    verify_log(logs, `default_protocol_fee_rate: ${config.defaultProtocolFeeRate}`);
  });

  it("load fee tier 1 account", async () => {
    const feetier_pubkey = PDAUtil.getFeeTier(ORCA_WHIRLPOOL_PROGRAM_ID, ORCA_WHIRLPOOLS_CONFIG, 1).publicKey;
    const feetier = await fetcher.getFeeTier(feetier_pubkey);

    const signature = await program.methods.verifyFeetierAccount().accounts({feetier: feetier_pubkey}).rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const transaction = await connection.getParsedTransaction(signature, "confirmed");
    const logs = transaction.meta.logMessages;

    // verification
    verify_log(logs, `whirlpools_config: ${feetier.whirlpoolsConfig.toBase58()}`);
    verify_log(logs, `tick_spacing: ${feetier.tickSpacing}`);
    verify_log(logs, `default_fee_rate: ${feetier.defaultFeeRate}`);
  });

  it("load fee tier 64 account", async () => {
    const feetier_pubkey = PDAUtil.getFeeTier(ORCA_WHIRLPOOL_PROGRAM_ID, ORCA_WHIRLPOOLS_CONFIG, 64).publicKey;
    const feetier = await fetcher.getFeeTier(feetier_pubkey);

    const signature = await program.methods.verifyFeetierAccount().accounts({feetier: feetier_pubkey}).rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const transaction = await connection.getParsedTransaction(signature, "confirmed");
    const logs = transaction.meta.logMessages;

    // verification
    verify_log(logs, `whirlpools_config: ${feetier.whirlpoolsConfig.toBase58()}`);
    verify_log(logs, `tick_spacing: ${feetier.tickSpacing}`);
    verify_log(logs, `default_fee_rate: ${feetier.defaultFeeRate}`);
  });

  it("load whirlpool account", async () => {
    const whirlpool = await fetcher.getPool(samo_usdc_whirlpool_pubkey);

    const signature = await program.methods.verifyWhirlpoolAccount().accounts({whirlpool: samo_usdc_whirlpool_pubkey}).rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const transaction = await connection.getParsedTransaction(signature, "confirmed");
    const logs = transaction.meta.logMessages;

    // verification
    verify_log(logs, `whirlpools_config: ${whirlpool.whirlpoolsConfig.toBase58()}`);
    verify_log(logs, `whirlpool_bump: ${whirlpool.whirlpoolBump[0]}`);
    verify_log(logs, `tick_spacing: ${whirlpool.tickSpacing}`);
    verify_log(logs, `tick_spacing_seed: ${whirlpool.tickSpacing%256} ${Math.floor(whirlpool.tickSpacing/256)}`);
    verify_log(logs, `fee_rate: ${whirlpool.feeRate}`);
    verify_log(logs, `protocol_fee_rate: ${whirlpool.protocolFeeRate}`);
    verify_log(logs, `liquidity: ${whirlpool.liquidity.toString()}`);
    verify_log(logs, `sqrt_price: ${whirlpool.sqrtPrice.toString()}`);
    verify_log(logs, `tick_current_index: ${whirlpool.tickCurrentIndex}`);
    verify_log(logs, `protocol_fee_owed_a: ${whirlpool.protocolFeeOwedA.toString()}`);
    verify_log(logs, `protocol_fee_owed_b: ${whirlpool.protocolFeeOwedB.toString()}`);
    verify_log(logs, `token_mint_a: ${whirlpool.tokenMintA.toBase58()}`);
    verify_log(logs, `token_vault_a: ${whirlpool.tokenVaultA.toBase58()}`);
    verify_log(logs, `fee_growth_global_a: ${whirlpool.feeGrowthGlobalA.toString()}`);
    verify_log(logs, `token_mint_b: ${whirlpool.tokenMintB.toBase58()}`);
    verify_log(logs, `token_vault_b: ${whirlpool.tokenVaultB.toBase58()}`);
    verify_log(logs, `fee_growth_global_b: ${whirlpool.feeGrowthGlobalB.toString()}`);
    verify_log(logs, `reward_last_updated_timestamp: ${whirlpool.rewardLastUpdatedTimestamp.toString()}`);
    verify_log(logs, `reward_infos[0].mint: ${whirlpool.rewardInfos[0].mint.toBase58()}`);
    verify_log(logs, `reward_infos[0].vault: ${whirlpool.rewardInfos[0].vault.toBase58()}`);
    verify_log(logs, `reward_infos[0].authority: ${whirlpool.rewardInfos[0].authority.toBase58()}`);
    verify_log(logs, `reward_infos[0].emissions_per_second_x64: ${whirlpool.rewardInfos[0].emissionsPerSecondX64.toString()}`);
    verify_log(logs, `reward_infos[0].growth_global_x64: ${whirlpool.rewardInfos[0].growthGlobalX64.toString()}`);
    verify_log(logs, `reward_infos[1].mint: ${whirlpool.rewardInfos[1].mint.toBase58()}`);
    verify_log(logs, `reward_infos[1].vault: ${whirlpool.rewardInfos[1].vault.toBase58()}`);
    verify_log(logs, `reward_infos[1].authority: ${whirlpool.rewardInfos[1].authority.toBase58()}`);
    verify_log(logs, `reward_infos[1].emissions_per_second_x64: ${whirlpool.rewardInfos[1].emissionsPerSecondX64.toString()}`);
    verify_log(logs, `reward_infos[1].growth_global_x64: ${whirlpool.rewardInfos[1].growthGlobalX64.toString()}`);
    verify_log(logs, `reward_infos[2].mint: ${whirlpool.rewardInfos[2].mint.toBase58()}`);
    verify_log(logs, `reward_infos[2].vault: ${whirlpool.rewardInfos[2].vault.toBase58()}`);
    verify_log(logs, `reward_infos[2].authority: ${whirlpool.rewardInfos[2].authority.toBase58()}`);
    verify_log(logs, `reward_infos[2].emissions_per_second_x64: ${whirlpool.rewardInfos[2].emissionsPerSecondX64.toString()}`);
    verify_log(logs, `reward_infos[2].growth_global_x64: ${whirlpool.rewardInfos[2].growthGlobalX64.toString()}`);
  });

  it("load tickarray account", async () => {
    const whirlpool = await fetcher.getPool(samo_usdc_whirlpool_pubkey);
    const tickarray_pubkey = PDAUtil.getTickArrayFromTickIndex(
      whirlpool.tickCurrentIndex,
      whirlpool.tickSpacing,
      samo_usdc_whirlpool_pubkey,
      ORCA_WHIRLPOOL_PROGRAM_ID
    ).publicKey;
    const tickarray = await fetcher.getTickArray(tickarray_pubkey);

    const sampling_indexes = [0, 3, 15, 18, 21, 29, 50, 87];

    const signature = await program.methods.verifyTickarrayAccount(
      sampling_indexes[0], sampling_indexes[1], sampling_indexes[2], sampling_indexes[3],
      sampling_indexes[4], sampling_indexes[5], sampling_indexes[6], sampling_indexes[7],
    ).accounts({tickarray: tickarray_pubkey}).rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const transaction = await connection.getParsedTransaction(signature, "confirmed");
    const logs = transaction.meta.logMessages;

    // verification
    verify_log(logs, `whirlpool: ${tickarray.whirlpool.toBase58()}`);
    verify_log(logs, `start_tick_index: ${tickarray.startTickIndex}`);
    for (let i=0; i<sampling_indexes.length; i++) {
      const index = sampling_indexes[i];
      const tick = tickarray.ticks[index];

      verify_log(logs, `ticks[${index}].initialized: ${tick.initialized}`);
      verify_log(logs, `ticks[${index}].liquidity_net: ${tick.liquidityNet.toString()}`);
      verify_log(logs, `ticks[${index}].liquidity_gross: ${tick.liquidityGross.toString()}`);
      verify_log(logs, `ticks[${index}].fee_growth_outside_a: ${tick.feeGrowthOutsideA.toString()}`);
      verify_log(logs, `ticks[${index}].fee_growth_outside_b: ${tick.feeGrowthOutsideB.toString()}`);
      verify_log(logs, `ticks[${index}].reward_growths_outside[0]: ${tick.rewardGrowthsOutside[0].toString()}`);
      verify_log(logs, `ticks[${index}].reward_growths_outside[1]: ${tick.rewardGrowthsOutside[1].toString()}`);
      verify_log(logs, `ticks[${index}].reward_growths_outside[2]: ${tick.rewardGrowthsOutside[2].toString()}`);
    }
  });

  it("load SOL/USDC position account", async () => {
    const position_pubkey = new PublicKey("5j3szbi2vnydYoyALNgttPD9YhCNwshUGkhzmzaP4WF7");
    const position = await fetcher.getPosition(position_pubkey);

    const signature = await program.methods.verifyPositionAccount().accounts({position: position_pubkey}).rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const transaction = await connection.getParsedTransaction(signature, "confirmed");
    const logs = transaction.meta.logMessages;

    // verification
    verify_log(logs, `whirlpool: ${position.whirlpool.toBase58()}`);
    verify_log(logs, `position_mint: ${position.positionMint.toBase58()}`);
    verify_log(logs, `liquidity: ${position.liquidity.toString()}`);
    verify_log(logs, `tick_lower_index: ${position.tickLowerIndex}`);
    verify_log(logs, `tick_upper_index: ${position.tickUpperIndex}`);
    verify_log(logs, `fee_growth_checkpoint_a: ${position.feeGrowthCheckpointA}`);
    verify_log(logs, `fee_owed_a: ${position.feeOwedA}`);
    verify_log(logs, `fee_growth_checkpoint_b: ${position.feeGrowthCheckpointB}`);
    verify_log(logs, `fee_owed_b: ${position.feeOwedB}`);
    verify_log(logs, `reward_infos[0].growth_inside_checkpoint: ${position.rewardInfos[0].growthInsideCheckpoint}`);
    verify_log(logs, `reward_infos[0].amount_owed: ${position.rewardInfos[0].amountOwed}`);
    verify_log(logs, `reward_infos[1].growth_inside_checkpoint: ${position.rewardInfos[1].growthInsideCheckpoint}`);
    verify_log(logs, `reward_infos[1].amount_owed: ${position.rewardInfos[1].amountOwed}`);
    verify_log(logs, `reward_infos[2].growth_inside_checkpoint: ${position.rewardInfos[2].growthInsideCheckpoint}`);
    verify_log(logs, `reward_infos[2].amount_owed: ${position.rewardInfos[2].amountOwed}`);
  });

  it("load SAMO/USDC position account", async () => {
    const position_pubkey = new PublicKey("B66pRzGcKMmxRJ16KMkJMJoQWWhmyk4na4DPcv6X5ZRD");
    const position = await fetcher.getPosition(position_pubkey);

    const signature = await program.methods.verifyPositionAccount().accounts({position: position_pubkey}).rpc();
    await connection.confirmTransaction(signature, "confirmed");

    const transaction = await connection.getParsedTransaction(signature, "confirmed");
    const logs = transaction.meta.logMessages;

    // verification
    verify_log(logs, `whirlpool: ${position.whirlpool.toBase58()}`);
    verify_log(logs, `position_mint: ${position.positionMint.toBase58()}`);
    verify_log(logs, `liquidity: ${position.liquidity.toString()}`);
    verify_log(logs, `tick_lower_index: ${position.tickLowerIndex}`);
    verify_log(logs, `tick_upper_index: ${position.tickUpperIndex}`);
    verify_log(logs, `fee_growth_checkpoint_a: ${position.feeGrowthCheckpointA}`);
    verify_log(logs, `fee_owed_a: ${position.feeOwedA}`);
    verify_log(logs, `fee_growth_checkpoint_b: ${position.feeGrowthCheckpointB}`);
    verify_log(logs, `fee_owed_b: ${position.feeOwedB}`);
    verify_log(logs, `reward_infos[0].growth_inside_checkpoint: ${position.rewardInfos[0].growthInsideCheckpoint}`);
    verify_log(logs, `reward_infos[0].amount_owed: ${position.rewardInfos[0].amountOwed}`);
    verify_log(logs, `reward_infos[1].growth_inside_checkpoint: ${position.rewardInfos[1].growthInsideCheckpoint}`);
    verify_log(logs, `reward_infos[1].amount_owed: ${position.rewardInfos[1].amountOwed}`);
    verify_log(logs, `reward_infos[2].growth_inside_checkpoint: ${position.rewardInfos[2].growthInsideCheckpoint}`);
    verify_log(logs, `reward_infos[2].amount_owed: ${position.rewardInfos[2].amountOwed}`);
  });

  it("execute proxy swap SOL to USDC", async () => {
    const sol_usdc_whirlpool_oracle_pubkey = PDAUtil.getOracle(ORCA_WHIRLPOOL_PROGRAM_ID, sol_usdc_whirlpool_pubkey).publicKey;
    const sol_usdc_whirlpool = await fetcher.getPool(sol_usdc_whirlpool_pubkey);

    const sol_input = DecimalUtil.toBN(DecimalUtil.fromNumber(1000 /* SOL */), SOL.decimals);
    const wsol_ta = await resolveOrCreateATA(connection, wallet.publicKey, SOL.mint, rent_ta, sol_input);
    const usdc_ta = await resolveOrCreateATA(connection, wallet.publicKey, USDC.mint, rent_ta);

    const amount = new anchor.BN(sol_input);
    const other_amount_threshold = new anchor.BN(0);
    const amount_specified_is_input = true;
    const a_to_b = true;
    const sqrt_price_limit = SwapUtils.getDefaultSqrtPriceLimit(a_to_b);

    const tickarrays = SwapUtils.getTickArrayPublicKeys(
      sol_usdc_whirlpool.tickCurrentIndex,
      sol_usdc_whirlpool.tickSpacing,
      a_to_b,
      ORCA_WHIRLPOOL_PROGRAM_ID,
      sol_usdc_whirlpool_pubkey
    );

    const swap = await program.methods
      .proxySwap(
        amount,
        other_amount_threshold,
        sqrt_price_limit,
        amount_specified_is_input,
        a_to_b,
      )
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        whirlpool: sol_usdc_whirlpool_pubkey,
        tokenAuthority: wallet.publicKey,
        tokenVaultA: sol_usdc_whirlpool.tokenVaultA,
        tokenVaultB: sol_usdc_whirlpool.tokenVaultB,
        tokenOwnerAccountA: wsol_ta.address,
        tokenOwnerAccountB: usdc_ta.address,
        tickArray0: tickarrays[0],
        tickArray1: tickarrays[1],
        tickArray2: tickarrays[2],
        // (IDL generation) oracle: sol_usdc_whirlpool_oracle_pubkey,
        // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction(wsol_ta)
      .addInstruction(usdc_ta)
      .addInstruction({instructions: [swap], cleanupInstructions: [], signers: []});

    // verification
    const quote = await swapQuoteByInputToken(
      await whirlpool_client.getPool(sol_usdc_whirlpool_pubkey, IGNORE_CACHE),
      SOL.mint,
      sol_input,
      Percentage.fromFraction(0, 1000),
      ORCA_WHIRLPOOL_PROGRAM_ID,
      fetcher,
      IGNORE_CACHE
    );

    const pre_usdc_ta = await fetcher.getTokenInfo(usdc_ta.address, IGNORE_CACHE);
    const pre_usdc = pre_usdc_ta === null ? new anchor.BN(0) : pre_usdc_ta.amount;

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const post_usdc_ta = await fetcher.getTokenInfo(usdc_ta.address, IGNORE_CACHE);
    const post_usdc = post_usdc_ta.amount;

    const usdc_output = new BN(post_usdc.toString()).sub(new BN(pre_usdc.toString()));
    assert(usdc_output.eq(quote.estimatedAmountOut));
  });

  it("execute proxy swap USDC to SAMO", async () => {
    const samo_usdc_whirlpool_oracle_pubkey = PDAUtil.getOracle(ORCA_WHIRLPOOL_PROGRAM_ID, samo_usdc_whirlpool_pubkey).publicKey;
    const samo_usdc_whirlpool = await fetcher.getPool(samo_usdc_whirlpool_pubkey);

    const usdc_input = DecimalUtil.toBN(DecimalUtil.fromNumber(2000 /* USDC */), USDC.decimals);
    const usdc_ta = await resolveOrCreateATA(connection, wallet.publicKey, USDC.mint, rent_ta);
    const samo_ta = await resolveOrCreateATA(connection, wallet.publicKey, SAMO.mint, rent_ta);

    const amount = new anchor.BN(usdc_input);
    const other_amount_threshold = new anchor.BN(0);
    const amount_specified_is_input = true;
    const a_to_b = false;
    const sqrt_price_limit = SwapUtils.getDefaultSqrtPriceLimit(a_to_b);

    const tickarrays = SwapUtils.getTickArrayPublicKeys(
      samo_usdc_whirlpool.tickCurrentIndex,
      samo_usdc_whirlpool.tickSpacing,
      a_to_b,
      ORCA_WHIRLPOOL_PROGRAM_ID,
      samo_usdc_whirlpool_pubkey
    );

    const swap = await program.methods
      .proxySwap(
        amount,
        other_amount_threshold,
        sqrt_price_limit,
        amount_specified_is_input,
        a_to_b,
      )
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        whirlpool: samo_usdc_whirlpool_pubkey,
        tokenAuthority: wallet.publicKey,
        tokenVaultA: samo_usdc_whirlpool.tokenVaultA,
        tokenVaultB: samo_usdc_whirlpool.tokenVaultB,
        tokenOwnerAccountA: samo_ta.address,
        tokenOwnerAccountB: usdc_ta.address,
        tickArray0: tickarrays[0],
        tickArray1: tickarrays[1],
        tickArray2: tickarrays[2],
        // (IDL generation) oracle: samo_usdc_whirlpool_oracle_pubkey,
        // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction(samo_ta)
      .addInstruction(usdc_ta)
      .addInstruction({instructions: [swap], cleanupInstructions: [], signers: []});

    // verification
    const quote = await swapQuoteByInputToken(
      await whirlpool_client.getPool(samo_usdc_whirlpool_pubkey, IGNORE_CACHE),
      USDC.mint,
      usdc_input,
      Percentage.fromFraction(0, 1000),
      ORCA_WHIRLPOOL_PROGRAM_ID,
      fetcher,
      IGNORE_CACHE
    );

    const pre_samo_ta = await fetcher.getTokenInfo(samo_ta.address, IGNORE_CACHE);
    const pre_samo = pre_samo_ta === null ? new anchor.BN(0) : pre_samo_ta.amount;

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const post_samo_ta = await fetcher.getTokenInfo(samo_ta.address, IGNORE_CACHE);
    const post_samo = post_samo_ta.amount;

    const samo_output = new BN(post_samo.toString()).sub(new BN(pre_samo.toString()));
    assert(samo_output.eq(quote.estimatedAmountOut));
  });

  it("execute proxy open_position", async () => {
    const position_ta = getAssociatedTokenAddressSync(position_mint, wallet.publicKey);

    const tick_lower_index = PriceMath.priceToInitializableTickIndex(DecimalUtil.fromNumber(0.01), SAMO.decimals, USDC.decimals, 64);
    const tick_upper_index = PriceMath.priceToInitializableTickIndex(DecimalUtil.fromNumber(0.02), SAMO.decimals, USDC.decimals, 64);

    const open_position = await program.methods
      .proxyOpenPosition(
        tick_lower_index,
        tick_upper_index,
      )
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        funder: wallet.publicKey,
        owner: wallet.publicKey,
        position: position_pda.publicKey,
        positionMint: position_mint,
        positionTokenAccount: position_ta,
        whirlpool: samo_usdc_whirlpool_pubkey,
        // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
        // (IDL generation) systemProgram: SystemProgram.programId,
        // (IDL generation) rent: SYSVAR_RENT_PUBKEY,
        // (IDL generation) associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .instruction();

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction({instructions: [open_position], cleanupInstructions: [], signers: [position_mint_keypair]});

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);
    assert(position_data.positionMint.equals(position_mint));
    assert(position_data.whirlpool.equals(samo_usdc_whirlpool_pubkey));
    assert(position_data.tickLowerIndex === tick_lower_index);
    assert(position_data.tickUpperIndex === tick_upper_index);
    assert(position_data.liquidity.isZero());
  });

  it("execute proxy increase_liquidity", async () => {
    const samo_usdc_whirlpool = await whirlpool_client.getPool(samo_usdc_whirlpool_pubkey, IGNORE_CACHE);
    const position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);

    const quote = increaseLiquidityQuoteByInputToken(
      SAMO.mint,
      DecimalUtil.fromNumber(100000),
      position_data.tickLowerIndex,
      position_data.tickUpperIndex,
      Percentage.fromFraction(0, 1000),
      samo_usdc_whirlpool,
    );

    const increase_liquidity = await program.methods
      .proxyIncreaseLiquidity(
        quote.liquidityAmount,
        quote.tokenMaxA,
        quote.tokenMaxB,
      )
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        // compiler says this field is not necessary, but I believe it is necessary...
        whirlpool: samo_usdc_whirlpool_pubkey,
        // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
        positionAuthority: wallet.publicKey,
        position: position_pda.publicKey,
        positionTokenAccount: getAssociatedTokenAddressSync(position_mint, wallet.publicKey),
        tokenOwnerAccountA: getAssociatedTokenAddressSync(SAMO.mint, wallet.publicKey),
        tokenOwnerAccountB: getAssociatedTokenAddressSync(USDC.mint, wallet.publicKey),
        tokenVaultA: samo_usdc_whirlpool.getData().tokenVaultA,
        tokenVaultB: samo_usdc_whirlpool.getData().tokenVaultB,
        tickArrayLower: PDAUtil.getTickArrayFromTickIndex(position_data.tickLowerIndex, 64, samo_usdc_whirlpool_pubkey, ORCA_WHIRLPOOL_PROGRAM_ID).publicKey,
        tickArrayUpper: PDAUtil.getTickArrayFromTickIndex(position_data.tickUpperIndex, 64, samo_usdc_whirlpool_pubkey, ORCA_WHIRLPOOL_PROGRAM_ID).publicKey,
      })
      .instruction();

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction({instructions: [increase_liquidity], cleanupInstructions: [], signers: []});

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const post_position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);
    const delta_liquidity = post_position_data.liquidity.sub(position_data.liquidity);
    assert(delta_liquidity.eq(quote.liquidityAmount));
  });

  it("generate fees and rewards", async () => {
    // generate rewards
    await sleep(5);

    // generate fees
    const samo_usdc_whirlpool = await whirlpool_client.getPool(samo_usdc_whirlpool_pubkey, IGNORE_CACHE);
    const usdc_samo_quote = await swapQuoteByInputToken(
      samo_usdc_whirlpool,
      USDC.mint,
      DecimalUtil.toBN(DecimalUtil.fromNumber(1000), USDC.decimals),
      Percentage.fromFraction(0, 1000),
      ORCA_WHIRLPOOL_PROGRAM_ID,
      fetcher,
      IGNORE_CACHE
    );
    const signature1 = await (await samo_usdc_whirlpool.swap(usdc_samo_quote)).buildAndExecute(transaction_builder_opts.defaultBuildOption);
    await connection.confirmTransaction(signature1);

    const samo_usdc_quote = await swapQuoteByInputToken(
      samo_usdc_whirlpool,
      SAMO.mint,
      usdc_samo_quote.estimatedAmountOut,
      Percentage.fromFraction(0, 1000),
      ORCA_WHIRLPOOL_PROGRAM_ID,
      fetcher,
      IGNORE_CACHE
    );
    const signature2 = await (await samo_usdc_whirlpool.swap(samo_usdc_quote)).buildAndExecute(transaction_builder_opts.defaultBuildOption);
    await connection.confirmTransaction(signature2);
  });

  it("execute proxy update_fees_and_rewards", async () => {
    const samo_usdc_whirlpool = await whirlpool_client.getPool(samo_usdc_whirlpool_pubkey, IGNORE_CACHE);

    const position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);

    const pre_last_updated = (await samo_usdc_whirlpool.refreshData()).rewardLastUpdatedTimestamp;

    await sleep(2);

    const update_fees_and_rewards = await program.methods
      .proxyUpdateFeesAndRewards()
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        // compiler says this field is not necessary, but I believe it is necessary...
        whirlpool: samo_usdc_whirlpool_pubkey,
        position: position_pda.publicKey,
        tickArrayLower: PDAUtil.getTickArrayFromTickIndex(position_data.tickLowerIndex, 64, samo_usdc_whirlpool_pubkey, ORCA_WHIRLPOOL_PROGRAM_ID).publicKey,
        tickArrayUpper: PDAUtil.getTickArrayFromTickIndex(position_data.tickUpperIndex, 64, samo_usdc_whirlpool_pubkey, ORCA_WHIRLPOOL_PROGRAM_ID).publicKey,
      })
      .instruction();

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction({instructions: [update_fees_and_rewards], cleanupInstructions: [], signers: []});

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const post_last_updated = (await samo_usdc_whirlpool.refreshData()).rewardLastUpdatedTimestamp;
    assert(post_last_updated.gt(pre_last_updated));
  });

  it("execute proxy decrease_liquidity", async () => {
    const samo_usdc_whirlpool = await whirlpool_client.getPool(samo_usdc_whirlpool_pubkey, IGNORE_CACHE);

    const position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);

    const quote = await decreaseLiquidityQuoteByLiquidity(
      position_data.liquidity,
      Percentage.fromFraction(0, 1000),
      await whirlpool_client.getPosition(position_pda.publicKey),
      samo_usdc_whirlpool,
    );

    const decrease_liquidity = await program.methods
      .proxyDecreaseLiquidity(
        quote.liquidityAmount,
        quote.tokenMinA,
        quote.tokenMinB,
      )
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        // compiler says this field is not necessary, but I believe it is necessary...
        whirlpool: samo_usdc_whirlpool_pubkey,
        // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
        positionAuthority: wallet.publicKey,
        position: position_pda.publicKey,
        positionTokenAccount: getAssociatedTokenAddressSync(position_mint, wallet.publicKey),
        tokenOwnerAccountA: getAssociatedTokenAddressSync(SAMO.mint, wallet.publicKey),
        tokenOwnerAccountB: getAssociatedTokenAddressSync(USDC.mint, wallet.publicKey),
        tokenVaultA: samo_usdc_whirlpool.getData().tokenVaultA,
        tokenVaultB: samo_usdc_whirlpool.getData().tokenVaultB,
        tickArrayLower: PDAUtil.getTickArrayFromTickIndex(position_data.tickLowerIndex, 64, samo_usdc_whirlpool_pubkey, ORCA_WHIRLPOOL_PROGRAM_ID).publicKey,
        tickArrayUpper: PDAUtil.getTickArrayFromTickIndex(position_data.tickUpperIndex, 64, samo_usdc_whirlpool_pubkey, ORCA_WHIRLPOOL_PROGRAM_ID).publicKey,
      })
      .instruction();

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction({instructions: [decrease_liquidity], cleanupInstructions: [], signers: []});

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const post_position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);
    const delta_liquidity = position_data.liquidity.sub(post_position_data.liquidity);
    assert(delta_liquidity.eq(quote.liquidityAmount));
  });

  it("execute proxy collect_fees", async () => {
    const samo_usdc_whirlpool = await whirlpool_client.getPool(samo_usdc_whirlpool_pubkey, IGNORE_CACHE);

    const position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);

    assert(!position_data.feeOwedA.isZero());
    assert(!position_data.feeOwedB.isZero());

    const collect_fees = await program.methods
      .proxyCollectFees()
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        // compiler says this field is not necessary, but I believe it is necessary...
        whirlpool: samo_usdc_whirlpool_pubkey,
        positionAuthority: wallet.publicKey,
        position: position_pda.publicKey,
        positionTokenAccount: getAssociatedTokenAddressSync(position_mint, wallet.publicKey),
        tokenOwnerAccountA: getAssociatedTokenAddressSync(SAMO.mint, wallet.publicKey),
        tokenVaultA: samo_usdc_whirlpool.getData().tokenVaultA,
        tokenOwnerAccountB: getAssociatedTokenAddressSync(USDC.mint, wallet.publicKey),
        tokenVaultB: samo_usdc_whirlpool.getData().tokenVaultB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction({instructions: [collect_fees], cleanupInstructions: [], signers: []});

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const post_position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);
    assert(post_position_data.feeOwedA.isZero());
    assert(post_position_data.feeOwedB.isZero());
  });

  it("execute proxy collect_reward", async () => {
    const samo_usdc_whirlpool = await whirlpool_client.getPool(samo_usdc_whirlpool_pubkey, IGNORE_CACHE);
    const samo_usdc_whirlpool_data = samo_usdc_whirlpool.getData();

    const position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);

    for (let reward_index=0; reward_index<3; reward_index++) {
      const reward_info = samo_usdc_whirlpool_data.rewardInfos[reward_index];
      if ( !PoolUtil.isRewardInitialized(reward_info) ) {
        assert(reward_index === 2);
        break;
      }

      const reward_ta = await resolveOrCreateATA(connection, wallet.publicKey, reward_info.mint, rent_ta);

      assert(!position_data.rewardInfos[reward_index].amountOwed.isZero());

      const collect_reward = await program.methods
        .proxyCollectReward(
          reward_index
        )
        .accounts({
          // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
          // compiler says this field is not necessary, but I believe it is necessary...
          whirlpool: samo_usdc_whirlpool_pubkey,
          positionAuthority: wallet.publicKey,
          position: position_pda.publicKey,
          positionTokenAccount: getAssociatedTokenAddressSync(position_mint, wallet.publicKey),
          rewardOwnerAccount: reward_ta.address,
          rewardVault: reward_info.vault,
          // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

      const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
        .addInstruction(reward_ta)
        .addInstruction({instructions: [collect_reward], cleanupInstructions: [], signers: []});

      const signature = await transaction.buildAndExecute();
      await connection.confirmTransaction(signature);

      const post_position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);
      assert(post_position_data.rewardInfos[reward_index].amountOwed.isZero());
    }
  });

  it("execute proxy close_position", async () => {
    const position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);
    assert(position_data !== null);

    const close_position = await program.methods
      .proxyClosePosition()
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        positionAuthority: wallet.publicKey,
        receiver: wallet.publicKey,
        position: position_pda.publicKey,
        positionMint: position_mint,
        positionTokenAccount: getAssociatedTokenAddressSync(position_mint, wallet.publicKey),
        // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction({instructions: [close_position], cleanupInstructions: [], signers: []});

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);

    const post_position_data = await fetcher.getPosition(position_pda.publicKey, IGNORE_CACHE);
    assert(post_position_data === null);
  });

  it("execute proxy initialize_pool and initialize_tick_array", async () => {
    const samo_usdc_whirlpool = await fetcher.getPool(samo_usdc_whirlpool_pubkey);

    let NEW_SAMO_MINT: PublicKey;
    while (!NEW_SAMO_MINT) {
      const mint = await createMint(connection, testWallet, wallet.publicKey, wallet.publicKey, 9);
      const [mint_a, mint_b] = PoolUtil.orderMints(mint, USDC.mint);
      if (mint_a.toString() === mint.toString()) {
        NEW_SAMO_MINT = mint;
      }
    }

    const tick_spacing = 128;
    const fee_tier_128_pubkey = PDAUtil.getFeeTier(ORCA_WHIRLPOOL_PROGRAM_ID, ORCA_WHIRLPOOLS_CONFIG, tick_spacing).publicKey;

    const new_samo_usdc_whirlpool_ts_128_pubkey = PDAUtil.getWhirlpool(
      ORCA_WHIRLPOOL_PROGRAM_ID,
      ORCA_WHIRLPOOLS_CONFIG,
      NEW_SAMO_MINT,
      USDC.mint,
      tick_spacing,
    ).publicKey;

    // use SAMO/USDC (ts=64) whirlpool price as initial sqrt price
    const initial_sqrt_price = samo_usdc_whirlpool.sqrtPrice;

    const new_samo_vault_keypair = Keypair.generate();
    const usdc_vault_keypair = Keypair.generate();

    const initialize_pool = await program.methods
      .proxyInitializePool(
        tick_spacing,
        initial_sqrt_price,
      )
      .accounts({
        // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
        // compiler says this field is not necessary, but I believe it is necessary...
        whirlpoolsConfig: ORCA_WHIRLPOOLS_CONFIG,
        tokenMintA: NEW_SAMO_MINT,
        tokenMintB: USDC.mint,
        funder: wallet.publicKey,
        whirlpool: new_samo_usdc_whirlpool_ts_128_pubkey,
        tokenVaultA: new_samo_vault_keypair.publicKey,
        tokenVaultB: usdc_vault_keypair.publicKey,
        feeTier: fee_tier_128_pubkey,
        // (IDL generation) tokenProgram: TOKEN_PROGRAM_ID,
        // (IDL generation) systemProgram: SystemProgram.programId,
        // (IDL generation) rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();

    const initial_tick_current_index = PriceMath.sqrtPriceX64ToTickIndex(initial_sqrt_price);
    const start_tick_indexes = [
      TickUtil.getStartTickIndex(initial_tick_current_index, tick_spacing, -2),
      TickUtil.getStartTickIndex(initial_tick_current_index, tick_spacing, -1),
      TickUtil.getStartTickIndex(initial_tick_current_index, tick_spacing, 0),
      TickUtil.getStartTickIndex(initial_tick_current_index, tick_spacing, +1),
      TickUtil.getStartTickIndex(initial_tick_current_index, tick_spacing, +2),
    ];

    const initialize_tick_arrays = await Promise.all(start_tick_indexes.map((start_tick_index) => {
      return program.methods
        .proxyInitializeTickArray(
          start_tick_index,
        )
        .accounts({
          // (IDL generation) whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
          whirlpool: new_samo_usdc_whirlpool_ts_128_pubkey,
          funder: wallet.publicKey,
          tickArray: PDAUtil.getTickArray(ORCA_WHIRLPOOL_PROGRAM_ID, new_samo_usdc_whirlpool_ts_128_pubkey, start_tick_index).publicKey,
          // (IDL generation) systemProgram: SystemProgram.programId,
        })
        .instruction();
    }));

    const transaction = new TransactionBuilder(connection, wallet, transaction_builder_opts)
      .addInstruction({instructions: [initialize_pool], cleanupInstructions: [], signers: [new_samo_vault_keypair, usdc_vault_keypair]})
      .addInstruction({instructions: initialize_tick_arrays, cleanupInstructions: [], signers: []});

    const signature = await transaction.buildAndExecute();
    await connection.confirmTransaction(signature);
  
    // verification
    const new_samo_usdc_whirlpool_ts_128 = await fetcher.getPool(new_samo_usdc_whirlpool_ts_128_pubkey);
    assert(new_samo_usdc_whirlpool_ts_128.tokenMintA.equals(NEW_SAMO_MINT));
    assert(new_samo_usdc_whirlpool_ts_128.tokenMintB.equals(USDC.mint));
    assert(new_samo_usdc_whirlpool_ts_128.tickSpacing === tick_spacing);
    assert(new_samo_usdc_whirlpool_ts_128.sqrtPrice.eq(initial_sqrt_price));

    const tickarray_pubkeys = start_tick_indexes.map((start_tick_index) => {
      return PDAUtil.getTickArray(ORCA_WHIRLPOOL_PROGRAM_ID, new_samo_usdc_whirlpool_ts_128_pubkey, start_tick_index).publicKey;
    });
    const tickarrays = await Promise.all(tickarray_pubkeys.map((tickarray_pubkey) => {
      return fetcher.getTickArray(tickarray_pubkey);
    }));
    tickarrays.forEach((tickarray, i) => {
      assert(tickarray.whirlpool.equals(new_samo_usdc_whirlpool_ts_128_pubkey));
      assert(tickarray.startTickIndex === start_tick_indexes[i]);
    });

  });

});
