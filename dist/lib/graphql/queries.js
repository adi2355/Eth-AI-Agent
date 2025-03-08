"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RECENT_TRANSACTIONS = exports.TOKEN_DATA = exports.TOP_SWAPS = void 0;
const graphql_request_1 = require("graphql-request");
exports.TOP_SWAPS = (0, graphql_request_1.gql) `
  query GetTopSwaps($startTime: Int!, $first: Int!, $skip: Int!) {
    swaps(
      first: $first
      skip: $skip
      orderBy: amountUSD
      orderDirection: desc
      where: { timestamp_gt: $startTime }
    ) {
      id
      timestamp
      amountUSD
      pair {
        token0 {
          symbol
        }
        token1 {
          symbol
        }
      }
    }
  }
`;
exports.TOKEN_DATA = (0, graphql_request_1.gql) `
  query GetTokenData($tokenAddress: String!) {
    token(id: $tokenAddress) {
      id
      symbol
      name
      totalSupply
      tradeVolume
      tradeVolumeUSD
      totalLiquidity
      txCount
      derivedETH
    }
  }
`;
exports.RECENT_TRANSACTIONS = (0, graphql_request_1.gql) `
  query GetRecentTransactions($first: Int!, $skip: Int!) {
    transactions(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      timestamp
      mints {
        amount0
        amount1
        pair {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
      }
      swaps {
        amountUSD
        pair {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
      }
      burns {
        amount0
        amount1
        pair {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
      }
    }
  }
`;
