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
export declare function createPersistentCache(options?: PersistentCacheOptions): () => Cache;
