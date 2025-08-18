/**
 * Bridge List Component for React
 *
 * Provides a list component with sorting, filtering, and pagination
 */
import React from 'react';
import { EntityData, EntityConfig, FilterDefinition } from '@pubflow/core';
import { FilterField } from './AdvancedFilter';
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
    limit?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    initialFilters?: FilterDefinition[];
}
/**
 * Component for displaying data in a list with sorting, filtering, and pagination
 */
export declare function BridgeList<T extends EntityData>({ renderItem, showPagination, showSearch, showFilters, showAdvancedFilters, advancedFilterFields, layout, keyExtractor, onItemPress, style, loadingComponent, emptyComponent, errorComponent, paginationComponent, searchComponent, filterComponent, advancedFilterComponent, texts, colors, showOfflineIndicator, className, ...crudOptions }: BridgeListProps<T>): import("react/jsx-runtime").JSX.Element;
