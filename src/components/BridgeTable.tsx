/**
 * Bridge Table Component for React
 * 
 * Provides a component for displaying data in a table with sorting, filtering, and pagination
 */

import React, { useState } from 'react';
import { EntityData, FilterOperator } from '@pubflow/core';
import { useBridgeCrud, UseBridgeCrudOptions } from '../hooks/useBridgeCrud';

/**
 * Column definition
 */
export interface ColumnDef<T> {
  /**
   * Column key
   */
  key: string;
  
  /**
   * Column header
   */
  header: React.ReactNode;
  
  /**
   * Cell renderer
   */
  cell?: (item: T, index: number) => React.ReactNode;
  
  /**
   * Whether the column is sortable
   */
  sortable?: boolean;
  
  /**
   * Whether the column is filterable
   */
  filterable?: boolean;
  
  /**
   * Column width
   */
  width?: string | number;
  
  /**
   * Column alignment
   */
  align?: 'left' | 'center' | 'right';
}

/**
 * Bridge Table props
 */
export interface BridgeTableProps<T extends EntityData> extends UseBridgeCrudOptions<T> {
  /**
   * Column definitions
   */
  columns: ColumnDef<T>[];
  
  /**
   * Whether to show pagination
   */
  showPagination?: boolean;
  
  /**
   * Whether to show search
   */
  showSearch?: boolean;
  
  /**
   * Whether to show filters
   */
  showFilters?: boolean;
  
  /**
   * Row key function
   */
  rowKey?: (item: T) => string;
  
  /**
   * Row click handler
   */
  onRowClick?: (item: T) => void;
  
  /**
   * Table class name
   */
  className?: string;
  
  /**
   * Loading component
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Empty component
   */
  emptyComponent?: React.ReactNode;
  
  /**
   * Error component
   */
  errorComponent?: React.ReactNode;
  
  /**
   * Pagination component
   */
  paginationComponent?: React.ReactNode;
  
  /**
   * Search component
   */
  searchComponent?: React.ReactNode;
  
  /**
   * Filter component
   */
  filterComponent?: React.ReactNode;
  
  /**
   * Search placeholder
   */
  searchPlaceholder?: string;
  
  /**
   * Actions renderer
   */
  actions?: (item: T) => React.ReactNode;
}

/**
 * Default loading component
 */
const DefaultLoadingComponent = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    Loading...
  </div>
);

/**
 * Default empty component
 */
const DefaultEmptyComponent = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    No items found
  </div>
);

/**
 * Default error component
 */
const DefaultErrorComponent = ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
  <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
    <div>Error: {error.message}</div>
    <button onClick={onRetry} style={{ marginTop: '10px' }}>
      Retry
    </button>
  </div>
);

/**
 * Component for displaying data in a table with sorting, filtering, and pagination
 */
export function BridgeTable<T extends EntityData>({
  columns,
  showPagination = true,
  showSearch = true,
  showFilters = true,
  rowKey = (item) => item.id,
  onRowClick,
  className,
  loadingComponent,
  emptyComponent,
  errorComponent,
  paginationComponent,
  searchComponent,
  filterComponent,
  searchPlaceholder = 'Search...',
  actions,
  ...crudOptions
}: BridgeTableProps<T>) {
  // Use Bridge CRUD hook
  const {
    items,
    selectedItem,
    selectItem,
    loading,
    error,
    page,
    limit,
    hasMore,
    totalItems,
    setPage,
    setLimit,
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    resetFilters,
    orderBy,
    orderDir,
    setSort,
    refresh
  } = useBridgeCrud<T>(crudOptions);
  
  // State for filter input
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  
  // Handle sort
  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key);
    if (column?.sortable) {
      setSort(key);
    }
  };
  
  // Handle add filter
  const handleAddFilter = () => {
    if (filterField && filterValue) {
      addFilter(filterField, 'eq', filterValue);
      setFilterField('');
      setFilterValue('');
    }
  };
  
  // Render loading state
  if (loading && items.length === 0) {
    return loadingComponent || <DefaultLoadingComponent />;
  }
  
  // Render error state
  if (error) {
    return errorComponent || <DefaultErrorComponent error={error} onRetry={refresh} />;
  }
  
  // Render empty state
  if (items.length === 0) {
    return emptyComponent || <DefaultEmptyComponent />;
  }
  
  return (
    <div className={className}>
      {/* Search */}
      {showSearch && (
        searchComponent || (
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                padding: '8px',
                width: '100%',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
        )
      )}
      
      {/* Filters */}
      {showFilters && (
        filterComponent || (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  flex: 1
                }}
              >
                <option value="">Select field</option>
                {columns
                  .filter(col => col.filterable !== false)
                  .map(col => (
                    <option key={col.key} value={col.key}>
                      {typeof col.header === 'string' ? col.header : col.key}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Filter value"
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  flex: 2
                }}
              />
              <button
                onClick={handleAddFilter}
                disabled={!filterField || !filterValue}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#007bff',
                  color: 'white',
                  cursor: filterField && filterValue ? 'pointer' : 'not-allowed'
                }}
              >
                Add Filter
              </button>
            </div>
            
            {filters.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {filters.map((filter, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f0f0f0',
                      padding: '5px 10px',
                      borderRadius: '4px'
                    }}
                  >
                    <span>
                      {filter.field}: {String(filter.value)}
                    </span>
                    <button
                      onClick={() => removeFilter(filter.field)}
                      style={{
                        marginLeft: '5px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={resetFilters}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#dc3545',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )
      )}
      
      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #ddd'
          }}
        >
          <thead>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  style={{
                    padding: '12px',
                    textAlign: column.align || 'left',
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #ddd',
                    cursor: column.sortable ? 'pointer' : 'default',
                    width: column.width
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start' }}>
                    {column.header}
                    {column.sortable && orderBy === column.key && (
                      <span style={{ marginLeft: '5px' }}>
                        {orderDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th style={{ padding: '12px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={rowKey(item)}
                onClick={() => {
                  selectItem(item);
                  if (onRowClick) {
                    onRowClick(item);
                  }
                }}
                style={{
                  backgroundColor: selectedItem && rowKey(selectedItem) === rowKey(item) ? '#f0f0f0' : 'white',
                  cursor: onRowClick ? 'pointer' : 'default'
                }}
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #ddd',
                      textAlign: column.align || 'left'
                    }}
                  >
                    {column.cell
                      ? column.cell(item, index)
                      : (item as any)[column.key]}
                  </td>
                ))}
                {actions && (
                  <td
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #ddd',
                      textAlign: 'right'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {showPagination && (
        paginationComponent || (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '20px'
            }}
          >
            <div>
              Showing {items.length} of {totalItems} items
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 16px' }}>Page {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                style={{
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  cursor: !hasMore ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
