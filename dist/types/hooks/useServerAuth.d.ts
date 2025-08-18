/**
 * Server Authentication Hook for React
 *
 * Provides a hook for handling authentication with automatic redirects
 */
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
export declare function useServerAuth({ loginRedirectPath, allowedTypes, validateOnMount, instanceId, onRedirect }?: UseServerAuthOptions): {
    user: import("@pubflow/core").User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    validateSession: () => Promise<{
        isValid: boolean;
        expiresAt?: string;
    }>;
};
