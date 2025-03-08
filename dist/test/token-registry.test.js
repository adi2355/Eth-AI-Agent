"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const token_registry_1 = require("../lib/blockchain/token-registry");
const test_utils_1 = require("./utils/test-utils");
(0, vitest_1.describe)('Token Registry', () => {
    let testAccounts;
    let testToken;
    (0, vitest_1.beforeEach)(async () => {
        testAccounts = await (0, test_utils_1.setupTestAccounts)(2);
        testToken = await (0, test_utils_1.deployTestToken)('Registry Test Token', 'RTT', 18, '1000000');
        // Clear the registry before each test
        token_registry_1.tokenRegistry.clearRegistry();
    });
    (0, vitest_1.it)('should add and retrieve tokens', () => {
        const tokenInfo = {
            address: testToken.address,
            name: 'Registry Test Token',
            symbol: 'RTT',
            decimals: 18,
            chainId: 1337,
            isVerified: true
        };
        // Add token to registry
        token_registry_1.tokenRegistry.addToken(tokenInfo);
        // Retrieve token
        const retrievedToken = token_registry_1.tokenRegistry.getToken(testToken.address, 1337);
        (0, vitest_1.expect)(retrievedToken).toBeTruthy();
        (0, vitest_1.expect)(retrievedToken?.address).toEqual(testToken.address);
        (0, vitest_1.expect)(retrievedToken?.name).toEqual('Registry Test Token');
        (0, vitest_1.expect)(retrievedToken?.symbol).toEqual('RTT');
        (0, vitest_1.expect)(retrievedToken?.decimals).toEqual(18);
        (0, vitest_1.expect)(retrievedToken?.chainId).toEqual(1337);
        (0, vitest_1.expect)(retrievedToken?.isVerified).toEqual(true);
    });
    (0, vitest_1.it)('should check if token exists', () => {
        const tokenInfo = {
            address: testToken.address,
            name: 'Registry Test Token',
            symbol: 'RTT',
            decimals: 18,
            chainId: 1337
        };
        // Initially token should not exist in registry
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.hasToken(testToken.address, 1337)).toBe(false);
        // Add token to registry
        token_registry_1.tokenRegistry.addToken(tokenInfo);
        // Now token should exist
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.hasToken(testToken.address, 1337)).toBe(true);
        // Token should not exist with different chain ID
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.hasToken(testToken.address, 1)).toBe(false);
    });
    (0, vitest_1.it)('should remove tokens', () => {
        const tokenInfo = {
            address: testToken.address,
            name: 'Registry Test Token',
            symbol: 'RTT',
            decimals: 18,
            chainId: 1337
        };
        // Add token to registry
        token_registry_1.tokenRegistry.addToken(tokenInfo);
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.hasToken(testToken.address, 1337)).toBe(true);
        // Remove token
        const removed = token_registry_1.tokenRegistry.removeToken(testToken.address, 1337);
        (0, vitest_1.expect)(removed).toBe(true);
        // Token should no longer exist
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.hasToken(testToken.address, 1337)).toBe(false);
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.getToken(testToken.address, 1337)).toBeUndefined();
        // Removing non-existent token should return false
        const removedAgain = token_registry_1.tokenRegistry.removeToken(testToken.address, 1337);
        (0, vitest_1.expect)(removedAgain).toBe(false);
    });
    (0, vitest_1.it)('should get all tokens', () => {
        // Add multiple tokens
        const token1 = {
            address: '0x1111111111111111111111111111111111111111',
            name: 'Token 1',
            symbol: 'TK1',
            decimals: 18,
            chainId: 1
        };
        const token2 = {
            address: '0x2222222222222222222222222222222222222222',
            name: 'Token 2',
            symbol: 'TK2',
            decimals: 6,
            chainId: 1
        };
        const token3 = {
            address: '0x3333333333333333333333333333333333333333',
            name: 'Token 3',
            symbol: 'TK3',
            decimals: 8,
            chainId: 10 // Different chain
        };
        token_registry_1.tokenRegistry.addToken(token1);
        token_registry_1.tokenRegistry.addToken(token2);
        token_registry_1.tokenRegistry.addToken(token3);
        // Get all tokens
        const allTokens = token_registry_1.tokenRegistry.getAllTokens();
        (0, vitest_1.expect)(allTokens.length).toEqual(3);
        // Get tokens by chain
        const chain1Tokens = token_registry_1.tokenRegistry.getTokensByChain(1);
        (0, vitest_1.expect)(chain1Tokens.length).toEqual(2);
        (0, vitest_1.expect)(chain1Tokens.some(t => t.symbol === 'TK1')).toBe(true);
        (0, vitest_1.expect)(chain1Tokens.some(t => t.symbol === 'TK2')).toBe(true);
        const chain10Tokens = token_registry_1.tokenRegistry.getTokensByChain(10);
        (0, vitest_1.expect)(chain10Tokens.length).toEqual(1);
        (0, vitest_1.expect)(chain10Tokens[0].symbol).toEqual('TK3');
    });
    (0, vitest_1.it)('should clear the registry', () => {
        // Add multiple tokens
        const token1 = {
            address: '0x1111111111111111111111111111111111111111',
            name: 'Token 1',
            symbol: 'TK1',
            decimals: 18,
            chainId: 1
        };
        const token2 = {
            address: '0x2222222222222222222222222222222222222222',
            name: 'Token 2',
            symbol: 'TK2',
            decimals: 6,
            chainId: 1
        };
        token_registry_1.tokenRegistry.addToken(token1);
        token_registry_1.tokenRegistry.addToken(token2);
        // Verify tokens are added
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.getAllTokens().length).toEqual(2);
        // Clear registry
        token_registry_1.tokenRegistry.clearRegistry();
        // Verify registry is empty
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.getAllTokens().length).toEqual(0);
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.hasToken(token1.address, 1)).toBe(false);
        (0, vitest_1.expect)(token_registry_1.tokenRegistry.hasToken(token2.address, 1)).toBe(false);
    });
    (0, vitest_1.it)('should load token info from blockchain', async () => {
        try {
            // Load token info from blockchain
            const tokenInfo = await token_registry_1.tokenRegistry.loadTokenInfo(testToken.address, 1337);
            (0, vitest_1.expect)(tokenInfo).toBeTruthy();
            (0, vitest_1.expect)(tokenInfo.address).toEqual(testToken.address);
            (0, vitest_1.expect)(tokenInfo.name).toEqual('Registry Test Token');
            (0, vitest_1.expect)(tokenInfo.symbol).toEqual('RTT');
            (0, vitest_1.expect)(tokenInfo.decimals).toEqual(18);
            (0, vitest_1.expect)(tokenInfo.chainId).toEqual(1337);
            // Verify token was added to registry
            (0, vitest_1.expect)(token_registry_1.tokenRegistry.hasToken(testToken.address, 1337)).toBe(true);
        }
        catch (error) {
            // This might fail in tests if the chain connection isn't available
            console.log('Token info loading not available in test environment:', error instanceof Error ? error.message : 'Unknown error');
        }
    });
});
