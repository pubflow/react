/**
 * Bridge Table Component for React
 *
 * Provides a component for displaying data in a table with sorting, filtering, and pagination
 */
import React from 'react';
import { EntityData } from '@pubflow/core';
import { UseBridgeCrudOptions } from '../hooks/useBridgeCrud';
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
 * Component for displaying data in a table with sorting, filtering, and pagination
 */
export declare function BridgeTable<T extends EntityData>({ columns, showPagination, showSearch, showFilters, rowKey, onRowClick, className, loadingComponent, emptyComponent, errorComponent, paginationComponent, searchComponent, filterComponent, searchPlaceholder, actions, ...crudOptions }: BridgeTableProps<T>): string | number | true | Iterable<React.ReactNode> | import("react/jsx-runtime").JSX.Element;
