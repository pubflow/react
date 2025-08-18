/**
 * Bridge API Hook for React
 * 
 * Provides a hook for accessing Bridge API functionality
 */

import { useContext } from 'react';
import { BridgeApiService, EntityConfig, EntityData } from '@pubflow/core';
import { PubflowContext } from '../context/PubflowProvider';

/**
 * Hook for accessing Bridge API functionality
 * 
 * @param config Entity configuration
 * @param instanceId Pubflow instance ID
 * @returns Bridge API service
 */
export function useBridgeApi<T extends EntityData>(
  config: EntityConfig,
  instanceId?: string
): BridgeApiService<T> {
  const context = useContext(PubflowContext);
  
  if (!context) {
    throw new Error('useBridgeApi must be used within a PubflowProvider');
  }
  
  const instance = instanceId || context.defaultInstance;
  const pubflowInstance = context.instances[instance];
  
  if (!pubflowInstance) {
    throw new Error(`Pubflow instance '${instance}' not found`);
  }
  
  return new BridgeApiService<T>(pubflowInstance.apiClient, config);
}
