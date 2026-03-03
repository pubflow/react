/**
 * Authentication Hook for React
 *
 * Provides a hook for accessing authentication functionality
 */

import { useContext } from 'react';
import { User, type TwoFactorMethod, type TwoFactorVerifyResult, type TwoFactorStartResult } from '@pubflow/core';
import { PubflowContext } from '../context/PubflowProvider';

/**
 * Authentication hook result
 */
export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Whether the user is in the 2FA pending step (session is partial) */
  twoFactorPending: boolean;
  /** Available 2FA methods for the pending step */
  twoFactorMethods: TwoFactorMethod[];
  login: (credentials: { email?: string; userName?: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  validateSession: () => Promise<{ isValid: boolean; expiresAt?: string }>;
  /** Submit a 2FA verification code to complete a pending login */
  verifyTwoFactor: (methodId: string, code: string) => Promise<TwoFactorVerifyResult>;
  /** (Re-)send a 2FA code for the given method */
  startTwoFactor: (methodId: string, method: string) => Promise<TwoFactorStartResult>;
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

  // If the provider hasn't finished its initial useEffect setup,
  // instances won't exist yet. Return a loading state instead of crashing.
  if (!context.isReady) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true, // Crucial: tell the UI we are still loading the provider
      twoFactorPending: false,
      twoFactorMethods: [],
      login: async () => { throw new Error('Pubflow not initialized yet'); },
      logout: async () => { throw new Error('Pubflow not initialized yet'); },
      validateSession: async () => ({ isValid: false }),
      verifyTwoFactor: async () => ({ success: false, error: 'Pubflow not initialized yet' }),
      startTwoFactor: async () => ({ success: false, error: 'Pubflow not initialized yet' }),
    };
  }

  // After provider is ready, if the instance is STILL missing, it's a real config error.
  if (!pubflowInstance) {
    throw new Error(`Pubflow instance '${instance}' not found`);
  }

  return {
    // Ensure user is never undefined
    user: pubflowInstance.user || null,
    isAuthenticated: pubflowInstance.isAuthenticated,
    isLoading: pubflowInstance.isLoading,
    twoFactorPending: pubflowInstance.twoFactorPending,
    twoFactorMethods: pubflowInstance.twoFactorMethods,
    login: pubflowInstance.login,
    logout: pubflowInstance.logout,
    validateSession: pubflowInstance.validateSession,
    verifyTwoFactor: pubflowInstance.verifyTwoFactor,
    startTwoFactor: pubflowInstance.startTwoFactor,
  };
}