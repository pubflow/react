/**
 * Authentication Hook for React
 *
 * Provides a hook for accessing authentication functionality
 */

import { useContext } from 'react';
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
}

/**
 * Hook for accessing authentication functionality
 *
 * @param instanceId Pubflow instance ID
 * @returns Authentication hook result
 */
export function useAuth(instanceId?: string): UseAuthResult {
  const context = useContext(PubflowContext);

  if (!context) {
    throw new Error('useAuth must be used within a PubflowProvider');
  }

  const instance = instanceId || context.defaultInstance;
  const pubflowInstance = context.instances[instance];

  if (!pubflowInstance) {
    throw new Error(`Pubflow instance '${instance}' not found`);
  }

  return {
    // Ensure user is never undefined
    user: pubflowInstance.user || null,
    isAuthenticated: pubflowInstance.isAuthenticated,
    isLoading: pubflowInstance.isLoading,
    login: pubflowInstance.login,
    logout: pubflowInstance.logout,
    validateSession: pubflowInstance.validateSession
  };
}