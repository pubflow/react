/**
 * Bridge View Component for React
 * 
 * Provides a component for conditional rendering based on authentication and user type
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Bridge View props
 */
export interface BridgeViewProps {
  /**
   * Content to render if conditions are met
   */
  children: React.ReactNode;
  
  /**
   * User types allowed to view the content
   */
  allowedTypes?: string | string[];
  
  /**
   * Content to render if conditions are not met
   */
  fallback?: React.ReactNode;
  
  /**
   * Loading component
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Callback when user is not authorized
   */
  onUnauthorized?: () => void;
  
  /**
   * Pubflow instance ID
   */
  instanceId?: string;
}

/**
 * Component for conditional rendering based on authentication and user type
 */
export function BridgeView({
  children,
  allowedTypes = ['authenticated'],
  fallback = null,
  loadingComponent = null,
  onUnauthorized,
  instanceId
}: BridgeViewProps) {
  const { user, isAuthenticated, isLoading } = useAuth(instanceId);
  
  // Convert allowedTypes to array if string
  const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
  
  // Show loading component if loading
  if (isLoading) {
    return <>{loadingComponent || null}</>;
  }
  
  // Special case: if 'authenticated' is in allowed types, just check if user is authenticated
  if (types.includes('authenticated') && isAuthenticated) {
    return <>{children}</>;
  }
  
  // If not authenticated, show fallback
  if (!isAuthenticated) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return <>{fallback}</>;
  }
  
  // Check if user type is allowed
  const userType = user?.userType || '';
  const isAllowed = types.some(type => 
    type.toLowerCase() === userType.toLowerCase()
  );
  
  if (isAllowed) {
    return <>{children}</>;
  }
  
  // Not allowed, show fallback
  if (onUnauthorized) {
    onUnauthorized();
  }
  
  return <>{fallback}</>;
}
