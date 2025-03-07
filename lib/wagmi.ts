"use client";

import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { createPublicClient, fallback, http as viemHttp } from 'viem';

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    viemHttp(),
    viemHttp('https://eth-mainnet.g.alchemy.com/v2/demo'),
  ]),
});

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
  },
});