/**
 * Bridge List Component for React
 * 
 * Provides a list component with sorting, filtering, and pagination
 */

import React from 'react';
import { EntityData, EntityConfig, FilterDefinition } from '@pubflow/core';
import { useBridgeCrud } from '../hooks/useBridgeCrud';
import { AdvancedFilter, FilterField } from './AdvancedFilter';
import { useNetworkStatus } from './OfflineIndicator';

/**
 * Bridge List render item props
 */
export interface BridgeListRenderItemProps<T> {
  item: T;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * Bridge List texts
 */
export interface BridgeListTexts {
  searchPlaceholder?: string;
  offlineText?: string;
  noResults?: string;
  loading?: string;
  error?: string;
  loadMore?: string;
  showingResults?: string;
  of?: string;
  results?: string;
}

/**
 * Bridge List colors
 */
export interface BridgeListColors {
  primary?: string;
  secondary?: string;
  background?: string;
  surface?: string;
  text?: string;
  textSecondary?: string;
  border?: string;
  error?: string;
  success?: string;
}

/**
 * Bridge List layout configuration
 */
export interface BridgeListLayout {
  advancedFilterWidth?: number;
  contentWidth?: number;
}

/**
 * Bridge List props
 */
export interface BridgeListProps<T extends EntityData> {
  /**
   * Function to render each item
   */
  renderItem: (props: BridgeListRenderItemProps<T>) => React.ReactNode;
  
  /**
   * Entity configuration
   */
  entityConfig: EntityConfig;
  
  /**
   * Show pagination
   */
  showPagination?: boolean;
  
  /**
   * Show search
   */
  showSearch?: boolean;
  
  /**
   * Show filters
   */
  showFilters?: boolean;
  
  /**
   * Show advanced filters
   */
  showAdvancedFilters?: boolean;
  
  /**
   * Advanced filter fields
   */
  advancedFilterFields?: FilterField[];
  
  /**
   * Layout configuration
   */
  layout?: BridgeListLayout;
  
  /**
   * Key extractor function
   */
  keyExtractor?: (item: T) => string;
  
  /**
   * Item press handler
   */
  onItemPress?: (item: T) => void;
  
  /**
   * Container style
   */
  style?: React.CSSProperties;
  
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
   * Advanced filter component
   */
  advancedFilterComponent?: React.ReactNode;
  
  /**
   * Custom texts
   */
  texts?: BridgeListTexts;
  
  /**
   * Custom colors
   */
  colors?: BridgeListColors;
  
  /**
   * Show offline indicator
   */
  showOfflineIndicator?: boolean;
  
  /**
   * Pubflow instance ID
   */
  instanceId?: string;
  
  /**
   * Custom CSS class
   */
  className?: string;
  
  // Additional CRUD options
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  initialFilters?: FilterDefinition[];
}

/**
 * Component for displaying data in a list with sorting, filtering, and pagination
 */
export function BridgeList<T extends EntityData>({
  renderItem,
  showPagination = true,
  showSearch = true,
  showFilters = true,
  showAdvancedFilters = false,
  advancedFilterFields = [],
  layout = { advancedFilterWidth: 30, contentWidth: 70 },
  keyExtractor = (item) => item.id,
  onItemPress,
  style,
  loadingComponent,
  emptyComponent,
  errorComponent,
  paginationComponent,
  searchComponent,
  filterComponent,
  advancedFilterComponent,
  texts = {},
  colors = {},
  showOfflineIndicator = true,
  className = '',
  ...crudOptions
}: BridgeListProps<T>) {
  // Default texts
  const defaultTexts: Required<BridgeListTexts> = {
    searchPlaceholder: 'Search...',
    offlineText: 'You are offline. Some features may be limited.',
    noResults: 'No results found',
    loading: 'Loading...',
    error: 'Error loading data',
    loadMore: 'Load More',
    showingResults: 'Showing',
    of: 'of',
    results: 'results',
    ...texts
  };
  
  // Default colors
  const defaultColors: Required<BridgeListColors> = {
    primary: '#006aff',
    secondary: '#4a90e2',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#1a1a1a',
    textSecondary: '#666666',
    border: '#e9ecef',
    error: '#dc2626',
    success: '#22c55e',
    ...colors
  };
  
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
  
  // Network status
  const { isOffline } = useNetworkStatus();
  
  // Render search component
  const renderSearch = () => {
    if (!showSearch) return null;
    
    if (searchComponent) return searchComponent;
    
    return (
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder={defaultTexts.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: `1px solid ${defaultColors.border}`,
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none',
            backgroundColor: defaultColors.surface
          }}
        />
      </div>
    );
  };
  
