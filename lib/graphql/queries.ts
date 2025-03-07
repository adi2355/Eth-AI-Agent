import { gql } from 'graphql-request';

export const TOP_SWAPS = gql`
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

export const TOKEN_DATA = gql`
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

export const RECENT_TRANSACTIONS = gql`
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