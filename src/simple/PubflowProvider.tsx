/**
 * Simple Pubflow Provider for React
 * 
 * Framework-agnostic authentication provider that works with any React setup
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Simple types
export interface User {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

export interface PubflowConfig {
  baseUrl: string;
  authPath?: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  validateSession: () => Promise<{ isValid: boolean; user?: User }>;
}

// Simple storage utility
class SimpleStorage {
  private prefix = 'pubflow_';

  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.prefix + key, value);
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  }

  getItem(key: string): string | null {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(this.prefix + key);
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }
    return null;
  }

  removeItem(key: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.prefix + key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }
  }
}

// Simple API client
class SimpleApiClient {
  private baseUrl: string;
  private authPath: string;
  private storage: SimpleStorage;

  constructor(config: PubflowConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.authPath = config.authPath || '/auth';
    this.storage = new SimpleStorage();
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const sessionId = this.storage.getItem('session_id');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (sessionId) {
      (headers as Record<string, string>)['X-Session-Id'] = sessionId;
    }


    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async login(credentials: { email: string; password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await this.request(`${this.authPath}/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (result.success && result.session_id) {
        this.storage.setItem('session_id', result.session_id);
        if (result.user) {
          this.storage.setItem('user_data', JSON.stringify(result.user));
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request(`${this.authPath}/logout`, { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.storage.removeItem('session_id');
      this.storage.removeItem('user_data');
    }
  }

  async validateSession(): Promise<{ isValid: boolean; user?: User }> {
    try {
      const result = await this.request(`${this.authPath}/validate`);
      return result;
    } catch (error) {
      return { isValid: false };
    }
  }

  getCurrentUser(): User | null {
    const userData = this.storage.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.warn('Failed to parse user data:', error);
      }
    }
    return null;
  }
}

// Context
const AuthContext = createContext<AuthContextValue | null>(null);

// Provider props
export interface PubflowProviderProps {
  children: ReactNode;
  config: PubflowConfig;
}

// Simple Provider
export function PubflowProvider({ children, config }: PubflowProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiClient] = useState(() => new SimpleApiClient(config));

  const isAuthenticated = !!user;

  // Initialize user from storage
  useEffect(() => {
    const storedUser = apiClient.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, [apiClient]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const result = await apiClient.login(credentials);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  const validateSession = useCallback(async () => {
    const result = await apiClient.validateSession();
    if (result.isValid && result.user) {
      setUser(result.user);
    } else {
      setUser(null);
    }
    return result;
  }, [apiClient]);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    validateSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Simple hook
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a PubflowProvider');
  }
  return context;
}
