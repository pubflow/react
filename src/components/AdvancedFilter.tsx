/**
 * Advanced Filter Component for React
 * 
 * Provides advanced filtering capabilities for BridgeList
 */

import React, { useState } from 'react';
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
  options?: { label: string; value: any }[];
  
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
 * Available filter operators
 */
const OPERATORS: { [key: string]: { label: string; value: FilterOperator }[] } = {
  text: [
    { label: 'Contains', value: FilterOperator.CONTAINS },
    { label: 'Equals', value: FilterOperator.EQUALS },
    { label: 'Not equals', value: FilterOperator.NOT_EQUALS },
    { label: 'Starts with', value: FilterOperator.STARTS_WITH },
    { label: 'Ends with', value: FilterOperator.ENDS_WITH }
  ],
  number: [
    { label: 'Equals', value: FilterOperator.EQUALS },
    { label: 'Not equals', value: FilterOperator.NOT_EQUALS },
    { label: 'Greater than', value: FilterOperator.GREATER_THAN },
    { label: 'Greater than or equal', value: FilterOperator.GREATER_THAN_OR_EQUALS },
    { label: 'Less than', value: FilterOperator.LESS_THAN },
    { label: 'Less than or equal', value: FilterOperator.LESS_THAN_OR_EQUALS }
  ],
  date: [
    { label: 'Equals', value: FilterOperator.EQUALS },
    { label: 'Not equals', value: FilterOperator.NOT_EQUALS },
    { label: 'After', value: FilterOperator.GREATER_THAN },
    { label: 'After or on', value: FilterOperator.GREATER_THAN_OR_EQUALS },
    { label: 'Before', value: FilterOperator.LESS_THAN },
    { label: 'Before or on', value: FilterOperator.LESS_THAN_OR_EQUALS }
  ],
  boolean: [
    { label: 'Is true', value: FilterOperator.EQUALS },
    { label: 'Is false', value: FilterOperator.NOT_EQUALS }
  ],
  select: [
    { label: 'Equals', value: FilterOperator.EQUALS },
    { label: 'Not equals', value: FilterOperator.NOT_EQUALS }
  ]
};

/**
 * Advanced Filter component
 */