  // Render advanced filters
  const renderAdvancedFilters = () => {
    if (!showAdvancedFilters || advancedFilterFields.length === 0) return null;

    if (advancedFilterComponent) return advancedFilterComponent;

    // Create wrapper functions to match AdvancedFilter interface
    const handleAddFilter = (filter: FilterDefinition) => {
      addFilter(filter.field, filter.operator as string, filter.value);
    };

    const handleRemoveFilter = (index: number) => {
      if (filters[index]) {
        removeFilter(filters[index].field);
      }
    };

    return (
      <AdvancedFilter
        fields={advancedFilterFields}
        filters={filters}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onResetFilters={resetFilters}
        colors={defaultColors}
        style={{ marginBottom: '16px' }}
      />
    );
  };
  
  // Render pagination
  const renderPagination = () => {
    if (!showPagination || !hasMore) return null;
    
    if (paginationComponent) return paginationComponent;
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '16px',
        marginTop: '16px',
        padding: '16px'
      }}>
        <button
          onClick={() => setPage(page + 1)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: defaultColors.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Loading...' : defaultTexts.loadMore}
        </button>
        
        {totalItems && (
          <span style={{ fontSize: '14px', color: defaultColors.textSecondary }}>
            {defaultTexts.showingResults} {items.length} {defaultTexts.of} {totalItems} {defaultTexts.results}
          </span>
        )}
      </div>
    );
  };
  
  // Render offline indicator
  const renderOfflineIndicator = () => {
    if (!showOfflineIndicator || !isOffline) return null;
    
    return (
      <div style={{
        backgroundColor: defaultColors.error,
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        {defaultTexts.offlineText}
      </div>
    );
  };
  
  // Render loading state
  if (loading && items.length === 0) {
    return (
      <div className={className} style={style}>
        {loadingComponent || (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px',
            color: defaultColors.textSecondary 
          }}>
            {defaultTexts.loading}
          </div>
        )}
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={className} style={style}>
        {errorComponent || (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px',
            color: defaultColors.error 
          }}>
            {defaultTexts.error}
            <br />
            <button
              onClick={refresh}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: defaultColors.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Main container style
  const containerStyle: React.CSSProperties = {
    backgroundColor: defaultColors.background,
    ...style
  };
  
  // Layout styles
  const layoutStyle: React.CSSProperties = showAdvancedFilters && advancedFilterFields.length > 0 ? {
    display: 'grid',
    gridTemplateColumns: `${layout.advancedFilterWidth}% ${layout.contentWidth}%`,
    gap: '16px'
  } : {};
  
  return (
    <div className={className} style={containerStyle}>
      {renderOfflineIndicator()}
      
      <div style={layoutStyle}>
        {/* Advanced Filters Sidebar */}
        {showAdvancedFilters && advancedFilterFields.length > 0 && (
          <div>
            {renderAdvancedFilters()}
          </div>
        )}
        
        {/* Main Content */}
        <div>
          {renderSearch()}
          
          {/* Items List */}
          {items.length === 0 ? (
            emptyComponent || (
              <div style={{ 
                textAlign: 'center', 
                padding: '32px',
                color: defaultColors.textSecondary 
              }}>
                {defaultTexts.noResults}
              </div>
            )
          ) : (
            <div>
              {items.map((item, index) => {
                const isSelected = selectedItem ? keyExtractor(selectedItem) === keyExtractor(item) : false;
                
                return (
                  <div
                    key={keyExtractor(item)}
                    onClick={() => {
                      selectItem(item);
                      if (onItemPress) {
                        onItemPress(item);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {renderItem({
                      item,
                      index,
                      isSelected,
                      onSelect: () => selectItem(item)
                    })}
                  </div>
                );
              })}
            </div>
          )}
          
          {renderPagination()}
        </div>
      </div>
    </div>
  );
}
