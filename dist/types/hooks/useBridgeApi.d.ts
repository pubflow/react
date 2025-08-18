/**
 * Bridge API Hook for React
 *
 * Provides a hook for accessing Bridge API functionality
 */
import { BridgeApiService, EntityConfig, EntityData } from '@pubflow/core';
/**
 * Hook for accessing Bridge API functionality
 *
 * @param config Entity configuration
 * @param instanceId Pubflow instance ID
 * @returns Bridge API service
 */
export declare function useBridgeApi<T extends EntityData>(config: EntityConfig, instanceId?: string): BridgeApiService<T>;
