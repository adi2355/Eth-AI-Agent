export declare const erc20Abi: readonly [{
    readonly inputs: readonly [];
    readonly name: "name";
    readonly outputs: readonly [{
        readonly type: "string";
        readonly name: "";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "symbol";
    readonly outputs: readonly [{
        readonly type: "string";
        readonly name: "";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly type: "uint8";
        readonly name: "";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalSupply";
    readonly outputs: readonly [{
        readonly type: "uint256";
        readonly name: "";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "account";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly type: "uint256";
        readonly name: "";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "owner";
    }, {
        readonly type: "address";
        readonly name: "spender";
    }];
    readonly name: "allowance";
    readonly outputs: readonly [{
        readonly type: "uint256";
        readonly name: "";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "recipient";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly name: "transfer";
    readonly outputs: readonly [{
        readonly type: "bool";
        readonly name: "";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "sender";
    }, {
        readonly type: "address";
        readonly name: "recipient";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly name: "transferFrom";
    readonly outputs: readonly [{
        readonly type: "bool";
        readonly name: "";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "spender";
    }, {
        readonly type: "uint256";
        readonly name: "amount";
    }];
    readonly name: "approve";
    readonly outputs: readonly [{
        readonly type: "bool";
        readonly name: "";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly type: "address";
        readonly name: "from";
    }, {
        readonly indexed: true;
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly indexed: false;
        readonly type: "uint256";
        readonly name: "value";
    }];
    readonly name: "Transfer";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly type: "address";
        readonly name: "owner";
    }, {
        readonly indexed: true;
        readonly type: "address";
        readonly name: "spender";
    }, {
        readonly indexed: false;
        readonly type: "uint256";
        readonly name: "value";
    }];
    readonly name: "Approval";
    readonly type: "event";
}];
