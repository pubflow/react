/**
 * Server Authentication Hook for React
 * 
 * Provides a hook for handling authentication with automatic redirects
 */

import { useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Server authentication hook options
 */
export interface UseServerAuthOptions {
  /**
   * Path to redirect to when not authenticated
   */
  loginRedirectPath?: string;
  
  /**
   * User types allowed to access the page
   */
  allowedTypes?: string[];
  
  /**
   * Whether to validate the session on mount
   */
  validateOnMount?: boolean;
  
  /**
   * Pubflow instance ID
   */
  instanceId?: string;
  
  /**
   * Custom redirect function
   */
  onRedirect?: (path: string) => void;
}

/**
 * Hook for handling authentication with automatic redirects
 * 
 * @param options Hook options
 * @returns Authentication hook result
 */
export function useServerAuth({
  loginRedirectPath = '/login',
  allowedTypes = ['authenticated'],
  validateOnMount = true,
  instanceId,
  onRedirect
}: UseServerAuthOptions = {}) {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    validateSession 
  } = useAuth(instanceId);
  
  // Default redirect function
  const defaultRedirect = (path: string) => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const redirectUrl = `${path}?redirect=${encodeURIComponent(currentPath)}`;
      window.location.href = redirectUrl;
    }
  };
  
  const redirect = onRedirect || defaultRedirect;
  
  useEffect(() => {
    // Validate session on mount if configured
    if (validateOnMount) {
      validateSession().then(({ isValid }) => {
        if (!isValid) {
          redirect(loginRedirectPath);
        }
      });
    }
  }, [validateOnMount, loginRedirectPath, validateSession, redirect]);
  
  useEffect(() => {
    // Skip if still loading
    if (isLoading) {
      return;
    }
    
    // Redirect if not authenticated
    if (!isAuthenticated) {
      redirect(loginRedirectPath);
      return;
    }
    
    // Check user type if allowedTypes doesn't include 'authenticated'
    if (!allowedTypes.includes('authenticated') && user) {
      const userType = user.userType || '';
      const isAllowed = allowedTypes.some(type => 
        type.toLowerCase() === userType.toLowerCase()
      );
      
      if (!isAllowed) {
        redirect('/access-denied');
      }
    }
  }, [isLoading, isAuthenticated, user, allowedTypes, loginRedirectPath, redirect]);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    validateSession
  };
}
