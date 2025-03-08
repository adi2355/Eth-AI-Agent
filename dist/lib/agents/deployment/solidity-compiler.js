"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = compile;
const solc = __importStar(require("solc"));
async function compile(source, options = {}) {
    // Prepare compiler input
    const input = {
        language: 'Solidity',
        sources: {
            'main.sol': {
                content: source
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata']
                }
            },
            optimizer: options.optimizer || {
                enabled: false,
                runs: 200
            },
            evmVersion: options.evmVersion || 'paris'
        }
    };
    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    // Check for errors
    const errors = output.errors?.filter((error) => error.severity === 'error');
    if (errors && errors.length > 0) {
        return {
            contracts: {},
            sources: {},
            errors: output.errors
        };
    }
    return {
        contracts: output.contracts['main.sol'],
        sources: output.sources,
        errors: output.errors
    };
}
