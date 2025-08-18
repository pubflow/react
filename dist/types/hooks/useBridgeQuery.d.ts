/**
 * Bridge Query Hook for React
 *
 * Provides a hook for querying data using Bridge API with SWR
 */
import { SWRConfiguration } from 'swr';
import { BridgeApiService, EntityData, SearchParams, QueryParams as CoreQueryParams } from '@pubflow/core';
/**
 * Bridge query types
 */
type QueryType = 'list' | 'get' | 'search';
/**
 * Bridge query parameters
 */
type BridgeQueryParams<T> = T extends 'list' ? CoreQueryParams : T extends 'get' ? {
    id: string;
    params?: CoreQueryParams;
} : T extends 'search' ? SearchParams : never;
/**
 * Bridge query hook result
 */
export interface UseBridgeQueryResult<T extends EntityData, Q extends QueryType> {
    data: Q extends 'list' | 'search' ? T[] : T | null;
    meta: Q extends 'list' | 'search' ? {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    } : null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}
/**
 * Hook for querying data using Bridge API with SWR
 *
 * @param service Bridge API service
 * @param type Query type
 * @param params Query parameters
 * @param config SWR configuration
 * @returns Query result
 */
export declare function useBridgeQuery<T extends EntityData, Q extends QueryType>(service: BridgeApiService<T>, type: Q, params: BridgeQueryParams<Q>, config?: SWRConfiguration): UseBridgeQueryResult<T, Q>;
export {};
