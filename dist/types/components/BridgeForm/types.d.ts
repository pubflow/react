/**
 * Types for BridgeForm component
 */
import { ReactNode, CSSProperties } from 'react';
import { z } from 'zod';
import { EntityConfig } from '@pubflow/core';
/**
 * Field configuration for BridgeForm
 */
export interface FieldConfig {
    /** Field name (must exist in the schema) */
    name: string;
    /** Custom label (defaults to formatted field name) */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Help text description */
    description?: string;
    /** Field type */
    type?: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio' | 'date' | 'textarea' | 'file' | 'color' | 'range' | 'hidden';
    /** Options for select/radio fields */
    options?: Array<{
        value: any;
        label: string;
    }>;
    /** Field width (%, px, etc.) */
    width?: string;
    /** Whether the field should be hidden */
    hidden?: boolean;
    /** Whether the field should be disabled */
    disabled?: boolean;
    /** Default value */
    defaultValue?: any;
    /** Whether the field should have autofocus */
    autoFocus?: boolean;
    /** Custom CSS class */
    className?: string;
    /** Inline styles */
    style?: CSSProperties;
    /** Custom render function */
    render?: (props: FieldRenderProps) => ReactNode;
}
/**
 * Props for custom field rendering
 */
export interface FieldRenderProps {
    /** Field configuration */
    field: FieldConfig;
    /** Current field value */
    value: any;
    /** Function to change value */
    onChange: (value: any) => void;
    /** Function for blur event */
    onBlur: () => void;
    /** Validation error if any */
    error?: string;
    /** Whether the field is required */
    required: boolean;
    /** Whether the field is disabled */
    disabled: boolean;
    /** Whether dark mode is active */
    isDarkMode: boolean;
}
/**
 * BridgeForm component props
 */
export interface BridgeFormProps<T extends Record<string, any>> {
    /** Zod schema for validation */
    schema: z.ZodType<T>;
    /** Form mode */
    mode: 'create' | 'update' | 'partial';
    /** Entity configuration for BridgeApi */
    entityConfig: EntityConfig;
    /** Pubflow instance ID */
    instanceId?: string;
    /** Initial data (for update/partial mode) */
    initialData?: Partial<T>;
    /** Record ID (for update/partial mode) */
    id?: string;
    /** Fields to display (all schema fields by default) */
    fields?: FieldConfig[];
    /** Layout configuration */
    layout?: {
        /** Number of columns or responsive configuration */
        columns?: number | {
            sm?: number;
            md?: number;
            lg?: number;
        };
        /** Gap between fields */
        gap?: string;
    };
    /** Success callback */
    onSuccess?: (data: T) => void;
    /** Error callback */
    onError?: (error: Error) => void;
    /** Cancel callback */
    onCancel?: () => void;
    /** Custom labels */
    labels?: {
        /** Submit button text */
        submit?: string;
        /** Cancel button text */
        cancel?: string;
        /** Required field indicator text */
        required?: string;
    };
    /** Theme */
    theme?: 'light' | 'dark' | 'auto';
    /** Main color for the form (buttons, focus rings, etc.) */
    mainColor?: string;
    /** Custom CSS class */
    className?: string;
    /** Inline styles */
    style?: CSSProperties;
    /** Custom styles for form elements */
    customStyles?: {
        form?: string;
        field?: string;
        label?: string;
        input?: string;
        select?: string;
        checkbox?: string;
        radio?: string;
        button?: string;
        error?: string;
    };
}
