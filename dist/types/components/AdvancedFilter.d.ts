/**
 * Advanced Filter Component for React
 *
 * Provides advanced filtering capabilities for BridgeList
 */
import React from 'react';
import { FilterOperator, FilterDefinition } from '@pubflow/core';
/**
 * Filter field definition
 */
export interface FilterField {
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
     * Options for select type
     */
    options?: {
        label: string;
        value: any;
    }[];
    /**
     * Allowed operators
     */
    operators?: FilterOperator[];
}
/**
 * Advanced filter texts
 */
export interface AdvancedFilterTexts {
    title?: string;
    addFilter?: string;
    resetFilters?: string;
    apply?: string;
    cancel?: string;
    field?: string;
    operator?: string;
    value?: string;
    filterButton?: string;
    activeFilters?: string;
    noActiveFilters?: string;
    selectField?: string;
    selectOperator?: string;
    enterValue?: string;
}
/**
 * Advanced filter colors
 */
export interface AdvancedFilterColors {
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
 * Advanced filter props
 */
export interface AdvancedFilterProps {
    /**
     * Available filter fields
     */
    fields: FilterField[];
    /**
     * Current filters
     */
    filters: FilterDefinition[];
    /**
     * Add filter callback
     */
    onAddFilter: (filter: FilterDefinition) => void;
    /**
     * Remove filter callback
     */
    onRemoveFilter: (index: number) => void;
    /**
     * Reset filters callback
     */
    onResetFilters: () => void;
    /**
     * Container style
     */
    style?: React.CSSProperties;
    /**
     * Custom texts
     */
    texts?: AdvancedFilterTexts;
    /**
     * Custom colors
     */
    colors?: AdvancedFilterColors;
    /**
     * Custom CSS class
     */
    className?: string;
}
/**
 * Advanced Filter component
 */
export declare function AdvancedFilter({ fields, filters, onAddFilter, onRemoveFilter, onResetFilters, style, texts, colors, className }: AdvancedFilterProps): import("react/jsx-runtime").JSX.Element;
