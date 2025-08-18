/**
 * Bridge API Raw Hook for React
 *
 * Provides raw API access for custom operations
 */
/**
 * Raw API request options
 */
export interface RawApiRequestOptions {
    /**
     * HTTP method
     */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    /**
     * Request headers
     */
    headers?: Record<string, string>;
    /**
     * Request body
     */
    body?: any;
    /**
     * Whether to include session in request
     */
    includeSession?: boolean;
    /**
     * Request timeout in milliseconds
     */
    timeout?: number;
}
/**
 * Raw API response
 */
export interface RawApiResponse<T = any> {
    /**
     * Response data
     */
    data: T;
    /**
     * Response status
     */
    status: number;
    /**
     * Response headers
     */
    headers: Record<string, string>;
    /**
     * Whether the request was successful
     */
    success: boolean;
    /**
     * Error message if any
     */
    error?: string;
}
/**
 * Bridge API Raw hook result
 */
export interface UseBridgeApiRawResult {
    /**
     * Make a raw API request
     */
    request: <T = any>(endpoint: string, options?: RawApiRequestOptions) => Promise<RawApiResponse<T>>;
    /**
     * GET request shorthand
     */
    get: <T = any>(endpoint: string, options?: Omit<RawApiRequestOptions, 'method'>) => Promise<RawApiResponse<T>>;
    /**
     * POST request shorthand
     */
    post: <T = any>(endpoint: string, body?: any, options?: Omit<RawApiRequestOptions, 'method' | 'body'>) => Promise<RawApiResponse<T>>;
    /**
     * PUT request shorthand
     */
    put: <T = any>(endpoint: string, body?: any, options?: Omit<RawApiRequestOptions, 'method' | 'body'>) => Promise<RawApiResponse<T>>;
    /**
     * DELETE request shorthand
     */
    delete: <T = any>(endpoint: string, options?: Omit<RawApiRequestOptions, 'method'>) => Promise<RawApiResponse<T>>;
    /**
     * PATCH request shorthand
     */
    patch: <T = any>(endpoint: string, body?: any, options?: Omit<RawApiRequestOptions, 'method' | 'body'>) => Promise<RawApiResponse<T>>;
}
/**
 * Hook for raw Bridge API access
 *
 * @param instanceId Pubflow instance ID
 * @returns Raw API hook result
 */
export declare function useBridgeApiRaw(instanceId?: string): UseBridgeApiRawResult;
