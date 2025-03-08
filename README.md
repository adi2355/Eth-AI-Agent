# Blockchain AI Agent

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-latest-black)

**An AI-powered conversational interface for blockchain interactions**

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Usage](#usage)
- [Testing](#testing)
- [Future Improvements](#future-improvements)
- [License](#license)

## 🌟 Overview

The Blockchain AI Agent is a next-generation application merging natural language processing with Ethereum blockchain functionality. It aims to reduce complexity for users interacting with blockchain technologies by offering a fluid, conversational interface that can:

- Fetch real-time cryptocurrency market data 
- Deploy smart contracts
- Transfer tokens
- Monitor transaction statuses
- Maintain contextual conversations

### How It Addresses Common Pain Points

- **Layered Complexity**: Simplifies advanced blockchain tasks by layering an AI chat interface over multiple technical components
- **Fragmented Data**: Aggregates market data from multiple providers in one place
- **Manual Wallet Operations**: Automates wallet interactions directly from the chat interface
- **Context Loss**: Maintains conversation flow to reduce repetitive instructions

## ✨ Features

### 1. Natural Language Intent Analysis

- Powered by OpenAI to interpret user queries in plain text
- Categorizes intents: `MARKET_DATA`, `DEPLOY_CONTRACT`, `TRANSFER_TOKENS`, etc.
- Automatically extracts relevant entities (addresses, token symbols, amounts)
- Determines confidence levels and prompts for clarification when needed

### 2. Smart Contract Deployment

- Predefined templates for ERC20, ERC721 (NFT), and SimpleStorage
- Parameter customization via natural language
- Built-in compilation and deployment pipeline
- Basic security checks for known vulnerabilities

### 3. Token Transfers

- Support for ETH or any ERC20 token transfers
- Auto-parsing of addresses and amounts from natural language
- Complete transaction lifecycle monitoring
- Graceful error handling for ambiguous inputs

### 4. Persistent Wallet Connections

- Session-based wallet management for seamless interactions
- Support for both mock wallets (testing) and real wallets (MetaMask)
- Intelligent session management for disconnections

### 5. Transaction Monitoring

- Stateful tracking of all blockchain transactions
- Real-time status updates (pending, confirmed, failed)
- Detailed transaction information on request

### 6. Conversation Context & Personalization

- Memory of recent conversations and user preferences
- Continuity across multiple queries without restating details
- Topic and intent linking for natural conversation flow

### 7. Error Handling & API Fallbacks

- Automatic switching between data providers during rate limits
- Exponential retry for transient errors
- User-friendly error messages with clear next steps

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  User Interface (Next.js + React)   │
│       (Chat, Wallet, Transfers)     │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│            API Routes               │
│    (/api/chat, /api/blockchain)     │
└───────────────────┬─────────────────┘
                    │
┌───────────────────▼─────────────────┐
│     Agent Orchestrator (lib/)       │
│       - Intent Analysis (OpenAI)    │
│       - Data Aggregation            │
│       - Blockchain Orchestration    │
│       - Response Generation         │
└──┬─────────────┬──────────────┬─────┘
   │             │              │
┌──▼────┐    ┌───▼───┐     ┌────▼─────┐
│Intent │    │ Data  │     │Blockchain│
│Analysis│   │Aggregator│  │Orchestratr│
└──┬────┘    └───┬───┘     └────┬─────┘
   │             │              │
   │         ┌───▼───┐     ┌────▼─────┐
   └────────►│Response│     │Session   │
             │Generator│    │Manager   │
             └───────┘     └────┬─────┘
                                │
                           ┌────▼─────┐
                           │Transaction│
                           │Agents     │
                           └────┬─────┘
                                │
                           ┌────▼─────┐
                           │Blockchain │
                           │(Ethereum) │
                           └───────────┘
```

### High-Level Flow

1. **User Query → /api/chat**
   - User's input is sent to the endpoint
   - Agent Orchestrator processes the query

2. **Intent Analysis**
   - OpenAI classifies the query's intent
   - Entities (addresses, tokens, amounts) are extracted

3. **Data Requirements / Blockchain Operations**
   - Market data queries go to the Aggregator
   - Blockchain activity routed to Blockchain Orchestrator

4. **Conversation Context**
   - ConversationStore maintains message history and preferences
   - Provides continuity across interactions

5. **Response Generation**
   - Final response formatted through OpenAI
   - Returned to user with relevant context

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- OpenAI API Key
- Optional: CoinGecko and CoinMarketCap API keys
- Ethereum RPC Provider (Alchemy, Infura, or local Hardhat node)

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-organization/blockchain-ai-agent.git
   cd blockchain-ai-agent
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Create .env File**:
   ```bash
   cp .env.example .env
   ```
   Then populate with your API keys and RPC URLs.

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Access the app at http://localhost:3000

### Common Scripts

- `npm run dev`: Start development server (hot reload)
- `npm run build`: Build for production
- `npm run start`: Start the production build
- `npm run lint`: Check code linting
- `npm run blockchain:node`: Spawn local Hardhat blockchain
- `npm run blockchain:deploy`: Deploy sample contracts
- `npm run blockchain:test`: Run contract tests
- `npm run test:agents`: Run AI agent tests

## ⚙️ Environment Setup

### Local vs. External RPC

**Local (Hardhat)**:
- Run `npm run blockchain:node` to start a local blockchain
- Set `USE_HARDHAT=true` in your `.env`
- Deploy test contracts with `npm run blockchain:deploy`

**Testnets (Sepolia, etc.)**:
- Provide `SEPOLIA_RPC_URL` in `.env`
- Ensure your wallet has test ETH
- Set `USE_TESTNET=true`

**Mainnet**:
- Provide `MAINNET_RPC_URL` in `.env`
- Set `USE_TESTNET=false`

### Wallet Connections

**Mock Wallet**:
- Set `USE_BLOCKCHAIN_MOCKS=true` for testing without real funds
- Uses in-memory simulation for addresses and transactions

**MetaMask / Real Wallet**:
- Set `USE_BLOCKCHAIN_MOCKS=false`
- Connects with the browser's Ethereum provider

### OpenAI Configuration

- `OPENAI_API_KEY` required for conversation intelligence
- Optional `OPENAI_MODEL` to specify a different model version

## 📁 Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # Main chat endpoint
│   │   ├── blockchain/route.ts     # Blockchain interactions endpoint
│   │   └── ...                     # Other API routes
│   ├── blockchain-test/            # UI for blockchain testing
│   ├── layout.tsx                  # Global layout
│   ├── page.tsx                    # Landing page
│   └── ...                         # Additional routes/pages
│
├── components/
│   ├── ChatInterface.tsx           # Main chat window component
│   ├── TransactionForm.tsx         # UI for sending tokens
│   ├── ContractTemplateSelector.tsx # Contract template UI
│   └── ...                         # Other UI components
│
├── lib/
│   ├── agents/
│   │   ├── intent.ts               # Intent classification logic
│   │   ├── aggregator.ts           # External API data aggregation
│   │   ├── blockchain-orchestrator.ts # Routes blockchain actions
│   │   ├── deployment/             # Contract deployment modules
│   │   ├── transaction/            # Token transfer modules
│   │   └── summarization.ts        # Response summarization
│   ├── blockchain/
│   │   ├── session-manager.ts      # Wallet session management
│   │   ├── wallet-integration.ts   # Wallet connections
│   │   ├── token-registry.ts       # Token management
│   │   ├── providers.ts            # RPC client configuration
│   │   └── ...                     # Blockchain utilities
│   ├── conversation-store.ts       # Conversation memory
│   ├── orchestrator.ts             # Main orchestration pipeline
│   └── token-data.ts               # Crypto data functions
│
├── hardhat.config.ts               # Hardhat configuration
├── package.json
├── tsconfig.json
├── .env.example                    # Example environment variables
└── ...                             # Config files, scripts, etc.
```

### Key Folders

- **app/api/**: All HTTP endpoints in Next.js
- **components/**: React components for the UI
- **lib/agents/**: Specialized task handlers
- **lib/blockchain/**: Wallet and Ethereum interactions
- **lib/conversation-store.ts**: Conversation memory and context

## 🔄 How It Works

### End-to-End Flow Example

Let's follow a user request to "Deploy an ERC20 token called MyToken with symbol MTK and supply of 1,000,000":

1. **User Query**
   - Request sent to `/api/chat` with sessionId

2. **Agent Orchestrator**
   - Calls `analyzeUserQuery()` with OpenAI
   - Classifies as `DEPLOY_CONTRACT` intent

3. **Conversation Context**
   - Logs message with intent, token details
   - Updates memory with "MyToken" and "MTK" references

4. **Blockchain Action**
   - Blockchain Orchestrator processes `DEPLOY_CONTRACT` action
   - Identifies ERC20 template and populates parameters

5. **Smart Contract Deployment**
   - Compiles ERC20 template or uses pre-compiled version
   - Sends transaction through user's wallet
   - Records transaction hash in registry

6. **Transaction Monitoring**
   - Updates transaction status (pending → success/failed)
   - Tracks confirmations

7. **Response Generation**
   - Formats friendly response with transaction details
   - Returns JSON to frontend

8. **Final Chat Response**
   - User sees deployment progress message
   - Later can ask about deployment status

## 🖥️ Usage

### Chat Interface

Go to http://localhost:3000 after starting the dev server and try:

- **Price Queries**: "What's the price of Bitcoin?"
- **Contract Deployment**: "Deploy an ERC20 token called MyToken"
- **Token Transfers**: "Send 0.01 ETH to 0xABC123..."
- **Wallet Connection**: "Connect my wallet"

### Blockchain Test Page

Visit http://localhost:3000/blockchain-test for:

- Direct wallet connections (mock or real)
- Manual token transfers
- Contract deployments
- Transaction history view

## 🧪 Testing

### Agent Tests

```bash
npm run test:agents
```
Tests core AI logic, intent classification, and summarization routines with mocked external APIs.

### Blockchain Tests

```bash
# In one terminal
npm run blockchain:node

# In another terminal
npm run blockchain:test
```
Runs Solidity contract tests on a local Hardhat network to verify deployments and transfers.

### Integration Testing

For end-to-end flows:
1. Start local Hardhat node
2. Connect wallet on `/blockchain-test`
3. Deploy contracts or transfer tokens
4. Verify UI response and transaction status

## 🔮 Future Improvements

- **Multi-Chain Support**: Extend beyond Ethereum to Polygon, Arbitrum, Optimism, etc.
- **Voice Interface**: Allow voice-based queries and spoken responses
- **DeFi Protocol Support**: Built-in integrations with DEXs, lending, and yield farming
- **Advanced Data Analytics**: On-chain analysis and social media sentiment tracking
- **Smart Contract Security**: Enhanced validation and auditing tools
- **Enhanced Context Memory**: User profiles with long-term preferences
- **UI/UX Improvements**: Visual dashboards for prices and transactions
- **Formal Verification**: Integration with contract verification tools

## 📄 License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<div align="center">
  <p>Built with ❤️ for the blockchain community</p>
</div>
