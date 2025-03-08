Table of Contents
Project Overview
Key Features
Project Goals
Primary Objectives
Problems Addressed
Architecture & Implementation
Data Structures
Conversation Flow
Blockchain Operations
Agent Orchestration
Challenges & Fixes
Key Architectural Decisions
Installation & Setup
Environment Configuration
Development Commands
Usage
Chat Interface
Blockchain Testing
Future Work
License
Project Overview
The Blockchain AI Agent is a Next.js-based application that merges blockchain functionality with an AI-powered conversational assistant. It leverages:

OpenAI for natural language understanding and intent classification
Ethereum (Viem/Wagmi) for blockchain interactions (deploying contracts, token transfers, etc.)
External APIs (CoinGecko, CoinMarketCap) for real-time cryptocurrency market data
This microservices-inspired architecture encapsulates specialized agents for intent analysis, data aggregation, blockchain operations, and conversation context management.

Key Features
Real-Time Cryptocurrency Data
Automatically fetches live prices, market caps, trading volumes, and trends from CoinGecko or CoinMarketCap.

Smart Contract Deployment
Deploy common contract templates (ERC20, NFT collections, etc.) with simple conversational instructions.

Token Transfers & Wallet Integration
Connects to wallets (via MetaMask or mock providers), enabling ETH or token transfers directly from chat commands.

Contextual Conversation
Maintains conversation flow with user preference learning (favorite tokens, technical level) for coherent, personalized responses.

Transaction Monitoring
Tracks the state of blockchain transactions (pending, success, failed) with real-time updates.

Secure & Resilient
Implements fallback mechanisms for rate-limited APIs, robust error handling, and session-based wallet management.

Project Goals
Primary Objectives
Deliver a powerful blockchain-focused AI assistant for both novice and advanced users
Provide real-time cryptocurrency market data and analytics
Simplify smart contract deployment and token management via natural language
Offer contextual, personalized conversation flow
Problems Addressed
Reduces complexity of blockchain operations for everyday users
Consolidates cryptocurrency market data from multiple external sources
Lowers technical barriers for smart contract deployment and token transfers
Maintains conversational context across multiple queries and sessions
Provides transaction monitoring and status updates in a single interface
Architecture & Implementation
Data Structures
Intent Classification

typescript
Copy
Edit
export interface RobustAnalysis {
  originalContext: OriginalContext;
  classification: {
    primaryIntent: IntentType;
    confidence: number;
    needsApiCall: boolean;
    ambiguityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    requiresWebSearch: boolean;
  };
  queryAnalysis: {
    sanitizedQuery: string;
    detectedTokens: string[];
    comparisonRequest: ComparisonRequest;
    detectedIntents: string[];
    timeContext: TimeFrame;
    marketIndicators: string[];
    conceptualIndicators: string[];
    webSearchContext: WebSearchContext;
    detectedEntities?: string[];
    entityParams?: object;
    recipient?: string;
    amount?: string;
    tokenAddress?: string;
  };
  dataRequirements: DataRequirements;
}
Conversation Management

typescript
Copy
Edit
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    tokens?: string[];
    intent?: IntentType;
    confidence?: number;
    topics?: string[];
    entities?: string[];
    contextualHints?: string[];
    followUp?: boolean;
    referenceMessageId?: string;
    contextConfidence?: number;
  };
  id: string;
}

export interface ConversationContext {
  recentMessages: ChatMessage[];
  userPreferences: {
    favoriteTokens: string[];
    technicalLevel: string;
    interests: string[];
  };
  conversationMetrics: {
    continuityScore: number;
    dominantTopics: string[];
    messageCount: number;
  };
  currentQuery: {
    analysis: RobustAnalysis;
    relatedTopics: string[];
    detectedTokens: string[];
  };
}
Blockchain Operations

typescript
Copy
Edit
export interface TransactionRecord {
  transactionHash: `0x${string}`;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  type: 'transfer' | 'deploy';
  error?: string;
  confirmations?: number;
  
  // Transfer specific fields
  tokenAddress?: string | null;
  to?: string;
  amount?: string;
  
  // Deployment specific fields
  templateId?: string;
  contractAddress?: `0x${string}` | null;
}

export interface DeploymentResult {
  transactionHash: `0x${string}`;
  contractAddress: `0x${string}` | null;
  deploymentStatus: 'pending' | 'success' | 'failed';
  templateId?: string;
  abi: any[];
  bytecode: `0x${string}`;
  constructorArgs: any[];
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  receipt?: any;
  error?: string;
  timestamp: number;
  confirmations?: number;
}
Conversation Flow
Intent Analysis
User queries are normalized and run through OpenAI to detect intents (e.g., MARKET_DATA, DEPLOY_CONTRACT) and relevant entities (token addresses, amounts).

