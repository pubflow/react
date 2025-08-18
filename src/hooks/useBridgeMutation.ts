/**
 * Bridge Mutation Hook for React
 * 
 * Provides a hook for mutating data using Bridge API
 */

import { useState, useCallback } from 'react';
import { BridgeApiService, EntityData } from '@pubflow/core';
import { useSWRConfig } from 'swr';

/**
 * Mutation types
 */
type MutationType = 'create' | 'update' | 'delete';

/**
 * Mutation parameters
 */
type MutationParams<T, M> = 
  M extends 'create' ? Partial<T> :
  M extends 'update' ? { id: string; data: Partial<T> } :
  M extends 'delete' ? string :
  never;

/**
 * Mutation result
 */
type MutationResult<T, M> = 
  M extends 'create' ? T :
  M extends 'update' ? T :
  M extends 'delete' ? void :
  never;

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
export function useBridgeMutation<T extends EntityData, M extends MutationType>(
  service: BridgeApiService<T>,
  type: M,
  defaultOptions: MutationOptions = {}
): UseBridgeMutationResult<T, M> {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // SWR config for cache invalidation
  const { mutate: mutateCache } = useSWRConfig();
  
  // Define mutate function
  const mutate = useCallback(async (
    params: MutationParams<T, M>,
    options?: MutationOptions
  ): Promise<MutationResult<T, M>> => {
    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Reset error
    setError(null);
    
    // Set loading
    setIsLoading(true);
    
    try {
      let result;
      
      // Perform mutation based on type
      switch (type) {
        case 'create':
          result = await service.create(params as Partial<T>);
          break;
        case 'update':
          const { id, data } = params as { id: string; data: Partial<T> };
          result = await service.update(id, data);
          break;
        case 'delete':
          await service.delete(params as string);
          result = undefined;
          break;
        default:
          throw new Error(`Invalid mutation type: ${type}`);
      }
      
      // Invalidate queries if configured
      if (mergedOptions.invalidateQueries !== false) {
        await mutateCache(
          (key: string) => typeof key === 'string' && key.includes(JSON.stringify({ service })),
          undefined,
          { revalidate: true }
        );
      }
      
      // Show success message
      if (mergedOptions.showAlerts && mergedOptions.successMessage) {
        alert(mergedOptions.successMessage);
      }
      
      // Call success callback
      if (mergedOptions.onSuccess) {
        mergedOptions.onSuccess(result);
      }
      
      return result as MutationResult<T, M>;
    } catch (err: any) {
      // Set error
      setError(err);
      
      // Show error message
      if (mergedOptions.showAlerts && mergedOptions.errorMessage) {
        alert(mergedOptions.errorMessage);
      }
      
      // Call error callback
      if (mergedOptions.onError) {
        mergedOptions.onError(err);
      }
      
      throw err;
    } finally {
      // Reset loading
      setIsLoading(false);
    }
  }, [service, type, defaultOptions, mutateCache]);
  
  // Define reset function
  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);
  
  return {
    mutate,
    isLoading,
    error,
    reset
  };
}
