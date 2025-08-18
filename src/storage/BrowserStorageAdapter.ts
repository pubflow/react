/**
 * Browser Storage Adapter for React
 *
 * Provides a storage adapter for React applications using localStorage
 */

import { StorageAdapter, createStorageKey } from '@pubflow/core';

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
export class BrowserStorageAdapter implements StorageAdapter {
  private prefix: string;
  private useSessionStorage: boolean;
  private useCookieFallback: boolean;
  private cookieOptions: {
    maxAge: number;
    path: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };

  /**
   * Create a new browser storage adapter
   *
   * @param options Storage options
   */
  constructor(options: BrowserStorageOptions = {}) {
    this.prefix = options.prefix || 'pubflow';
    this.useSessionStorage = options.useSessionStorage || false;
    this.useCookieFallback = options.useCookieFallback !== false;
    this.cookieOptions = {
      maxAge: options.cookieOptions?.maxAge || 30, // 30 days
      path: options.cookieOptions?.path || '/',
      secure: options.cookieOptions?.secure !== false,
      httpOnly: options.cookieOptions?.httpOnly !== false,
      sameSite: options.cookieOptions?.sameSite || 'lax'
    };
  }

  /**
   * Get a value from storage
   *
   * @param key Storage key
   * @returns Stored value or null
   */
  async getItem(key: string): Promise<string | null> {
    const prefixedKey = createStorageKey(key, this.prefix);

    // Try localStorage/sessionStorage first
    if (typeof window !== 'undefined') {
      try {
        const storage = this.useSessionStorage ? sessionStorage : localStorage;
        return storage.getItem(prefixedKey);
      } catch (error) {
        console.warn('Error getting item from storage:', error);

        // Fall back to cookies if enabled
        if (this.useCookieFallback) {
          return this.getCookie(prefixedKey);
        }
      }
    }

    return null;
  }

  /**
   * Save a value to storage
   *
   * @param key Storage key
   * @param value Value to store
   */
  async setItem(key: string, value: string): Promise<void> {
    const prefixedKey = createStorageKey(key, this.prefix);

    // Try localStorage/sessionStorage first
    if (typeof window !== 'undefined') {
      try {
        const storage = this.useSessionStorage ? sessionStorage : localStorage;
        storage.setItem(prefixedKey, value);
        return;
      } catch (error) {
        console.warn('Error setting item in storage:', error);

        // Fall back to cookies if enabled
        if (this.useCookieFallback) {
          this.setCookie(prefixedKey, value);
          return;
        }
      }
    }
  }

  /**
   * Remove a value from storage
   *
   * @param key Storage key
   */
  async removeItem(key: string): Promise<void> {
    const prefixedKey = createStorageKey(key, this.prefix);

    // Try localStorage/sessionStorage first
    if (typeof window !== 'undefined') {
      try {
        const storage = this.useSessionStorage ? sessionStorage : localStorage;
        storage.removeItem(prefixedKey);
      } catch (error) {
        console.warn('Error removing item from storage:', error);
      }

      // Also remove from cookies if fallback is enabled
      if (this.useCookieFallback) {
        this.removeCookie(prefixedKey);
      }
    }
  }

  /**
   * Clear all values with the current prefix
   */
  async clear(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storage = this.useSessionStorage ? sessionStorage : localStorage;
      const keysToRemove: string[] = [];

      // Find all keys with the current prefix
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(`${this.prefix}_`)) {
          keysToRemove.push(key);
        }
      }

      // Remove all found keys
      keysToRemove.forEach(key => {
        storage.removeItem(key);
      });

      // Also clear cookies if fallback is enabled
      if (this.useCookieFallback) {
        this.clearCookies();
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Get a cookie value
   *
   * @param key Cookie key
   * @returns Cookie value or null
   */
  private getCookie(key: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(key + '=')) {
        return decodeURIComponent(cookie.substring(key.length + 1));
      }
    }

    return null;
  }

  /**
   * Set a cookie value
   *
   * @param key Cookie key
   * @param value Cookie value
   */
  private setCookie(key: string, value: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    const { maxAge, path, secure, sameSite } = this.cookieOptions;
    const expires = new Date(Date.now() + maxAge * 24 * 60 * 60 * 1000);

    let cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}`;

    if (secure) {
      cookie += '; Secure';
    }

    cookie += `; SameSite=${sameSite}`;

    document.cookie = cookie;
  }

  /**
   * Remove a cookie
   *
   * @param key Cookie key
   */
  private removeCookie(key: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${this.cookieOptions.path}`;
  }

  /**
   * Clear all cookies with the current prefix
   */
  private clearCookies(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      const key = cookie.split('=')[0];

      if (key.startsWith(`${this.prefix}_`)) {
        this.removeCookie(key);
      }
    }
  }
}
