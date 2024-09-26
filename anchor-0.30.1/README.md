# Whirlpool CPI with Anchor 0.30.1
## Test
### Dependencies
- Solana Program: 1.18.21
- Anchor lang: 0.30.1
- Anchor spl: 0.30.1

### CLI
- Solana CLI: 1.18.21 (Rust 1.75.0-dev)
- Anchor CLI: 0.30.1

### Test Run
1. check Solana CLI version (it should be 1.18.21)
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
cd anchor-0.30.1
```
```
anchor test --skip-local-validator
```