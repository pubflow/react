/**
 * Bridge CRUD Hook for React
 *
 * Provides a hook for CRUD operations using Bridge API
 */

import { useState, useCallback, useEffect } from 'react';
import {
  BridgeApiService,
  EntityConfig,
  EntityData,
  FilterOperator,
  validateWithSchema
} from '@pubflow/core';
import { useBridgeApi } from './useBridgeApi';
import { useBridgeQuery } from './useBridgeQuery';
import { useBridgeMutation, MutationOptions } from './useBridgeMutation';

/**
 * Search configuration
 */
export interface SearchConfig {
  /**
   * Initial search term
   */
  initialSearchTerm?: string;

  /**
   * Initial filters
   */
  initialFilters?: Array<{
    field: string;
    operator: FilterOperator | string;
    value: any;
  }>;

  /**
   * Initial sort
   */
  initialSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };

  /**
   * Initial page
   */
  initialPage?: number;

  /**
   * Initial limit
   */
  initialLimit?: number;

  /**
   * Fields to search
   */
  searchFields?: string[];

  /**
   * Debounce time in milliseconds
   */
  debounceMs?: number;

  /**
   * Whether to search automatically
   */
  autoSearch?: boolean;
}

/**
 * Entity schemas
 */
export interface EntitySchemas<T, U, V> {
  /**
   * Schema for the complete entity
   */
  entity?: any;

  /**
   * Schema for creating an entity
   */
  create?: any;

  /**
   * Schema for updating an entity
   */
  update?: any;
}

/**
 * Success messages
 */
export interface SuccessMessages {
  /**
   * Success message for create operation
   */
  create?: string;

  /**
   * Success message for update operation
   */
  update?: string;

  /**
   * Success message for delete operation
   */
  delete?: string;
}

/**
 * Error messages
 */
export interface ErrorMessages {
  /**
   * Error message for create operation
   */
  create?: string;

  /**
   * Error message for update operation
   */
  update?: string;

  /**
   * Error message for delete operation
   */
  delete?: string;

  /**
   * Error message for fetch operation
   */
  fetch?: string;
}

/**
 * Bridge CRUD hook options
 */
export interface UseBridgeCrudOptions<T extends EntityData, U = Partial<T>, V = Partial<T>> {
  /**
   * Entity configuration
   */
  entityConfig: EntityConfig;

  /**
   * Pubflow instance ID
   */
  instanceId?: string;

  /**
   * Entity schemas
   */
  schemas?: EntitySchemas<T, U, V>;

  /**
   * Search configuration
   */
  searchConfig?: SearchConfig;

  /**
   * Success messages
   */
  successMessages?: SuccessMessages;

  /**
   * Error messages
   */
  errorMessages?: ErrorMessages;

  /**
   * Notification configuration
   */
  notificationConfig?: {
    /**
     * Whether to show notifications automatically
     */
    autoNotify?: boolean;

    /**
     * Function to show notifications
     */
    showNotification?: (message: string, type: 'success' | 'error') => void;
  };
}

/**
 * Bridge CRUD hook result
 */
export interface UseBridgeCrudResult<T extends EntityData> {
  // Data
  items: T[];
  selectedItem: T | null;
  totalItems: number;

  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;

  // Errors
  error: Error | null;
  validationErrors: Record<string, string[]> | null;

  // Pagination
  page: number;
  limit: number;
  hasMore: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  // Sorting
  orderBy: string | undefined;
  orderDir: 'asc' | 'desc' | undefined;
  setSort: (field: string, direction?: 'asc' | 'desc') => void;

  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Array<{ field: string; operator: FilterOperator | string; value: any }>;
  addFilter: (field: string, operator: FilterOperator | string, value: any) => void;
  removeFilter: (field: string) => void;
  resetFilters: () => void;

  // CRUD operations
  getItem: (id: string) => Promise<T>;
  createItem: (data: Partial<T>, options?: MutationOptions) => Promise<T>;
  updateItem: (id: string, data: Partial<T>, options?: MutationOptions) => Promise<T>;
  deleteItem: (id: string, options?: MutationOptions) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;

  // Selection
  selectItem: (item: T | null) => void;
}

/**
 * Hook for CRUD operations using Bridge API
 *
 * @param options Hook options
 * @returns CRUD hook result
 */
