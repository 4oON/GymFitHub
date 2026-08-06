/**
 * iOS Storage Service
 * 
 * Handles iOS WebView/Capacitor storage restrictions:
 * 1. iOS private mode disables localStorage
 * 2. iOS WebView may have storage quota restrictions
 * 3. Data should persist across app restarts
 * 
 * Strategy:
 * - Try localStorage first
 * - Fall back to memory storage if localStorage fails
 * - Always keep memory cache for fast access
 * - Sync memory -> localStorage when possible
 */

// Memory cache for iOS fallback
const memoryCache: Record<string, string> = {};

// Safe localStorage wrapper with iOS compatibility
export const iOSStorage = {
  /**
   * Get item from storage (localStorage -> memory fallback)
   */
  getItem(key: string): string | null {
    try {
      // Try localStorage first
      const value = localStorage.getItem(key);
      if (value !== null) {
        // Sync to memory cache
        memoryCache[key] = value;
        return value;
      }
    } catch (e) {
      console.warn(`[iOSStorage] localStorage.getItem('${key}') failed:`, e);
    }
    
    // Fallback to memory cache
    if (memoryCache[key] !== undefined) {
      console.log(`[iOSStorage] Using memory cache for '${key}'`);
      return memoryCache[key];
    }
    
    return null;
  },

  /**
   * Set item to storage (localStorage + memory cache)
   */
  setItem(key: string, value: string): boolean {
    // Always update memory cache
    memoryCache[key] = value;
    
    try {
      // Try localStorage
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[iOSStorage] localStorage.setItem('${key}') failed, using memory only:`, e);
      return false;
    }
  },

  /**
   * Remove item from storage
   */
  removeItem(key: string): boolean {
    delete memoryCache[key];
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[iOSStorage] localStorage.removeItem('${key}') failed:`, e);
      return false;
    }
  },

  /**
   * Clear all storage
   */
  clear(): boolean {
    Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
    
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.warn('[iOSStorage] localStorage.clear() failed:', e);
      return false;
    }
  }
};

/**
 * Safe JSON parse with fallback
 */
export function safeParseJSON<T>(key: string, fallback: T): T {
  try {
    const saved = iOSStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
  } catch (e) {
    console.error(`[safeParseJSON] Error parsing '${key}':`, e);
  }
  return fallback;
}

/**
 * Safe JSON stringify and save
 */
export function safeSaveJSON<T>(key: string, value: T): boolean {
  try {
    const jsonString = JSON.stringify(value);
    return iOSStorage.setItem(key, jsonString);
  } catch (e) {
    console.error(`[safeSaveJSON] Error saving '${key}':`, e);
    return false;
  }
}

/**
 * Check if storage is working properly
 */
export function checkStorageHealth(): { localStorage: boolean; memoryCache: boolean } {
  const testKey = '_storage_test_';
  const testValue = 'test';
  
  let localStorageWorking = false;
  try {
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    localStorageWorking = retrieved === testValue;
  } catch (e) {
    localStorageWorking = false;
  }
  
  return {
    localStorage: localStorageWorking,
    memoryCache: true // Memory cache always works
  };
}

export default iOSStorage;
