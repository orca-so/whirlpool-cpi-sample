# Whirlpool CPI with Anchor 0.28.0
## Test
### Dependencies
- Solana Program: 1.16.26
- Anchor lang: 0.28.0
- Anchor spl: 0.28.0

### CLI
- Solana CLI: 1.16.26 (Rust 1.68.0-dev)
- Anchor CLI: 0.28.0

### Test Run
1. check Solana CLI version (it should be 1.16.26)
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
cd anchor-0.28.0
```
```
anchor test --skip-local-validator
```