/**
 * Authentication Utilities for React
 * 
 * Provides utilities for authentication in React applications
 */

import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Options for the useRequireAuth hook
 */
export interface UseRequireAuthOptions {
  /**
   * User types allowed to access the route
   */
  allowedTypes?: string | string[];
  
  /**
   * Redirect function
   */
  redirectFn?: (path: string) => void;
  
  /**
   * Redirect path when not authenticated
   */
  redirectTo?: string;
  
  /**
   * Pubflow instance ID
   */
  instanceId?: string;
}

/**
 * Hook for requiring authentication
 * 
 * @param options Authentication options
 * @returns Authentication result
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { allowedTypes = ['authenticated'], redirectTo = '/login', instanceId, redirectFn } = options;
  const { user, isAuthenticated, isLoading } = useAuth(instanceId);
  
  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) {
      return;
    }
    
    // Check if authenticated
    if (!isAuthenticated) {
      if (redirectFn) {
        redirectFn(redirectTo);
      } else if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
      return;
    }
    
    // Convert allowedTypes to array
    const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    
    // Special case: if 'authenticated' is in allowed types, just check if user is authenticated
    if (types.includes('authenticated')) {
      return;
    }
    
    // Check if user type is allowed
    const userType = user?.userType || '';
    const isAllowed = types.some(type => 
      type.toLowerCase() === userType.toLowerCase()
    );
    
    if (!isAllowed) {
      if (redirectFn) {
        redirectFn('/access-denied');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/access-denied';
      }
    }
  }, [isLoading, isAuthenticated, user, allowedTypes, redirectTo, redirectFn]);
  
  return {
    user,
    isAuthenticated,
    isLoading
  };
}