export function useBridgeCrud<T extends EntityData, U = Partial<T>, V = Partial<T>>(
  options: UseBridgeCrudOptions<T, U, V>
): UseBridgeCrudResult<T> {
  // Extract options
  const {
    entityConfig,
    instanceId,
    schemas,
    searchConfig = {},
    successMessages = {},
    errorMessages = {},
    notificationConfig = { autoNotify: true }
  } = options;

  // Get Bridge API service
  const service = useBridgeApi<T>(entityConfig, instanceId);

  // State
  const [searchTerm, setSearchTerm] = useState(searchConfig.initialSearchTerm || '');
  const [filters, setFilters] = useState(searchConfig.initialFilters || []);
  const [orderBy, setOrderBy] = useState(searchConfig.initialSort?.field);
  const [orderDir, setOrderDir] = useState<'asc' | 'desc' | undefined>(
    searchConfig.initialSort?.direction
  );
  const [page, setPage] = useState(searchConfig.initialPage || 1);
  const [limit, setLimit] = useState(searchConfig.initialLimit || 10);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);

  // Build search params
  const searchParams = {
    page,
    limit,
    orderBy,
    orderDir,
    q: searchTerm,
    filters
  };

  // Use query hook for fetching data
  const {
    data: items,
    meta,
    isLoading: loading,
    error,
    refetch: refresh
  } = useBridgeQuery(service, 'search', searchParams);

  // Use mutation hooks for CRUD operations
  const {
    mutate: createMutate,
    isLoading: creating
  } = useBridgeMutation(service, 'create', {
    successMessage: successMessages.create,
    errorMessage: errorMessages.create,
    showAlerts: notificationConfig.autoNotify
  });

  const {
    mutate: updateMutate,
    isLoading: updating
  } = useBridgeMutation(service, 'update', {
    successMessage: successMessages.update,
    errorMessage: errorMessages.update,
    showAlerts: notificationConfig.autoNotify
  });

  const {
    mutate: deleteMutate,
    isLoading: deleting
  } = useBridgeMutation(service, 'delete', {
    successMessage: successMessages.delete,
    errorMessage: errorMessages.delete,
    showAlerts: notificationConfig.autoNotify
  });

  // Show notification
  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    if (notificationConfig.showNotification) {
      notificationConfig.showNotification(message, type);
    } else if (notificationConfig.autoNotify) {
      alert(message);
    }
  }, [notificationConfig]);

  // CRUD operations
  const getItem = useCallback(async (id: string): Promise<T> => {
    try {
      return await service.getById(id);
    } catch (err: any) {
      if (notificationConfig.autoNotify && errorMessages.fetch) {
        showNotification(errorMessages.fetch, 'error');
      }
      throw err;
    }
  }, [service, notificationConfig.autoNotify, errorMessages.fetch, showNotification]);

  const createItem = useCallback(async (data: Partial<T>, options?: MutationOptions): Promise<T> => {
    // Validate data if schema is provided
    if (schemas?.create) {
      const result = validateWithSchema(schemas.create, data);

      if (!result.success) {
        setValidationErrors(result.errors || null);
        throw new Error('Validation failed');
      }

      data = result.data as T;
    }

    try {
      const result = await createMutate(data, options);

      // Refresh data
      await refresh();

      return result;
    } catch (err: any) {
      throw err;
    }
  }, [createMutate, refresh, schemas?.create]);

  const updateItem = useCallback(async (id: string, data: Partial<T>, options?: MutationOptions): Promise<T> => {
    // Validate data if schema is provided
    if (schemas?.update) {
      const result = validateWithSchema(schemas.update, data);

      if (!result.success) {
        setValidationErrors(result.errors || null);
        throw new Error('Validation failed');
      }

      data = result.data as Partial<T>;
    }

    try {
      const result = await updateMutate({ id, data }, options);

      // Refresh data
      await refresh();

      return result;
    } catch (err: any) {
      throw err;
    }
  }, [updateMutate, refresh, schemas?.update]);

  const deleteItem = useCallback(async (id: string, options?: MutationOptions): Promise<void> => {
    try {
      await deleteMutate(id, options);

      // Refresh data
      await refresh();
    } catch (err: any) {
      throw err;
    }
  }, [deleteMutate, refresh]);

  // Search functions
  const addFilter = useCallback((field: string, operator: FilterOperator | string, value: any) => {
    setFilters(prev => [
      ...prev.filter(f => f.field !== field),
      { field, operator, value }
    ]);
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters(prev => prev.filter(f => f.field !== field));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters([]);
    setSearchTerm('');
    setOrderBy(searchConfig.initialSort?.field);
    setOrderDir(searchConfig.initialSort?.direction);
    setPage(1);
  }, [searchConfig.initialSort]);

  const setSort = useCallback((field: string, direction?: 'asc' | 'desc') => {
    if (orderBy === field && !direction) {
      // Toggle direction if same field
      setOrderDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrderDir(direction || 'asc');
    }
  }, [orderBy]);

  // Reset page when search term or filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  return {
    // Data
    items,
    selectedItem,
    totalItems: meta?.total || 0,

    // Loading states
    loading,
    creating,
    updating,
    deleting,

    // Errors
    error,
    validationErrors,

    // Pagination
    page,
    limit,
    hasMore: meta?.hasMore || false,
    setPage,
    setLimit,

    // Sorting
    orderBy,
    orderDir,
    setSort,

    // Search
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    resetFilters,

    // CRUD operations
    getItem,
    createItem,
    updateItem,
    deleteItem,

    // Refresh
    refresh,

    // Selection
    selectItem: setSelectedItem
  };
}
