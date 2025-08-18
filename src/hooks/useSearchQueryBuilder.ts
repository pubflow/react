/**
 * Search Query Builder Hook for React
 * 
 * Provides utilities for building complex search queries
 */

import { useState, useCallback } from 'react';
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
  options?: { label: string; value: any }[];
  
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
export function useSearchQueryBuilder(
  fields: SearchField[],
  initialState: Partial<SearchQueryState> = {}
): UseSearchQueryBuilderResult {
  // Default initial state
  const defaultState: SearchQueryState = {
    searchTerm: '',
    filters: [],
    page: 1,
    limit: 20,
    ...initialState
  };
  
  const [queryState, setQueryState] = useState<SearchQueryState>(defaultState);
  
  // Set search term
  const setSearchTerm = useCallback((term: string) => {
    setQueryState(prev => ({
      ...prev,
      searchTerm: term,
      page: 1 // Reset to first page when searching
    }));
  }, []);
  
  // Add filter
  const addFilter = useCallback((filter: FilterDefinition) => {
    setQueryState(prev => ({
      ...prev,
      filters: [...prev.filters, filter],
      page: 1 // Reset to first page when filtering
    }));
  }, []);
  
  // Remove filter
  const removeFilter = useCallback((index: number) => {
    setQueryState(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
      page: 1
    }));
  }, []);
  
  // Update filter
  const updateFilter = useCallback((index: number, filter: FilterDefinition) => {
    setQueryState(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => i === index ? filter : f),
      page: 1
    }));
  }, []);
  
  // Clear filters
  const clearFilters = useCallback(() => {
    setQueryState(prev => ({
      ...prev,
      filters: [],
      page: 1
    }));
  }, []);
  
  // Set sort
  const setSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setQueryState(prev => ({
      ...prev,
      sortField: field,
      sortDirection: direction,
      page: 1
    }));
  }, []);
  
  // Clear sort
  const clearSort = useCallback(() => {
    setQueryState(prev => ({
      ...prev,
      sortField: undefined,
      sortDirection: undefined
    }));
  }, []);
  
  // Set page
  const setPage = useCallback((page: number) => {
    setQueryState(prev => ({
      ...prev,
      page
    }));
  }, []);
  
  // Set limit
  const setLimit = useCallback((limit: number) => {
    setQueryState(prev => ({
      ...prev,
      limit,
      page: 1 // Reset to first page when changing limit
    }));
  }, []);
  
  // Reset query
  const resetQuery = useCallback(() => {
    setQueryState(defaultState);
  }, [defaultState]);
  
  // Build query string
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    
    if (queryState.searchTerm) {
      params.append('search', queryState.searchTerm);
    }
    
    queryState.filters.forEach((filter, index) => {
      params.append(`filter[${index}][field]`, filter.field);
      params.append(`filter[${index}][operator]`, filter.operator);
      params.append(`filter[${index}][value]`, String(filter.value));
    });
    
    if (queryState.sortField) {
      params.append('sort', queryState.sortField);
      params.append('order', queryState.sortDirection || 'asc');
    }
    
    params.append('page', String(queryState.page));
    params.append('limit', String(queryState.limit));
    
    return params.toString();
  }, [queryState]);
  
  // Build query object
  const buildQueryObject = useCallback(() => {
    const query: Record<string, any> = {
      page: queryState.page,
      limit: queryState.limit
    };
    
    if (queryState.searchTerm) {
      query.search = queryState.searchTerm;
    }
    
    if (queryState.filters.length > 0) {
      query.filters = queryState.filters;
    }
    
    if (queryState.sortField) {
      query.orderBy = queryState.sortField;
      query.orderDir = queryState.sortDirection || 'asc';
    }
    
    return query;
  }, [queryState]);
  
  // Get searchable fields
  const getSearchableFields = useCallback(() => {
    return fields.filter(field => field.searchable !== false);
  }, [fields]);
  
  // Get filterable fields
  const getFilterableFields = useCallback(() => {
    return fields.filter(field => field.filterable !== false);
  }, [fields]);
  
  // Get sortable fields
  const getSortableFields = useCallback(() => {
    return fields.filter(field => field.sortable !== false);
  }, [fields]);
  
  return {
    queryState,
    setSearchTerm,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    setSort,
    clearSort,
    setPage,
    setLimit,
    resetQuery,
    buildQueryString,
    buildQueryObject,
    getSearchableFields,
    getFilterableFields,
    getSortableFields
  };
}
