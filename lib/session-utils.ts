import { v4 as uuidv4 } from 'uuid';

interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements SessionStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }
}

export const SESSION_STORAGE_KEY = 'chatSessionId';

export const getStorage = (): SessionStorage => {
  if (typeof window === 'undefined') {
    return new MemoryStorage();
  }

  try {
    // Test localStorage availability
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return localStorage;
  } catch (e) {
    console.warn('localStorage not available, falling back to memory storage');
    return new MemoryStorage();
  }
};

export const initializeSession = (): string => {
  const storage = getStorage();
  const existingSession = storage.getItem(SESSION_STORAGE_KEY);
  
  if (existingSession) {
    console.log('Found existing session:', existingSession);
    return existingSession;
  }
  
  const newSession = uuidv4();
  console.log('Creating new session:', newSession);
  
  try {
    storage.setItem(SESSION_STORAGE_KEY, newSession);
  } catch (e) {
    console.error('Failed to store session:', e);
  }
  
  return newSession;
};

export const clearSession = (): void => {
  const storage = getStorage();
  try {
    storage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
};

export const validateSession = (sessionId: string | null): boolean => {
  if (!sessionId) return false;
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
};