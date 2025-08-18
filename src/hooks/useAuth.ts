/**
 * Authentication Hook for React
 *
 * Provides a hook for accessing authentication functionality
 */

import { useContext, useState, useCallback, useEffect } from 'react';
import { User } from '@pubflow/core';
import { PubflowContext } from '../context/PubflowProvider';

/**
 * Authentication hook result
 */
export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email?: string; userName?: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  validateSession: () => Promise<{ isValid: boolean; expiresAt?: string }>;
  refreshUser: () => Promise<User | null>;
}

/**
 * Hook for accessing authentication functionality
 *
 * @param instanceId Pubflow instance ID
 * @returns Authentication hook result
 */
export function useAuth(instanceId?: string): UseAuthResult {
  const context = useContext(PubflowContext);
  const [isLoading, setIsLoading] = useState(false);

  if (!context) {
    throw new Error('useAuth must be used within a PubflowProvider');
  }

  const instance = instanceId || context.defaultInstance;
  const pubflowInstance = context.instances[instance];

  if (!pubflowInstance) {
    throw new Error(`Pubflow instance '${instance}' not found`);
  }

  // Wrap login to handle loading state
  const login = useCallback(async (credentials: { email?: string; userName?: string; password: string }) => {
    setIsLoading(true);
    try {
      return await pubflowInstance.login(credentials);
    } finally {
      setIsLoading(false);
    }
  }, [pubflowInstance]);

  // Wrap logout to handle loading state
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await pubflowInstance.logout();
    } finally {
      setIsLoading(false);
    }
  }, [pubflowInstance]);

  // Wrap validateSession to handle loading state
  const validateSession = useCallback(async () => {
    setIsLoading(true);
    try {
      return await pubflowInstance.validateSession();
    } finally {
      setIsLoading(false);
    }
  }, [pubflowInstance]);

  // Add refreshUser function to manually refresh user data
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await pubflowInstance.validateSession();
      return result.user || null;
    } finally {
      setIsLoading(false);
    }
  }, [pubflowInstance]);

  // Validate session on mount
  useEffect(() => {
    const validate = async () => {
      try {
        await validateSession();
      } catch (error) {
        console.error('Error validating session:', error);
      }
    };

    validate();
  }, [validateSession]);

  return {
    // Ensure user is never undefined
    user: pubflowInstance.user || null,
    isAuthenticated: pubflowInstance.isAuthenticated,
    isLoading,
    login,
    logout,
    validateSession,
    refreshUser
  };
}