Contextual Understanding
Conversation history is stored, tracking user preferences (favorite tokens, technical level) and updating topics for a coherent flow.

Aggregator Calls
Once the user’s primary intent is confirmed, relevant data calls (e.g., token price, wallet connection) are executed.

Response Generation
Final responses are built using OpenAI with aggregated data, ensuring clarity and personalization based on conversation context.

Blockchain Operations
Wallet Connection
Maintains wallet sessions across HTTP requests using a SessionManager, providing both real and mock wallet functionalities.

Smart Contract Deployment
Uses prebuilt contract templates (ERC20, NFT, Simple Storage). The system compiles and deploys these templates on the specified network, then monitors transaction status.

Token Transfer
Performs token transfers by encoding ABI calls (ERC20) or transferring native ETH. Tracks each transfer’s progress (pending, success, or failed) in real time.

Agent Orchestration
AgentOrchestrator ties together:

Intent Analysis (analyzeUserQuery)
Data Aggregation (buildAggregatorCalls, executeAggregatorCalls)
Blockchain Orchestrator (deploying/transfer actions)
Conversation Context & Summarization (generateSummary)
Workflow:

sql
Copy
Edit
User Query → Intent Analysis → Data Aggregation → Blockchain Orchestrator (optional) → Response Generation → Persist & Return
Challenges & Fixes
Challenge	Solution
API Rate Limiting	Implemented fallback providers (CoinGecko, CoinMarketCap) and exponential backoff retries
Wallet Connection Persistence	Introduced SessionManager to store wallet connections in a stateless environment
Transaction Status Monitoring	Event-based system to track and update transaction state
Conversation Coherence	Created scoring system (continuityScore) to maintain contextual flow
Smart Contract Security	Basic validation checks (common vulnerabilities, contract compilation)
Error Handling	Robust classification of errors (network, rate limit, etc.) with retry/fallback logic
Server/Client Environment Differences	Separate code paths for client-side wallet connections vs. server mocks
Key Architectural Decisions
Microservices-Inspired Architecture
Separate “agents” handle specialized tasks (intent, aggregator, blockchain).
Session-Based Wallet Management
Preserves wallet connections across the inherently stateless Next.js environment.
Comprehensive Mock System
Enables development & testing without actual blockchain dependencies.
Event-Based Transaction Monitoring
Real-time broadcasting of transaction updates to front-end components.
Contextual Conversation
Stores and analyzes conversation flow and user preferences to maintain continuity.
Installation & Setup
Clone this repository, then install all dependencies:

bash
Copy
Edit
git clone https://github.com/YourUsername/blockchain-ai-agent.git
cd blockchain-ai-agent
npm install
Environment Configuration
Create a .env file in the project root with the following (sample values shown):

ini
Copy
Edit
OPENAI_API_KEY=YOUR_OPENAI_KEY
COINGECKO_API_KEY=YOUR_COINGECKO_KEY
COINMARKETCAP_API_KEY=YOUR_COINMARKETCAP_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/demo
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/demo
(You can also configure environment variables for Hardhat, Etherscan, etc. as needed.)

Development Commands
bash
Copy
Edit
# Run the development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint the codebase
npm run lint
Usage
Chat Interface
Run: npm run dev
Open: http://localhost:3000
Chat with the assistant to:
Retrieve token prices
Compare cryptocurrencies
Connect a wallet and send tokens
Deploy a smart contract (ERC20, NFT, etc.)
Blockchain Testing
Local environment testing requires Hardhat:

bash
Copy
Edit
# Start local Hardhat blockchain node
npm run blockchain:node

# Deploy test contracts to local node
npm run blockchain:deploy

# Run blockchain test suite
npm run blockchain:test
For a quick demonstration, visit <your_url>/blockchain-test to interact with mock wallets and track transactions in real time.

Future Work
Enhanced Multi-Chain Support
Add integrations for Polygon, BSC, Arbitrum, Optimism and bridging functionality.
Advanced Data Analytics
Implement deeper technical analysis, on-chain DeFi monitoring, and sentiment analysis.
Security & Verification
Comprehensive formal verification pipeline for deployed contracts
Multi-sig wallet and advanced governance features
Voice Commands
Enable speech-to-text for a more immersive user experience.
Performance Optimizations
Caching, streaming responses, and more efficient context management for large conversation histories.
License
This project is licensed under the MIT License. See the LICENSE file for details.
