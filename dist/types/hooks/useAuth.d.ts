/**
 * Authentication Hook for React
 *
 * Provides a hook for accessing authentication functionality
 */
import { User } from '@pubflow/core';
/**
 * Authentication hook result
 */
export interface UseAuthResult {
    user: User | null;
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
    }>;
    refreshUser: () => Promise<User | null>;
}
/**
 * Hook for accessing authentication functionality
 *
 * @param instanceId Pubflow instance ID
 * @returns Authentication hook result
 */
export declare function useAuth(instanceId?: string): UseAuthResult;
