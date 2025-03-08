Blockchain AI Agent
An advanced AI-driven conversational assistant that integrates directly with the Ethereum blockchain to provide:

Real-time cryptocurrency market data
Smart contract deployment and token transfers
Contextual, conversational AI interactions
Personalized insights based on user preferences
Persistent wallet connections for blockchain operations
This project leverages Next.js for the frontend and server routes, OpenAI for natural language processing, and Viem/Wagmi for robust Ethereum blockchain interactions.

Table of Contents
Overview
Features
Architecture
Getting Started
Environment Setup
Project Structure
How It Works
Usage
Testing
Future Improvements
License
Overview
The Blockchain AI Agent aims to reduce complexity for users interacting with blockchain technologies. Its primary goal is to offer a fluid, conversational interface that can fetch cryptocurrency data, deploy smart contracts, manage token transfers, and more — all through natural language queries.

Primary Objectives
Easy Onboarding: Allow both novices and experts to seamlessly interact with Ethereum.
Conversational AI: Maintain coherent, context-sensitive conversations that adapt to user preferences over time.
Real-Time Data: Show up-to-date cryptocurrency prices, market caps, volumes, and other metrics.
Blockchain Operations: Deploy ERC20 tokens or NFT contracts, transfer tokens, and connect wallets via chat commands.
Transaction Monitoring: Track transaction statuses and confirmations in real-time.
Problems Addressed
Blockchain Complexity: Simplifies advanced blockchain tasks (e.g., contract deployment) to a chat-based format.
Fragmented Data: Aggregates market data from multiple providers (CoinGecko, CoinMarketCap).
Context Loss: Maintains conversation flow to reduce repetitive instructions.
Transaction Visibility: Provides live updates on blockchain transactions within the chat interface.
Features
Natural Language Intent Analysis
Utilizes OpenAI to classify user queries (price checks, contract deployments, wallet interactions, etc.).

Smart Contract Deployment
Choose from predefined contract templates (ERC20, ERC721, SimpleStorage) and deploy with minimal user input.

Token Transfers
Send ETH or tokens from within the chat. The system automatically decodes addresses and amounts from user requests.

Persistent Wallet Connections
Maintains wallet sessions across API calls, supporting both mock wallets for testing and real wallets (e.g., MetaMask).

Transaction Monitoring
Logs transactions (transfers/deployments) and updates status in real time (pending, success, or failed).

Advanced Conversation Context
Stores message history, user preferences (favorite tokens, technical level), and conversation metrics (dominant topics, continuity score).

Error Handling & API Fallbacks
Resilient approach to handle rate limits and provider failures by switching between CoinGecko and CoinMarketCap.

Architecture
scss
Copy
Edit
┌─────────────────────────────────────┐
│  User Interface (Next.js + React)  │
│       (Chat, Wallet, Transfers)    │
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
│Analysis│   │Aggregation│ │Orchestratr│
└──┬────┘    └───┬───┘     └────┬─────┘
   │             │              │
   │         ┌───▼───┐     ┌────▼─────┐
   └────────►│Response│     │Session   │
             │Generator    │Manager   │
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
API Endpoints:

/api/chat: Main endpoint for handling chat-based queries.
/api/blockchain: Handles wallet connections, token transfers, and contract deployments.
Agent Orchestrator:

Intent Analysis: Uses OpenAI to classify user queries and extract relevant entities (tokens, addresses, amounts).
Data Aggregation: Fetches market data from external APIs (CoinGecko, CoinMarketCap).
Blockchain Orchestration: Executes contract deployments, token transfers, and wallet operations via specialized agents.
Response Generation: Summarizes or formats the final response with context from the conversation store.
Session Manager:

Maintains wallet sessions across stateless Next.js routes.
Allows persistent connections for mock or real wallets.
Conversation Store:

Stores recent messages and conversation metadata (favorite tokens, continuity score).
Used to produce context-aware responses and follow-up suggestions.
Transaction Agents:

TokenTransferAgent: Manages token or ETH transfers and tracks statuses.
ContractDeploymentAgent: Deploys templates (ERC20, ERC721, etc.) and updates transaction records in real-time.
Getting Started
Prerequisites
Node.js >= 18 and npm
OpenAI API Key
CoinGecko/CoinMarketCap API Keys (optional but recommended to avoid rate-limit issues)
Ethereum RPC Provider (e.g., Alchemy, Infura, or local Hardhat node)
Installation
Clone the repository:

bash
Copy
Edit
git clone https://github.com/your-organization/blockchain-ai-agent.git
cd blockchain-ai-agent
Install dependencies:

bash
Copy
Edit
npm install
Environment Variables: Create a .env file in the project root:

