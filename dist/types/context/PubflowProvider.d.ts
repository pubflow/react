/**
 * Pubflow Provider for React
 *
 * Provides a context provider for Pubflow in React applications
 */
import React from 'react';
import { PubflowConfig, PubflowInstanceConfig, ApiClient, AuthService, User } from '@pubflow/core';
/**
 * Pubflow context value
 */
export interface PubflowContextValue {
    instances: Record<string, PubflowInstance>;
    defaultInstance: string;
}
/**
 * Pubflow instance
 */
export interface PubflowInstance {
    config: PubflowInstanceConfig;
    apiClient: ApiClient;
    authService: AuthService;
    user: User | null | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: {
        email?: string;
        userName?: string;
        password: string;
    }) => Promise<any>;
    logout: () => Promise<void>;
    validateSession: () => Promise<{
        isValid: boolean;
        expiresAt?: string;
        user?: User;
    }>;
}
/**
 * Create Pubflow context
 */
export declare const PubflowContext: React.Context<PubflowContextValue>;
/**
 * Persistent cache configuration
 */
export interface PersistentCacheConfig {
    /**
     * Whether to enable persistent cache
     */
    enabled: boolean;
    /**
     * Cache provider function
     */
    provider?: () => Map<any, any>;
    /**
     * Cache options
     */
    options?: any;
}
/**
 * Pubflow provider props
 */
export interface PubflowProviderProps {
    children: React.ReactNode;
    config?: PubflowConfig;
    instances?: PubflowInstanceConfig[];
    defaultInstance?: string;
    onSessionExpired?: () => void;
    onSessionRefreshed?: () => void;
    showSessionAlerts?: boolean;
    /**
     * Persistent cache configuration
     */
    persistentCache?: PersistentCacheConfig;
    /**
     * Login redirect path (for automatic redirects)
     */
    loginRedirectPath?: string;
    /**
     * Public paths that don't require authentication
     */
    publicPaths?: string[];
    /**
     * Enable debug tools
     * When enabled, debug utilities will be available
     * Default: false
     */
    enableDebugTools?: boolean;
    /**
     * Theme configuration
     */
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        appName?: string;
        logo?: string | React.ReactNode;
    };
}
/**
 * Pubflow provider for React
 */
export declare function PubflowProvider({ children, config, instances, defaultInstance, onSessionExpired, onSessionRefreshed, showSessionAlerts, persistentCache, loginRedirectPath, publicPaths, enableDebugTools, theme }: PubflowProviderProps): import("react/jsx-runtime").JSX.Element | null;
