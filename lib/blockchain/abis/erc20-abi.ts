// ERC20 ABI
export const erc20Abi = [
  // Read-only functions
  {
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string', name: '' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string', name: '' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8', name: '' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ type: 'address', name: 'account' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { type: 'address', name: 'owner' },
      { type: 'address', name: 'spender' }
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Write functions
  {
    inputs: [
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'amount' }
    ],
    name: 'transfer',
    outputs: [{ type: 'bool', name: '' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { type: 'address', name: 'sender' },
      { type: 'address', name: 'recipient' },
      { type: 'uint256', name: 'amount' }
    ],
    name: 'transferFrom',
    outputs: [{ type: 'bool', name: '' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { type: 'address', name: 'spender' },
      { type: 'uint256', name: 'amount' }
    ],
    name: 'approve',
    outputs: [{ type: 'bool', name: '' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, type: 'address', name: 'from' },
      { indexed: true, type: 'address', name: 'to' },
      { indexed: false, type: 'uint256', name: 'value' }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, type: 'address', name: 'owner' },
      { indexed: true, type: 'address', name: 'spender' },
      { indexed: false, type: 'uint256', name: 'value' }
    ],
    name: 'Approval',
    type: 'event'
  }
] as const; 