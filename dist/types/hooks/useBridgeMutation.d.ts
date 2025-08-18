/**
 * Bridge Mutation Hook for React
 *
 * Provides a hook for mutating data using Bridge API
 */
import { BridgeApiService, EntityData } from '@pubflow/core';
/**
 * Mutation types
 */
type MutationType = 'create' | 'update' | 'delete';
/**
 * Mutation parameters
 */
type MutationParams<T, M> = M extends 'create' ? Partial<T> : M extends 'update' ? {
    id: string;
    data: Partial<T>;
} : M extends 'delete' ? string : never;
/**
 * Mutation result
 */
type MutationResult<T, M> = M extends 'create' ? T : M extends 'update' ? T : M extends 'delete' ? void : never;
/**
 * Mutation options
 */
export interface MutationOptions {
    /**
     * Whether to invalidate queries after mutation
     */
    invalidateQueries?: boolean;
    /**
     * Success message
     */
    successMessage?: string;
    /**
     * Error message
     */
    errorMessage?: string;
    /**
     * Success callback
     */
    onSuccess?: (data: any) => void;
    /**
     * Error callback
     */
    onError?: (error: Error) => void;
    /**
     * Whether to show alerts for success/error
     */
    showAlerts?: boolean;
}
/**
 * Bridge mutation hook result
 */
export interface UseBridgeMutationResult<T, M extends MutationType> {
    mutate: (params: MutationParams<T, M>, options?: MutationOptions) => Promise<MutationResult<T, M>>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
}
/**
 * Hook for mutating data using Bridge API
 *
 * @param service Bridge API service
 * @param type Mutation type
 * @param defaultOptions Default mutation options
 * @returns Mutation result
 */
export declare function useBridgeMutation<T extends EntityData, M extends MutationType>(service: BridgeApiService<T>, type: M, defaultOptions?: MutationOptions): UseBridgeMutationResult<T, M>;
export {};
