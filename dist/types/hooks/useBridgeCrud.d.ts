/**
 * Bridge CRUD Hook for React
 *
 * Provides a hook for CRUD operations using Bridge API
 */
import { EntityConfig, EntityData, FilterOperator } from '@pubflow/core';
import { MutationOptions } from './useBridgeMutation';
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
    items: T[];
    selectedItem: T | null;
    totalItems: number;
    loading: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    error: Error | null;
    validationErrors: Record<string, string[]> | null;
    page: number;
    limit: number;
    hasMore: boolean;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    orderBy: string | undefined;
    orderDir: 'asc' | 'desc' | undefined;
    setSort: (field: string, direction?: 'asc' | 'desc') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filters: Array<{
        field: string;
        operator: FilterOperator | string;
        value: any;
    }>;
    addFilter: (field: string, operator: FilterOperator | string, value: any) => void;
    removeFilter: (field: string) => void;
    resetFilters: () => void;
    getItem: (id: string) => Promise<T>;
    createItem: (data: Partial<T>, options?: MutationOptions) => Promise<T>;
    updateItem: (id: string, data: Partial<T>, options?: MutationOptions) => Promise<T>;
    deleteItem: (id: string, options?: MutationOptions) => Promise<void>;
    refresh: () => Promise<void>;
    selectItem: (item: T | null) => void;
}
/**
 * Hook for CRUD operations using Bridge API
 *
 * @param options Hook options
 * @returns CRUD hook result
 */
export declare function useBridgeCrud<T extends EntityData, U = Partial<T>, V = Partial<T>>(options: UseBridgeCrudOptions<T, U, V>): UseBridgeCrudResult<T>;
