/**
 * Bridge Query Hook for React
 *
 * Provides a hook for querying data using Bridge API with SWR
 */

import { useCallback } from 'react';
import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import {
  BridgeApiService,
  EntityData,
  PaginatedResponse,
  SearchParams,
  QueryParams as CoreQueryParams
} from '@pubflow/core';

/**
 * Bridge query types
 */
type QueryType = 'list' | 'get' | 'search';

/**
 * Bridge query parameters
 */
type BridgeQueryParams<T> =
  T extends 'list' ? CoreQueryParams :
  T extends 'get' ? { id: string; params?: CoreQueryParams } :
  T extends 'search' ? SearchParams :
  never;

/**
 * Bridge query result
 */
type QueryResult<T extends EntityData, Q extends QueryType> =
  Q extends 'list' ? PaginatedResponse<T> :
  Q extends 'get' ? T :
  Q extends 'search' ? PaginatedResponse<T> :
  never;

/**
 * Bridge query hook result
 */
export interface UseBridgeQueryResult<T extends EntityData, Q extends QueryType> {
  data: Q extends 'list' | 'search' ? T[] : T | null;
  meta: Q extends 'list' | 'search' ? { page: number; limit: number; total: number; hasMore: boolean } : null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Default SWR configuration
 */
const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 0,
  shouldRetryOnError: true,
  errorRetryCount: 3
};

/**
 * Hook for querying data using Bridge API with SWR
 *
 * @param service Bridge API service
 * @param type Query type
 * @param params Query parameters
 * @param config SWR configuration
 * @returns Query result
 */
export function useBridgeQuery<T extends EntityData, Q extends QueryType>(
  service: BridgeApiService<T>,
  type: Q,
  params: BridgeQueryParams<Q>,
  config?: SWRConfiguration
): UseBridgeQueryResult<T, Q> {
  // Create a unique key for SWR
  const key = JSON.stringify({ service, type, params });

  // Define fetcher function
  const fetcher = useCallback(async () => {
    switch (type) {
      case 'list':
        return await service.getList(params as CoreQueryParams);
      case 'get':
        const { id, params: getParams } = params as { id: string; params?: CoreQueryParams };
        return await service.getById(id, getParams);
      case 'search':
        return await service.search(params as SearchParams);
      default:
        throw new Error(`Invalid query type: ${type}`);
    }
  }, [service, type, params]);

  // Use SWR for data fetching
  const { data, error, mutate, isValidating } = useSWR<QueryResult<T, Q>, Error>(
    key,
    // Cast fetcher to the correct type
    () => fetcher() as Promise<QueryResult<T, Q>>,
    {
      ...defaultSWRConfig,
      ...config
    }
  );

  // Define refetch function
  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  // Format result based on query type
  if (type === 'list' || type === 'search') {
    const paginatedData = data as PaginatedResponse<T> | undefined;

    return {
      data: paginatedData?.data || [],
      meta: paginatedData?.meta || { page: 1, limit: 10, total: 0, hasMore: false },
      isLoading: isValidating,
      error: error || null,
      refetch
    } as UseBridgeQueryResult<T, Q>;
  } else {
    return {
      data: (data as T) || null,
      meta: null,
      isLoading: isValidating,
      error: error || null,
      refetch
    } as UseBridgeQueryResult<T, Q>;
  }
}