export function AdvancedFilter({
  fields,
  filters,
  onAddFilter,
  onRemoveFilter,
  onResetFilters,
  style,
  texts = {},
  colors = {},
  className = ''
}: AdvancedFilterProps) {
  // Default texts
  const defaultTexts: Required<AdvancedFilterTexts> = {
    title: 'Advanced Filters',
    addFilter: 'Add Filter',
    resetFilters: 'Reset Filters',
    apply: 'Apply',
    cancel: 'Cancel',
    field: 'Field',
    operator: 'Operator',
    value: 'Value',
    filterButton: 'Filter',
    activeFilters: 'Active Filters',
    noActiveFilters: 'No active filters',
    selectField: 'Select a field',
    selectOperator: 'Select an operator',
    enterValue: 'Enter a value',
    ...texts
  };
  
  // Default colors
  const defaultColors: Required<AdvancedFilterColors> = {
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
  
  // New filter state
  const [newFilter, setNewFilter] = useState<{
    field: string;
    operator: FilterOperator | '';
    value: any;
  }>({
    field: '',
    operator: '',
    value: ''
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Get available operators for selected field
  const getAvailableOperators = (fieldName: string) => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return [];
    
    if (field.operators) {
      return field.operators.map(op => ({
        label: OPERATORS[field.type]?.find(o => o.value === op)?.label || op,
        value: op
      }));
    }
    
    return OPERATORS[field.type] || [];
  };
  
  // Handle add filter
  const handleAddFilter = () => {
    if (!newFilter.field || !newFilter.operator || newFilter.value === '') {
      return;
    }
    
    const field = fields.find(f => f.name === newFilter.field);
    if (!field) return;
    
    let value = newFilter.value;
    
    // Convert value based on field type
    if (field.type === 'number') {
      value = parseFloat(value);
      if (isNaN(value)) return;
    } else if (field.type === 'boolean') {
      value = newFilter.operator === 'eq';
    }
    
    onAddFilter({
      field: newFilter.field,
      operator: newFilter.operator as FilterOperator,
      value
    });
    
    // Reset form
    setNewFilter({ field: '', operator: '', value: '' });
    setShowAddForm(false);
  };
  
  // Render filter value input
  const renderValueInput = () => {
    const field = fields.find(f => f.name === newFilter.field);
    if (!field) return null;
    
    const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: '8px 12px',
      border: `1px solid ${defaultColors.border}`,
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none'
    };
    
    switch (field.type) {
      case 'select':
        return (
          <select
            style={inputStyle}
            value={newFilter.value}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          >
            <option value="">{defaultTexts.enterValue}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case 'boolean':
        return (
          <select
            style={inputStyle}
            value={newFilter.value}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          >
            <option value="">{defaultTexts.enterValue}</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
        
      case 'date':
        return (
          <input
            type="date"
            style={inputStyle}
            value={newFilter.value}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            style={inputStyle}
            placeholder={defaultTexts.enterValue}
            value={newFilter.value}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          />
        );
        
      default:
        return (
          <input
            type="text"
            style={inputStyle}
            placeholder={defaultTexts.enterValue}
            value={newFilter.value}
            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          />
        );
    }
  };
  
  // Styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: defaultColors.background,
    border: `1px solid ${defaultColors.border}`,
    borderRadius: '12px',
    padding: '16px',
    ...style
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };
  
  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: defaultColors.primary,
    color: '#ffffff'
  };
  
  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: defaultColors.surface,
    color: defaultColors.text,
    border: `1px solid ${defaultColors.border}`
  };
  
  return (
    <div className={className} style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: defaultColors.text, fontSize: '16px', fontWeight: '600' }}>
          {defaultTexts.title}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            style={primaryButtonStyle}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {defaultTexts.addFilter}
          </button>
          {filters.length > 0 && (
            <button
              style={secondaryButtonStyle}
              onClick={onResetFilters}
            >
              {defaultTexts.resetFilters}
            </button>
          )}
        </div>
      </div>
      
      {/* Add Filter Form */}
      {showAddForm && (
        <div style={{ 
          backgroundColor: defaultColors.surface, 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: `1px solid ${defaultColors.border}`
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            {/* Field Select */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: defaultColors.textSecondary }}>
                {defaultTexts.field}
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${defaultColors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                value={newFilter.field}
                onChange={(e) => setNewFilter(prev => ({ ...prev, field: e.target.value, operator: '', value: '' }))}
              >
                <option value="">{defaultTexts.selectField}</option>
                {fields.map(field => (
                  <option key={field.name} value={field.name}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Operator Select */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: defaultColors.textSecondary }}>
                {defaultTexts.operator}
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${defaultColors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                value={newFilter.operator}
                onChange={(e) => setNewFilter(prev => ({ ...prev, operator: e.target.value as FilterOperator }))}
                disabled={!newFilter.field}
              >
                <option value="">{defaultTexts.selectOperator}</option>
                {getAvailableOperators(newFilter.field).map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Value Input */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: defaultColors.textSecondary }}>
                {defaultTexts.value}
              </label>
              {renderValueInput()}
            </div>
            
            {/* Add Button */}
            <button
              style={primaryButtonStyle}
              onClick={handleAddFilter}
              disabled={!newFilter.field || !newFilter.operator || newFilter.value === ''}
            >
              {defaultTexts.apply}
            </button>
          </div>
        </div>
      )}
      
      {/* Active Filters */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: defaultColors.textSecondary, fontSize: '14px', fontWeight: '500' }}>
          {defaultTexts.activeFilters}
        </h4>
        {filters.length === 0 ? (
          <p style={{ margin: 0, color: defaultColors.textSecondary, fontSize: '14px', fontStyle: 'italic' }}>
            {defaultTexts.noActiveFilters}
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {filters.map((filter, index) => {
              const field = fields.find(f => f.name === filter.field);
              const operator = getAvailableOperators(filter.field).find(op => op.value === filter.operator);
              
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: defaultColors.primary,
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  <span>
                    {field?.label} {operator?.label} {String(filter.value)}
                  </span>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      marginLeft: '4px',
                      fontSize: '14px',
                      padding: '0 2px'
                    }}
                    onClick={() => onRemoveFilter(index)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
