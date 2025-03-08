"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContract = validateContract;
exports.validateTransaction = validateTransaction;
// Basic patterns to check for common security issues
const SECURITY_PATTERNS = [
    {
        pattern: /selfdestruct|suicide/i,
        severity: 'high',
        title: 'Self-destruct found',
        description: 'The contract contains a self-destruct function which can permanently destroy the contract.'
    },
    {
        pattern: /tx\.origin/i,
        severity: 'high',
        title: 'tx.origin used for authentication',
        description: 'Using tx.origin for authentication is vulnerable to phishing attacks.'
    },
    {
        pattern: /block\.(timestamp|number|difficulty)/i,
        severity: 'medium',
        title: 'Block properties used as source of randomness',
        description: 'Block properties like timestamp, number, or difficulty are not secure sources of randomness.'
    },
    {
        pattern: /function\s+\w+\s*\(\s*\)\s*public\s+payable\s*\{\s*\}/i,
        severity: 'medium',
        title: 'Empty payable function',
        description: 'Contract has an empty payable function which can lock funds.'
    },
    {
        pattern: /assembly\s*\{/i,
        severity: 'medium',
        title: 'Assembly code used',
        description: 'Contract uses assembly code which bypasses Solidity safety features.'
    },
    {
        pattern: /\.call\.value\s*\(/i,
        severity: 'medium',
        title: 'Low-level call with value',
        description: 'Low-level calls with value can lead to reentrancy attacks if not properly guarded.'
    },
    {
        pattern: /\.transfer\s*\(/i,
        severity: 'low',
        title: 'Transfer used',
        description: 'Consider using call instead of transfer as transfer has a gas limit of 2300 gas.'
    },
    {
        pattern: /pragma\s+solidity\s+(\^|>|>=|<|<=)\s*0\.8/i,
        severity: 'info',
        title: 'Solidity version',
        description: 'Contract uses Solidity version 0.8.x which has built-in overflow protection.'
    }
];
// Validate a contract for security issues
async function validateContract(source) {
    const issues = [];
    // Check for security patterns
    for (const pattern of SECURITY_PATTERNS) {
        const matches = source.match(pattern.pattern);
        if (matches) {
            issues.push({
                severity: pattern.severity,
                title: pattern.title,
                description: pattern.description
            });
        }
    }
    // Check for reentrancy vulnerabilities
    if (source.includes('.call{value:') &&
        !source.includes('ReentrancyGuard') &&
        !source.includes('nonReentrant')) {
        issues.push({
            severity: 'high',
            title: 'Potential reentrancy vulnerability',
            description: 'Contract uses .call{value:} without reentrancy protection. Consider using ReentrancyGuard.'
        });
    }
    // Check for unchecked external calls
    if ((source.includes('.call(') || source.includes('.call{')) &&
        !source.match(/require\s*\(\s*\w+\s*\)/)) {
        issues.push({
            severity: 'medium',
            title: 'Unchecked external call',
            description: 'External call result is not checked. Always verify the return value of low-level calls.'
        });
    }
    // Check for unbounded loops
    if (source.match(/for\s*\(\s*.*;\s*.*;\s*.*\)/)) {
        const hasArrayLength = source.match(/for\s*\(\s*.*;\s*\w+\s*<\s*\w+\.length/);
        if (hasArrayLength) {
            issues.push({
                severity: 'medium',
                title: 'Potentially unbounded loop',
                description: 'Loop over array without fixed bounds could run out of gas for large arrays.'
            });
        }
    }
    // Check for proper visibility
    if (source.match(/function\s+\w+\s*\([^)]*\)\s*\{/)) {
        issues.push({
            severity: 'medium',
            title: 'Missing function visibility',
            description: 'Functions without explicit visibility default to public.'
        });
    }
    // Check for state variables without visibility
    if (source.match(/^\s*\w+\s+\w+\s*;/m)) {
        issues.push({
            severity: 'low',
            title: 'State variable missing visibility',
            description: 'State variables should have explicit visibility (public, private, internal).'
        });
    }
    // Determine if the contract is valid based on high severity issues
    const hasHighSeverityIssues = issues.some(issue => issue.severity === 'high');
    return {
        valid: !hasHighSeverityIssues,
        issues
    };
}
// Validate a transaction before sending
async function validateTransaction(to, value, data) {
    const issues = [];
    // Check if sending to address(0)
    if (to === '0x0000000000000000000000000000000000000000') {
        issues.push({
            severity: 'high',
            title: 'Sending to zero address',
            description: 'Transaction is sending to the zero address, which will burn the funds.'
        });
    }
    // Check if sending a large amount of ETH
    if (value > 10000000000000000000n) { // > 10 ETH
        issues.push({
            severity: 'medium',
            title: 'Large value transfer',
            description: 'Transaction is sending a large amount of ETH. Please verify the recipient address.'
        });
    }
    // Check if the transaction has data but no value (potential contract interaction)
    if (data && data !== '0x' && value === 0n) {
        // This is likely a contract interaction, which is fine
    }
    // Check if the transaction has both value and data (potential contract interaction with value)
    if (data && data !== '0x' && value > 0n) {
        issues.push({
            severity: 'low',
            title: 'Contract interaction with value',
            description: 'Transaction is sending ETH to a contract. Ensure the contract can handle ETH transfers.'
        });
    }
    return {
        valid: !issues.some(issue => issue.severity === 'high'),
        issues
    };
}
