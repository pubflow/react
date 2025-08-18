/**
 * Search Query Builder Hook for React
 *
 * Provides utilities for building complex search queries
 */
import { FilterDefinition, FilterOperator } from '@pubflow/core';
/**
 * Search field definition
 */
export interface SearchField {
    /**
     * Field name
     */
    name: string;
    /**
     * Display label
     */
    label: string;
    /**
     * Field type
     */
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    /**
     * Whether the field is searchable
     */
    searchable?: boolean;
    /**
     * Whether the field is filterable
     */
    filterable?: boolean;
    /**
     * Whether the field is sortable
     */
    sortable?: boolean;
    /**
     * Options for select type
     */
    options?: {
        label: string;
        value: any;
    }[];
    /**
     * Default operator for this field
     */
    defaultOperator?: FilterOperator;
}
/**
 * Search query state
 */
export interface SearchQueryState {
    /**
     * Search term
     */
    searchTerm: string;
    /**
     * Active filters
     */
    filters: FilterDefinition[];
    /**
     * Sort field
     */
    sortField?: string;
    /**
     * Sort direction
     */
    sortDirection?: 'asc' | 'desc';
    /**
     * Current page
     */
    page: number;
    /**
     * Items per page
     */
    limit: number;
}
/**
 * Search query builder hook result
 */
export interface UseSearchQueryBuilderResult {
    /**
     * Current query state
     */
    queryState: SearchQueryState;
    /**
     * Set search term
     */
    setSearchTerm: (term: string) => void;
    /**
     * Add a filter
     */
    addFilter: (filter: FilterDefinition) => void;
    /**
     * Remove a filter by index
     */
    removeFilter: (index: number) => void;
    /**
     * Update a filter
     */
    updateFilter: (index: number, filter: FilterDefinition) => void;
    /**
     * Clear all filters
     */
    clearFilters: () => void;
    /**
     * Set sort
     */
    setSort: (field: string, direction: 'asc' | 'desc') => void;
    /**
     * Clear sort
     */
    clearSort: () => void;
    /**
     * Set page
     */
    setPage: (page: number) => void;
    /**
     * Set limit
     */
    setLimit: (limit: number) => void;
    /**
     * Reset query to initial state
     */
    resetQuery: () => void;
    /**
     * Build query string for API
     */
    buildQueryString: () => string;
    /**
     * Build query object for API
     */
    buildQueryObject: () => Record<string, any>;
    /**
     * Get searchable fields
     */
    getSearchableFields: () => SearchField[];
    /**
     * Get filterable fields
     */
    getFilterableFields: () => SearchField[];
    /**
     * Get sortable fields
     */
    getSortableFields: () => SearchField[];
}
/**
 * Hook for building search queries
 *
 * @param fields Available search fields
 * @param initialState Initial query state
 * @returns Search query builder result
 */
export declare function useSearchQueryBuilder(fields: SearchField[], initialState?: Partial<SearchQueryState>): UseSearchQueryBuilderResult;
