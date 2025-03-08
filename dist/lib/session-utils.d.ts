interface SessionStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export declare const SESSION_STORAGE_KEY = "chatSessionId";
export declare const getStorage: () => SessionStorage;
export declare const initializeSession: () => string;
export declare const clearSession: () => void;
export declare const validateSession: (sessionId: string | null) => boolean;
export {};
