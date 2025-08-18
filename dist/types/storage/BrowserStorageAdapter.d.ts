/**
 * Browser Storage Adapter for React
 *
 * Provides a storage adapter for React applications using localStorage
 */
import { StorageAdapter } from '@pubflow/core';
/**
 * Options for the browser storage adapter
 */
export interface BrowserStorageOptions {
    /**
     * Prefix for storage keys
     */
    prefix?: string;
    /**
     * Whether to use sessionStorage instead of localStorage
     */
    useSessionStorage?: boolean;
    /**
     * Whether to use cookies as fallback when localStorage/sessionStorage is not available
     */
    useCookieFallback?: boolean;
    /**
     * Cookie options when using cookie fallback
     */
    cookieOptions?: {
        /**
         * Cookie expiration in days
         */
        maxAge?: number;
        /**
         * Cookie path
         */
        path?: string;
        /**
         * Whether the cookie should be secure
         */
        secure?: boolean;
        /**
         * Whether the cookie should be HTTP only
         */
        httpOnly?: boolean;
        /**
         * SameSite attribute for the cookie
         */
        sameSite?: 'strict' | 'lax' | 'none';
    };
}
/**
 * Browser storage adapter for React
 * Uses localStorage or sessionStorage with cookie fallback
 */
export declare class BrowserStorageAdapter implements StorageAdapter {
    private prefix;
    private useSessionStorage;
    private useCookieFallback;
    private cookieOptions;
    /**
     * Create a new browser storage adapter
     *
     * @param options Storage options
     */
    constructor(options?: BrowserStorageOptions);
    /**
     * Get a value from storage
     *
     * @param key Storage key
     * @returns Stored value or null
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Save a value to storage
     *
     * @param key Storage key
     * @param value Value to store
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Remove a value from storage
     *
     * @param key Storage key
     */
    removeItem(key: string): Promise<void>;
    /**
     * Clear all values with the current prefix
     */
    clear(): Promise<void>;
    /**
     * Get a cookie value
     *
     * @param key Cookie key
     * @returns Cookie value or null
     */
    private getCookie;
    /**
     * Set a cookie value
     *
     * @param key Cookie key
     * @param value Cookie value
     */
    private setCookie;
    /**
     * Remove a cookie
     *
     * @param key Cookie key
     */
    private removeCookie;
    /**
     * Clear all cookies with the current prefix
     */
    private clearCookies;
}
