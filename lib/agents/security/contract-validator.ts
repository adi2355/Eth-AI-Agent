// Security issue interface
export interface SecurityIssue {
  severity: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  line?: number;
  column?: number;
}

// Validation result interface
export interface ValidationResult {
  valid: boolean;
  issues: SecurityIssue[];
}

// Basic patterns to check for common security issues
const SECURITY_PATTERNS = [
  {
    pattern: /selfdestruct|suicide/i,
    severity: 'high' as const,
    title: 'Self-destruct found',
    description: 'The contract contains a self-destruct function which can permanently destroy the contract.'
  },
  {
    pattern: /tx\.origin/i,
    severity: 'high' as const,
    title: 'tx.origin used for authentication',
    description: 'Using tx.origin for authentication is vulnerable to phishing attacks.'
  },
  {
    pattern: /block\.(timestamp|number|difficulty)/i,
    severity: 'medium' as const,
    title: 'Block properties used as source of randomness',
    description: 'Block properties like timestamp, number, or difficulty are not secure sources of randomness.'
  },
  {
    pattern: /function\s+\w+\s*\(\s*\)\s*public\s+payable\s*\{\s*\}/i,
    severity: 'medium' as const,
    title: 'Empty payable function',
    description: 'Contract has an empty payable function which can lock funds.'
  },
  {
    pattern: /assembly\s*\{/i,
    severity: 'medium' as const,
    title: 'Assembly code used',
    description: 'Contract uses assembly code which bypasses Solidity safety features.'
  },
  {
    pattern: /\.call\.value\s*\(/i,
    severity: 'medium' as const,
    title: 'Low-level call with value',
    description: 'Low-level calls with value can lead to reentrancy attacks if not properly guarded.'
  },
  {
    pattern: /\.transfer\s*\(/i,
    severity: 'low' as const,
    title: 'Transfer used',
    description: 'Consider using call instead of transfer as transfer has a gas limit of 2300 gas.'
  },
  {
    pattern: /pragma\s+solidity\s+(\^|>|>=|<|<=)\s*0\.8/i,
    severity: 'info' as const,
    title: 'Solidity version',
    description: 'Contract uses Solidity version 0.8.x which has built-in overflow protection.'
  }
];

/**
 * Validate contract ABI and bytecode
 * @param abiOrSource Contract ABI or source code
 * @param bytecode Contract bytecode (optional)
 * @returns Validation result
 */
export function validateContract(abiOrSource: any, bytecode?: string): ValidationResult {
  try {
    // Determine if we're validating source code or ABI
    const isSourceCode = typeof abiOrSource === 'string' && !abiOrSource.startsWith('[');
    
    if (isSourceCode) {
      // Validate source code
      return validateSourceCode(abiOrSource);
    } else {
      // Validate ABI
      return validateABI(abiOrSource, bytecode);
    }
  } catch (error) {
    console.error('Contract validation error:', error);
    return {
      valid: false,
      issues: [{
        severity: 'high',
        title: 'Validation error',
        description: `Failed to validate contract: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]
    };
  }
}

/**
 * Validate contract source code
 * @param source Contract source code
 * @returns Validation result
 */
function validateSourceCode(source: string): ValidationResult {
  // Start with empty issues array
  const issues: SecurityIssue[] = [];
  
  // Check for security patterns in the source code
  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.pattern.test(source)) {
      issues.push({
        severity: pattern.severity,
        title: pattern.title,
        description: pattern.description
      });
    }
  }
  
  // Check for high-risk patterns more precisely (with context)
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for reentrancy vulnerabilities
    if (
      /\.call\s*\{/.test(line) &&
      !/(\s|^)if\s*\(/.test(line) &&
      !/(return|revert|require)\s/.test(line)
    ) {
      // Look for state changes after external calls
      let j = i + 1;
      let stateChangeAfterCall = false;
      
      while (j < Math.min(lines.length, i + 10)) {
        if (/\=\s/.test(lines[j])) {
          stateChangeAfterCall = true;
          break;
        }
        j++;
      }
      
      if (stateChangeAfterCall) {
        issues.push({
          severity: 'high',
          title: 'Potential reentrancy vulnerability',
          description: 'External call is followed by state changes, which could lead to reentrancy attacks.',
          line: i + 1
        });
      }
    }
  }
  
  return {
    valid: issues.filter(issue => issue.severity === 'high').length === 0,
    issues
  };
}

/**
 * Validate contract ABI and bytecode
 * @param abi Contract ABI
 * @param bytecode Contract bytecode
 * @returns Validation result
 */
function validateABI(abi: any, bytecode?: string): ValidationResult {
  const issues: SecurityIssue[] = [];
  
  // Check for common issues in ABI
  try {
    // Parse ABI if it's a string
    const parsedAbi = typeof abi === 'string' ? JSON.parse(abi) : abi;
    
    // Check for payable fallback function
    const hasFallback = parsedAbi.some((item: any) => 
      item.type === 'fallback' && item.stateMutability === 'payable'
    );
    
    if (hasFallback) {
      issues.push({
        severity: 'medium',
        title: 'Payable fallback function',
        description: 'Contract has a payable fallback function which can receive ETH without explicit function calls.'
      });
    }
    
    // Check for selfdestruct
    const hasSelfDestruct = parsedAbi.some((item: any) => 
      item.type === 'function' && 
      (item.name === 'selfdestruct' || item.name === 'suicide' || 
       item.name.toLowerCase().includes('destruct') || item.name.toLowerCase().includes('kill'))
    );
    
    if (hasSelfDestruct) {
      issues.push({
        severity: 'high',
        title: 'Self-destruct function',
        description: 'Contract contains a function that may destroy the contract permanently.'
      });
    }
  } catch (error) {
    issues.push({
      severity: 'medium',
      title: 'Invalid ABI',
      description: 'Could not parse the contract ABI.'
    });
  }
  
  // Check bytecode if provided
  if (bytecode) {
    // Check if bytecode is empty
    if (bytecode === '0x' || bytecode === '') {
      issues.push({
        severity: 'high',
        title: 'Empty bytecode',
        description: 'Contract bytecode is empty, which means it cannot be deployed.'
      });
    }
    
    // Additional bytecode checks can be added here
  }
  
  return {
    valid: issues.filter(issue => issue.severity === 'high').length === 0,
    issues
  };
}

/**
 * Validate transaction parameters
 * @param to Recipient address
 * @param value Transaction value
 * @param data Transaction data (optional)
 * @returns Validation result
 */
export function validateTransaction(
  to: string, 
  value: bigint,
  data?: string
): ValidationResult {
  const issues: SecurityIssue[] = [];
  
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