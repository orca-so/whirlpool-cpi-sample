# Whirlpool CPI with Anchor 0.27.0
## Test
### Dependencies
- Solana Program: 1.14.17
- Anchor lang: 0.27.0
- Anchor spl: 0.27.0

🚨 Due to spl-token-2022 and zk dependency, Anchor 0.27.0 now works with Solana 1.14.16 and Solana 1.14.17 only.

### CLI
- Solana CLI: 1.14.17 (Rust 1.62.0-dev)
- Anchor CLI: 0.27.0

### Test Run
1. check Solana CLI version (it should be 1.14.17)
```
solana --version
```
2. in another terminal, start test validator with test accounts 
```
cd tests
```
```
./start-test-validator.sh
```
3. run test
```
cd anchor-0.27.0
```
```
anchor test --skip-local-validator
```