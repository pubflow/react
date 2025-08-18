/**
 * Persistent Cache Utility for React
 *
 * Provides a way to persist SWR cache between page refreshes and browser sessions
 */

import { Cache } from 'swr';

/**
 * Options for persistent cache
 */
export interface PersistentCacheOptions {
  /**
   * Prefix for storage keys
   */
  prefix?: string;

  /**
   * Time to live in milliseconds
   * Default: 24 hours
   */
  ttl?: number;

  /**
   * Maximum size of a cache item in bytes
   * Default: 2MB
   */
  maxItemSize?: number;

  /**
   * Whether to compress cache data to save space
   * Default: false
   */
  compress?: boolean;

  /**
   * Custom serialization function
   * Default: JSON.stringify
   */
  serialize?: (data: any) => string;

  /**
   * Custom deserialization function
   * Default: JSON.parse
   */
  deserialize?: (text: string) => any;

  /**
   * Whether to log cache operations
   * Default: false
   */
  debug?: boolean;

  /**
   * Storage mechanism to use
   * Default: 'localStorage'
   */
  storage?: 'localStorage' | 'sessionStorage';
}

/**
 * Creates a persistent cache provider for SWR
 *
 * @param options Cache options
 * @returns SWR cache provider
 */
export function createPersistentCache(options: PersistentCacheOptions = {}): () => Cache {
  const {
    prefix = 'pubflow_react_cache',
    ttl = 24 * 60 * 60 * 1000, // 24 hours
    maxItemSize = 2 * 1024 * 1024, // 2MB
    compress = false,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    debug = false,
    storage = 'localStorage'
  } = options;

  // Helper for logging if debug is enabled
  const log = (message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[PersistentCache] ${message}`, ...args);
    }
  };

  // Compression utilities
  const compression = {
    compress: (data: string): string => {
      if (!compress) return data;

      try {
        // Simple base64 compression - in production you might want to use a proper compression library
        return btoa(encodeURIComponent(data));
      } catch (error) {
        log('Compression error', error);
        return data;
      }
    },

    decompress: (data: string): string => {
      if (!compress) return data;

      try {
        return decodeURIComponent(atob(data));
      } catch (error) {
        log('Decompression error', error);
        return data;
      }
    }
  };

  // Get the appropriate storage object
  const getStorageObject = (): Storage | null => {
    if (typeof window === 'undefined') return null;

    return storage === 'sessionStorage' ? sessionStorage : localStorage;
  };

  // Storage key utilities
  const storageUtils = {
    getKey: (key: string): string => {
      return `${prefix}:${key}`;
    },

    async set(key: string, value: any): Promise<void> {
      const storageObj = getStorageObject();
      if (!storageObj) return;

      try {
        const storageKey = this.getKey(key);

        const data = {
          value,
          timestamp: Date.now(),
          expiry: Date.now() + ttl
        };

        const serialized = serialize(data);
        const compressed = compression.compress(serialized);

        // Check size
        if (compressed.length > maxItemSize) {
          log(`Cache item too large (${compressed.length} bytes): ${key}`);
          return;
        }

        storageObj.setItem(storageKey, compressed);
        log(`Cached: ${key}`, { size: compressed.length });
      } catch (error) {
        log('Error caching item', key, error);
      }
    },

    get(key: string): any {
      const storageObj = getStorageObject();
      if (!storageObj) return undefined;

      try {
        const storageKey = this.getKey(key);
        const compressed = storageObj.getItem(storageKey);

        if (!compressed) {
          log(`Cache miss: ${key}`);
          return undefined;
        }

        const serialized = compression.decompress(compressed);
        const data = deserialize(serialized);

        // Check if expired
        if (data.expiry < Date.now()) {
          log(`Cache expired: ${key}`);
          storageObj.removeItem(storageKey);
          return undefined;
        }

        log(`Cache hit: ${key}`, { age: Date.now() - data.timestamp });
        return data.value;
      } catch (error) {
        log('Error reading cache', key, error);
        return undefined;
      }
    },

    remove(key: string): void {
      const storageObj = getStorageObject();
      if (!storageObj) return;

      try {
        const storageKey = this.getKey(key);
        storageObj.removeItem(storageKey);
        log(`Removed from cache: ${key}`);
      } catch (error) {
        log('Error removing from cache', key, error);
      }
    },

    clear(): void {
      const storageObj = getStorageObject();
      if (!storageObj) return;

      try {
        const keys = Object.keys(storageObj);
        const cacheKeys = keys.filter(key => key.startsWith(`${prefix}:`));

        cacheKeys.forEach(key => {
          storageObj.removeItem(key);
        });

        log(`Cleared ${cacheKeys.length} items from cache`);
      } catch (error) {
        log('Error clearing cache', error);
      }
    },

    cleanup(): void {
      const storageObj = getStorageObject();
      if (!storageObj) return;

      try {
        const keys = Object.keys(storageObj);
        const cacheKeys = keys.filter(key => key.startsWith(`${prefix}:`));
        let removed = 0;

        cacheKeys.forEach(storageKey => {
          try {
            const compressed = storageObj.getItem(storageKey);
            if (!compressed) return;

            const serialized = compression.decompress(compressed);
            const data = deserialize(serialized);

            if (data.expiry < Date.now()) {
              storageObj.removeItem(storageKey);
              removed++;
            }
          } catch (e) {
            // If we can't parse it, remove it
            storageObj.removeItem(storageKey);
            removed++;
          }
        });

        if (removed > 0) {
          log(`Cleaned up ${removed} expired items`);
        }
      } catch (error) {
        log('Error during cleanup', error);
      }
    }
  };

  // Run cleanup on initialization and periodically
  if (typeof window !== 'undefined') {
    // Initial cleanup
    setTimeout(() => {
      storageUtils.cleanup();
    }, 1000);

    // Periodic cleanup
    setInterval(() => {
      storageUtils.cleanup();
    }, 60 * 60 * 1000); // Every hour
  }

  // Return the cache provider function
  return () => {
    // Create a Map for in-memory cache
    const map = new Map();

    // Load initial cache from storage
    if (typeof window !== 'undefined') {
      try {
        const storageObj = getStorageObject();
        if (storageObj) {
          const keys = Object.keys(storageObj);
          const cacheKeys = keys.filter(key => key.startsWith(`${prefix}:`));

          cacheKeys.forEach(storageKey => {
            const key = storageKey.substring(prefix.length + 1);
            const value = storageUtils.get(key);

            if (value !== undefined) {
              map.set(key, value);
            }
          });

          log(`Loaded ${map.size} items from persistent cache`);
        }
      } catch (error) {
        log('Error loading initial cache', error);
      }
    }

    // Return the cache implementation
    return {
      get: (key: string) => {
        return map.get(key);
      },
      set: (key: string, value: any) => {
        map.set(key, value);
        storageUtils.set(key, value);
        return map;
      },
      delete: (key: string) => {
        map.delete(key);
        storageUtils.remove(key);
        return true;
      },
      clear: () => {
        map.clear();
        storageUtils.clear();
      },
      keys: () => {
        return map.keys();
      }
    } as Cache;
  };
}