bash
Copy
Edit
OPENAI_API_KEY=your_openai_key
COINGECKO_API_KEY=your_coingecko_key
COINMARKETCAP_API_KEY=your_coinmarketcap_key
MAINNET_RPC_URL=your_mainnet_rpc_url
SEPOLIA_RPC_URL=your_sepolia_rpc_url
USE_BLOCKCHAIN_MOCKS=true
USE_BLOCKCHAIN_MOCKS can be set to true to bypass real blockchain transactions during development/testing.
Development Server:

bash
Copy
Edit
npm run dev
This starts the Next.js dev server on http://localhost:3000.

Environment Setup
Local Hardhat Node (optional):
Run a local Ethereum blockchain in another terminal:

bash
Copy
Edit
npm run blockchain:node
Deploy Test Contracts:

bash
Copy
Edit
npm run blockchain:deploy
Mock vs. Real Wallet:

Mock: Set USE_BLOCKCHAIN_MOCKS=true in your .env to simulate wallet interactions.
Real: Provide MAINNET_RPC_URL or SEPOLIA_RPC_URL in .env and set USE_BLOCKCHAIN_MOCKS=false.
Project Structure
bash
Copy
Edit
.
├─ app/                        # Next.js application routes
│  ├─ api/                     # API routes for chat & blockchain
│  │  ├─ chat/route.ts         # Main chat endpoint
│  │  ├─ blockchain/route.ts   # Blockchain operations endpoint
│  │  └─ ...
│  ├─ blockchain-test/         # UI for local blockchain testing
│  └─ ...
├─ components/                 # Reusable React components
├─ lib/
│  ├─ agents/                  # Specialized 'agent' modules
│  │  ├─ aggregator.ts         # Data aggregator logic
│  │  ├─ blockchain-orchestrator.ts
│  │  ├─ deployment/           # Contract deployment pipeline
│  │  ├─ transaction/          # Token transfer pipeline
│  │  └─ intent.ts             # OpenAI-based intent classification
│  ├─ blockchain/              # Wallet & blockchain integration
│  ├─ conversation-store.ts    # Conversation persistence & context
│  ├─ orchestrator.ts          # High-level orchestration pipeline
│  └─ ...
├─ test/                       # Test files
├─ hardhat.config.ts           # Hardhat configuration
├─ package.json
└─ README.md
Key directories and files:

app/api/chat/route.ts – Central route for user queries.
app/api/blockchain/route.ts – Responsible for wallet connections, token transfers, and contract deployments.
lib/agents/ – Modules handling AI classification, data fetching, and blockchain logic.
lib/blockchain/ – Lower-level blockchain integration (wallet services, token registry).
lib/conversation-store.ts – Maintains conversation state and user preferences.
hardhat.config.ts – Local blockchain testing setup.
How It Works
User Query (e.g., "Deploy an ERC20 token with name MyToken"):
The text is sent to the /api/chat endpoint.

Intent Classification:
The system uses OpenAI to parse the query, identify the main intent (DEPLOY_CONTRACT, TRANSFER_TOKENS, etc.), and extract parameters (token name, symbol, supply).

Blockchain Orchestration:

If needed, the orchestrator triggers relevant agents (e.g., contract deployment, token transfer) with the extracted parameters.
Maintains a session-based wallet connection to perform transactions.
Data Aggregation:
For market data queries, aggregator modules fetch prices and other metrics from external APIs (CoinGecko, CoinMarketCap).

Response Generation:
Summarizes results into a user-facing message, with conversation context (previous queries, user preferences) included.

Conversation Continuity:
The conversation store logs each message, maintaining topics, user preferences (favorite tokens, technical level), and more to provide coherent follow-up responses.

Usage
Chat Interface:
Go to http://localhost:3000 after starting the dev server.

Ask about prices: e.g., "What's the price of Ethereum?"
Deploy a token: e.g., "Deploy an ERC20 token called MyToken"
Transfer tokens: e.g., "Send 0.01 ETH to 0xABC123..."
Connect wallet: e.g., "Connect my wallet"
Blockchain Test Page:
Visit http://localhost:3000/blockchain-test for direct debugging:

Connect a mock or real wallet.
Transfer tokens or deploy contracts.
View transaction history and confirmations.
Testing
Local Hardhat Testing:

npm run blockchain:node to start a local Hardhat node.
npm run blockchain:deploy to deploy sample contracts.
npm run blockchain:test to run the blockchain-focused tests.
Agent Tests:

bash
Copy
Edit
npm run test:agents
Runs the AI agent and orchestrator tests.

Frontend Testing (planned): Integration tests using Playwright or Cypress can be set up for the Next.js interface.

Future Improvements
Multi-Chain Support: Extend beyond Ethereum mainnet/testnets (e.g., Polygon, Arbitrum).
Voice Interface: Allow spoken requests and responses.
Security Enhancements: More sophisticated validation and user authorization for contract deployments.
Advanced Analytics: Integrate on-chain DeFi analytics and sentiment analysis from Twitter/Reddit.
Expanded Contract Templates: Include DEX, governance, or advanced DeFi protocols.
License
Distributed under the MIT License. See LICENSE for more information.
