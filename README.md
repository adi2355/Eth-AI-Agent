# Blockchain Integration for Project Bolt

This project implements a comprehensive blockchain integration layer for Project Bolt, providing a robust and type-safe way to interact with various blockchain networks.

## Features

- **Wallet Integration**: Connect to various wallet providers (MetaMask, WalletConnect, etc.)
- **Contract Deployment**: Deploy smart contracts from templates or custom code
- **Token Transfers**: Send ETH or ERC20 tokens with proper validation
- **Security Validation**: Validate contracts and transactions for security issues
- **Multi-chain Support**: Support for Ethereum, Optimism, Arbitrum, and test networks

## Architecture

The blockchain integration is organized into several layers:

1. **Core Blockchain Layer**
   - `providers.ts`: Network providers and clients
   - `wallet-integration.ts`: Wallet connection and transaction handling
   - `token-registry.ts`: Token information and management

2. **Agent Layer**
   - `contract-deployment-agent.ts`: Smart contract deployment
   - `token-transfer-agent.ts`: Token transfer handling
   - `contract-validator.ts`: Security validation
   - `contract-templates.ts`: Contract template management

3. **Orchestration Layer**
   - `blockchain-orchestrator.ts`: Coordinates blockchain operations

4. **API Layer**
   - `blockchain-api.ts`: Simplified interface for frontend applications

## Usage Examples

### Connect Wallet

```typescript
import { blockchainApi } from './lib/api/blockchain-api';

// Connect to MetaMask
const address = await blockchainApi.connectWallet('metamask');
console.log(`Connected to wallet: ${address}`);
```

### Deploy Contract

```typescript
import { blockchainApi } from './lib/api/blockchain-api';

// Deploy an ERC20 token
const result = await blockchainApi.deployContract('ERC20', {
  name: 'My Token',
  symbol: 'MTK',
  initialSupply: '1000000'
});

console.log(`Contract deployed at: ${result.contractAddress}`);
```

### Transfer Tokens

```typescript
import { blockchainApi } from './lib/api/blockchain-api';

// Transfer ETH
const ethTransfer = await blockchainApi.transferTokens(
  '0x1234...', // recipient
  '0.1'        // amount in ETH
);

// Transfer ERC20 tokens
const tokenTransfer = await blockchainApi.transferTokens(
  '0x1234...', // recipient
  '100',       // amount
  '0xabcd...'  // token address
);
```

## Development

### Prerequisites

- Node.js 16+
- Yarn or npm

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Testing

```bash
# Run tests
npm test
```

## License

MIT 