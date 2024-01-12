# Whirlpool CPI with Anchor 0.25.0
## Test
### Dependencies
- Solana Program: 1.10.41
- Anchor lang: 0.25.0
- Anchor spl: 0.25.0

### CLI
- Solana CLI: 1.10.41 (Rust 1.59.0-dev)
- Anchor CLI: 0.25.0

### Test Run
1. check Solana CLI version (it should be 1.10.41)
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
cd anchor-0.25.0
```
```
anchor test --skip-local-validator
```