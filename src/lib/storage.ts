// MMKV Storage wrapper
// Note: Requires native build (expo prebuild) to work properly
let MMKV: any;
try {
  // @ts-ignore - MMKV requires native modules
  MMKV = require('react-native-mmkv').MMKV;
} catch (e) {
  // Fallback for type checking before native build
  MMKV = class {
    constructor() {}
    getString() { return null; }
    set() {}
    delete() {}
  };
}

export const storage = new MMKV({
  id: 'my2light-storage',
});

export const StorageKeys = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  VIDEOS: 'videos',
  SETTINGS: 'settings',
} as const;

export function getJSON<T>(key: string): T | null {
  try {
    const value = storage.getString(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to parse JSON for key "${key}":`, error);
    // Delete corrupted data to prevent repeated errors
    storage.delete(key);
    return null;
  }
}

export function setJSON<T>(key: string, value: T): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to set JSON for key "${key}":`, error);
    throw error; // Re-throw so caller knows the operation failed
  }
}
