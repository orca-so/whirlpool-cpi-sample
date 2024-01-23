#!/bin/bash

# --account-dir is not available <= Solana 1.10
#solana-test-validator --account-dir test-validator/accounts \
#    --bpf-program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc test-validator/programs/whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc.so \
#    --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s test-validator/programs/metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s.so \
#    --reset

solana-test-validator \
    --account B66pRzGcKMmxRJ16KMkJMJoQWWhmyk4na4DPcv6X5ZRD test-validator/accounts/samo_usdc_wp_position.B66pRzGcKMmxRJ16KMkJMJoQWWhmyk4na4DPcv6X5ZRD.json \
    --account DebZvpHUwAUmEfYBiZXpKUAFSqcMTXHe9vxcEaXYJ8er test-validator/accounts/samo_usdc_wp_reward0_vault.DebZvpHUwAUmEfYBiZXpKUAFSqcMTXHe9vxcEaXYJ8er.json \
    --account DNeQkfQ9ajaW8jGKkkhPpaDAhcHEbmt7beHVWPksPU2k test-validator/accounts/samo_usdc_wp_reward1_vault.DNeQkfQ9ajaW8jGKkkhPpaDAhcHEbmt7beHVWPksPU2k.json \
    --account HpuNjdx9vTLYTAsxH3N6HCkguEkG9mCEpkrRugqyCPwF test-validator/accounts/samo_usdc_wp_ta_n101376.HpuNjdx9vTLYTAsxH3N6HCkguEkG9mCEpkrRugqyCPwF.json \
    --account EE9AbRXbCKRGMeN6qAxxMUTEEPd1tQo67oYBQKkUNrfJ test-validator/accounts/samo_usdc_wp_ta_n107008.EE9AbRXbCKRGMeN6qAxxMUTEEPd1tQo67oYBQKkUNrfJ.json \
    --account CHVTbSXJ3W1XEjQXx7BhV2ZSfzmQcbZzKTGZa6ph6BoH test-validator/accounts/samo_usdc_wp_ta_n112640.CHVTbSXJ3W1XEjQXx7BhV2ZSfzmQcbZzKTGZa6ph6BoH.json \
    --account 4xM1zPj8ihLFUs2DvptGVZKkdACSZgNaa8zpBTApNk9G test-validator/accounts/samo_usdc_wp_ta_n118272.4xM1zPj8ihLFUs2DvptGVZKkdACSZgNaa8zpBTApNk9G.json \
    --account Gad6jpBXSxFmSqcPSPTE9jABp9ragNc2VsdUCNWLEAMT test-validator/accounts/samo_usdc_wp_ta_n123904.Gad6jpBXSxFmSqcPSPTE9jABp9ragNc2VsdUCNWLEAMT.json \
    --account ArnRmfQ49b2otrns9Kjug8fZXS8UdmKtxR2arpaevtxq test-validator/accounts/samo_usdc_wp_ta_n129536.ArnRmfQ49b2otrns9Kjug8fZXS8UdmKtxR2arpaevtxq.json \
    --account C9ahCpEXEysPgA3NGZVqZcVViBoXpoS68tbo2pC4FNHH test-validator/accounts/samo_usdc_wp_ta_n95744.C9ahCpEXEysPgA3NGZVqZcVViBoXpoS68tbo2pC4FNHH.json \
    --account 3xxgYc3jXPdjqpMdrRyKtcddh4ZdtqpaN33fwaWJ2Wbh test-validator/accounts/samo_usdc_wp_vault_a.3xxgYc3jXPdjqpMdrRyKtcddh4ZdtqpaN33fwaWJ2Wbh.json \
    --account 8xKCx3SGwWR6BUr9mZFm3xwZmCVMuLjXn9iLEU6784FS test-validator/accounts/samo_usdc_wp_vault_b.8xKCx3SGwWR6BUr9mZFm3xwZmCVMuLjXn9iLEU6784FS.json \
    --account 9vqYJjDUFecLL2xPUC4Rc7hyCtZ6iJ4mDiVZX7aFXoAe test-validator/accounts/samo_usdc_wp_whirlpool.9vqYJjDUFecLL2xPUC4Rc7hyCtZ6iJ4mDiVZX7aFXoAe.json \
    --account 5j3szbi2vnydYoyALNgttPD9YhCNwshUGkhzmzaP4WF7 test-validator/accounts/sol_usdc_wp_position.5j3szbi2vnydYoyALNgttPD9YhCNwshUGkhzmzaP4WF7.json \
    --account 2tU3tKvj7RBxEatryyMYTUxBoLSSWCQXsdv1X6yce4T2 test-validator/accounts/sol_usdc_wp_reward0_vault.2tU3tKvj7RBxEatryyMYTUxBoLSSWCQXsdv1X6yce4T2.json \
    --account HoDhUt77EotPNLUfJuvCCLbmpiM1JR6WLqWxeDPR1xvK test-validator/accounts/sol_usdc_wp_ta_n16896.HoDhUt77EotPNLUfJuvCCLbmpiM1JR6WLqWxeDPR1xvK.json \
    --account CEstjhG1v4nUgvGDyFruYEbJ18X8XeN4sX1WFCLt4D5c test-validator/accounts/sol_usdc_wp_ta_n22528.CEstjhG1v4nUgvGDyFruYEbJ18X8XeN4sX1WFCLt4D5c.json \
    --account A2W6hiA2nf16iqtbZt9vX8FJbiXjv3DBUG3DgTja61HT test-validator/accounts/sol_usdc_wp_ta_n28160.A2W6hiA2nf16iqtbZt9vX8FJbiXjv3DBUG3DgTja61HT.json \
    --account 2Eh8HEeu45tCWxY6ruLLRN6VcTSD7bfshGj7bZA87Kne test-validator/accounts/sol_usdc_wp_ta_n33792.2Eh8HEeu45tCWxY6ruLLRN6VcTSD7bfshGj7bZA87Kne.json \
    --account EVqGhR2ukNuqZNfvFFAitrX6UqrRm2r8ayKX9LH9xHzK test-validator/accounts/sol_usdc_wp_ta_n39424.EVqGhR2ukNuqZNfvFFAitrX6UqrRm2r8ayKX9LH9xHzK.json \
    --account C8o6QPGfuJD9XmNQY9ZTMXJE5qSDv4LHXaRA3D26GQ4M test-validator/accounts/sol_usdc_wp_ta_n45056.C8o6QPGfuJD9XmNQY9ZTMXJE5qSDv4LHXaRA3D26GQ4M.json \
    --account 93a168GhU5TKPri9jdkjysXhfb13z1BqGh5miGs2Pq6a test-validator/accounts/sol_usdc_wp_ta_n50688.93a168GhU5TKPri9jdkjysXhfb13z1BqGh5miGs2Pq6a.json \
    --account 3YQm7ujtXWJU2e9jhp2QGHpnn1ShXn12QjvzMvDgabpX test-validator/accounts/sol_usdc_wp_vault_a.3YQm7ujtXWJU2e9jhp2QGHpnn1ShXn12QjvzMvDgabpX.json \
    --account 2JTw1fE2wz1SymWUQ7UqpVtrTuKjcd6mWwYwUJUCh2rq test-validator/accounts/sol_usdc_wp_vault_b.2JTw1fE2wz1SymWUQ7UqpVtrTuKjcd6mWwYwUJUCh2rq.json \
    --account HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ test-validator/accounts/sol_usdc_wp_whirlpool.HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ.json \
    --account orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE test-validator/accounts/token_orca.orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE.json \
    --account 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU test-validator/accounts/token_samo.7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU.json \
    --account EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v test-validator/accounts/token_usdc.EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.json \
    --account Ct76ND8eC3MZ6PPHNNvMmz7Q8K18sobGdz6t3gyC63Pf test-validator/accounts/wallet.Ct76ND8eC3MZ6PPHNNvMmz7Q8K18sobGdz6t3gyC63Pf.json \
    --account FnkKwUvNjBSrJYKeKnADwtdtAzMrEaEqkgEajsf77rv4 test-validator/accounts/wallet_ata_samo.FnkKwUvNjBSrJYKeKnADwtdtAzMrEaEqkgEajsf77rv4.json \
    --account 3xo8jkvjFup6ur21o7TvbYyWE7mijww2CZb2B9ZvFkb7 test-validator/accounts/wallet_ata_usdc.3xo8jkvjFup6ur21o7TvbYyWE7mijww2CZb2B9ZvFkb7.json \
    --account 2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ test-validator/accounts/whirlpools_config.2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ.json \
    --account 62dSkn5ktwY1PoKPNMArZA4bZsvyemuknWUnnQ2ATTuN test-validator/accounts/whirlpools_config_feetier1.62dSkn5ktwY1PoKPNMArZA4bZsvyemuknWUnnQ2ATTuN.json \
    --account HT55NVGVTjWmWLjV7BrSMPVZ7ppU8T2xE5nCAZ6YaGad test-validator/accounts/whirlpools_config_feetier64.HT55NVGVTjWmWLjV7BrSMPVZ7ppU8T2xE5nCAZ6YaGad.json \
    --account BGnhGXT9CCt5WYS23zg9sqsAT2MGXkq7VSwch9pML82W test-validator/accounts/whirlpools_config_feetier128.BGnhGXT9CCt5WYS23zg9sqsAT2MGXkq7VSwch9pML82W.json \
    --bpf-program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc test-validator/programs/whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc.so \
    --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s test-validator/programs/metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s.so \
    --reset

