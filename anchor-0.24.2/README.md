# Whirlpool CPI with Anchor 0.24.2
## Test
### Dependencies
- Solana Program: 1.9.29
- Anchor lang: 0.24.2
- Anchor spl: 0.24.2

### CLI
Use 1.10.41 intentionally. The version of Rust is same between Solana 1.9 and 1.10.
- Solana CLI: 1.10.41 (Rust 1.59.0-dev)
- Anchor CLI: 0.24.2

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
cd anchor-0.24.2
```
```
anchor test --skip-local-validator
```