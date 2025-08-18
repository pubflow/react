/**
 * Bridge API Raw Hook for React
 * 
 * Provides raw API access for custom operations
 */

import { useContext } from 'react';
import { PubflowContext } from '../context/PubflowProvider';

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
export function useBridgeApiRaw(instanceId?: string): UseBridgeApiRawResult {
  const context = useContext(PubflowContext);
  
  if (!context) {
    throw new Error('useBridgeApiRaw must be used within a PubflowProvider');
  }
  
  const instance = instanceId || context.defaultInstance;
  const pubflowInstance = context.instances[instance];
  
  if (!pubflowInstance) {
    throw new Error(`Pubflow instance '${instance}' not found`);
  }
  
  const { apiClient } = pubflowInstance;
  
  // Make raw API request
  const request = async <T = any>(
    endpoint: string, 
    options: RawApiRequestOptions = {}
  ): Promise<RawApiResponse<T>> => {
    const {
      method = 'GET',
      headers = {},
      body,
      includeSession = true,
      timeout
    } = options;
    
    try {
      const response = await apiClient.request<T>(
        endpoint,
        method,
        body,
        {
          headers,
          includeSession,
          timeout
        }
      );
      
      return {
        data: response.data as T,
        status: 200, // ApiClient doesn't expose status, assume success
        headers: {}, // ApiClient doesn't expose headers
        success: response.success,
        error: response.error
      };
    } catch (error) {
      return {
        data: null as T,
        status: 500,
        headers: {},
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };
  
  // GET request shorthand
  const get = async <T = any>(
    endpoint: string, 
    options: Omit<RawApiRequestOptions, 'method'> = {}
  ): Promise<RawApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  };
  
  // POST request shorthand
  const post = async <T = any>(
    endpoint: string, 
    body?: any, 
    options: Omit<RawApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<RawApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: 'POST', body });
  };
  
  // PUT request shorthand
  const put = async <T = any>(
    endpoint: string, 
    body?: any, 
    options: Omit<RawApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<RawApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: 'PUT', body });
  };
  
  // DELETE request shorthand
  const deleteRequest = async <T = any>(
    endpoint: string, 
    options: Omit<RawApiRequestOptions, 'method'> = {}
  ): Promise<RawApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  };
  
  // PATCH request shorthand
  const patch = async <T = any>(
    endpoint: string, 
    body?: any, 
    options: Omit<RawApiRequestOptions, 'method' | 'body'> = {}
  ): Promise<RawApiResponse<T>> => {
    return request<T>(endpoint, { ...options, method: 'PATCH', body });
  };
  
  return {
    request,
    get,
    post,
    put,
    delete: deleteRequest,
    patch
  };
}
