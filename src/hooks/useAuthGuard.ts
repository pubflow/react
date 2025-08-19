/**
 * Authentication Guard Hook for React
 *
 * Framework-agnostic hook for handling authentication validation and redirects
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Authentication guard options
 */
export interface UseAuthGuardOptions {
  /**
   * Whether to validate the session on mount
   */
  validateOnMount?: boolean;
  
  /**
   * User types allowed to access the page
   */
  allowedTypes?: string[];
  
  /**
   * Pubflow instance ID
   */
  instanceId?: string;
  
  /**
   * Custom redirect function (framework-specific)
   */
  onRedirect?: (path: string, reason: 'unauthenticated' | 'unauthorized' | 'session-expired') => void;
  
  /**
   * Custom session expired handler
   */
  onSessionExpired?: () => void;
  
  /**
   * Login redirect path
   */
  loginRedirectPath?: string;
  
  /**
   * Access denied redirect path
   */
  accessDeniedPath?: string;
  
  /**
   * Whether to show console warnings
   */
  enableLogging?: boolean;
}

/**
 * Authentication guard result
 */
export interface UseAuthGuardResult {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthorized: boolean;
  validateSession: () => Promise<{ isValid: boolean; expiresAt?: string; user?: any }>;
  redirectReason: 'unauthenticated' | 'unauthorized' | 'session-expired' | null;
}

/**
 * Hook for handling authentication validation and redirects
 * 
 * This hook is framework-agnostic and requires the user to provide
 * their own redirect function (e.g., Next.js router, React Router, etc.)
 * 
 * @param options Hook options
 * @returns Authentication guard result
 */
export function useAuthGuard({
  validateOnMount = true,
  allowedTypes = ['authenticated'],
  instanceId,
  onRedirect,
  onSessionExpired,
  loginRedirectPath = '/login',
  accessDeniedPath = '/access-denied',
  enableLogging = false
}: UseAuthGuardOptions = {}): UseAuthGuardResult {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    validateSession 
  } = useAuth(instanceId);

  // Check if user is authorized based on user type
  const isAuthorized = useCallback(() => {
    if (!isAuthenticated || !user) {
      return false;
    }

    // If allowedTypes includes 'authenticated', any authenticated user is allowed
    if (allowedTypes.includes('authenticated')) {
      return true;
    }

    // Check specific user types
    const userType = user.userType || user.user_type || '';
    return allowedTypes.some(type => 
      type.toLowerCase() === userType.toLowerCase()
    );
  }, [isAuthenticated, user, allowedTypes]);

  const authorized = isAuthorized();

  // Determine redirect reason
  const getRedirectReason = useCallback((): 'unauthenticated' | 'unauthorized' | 'session-expired' | null => {
    if (isLoading) {
      return null;
    }

    if (!isAuthenticated) {
      return 'unauthenticated';
    }

    if (!authorized) {
      return 'unauthorized';
    }

    return null;
  }, [isLoading, isAuthenticated, authorized]);

  const redirectReason = getRedirectReason();

  // Validate session on mount
  useEffect(() => {
    if (validateOnMount && isAuthenticated) {
      validateSession().then(({ isValid }) => {
        if (!isValid) {
          if (enableLogging) {
            console.warn('useAuthGuard: Session validation failed');
          }
          
          // Call session expired handler
          if (onSessionExpired) {
            onSessionExpired();
          }
          
          // Redirect to login
          if (onRedirect) {
            onRedirect(loginRedirectPath, 'session-expired');
          }
        }
      }).catch(error => {
        if (enableLogging) {
          console.error('useAuthGuard: Session validation error:', error);
        }
      });
    }
  }, [validateOnMount, isAuthenticated, validateSession, onSessionExpired, onRedirect, loginRedirectPath, enableLogging]);

  // Handle authentication redirects
  useEffect(() => {
    if (isLoading || !onRedirect) {
      return;
    }

    if (!isAuthenticated) {
      if (enableLogging) {
        console.warn('useAuthGuard: User not authenticated, redirecting to login');
      }
      onRedirect(loginRedirectPath, 'unauthenticated');
      return;
    }

    if (!authorized) {
      if (enableLogging) {
        console.warn('useAuthGuard: User not authorized for this page, redirecting to access denied');
      }
      onRedirect(accessDeniedPath, 'unauthorized');
      return;
    }
  }, [isLoading, isAuthenticated, authorized, onRedirect, loginRedirectPath, accessDeniedPath, enableLogging]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAuthorized: authorized,
    validateSession,
    redirectReason
  };
}

/**
 * Simple authentication guard hook with automatic redirects
 * 
 * This is a simplified version that uses window.location for redirects
 * Suitable for simple React apps without complex routing
 * 
 * @param options Hook options
 * @returns Authentication guard result
 */
export function useSimpleAuthGuard(options: Omit<UseAuthGuardOptions, 'onRedirect'> = {}): UseAuthGuardResult {
  const handleRedirect = useCallback((path: string, reason: 'unauthenticated' | 'unauthorized' | 'session-expired') => {
    if (typeof window !== 'undefined') {
      // Add current path as redirect parameter
      const currentPath = window.location.pathname + window.location.search;
      const redirectUrl = reason === 'unauthenticated' 
        ? `${path}?redirect=${encodeURIComponent(currentPath)}`
        : path;
      
      window.location.href = redirectUrl;
    }
  }, []);

  return useAuthGuard({
    ...options,
    onRedirect: handleRedirect,
    enableLogging: options.enableLogging ?? true
  });
}
