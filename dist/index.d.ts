import * as _pubflow_core from '@pubflow/core';
import { EntityData, BridgeApiService, EntityConfig, FilterOperator, FilterDefinition, PubflowInstanceConfig, ApiClient, AuthService, User, PubflowConfig, QueryParams, SearchParams, StorageAdapter } from '@pubflow/core';
export * from '@pubflow/core';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React, { CSSProperties, ReactNode } from 'react';
import { z } from 'zod';
import { SWRConfiguration } from 'swr';

/**
 * Bridge View props
 */
interface BridgeViewProps {
    /**
     * Content to render if conditions are met
     */
    children: React.ReactNode;
    /**
     * User types allowed to view the content
     */
    allowedTypes?: string | string[];
    /**
     * Content to render if conditions are not met
     */
    fallback?: React.ReactNode;
    /**
     * Loading component
     */
    loadingComponent?: React.ReactNode;
    /**
     * Callback when user is not authorized
     */
    onUnauthorized?: () => void;
    /**
     * Pubflow instance ID
     */
    instanceId?: string;
}
/**
 * Component for conditional rendering based on authentication and user type
 */
declare function BridgeView({ children, allowedTypes, fallback, loadingComponent, onUnauthorized, instanceId }: BridgeViewProps): react_jsx_runtime.JSX.Element;

/**
 * Bridge Mutation Hook for React
 *
 * Provides a hook for mutating data using Bridge API
 */

/**
 * Mutation types
 */
type MutationType = 'create' | 'update' | 'delete';
/**
 * Mutation parameters
 */
type MutationParams<T, M> = M extends 'create' ? Partial<T> : M extends 'update' ? {
    id: string;
    data: Partial<T>;
} : M extends 'delete' ? string : never;
/**
 * Mutation result
 */
type MutationResult<T, M> = M extends 'create' ? T : M extends 'update' ? T : M extends 'delete' ? void : never;
/**
 * Mutation options
 */
interface MutationOptions {
    /**
     * Whether to invalidate queries after mutation
     */
    invalidateQueries?: boolean;
    /**
     * Success message
     */
    successMessage?: string;
    /**
     * Error message
     */
    errorMessage?: string;
    /**
     * Success callback
     */
    onSuccess?: (data: any) => void;
    /**
     * Error callback
     */
    onError?: (error: Error) => void;
    /**
     * Whether to show alerts for success/error
     */
    showAlerts?: boolean;
}
/**
 * Bridge mutation hook result
 */
interface UseBridgeMutationResult<T, M extends MutationType> {
    mutate: (params: MutationParams<T, M>, options?: MutationOptions) => Promise<MutationResult<T, M>>;
    isLoading: boolean;
    error: Error | null;
    reset: () => void;
}
/**
 * Hook for mutating data using Bridge API
 *
 * @param service Bridge API service
 * @param type Mutation type
 * @param defaultOptions Default mutation options
 * @returns Mutation result
 */
declare function useBridgeMutation<T extends EntityData, M extends MutationType>(service: BridgeApiService<T>, type: M, defaultOptions?: MutationOptions): UseBridgeMutationResult<T, M>;

/**
 * Bridge CRUD Hook for React
 *
 * Provides a hook for CRUD operations using Bridge API
 */

/**
 * Search configuration
 */
