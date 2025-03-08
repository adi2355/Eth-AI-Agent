"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSession = exports.clearSession = exports.initializeSession = exports.getStorage = exports.SESSION_STORAGE_KEY = void 0;
const uuid_1 = require("uuid");
class MemoryStorage {
    constructor() {
        this.storage = new Map();
    }
    getItem(key) {
        return this.storage.get(key) || null;
    }
    setItem(key, value) {
        this.storage.set(key, value);
    }
    removeItem(key) {
        this.storage.delete(key);
    }
}
exports.SESSION_STORAGE_KEY = 'chatSessionId';
const getStorage = () => {
    if (typeof window === 'undefined') {
        return new MemoryStorage();
    }
    try {
        // Test localStorage availability
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return localStorage;
    }
    catch (e) {
        console.warn('localStorage not available, falling back to memory storage');
        return new MemoryStorage();
    }
};
exports.getStorage = getStorage;
const initializeSession = () => {
    const storage = (0, exports.getStorage)();
    const existingSession = storage.getItem(exports.SESSION_STORAGE_KEY);
    if (existingSession) {
        console.log('Found existing session:', existingSession);
        return existingSession;
    }
    const newSession = (0, uuid_1.v4)();
    console.log('Creating new session:', newSession);
    try {
        storage.setItem(exports.SESSION_STORAGE_KEY, newSession);
    }
    catch (e) {
        console.error('Failed to store session:', e);
    }
    return newSession;
};
exports.initializeSession = initializeSession;
const clearSession = () => {
    const storage = (0, exports.getStorage)();
    try {
        storage.removeItem(exports.SESSION_STORAGE_KEY);
    }
    catch (e) {
        console.error('Failed to clear session:', e);
    }
};
exports.clearSession = clearSession;
const validateSession = (sessionId) => {
    if (!sessionId)
        return false;
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(sessionId);
};
exports.validateSession = validateSession;
