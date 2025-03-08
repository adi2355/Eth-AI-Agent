# Blockchain Integration & Testing

This document outlines our multi-layered approach for integrating and testing blockchain functionality in Project Bolt.

## Testing Approaches

We've implemented several complementary approaches for testing blockchain functionality:

### 1. Mock Implementation

- Located in `lib/blockchain/mock-provider.ts`
- Simulates blockchain behavior without real network connections
- Provides predictable responses and transaction simulations
- Enable with `USE_BLOCKCHAIN_MOCKS=true` in `.env.local`

### 2. Local Hardhat Network

- Provides a full Ethereum environment for development
- Fast, isolated, and requires no external services
- Includes example contracts in `contracts/`
- Run with `npm run blockchain:node`
- Deploy test contracts with `npm run blockchain:deploy`
- Configure in `hardhat.config.ts`
- Enable with `USE_HARDHAT=true` in `.env.local`

### 3. Public Testnet (Sepolia)

- Test with real blockchain network without real value
- Similar to production but with test ETH
- Get test ETH from faucets
- Enable with `USE_TESTNET=true` in `.env.local`

### 4. Dedicated Test Page

- Visual interface for manual testing of blockchain operations
- Located at `/blockchain-test` in the application
- Test wallet connections, transfers, and contract deployments directly

## Configuration

Environment variables in `.env.local` control which testing approach is active:

```
# Use mock implementation (no real blockchain)
USE_BLOCKCHAIN_MOCKS=true|false

# Use local Hardhat network
USE_HARDHAT=true|false

# Use public testnet (Sepolia)
USE_TESTNET=true|false
```

The system checks these flags in order, with the first enabled option taking precedence.

## Workflow

1. **Development & Unit Testing**:
   - Use mock implementation for quick feedback and predictable tests
   - Run unit tests with `npm test`

2. **Integration Testing**:
   - Use local Hardhat network for realistic blockchain behavior
   - Start Hardhat with `npm run blockchain:node`
   - Deploy test contracts with `npm run blockchain:deploy`
   - Verify with the blockchain test page at `/blockchain-test`

3. **Pre-Production Testing**:
   - Use Sepolia testnet to verify in a public network environment
   - Set `USE_TESTNET=true` in `.env.local`
   - Get test ETH from Sepolia faucets

## Smart Contracts

Example contracts are located in the `contracts/` directory:

- `SimpleToken.sol`: A basic ERC20 token for testing

## Running Tests

1. **Contract Tests**:
   ```
   npm run blockchain:test
   ```

2. **Integration Tests with Hardhat**:
   ```
   # Start Hardhat network in one terminal
   npm run blockchain:node
   
   # Deploy contracts in another terminal
   npm run blockchain:deploy
   
   # Run the application
   npm run dev
   ```

3. **Manual Testing**:
   - Start the application with `npm run dev`
   - Navigate to `/blockchain-test`
   - Connect wallet and test functionality

## Debugging

- Check Hardhat console for blockchain transaction logs
- View browser console for frontend interaction logs
- Examine `.env.local` settings to ensure the correct environment is active 