"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNonce = generateNonce;
exports.storeNonce = storeNonce;
exports.verifyNonce = verifyNonce;
exports.verifySignature = verifySignature;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const viem_1 = require("viem");
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SESSION_DURATION = '24h';
// Store nonces in memory (use Redis in production)
const nonces = new Map();
function generateNonce() {
    return (0, crypto_1.createHash)('sha256')
        .update(Math.random().toString())
        .digest('hex');
}
function storeNonce(address) {
    const nonce = generateNonce();
    nonces.set(address.toLowerCase(), {
        value: nonce,
        expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });
    return nonce;
}
function verifyNonce(address, nonce) {
    const storedNonce = nonces.get(address.toLowerCase());
    if (!storedNonce)
        return false;
    if (Date.now() > storedNonce.expires)
        return false;
    return storedNonce.value === nonce;
}
async function verifySignature(message, signature, address) {
    try {
        const isValid = await (0, viem_1.verifyMessage)({
            message,
            signature: signature,
            address: address,
        });
        if (!isValid)
            throw new Error('Invalid signature');
        // Here you could look up the user's role in a database
        // For now, we'll assign 'basic' to all new users
        const user = {
            address,
            role: 'basic',
            nonce: generateNonce(),
        };
        return user;
    }
    catch (error) {
        throw new Error('Signature verification failed');
    }
}
function generateToken(user) {
    return jsonwebtoken_1.default.sign({
        sub: user.address,
        role: user.role,
    }, JWT_SECRET, { expiresIn: SESSION_DURATION });
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return {
            address: decoded.sub,
            role: decoded.role,
            nonce: generateNonce(),
        };
    }
    catch {
        return null;
    }
}