interface SearchConfig {
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
interface EntitySchemas<T, U, V> {
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
interface SuccessMessages {
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
interface ErrorMessages {
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
interface UseBridgeCrudOptions<T extends EntityData, U = Partial<T>, V = Partial<T>> {
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
interface UseBridgeCrudResult<T extends EntityData> {
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
declare function useBridgeCrud<T extends EntityData, U = Partial<T>, V = Partial<T>>(options: UseBridgeCrudOptions<T, U, V>): UseBridgeCrudResult<T>;

/**
 * Column definition
 */
interface ColumnDef<T> {
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
interface BridgeTableProps<T extends EntityData> extends UseBridgeCrudOptions<T> {
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
declare function BridgeTable<T extends EntityData>({ columns, showPagination, showSearch, showFilters, rowKey, onRowClick, className, loadingComponent, emptyComponent, errorComponent, paginationComponent, searchComponent, filterComponent, searchPlaceholder, actions, ...crudOptions }: BridgeTableProps<T>): string | number | true | Iterable<React.ReactNode> | react_jsx_runtime.JSX.Element;

/**
 * Types for BridgeForm component
 */

/**
 * Field configuration for BridgeForm
 */
interface FieldConfig {
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
interface FieldRenderProps {
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
interface BridgeFormProps<T extends Record<string, any>> {
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

/**
 * BridgeForm component
 */
declare function BridgeForm<T extends Record<string, any>>({ schema, mode, entityConfig, instanceId, initialData, id, fields, layout, onSuccess, onError, onCancel, labels, theme, mainColor, className, style, customStyles }: BridgeFormProps<T>): react_jsx_runtime.JSX.Element;

/**
 * Filter field definition
 */
interface FilterField {
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
interface AdvancedFilterTexts {
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
interface AdvancedFilterColors {
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
interface AdvancedFilterProps {
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
declare function AdvancedFilter({ fields, filters, onAddFilter, onRemoveFilter, onResetFilters, style, texts, colors, className }: AdvancedFilterProps): react_jsx_runtime.JSX.Element;

/**
 * Bridge List render item props
 */
interface BridgeListRenderItemProps<T> {
    item: T;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
}
/**
 * Bridge List texts
 */
interface BridgeListTexts {
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
interface BridgeListColors {
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
interface BridgeListLayout {
    advancedFilterWidth?: number;
    contentWidth?: number;
}
/**
 * Bridge List props
 */
interface BridgeListProps<T extends EntityData> {
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
declare function BridgeList<T extends EntityData>({ renderItem, showPagination, showSearch, showFilters, showAdvancedFilters, advancedFilterFields, layout, keyExtractor, onItemPress, style, loadingComponent, emptyComponent, errorComponent, paginationComponent, searchComponent, filterComponent, advancedFilterComponent, texts, colors, showOfflineIndicator, className, ...crudOptions }: BridgeListProps<T>): react_jsx_runtime.JSX.Element;

/**
 * Offline Indicator props
 */
interface OfflineIndicatorProps {
    /**
     * Text to display when offline
     */
    offlineText?: string;
    /**
     * Text to display when back online
     */
    onlineText?: string;
    /**
     * Duration to show the online message (in ms)
     */
    onlineDuration?: number;
    /**
     * Style for the container
     */
    style?: React.CSSProperties;
    /**
     * Style for the offline text
     */
    offlineTextStyle?: React.CSSProperties;
    /**
     * Style for the online text
     */
    onlineTextStyle?: React.CSSProperties;
    /**
     * Whether to show the indicator
     */
    visible?: boolean;
    /**
     * Position of the indicator
     */
    position?: 'top' | 'bottom';
    /**
     * Custom CSS class
     */
    className?: string;
}
/**
 * Component for displaying an offline indicator
 */
declare function OfflineIndicator({ offlineText, onlineText, onlineDuration, style, offlineTextStyle, onlineTextStyle, visible, position, className }: OfflineIndicatorProps): react_jsx_runtime.JSX.Element | null;
/**
 * Hook to get network status
 */
declare function useNetworkStatus(): {
    isOnline: boolean;
    isOffline: boolean;
};

/**
 * Login form configuration
 */
interface LoginFormConfig {
    /**
     * Primary color for branding
     */
    primaryColor?: string;
    /**
     * Secondary color for accents
     */
    secondaryColor?: string;
    /**
     * Application name
     */
    appName?: string;
    /**
     * Logo URL or component
     */
    logo?: string | React.ReactNode;
    /**
     * Show password reset link
     */
    showPasswordReset?: boolean;
    /**
     * Show account creation link
     */
    showAccountCreation?: boolean;
    /**
     * Custom styling
     */
    className?: string;
    /**
     * Redirect path after successful login
     */
    redirectPath?: string;
}
/**
 * Login form props
 */
interface LoginFormProps {
    /**
     * Configuration options
     */
    config?: LoginFormConfig;
    /**
     * Success callback
     */
    onSuccess?: (user: any) => void;
    /**
     * Error callback
     */
    onError?: (error: string) => void;
    /**
     * Password reset callback
     */
    onPasswordReset?: () => void;
    /**
     * Account creation callback
     */
    onAccountCreation?: () => void;
    /**
     * Pubflow instance ID
     */
    instanceId?: string;
}
/**
 * Professional login form component
 */
declare function LoginForm({ config, onSuccess, onError, onPasswordReset, onAccountCreation, instanceId }: LoginFormProps): react_jsx_runtime.JSX.Element;

/**
 * Password reset form configuration
 */
interface PasswordResetFormConfig {
    /**
     * Primary color for branding
     */
    primaryColor?: string;
    /**
     * Application name
     */
    appName?: string;
    /**
     * Logo URL or component
     */
    logo?: string | React.ReactNode;
    /**
     * API base URL
     */
    apiBaseUrl?: string;
    /**
     * Custom styling
     */
    className?: string;
}
/**
 * Password reset form props
 */
interface PasswordResetFormProps {
    /**
     * Configuration options
     */
    config?: PasswordResetFormConfig;
    /**
     * Success callback
     */
    onSuccess?: () => void;
    /**
     * Error callback
     */
    onError?: (error: string) => void;
    /**
     * Back to login callback
     */
    onBackToLogin?: () => void;
    /**
     * Reset token from URL (for reset step)
     */
    resetToken?: string;
}
/**
 * Professional password reset form component
 */
declare function PasswordResetForm({ config, onSuccess, onError, onBackToLogin, resetToken }: PasswordResetFormProps): react_jsx_runtime.JSX.Element;

/**
 * Account creation form configuration
 */
interface AccountCreationFormConfig {
    /**
     * Primary color for branding
     */
    primaryColor?: string;
    /**
     * Application name
     */
    appName?: string;
    /**
     * Logo URL or component
     */
    logo?: string | React.ReactNode;
    /**
     * API base URL
     */
    apiBaseUrl?: string;
    /**
     * Custom styling
     */
    className?: string;
    /**
     * Required fields
     */
    requiredFields?: string[];
}
/**
 * Account creation form props
 */
interface AccountCreationFormProps {
    /**
     * Configuration options
     */
    config?: AccountCreationFormConfig;
    /**
     * Success callback
     */
    onSuccess?: () => void;
    /**
     * Error callback
     */
    onError?: (error: string) => void;
    /**
     * Back to login callback
     */
    onBackToLogin?: () => void;
}
/**
 * Professional account creation form component
 */
declare function AccountCreationForm({ config, onSuccess, onError, onBackToLogin }: AccountCreationFormProps): react_jsx_runtime.JSX.Element;

/**
 * Theme configuration interface
 */
interface ThemeConfig {
    /**
     * Primary color for branding
     */
    primaryColor: string;
    /**
     * Secondary color for accents
     */
    secondaryColor: string;
    /**
     * Application name
     */
    appName: string;
    /**
     * Logo URL or component
     */
    logo?: string | ReactNode;
    /**
     * Success color
     */
    successColor: string;
    /**
     * Error color
     */
    errorColor: string;
    /**
     * Warning color
     */
    warningColor: string;
    /**
     * Background colors
     */
    backgroundColor: string;
    surfaceColor: string;
    /**
     * Text colors
     */
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    /**
     * Border colors
     */
    borderColor: string;
    borderColorFocus: string;
    /**
     * Shadow colors
     */
    shadowColor: string;
    /**
     * Font family
     */
    fontFamily: string;
    /**
     * Border radius
     */
    borderRadius: {
        small: string;
        medium: string;
        large: string;
    };
    /**
     * Spacing
     */
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
}
/**
 * Theme provider props
 */
interface ThemeProviderProps {
    children: ReactNode;
    theme?: Partial<ThemeConfig>;
}
/**
 * Theme provider component
 */
declare function ThemeProvider({ children, theme }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
/**
 * Hook to use theme
 */
declare function useTheme(): ThemeConfig;
/**
 * Generate CSS variables from theme
 */
declare function generateCSSVariables(theme: ThemeConfig): Record<string, string>;
/**
 * CSS-in-JS style generator
 */
declare function createStyles(theme: ThemeConfig): {
    container: {
        maxWidth: string;
        margin: string;
        padding: string;
        backgroundColor: string;
        borderRadius: string;
        boxShadow: string;
        border: string;
        fontFamily: string;
    };
    logoSection: {
        textAlign: "center";
        marginBottom: string;
    };
    logo: {
        maxWidth: string;
        height: string;
        marginBottom: string;
    };
    title: {
        fontSize: string;
        fontWeight: string;
        color: string;
        marginBottom: string;
        letterSpacing: string;
    };
    subtitle: {
        fontSize: string;
        color: string;
        fontWeight: string;
        marginBottom: string;
    };
    inputGroup: {
        marginBottom: string;
    };
    inputLabel: {
        fontSize: string;
        fontWeight: string;
        color: string;
        marginBottom: string;
        letterSpacing: string;
        display: string;
    };
    inputContainer: {
        position: "relative";
        display: string;
        alignItems: string;
        backgroundColor: string;
        borderRadius: string;
        border: string;
        padding: string;
        height: string;
        boxShadow: string;
        transition: string;
    };
    inputContainerFocus: {
        borderColor: string;
    };
    input: {
        flex: number;
        fontSize: string;
        color: string;
        border: string;
        outline: string;
        backgroundColor: string;
        fontWeight: string;
    };
    button: {
        width: string;
        borderRadius: string;
        height: string;
        backgroundColor: string;
        color: string;
        fontSize: string;
        fontWeight: string;
        border: string;
        cursor: string;
        marginTop: string;
        boxShadow: string;
        letterSpacing: string;
        display: string;
        alignItems: string;
        justifyContent: string;
        gap: string;
        transition: string;
    };
    buttonSecondary: {
        backgroundColor: string;
        boxShadow: string;
    };
    buttonDisabled: {
        opacity: number;
        cursor: string;
    };
    linkButton: {
        background: string;
        border: string;
        color: string;
        fontSize: string;
        fontWeight: string;
        cursor: string;
        textDecoration: string;
        padding: string;
        textAlign: "center";
    };
    errorContainer: {
        display: string;
        alignItems: string;
        backgroundColor: string;
        padding: string;
        borderRadius: string;
        marginBottom: string;
        border: string;
    };
    successContainer: {
        display: string;
        alignItems: string;
        backgroundColor: string;
        padding: string;
        borderRadius: string;
        marginBottom: string;
        border: string;
    };
    warningContainer: {
        display: string;
        alignItems: string;
        backgroundColor: string;
        padding: string;
        borderRadius: string;
        marginBottom: string;
        border: string;
    };
    errorText: {
        color: string;
        fontSize: string;
        marginLeft: string;
        fontWeight: string;
    };
    successText: {
        color: string;
        fontSize: string;
        marginLeft: string;
        fontWeight: string;
    };
    warningText: {
        color: string;
        fontSize: string;
        marginLeft: string;
        fontWeight: string;
    };
};

/**
 * Pubflow context value
 */
interface PubflowContextValue {
    instances: Record<string, PubflowInstance>;
    defaultInstance: string;
}
/**
 * Pubflow instance
 */
interface PubflowInstance {
    config: PubflowInstanceConfig;
    apiClient: ApiClient;
    authService: AuthService;
    user: User | null | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: {
        email?: string;
        userName?: string;
        password: string;
    }) => Promise<any>;
    logout: () => Promise<void>;
    validateSession: () => Promise<{
        isValid: boolean;
        expiresAt?: string;
        user?: User;
    }>;
}
/**
 * Create Pubflow context
 */
declare const PubflowContext: React.Context<PubflowContextValue>;
/**
 * Persistent cache configuration
 */
interface PersistentCacheConfig {
    /**
     * Whether to enable persistent cache
     */
    enabled: boolean;
    /**
     * Cache provider function
     */
    provider?: () => Map<any, any>;
    /**
     * Cache options
     */
    options?: any;
}
/**
 * Pubflow provider props
 */
interface PubflowProviderProps {
    children: React.ReactNode;
    config?: PubflowConfig;
    instances?: PubflowInstanceConfig[];
    defaultInstance?: string;
    onSessionExpired?: () => void;
    onSessionRefreshed?: () => void;
    showSessionAlerts?: boolean;
    /**
     * Persistent cache configuration
     */
    persistentCache?: PersistentCacheConfig;
    /**
     * Login redirect path (for automatic redirects)
     */
    loginRedirectPath?: string;
    /**
     * Public paths that don't require authentication
     */
    publicPaths?: string[];
    /**
     * Enable debug tools
     * When enabled, debug utilities will be available
     * Default: false
     */
    enableDebugTools?: boolean;
    /**
     * Theme configuration
     */
    theme?: {
        primaryColor?: string;
        secondaryColor?: string;
        appName?: string;
        logo?: string | React.ReactNode;
    };
}
/**
 * Pubflow provider for React
 */
declare function PubflowProvider({ children, config, instances, defaultInstance, onSessionExpired, onSessionRefreshed, showSessionAlerts, persistentCache, loginRedirectPath, publicPaths, enableDebugTools, theme }: PubflowProviderProps): react_jsx_runtime.JSX.Element | null;

/**
 * Authentication Hook for React
 *
 * Provides a hook for accessing authentication functionality
 */

/**
 * Authentication hook result
 */
interface UseAuthResult {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: {
        email?: string;
        userName?: string;
        password: string;
    }) => Promise<any>;
    logout: () => Promise<void>;
    validateSession: () => Promise<{
        isValid: boolean;
        expiresAt?: string;
    }>;
    refreshUser: () => Promise<User | null>;
}
/**
 * Hook for accessing authentication functionality
 *
 * @param instanceId Pubflow instance ID
 * @returns Authentication hook result
 */
declare function useAuth(instanceId?: string): UseAuthResult;

/**
 * Bridge API Hook for React
 *
 * Provides a hook for accessing Bridge API functionality
 */

/**
 * Hook for accessing Bridge API functionality
 *
 * @param config Entity configuration
 * @param instanceId Pubflow instance ID
 * @returns Bridge API service
 */
declare function useBridgeApi<T extends EntityData>(config: EntityConfig, instanceId?: string): BridgeApiService<T>;

/**
 * Bridge API Raw Hook for React
 *
 * Provides raw API access for custom operations
 */
/**
 * Raw API request options
 */
interface RawApiRequestOptions {
    /**
     * HTTP method
     */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    /**
     * Request headers
     */
    headers?: Record<string, string>;
    /**
     * Request body
     */
    body?: any;
    /**
     * Whether to include session in request
     */
    includeSession?: boolean;
    /**
     * Request timeout in milliseconds
     */
    timeout?: number;
}
/**
 * Raw API response
 */
interface RawApiResponse<T = any> {
    /**
     * Response data
     */
    data: T;
    /**
     * Response status
     */
    status: number;
    /**
     * Response headers
     */
    headers: Record<string, string>;
    /**
     * Whether the request was successful
     */
    success: boolean;
    /**
     * Error message if any
     */
    error?: string;
}
/**
 * Bridge API Raw hook result
 */
interface UseBridgeApiRawResult {
    /**
     * Make a raw API request
     */
    request: <T = any>(endpoint: string, options?: RawApiRequestOptions) => Promise<RawApiResponse<T>>;
    /**
     * GET request shorthand
     */
    get: <T = any>(endpoint: string, options?: Omit<RawApiRequestOptions, 'method'>) => Promise<RawApiResponse<T>>;
    /**
     * POST request shorthand
     */
    post: <T = any>(endpoint: string, body?: any, options?: Omit<RawApiRequestOptions, 'method' | 'body'>) => Promise<RawApiResponse<T>>;
    /**
     * PUT request shorthand
     */
    put: <T = any>(endpoint: string, body?: any, options?: Omit<RawApiRequestOptions, 'method' | 'body'>) => Promise<RawApiResponse<T>>;
    /**
     * DELETE request shorthand
     */
    delete: <T = any>(endpoint: string, options?: Omit<RawApiRequestOptions, 'method'>) => Promise<RawApiResponse<T>>;
    /**
     * PATCH request shorthand
     */
    patch: <T = any>(endpoint: string, body?: any, options?: Omit<RawApiRequestOptions, 'method' | 'body'>) => Promise<RawApiResponse<T>>;
}
/**
 * Hook for raw Bridge API access
 *
 * @param instanceId Pubflow instance ID
 * @returns Raw API hook result
 */
declare function useBridgeApiRaw(instanceId?: string): UseBridgeApiRawResult;

/**
 * Bridge Query Hook for React
 *
 * Provides a hook for querying data using Bridge API with SWR
 */

/**
 * Bridge query types
 */
type QueryType = 'list' | 'get' | 'search';
/**
 * Bridge query parameters
 */
type BridgeQueryParams<T> = T extends 'list' ? QueryParams : T extends 'get' ? {
    id: string;
    params?: QueryParams;
} : T extends 'search' ? SearchParams : never;
/**
 * Bridge query hook result
 */
interface UseBridgeQueryResult<T extends EntityData, Q extends QueryType> {
    data: Q extends 'list' | 'search' ? T[] : T | null;
    meta: Q extends 'list' | 'search' ? {
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
    } : null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}
/**
 * Hook for querying data using Bridge API with SWR
 *
 * @param service Bridge API service
 * @param type Query type
 * @param params Query parameters
 * @param config SWR configuration
 * @returns Query result
 */
declare function useBridgeQuery<T extends EntityData, Q extends QueryType>(service: BridgeApiService<T>, type: Q, params: BridgeQueryParams<Q>, config?: SWRConfiguration): UseBridgeQueryResult<T, Q>;

/**
 * Server Authentication Hook for React
 *
 * Provides a hook for handling authentication with automatic redirects
 */
/**
 * Server authentication hook options
 */
interface UseServerAuthOptions {
    /**
     * Path to redirect to when not authenticated
     */
    loginRedirectPath?: string;
    /**
     * User types allowed to access the page
     */
    allowedTypes?: string[];
    /**
     * Whether to validate the session on mount
     */
    validateOnMount?: boolean;
    /**
     * Pubflow instance ID
     */
    instanceId?: string;
    /**
     * Custom redirect function
     */
    onRedirect?: (path: string) => void;
}
/**
 * Hook for handling authentication with automatic redirects
 *
 * @param options Hook options
 * @returns Authentication hook result
 */
declare function useServerAuth({ loginRedirectPath, allowedTypes, validateOnMount, instanceId, onRedirect }?: UseServerAuthOptions): {
    user: _pubflow_core.User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    validateSession: () => Promise<{
        isValid: boolean;
        expiresAt?: string;
    }>;
};

/**
 * Search Query Builder Hook for React
 *
 * Provides utilities for building complex search queries
 */

/**
 * Search field definition
 */
interface SearchField {
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
interface SearchQueryState {
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
interface UseSearchQueryBuilderResult {
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
declare function useSearchQueryBuilder(fields: SearchField[], initialState?: Partial<SearchQueryState>): UseSearchQueryBuilderResult;

/**
 * Browser Storage Adapter for React
 *
 * Provides a storage adapter for React applications using localStorage
 */

/**
 * Options for the browser storage adapter
 */
interface BrowserStorageOptions {
    /**
     * Prefix for storage keys
     */
    prefix?: string;
    /**
     * Whether to use sessionStorage instead of localStorage
     */
    useSessionStorage?: boolean;
    /**
     * Whether to use cookies as fallback when localStorage/sessionStorage is not available
     */
    useCookieFallback?: boolean;
    /**
     * Cookie options when using cookie fallback
     */
    cookieOptions?: {
        /**
         * Cookie expiration in days
         */
        maxAge?: number;
        /**
         * Cookie path
         */
        path?: string;
        /**
         * Whether the cookie should be secure
         */
        secure?: boolean;
        /**
         * Whether the cookie should be HTTP only
         */
        httpOnly?: boolean;
        /**
         * SameSite attribute for the cookie
         */
        sameSite?: 'strict' | 'lax' | 'none';
    };
}
/**
 * Browser storage adapter for React
 * Uses localStorage or sessionStorage with cookie fallback
 */
declare class BrowserStorageAdapter implements StorageAdapter {
    private prefix;
    private useSessionStorage;
    private useCookieFallback;
    private cookieOptions;
    /**
     * Create a new browser storage adapter
     *
     * @param options Storage options
     */
    constructor(options?: BrowserStorageOptions);
    /**
     * Get a value from storage
     *
     * @param key Storage key
     * @returns Stored value or null
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Save a value to storage
     *
     * @param key Storage key
     * @param value Value to store
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Remove a value from storage
     *
     * @param key Storage key
     */
    removeItem(key: string): Promise<void>;
    /**
     * Clear all values with the current prefix
     */
    clear(): Promise<void>;
    /**
     * Get a cookie value
     *
     * @param key Cookie key
     * @returns Cookie value or null
     */
    private getCookie;
    /**
     * Set a cookie value
     *
     * @param key Cookie key
     * @param value Cookie value
     */
    private setCookie;
    /**
     * Remove a cookie
     *
     * @param key Cookie key
     */
    private removeCookie;
    /**
     * Clear all cookies with the current prefix
     */
    private clearCookies;
}

/**
 * Authentication Utilities for React
 *
 * Provides utilities for authentication in React applications
 */
/**
 * Options for the useRequireAuth hook
 */
interface UseRequireAuthOptions {
    /**
     * User types allowed to access the route
     */
    allowedTypes?: string | string[];
    /**
     * Redirect function
     */
    redirectFn?: (path: string) => void;
    /**
     * Redirect path when not authenticated
     */
    redirectTo?: string;
    /**
     * Pubflow instance ID
     */
    instanceId?: string;
}
/**
 * Hook for requiring authentication
 *
 * @param options Authentication options
 * @returns Authentication result
 */
declare function useRequireAuth(options?: UseRequireAuthOptions): {
    user: _pubflow_core.User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
};

export { AccountCreationForm, AccountCreationFormConfig, AccountCreationFormProps, AdvancedFilter, AdvancedFilterColors, AdvancedFilterProps, AdvancedFilterTexts, BridgeForm, BridgeFormProps, BridgeList, BridgeListColors, BridgeListLayout, BridgeListProps, BridgeListRenderItemProps, BridgeListTexts, BridgeTable, BridgeTableProps, BridgeView, BridgeViewProps, BrowserStorageAdapter, BrowserStorageOptions, ColumnDef, FieldConfig, FieldRenderProps, FilterField, LoginForm, LoginFormConfig, LoginFormProps, MutationOptions, OfflineIndicator, OfflineIndicatorProps, PasswordResetForm, PasswordResetFormConfig, PasswordResetFormProps, PersistentCacheConfig, PubflowContext, PubflowContextValue, PubflowInstance, PubflowProvider, PubflowProviderProps, RawApiRequestOptions, RawApiResponse, SearchField, SearchQueryState, ThemeConfig, ThemeProvider, ThemeProviderProps, UseAuthResult, UseBridgeApiRawResult, UseBridgeMutationResult, UseBridgeQueryResult, UseRequireAuthOptions, UseSearchQueryBuilderResult, UseServerAuthOptions, createStyles, generateCSSVariables, useAuth, useBridgeApi, useBridgeApiRaw, useBridgeCrud, useBridgeMutation, useBridgeQuery, useNetworkStatus, useRequireAuth, useSearchQueryBuilder, useServerAuth, useTheme };
