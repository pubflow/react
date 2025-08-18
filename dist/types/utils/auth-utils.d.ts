/**
 * Authentication Utilities for React
 *
 * Provides utilities for authentication in React applications
 */
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
export declare function useRequireAuth(options?: UseRequireAuthOptions): {
    user: import("@pubflow/core").User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
};
