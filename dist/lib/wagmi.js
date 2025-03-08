"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.publicClient = void 0;
const wagmi_1 = require("wagmi");
const chains_1 = require("wagmi/chains");
const connectors_1 = require("wagmi/connectors");
const viem_1 = require("viem");
exports.publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.mainnet,
    transport: (0, viem_1.fallback)([
        (0, viem_1.http)(),
        (0, viem_1.http)('https://eth-mainnet.g.alchemy.com/v2/demo'),
    ]),
});
exports.config = (0, wagmi_1.createConfig)({
    chains: [chains_1.mainnet],
    connectors: [
        (0, connectors_1.injected)(),
    ],
    transports: {
        [chains_1.mainnet.id]: (0, wagmi_1.http)(),
    },
});
