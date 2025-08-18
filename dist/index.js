'use strict';

var core = require('@pubflow/core');
var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var useSWR = require('swr');

/**
 * Browser Storage Adapter for React
 *
 * Provides a storage adapter for React applications using localStorage
 */
/**
 * Browser storage adapter for React
 * Uses localStorage or sessionStorage with cookie fallback
 */
class BrowserStorageAdapter {
    /**
     * Create a new browser storage adapter
     *
     * @param options Storage options
     */
    constructor(options = {}) {
        var _a, _b, _c, _d, _e;
        this.prefix = options.prefix || 'pubflow';
        this.useSessionStorage = options.useSessionStorage || false;
        this.useCookieFallback = options.useCookieFallback !== false;
        this.cookieOptions = {
            maxAge: ((_a = options.cookieOptions) === null || _a === void 0 ? void 0 : _a.maxAge) || 30, // 30 days
            path: ((_b = options.cookieOptions) === null || _b === void 0 ? void 0 : _b.path) || '/',
            secure: ((_c = options.cookieOptions) === null || _c === void 0 ? void 0 : _c.secure) !== false,
            httpOnly: ((_d = options.cookieOptions) === null || _d === void 0 ? void 0 : _d.httpOnly) !== false,
            sameSite: ((_e = options.cookieOptions) === null || _e === void 0 ? void 0 : _e.sameSite) || 'lax'
        };
    }
    /**
     * Get a value from storage
     *
     * @param key Storage key
     * @returns Stored value or null
     */
    async getItem(key) {
        const prefixedKey = core.createStorageKey(key, this.prefix);
        // Try localStorage/sessionStorage first
        if (typeof window !== 'undefined') {
            try {
                const storage = this.useSessionStorage ? sessionStorage : localStorage;
                return storage.getItem(prefixedKey);
            }
            catch (error) {
                console.warn('Error getting item from storage:', error);
                // Fall back to cookies if enabled
                if (this.useCookieFallback) {
                    return this.getCookie(prefixedKey);
                }
            }
        }
        return null;
    }
    /**
     * Save a value to storage
     *
     * @param key Storage key
     * @param value Value to store
     */
    async setItem(key, value) {
        const prefixedKey = core.createStorageKey(key, this.prefix);
        // Try localStorage/sessionStorage first
        if (typeof window !== 'undefined') {
            try {
                const storage = this.useSessionStorage ? sessionStorage : localStorage;
                storage.setItem(prefixedKey, value);
                return;
            }
            catch (error) {
                console.warn('Error setting item in storage:', error);
                // Fall back to cookies if enabled
                if (this.useCookieFallback) {
                    this.setCookie(prefixedKey, value);
                    return;
                }
            }
        }
    }
    /**
     * Remove a value from storage
     *
     * @param key Storage key
     */
    async removeItem(key) {
        const prefixedKey = core.createStorageKey(key, this.prefix);
        // Try localStorage/sessionStorage first
        if (typeof window !== 'undefined') {
            try {
                const storage = this.useSessionStorage ? sessionStorage : localStorage;
                storage.removeItem(prefixedKey);
            }
            catch (error) {
                console.warn('Error removing item from storage:', error);
            }
            // Also remove from cookies if fallback is enabled
            if (this.useCookieFallback) {
                this.removeCookie(prefixedKey);
            }
        }
    }
    /**
     * Clear all values with the current prefix
     */
    async clear() {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            const storage = this.useSessionStorage ? sessionStorage : localStorage;
            const keysToRemove = [];
            // Find all keys with the current prefix
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key && key.startsWith(`${this.prefix}_`)) {
                    keysToRemove.push(key);
                }
            }
            // Remove all found keys
            keysToRemove.forEach(key => {
                storage.removeItem(key);
            });
            // Also clear cookies if fallback is enabled
            if (this.useCookieFallback) {
                this.clearCookies();
            }
        }
        catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
    /**
     * Get a cookie value
     *
     * @param key Cookie key
     * @returns Cookie value or null
     */
    getCookie(key) {
        if (typeof document === 'undefined') {
            return null;
        }
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(key + '=')) {
                return decodeURIComponent(cookie.substring(key.length + 1));
            }
        }
        return null;
    }
    /**
     * Set a cookie value
     *
     * @param key Cookie key
     * @param value Cookie value
     */
    setCookie(key, value) {
        if (typeof document === 'undefined') {
            return;
        }
        const { maxAge, path, secure, sameSite } = this.cookieOptions;
        const expires = new Date(Date.now() + maxAge * 24 * 60 * 60 * 1000);
        let cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}`;
        if (secure) {
            cookie += '; Secure';
        }
        cookie += `; SameSite=${sameSite}`;
        document.cookie = cookie;
    }
    /**
     * Remove a cookie
     *
     * @param key Cookie key
     */
    removeCookie(key) {
        if (typeof document === 'undefined') {
            return;
        }
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${this.cookieOptions.path}`;
    }
    /**
     * Clear all cookies with the current prefix
     */
    clearCookies() {
        if (typeof document === 'undefined') {
            return;
        }
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            const key = cookie.split('=')[0];
            if (key.startsWith(`${this.prefix}_`)) {
                this.removeCookie(key);
            }
        }
    }
}

/**
 * Create Pubflow context
 */
const PubflowContext = React.createContext({
    instances: {},
    defaultInstance: 'default'
});
/**
 * Pubflow provider for React
 */
function PubflowProvider({ children, config, instances, defaultInstance = 'default', onSessionExpired, onSessionRefreshed, showSessionAlerts = false, persistentCache = { enabled: false }, loginRedirectPath = '/login', publicPaths = ['/login', '/register', '/forgot-password'], enableDebugTools = false, theme = {} }) {
    const [isInitialized, setIsInitialized] = React.useState(false);
    const [contextValue, setContextValue] = React.useState({
        instances: {},
        defaultInstance
    });
    // Configure debug tools
    React.useEffect(() => {
        if (enableDebugTools) {
            console.log('Pubflow debug tools enabled');
            // Add debug utilities to window object
            if (typeof window !== 'undefined') {
                window.pubflowDebug = {
                    getInstances: () => contextValue.instances,
                    getDefaultInstance: () => contextValue.defaultInstance,
                    clearStorage: async () => {
                        const storage = new BrowserStorageAdapter();
                        await storage.removeItem('pubflow_session_id');
                        await storage.removeItem('pubflow_user_data');
                        console.log('Pubflow storage cleared');
                    },
                    loginRedirectPath,
                    publicPaths,
                    theme
                };
            }
        }
    }, [enableDebugTools, contextValue, loginRedirectPath, publicPaths, theme]);
    // Handle session expiration
    const handleSessionExpired = React.useCallback(() => {
        if (showSessionAlerts) {
            alert('Your session has expired. Please log in again.');
        }
        if (onSessionExpired) {
            onSessionExpired();
        }
    }, [onSessionExpired, showSessionAlerts]);
    // Handle session refresh
    const handleSessionRefreshed = React.useCallback(() => {
        if (showSessionAlerts) {
            alert('Your session has been refreshed.');
        }
        if (onSessionRefreshed) {
            onSessionRefreshed();
        }
    }, [onSessionRefreshed, showSessionAlerts]);
    React.useEffect(() => {
        const initialize = async () => {
            var _a, _b;
            try {
                // Initialize instances
                const instancesMap = {};
                if (instances && instances.length > 0) {
                    // Initialize multiple instances
                    for (const instanceConfig of instances) {
                        // Initialize configuration
                        const fullConfig = core.initConfig({
                            ...instanceConfig,
                            sessionConfig: {
                                ...instanceConfig.sessionConfig,
                                onSessionExpired: handleSessionExpired,
                                onSessionRefreshed: handleSessionRefreshed
                            }
                        }, instanceConfig.id);
                        // Create storage adapter
                        const storage = new BrowserStorageAdapter({
                            prefix: (_a = fullConfig.storageConfig) === null || _a === void 0 ? void 0 : _a.prefix
                        });
                        // Create API client
                        const apiClient = new core.ApiClient(fullConfig, storage);
                        // Create auth service
                        const authService = new core.AuthService(apiClient, storage, fullConfig);
                        // Get current user
                        let user = null;
                        let isAuthenticated = false;
                        try {
                            user = await authService.getCurrentUser();
                            isAuthenticated = !!user;
                        }
                        catch (error) {
                            console.error(`Error getting current user for instance ${instanceConfig.id}:`, error);
                        }
                        // Create instance
                        instancesMap[instanceConfig.id] = {
                            config: fullConfig,
                            apiClient,
                            authService,
                            user,
                            isAuthenticated,
                            isLoading: false,
                            login: async (credentials) => {
                                const result = await authService.login(credentials);
                                if (result.success && result.user) {
                                    // Update instance
                                    setContextValue(prev => ({
                                        ...prev,
                                        instances: {
                                            ...prev.instances,
                                            [instanceConfig.id]: {
                                                ...prev.instances[instanceConfig.id],
                                                user: result.user,
                                                isAuthenticated: true
                                            }
                                        }
                                    }));
                                }
                                return result;
                            },
                            logout: async () => {
                                await authService.logout();
                                // Update instance
                                setContextValue(prev => ({
                                    ...prev,
                                    instances: {
                                        ...prev.instances,
                                        [instanceConfig.id]: {
                                            ...prev.instances[instanceConfig.id],
                                            user: null,
                                            isAuthenticated: false
                                        }
                                    }
                                }));
                            },
                            validateSession: async () => {
                                const result = await authService.validateSession();
                                // Update instance
                                setContextValue(prev => ({
                                    ...prev,
                                    instances: {
                                        ...prev.instances,
                                        [instanceConfig.id]: {
                                            ...prev.instances[instanceConfig.id],
                                            user: result.user || null,
                                            isAuthenticated: result.isValid
                                        }
                                    }
                                }));
                                return result;
                            }
                        };
                    }
                }
                else if (config) {
                    // Initialize single instance
                    // Initialize configuration
                    const fullConfig = core.initConfig({
                        ...config,
                        sessionConfig: {
                            ...config.sessionConfig,
                            onSessionExpired: handleSessionExpired,
                            onSessionRefreshed: handleSessionRefreshed
                        }
                    }, defaultInstance);
                    // Create storage adapter
                    const storage = new BrowserStorageAdapter({
                        prefix: (_b = fullConfig.storageConfig) === null || _b === void 0 ? void 0 : _b.prefix
                    });
                    // Create API client
                    const apiClient = new core.ApiClient(fullConfig, storage);
                    // Create auth service
                    const authService = new core.AuthService(apiClient, storage, fullConfig);
                    // Get current user
                    let user = null;
                    let isAuthenticated = false;
                    try {
                        user = await authService.getCurrentUser();
                        isAuthenticated = !!user;
                    }
                    catch (error) {
                        console.error('Error getting current user:', error);
                    }
                    // Create instance
                    instancesMap[defaultInstance] = {
                        config: fullConfig,
                        apiClient,
                        authService,
                        user,
                        isAuthenticated,
                        isLoading: false,
                        login: async (credentials) => {
                            const result = await authService.login(credentials);
                            if (result.success && result.user) {
                                // Update instance
                                setContextValue(prev => ({
                                    ...prev,
                                    instances: {
                                        ...prev.instances,
                                        [defaultInstance]: {
                                            ...prev.instances[defaultInstance],
                                            user: result.user,
                                            isAuthenticated: true
                                        }
                                    }
                                }));
                            }
                            return result;
                        },
                        logout: async () => {
                            await authService.logout();
                            // Update instance
                            setContextValue(prev => ({
                                ...prev,
                                instances: {
                                    ...prev.instances,
                                    [defaultInstance]: {
                                        ...prev.instances[defaultInstance],
                                        user: null,
                                        isAuthenticated: false
                                    }
                                }
                            }));
                        },
                        validateSession: async () => {
                            const result = await authService.validateSession();
                            // Update instance
                            setContextValue(prev => ({
                                ...prev,
                                instances: {
                                    ...prev.instances,
                                    [defaultInstance]: {
                                        ...prev.instances[defaultInstance],
                                        user: result.user || null,
                                        isAuthenticated: result.isValid
                                    }
                                }
                            }));
                            return result;
                        }
                    };
                }
                // Set context value
                setContextValue({
                    instances: instancesMap,
                    defaultInstance
                });
                // Set initialized
                setIsInitialized(true);
            }
            catch (error) {
                console.error('Error initializing Pubflow:', error);
            }
        };
        initialize();
    }, [config, instances, defaultInstance, handleSessionExpired, handleSessionRefreshed]);
    // Show loading state
    if (!isInitialized) {
        return null;
    }
    // If persistent cache is enabled, wrap with SWRConfig
    if (persistentCache.enabled && persistentCache.provider) {
        return (jsxRuntime.jsx(useSWR.SWRConfig, { value: { provider: persistentCache.provider }, children: jsxRuntime.jsx(PubflowContext.Provider, { value: contextValue, children: children }) }));
    }
    // Otherwise, just use the regular provider
    return (jsxRuntime.jsx(PubflowContext.Provider, { value: contextValue, children: children }));
}

/**
 * Authentication Hook for React
 *
 * Provides a hook for accessing authentication functionality
 */
/**
 * Hook for accessing authentication functionality
 *
 * @param instanceId Pubflow instance ID
 * @returns Authentication hook result
 */
function useAuth(instanceId) {
    const context = React.useContext(PubflowContext);
    const [isLoading, setIsLoading] = React.useState(false);
    if (!context) {
        throw new Error('useAuth must be used within a PubflowProvider');
    }
    const instance = instanceId || context.defaultInstance;
    const pubflowInstance = context.instances[instance];
    if (!pubflowInstance) {
        throw new Error(`Pubflow instance '${instance}' not found`);
    }
    // Wrap login to handle loading state
    const login = React.useCallback(async (credentials) => {
        setIsLoading(true);
        try {
            return await pubflowInstance.login(credentials);
        }
        finally {
            setIsLoading(false);
        }
    }, [pubflowInstance]);
    // Wrap logout to handle loading state
    const logout = React.useCallback(async () => {
        setIsLoading(true);
        try {
            await pubflowInstance.logout();
        }
        finally {
            setIsLoading(false);
        }
    }, [pubflowInstance]);
    // Wrap validateSession to handle loading state
    const validateSession = React.useCallback(async () => {
        setIsLoading(true);
        try {
            return await pubflowInstance.validateSession();
        }
        finally {
            setIsLoading(false);
        }
    }, [pubflowInstance]);
    // Add refreshUser function to manually refresh user data
    const refreshUser = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await pubflowInstance.validateSession();
            return result.user || null;
        }
        finally {
            setIsLoading(false);
        }
    }, [pubflowInstance]);
    // Validate session on mount
    React.useEffect(() => {
        const validate = async () => {
            try {
                await validateSession();
            }
            catch (error) {
                console.error('Error validating session:', error);
            }
        };
        validate();
    }, [validateSession]);
    return {
        // Ensure user is never undefined
        user: pubflowInstance.user || null,
        isAuthenticated: pubflowInstance.isAuthenticated,
        isLoading,
        login,
        logout,
        validateSession,
        refreshUser
    };
}

/**
 * Component for conditional rendering based on authentication and user type
 */
function BridgeView({ children, allowedTypes = ['authenticated'], fallback = null, loadingComponent = null, onUnauthorized, instanceId }) {
    const { user, isAuthenticated, isLoading } = useAuth(instanceId);
    // Convert allowedTypes to array if string
    const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    // Show loading component if loading
    if (isLoading) {
        return jsxRuntime.jsx(jsxRuntime.Fragment, { children: loadingComponent || null });
    }
    // Special case: if 'authenticated' is in allowed types, just check if user is authenticated
    if (types.includes('authenticated') && isAuthenticated) {
        return jsxRuntime.jsx(jsxRuntime.Fragment, { children: children });
    }
    // If not authenticated, show fallback
    if (!isAuthenticated) {
        if (onUnauthorized) {
            onUnauthorized();
        }
        return jsxRuntime.jsx(jsxRuntime.Fragment, { children: fallback });
    }
    // Check if user type is allowed
    const userType = (user === null || user === void 0 ? void 0 : user.userType) || '';
    const isAllowed = types.some(type => type.toLowerCase() === userType.toLowerCase());
    if (isAllowed) {
        return jsxRuntime.jsx(jsxRuntime.Fragment, { children: children });
    }
    // Not allowed, show fallback
    if (onUnauthorized) {
        onUnauthorized();
    }
    return jsxRuntime.jsx(jsxRuntime.Fragment, { children: fallback });
}

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
function useBridgeApi(config, instanceId) {
    const context = React.useContext(PubflowContext);
    if (!context) {
        throw new Error('useBridgeApi must be used within a PubflowProvider');
    }
    const instance = instanceId || context.defaultInstance;
    const pubflowInstance = context.instances[instance];
    if (!pubflowInstance) {
        throw new Error(`Pubflow instance '${instance}' not found`);
    }
    return new core.BridgeApiService(pubflowInstance.apiClient, config);
}

/**
 * Bridge Query Hook for React
 *
 * Provides a hook for querying data using Bridge API with SWR
 */
/**
 * Default SWR configuration
 */
const defaultSWRConfig = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    shouldRetryOnError: true,
    errorRetryCount: 3
};
/**
 * Hook for querying data using Bridge API with SWR
 *
 * @param service Bridge API service
 * @param type Query type
 * @param params Query parameters
 * @param config SWR configuration
 * @returns Query result
 */
function useBridgeQuery(service, type, params, config) {
    // Create a unique key for SWR
    const key = JSON.stringify({ service, type, params });
    // Define fetcher function
    const fetcher = React.useCallback(async () => {
        switch (type) {
            case 'list':
                return await service.getList(params);
            case 'get':
                const { id, params: getParams } = params;
                return await service.getById(id, getParams);
            case 'search':
                return await service.search(params);
            default:
                throw new Error(`Invalid query type: ${type}`);
        }
    }, [service, type, params]);
    // Use SWR for data fetching
    const { data, error, mutate, isValidating } = useSWR(key, 
    // Cast fetcher to the correct type
    () => fetcher(), {
        ...defaultSWRConfig,
        ...config
    });
    // Define refetch function
    const refetch = React.useCallback(async () => {
        await mutate();
    }, [mutate]);
    // Format result based on query type
    if (type === 'list' || type === 'search') {
        const paginatedData = data;
        return {
            data: (paginatedData === null || paginatedData === void 0 ? void 0 : paginatedData.data) || [],
            meta: (paginatedData === null || paginatedData === void 0 ? void 0 : paginatedData.meta) || { page: 1, limit: 10, total: 0, hasMore: false },
            isLoading: isValidating,
            error: error || null,
            refetch
        };
    }
    else {
        return {
            data: data || null,
            meta: null,
            isLoading: isValidating,
            error: error || null,
            refetch
        };
    }
}

/**
 * Bridge Mutation Hook for React
 *
 * Provides a hook for mutating data using Bridge API
 */
/**
 * Hook for mutating data using Bridge API
 *
 * @param service Bridge API service
 * @param type Mutation type
 * @param defaultOptions Default mutation options
 * @returns Mutation result
 */
function useBridgeMutation(service, type, defaultOptions = {}) {
    // State
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    // SWR config for cache invalidation
    const { mutate: mutateCache } = useSWR.useSWRConfig();
    // Define mutate function
    const mutate = React.useCallback(async (params, options) => {
        // Merge options
        const mergedOptions = { ...defaultOptions, ...options };
        // Reset error
        setError(null);
        // Set loading
        setIsLoading(true);
        try {
            let result;
            // Perform mutation based on type
            switch (type) {
                case 'create':
                    result = await service.create(params);
                    break;
                case 'update':
                    const { id, data } = params;
                    result = await service.update(id, data);
                    break;
                case 'delete':
                    await service.delete(params);
                    result = undefined;
                    break;
                default:
                    throw new Error(`Invalid mutation type: ${type}`);
            }
            // Invalidate queries if configured
            if (mergedOptions.invalidateQueries !== false) {
                await mutateCache((key) => typeof key === 'string' && key.includes(JSON.stringify({ service })), undefined, { revalidate: true });
            }
            // Show success message
            if (mergedOptions.showAlerts && mergedOptions.successMessage) {
                alert(mergedOptions.successMessage);
            }
            // Call success callback
            if (mergedOptions.onSuccess) {
                mergedOptions.onSuccess(result);
            }
            return result;
        }
        catch (err) {
            // Set error
            setError(err);
            // Show error message
            if (mergedOptions.showAlerts && mergedOptions.errorMessage) {
                alert(mergedOptions.errorMessage);
            }
            // Call error callback
            if (mergedOptions.onError) {
                mergedOptions.onError(err);
            }
            throw err;
        }
        finally {
            // Reset loading
            setIsLoading(false);
        }
    }, [service, type, defaultOptions, mutateCache]);
    // Define reset function
    const reset = React.useCallback(() => {
        setError(null);
        setIsLoading(false);
    }, []);
    return {
        mutate,
        isLoading,
        error,
        reset
    };
}

/**
 * Bridge CRUD Hook for React
 *
 * Provides a hook for CRUD operations using Bridge API
 */
/**
 * Hook for CRUD operations using Bridge API
 *
 * @param options Hook options
 * @returns CRUD hook result
 */
function useBridgeCrud(options) {
    var _a, _b;
    // Extract options
    const { entityConfig, instanceId, schemas, searchConfig = {}, successMessages = {}, errorMessages = {}, notificationConfig = { autoNotify: true } } = options;
    // Get Bridge API service
    const service = useBridgeApi(entityConfig, instanceId);
    // State
    const [searchTerm, setSearchTerm] = React.useState(searchConfig.initialSearchTerm || '');
    const [filters, setFilters] = React.useState(searchConfig.initialFilters || []);
    const [orderBy, setOrderBy] = React.useState((_a = searchConfig.initialSort) === null || _a === void 0 ? void 0 : _a.field);
    const [orderDir, setOrderDir] = React.useState((_b = searchConfig.initialSort) === null || _b === void 0 ? void 0 : _b.direction);
    const [page, setPage] = React.useState(searchConfig.initialPage || 1);
    const [limit, setLimit] = React.useState(searchConfig.initialLimit || 10);
    const [selectedItem, setSelectedItem] = React.useState(null);
    const [validationErrors, setValidationErrors] = React.useState(null);
    // Build search params
    const searchParams = {
        page,
        limit,
        orderBy,
        orderDir,
        q: searchTerm,
        filters
    };
    // Use query hook for fetching data
    const { data: items, meta, isLoading: loading, error, refetch: refresh } = useBridgeQuery(service, 'search', searchParams);
    // Use mutation hooks for CRUD operations
    const { mutate: createMutate, isLoading: creating } = useBridgeMutation(service, 'create', {
        successMessage: successMessages.create,
        errorMessage: errorMessages.create,
        showAlerts: notificationConfig.autoNotify
    });
    const { mutate: updateMutate, isLoading: updating } = useBridgeMutation(service, 'update', {
        successMessage: successMessages.update,
        errorMessage: errorMessages.update,
        showAlerts: notificationConfig.autoNotify
    });
    const { mutate: deleteMutate, isLoading: deleting } = useBridgeMutation(service, 'delete', {
        successMessage: successMessages.delete,
        errorMessage: errorMessages.delete,
        showAlerts: notificationConfig.autoNotify
    });
    // Show notification
    const showNotification = React.useCallback((message, type) => {
        if (notificationConfig.showNotification) {
            notificationConfig.showNotification(message, type);
        }
        else if (notificationConfig.autoNotify) {
            alert(message);
        }
    }, [notificationConfig]);
    // CRUD operations
    const getItem = React.useCallback(async (id) => {
        try {
            return await service.getById(id);
        }
        catch (err) {
            if (notificationConfig.autoNotify && errorMessages.fetch) {
                showNotification(errorMessages.fetch, 'error');
            }
            throw err;
        }
    }, [service, notificationConfig.autoNotify, errorMessages.fetch, showNotification]);
    const createItem = React.useCallback(async (data, options) => {
        // Validate data if schema is provided
        if (schemas === null || schemas === void 0 ? void 0 : schemas.create) {
            const result = core.validateWithSchema(schemas.create, data);
            if (!result.success) {
                setValidationErrors(result.errors || null);
                throw new Error('Validation failed');
            }
            data = result.data;
        }
        try {
            const result = await createMutate(data, options);
            // Refresh data
            await refresh();
            return result;
        }
        catch (err) {
            throw err;
        }
    }, [createMutate, refresh, schemas === null || schemas === void 0 ? void 0 : schemas.create]);
    const updateItem = React.useCallback(async (id, data, options) => {
        // Validate data if schema is provided
        if (schemas === null || schemas === void 0 ? void 0 : schemas.update) {
            const result = core.validateWithSchema(schemas.update, data);
            if (!result.success) {
                setValidationErrors(result.errors || null);
                throw new Error('Validation failed');
            }
            data = result.data;
        }
        try {
            const result = await updateMutate({ id, data }, options);
            // Refresh data
            await refresh();
            return result;
        }
        catch (err) {
            throw err;
        }
    }, [updateMutate, refresh, schemas === null || schemas === void 0 ? void 0 : schemas.update]);
    const deleteItem = React.useCallback(async (id, options) => {
        try {
            await deleteMutate(id, options);
            // Refresh data
            await refresh();
        }
        catch (err) {
            throw err;
        }
    }, [deleteMutate, refresh]);
    // Search functions
    const addFilter = React.useCallback((field, operator, value) => {
        setFilters(prev => [
            ...prev.filter(f => f.field !== field),
            { field, operator, value }
        ]);
    }, []);
    const removeFilter = React.useCallback((field) => {
        setFilters(prev => prev.filter(f => f.field !== field));
    }, []);
    const resetFilters = React.useCallback(() => {
        var _a, _b;
        setFilters([]);
        setSearchTerm('');
        setOrderBy((_a = searchConfig.initialSort) === null || _a === void 0 ? void 0 : _a.field);
        setOrderDir((_b = searchConfig.initialSort) === null || _b === void 0 ? void 0 : _b.direction);
        setPage(1);
    }, [searchConfig.initialSort]);
    const setSort = React.useCallback((field, direction) => {
        if (orderBy === field && !direction) {
            // Toggle direction if same field
            setOrderDir(prev => prev === 'asc' ? 'desc' : 'asc');
        }
        else {
            setOrderBy(field);
            setOrderDir(direction || 'asc');
        }
    }, [orderBy]);
    // Reset page when search term or filters change
    React.useEffect(() => {
        setPage(1);
    }, [searchTerm, filters]);
    return {
        // Data
        items,
        selectedItem,
        totalItems: (meta === null || meta === void 0 ? void 0 : meta.total) || 0,
        // Loading states
        loading,
        creating,
        updating,
        deleting,
        // Errors
        error,
        validationErrors,
        // Pagination
        page,
        limit,
        hasMore: (meta === null || meta === void 0 ? void 0 : meta.hasMore) || false,
        setPage,
        setLimit,
        // Sorting
        orderBy,
        orderDir,
        setSort,
        // Search
        searchTerm,
        setSearchTerm,
        filters,
        addFilter,
        removeFilter,
        resetFilters,
        // CRUD operations
        getItem,
        createItem,
        updateItem,
        deleteItem,
        // Refresh
        refresh,
        // Selection
        selectItem: setSelectedItem
    };
}

/**
 * Default loading component
 */
const DefaultLoadingComponent = () => (jsxRuntime.jsx("div", { style: { padding: '20px', textAlign: 'center' }, children: "Loading..." }));
/**
 * Default empty component
 */
const DefaultEmptyComponent = () => (jsxRuntime.jsx("div", { style: { padding: '20px', textAlign: 'center' }, children: "No items found" }));
/**
 * Default error component
 */
const DefaultErrorComponent = ({ error, onRetry }) => (jsxRuntime.jsxs("div", { style: { padding: '20px', textAlign: 'center', color: 'red' }, children: [jsxRuntime.jsxs("div", { children: ["Error: ", error.message] }), jsxRuntime.jsx("button", { onClick: onRetry, style: { marginTop: '10px' }, children: "Retry" })] }));
/**
 * Component for displaying data in a table with sorting, filtering, and pagination
 */
function BridgeTable({ columns, showPagination = true, showSearch = true, showFilters = true, rowKey = (item) => item.id, onRowClick, className, loadingComponent, emptyComponent, errorComponent, paginationComponent, searchComponent, filterComponent, searchPlaceholder = 'Search...', actions, ...crudOptions }) {
    // Use Bridge CRUD hook
    const { items, selectedItem, selectItem, loading, error, page, limit, hasMore, totalItems, setPage, setLimit, searchTerm, setSearchTerm, filters, addFilter, removeFilter, resetFilters, orderBy, orderDir, setSort, refresh } = useBridgeCrud(crudOptions);
    // State for filter input
    const [filterField, setFilterField] = React.useState('');
    const [filterValue, setFilterValue] = React.useState('');
    // Handle sort
    const handleSort = (key) => {
        const column = columns.find(col => col.key === key);
        if (column === null || column === void 0 ? void 0 : column.sortable) {
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
        return loadingComponent || jsxRuntime.jsx(DefaultLoadingComponent, {});
    }
    // Render error state
    if (error) {
        return errorComponent || jsxRuntime.jsx(DefaultErrorComponent, { error: error, onRetry: refresh });
    }
    // Render empty state
    if (items.length === 0) {
        return emptyComponent || jsxRuntime.jsx(DefaultEmptyComponent, {});
    }
    return (jsxRuntime.jsxs("div", { className: className, children: [showSearch && (searchComponent || (jsxRuntime.jsx("div", { style: { marginBottom: '20px' }, children: jsxRuntime.jsx("input", { type: "text", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: searchPlaceholder, style: {
                        padding: '8px',
                        width: '100%',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                    } }) }))), showFilters && (filterComponent || (jsxRuntime.jsxs("div", { style: { marginBottom: '20px' }, children: [jsxRuntime.jsxs("div", { style: { display: 'flex', gap: '10px', marginBottom: '10px' }, children: [jsxRuntime.jsxs("select", { value: filterField, onChange: (e) => setFilterField(e.target.value), style: {
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    flex: 1
                                }, children: [jsxRuntime.jsx("option", { value: "", children: "Select field" }), columns
                                        .filter(col => col.filterable !== false)
                                        .map(col => (jsxRuntime.jsx("option", { value: col.key, children: typeof col.header === 'string' ? col.header : col.key }, col.key)))] }), jsxRuntime.jsx("input", { type: "text", value: filterValue, onChange: (e) => setFilterValue(e.target.value), placeholder: "Filter value", style: {
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    flex: 2
                                } }), jsxRuntime.jsx("button", { onClick: handleAddFilter, disabled: !filterField || !filterValue, style: {
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    cursor: filterField && filterValue ? 'pointer' : 'not-allowed'
                                }, children: "Add Filter" })] }), filters.length > 0 && (jsxRuntime.jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '5px' }, children: [filters.map((filter, index) => (jsxRuntime.jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: '#f0f0f0',
                                    padding: '5px 10px',
                                    borderRadius: '4px'
                                }, children: [jsxRuntime.jsxs("span", { children: [filter.field, ": ", String(filter.value)] }), jsxRuntime.jsx("button", { onClick: () => removeFilter(filter.field), style: {
                                            marginLeft: '5px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }, children: "\u00D7" })] }, index))), jsxRuntime.jsx("button", { onClick: resetFilters, style: {
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#dc3545',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }, children: "Reset Filters" })] }))] }))), jsxRuntime.jsx("div", { style: { overflowX: 'auto' }, children: jsxRuntime.jsxs("table", { style: {
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #ddd'
                    }, children: [jsxRuntime.jsx("thead", { children: jsxRuntime.jsxs("tr", { children: [columns.map(column => (jsxRuntime.jsx("th", { onClick: () => handleSort(column.key), style: {
                                            padding: '12px',
                                            textAlign: column.align || 'left',
                                            backgroundColor: '#f8f9fa',
                                            borderBottom: '2px solid #ddd',
                                            cursor: column.sortable ? 'pointer' : 'default',
                                            width: column.width
                                        }, children: jsxRuntime.jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start' }, children: [column.header, column.sortable && orderBy === column.key && (jsxRuntime.jsx("span", { style: { marginLeft: '5px' }, children: orderDir === 'asc' ? '↑' : '↓' }))] }) }, column.key))), actions && jsxRuntime.jsx("th", { style: { padding: '12px', backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }, children: "Actions" })] }) }), jsxRuntime.jsx("tbody", { children: items.map((item, index) => (jsxRuntime.jsxs("tr", { onClick: () => {
                                    selectItem(item);
                                    if (onRowClick) {
                                        onRowClick(item);
                                    }
                                }, style: {
                                    backgroundColor: selectedItem && rowKey(selectedItem) === rowKey(item) ? '#f0f0f0' : 'white',
                                    cursor: onRowClick ? 'pointer' : 'default'
                                }, children: [columns.map(column => (jsxRuntime.jsx("td", { style: {
                                            padding: '12px',
                                            borderBottom: '1px solid #ddd',
                                            textAlign: column.align || 'left'
                                        }, children: column.cell
                                            ? column.cell(item, index)
                                            : item[column.key] }, column.key))), actions && (jsxRuntime.jsx("td", { style: {
                                            padding: '12px',
                                            borderBottom: '1px solid #ddd',
                                            textAlign: 'right'
                                        }, onClick: (e) => e.stopPropagation(), children: actions(item) }))] }, rowKey(item)))) })] }) }), showPagination && (paginationComponent || (jsxRuntime.jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px'
                }, children: [jsxRuntime.jsxs("div", { children: ["Showing ", items.length, " of ", totalItems, " items"] }), jsxRuntime.jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [jsxRuntime.jsx("button", { onClick: () => setPage(page - 1), disabled: page === 1, style: {
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    backgroundColor: 'white',
                                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                                }, children: "Previous" }), jsxRuntime.jsxs("span", { style: { padding: '8px 16px' }, children: ["Page ", page] }), jsxRuntime.jsx("button", { onClick: () => setPage(page + 1), disabled: !hasMore, style: {
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    backgroundColor: 'white',
                                    cursor: !hasMore ? 'not-allowed' : 'pointer'
                                }, children: "Next" })] })] })))] }));
}

var isCheckBoxInput = (element) => element.type === 'checkbox';

var isDateObject = (value) => value instanceof Date;

var isNullOrUndefined = (value) => value == null;

const isObjectType = (value) => typeof value === 'object';
var isObject = (value) => !isNullOrUndefined(value) &&
    !Array.isArray(value) &&
    isObjectType(value) &&
    !isDateObject(value);

var getEventValue = (event) => isObject(event) && event.target
    ? isCheckBoxInput(event.target)
        ? event.target.checked
        : event.target.value
    : event;

var getNodeParentName = (name) => name.substring(0, name.search(/\.\d+(\.|$)/)) || name;

var isNameInFieldArray = (names, name) => names.has(getNodeParentName(name));

var isPlainObject = (tempObject) => {
    const prototypeCopy = tempObject.constructor && tempObject.constructor.prototype;
    return (isObject(prototypeCopy) && prototypeCopy.hasOwnProperty('isPrototypeOf'));
};

var isWeb = typeof window !== 'undefined' &&
    typeof window.HTMLElement !== 'undefined' &&
    typeof document !== 'undefined';

function cloneObject(data) {
    let copy;
    const isArray = Array.isArray(data);
    const isFileListInstance = typeof FileList !== 'undefined' ? data instanceof FileList : false;
    if (data instanceof Date) {
        copy = new Date(data);
    }
    else if (!(isWeb && (data instanceof Blob || isFileListInstance)) &&
        (isArray || isObject(data))) {
        copy = isArray ? [] : Object.create(Object.getPrototypeOf(data));
        if (!isArray && !isPlainObject(data)) {
            copy = data;
        }
        else {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    copy[key] = cloneObject(data[key]);
                }
            }
        }
    }
    else {
        return data;
    }
    return copy;
}

var isKey = (value) => /^\w*$/.test(value);

var isUndefined = (val) => val === undefined;

var compact = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

var stringToPath = (input) => compact(input.replace(/["|']|\]/g, '').split(/\.|\[/));

var get = (object, path, defaultValue) => {
    if (!path || !isObject(object)) {
        return defaultValue;
    }
    const result = (isKey(path) ? [path] : stringToPath(path)).reduce((result, key) => isNullOrUndefined(result) ? result : result[key], object);
    return isUndefined(result) || result === object
        ? isUndefined(object[path])
            ? defaultValue
            : object[path]
        : result;
};

var isBoolean = (value) => typeof value === 'boolean';

var set = (object, path, value) => {
    let index = -1;
    const tempPath = isKey(path) ? [path] : stringToPath(path);
    const length = tempPath.length;
    const lastIndex = length - 1;
    while (++index < length) {
        const key = tempPath[index];
        let newValue = value;
        if (index !== lastIndex) {
            const objValue = object[key];
            newValue =
                isObject(objValue) || Array.isArray(objValue)
                    ? objValue
                    : !isNaN(+tempPath[index + 1])
                        ? []
                        : {};
        }
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return;
        }
        object[key] = newValue;
        object = object[key];
    }
};

const EVENTS = {
    BLUR: 'blur',
    FOCUS_OUT: 'focusout',
    CHANGE: 'change',
};
const VALIDATION_MODE = {
    onBlur: 'onBlur',
    onChange: 'onChange',
    onSubmit: 'onSubmit',
    onTouched: 'onTouched',
    all: 'all',
};
const INPUT_VALIDATION_RULES = {
    max: 'max',
    min: 'min',
    maxLength: 'maxLength',
    minLength: 'minLength',
    pattern: 'pattern',
    required: 'required',
    validate: 'validate',
};

const HookFormContext = React.createContext(null);
HookFormContext.displayName = 'HookFormContext';

var getProxyFormState = (formState, control, localProxyFormState, isRoot = true) => {
    const result = {
        defaultValues: control._defaultValues,
    };
    for (const key in formState) {
        Object.defineProperty(result, key, {
            get: () => {
                const _key = key;
                if (control._proxyFormState[_key] !== VALIDATION_MODE.all) {
                    control._proxyFormState[_key] = !isRoot || VALIDATION_MODE.all;
                }
                localProxyFormState && (localProxyFormState[_key] = true);
                return formState[_key];
            },
        });
    }
    return result;
};

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

var isString = (value) => typeof value === 'string';

var generateWatchOutput = (names, _names, formValues, isGlobal, defaultValue) => {
    if (isString(names)) {
        isGlobal && _names.watch.add(names);
        return get(formValues, names, defaultValue);
    }
    if (Array.isArray(names)) {
        return names.map((fieldName) => (isGlobal && _names.watch.add(fieldName),
            get(formValues, fieldName)));
    }
    isGlobal && (_names.watchAll = true);
    return formValues;
};

var isPrimitive = (value) => isNullOrUndefined(value) || !isObjectType(value);

function deepEqual(object1, object2, _internal_visited = new WeakSet()) {
    if (isPrimitive(object1) || isPrimitive(object2)) {
        return object1 === object2;
    }
    if (isDateObject(object1) && isDateObject(object2)) {
        return object1.getTime() === object2.getTime();
    }
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    if (_internal_visited.has(object1) || _internal_visited.has(object2)) {
        return true;
    }
    _internal_visited.add(object1);
    _internal_visited.add(object2);
    for (const key of keys1) {
        const val1 = object1[key];
        if (!keys2.includes(key)) {
            return false;
        }
        if (key !== 'ref') {
            const val2 = object2[key];
            if ((isDateObject(val1) && isDateObject(val2)) ||
                (isObject(val1) && isObject(val2)) ||
                (Array.isArray(val1) && Array.isArray(val2))
                ? !deepEqual(val1, val2, _internal_visited)
                : val1 !== val2) {
                return false;
            }
        }
    }
    return true;
}

var appendErrors = (name, validateAllFieldCriteria, errors, type, message) => validateAllFieldCriteria
    ? {
        ...errors[name],
        types: {
            ...(errors[name] && errors[name].types ? errors[name].types : {}),
            [type]: message || true,
        },
    }
    : {};

var convertToArrayPayload = (value) => (Array.isArray(value) ? value : [value]);

var createSubject = () => {
    let _observers = [];
    const next = (value) => {
        for (const observer of _observers) {
            observer.next && observer.next(value);
        }
    };
    const subscribe = (observer) => {
        _observers.push(observer);
        return {
            unsubscribe: () => {
                _observers = _observers.filter((o) => o !== observer);
            },
        };
    };
    const unsubscribe = () => {
        _observers = [];
    };
    return {
        get observers() {
            return _observers;
        },
        next,
        subscribe,
        unsubscribe,
    };
};

var isEmptyObject = (value) => isObject(value) && !Object.keys(value).length;

var isFileInput = (element) => element.type === 'file';

var isFunction = (value) => typeof value === 'function';

var isHTMLElement = (value) => {
    if (!isWeb) {
        return false;
    }
    const owner = value ? value.ownerDocument : 0;
    return (value instanceof
        (owner && owner.defaultView ? owner.defaultView.HTMLElement : HTMLElement));
};

var isMultipleSelect = (element) => element.type === `select-multiple`;

var isRadioInput = (element) => element.type === 'radio';

var isRadioOrCheckbox = (ref) => isRadioInput(ref) || isCheckBoxInput(ref);

var live = (ref) => isHTMLElement(ref) && ref.isConnected;

function baseGet(object, updatePath) {
    const length = updatePath.slice(0, -1).length;
    let index = 0;
    while (index < length) {
        object = isUndefined(object) ? index++ : object[updatePath[index++]];
    }
    return object;
}
function isEmptyArray(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && !isUndefined(obj[key])) {
            return false;
        }
    }
    return true;
}
function unset(object, path) {
    const paths = Array.isArray(path)
        ? path
        : isKey(path)
            ? [path]
            : stringToPath(path);
    const childObject = paths.length === 1 ? object : baseGet(object, paths);
    const index = paths.length - 1;
    const key = paths[index];
    if (childObject) {
        delete childObject[key];
    }
    if (index !== 0 &&
        ((isObject(childObject) && isEmptyObject(childObject)) ||
            (Array.isArray(childObject) && isEmptyArray(childObject)))) {
        unset(object, paths.slice(0, -1));
    }
    return object;
}

var objectHasFunction = (data) => {
    for (const key in data) {
        if (isFunction(data[key])) {
            return true;
        }
    }
    return false;
};

function markFieldsDirty(data, fields = {}) {
    const isParentNodeArray = Array.isArray(data);
    if (isObject(data) || isParentNodeArray) {
        for (const key in data) {
            if (Array.isArray(data[key]) ||
                (isObject(data[key]) && !objectHasFunction(data[key]))) {
                fields[key] = Array.isArray(data[key]) ? [] : {};
                markFieldsDirty(data[key], fields[key]);
            }
            else if (!isNullOrUndefined(data[key])) {
                fields[key] = true;
            }
        }
    }
    return fields;
}
function getDirtyFieldsFromDefaultValues(data, formValues, dirtyFieldsFromValues) {
    const isParentNodeArray = Array.isArray(data);
    if (isObject(data) || isParentNodeArray) {
        for (const key in data) {
            if (Array.isArray(data[key]) ||
                (isObject(data[key]) && !objectHasFunction(data[key]))) {
                if (isUndefined(formValues) ||
                    isPrimitive(dirtyFieldsFromValues[key])) {
                    dirtyFieldsFromValues[key] = Array.isArray(data[key])
                        ? markFieldsDirty(data[key], [])
                        : { ...markFieldsDirty(data[key]) };
                }
                else {
                    getDirtyFieldsFromDefaultValues(data[key], isNullOrUndefined(formValues) ? {} : formValues[key], dirtyFieldsFromValues[key]);
                }
            }
            else {
                dirtyFieldsFromValues[key] = !deepEqual(data[key], formValues[key]);
            }
        }
    }
    return dirtyFieldsFromValues;
}
var getDirtyFields = (defaultValues, formValues) => getDirtyFieldsFromDefaultValues(defaultValues, formValues, markFieldsDirty(formValues));

const defaultResult = {
    value: false,
    isValid: false,
};
const validResult = { value: true, isValid: true };
var getCheckboxValue = (options) => {
    if (Array.isArray(options)) {
        if (options.length > 1) {
            const values = options
                .filter((option) => option && option.checked && !option.disabled)
                .map((option) => option.value);
            return { value: values, isValid: !!values.length };
        }
        return options[0].checked && !options[0].disabled
            ? // @ts-expect-error expected to work in the browser
                options[0].attributes && !isUndefined(options[0].attributes.value)
                    ? isUndefined(options[0].value) || options[0].value === ''
                        ? validResult
                        : { value: options[0].value, isValid: true }
                    : validResult
            : defaultResult;
    }
    return defaultResult;
};

var getFieldValueAs = (value, { valueAsNumber, valueAsDate, setValueAs }) => isUndefined(value)
    ? value
    : valueAsNumber
        ? value === ''
            ? NaN
            : value
                ? +value
                : value
        : valueAsDate && isString(value)
            ? new Date(value)
            : setValueAs
                ? setValueAs(value)
                : value;

const defaultReturn = {
    isValid: false,
    value: null,
};
var getRadioValue = (options) => Array.isArray(options)
    ? options.reduce((previous, option) => option && option.checked && !option.disabled
        ? {
            isValid: true,
            value: option.value,
        }
        : previous, defaultReturn)
    : defaultReturn;

function getFieldValue(_f) {
    const ref = _f.ref;
    if (isFileInput(ref)) {
        return ref.files;
    }
    if (isRadioInput(ref)) {
        return getRadioValue(_f.refs).value;
    }
    if (isMultipleSelect(ref)) {
        return [...ref.selectedOptions].map(({ value }) => value);
    }
    if (isCheckBoxInput(ref)) {
        return getCheckboxValue(_f.refs).value;
    }
    return getFieldValueAs(isUndefined(ref.value) ? _f.ref.value : ref.value, _f);
}

var getResolverOptions = (fieldsNames, _fields, criteriaMode, shouldUseNativeValidation) => {
    const fields = {};
    for (const name of fieldsNames) {
        const field = get(_fields, name);
        field && set(fields, name, field._f);
    }
    return {
        criteriaMode,
        names: [...fieldsNames],
        fields,
        shouldUseNativeValidation,
    };
};

var isRegex = (value) => value instanceof RegExp;

var getRuleValue = (rule) => isUndefined(rule)
    ? rule
    : isRegex(rule)
        ? rule.source
        : isObject(rule)
            ? isRegex(rule.value)
                ? rule.value.source
                : rule.value
            : rule;

var getValidationModes = (mode) => ({
    isOnSubmit: !mode || mode === VALIDATION_MODE.onSubmit,
    isOnBlur: mode === VALIDATION_MODE.onBlur,
    isOnChange: mode === VALIDATION_MODE.onChange,
    isOnAll: mode === VALIDATION_MODE.all,
    isOnTouch: mode === VALIDATION_MODE.onTouched,
});

const ASYNC_FUNCTION = 'AsyncFunction';
var hasPromiseValidation = (fieldReference) => !!fieldReference &&
    !!fieldReference.validate &&
    !!((isFunction(fieldReference.validate) &&
        fieldReference.validate.constructor.name === ASYNC_FUNCTION) ||
        (isObject(fieldReference.validate) &&
            Object.values(fieldReference.validate).find((validateFunction) => validateFunction.constructor.name === ASYNC_FUNCTION)));

var hasValidation = (options) => options.mount &&
    (options.required ||
        options.min ||
        options.max ||
        options.maxLength ||
        options.minLength ||
        options.pattern ||
        options.validate);

var isWatched = (name, _names, isBlurEvent) => !isBlurEvent &&
    (_names.watchAll ||
        _names.watch.has(name) ||
        [..._names.watch].some((watchName) => name.startsWith(watchName) &&
            /^\.\w+/.test(name.slice(watchName.length))));

const iterateFieldsByAction = (fields, action, fieldsNames, abortEarly) => {
    for (const key of fieldsNames || Object.keys(fields)) {
        const field = get(fields, key);
        if (field) {
            const { _f, ...currentField } = field;
            if (_f) {
                if (_f.refs && _f.refs[0] && action(_f.refs[0], key) && !abortEarly) {
                    return true;
                }
                else if (_f.ref && action(_f.ref, _f.name) && !abortEarly) {
                    return true;
                }
                else {
                    if (iterateFieldsByAction(currentField, action)) {
                        break;
                    }
                }
            }
            else if (isObject(currentField)) {
                if (iterateFieldsByAction(currentField, action)) {
                    break;
                }
            }
        }
    }
    return;
};

function schemaErrorLookup(errors, _fields, name) {
    const error = get(errors, name);
    if (error || isKey(name)) {
        return {
            error,
            name,
        };
    }
    const names = name.split('.');
    while (names.length) {
        const fieldName = names.join('.');
        const field = get(_fields, fieldName);
        const foundError = get(errors, fieldName);
        if (field && !Array.isArray(field) && name !== fieldName) {
            return { name };
        }
        if (foundError && foundError.type) {
            return {
                name: fieldName,
                error: foundError,
            };
        }
        if (foundError && foundError.root && foundError.root.type) {
            return {
                name: `${fieldName}.root`,
                error: foundError.root,
            };
        }
        names.pop();
    }
    return {
        name,
    };
}

var shouldRenderFormState = (formStateData, _proxyFormState, updateFormState, isRoot) => {
    updateFormState(formStateData);
    const { name, ...formState } = formStateData;
    return (isEmptyObject(formState) ||
        Object.keys(formState).length >= Object.keys(_proxyFormState).length ||
        Object.keys(formState).find((key) => _proxyFormState[key] ===
            (!isRoot || VALIDATION_MODE.all)));
};

var shouldSubscribeByName = (name, signalName, exact) => !name ||
    !signalName ||
    name === signalName ||
    convertToArrayPayload(name).some((currentName) => currentName &&
        (exact
            ? currentName === signalName
            : currentName.startsWith(signalName) ||
                signalName.startsWith(currentName)));

var skipValidation = (isBlurEvent, isTouched, isSubmitted, reValidateMode, mode) => {
    if (mode.isOnAll) {
        return false;
    }
    else if (!isSubmitted && mode.isOnTouch) {
        return !(isTouched || isBlurEvent);
    }
    else if (isSubmitted ? reValidateMode.isOnBlur : mode.isOnBlur) {
        return !isBlurEvent;
    }
    else if (isSubmitted ? reValidateMode.isOnChange : mode.isOnChange) {
        return isBlurEvent;
    }
    return true;
};

var unsetEmptyArray = (ref, name) => !compact(get(ref, name)).length && unset(ref, name);

var updateFieldArrayRootError = (errors, error, name) => {
    const fieldArrayErrors = convertToArrayPayload(get(errors, name));
    set(fieldArrayErrors, 'root', error[name]);
    set(errors, name, fieldArrayErrors);
    return errors;
};

var isMessage = (value) => isString(value);

function getValidateError(result, ref, type = 'validate') {
    if (isMessage(result) ||
        (Array.isArray(result) && result.every(isMessage)) ||
        (isBoolean(result) && !result)) {
        return {
            type,
            message: isMessage(result) ? result : '',
            ref,
        };
    }
}

var getValueAndMessage = (validationData) => isObject(validationData) && !isRegex(validationData)
    ? validationData
    : {
        value: validationData,
        message: '',
    };

var validateField = async (field, disabledFieldNames, formValues, validateAllFieldCriteria, shouldUseNativeValidation, isFieldArray) => {
    const { ref, refs, required, maxLength, minLength, min, max, pattern, validate, name, valueAsNumber, mount, } = field._f;
    const inputValue = get(formValues, name);
    if (!mount || disabledFieldNames.has(name)) {
        return {};
    }
    const inputRef = refs ? refs[0] : ref;
    const setCustomValidity = (message) => {
        if (shouldUseNativeValidation && inputRef.reportValidity) {
            inputRef.setCustomValidity(isBoolean(message) ? '' : message || '');
            inputRef.reportValidity();
        }
    };
    const error = {};
    const isRadio = isRadioInput(ref);
    const isCheckBox = isCheckBoxInput(ref);
    const isRadioOrCheckbox = isRadio || isCheckBox;
    const isEmpty = ((valueAsNumber || isFileInput(ref)) &&
        isUndefined(ref.value) &&
        isUndefined(inputValue)) ||
        (isHTMLElement(ref) && ref.value === '') ||
        inputValue === '' ||
        (Array.isArray(inputValue) && !inputValue.length);
    const appendErrorsCurry = appendErrors.bind(null, name, validateAllFieldCriteria, error);
    const getMinMaxMessage = (exceedMax, maxLengthMessage, minLengthMessage, maxType = INPUT_VALIDATION_RULES.maxLength, minType = INPUT_VALIDATION_RULES.minLength) => {
        const message = exceedMax ? maxLengthMessage : minLengthMessage;
        error[name] = {
            type: exceedMax ? maxType : minType,
            message,
            ref,
            ...appendErrorsCurry(exceedMax ? maxType : minType, message),
        };
    };
    if (isFieldArray
        ? !Array.isArray(inputValue) || !inputValue.length
        : required &&
            ((!isRadioOrCheckbox && (isEmpty || isNullOrUndefined(inputValue))) ||
                (isBoolean(inputValue) && !inputValue) ||
                (isCheckBox && !getCheckboxValue(refs).isValid) ||
                (isRadio && !getRadioValue(refs).isValid))) {
        const { value, message } = isMessage(required)
            ? { value: !!required, message: required }
            : getValueAndMessage(required);
        if (value) {
            error[name] = {
                type: INPUT_VALIDATION_RULES.required,
                message,
                ref: inputRef,
                ...appendErrorsCurry(INPUT_VALIDATION_RULES.required, message),
            };
            if (!validateAllFieldCriteria) {
                setCustomValidity(message);
                return error;
            }
        }
    }
    if (!isEmpty && (!isNullOrUndefined(min) || !isNullOrUndefined(max))) {
        let exceedMax;
        let exceedMin;
        const maxOutput = getValueAndMessage(max);
        const minOutput = getValueAndMessage(min);
        if (!isNullOrUndefined(inputValue) && !isNaN(inputValue)) {
            const valueNumber = ref.valueAsNumber ||
                (inputValue ? +inputValue : inputValue);
            if (!isNullOrUndefined(maxOutput.value)) {
                exceedMax = valueNumber > maxOutput.value;
            }
            if (!isNullOrUndefined(minOutput.value)) {
                exceedMin = valueNumber < minOutput.value;
            }
        }
        else {
            const valueDate = ref.valueAsDate || new Date(inputValue);
            const convertTimeToDate = (time) => new Date(new Date().toDateString() + ' ' + time);
            const isTime = ref.type == 'time';
            const isWeek = ref.type == 'week';
            if (isString(maxOutput.value) && inputValue) {
                exceedMax = isTime
                    ? convertTimeToDate(inputValue) > convertTimeToDate(maxOutput.value)
                    : isWeek
                        ? inputValue > maxOutput.value
                        : valueDate > new Date(maxOutput.value);
            }
            if (isString(minOutput.value) && inputValue) {
                exceedMin = isTime
                    ? convertTimeToDate(inputValue) < convertTimeToDate(minOutput.value)
                    : isWeek
                        ? inputValue < minOutput.value
                        : valueDate < new Date(minOutput.value);
            }
        }
        if (exceedMax || exceedMin) {
            getMinMaxMessage(!!exceedMax, maxOutput.message, minOutput.message, INPUT_VALIDATION_RULES.max, INPUT_VALIDATION_RULES.min);
            if (!validateAllFieldCriteria) {
                setCustomValidity(error[name].message);
                return error;
            }
        }
    }
    if ((maxLength || minLength) &&
        !isEmpty &&
        (isString(inputValue) || (isFieldArray && Array.isArray(inputValue)))) {
        const maxLengthOutput = getValueAndMessage(maxLength);
        const minLengthOutput = getValueAndMessage(minLength);
        const exceedMax = !isNullOrUndefined(maxLengthOutput.value) &&
            inputValue.length > +maxLengthOutput.value;
        const exceedMin = !isNullOrUndefined(minLengthOutput.value) &&
            inputValue.length < +minLengthOutput.value;
        if (exceedMax || exceedMin) {
            getMinMaxMessage(exceedMax, maxLengthOutput.message, minLengthOutput.message);
            if (!validateAllFieldCriteria) {
                setCustomValidity(error[name].message);
                return error;
            }
        }
    }
    if (pattern && !isEmpty && isString(inputValue)) {
        const { value: patternValue, message } = getValueAndMessage(pattern);
        if (isRegex(patternValue) && !inputValue.match(patternValue)) {
            error[name] = {
                type: INPUT_VALIDATION_RULES.pattern,
                message,
                ref,
                ...appendErrorsCurry(INPUT_VALIDATION_RULES.pattern, message),
            };
            if (!validateAllFieldCriteria) {
                setCustomValidity(message);
                return error;
            }
        }
    }
    if (validate) {
        if (isFunction(validate)) {
            const result = await validate(inputValue, formValues);
            const validateError = getValidateError(result, inputRef);
            if (validateError) {
                error[name] = {
                    ...validateError,
                    ...appendErrorsCurry(INPUT_VALIDATION_RULES.validate, validateError.message),
                };
                if (!validateAllFieldCriteria) {
                    setCustomValidity(validateError.message);
                    return error;
                }
            }
        }
        else if (isObject(validate)) {
            let validationResult = {};
            for (const key in validate) {
                if (!isEmptyObject(validationResult) && !validateAllFieldCriteria) {
                    break;
                }
                const validateError = getValidateError(await validate[key](inputValue, formValues), inputRef, key);
                if (validateError) {
                    validationResult = {
                        ...validateError,
                        ...appendErrorsCurry(key, validateError.message),
                    };
                    setCustomValidity(validateError.message);
                    if (validateAllFieldCriteria) {
                        error[name] = validationResult;
                    }
                }
            }
            if (!isEmptyObject(validationResult)) {
                error[name] = {
                    ref: inputRef,
                    ...validationResult,
                };
                if (!validateAllFieldCriteria) {
                    return error;
                }
            }
        }
    }
    setCustomValidity(true);
    return error;
};

const defaultOptions = {
    mode: VALIDATION_MODE.onSubmit,
    reValidateMode: VALIDATION_MODE.onChange,
    shouldFocusError: true,
};
function createFormControl(props = {}) {
    let _options = {
        ...defaultOptions,
        ...props,
    };
    let _formState = {
        submitCount: 0,
        isDirty: false,
        isReady: false,
        isLoading: isFunction(_options.defaultValues),
        isValidating: false,
        isSubmitted: false,
        isSubmitting: false,
        isSubmitSuccessful: false,
        isValid: false,
        touchedFields: {},
        dirtyFields: {},
        validatingFields: {},
        errors: _options.errors || {},
        disabled: _options.disabled || false,
    };
    let _fields = {};
    let _defaultValues = isObject(_options.defaultValues) || isObject(_options.values)
        ? cloneObject(_options.defaultValues || _options.values) || {}
        : {};
    let _formValues = _options.shouldUnregister
        ? {}
        : cloneObject(_defaultValues);
    let _state = {
        action: false,
        mount: false,
        watch: false,
    };
    let _names = {
        mount: new Set(),
        disabled: new Set(),
        unMount: new Set(),
        array: new Set(),
        watch: new Set(),
    };
    let delayErrorCallback;
    let timer = 0;
    const _proxyFormState = {
        isDirty: false,
        dirtyFields: false,
        validatingFields: false,
        touchedFields: false,
        isValidating: false,
        isValid: false,
        errors: false,
    };
    let _proxySubscribeFormState = {
        ..._proxyFormState,
    };
    const _subjects = {
        array: createSubject(),
        state: createSubject(),
    };
    const shouldDisplayAllAssociatedErrors = _options.criteriaMode === VALIDATION_MODE.all;
    const debounce = (callback) => (wait) => {
        clearTimeout(timer);
        timer = setTimeout(callback, wait);
    };
    const _setValid = async (shouldUpdateValid) => {
        if (!_options.disabled &&
            (_proxyFormState.isValid ||
                _proxySubscribeFormState.isValid ||
                shouldUpdateValid)) {
            const isValid = _options.resolver
                ? isEmptyObject((await _runSchema()).errors)
                : await executeBuiltInValidation(_fields, true);
            if (isValid !== _formState.isValid) {
                _subjects.state.next({
                    isValid,
                });
            }
        }
    };
    const _updateIsValidating = (names, isValidating) => {
        if (!_options.disabled &&
            (_proxyFormState.isValidating ||
                _proxyFormState.validatingFields ||
                _proxySubscribeFormState.isValidating ||
                _proxySubscribeFormState.validatingFields)) {
            (names || Array.from(_names.mount)).forEach((name) => {
                if (name) {
                    isValidating
                        ? set(_formState.validatingFields, name, isValidating)
                        : unset(_formState.validatingFields, name);
                }
            });
            _subjects.state.next({
                validatingFields: _formState.validatingFields,
                isValidating: !isEmptyObject(_formState.validatingFields),
            });
        }
    };
    const _setFieldArray = (name, values = [], method, args, shouldSetValues = true, shouldUpdateFieldsAndState = true) => {
        if (args && method && !_options.disabled) {
            _state.action = true;
            if (shouldUpdateFieldsAndState && Array.isArray(get(_fields, name))) {
                const fieldValues = method(get(_fields, name), args.argA, args.argB);
                shouldSetValues && set(_fields, name, fieldValues);
            }
            if (shouldUpdateFieldsAndState &&
                Array.isArray(get(_formState.errors, name))) {
                const errors = method(get(_formState.errors, name), args.argA, args.argB);
                shouldSetValues && set(_formState.errors, name, errors);
                unsetEmptyArray(_formState.errors, name);
            }
            if ((_proxyFormState.touchedFields ||
                _proxySubscribeFormState.touchedFields) &&
                shouldUpdateFieldsAndState &&
                Array.isArray(get(_formState.touchedFields, name))) {
                const touchedFields = method(get(_formState.touchedFields, name), args.argA, args.argB);
                shouldSetValues && set(_formState.touchedFields, name, touchedFields);
            }
            if (_proxyFormState.dirtyFields || _proxySubscribeFormState.dirtyFields) {
                _formState.dirtyFields = getDirtyFields(_defaultValues, _formValues);
            }
            _subjects.state.next({
                name,
                isDirty: _getDirty(name, values),
                dirtyFields: _formState.dirtyFields,
                errors: _formState.errors,
                isValid: _formState.isValid,
            });
        }
        else {
            set(_formValues, name, values);
        }
    };
    const updateErrors = (name, error) => {
        set(_formState.errors, name, error);
        _subjects.state.next({
            errors: _formState.errors,
        });
    };
    const _setErrors = (errors) => {
        _formState.errors = errors;
        _subjects.state.next({
            errors: _formState.errors,
            isValid: false,
        });
    };
    const updateValidAndValue = (name, shouldSkipSetValueAs, value, ref) => {
        const field = get(_fields, name);
        if (field) {
            const defaultValue = get(_formValues, name, isUndefined(value) ? get(_defaultValues, name) : value);
            isUndefined(defaultValue) ||
                (ref && ref.defaultChecked) ||
                shouldSkipSetValueAs
                ? set(_formValues, name, shouldSkipSetValueAs ? defaultValue : getFieldValue(field._f))
                : setFieldValue(name, defaultValue);
            _state.mount && _setValid();
        }
    };
    const updateTouchAndDirty = (name, fieldValue, isBlurEvent, shouldDirty, shouldRender) => {
        let shouldUpdateField = false;
        let isPreviousDirty = false;
        const output = {
            name,
        };
        if (!_options.disabled) {
            if (!isBlurEvent || shouldDirty) {
                if (_proxyFormState.isDirty || _proxySubscribeFormState.isDirty) {
                    isPreviousDirty = _formState.isDirty;
                    _formState.isDirty = output.isDirty = _getDirty();
                    shouldUpdateField = isPreviousDirty !== output.isDirty;
                }
                const isCurrentFieldPristine = deepEqual(get(_defaultValues, name), fieldValue);
                isPreviousDirty = !!get(_formState.dirtyFields, name);
                isCurrentFieldPristine
                    ? unset(_formState.dirtyFields, name)
                    : set(_formState.dirtyFields, name, true);
                output.dirtyFields = _formState.dirtyFields;
                shouldUpdateField =
                    shouldUpdateField ||
                        ((_proxyFormState.dirtyFields ||
                            _proxySubscribeFormState.dirtyFields) &&
                            isPreviousDirty !== !isCurrentFieldPristine);
            }
            if (isBlurEvent) {
                const isPreviousFieldTouched = get(_formState.touchedFields, name);
                if (!isPreviousFieldTouched) {
                    set(_formState.touchedFields, name, isBlurEvent);
                    output.touchedFields = _formState.touchedFields;
                    shouldUpdateField =
                        shouldUpdateField ||
                            ((_proxyFormState.touchedFields ||
                                _proxySubscribeFormState.touchedFields) &&
                                isPreviousFieldTouched !== isBlurEvent);
                }
            }
            shouldUpdateField && shouldRender && _subjects.state.next(output);
        }
        return shouldUpdateField ? output : {};
    };
    const shouldRenderByError = (name, isValid, error, fieldState) => {
        const previousFieldError = get(_formState.errors, name);
        const shouldUpdateValid = (_proxyFormState.isValid || _proxySubscribeFormState.isValid) &&
            isBoolean(isValid) &&
            _formState.isValid !== isValid;
        if (_options.delayError && error) {
            delayErrorCallback = debounce(() => updateErrors(name, error));
            delayErrorCallback(_options.delayError);
        }
        else {
            clearTimeout(timer);
            delayErrorCallback = null;
            error
                ? set(_formState.errors, name, error)
                : unset(_formState.errors, name);
        }
        if ((error ? !deepEqual(previousFieldError, error) : previousFieldError) ||
            !isEmptyObject(fieldState) ||
            shouldUpdateValid) {
            const updatedFormState = {
                ...fieldState,
                ...(shouldUpdateValid && isBoolean(isValid) ? { isValid } : {}),
                errors: _formState.errors,
                name,
            };
            _formState = {
                ..._formState,
                ...updatedFormState,
            };
            _subjects.state.next(updatedFormState);
        }
    };
    const _runSchema = async (name) => {
        _updateIsValidating(name, true);
        const result = await _options.resolver(_formValues, _options.context, getResolverOptions(name || _names.mount, _fields, _options.criteriaMode, _options.shouldUseNativeValidation));
        _updateIsValidating(name);
        return result;
    };
    const executeSchemaAndUpdateState = async (names) => {
        const { errors } = await _runSchema(names);
        if (names) {
            for (const name of names) {
                const error = get(errors, name);
                error
                    ? set(_formState.errors, name, error)
                    : unset(_formState.errors, name);
            }
        }
        else {
            _formState.errors = errors;
        }
        return errors;
    };
    const executeBuiltInValidation = async (fields, shouldOnlyCheckValid, context = {
        valid: true,
    }) => {
        for (const name in fields) {
            const field = fields[name];
            if (field) {
                const { _f, ...fieldValue } = field;
                if (_f) {
                    const isFieldArrayRoot = _names.array.has(_f.name);
                    const isPromiseFunction = field._f && hasPromiseValidation(field._f);
                    if (isPromiseFunction && _proxyFormState.validatingFields) {
                        _updateIsValidating([name], true);
                    }
                    const fieldError = await validateField(field, _names.disabled, _formValues, shouldDisplayAllAssociatedErrors, _options.shouldUseNativeValidation && !shouldOnlyCheckValid, isFieldArrayRoot);
                    if (isPromiseFunction && _proxyFormState.validatingFields) {
                        _updateIsValidating([name]);
                    }
                    if (fieldError[_f.name]) {
                        context.valid = false;
                        if (shouldOnlyCheckValid) {
                            break;
                        }
                    }
                    !shouldOnlyCheckValid &&
                        (get(fieldError, _f.name)
                            ? isFieldArrayRoot
                                ? updateFieldArrayRootError(_formState.errors, fieldError, _f.name)
                                : set(_formState.errors, _f.name, fieldError[_f.name])
                            : unset(_formState.errors, _f.name));
                }
                !isEmptyObject(fieldValue) &&
                    (await executeBuiltInValidation(fieldValue, shouldOnlyCheckValid, context));
            }
        }
        return context.valid;
    };
    const _removeUnmounted = () => {
        for (const name of _names.unMount) {
            const field = get(_fields, name);
            field &&
                (field._f.refs
                    ? field._f.refs.every((ref) => !live(ref))
                    : !live(field._f.ref)) &&
                unregister(name);
        }
        _names.unMount = new Set();
    };
    const _getDirty = (name, data) => !_options.disabled &&
        (name && data && set(_formValues, name, data),
            !deepEqual(getValues(), _defaultValues));
    const _getWatch = (names, defaultValue, isGlobal) => generateWatchOutput(names, _names, {
        ...(_state.mount
            ? _formValues
            : isUndefined(defaultValue)
                ? _defaultValues
                : isString(names)
                    ? { [names]: defaultValue }
                    : defaultValue),
    }, isGlobal, defaultValue);
    const _getFieldArray = (name) => compact(get(_state.mount ? _formValues : _defaultValues, name, _options.shouldUnregister ? get(_defaultValues, name, []) : []));
    const setFieldValue = (name, value, options = {}) => {
        const field = get(_fields, name);
        let fieldValue = value;
        if (field) {
            const fieldReference = field._f;
            if (fieldReference) {
                !fieldReference.disabled &&
                    set(_formValues, name, getFieldValueAs(value, fieldReference));
                fieldValue =
                    isHTMLElement(fieldReference.ref) && isNullOrUndefined(value)
                        ? ''
                        : value;
                if (isMultipleSelect(fieldReference.ref)) {
                    [...fieldReference.ref.options].forEach((optionRef) => (optionRef.selected = fieldValue.includes(optionRef.value)));
                }
                else if (fieldReference.refs) {
                    if (isCheckBoxInput(fieldReference.ref)) {
                        fieldReference.refs.forEach((checkboxRef) => {
                            if (!checkboxRef.defaultChecked || !checkboxRef.disabled) {
                                if (Array.isArray(fieldValue)) {
                                    checkboxRef.checked = !!fieldValue.find((data) => data === checkboxRef.value);
                                }
                                else {
                                    checkboxRef.checked =
                                        fieldValue === checkboxRef.value || !!fieldValue;
                                }
                            }
                        });
                    }
                    else {
                        fieldReference.refs.forEach((radioRef) => (radioRef.checked = radioRef.value === fieldValue));
                    }
                }
                else if (isFileInput(fieldReference.ref)) {
                    fieldReference.ref.value = '';
                }
                else {
                    fieldReference.ref.value = fieldValue;
                    if (!fieldReference.ref.type) {
                        _subjects.state.next({
                            name,
                            values: cloneObject(_formValues),
                        });
                    }
                }
            }
        }
        (options.shouldDirty || options.shouldTouch) &&
            updateTouchAndDirty(name, fieldValue, options.shouldTouch, options.shouldDirty, true);
        options.shouldValidate && trigger(name);
    };
    const setValues = (name, value, options) => {
        for (const fieldKey in value) {
            if (!value.hasOwnProperty(fieldKey)) {
                return;
            }
            const fieldValue = value[fieldKey];
            const fieldName = name + '.' + fieldKey;
            const field = get(_fields, fieldName);
            (_names.array.has(name) ||
                isObject(fieldValue) ||
                (field && !field._f)) &&
                !isDateObject(fieldValue)
                ? setValues(fieldName, fieldValue, options)
                : setFieldValue(fieldName, fieldValue, options);
        }
    };
    const setValue = (name, value, options = {}) => {
        const field = get(_fields, name);
        const isFieldArray = _names.array.has(name);
        const cloneValue = cloneObject(value);
        set(_formValues, name, cloneValue);
        if (isFieldArray) {
            _subjects.array.next({
                name,
                values: cloneObject(_formValues),
            });
            if ((_proxyFormState.isDirty ||
                _proxyFormState.dirtyFields ||
                _proxySubscribeFormState.isDirty ||
                _proxySubscribeFormState.dirtyFields) &&
                options.shouldDirty) {
                _subjects.state.next({
                    name,
                    dirtyFields: getDirtyFields(_defaultValues, _formValues),
                    isDirty: _getDirty(name, cloneValue),
                });
            }
        }
        else {
            field && !field._f && !isNullOrUndefined(cloneValue)
                ? setValues(name, cloneValue, options)
                : setFieldValue(name, cloneValue, options);
        }
        isWatched(name, _names) && _subjects.state.next({ ..._formState, name });
        _subjects.state.next({
            name: _state.mount ? name : undefined,
            values: cloneObject(_formValues),
        });
    };
    const onChange = async (event) => {
        _state.mount = true;
        const target = event.target;
        let name = target.name;
        let isFieldValueUpdated = true;
        const field = get(_fields, name);
        const _updateIsFieldValueUpdated = (fieldValue) => {
            isFieldValueUpdated =
                Number.isNaN(fieldValue) ||
                    (isDateObject(fieldValue) && isNaN(fieldValue.getTime())) ||
                    deepEqual(fieldValue, get(_formValues, name, fieldValue));
        };
        const validationModeBeforeSubmit = getValidationModes(_options.mode);
        const validationModeAfterSubmit = getValidationModes(_options.reValidateMode);
        if (field) {
            let error;
            let isValid;
            const fieldValue = target.type
                ? getFieldValue(field._f)
                : getEventValue(event);
            const isBlurEvent = event.type === EVENTS.BLUR || event.type === EVENTS.FOCUS_OUT;
            const shouldSkipValidation = (!hasValidation(field._f) &&
                !_options.resolver &&
                !get(_formState.errors, name) &&
                !field._f.deps) ||
                skipValidation(isBlurEvent, get(_formState.touchedFields, name), _formState.isSubmitted, validationModeAfterSubmit, validationModeBeforeSubmit);
            const watched = isWatched(name, _names, isBlurEvent);
            set(_formValues, name, fieldValue);
            if (isBlurEvent) {
                if (!target || !target.readOnly) {
                    field._f.onBlur && field._f.onBlur(event);
                    delayErrorCallback && delayErrorCallback(0);
                }
            }
            else if (field._f.onChange) {
                field._f.onChange(event);
            }
            const fieldState = updateTouchAndDirty(name, fieldValue, isBlurEvent);
            const shouldRender = !isEmptyObject(fieldState) || watched;
            !isBlurEvent &&
                _subjects.state.next({
                    name,
                    type: event.type,
                    values: cloneObject(_formValues),
                });
            if (shouldSkipValidation) {
                if (_proxyFormState.isValid || _proxySubscribeFormState.isValid) {
                    if (_options.mode === 'onBlur') {
                        if (isBlurEvent) {
                            _setValid();
                        }
                    }
                    else if (!isBlurEvent) {
                        _setValid();
                    }
                }
                return (shouldRender &&
                    _subjects.state.next({ name, ...(watched ? {} : fieldState) }));
            }
            !isBlurEvent && watched && _subjects.state.next({ ..._formState });
            if (_options.resolver) {
                const { errors } = await _runSchema([name]);
                _updateIsFieldValueUpdated(fieldValue);
                if (isFieldValueUpdated) {
                    const previousErrorLookupResult = schemaErrorLookup(_formState.errors, _fields, name);
                    const errorLookupResult = schemaErrorLookup(errors, _fields, previousErrorLookupResult.name || name);
                    error = errorLookupResult.error;
                    name = errorLookupResult.name;
                    isValid = isEmptyObject(errors);
                }
            }
            else {
                _updateIsValidating([name], true);
                error = (await validateField(field, _names.disabled, _formValues, shouldDisplayAllAssociatedErrors, _options.shouldUseNativeValidation))[name];
                _updateIsValidating([name]);
                _updateIsFieldValueUpdated(fieldValue);
                if (isFieldValueUpdated) {
                    if (error) {
                        isValid = false;
                    }
                    else if (_proxyFormState.isValid ||
                        _proxySubscribeFormState.isValid) {
                        isValid = await executeBuiltInValidation(_fields, true);
                    }
                }
            }
            if (isFieldValueUpdated) {
                field._f.deps &&
                    trigger(field._f.deps);
                shouldRenderByError(name, isValid, error, fieldState);
            }
        }
    };
    const _focusInput = (ref, key) => {
        if (get(_formState.errors, key) && ref.focus) {
            ref.focus();
            return 1;
        }
        return;
    };
    const trigger = async (name, options = {}) => {
        let isValid;
        let validationResult;
        const fieldNames = convertToArrayPayload(name);
        if (_options.resolver) {
            const errors = await executeSchemaAndUpdateState(isUndefined(name) ? name : fieldNames);
            isValid = isEmptyObject(errors);
            validationResult = name
                ? !fieldNames.some((name) => get(errors, name))
                : isValid;
        }
        else if (name) {
            validationResult = (await Promise.all(fieldNames.map(async (fieldName) => {
                const field = get(_fields, fieldName);
                return await executeBuiltInValidation(field && field._f ? { [fieldName]: field } : field);
            }))).every(Boolean);
            !(!validationResult && !_formState.isValid) && _setValid();
        }
        else {
            validationResult = isValid = await executeBuiltInValidation(_fields);
        }
        _subjects.state.next({
            ...(!isString(name) ||
                ((_proxyFormState.isValid || _proxySubscribeFormState.isValid) &&
                    isValid !== _formState.isValid)
                ? {}
                : { name }),
            ...(_options.resolver || !name ? { isValid } : {}),
            errors: _formState.errors,
        });
        options.shouldFocus &&
            !validationResult &&
            iterateFieldsByAction(_fields, _focusInput, name ? fieldNames : _names.mount);
        return validationResult;
    };
    const getValues = (fieldNames) => {
        const values = {
            ...(_state.mount ? _formValues : _defaultValues),
        };
        return isUndefined(fieldNames)
            ? values
            : isString(fieldNames)
                ? get(values, fieldNames)
                : fieldNames.map((name) => get(values, name));
    };
    const getFieldState = (name, formState) => ({
        invalid: !!get((formState || _formState).errors, name),
        isDirty: !!get((formState || _formState).dirtyFields, name),
        error: get((formState || _formState).errors, name),
        isValidating: !!get(_formState.validatingFields, name),
        isTouched: !!get((formState || _formState).touchedFields, name),
    });
    const clearErrors = (name) => {
        name &&
            convertToArrayPayload(name).forEach((inputName) => unset(_formState.errors, inputName));
        _subjects.state.next({
            errors: name ? _formState.errors : {},
        });
    };
    const setError = (name, error, options) => {
        const ref = (get(_fields, name, { _f: {} })._f || {}).ref;
        const currentError = get(_formState.errors, name) || {};
        // Don't override existing error messages elsewhere in the object tree.
        const { ref: currentRef, message, type, ...restOfErrorTree } = currentError;
        set(_formState.errors, name, {
            ...restOfErrorTree,
            ...error,
            ref,
        });
        _subjects.state.next({
            name,
            errors: _formState.errors,
            isValid: false,
        });
        options && options.shouldFocus && ref && ref.focus && ref.focus();
    };
    const watch = (name, defaultValue) => isFunction(name)
        ? _subjects.state.subscribe({
            next: (payload) => 'values' in payload &&
                name(_getWatch(undefined, defaultValue), payload),
        })
        : _getWatch(name, defaultValue, true);
    const _subscribe = (props) => _subjects.state.subscribe({
        next: (formState) => {
            if (shouldSubscribeByName(props.name, formState.name, props.exact) &&
                shouldRenderFormState(formState, props.formState || _proxyFormState, _setFormState, props.reRenderRoot)) {
                props.callback({
                    values: { ..._formValues },
                    ..._formState,
                    ...formState,
                    defaultValues: _defaultValues,
                });
            }
        },
    }).unsubscribe;
    const subscribe = (props) => {
        _state.mount = true;
        _proxySubscribeFormState = {
            ..._proxySubscribeFormState,
            ...props.formState,
        };
        return _subscribe({
            ...props,
            formState: _proxySubscribeFormState,
        });
    };
    const unregister = (name, options = {}) => {
        for (const fieldName of name ? convertToArrayPayload(name) : _names.mount) {
            _names.mount.delete(fieldName);
            _names.array.delete(fieldName);
            if (!options.keepValue) {
                unset(_fields, fieldName);
                unset(_formValues, fieldName);
            }
            !options.keepError && unset(_formState.errors, fieldName);
            !options.keepDirty && unset(_formState.dirtyFields, fieldName);
            !options.keepTouched && unset(_formState.touchedFields, fieldName);
            !options.keepIsValidating &&
                unset(_formState.validatingFields, fieldName);
            !_options.shouldUnregister &&
                !options.keepDefaultValue &&
                unset(_defaultValues, fieldName);
        }
        _subjects.state.next({
            values: cloneObject(_formValues),
        });
        _subjects.state.next({
            ..._formState,
            ...(!options.keepDirty ? {} : { isDirty: _getDirty() }),
        });
        !options.keepIsValid && _setValid();
    };
    const _setDisabledField = ({ disabled, name, }) => {
        if ((isBoolean(disabled) && _state.mount) ||
            !!disabled ||
            _names.disabled.has(name)) {
            disabled ? _names.disabled.add(name) : _names.disabled.delete(name);
        }
    };
    const register = (name, options = {}) => {
        let field = get(_fields, name);
        const disabledIsDefined = isBoolean(options.disabled) || isBoolean(_options.disabled);
        set(_fields, name, {
            ...(field || {}),
            _f: {
                ...(field && field._f ? field._f : { ref: { name } }),
                name,
                mount: true,
                ...options,
            },
        });
        _names.mount.add(name);
        if (field) {
            _setDisabledField({
                disabled: isBoolean(options.disabled)
                    ? options.disabled
                    : _options.disabled,
                name,
            });
        }
        else {
            updateValidAndValue(name, true, options.value);
        }
        return {
            ...(disabledIsDefined
                ? { disabled: options.disabled || _options.disabled }
                : {}),
            ...(_options.progressive
                ? {
                    required: !!options.required,
                    min: getRuleValue(options.min),
                    max: getRuleValue(options.max),
                    minLength: getRuleValue(options.minLength),
                    maxLength: getRuleValue(options.maxLength),
                    pattern: getRuleValue(options.pattern),
                }
                : {}),
            name,
            onChange,
            onBlur: onChange,
            ref: (ref) => {
                if (ref) {
                    register(name, options);
                    field = get(_fields, name);
                    const fieldRef = isUndefined(ref.value)
                        ? ref.querySelectorAll
                            ? ref.querySelectorAll('input,select,textarea')[0] || ref
                            : ref
                        : ref;
                    const radioOrCheckbox = isRadioOrCheckbox(fieldRef);
                    const refs = field._f.refs || [];
                    if (radioOrCheckbox
                        ? refs.find((option) => option === fieldRef)
                        : fieldRef === field._f.ref) {
                        return;
                    }
                    set(_fields, name, {
                        _f: {
                            ...field._f,
                            ...(radioOrCheckbox
                                ? {
                                    refs: [
                                        ...refs.filter(live),
                                        fieldRef,
                                        ...(Array.isArray(get(_defaultValues, name)) ? [{}] : []),
                                    ],
                                    ref: { type: fieldRef.type, name },
                                }
                                : { ref: fieldRef }),
                        },
                    });
                    updateValidAndValue(name, false, undefined, fieldRef);
                }
                else {
                    field = get(_fields, name, {});
                    if (field._f) {
                        field._f.mount = false;
                    }
                    (_options.shouldUnregister || options.shouldUnregister) &&
                        !(isNameInFieldArray(_names.array, name) && _state.action) &&
                        _names.unMount.add(name);
                }
            },
        };
    };
    const _focusError = () => _options.shouldFocusError &&
        iterateFieldsByAction(_fields, _focusInput, _names.mount);
    const _disableForm = (disabled) => {
        if (isBoolean(disabled)) {
            _subjects.state.next({ disabled });
            iterateFieldsByAction(_fields, (ref, name) => {
                const currentField = get(_fields, name);
                if (currentField) {
                    ref.disabled = currentField._f.disabled || disabled;
                    if (Array.isArray(currentField._f.refs)) {
                        currentField._f.refs.forEach((inputRef) => {
                            inputRef.disabled = currentField._f.disabled || disabled;
                        });
                    }
                }
            }, 0, false);
        }
    };
    const handleSubmit = (onValid, onInvalid) => async (e) => {
        let onValidError = undefined;
        if (e) {
            e.preventDefault && e.preventDefault();
            e.persist &&
                e.persist();
        }
        let fieldValues = cloneObject(_formValues);
        _subjects.state.next({
            isSubmitting: true,
        });
        if (_options.resolver) {
            const { errors, values } = await _runSchema();
            _formState.errors = errors;
            fieldValues = cloneObject(values);
        }
        else {
            await executeBuiltInValidation(_fields);
        }
        if (_names.disabled.size) {
            for (const name of _names.disabled) {
                unset(fieldValues, name);
            }
        }
        unset(_formState.errors, 'root');
        if (isEmptyObject(_formState.errors)) {
            _subjects.state.next({
                errors: {},
            });
            try {
                await onValid(fieldValues, e);
            }
            catch (error) {
                onValidError = error;
            }
        }
        else {
            if (onInvalid) {
                await onInvalid({ ..._formState.errors }, e);
            }
            _focusError();
            setTimeout(_focusError);
        }
        _subjects.state.next({
            isSubmitted: true,
            isSubmitting: false,
            isSubmitSuccessful: isEmptyObject(_formState.errors) && !onValidError,
            submitCount: _formState.submitCount + 1,
            errors: _formState.errors,
        });
        if (onValidError) {
            throw onValidError;
        }
    };
    const resetField = (name, options = {}) => {
        if (get(_fields, name)) {
            if (isUndefined(options.defaultValue)) {
                setValue(name, cloneObject(get(_defaultValues, name)));
            }
            else {
                setValue(name, options.defaultValue);
                set(_defaultValues, name, cloneObject(options.defaultValue));
            }
            if (!options.keepTouched) {
                unset(_formState.touchedFields, name);
            }
            if (!options.keepDirty) {
                unset(_formState.dirtyFields, name);
                _formState.isDirty = options.defaultValue
                    ? _getDirty(name, cloneObject(get(_defaultValues, name)))
                    : _getDirty();
            }
            if (!options.keepError) {
                unset(_formState.errors, name);
                _proxyFormState.isValid && _setValid();
            }
            _subjects.state.next({ ..._formState });
        }
    };
    const _reset = (formValues, keepStateOptions = {}) => {
        const updatedValues = formValues ? cloneObject(formValues) : _defaultValues;
        const cloneUpdatedValues = cloneObject(updatedValues);
        const isEmptyResetValues = isEmptyObject(formValues);
        const values = isEmptyResetValues ? _defaultValues : cloneUpdatedValues;
        if (!keepStateOptions.keepDefaultValues) {
            _defaultValues = updatedValues;
        }
        if (!keepStateOptions.keepValues) {
            if (keepStateOptions.keepDirtyValues) {
                const fieldsToCheck = new Set([
                    ..._names.mount,
                    ...Object.keys(getDirtyFields(_defaultValues, _formValues)),
                ]);
                for (const fieldName of Array.from(fieldsToCheck)) {
                    get(_formState.dirtyFields, fieldName)
                        ? set(values, fieldName, get(_formValues, fieldName))
                        : setValue(fieldName, get(values, fieldName));
                }
            }
            else {
                if (isWeb && isUndefined(formValues)) {
                    for (const name of _names.mount) {
                        const field = get(_fields, name);
                        if (field && field._f) {
                            const fieldReference = Array.isArray(field._f.refs)
                                ? field._f.refs[0]
                                : field._f.ref;
                            if (isHTMLElement(fieldReference)) {
                                const form = fieldReference.closest('form');
                                if (form) {
                                    form.reset();
                                    break;
                                }
                            }
                        }
                    }
                }
                if (keepStateOptions.keepFieldsRef) {
                    for (const fieldName of _names.mount) {
                        setValue(fieldName, get(values, fieldName));
                    }
                }
                else {
                    _fields = {};
                }
            }
            _formValues = _options.shouldUnregister
                ? keepStateOptions.keepDefaultValues
                    ? cloneObject(_defaultValues)
                    : {}
                : cloneObject(values);
            _subjects.array.next({
                values: { ...values },
            });
            _subjects.state.next({
                values: { ...values },
            });
        }
        _names = {
            mount: keepStateOptions.keepDirtyValues ? _names.mount : new Set(),
            unMount: new Set(),
            array: new Set(),
            disabled: new Set(),
            watch: new Set(),
            watchAll: false,
            focus: '',
        };
        _state.mount =
            !_proxyFormState.isValid ||
                !!keepStateOptions.keepIsValid ||
                !!keepStateOptions.keepDirtyValues;
        _state.watch = !!_options.shouldUnregister;
        _subjects.state.next({
            submitCount: keepStateOptions.keepSubmitCount
                ? _formState.submitCount
                : 0,
            isDirty: isEmptyResetValues
                ? false
                : keepStateOptions.keepDirty
                    ? _formState.isDirty
                    : !!(keepStateOptions.keepDefaultValues &&
                        !deepEqual(formValues, _defaultValues)),
            isSubmitted: keepStateOptions.keepIsSubmitted
                ? _formState.isSubmitted
                : false,
            dirtyFields: isEmptyResetValues
                ? {}
                : keepStateOptions.keepDirtyValues
                    ? keepStateOptions.keepDefaultValues && _formValues
                        ? getDirtyFields(_defaultValues, _formValues)
                        : _formState.dirtyFields
                    : keepStateOptions.keepDefaultValues && formValues
                        ? getDirtyFields(_defaultValues, formValues)
                        : keepStateOptions.keepDirty
                            ? _formState.dirtyFields
                            : {},
            touchedFields: keepStateOptions.keepTouched
                ? _formState.touchedFields
                : {},
            errors: keepStateOptions.keepErrors ? _formState.errors : {},
            isSubmitSuccessful: keepStateOptions.keepIsSubmitSuccessful
                ? _formState.isSubmitSuccessful
                : false,
            isSubmitting: false,
            defaultValues: _defaultValues,
        });
    };
    const reset = (formValues, keepStateOptions) => _reset(isFunction(formValues)
        ? formValues(_formValues)
        : formValues, keepStateOptions);
    const setFocus = (name, options = {}) => {
        const field = get(_fields, name);
        const fieldReference = field && field._f;
        if (fieldReference) {
            const fieldRef = fieldReference.refs
                ? fieldReference.refs[0]
                : fieldReference.ref;
            if (fieldRef.focus) {
                fieldRef.focus();
                options.shouldSelect &&
                    isFunction(fieldRef.select) &&
                    fieldRef.select();
            }
        }
    };
    const _setFormState = (updatedFormState) => {
        _formState = {
            ..._formState,
            ...updatedFormState,
        };
    };
    const _resetDefaultValues = () => isFunction(_options.defaultValues) &&
        _options.defaultValues().then((values) => {
            reset(values, _options.resetOptions);
            _subjects.state.next({
                isLoading: false,
            });
        });
    const methods = {
        control: {
            register,
            unregister,
            getFieldState,
            handleSubmit,
            setError,
            _subscribe,
            _runSchema,
            _focusError,
            _getWatch,
            _getDirty,
            _setValid,
            _setFieldArray,
            _setDisabledField,
            _setErrors,
            _getFieldArray,
            _reset,
            _resetDefaultValues,
            _removeUnmounted,
            _disableForm,
            _subjects,
            _proxyFormState,
            get _fields() {
                return _fields;
            },
            get _formValues() {
                return _formValues;
            },
            get _state() {
                return _state;
            },
            set _state(value) {
                _state = value;
            },
            get _defaultValues() {
                return _defaultValues;
            },
            get _names() {
                return _names;
            },
            set _names(value) {
                _names = value;
            },
            get _formState() {
                return _formState;
            },
            get _options() {
                return _options;
            },
            set _options(value) {
                _options = {
                    ..._options,
                    ...value,
                };
            },
        },
        subscribe,
        trigger,
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        reset,
        resetField,
        clearErrors,
        unregister,
        setError,
        setFocus,
        getFieldState,
    };
    return {
        ...methods,
        formControl: methods,
    };
}

/**
 * Custom hook to manage the entire form.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useform) • [Demo](https://codesandbox.io/s/react-hook-form-get-started-ts-5ksmm) • [Video](https://www.youtube.com/watch?v=RkXv4AXXC_4)
 *
 * @param props - form configuration and validation parameters.
 *
 * @returns methods - individual functions to manage the form state. {@link UseFormReturn}
 *
 * @example
 * ```tsx
 * function App() {
 *   const { register, handleSubmit, watch, formState: { errors } } = useForm();
 *   const onSubmit = data => console.log(data);
 *
 *   console.log(watch("example"));
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input defaultValue="test" {...register("example")} />
 *       <input {...register("exampleRequired", { required: true })} />
 *       {errors.exampleRequired && <span>This field is required</span>}
 *       <button>Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */
function useForm(props = {}) {
    const _formControl = React.useRef(undefined);
    const _values = React.useRef(undefined);
    const [formState, updateFormState] = React.useState({
        isDirty: false,
        isValidating: false,
        isLoading: isFunction(props.defaultValues),
        isSubmitted: false,
        isSubmitting: false,
        isSubmitSuccessful: false,
        isValid: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        validatingFields: {},
        errors: props.errors || {},
        disabled: props.disabled || false,
        isReady: false,
        defaultValues: isFunction(props.defaultValues)
            ? undefined
            : props.defaultValues,
    });
    if (!_formControl.current) {
        if (props.formControl) {
            _formControl.current = {
                ...props.formControl,
                formState,
            };
            if (props.defaultValues && !isFunction(props.defaultValues)) {
                props.formControl.reset(props.defaultValues, props.resetOptions);
            }
        }
        else {
            const { formControl, ...rest } = createFormControl(props);
            _formControl.current = {
                ...rest,
                formState,
            };
        }
    }
    const control = _formControl.current.control;
    control._options = props;
    useIsomorphicLayoutEffect(() => {
        const sub = control._subscribe({
            formState: control._proxyFormState,
            callback: () => updateFormState({ ...control._formState }),
            reRenderRoot: true,
        });
        updateFormState((data) => ({
            ...data,
            isReady: true,
        }));
        control._formState.isReady = true;
        return sub;
    }, [control]);
    React.useEffect(() => control._disableForm(props.disabled), [control, props.disabled]);
    React.useEffect(() => {
        if (props.mode) {
            control._options.mode = props.mode;
        }
        if (props.reValidateMode) {
            control._options.reValidateMode = props.reValidateMode;
        }
    }, [control, props.mode, props.reValidateMode]);
    React.useEffect(() => {
        if (props.errors) {
            control._setErrors(props.errors);
            control._focusError();
        }
    }, [control, props.errors]);
    React.useEffect(() => {
        props.shouldUnregister &&
            control._subjects.state.next({
                values: control._getWatch(),
            });
    }, [control, props.shouldUnregister]);
    React.useEffect(() => {
        if (control._proxyFormState.isDirty) {
            const isDirty = control._getDirty();
            if (isDirty !== formState.isDirty) {
                control._subjects.state.next({
                    isDirty,
                });
            }
        }
    }, [control, formState.isDirty]);
    React.useEffect(() => {
        if (props.values && !deepEqual(props.values, _values.current)) {
            control._reset(props.values, {
                keepFieldsRef: true,
                ...control._options.resetOptions,
            });
            _values.current = props.values;
            updateFormState((state) => ({ ...state }));
        }
        else {
            control._resetDefaultValues();
        }
    }, [control, props.values]);
    React.useEffect(() => {
        if (!control._state.mount) {
            control._setValid();
            control._state.mount = true;
        }
        if (control._state.watch) {
            control._state.watch = false;
            control._subjects.state.next({ ...control._formState });
        }
        control._removeUnmounted();
    });
    _formControl.current.formState = getProxyFormState(formState, control);
    return _formControl.current;
}

const s=(e,s,o)=>{if(e&&"reportValidity"in e){const r=get(o,s);e.setCustomValidity(r&&r.message||""),e.reportValidity();}},o=(t,e)=>{for(const o in e.fields){const r=e.fields[o];r&&r.ref&&"reportValidity"in r.ref?s(r.ref,o,t):r.refs&&r.refs.forEach(e=>s(e,o,t));}},r=(s,r)=>{r.shouldUseNativeValidation&&o(s,r);const f={};for(const o in s){const n=get(r.fields,o),a=Object.assign(s[o]||{},{ref:n&&n.ref});if(i(r.names||Object.keys(s),o)){const s=Object.assign({},get(f,o));set(s,"root",a),set(f,o,s);}else set(f,o,a);}return f},i=(t,e)=>t.some(t=>t.startsWith(e+"."));

var n=function(r,e){for(var n={};r.length;){var t=r[0],s=t.code,i=t.message,a=t.path.join(".");if(!n[a])if("unionErrors"in t){var u=t.unionErrors[0].errors[0];n[a]={message:u.message,type:u.code};}else n[a]={message:i,type:s};if("unionErrors"in t&&t.unionErrors.forEach(function(e){return e.errors.forEach(function(e){return r.push(e)})}),e){var c=n[a].types,f=c&&c[t.code];n[a]=appendErrors(a,e,n,s,f?[].concat(f,t.message):t.message);}r.shift();}return n},t=function(o$1,t,s){return void 0===s&&(s={}),function(i,a,u){try{return Promise.resolve(function(e,n){try{var a=Promise.resolve(o$1["sync"===s.mode?"parse":"parseAsync"](i,t)).then(function(e){return u.shouldUseNativeValidation&&o({},u),{errors:{},values:s.raw?i:e}});}catch(r){return n(r)}return a&&a.then?a.then(void 0,n):a}(0,function(r$1){if(function(r){return Array.isArray(null==r?void 0:r.errors)}(r$1))return {values:{},errors:r(n(r$1.errors,!u.shouldUseNativeValidation&&"all"===u.criteriaMode),u)};throw r$1}))}catch(r){return Promise.reject(r)}}};

var util;
(function (util) {
    util.assertEqual = (val) => val;
    function assertIs(_arg) { }
    util.assertIs = assertIs;
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
            obj[item] = item;
        }
        return obj;
    };
    util.getValidEnumValues = (obj) => {
        const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
            filtered[k] = obj[k];
        }
        return util.objectValues(filtered);
    };
    util.objectValues = (obj) => {
        return util.objectKeys(obj).map(function (e) {
            return obj[e];
        });
    };
    util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
        ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
        : (object) => {
            const keys = [];
            for (const key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
    util.find = (arr, checker) => {
        for (const item of arr) {
            if (checker(item))
                return item;
        }
        return undefined;
    };
    util.isInteger = typeof Number.isInteger === "function"
        ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
        : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
        return array
            .map((val) => (typeof val === "string" ? `'${val}'` : val))
            .join(separator);
    }
    util.joinValues = joinValues;
    util.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    };
})(util || (util = {}));
var objectUtil;
(function (objectUtil) {
    objectUtil.mergeShapes = (first, second) => {
        return {
            ...first,
            ...second, // second overwrites first
        };
    };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set",
]);
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return ZodParsedType.undefined;
        case "string":
            return ZodParsedType.string;
        case "number":
            return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
            return ZodParsedType.boolean;
        case "function":
            return ZodParsedType.function;
        case "bigint":
            return ZodParsedType.bigint;
        case "symbol":
            return ZodParsedType.symbol;
        case "object":
            if (Array.isArray(data)) {
                return ZodParsedType.array;
            }
            if (data === null) {
                return ZodParsedType.null;
            }
            if (data.then &&
                typeof data.then === "function" &&
                data.catch &&
                typeof data.catch === "function") {
                return ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return ZodParsedType.date;
            }
            return ZodParsedType.object;
        default:
            return ZodParsedType.unknown;
    }
};

const ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite",
]);
const quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
};
class ZodError extends Error {
    get errors() {
        return this.issues;
    }
    constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
            this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
            this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        }
        else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    format(_mapper) {
        const mapper = _mapper ||
            function (issue) {
                return issue.message;
            };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
            for (const issue of error.issues) {
                if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                }
                else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                }
                else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                }
                else if (issue.path.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < issue.path.length) {
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                            // if (typeof el === "string") {
                            //   curr[el] = curr[el] || { _errors: [] };
                            // } else if (typeof el === "number") {
                            //   const errorArray: any = [];
                            //   errorArray._errors = [];
                            //   curr[el] = curr[el] || errorArray;
                            // }
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processError(this);
        return fieldErrors;
    }
    static assert(value) {
        if (!(value instanceof ZodError)) {
            throw new Error(`Not a ZodError: ${value}`);
        }
    }
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
            if (sub.path.length > 0) {
                fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
                fieldErrors[sub.path[0]].push(mapper(sub));
            }
            else {
                formErrors.push(mapper(sub));
            }
        }
        return { formErrors, fieldErrors };
    }
    get formErrors() {
        return this.flatten();
    }
}
ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
};

const errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
        case ZodIssueCode.invalid_type:
            if (issue.received === ZodParsedType.undefined) {
                message = "Required";
            }
            else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodIssueCode.invalid_literal:
            message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
            break;
        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
            break;
        case ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
            break;
        case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
            break;
        case ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodIssueCode.invalid_string:
            if (typeof issue.validation === "object") {
                if ("includes" in issue.validation) {
                    message = `Invalid input: must include "${issue.validation.includes}"`;
                    if (typeof issue.validation.position === "number") {
                        message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
                    }
                }
                else if ("startsWith" in issue.validation) {
                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                }
                else if ("endsWith" in issue.validation) {
                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                }
                else {
                    util.assertNever(issue.validation);
                }
            }
            else if (issue.validation !== "regex") {
                message = `Invalid ${issue.validation}`;
            }
            else {
                message = "Invalid";
            }
            break;
        case ZodIssueCode.too_small:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact
                    ? `exactly equal to `
                    : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `}${issue.minimum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact
                    ? `exactly equal to `
                    : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `}${new Date(Number(issue.minimum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.too_big:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `less than or equal to`
                        : `less than`} ${issue.maximum}`;
            else if (issue.type === "bigint")
                message = `BigInt must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `less than or equal to`
                        : `less than`} ${issue.maximum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `smaller than or equal to`
                        : `smaller than`} ${new Date(Number(issue.maximum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        case ZodIssueCode.not_finite:
            message = "Number must be finite";
            break;
        default:
            message = _ctx.defaultError;
            util.assertNever(issue);
    }
    return { message };
};

let overrideErrorMap = errorMap;
function setErrorMap(map) {
    overrideErrorMap = map;
}
function getErrorMap() {
    return overrideErrorMap;
}

const makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...(issueData.path || [])];
    const fullIssue = {
        ...issueData,
        path: fullPath,
    };
    if (issueData.message !== undefined) {
        return {
            ...issueData,
            path: fullPath,
            message: issueData.message,
        };
    }
    let errorMessage = "";
    const maps = errorMaps
        .filter((m) => !!m)
        .slice()
        .reverse();
    for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: errorMessage,
    };
};
const EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap, // contextual error map is first priority
            ctx.schemaErrorMap, // then schema-bound map if available
            overrideMap, // then global override map
            overrideMap === errorMap ? undefined : errorMap, // then global default map
        ].filter((x) => !!x),
    });
    ctx.common.issues.push(issue);
}
class ParseStatus {
    constructor() {
        this.value = "valid";
    }
    dirty() {
        if (this.value === "valid")
            this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted")
            this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
            if (s.status === "aborted")
                return INVALID;
            if (s.status === "dirty")
                status.dirty();
            arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
                key,
                value,
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
            const { key, value } = pair;
            if (key.status === "aborted")
                return INVALID;
            if (value.status === "aborted")
                return INVALID;
            if (key.status === "dirty")
                status.dirty();
            if (value.status === "dirty")
                status.dirty();
            if (key.value !== "__proto__" &&
                (typeof value.value !== "undefined" || pair.alwaysSet)) {
                finalObject[key.value] = value.value;
            }
        }
        return { status: status.value, value: finalObject };
    }
}
const INVALID = Object.freeze({
    status: "aborted",
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var errorUtil;
(function (errorUtil) {
    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));

var _ZodEnum_cache, _ZodNativeEnum_cache;
class ParseInputLazyPath {
    constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
    }
    get path() {
        if (!this._cachedPath.length) {
            if (this._key instanceof Array) {
                this._cachedPath.push(...this._path, ...this._key);
            }
            else {
                this._cachedPath.push(...this._path, this._key);
            }
        }
        return this._cachedPath;
    }
}
const handleResult = (ctx, result) => {
    if (isValid(result)) {
        return { success: true, data: result.value };
    }
    else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        return {
            success: false,
            get error() {
                if (this._error)
                    return this._error;
                const error = new ZodError(ctx.common.issues);
                this._error = error;
                return this._error;
            },
        };
    }
};
function processCreateParams(params) {
    if (!params)
        return {};
    const { errorMap, invalid_type_error, required_error, description } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap)
        return { errorMap: errorMap, description };
    const customMap = (iss, ctx) => {
        var _a, _b;
        const { message } = params;
        if (iss.code === "invalid_enum_value") {
            return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
        }
        if (typeof ctx.data === "undefined") {
            return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
        }
        if (iss.code !== "invalid_type")
            return { message: ctx.defaultError };
        return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
    };
    return { errorMap: customMap, description };
}
class ZodType {
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return (ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
        });
    }
    _processInputParams(input) {
        return {
            status: new ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent,
            },
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        var _a;
        const ctx = {
            common: {
                issues: [],
                async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
            },
            path: (params === null || params === void 0 ? void 0 : params.path) || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
    }
    "~validate"(data) {
        var _a, _b;
        const ctx = {
            common: {
                issues: [],
                async: !!this["~standard"].async,
            },
            path: [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        if (!this["~standard"].async) {
            try {
                const result = this._parseSync({ data, path: [], parent: ctx });
                return isValid(result)
                    ? {
                        value: result.value,
                    }
                    : {
                        issues: ctx.common.issues,
                    };
            }
            catch (err) {
                if ((_b = (_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes("encountered")) {
                    this["~standard"].async = true;
                }
                ctx.common = {
                    issues: [],
                    async: true,
                };
            }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result)
            ? {
                value: result.value,
            }
            : {
                issues: ctx.common.issues,
            });
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
                async: true,
            },
            path: (params === null || params === void 0 ? void 0 : params.path) || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult)
            ? maybeAsyncResult
            : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    refine(check, message) {
        const getIssueProperties = (val) => {
            if (typeof message === "string" || typeof message === "undefined") {
                return { message };
            }
            else if (typeof message === "function") {
                return message(val);
            }
            else {
                return message;
            }
        };
        return this._refinement((val, ctx) => {
            const result = check(val);
            const setError = () => ctx.addIssue({
                code: ZodIssueCode.custom,
                ...getIssueProperties(val),
            });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data) => {
                    if (!data) {
                        setError();
                        return false;
                    }
                    else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            }
            else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function"
                    ? refinementData(val, ctx)
                    : refinementData);
                return false;
            }
            else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "refinement", refinement },
        });
    }
    superRefine(refinement) {
        return this._refinement(refinement);
    }
    constructor(def) {
        /** Alias of safeParseAsync */
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
            version: 1,
            vendor: "zod",
            validate: (data) => this["~validate"](data),
        };
    }
    optional() {
        return ZodOptional.create(this, this._def);
    }
    nullable() {
        return ZodNullable.create(this, this._def);
    }
    nullish() {
        return this.nullable().optional();
    }
    array() {
        return ZodArray.create(this);
    }
    promise() {
        return ZodPromise.create(this, this._def);
    }
    or(option) {
        return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
        return new ZodEffects({
            ...processCreateParams(this._def),
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "transform", transform },
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
            ...processCreateParams(this._def),
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
        });
    }
    brand() {
        return new ZodBranded({
            typeName: ZodFirstPartyTypeKind.ZodBranded,
            type: this,
            ...processCreateParams(this._def),
        });
    }
    catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
            ...processCreateParams(this._def),
            innerType: this,
            catchValue: catchValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodCatch,
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description,
        });
    }
    pipe(target) {
        return ZodPipeline.create(this, target);
    }
    readonly() {
        return ZodReadonly.create(this);
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
// const uuidRegex =
//   /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
//old email regex
// const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{1,})[^-<>()[\].,;:\s@"]$/i;
// eslint-disable-next-line
// const emailRegex =
//   /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/;
// const emailRegex =
//   /^[a-zA-Z0-9\.\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// const emailRegex =
//   /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
// const emailRegex =
//   /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9\-]+)*$/i;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
// faster, simpler, safer
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
// const ipv6Regex =
// /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
// https://base64.guru/standards/base64url
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
// simple
// const dateRegexSource = `\\d{4}-\\d{2}-\\d{2}`;
// no leap year validation
// const dateRegexSource = `\\d{4}-((0[13578]|10|12)-31|(0[13-9]|1[0-2])-30|(0[1-9]|1[0-2])-(0[1-9]|1\\d|2\\d))`;
// with leap year validation
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
        secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    }
    else if (args.precision == null) {
        secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?"; // require seconds if precision is nonzero
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
}
// Adapted from https://stackoverflow.com/a/3143231
function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
        opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
    }
    return false;
}
function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
        return false;
    try {
        const [header] = jwt.split(".");
        // Convert base64url to base64
        const base64 = header
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(header.length + ((4 - (header.length % 4)) % 4), "=");
        const decoded = JSON.parse(atob(base64));
        if (typeof decoded !== "object" || decoded === null)
            return false;
        if (!decoded.typ || !decoded.alg)
            return false;
        if (alg && decoded.alg !== alg)
            return false;
        return true;
    }
    catch (_a) {
        return false;
    }
}
function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
        return true;
    }
    return false;
}
class ZodString extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.string,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "length") {
                const tooBig = input.data.length > check.value;
                const tooSmall = input.data.length < check.value;
                if (tooBig || tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    if (tooBig) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    else if (tooSmall) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    status.dirty();
                }
            }
            else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "email",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "emoji") {
                if (!emojiRegex) {
                    emojiRegex = new RegExp(_emojiRegex, "u");
                }
                if (!emojiRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "emoji",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "uuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "nanoid") {
                if (!nanoidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "nanoid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid2") {
                if (!cuid2Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid2",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ulid") {
                if (!ulidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ulid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "url") {
                try {
                    new URL(input.data);
                }
                catch (_a) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "regex",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "trim") {
                input.data = input.data.trim();
            }
            else if (check.kind === "includes") {
                if (!input.data.includes(check.value, check.position)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { includes: check.value, position: check.position },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "toLowerCase") {
                input.data = input.data.toLowerCase();
            }
            else if (check.kind === "toUpperCase") {
                input.data = input.data.toUpperCase();
            }
            else if (check.kind === "startsWith") {
                if (!input.data.startsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { startsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "endsWith") {
                if (!input.data.endsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { endsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "datetime") {
                const regex = datetimeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "datetime",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "date") {
                const regex = dateRegex;
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "date",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "time") {
                const regex = timeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "time",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "duration") {
                if (!durationRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "duration",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ip") {
                if (!isValidIP(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ip",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "jwt") {
                if (!isValidJWT(input.data, check.alg)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "jwt",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cidr") {
                if (!isValidCidr(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cidr",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64") {
                if (!base64Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "base64",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64url") {
                if (!base64urlRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "base64url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
            validation,
            code: ZodIssueCode.invalid_string,
            ...errorUtil.errToObj(message),
        });
    }
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return this._addCheck({
            kind: "base64url",
            ...errorUtil.errToObj(message),
        });
    }
    jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
        var _a, _b;
        if (typeof options === "string") {
            return this._addCheck({
                kind: "datetime",
                precision: null,
                offset: false,
                local: false,
                message: options,
            });
        }
        return this._addCheck({
            kind: "datetime",
            precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
            offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
            local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
        });
    }
    date(message) {
        return this._addCheck({ kind: "date", message });
    }
    time(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "time",
                precision: null,
                message: options,
            });
        }
        return this._addCheck({
            kind: "time",
            precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
        });
    }
    duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil.errToObj(message),
        });
    }
    includes(value, options) {
        return this._addCheck({
            kind: "includes",
            value: value,
            position: options === null || options === void 0 ? void 0 : options.position,
            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
        });
    }
    startsWith(value, message) {
        return this._addCheck({
            kind: "startsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    endsWith(value, message) {
        return this._addCheck({
            kind: "endsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil.errToObj(message),
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil.errToObj(message),
        });
    }
    length(len, message) {
        return this._addCheck({
            kind: "length",
            value: len,
            ...errorUtil.errToObj(message),
        });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "trim" }],
        });
    }
    toLowerCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toLowerCase" }],
        });
    }
    toUpperCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toUpperCase" }],
        });
    }
    get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodString.create = (params) => {
    var _a;
    return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params),
    });
};
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
    return (valInt % stepInt) / Math.pow(10, decCount);
}
class ZodNumber extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
    }
    _parse(input) {
        if (this._def.coerce) {
            input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.number,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "int") {
                if (!util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "min") {
                const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "finite") {
                if (!Number.isFinite(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_finite,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil.toString(message),
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
            message: errorUtil.toString(message),
        });
    }
    finite(message) {
        return this._addCheck({
            kind: "finite",
            message: errorUtil.toString(message),
        });
    }
    safe(message) {
        return this._addCheck({
            kind: "min",
            inclusive: true,
            value: Number.MIN_SAFE_INTEGER,
            message: errorUtil.toString(message),
        })._addCheck({
            kind: "max",
            inclusive: true,
            value: Number.MAX_SAFE_INTEGER,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" ||
            (ch.kind === "multipleOf" && util.isInteger(ch.value)));
    }
    get isFinite() {
        let max = null, min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "finite" ||
                ch.kind === "int" ||
                ch.kind === "multipleOf") {
                return true;
            }
            else if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
            else if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return Number.isFinite(min) && Number.isFinite(max);
    }
}
ZodNumber.create = (params) => {
    return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params),
    });
};
class ZodBigInt extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
    }
    _parse(input) {
        if (this._def.coerce) {
            try {
                input.data = BigInt(input.data);
            }
            catch (_a) {
                return this._getInvalidInput(input);
            }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
            return this._getInvalidInput(input);
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        type: "bigint",
                        minimum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        type: "bigint",
                        maximum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (input.data % check.value !== BigInt(0)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.bigint,
            received: ctx.parsedType,
        });
        return INVALID;
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodBigInt({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodBigInt.create = (params) => {
    var _a;
    return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params),
    });
};
class ZodBoolean extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodBoolean.create = (params) => {
    return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params),
    });
};
class ZodDate extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.date,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_date,
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.getTime() < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        minimum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.getTime() > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        maximum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: new Date(input.data.getTime()),
        };
    }
    _addCheck(check) {
        return new ZodDate({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    min(minDate, message) {
        return this._addCheck({
            kind: "min",
            value: minDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    max(maxDate, message) {
        return this._addCheck({
            kind: "max",
            value: maxDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min != null ? new Date(min) : null;
    }
    get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max != null ? new Date(max) : null;
    }
}
ZodDate.create = (params) => {
    return new ZodDate({
        checks: [],
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params),
    });
};
class ZodSymbol extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.symbol,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodSymbol.create = (params) => {
    return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params),
    });
};
class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodUndefined.create = (params) => {
    return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params),
    });
};
class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodNull.create = (params) => {
    return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params),
    });
};
class ZodAny extends ZodType {
    constructor() {
        super(...arguments);
        // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
        this._any = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodAny.create = (params) => {
    return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params),
    });
};
class ZodUnknown extends ZodType {
    constructor() {
        super(...arguments);
        // required
        this._unknown = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodUnknown.create = (params) => {
    return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params),
    });
};
class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.never,
            received: ctx.parsedType,
        });
        return INVALID;
    }
}
ZodNever.create = (params) => {
    return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params),
    });
};
class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodVoid.create = (params) => {
    return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params),
    });
};
class ZodArray extends ZodType {
    _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (def.exactLength !== null) {
            const tooBig = ctx.data.length > def.exactLength.value;
            const tooSmall = ctx.data.length < def.exactLength.value;
            if (tooBig || tooSmall) {
                addIssueToContext(ctx, {
                    code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
                    minimum: (tooSmall ? def.exactLength.value : undefined),
                    maximum: (tooBig ? def.exactLength.value : undefined),
                    type: "array",
                    inclusive: true,
                    exact: true,
                    message: def.exactLength.message,
                });
                status.dirty();
            }
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.minLength.message,
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.maxLength.message,
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all([...ctx.data].map((item, i) => {
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result) => {
                return ParseStatus.mergeArray(status, result);
            });
        }
        const result = [...ctx.data].map((item, i) => {
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: { value: minLength, message: errorUtil.toString(message) },
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: { value: maxLength, message: errorUtil.toString(message) },
        });
    }
    length(len, message) {
        return new ZodArray({
            ...this._def,
            exactLength: { value: len, message: errorUtil.toString(message) },
        });
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodArray.create = (schema, params) => {
    return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params),
    });
};
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for (const key in schema.shape) {
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: () => newShape,
        });
    }
    else if (schema instanceof ZodArray) {
        return new ZodArray({
            ...schema._def,
            type: deepPartialify(schema.element),
        });
    }
    else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    }
    else {
        return schema;
    }
}
class ZodObject extends ZodType {
    constructor() {
        super(...arguments);
        this._cached = null;
        /**
         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
         * If you want to pass through unknown properties, use `.passthrough()` instead.
         */
        this.nonstrict = this.passthrough;
        // extend<
        //   Augmentation extends ZodRawShape,
        //   NewOutput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
        //       ? Augmentation[k]["_output"]
        //       : k extends keyof Output
        //       ? Output[k]
        //       : never;
        //   }>,
        //   NewInput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
        //       ? Augmentation[k]["_input"]
        //       : k extends keyof Input
        //       ? Input[k]
        //       : never;
        //   }>
        // >(
        //   augmentation: Augmentation
        // ): ZodObject<
        //   extendShape<T, Augmentation>,
        //   UnknownKeys,
        //   Catchall,
        //   NewOutput,
        //   NewInput
        // > {
        //   return new ZodObject({
        //     ...this._def,
        //     shape: () => ({
        //       ...this._def.shape(),
        //       ...augmentation,
        //     }),
        //   }) as any;
        // }
        /**
         * @deprecated Use `.extend` instead
         *  */
        this.augment = this.extend;
    }
    _getCached() {
        if (this._cached !== null)
            return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        return (this._cached = { shape, keys });
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever &&
            this._def.unknownKeys === "strip")) {
            for (const key in ctx.data) {
                if (!shapeKeys.includes(key)) {
                    extraKeys.push(key);
                }
            }
        }
        const pairs = [];
        for (const key of shapeKeys) {
            const keyValidator = shape[key];
            const value = ctx.data[key];
            pairs.push({
                key: { status: "valid", value: key },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys) {
                    pairs.push({
                        key: { status: "valid", value: key },
                        value: { status: "valid", value: ctx.data[key] },
                    });
                }
            }
            else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.unrecognized_keys,
                        keys: extraKeys,
                    });
                    status.dirty();
                }
            }
            else if (unknownKeys === "strip") ;
            else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        }
        else {
            // run catchall validation
            const catchall = this._def.catchall;
            for (const key of extraKeys) {
                const value = ctx.data[key];
                pairs.push({
                    key: { status: "valid", value: key },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data,
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve()
                .then(async () => {
                const syncPairs = [];
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    syncPairs.push({
                        key,
                        value,
                        alwaysSet: pair.alwaysSet,
                    });
                }
                return syncPairs;
            })
                .then((syncPairs) => {
                return ParseStatus.mergeObjectSync(status, syncPairs);
            });
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...(message !== undefined
                ? {
                    errorMap: (issue, ctx) => {
                        var _a, _b, _c, _d;
                        const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
                        if (issue.code === "unrecognized_keys")
                            return {
                                message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError,
                            };
                        return {
                            message: defaultError,
                        };
                    },
                }
                : {}),
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip",
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough",
        });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
        return new ZodObject({
            ...this._def,
            shape: () => ({
                ...this._def.shape(),
                ...augmentation,
            }),
        });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: () => ({
                ...this._def.shape(),
                ...merging._def.shape(),
            }),
            typeName: ZodFirstPartyTypeKind.ZodObject,
        });
        return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
        return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index,
        });
    }
    pick(mask) {
        const shape = {};
        util.objectKeys(mask).forEach((key) => {
            if (mask[key] && this.shape[key]) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    omit(mask) {
        const shape = {};
        util.objectKeys(this.shape).forEach((key) => {
            if (!mask[key]) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    /**
     * @deprecated
     */
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
            const fieldSchema = this.shape[key];
            if (mask && !mask[key]) {
                newShape[key] = fieldSchema;
            }
            else {
                newShape[key] = fieldSchema.optional();
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    required(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
            if (mask && !mask[key]) {
                newShape[key] = this.shape[key];
            }
            else {
                const fieldSchema = this.shape[key];
                let newField = fieldSchema;
                while (newField instanceof ZodOptional) {
                    newField = newField._def.innerType;
                }
                newShape[key] = newField;
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    keyof() {
        return createZodEnum(util.objectKeys(this.shape));
    }
}
ZodObject.create = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            // return first issue-free validation if it exists
            for (const result of results) {
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results) {
                if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            // return invalid
            const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option) => {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                    }),
                    ctx: childCtx,
                };
            })).then(handleResults);
        }
        else {
            let dirty = undefined;
            const issues = [];
            for (const option of options) {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx,
                });
                if (result.status === "valid") {
                    return result;
                }
                else if (result.status === "dirty" && !dirty) {
                    dirty = { result, ctx: childCtx };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues) => new ZodError(issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
}
ZodUnion.create = (types, params) => {
    return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params),
    });
};
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//////////                                 //////////
//////////      ZodDiscriminatedUnion      //////////
//////////                                 //////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
const getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
    }
    else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
    }
    else if (type instanceof ZodLiteral) {
        return [type.value];
    }
    else if (type instanceof ZodEnum) {
        return type.options;
    }
    else if (type instanceof ZodNativeEnum) {
        // eslint-disable-next-line ban/ban
        return util.objectValues(type.enum);
    }
    else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
    }
    else if (type instanceof ZodUndefined) {
        return [undefined];
    }
    else if (type instanceof ZodNull) {
        return [null];
    }
    else if (type instanceof ZodOptional) {
        return [undefined, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
    }
    else {
        return [];
    }
};
class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: Array.from(this.optionsMap.keys()),
                path: [discriminator],
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
        else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get options() {
        return this._def.options;
    }
    get optionsMap() {
        return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
        // Get all the valid discriminator values
        const optionsMap = new Map();
        // try {
        for (const type of options) {
            const discriminatorValues = getDiscriminator(type.shape[discriminator]);
            if (!discriminatorValues.length) {
                throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
            }
            for (const value of discriminatorValues) {
                if (optionsMap.has(value)) {
                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
                }
                optionsMap.set(value, type);
            }
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            optionsMap,
            ...processCreateParams(params),
        });
    }
}
function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util.objectKeys(b);
        const sharedKeys = util
            .objectKeys(a)
            .filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) {
            return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    else if (aType === ZodParsedType.date &&
        bType === ZodParsedType.date &&
        +a === +b) {
        return { valid: true, data: a };
    }
    else {
        return { valid: false };
    }
}
class ZodIntersection extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
            if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                return INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types,
                });
                return INVALID;
            }
            if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                status.dirty();
            }
            return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
            ]).then(([left, right]) => handleParsed(left, right));
        }
        else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }));
        }
    }
}
ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
        left: left,
        right: right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params),
    });
};
class ZodTuple extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            status.dirty();
        }
        const items = [...ctx.data]
            .map((item, itemIndex) => {
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema)
                return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        })
            .filter((x) => !!x); // filter nulls
        if (ctx.common.async) {
            return Promise.all(items).then((results) => {
                return ParseStatus.mergeArray(status, results);
            });
        }
        else {
            return ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest,
        });
    }
}
ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params),
    });
};
class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (ctx.common.async) {
            return ParseStatus.mergeObjectAsync(status, pairs);
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third),
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second),
        });
    }
}
class ZodMap extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async () => {
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
            });
        }
        else {
            const finalMap = new Map();
            for (const pair of pairs) {
                const key = pair.key;
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
        }
    }
}
ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params),
    });
};
class ZodSet extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.minSize.message,
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.maxSize.message,
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements) {
                if (element.status === "aborted")
                    return INVALID;
                if (element.status === "dirty")
                    status.dirty();
                parsedSet.add(element.value);
            }
            return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements) => finalizeSet(elements));
        }
        else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: { value: minSize, message: errorUtil.toString(message) },
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: { value: maxSize, message: errorUtil.toString(message) },
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodSet.create = (valueType, params) => {
    return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params),
    });
};
class ZodFunction extends ZodType {
    constructor() {
        super(...arguments);
        this.validate = this.implement;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.function,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        function makeArgsIssue(args, error) {
            return makeIssue({
                data: args,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap,
                ].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_arguments,
                    argumentsError: error,
                },
            });
        }
        function makeReturnsIssue(returns, error) {
            return makeIssue({
                data: returns,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap,
                ].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_return_type,
                    returnTypeError: error,
                },
            });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return OK(async function (...args) {
                const error = new ZodError([]);
                const parsedArgs = await me._def.args
                    .parseAsync(args, params)
                    .catch((e) => {
                    error.addIssue(makeArgsIssue(args, e));
                    throw error;
                });
                const result = await Reflect.apply(fn, this, parsedArgs);
                const parsedReturns = await me._def.returns._def.type
                    .parseAsync(result, params)
                    .catch((e) => {
                    error.addIssue(makeReturnsIssue(result, e));
                    throw error;
                });
                return parsedReturns;
            });
        }
        else {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return OK(function (...args) {
                const parsedArgs = me._def.args.safeParse(args, params);
                if (!parsedArgs.success) {
                    throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
                }
                const result = Reflect.apply(fn, this, parsedArgs.data);
                const parsedReturns = me._def.returns.safeParse(result, params);
                if (!parsedReturns.success) {
                    throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
                }
                return parsedReturns.data;
            });
        }
    }
    parameters() {
        return this._def.args;
    }
    returnType() {
        return this._def.returns;
    }
    args(...items) {
        return new ZodFunction({
            ...this._def,
            args: ZodTuple.create(items).rest(ZodUnknown.create()),
        });
    }
    returns(returnType) {
        return new ZodFunction({
            ...this._def,
            returns: returnType,
        });
    }
    implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    static create(args, returns, params) {
        return new ZodFunction({
            args: (args
                ? args
                : ZodTuple.create([]).rest(ZodUnknown.create())),
            returns: returns || ZodUnknown.create(),
            typeName: ZodFirstPartyTypeKind.ZodFunction,
            ...processCreateParams(params),
        });
    }
}
class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
}
ZodLazy.create = (getter, params) => {
    return new ZodLazy({
        getter: getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params),
    });
};
class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_literal,
                expected: this._def.value,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
    get value() {
        return this._def.value;
    }
}
ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
        value: value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params),
    });
};
function createZodEnum(values, params) {
    return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params),
    });
}
class ZodEnum extends ZodType {
    constructor() {
        super(...arguments);
        _ZodEnum_cache.set(this, void 0);
    }
    _parse(input) {
        if (typeof input.data !== "string") {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f")) {
            __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values), "f");
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache, "f").has(input.data)) {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    extract(values, newDef = this._def) {
        return ZodEnum.create(values, {
            ...this._def,
            ...newDef,
        });
    }
    exclude(values, newDef = this._def) {
        return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
            ...this._def,
            ...newDef,
        });
    }
}
_ZodEnum_cache = new WeakMap();
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
    constructor() {
        super(...arguments);
        _ZodNativeEnum_cache.set(this, void 0);
    }
    _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string &&
            ctx.parsedType !== ZodParsedType.number) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f")) {
            __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)), "f");
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache, "f").has(input.data)) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get enum() {
        return this._def.values;
    }
}
_ZodNativeEnum_cache = new WeakMap();
ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params),
    });
};
class ZodPromise extends ZodType {
    unwrap() {
        return this._def.type;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise &&
            ctx.common.async === false) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise
            ? ctx.data
            : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap,
            });
        }));
    }
}
ZodPromise.create = (schema, params) => {
    return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params),
    });
};
class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
            ? this._def.schema.sourceType()
            : this._def.schema;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
            addIssue: (arg) => {
                addIssueToContext(ctx, arg);
                if (arg.fatal) {
                    status.abort();
                }
                else {
                    status.dirty();
                }
            },
            get path() {
                return ctx.path;
            },
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data, checkCtx);
            if (ctx.common.async) {
                return Promise.resolve(processed).then(async (processed) => {
                    if (status.value === "aborted")
                        return INVALID;
                    const result = await this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx,
                    });
                    if (result.status === "aborted")
                        return INVALID;
                    if (result.status === "dirty")
                        return DIRTY(result.value);
                    if (status.value === "dirty")
                        return DIRTY(result.value);
                    return result;
                });
            }
            else {
                if (status.value === "aborted")
                    return INVALID;
                const result = this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx,
                });
                if (result.status === "aborted")
                    return INVALID;
                if (result.status === "dirty")
                    return DIRTY(result.value);
                if (status.value === "dirty")
                    return DIRTY(result.value);
                return result;
            }
        }
        if (effect.type === "refinement") {
            const executeRefinement = (acc) => {
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inner.status === "aborted")
                    return INVALID;
                if (inner.status === "dirty")
                    status.dirty();
                // return value is ignored
                executeRefinement(inner.value);
                return { status: status.value, value: inner.value };
            }
            else {
                return this._def.schema
                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                    .then((inner) => {
                    if (inner.status === "aborted")
                        return INVALID;
                    if (inner.status === "dirty")
                        status.dirty();
                    return executeRefinement(inner.value).then(() => {
                        return { status: status.value, value: inner.value };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (!isValid(base))
                    return base;
                const result = effect.transform(base.value, checkCtx);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return { status: status.value, value: result };
            }
            else {
                return this._def.schema
                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                    .then((base) => {
                    if (!isValid(base))
                        return base;
                    return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
                });
            }
        }
        util.assertNever(effect);
    }
}
ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params),
    });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params),
    });
};
class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
            return OK(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodOptional.create = (type, params) => {
    return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params),
    });
};
class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
            return OK(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodNullable.create = (type, params) => {
    return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params),
    });
};
class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
}
ZodDefault.create = (type, params) => {
    return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function"
            ? params.default
            : () => params.default,
        ...processCreateParams(params),
    });
};
class ZodCatch extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        // newCtx is used to not collect issues from inner types in ctx
        const newCtx = {
            ...ctx,
            common: {
                ...ctx.common,
                issues: [],
            },
        };
        const result = this._def.innerType._parse({
            data: newCtx.data,
            path: newCtx.path,
            parent: {
                ...newCtx,
            },
        });
        if (isAsync(result)) {
            return result.then((result) => {
                return {
                    status: "valid",
                    value: result.status === "valid"
                        ? result.value
                        : this._def.catchValue({
                            get error() {
                                return new ZodError(newCtx.common.issues);
                            },
                            input: newCtx.data,
                        }),
                };
            });
        }
        else {
            return {
                status: "valid",
                value: result.status === "valid"
                    ? result.value
                    : this._def.catchValue({
                        get error() {
                            return new ZodError(newCtx.common.issues);
                        },
                        input: newCtx.data,
                    }),
            };
        }
    }
    removeCatch() {
        return this._def.innerType;
    }
}
ZodCatch.create = (type, params) => {
    return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params),
    });
};
class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
}
ZodNaN.create = (params) => {
    return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params),
    });
};
const BRAND = Symbol("zod_brand");
class ZodBranded extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    unwrap() {
        return this._def.type;
    }
}
class ZodPipeline extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
            const handleAsync = async () => {
                const inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inResult.status === "aborted")
                    return INVALID;
                if (inResult.status === "dirty") {
                    status.dirty();
                    return DIRTY(inResult.value);
                }
                else {
                    return this._def.out._parseAsync({
                        data: inResult.value,
                        path: ctx.path,
                        parent: ctx,
                    });
                }
            };
            return handleAsync();
        }
        else {
            const inResult = this._def.in._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
            if (inResult.status === "aborted")
                return INVALID;
            if (inResult.status === "dirty") {
                status.dirty();
                return {
                    status: "dirty",
                    value: inResult.value,
                };
            }
            else {
                return this._def.out._parseSync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
    }
    static create(a, b) {
        return new ZodPipeline({
            in: a,
            out: b,
            typeName: ZodFirstPartyTypeKind.ZodPipeline,
        });
    }
}
class ZodReadonly extends ZodType {
    _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
            if (isValid(data)) {
                data.value = Object.freeze(data.value);
            }
            return data;
        };
        return isAsync(result)
            ? result.then((data) => freeze(data))
            : freeze(result);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params),
    });
};
////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////      z.custom      //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////
function cleanParams(params, data) {
    const p = typeof params === "function"
        ? params(data)
        : typeof params === "string"
            ? { message: params }
            : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
}
function custom(check, _params = {}, 
/**
 * @deprecated
 *
 * Pass `fatal` into the params object instead:
 *
 * ```ts
 * z.string().custom((val) => val.length > 5, { fatal: false })
 * ```
 *
 */
fatal) {
    if (check)
        return ZodAny.create().superRefine((data, ctx) => {
            var _a, _b;
            const r = check(data);
            if (r instanceof Promise) {
                return r.then((r) => {
                    var _a, _b;
                    if (!r) {
                        const params = cleanParams(_params, data);
                        const _fatal = (_b = (_a = params.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
                        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
                    }
                });
            }
            if (!r) {
                const params = cleanParams(_params, data);
                const _fatal = (_b = (_a = params.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
                ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
            return;
        });
    return ZodAny.create();
}
const late = {
    object: ZodObject.lazycreate,
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const instanceOfType = (
// const instanceOfType = <T extends new (...args: any[]) => any>(
cls, params = {
    message: `Input not instance of ${cls.name}`,
}) => custom((data) => data instanceof cls, params);
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const symbolType = ZodSymbol.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const pipelineType = ZodPipeline.create;
const ostring = () => stringType().optional();
const onumber = () => numberType().optional();
const oboolean = () => booleanType().optional();
const coerce = {
    string: ((arg) => ZodString.create({ ...arg, coerce: true })),
    number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
    boolean: ((arg) => ZodBoolean.create({
        ...arg,
        coerce: true,
    })),
    bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
    date: ((arg) => ZodDate.create({ ...arg, coerce: true })),
};
const NEVER = INVALID;

var z = /*#__PURE__*/Object.freeze({
    __proto__: null,
    defaultErrorMap: errorMap,
    setErrorMap: setErrorMap,
    getErrorMap: getErrorMap,
    makeIssue: makeIssue,
    EMPTY_PATH: EMPTY_PATH,
    addIssueToContext: addIssueToContext,
    ParseStatus: ParseStatus,
    INVALID: INVALID,
    DIRTY: DIRTY,
    OK: OK,
    isAborted: isAborted,
    isDirty: isDirty,
    isValid: isValid,
    isAsync: isAsync,
    get util () { return util; },
    get objectUtil () { return objectUtil; },
    ZodParsedType: ZodParsedType,
    getParsedType: getParsedType,
    ZodType: ZodType,
    datetimeRegex: datetimeRegex,
    ZodString: ZodString,
    ZodNumber: ZodNumber,
    ZodBigInt: ZodBigInt,
    ZodBoolean: ZodBoolean,
    ZodDate: ZodDate,
    ZodSymbol: ZodSymbol,
    ZodUndefined: ZodUndefined,
    ZodNull: ZodNull,
    ZodAny: ZodAny,
    ZodUnknown: ZodUnknown,
    ZodNever: ZodNever,
    ZodVoid: ZodVoid,
    ZodArray: ZodArray,
    ZodObject: ZodObject,
    ZodUnion: ZodUnion,
    ZodDiscriminatedUnion: ZodDiscriminatedUnion,
    ZodIntersection: ZodIntersection,
    ZodTuple: ZodTuple,
    ZodRecord: ZodRecord,
    ZodMap: ZodMap,
    ZodSet: ZodSet,
    ZodFunction: ZodFunction,
    ZodLazy: ZodLazy,
    ZodLiteral: ZodLiteral,
    ZodEnum: ZodEnum,
    ZodNativeEnum: ZodNativeEnum,
    ZodPromise: ZodPromise,
    ZodEffects: ZodEffects,
    ZodTransformer: ZodEffects,
    ZodOptional: ZodOptional,
    ZodNullable: ZodNullable,
    ZodDefault: ZodDefault,
    ZodCatch: ZodCatch,
    ZodNaN: ZodNaN,
    BRAND: BRAND,
    ZodBranded: ZodBranded,
    ZodPipeline: ZodPipeline,
    ZodReadonly: ZodReadonly,
    custom: custom,
    Schema: ZodType,
    ZodSchema: ZodType,
    late: late,
    get ZodFirstPartyTypeKind () { return ZodFirstPartyTypeKind; },
    coerce: coerce,
    any: anyType,
    array: arrayType,
    bigint: bigIntType,
    boolean: booleanType,
    date: dateType,
    discriminatedUnion: discriminatedUnionType,
    effect: effectsType,
    'enum': enumType,
    'function': functionType,
    'instanceof': instanceOfType,
    intersection: intersectionType,
    lazy: lazyType,
    literal: literalType,
    map: mapType,
    nan: nanType,
    nativeEnum: nativeEnumType,
    never: neverType,
    'null': nullType,
    nullable: nullableType,
    number: numberType,
    object: objectType,
    oboolean: oboolean,
    onumber: onumber,
    optional: optionalType,
    ostring: ostring,
    pipeline: pipelineType,
    preprocess: preprocessType,
    promise: promiseType,
    record: recordType,
    set: setType,
    strictObject: strictObjectType,
    string: stringType,
    symbol: symbolType,
    transformer: effectsType,
    tuple: tupleType,
    'undefined': undefinedType,
    union: unionType,
    unknown: unknownType,
    'void': voidType,
    NEVER: NEVER,
    ZodIssueCode: ZodIssueCode,
    quotelessJson: quotelessJson,
    ZodError: ZodError
});

/**
 * Utility functions for BridgeForm
 */
/**
 * Formats a string to title case with spaces
 * @param str String to format
 * @returns Formatted string
 */
function formatFieldName(str) {
    // Handle camelCase
    const spacedStr = str.replace(/([A-Z])/g, ' $1');
    // Capitalize first letter and trim
    return spacedStr.charAt(0).toUpperCase() + spacedStr.slice(1).trim();
}
/**
 * Determines the field type based on Zod schema and field config
 * @param schema Zod schema for the field
 * @param configType Type specified in field config
 * @returns Determined field type
 */
function determineFieldType(schema, configType) {
    // If type is specified in config, use it
    if (configType)
        return configType;
    // Try to determine type from Zod schema
    if (schema instanceof z.ZodString) {
        // Check for specific string formats
        if (schema._def.checks) {
            for (const check of schema._def.checks) {
                if (check.kind === 'email')
                    return 'email';
                if (check.kind === 'url')
                    return 'url';
                if (check.kind === 'uuid')
                    return 'text';
                if (check.kind === 'regex') {
                    // Try to determine if it's a date pattern
                    if (check.regex.source.includes('\\d{4}-\\d{2}-\\d{2}'))
                        return 'date';
                }
            }
        }
        return 'text';
    }
    if (schema instanceof z.ZodNumber)
        return 'number';
    if (schema instanceof z.ZodBoolean)
        return 'checkbox';
    if (schema instanceof z.ZodDate)
        return 'date';
    if (schema instanceof z.ZodEnum)
        return 'select';
    if (schema instanceof z.ZodNativeEnum)
        return 'select';
    // Default to text for other types
    return 'text';
}
/**
 * Checks if a field is required based on Zod schema
 * @param schema Zod schema for the field
 * @returns Whether the field is required
 */
function isFieldRequired(schema) {
    // Check if it's an optional field
    if (schema instanceof z.ZodOptional)
        return false;
    // Check if it's a nullable field with a default value
    if (schema instanceof z.ZodNullable && 'defaultValue' in schema._def && schema._def.defaultValue !== undefined) {
        return false;
    }
    // Check if it has a default value
    if (schema._def.defaultValue !== undefined)
        return false;
    return true;
}
/**
 * Gets options for select/radio fields from Zod enum schema
 * @param schema Zod schema for the field
 * @returns Options array or undefined
 */
function getOptionsFromSchema(schema) {
    if (schema instanceof z.ZodEnum) {
        return schema._def.values.map((value) => ({
            value,
            label: formatFieldName(value)
        }));
    }
    if (schema instanceof z.ZodNativeEnum) {
        const enumObject = schema._def.values;
        return Object.keys(enumObject)
            .filter(key => isNaN(Number(key))) // Filter out numeric keys
            .map(key => ({
            value: enumObject[key],
            label: formatFieldName(key)
        }));
    }
    return undefined;
}
/**
 * Gets responsive grid classes based on layout configuration
 * @param layout Layout configuration
 * @returns CSS class string
 */
function getGridClasses(layout) {
    if (!layout)
        return 'grid-cols-1';
    let classes = 'grid ';
    // Add gap
    if (layout.gap) {
        classes += `gap-${layout.gap} `;
    }
    else {
        classes += 'gap-6 ';
    }
    // Add columns
    if (typeof layout.columns === 'number') {
        classes += `grid-cols-1 md:grid-cols-${layout.columns}`;
    }
    else if (typeof layout.columns === 'object') {
        const { sm = 1, md = 1, lg = 1 } = layout.columns;
        classes += `grid-cols-1 `;
        if (sm > 1)
            classes += `sm:grid-cols-${sm} `;
        if (md > 1)
            classes += `md:grid-cols-${md} `;
        if (lg > 1)
            classes += `lg:grid-cols-${lg} `;
    }
    else {
        classes += 'grid-cols-1';
    }
    return classes.trim();
}
/**
 * Extracts field configs from Zod schema
 * @param schema Zod schema
 * @returns Array of field configs
 */
function getFieldsFromSchema(schema) {
    var _a, _b;
    // Get the shape of the schema
    const shape = (_b = (_a = schema._def).shape) === null || _b === void 0 ? void 0 : _b.call(_a);
    if (!shape)
        return [];
    return Object.entries(shape).map(([key, fieldSchema]) => {
        const fieldType = determineFieldType(fieldSchema);
        const options = getOptionsFromSchema(fieldSchema);
        return {
            name: key,
            label: formatFieldName(key),
            type: fieldType, // Cast to satisfy FieldConfig type
            ...(options ? { options } : {})
        };
    });
}
/**
 * Adjusts a color by a percentage
 * @param color Hex color code
 * @param percent Percentage to adjust (-100 to 100)
 * @param alpha Whether to adjust opacity instead of brightness
 * @returns Adjusted color
 */
function adjustColor(color, percent, alpha = false) {
    // Remove # if present
    color = color.replace('#', '');
    // Convert to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    if (alpha) {
        // Convert to rgba with opacity
        const opacity = Math.max(0, Math.min(1, 1 - (Math.abs(percent) / 100)));
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    else {
        // Adjust brightness
        const amount = Math.round(2.55 * percent);
        const newR = Math.max(0, Math.min(255, r + amount));
        const newG = Math.max(0, Math.min(255, g + amount));
        const newB = Math.max(0, Math.min(255, b + amount));
        // Convert back to hex
        return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
    }
}

/**
 * Styles for BridgeForm component
 */
/**
 * Base styles for the form and its elements
 */
const baseStyles = {
    // Form container
    form: `
    w-full max-w-4xl mx-auto p-6 rounded-lg
    transition-colors duration-200 ease-in-out
  `,
    formLight: `
    bg-white border border-gray-200 shadow-sm
  `,
    formDark: `
    bg-gray-800 border border-gray-700 shadow-md
  `,
    // Fields container
    fieldsContainer: `
    grid gap-6
  `,
    // Individual field
    field: `
    relative
  `,
    // Labels
    label: `
    block mb-2 font-medium text-sm
    transition-colors duration-200
  `,
    labelLight: `
    text-gray-700
  `,
    labelDark: `
    text-gray-200
  `,
    // Description text
    description: `
    text-sm mb-2
  `,
    descriptionLight: `
    text-gray-500
  `,
    descriptionDark: `
    text-gray-400
  `,
    // Text inputs
    input: `
    w-full px-4 py-2 rounded-md border
    focus:ring-2 focus:outline-none
    transition-colors duration-200
  `,
    inputLight: `
    bg-white text-gray-900 border-gray-300
    focus:border-[var(--bridge-form-primary-color,#3b82f6)]
    focus:ring-[var(--bridge-form-primary-focus,rgba(59,130,246,0.5))]
    placeholder-gray-400
  `,
    inputDark: `
    bg-gray-700 text-white border-gray-600
    focus:border-[var(--bridge-form-primary-color,#3b82f6)]
    focus:ring-[var(--bridge-form-primary-focus,rgba(59,130,246,0.3))]
    placeholder-gray-400
  `,
    // Textarea
    textarea: `
    w-full px-4 py-2 rounded-md border
    focus:ring-2 focus:outline-none
    transition-colors duration-200
    min-h-[120px] resize-y
  `,
    textareaLight: `
    bg-white text-gray-900 border-gray-300
    focus:border-blue-500 focus:ring-blue-200
    placeholder-gray-400
  `,
    textareaDark: `
    bg-gray-700 text-white border-gray-600
    focus:border-blue-400 focus:ring-blue-800
    placeholder-gray-400
  `,
    // Select
    select: `
    w-full px-4 py-2 rounded-md border
    focus:ring-2 focus:outline-none
    transition-colors duration-200
    appearance-none bg-no-repeat bg-right
  `,
    selectLight: `
    bg-white text-gray-900 border-gray-300
    focus:border-blue-500 focus:ring-blue-200
    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"%3E%3Cpath stroke="%236B7280" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 8 4 4 4-4"/%3E%3C/svg%3E')]
    bg-[length:1.25em_1.25em]
    pr-10
  `,
    selectDark: `
    bg-gray-700 text-white border-gray-600
    focus:border-blue-400 focus:ring-blue-800
    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"%3E%3Cpath stroke="%239CA3AF" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 8 4 4 4-4"/%3E%3C/svg%3E')]
    bg-[length:1.25em_1.25em]
    pr-10
  `,
    // Checkbox
    checkboxContainer: `
    flex items-center
  `,
    checkbox: `
    w-4 h-4 rounded focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
  `,
    checkboxLight: `
    text-[var(--bridge-form-primary-color,#3b82f6)]
    focus:ring-[var(--bridge-form-primary-color,#3b82f6)]
    border-gray-300
  `,
    checkboxDark: `
    text-[var(--bridge-form-primary-color,#3b82f6)]
    focus:ring-[var(--bridge-form-primary-color,#3b82f6)]
    border-gray-600
  `,
    checkboxLabel: `
    ml-2 text-sm font-medium
  `,
    checkboxLabelLight: `
    text-gray-700
  `,
    checkboxLabelDark: `
    text-gray-200
  `,
    // Radio
    radioContainer: `
    space-y-2
  `,
    radioOption: `
    flex items-center
  `,
    radio: `
    w-4 h-4 focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
  `,
    radioLight: `
    text-blue-600 focus:ring-blue-500 border-gray-300
  `,
    radioDark: `
    text-blue-500 focus:ring-blue-800 border-gray-600
  `,
    radioLabel: `
    ml-2 text-sm font-medium
  `,
    radioLabelLight: `
    text-gray-700
  `,
    radioLabelDark: `
    text-gray-200
  `,
    // Error message
    error: `
    mt-1 text-sm
  `,
    errorLight: `
    text-red-600
  `,
    errorDark: `
    text-red-400
  `,
    // Buttons container
    buttonsContainer: `
    mt-8 flex justify-end space-x-4
  `,
    // Button base
    button: `
    px-5 py-2 rounded-md font-medium
    transition-all duration-200
    focus:outline-none focus:ring-2
  `,
    // Primary button (submit)
    primaryButton: `
    bg-[var(--bridge-form-primary-color,#3b82f6)] text-white
    hover:bg-[var(--bridge-form-primary-hover,#2563eb)]
    focus:ring-[var(--bridge-form-primary-focus,rgba(59,130,246,0.5))]
  `,
    primaryButtonDark: `
    bg-[var(--bridge-form-primary-color,#3b82f6)] text-white
    hover:bg-[var(--bridge-form-primary-hover,#2563eb)]
    focus:ring-[var(--bridge-form-primary-focus,rgba(59,130,246,0.3))]
  `,
    // Secondary button (cancel)
    secondaryButton: `
    bg-gray-200 text-gray-800
    hover:bg-gray-300
    focus:ring-gray-300
  `,
    secondaryButtonDark: `
    bg-gray-700 text-gray-200
    hover:bg-gray-600
    focus:ring-gray-600
  `,
    // Loading state
    loading: `
    opacity-70 cursor-not-allowed
  `
};
/**
 * Combines base styles with theme-specific styles
 * @param base Base style
 * @param light Light theme style
 * @param dark Dark theme style
 * @param isDarkMode Whether dark mode is active
 * @returns Combined style string
 */
function getThemedStyle(base, light, dark, isDarkMode) {
    return `${base} ${isDarkMode ? dark : light}`.trim();
}

/**
 * BridgeForm component
 */
function BridgeForm({ schema, mode, entityConfig, instanceId, initialData, id, fields, layout, onSuccess, onError, onCancel, labels = {}, theme = 'auto', mainColor, className, style, customStyles = {} }) {
    var _a, _b;
    // Determine if dark mode is active
    const [isDarkMode, setIsDarkMode] = React.useState(() => {
        if (theme === 'dark')
            return true;
        if (theme === 'light')
            return false;
        // If 'auto', detect system preference
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });
    // Listen for system theme changes if theme is 'auto'
    React.useEffect(() => {
        if (theme !== 'auto' || typeof window === 'undefined')
            return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            setIsDarkMode(e.matches);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);
    // Get the shape of the schema
    const zodSchema = schema;
    const schemaShape = (_b = (_a = zodSchema._def).shape) === null || _b === void 0 ? void 0 : _b.call(_a);
    // Determine fields to display
    const fieldsToRender = fields || getFieldsFromSchema(schema);
    // Set up form with React Hook Form and Zod validation
    const { register, handleSubmit, formState: { errors }, setValue, watch, trigger, reset } = useForm({
        resolver: t(schema),
        defaultValues: initialData || {}
    });
    // Initialize form with initial data
    React.useEffect(() => {
        if (initialData) {
            Object.entries(initialData).forEach(([key, value]) => {
                setValue(key, value);
            });
        }
    }, [initialData, setValue]);
    // Set up CRUD operations with useBridgeCrud
    const { createItem, updateItem, loading, error: apiError, validationErrors: apiValidationErrors } = useBridgeCrud({
        entityConfig,
        instanceId,
        schemas: {
            create: mode === 'create' ? schema : undefined,
            update: mode === 'update' || mode === 'partial' ? schema : undefined
        }
    });
    // Handle form submission
    const onSubmit = async (data) => {
        try {
            let result;
            if (mode === 'create') {
                result = await createItem(data);
            }
            else if (mode === 'update') {
                if (!id) {
                    throw new Error('ID is required for update mode');
                }
                result = await updateItem(id, data);
            }
            else if (mode === 'partial') {
                if (!id) {
                    throw new Error('ID is required for partial mode');
                }
                // Only send changed fields
                const changedFields = Object.keys(data).reduce((acc, key) => {
                    const k = key;
                    if (initialData && data[k] !== initialData[k]) {
                        acc[k] = data[k];
                    }
                    return acc;
                }, {});
                if (Object.keys(changedFields).length > 0) {
                    result = await updateItem(id, changedFields);
                }
                else {
                    // No changes
                    result = data;
                }
            }
            // Call onSuccess with the result
            if (onSuccess) {
                // Cast the result to T to satisfy TypeScript
                onSuccess(result);
            }
        }
        catch (error) {
            if (onError)
                onError(error);
        }
    };
    // Helper to get themed styles
    const getStyles = (base, light, dark) => {
        return getThemedStyle(base, light, dark, isDarkMode);
    };
    // Generate CSS variables for main color if provided
    const mainColorVars = mainColor ? {
        '--bridge-form-primary-color': mainColor,
        '--bridge-form-primary-hover': adjustColor(mainColor, -10),
        '--bridge-form-primary-focus': adjustColor(mainColor, 30, true),
    } : {};
    // Render a field based on its type
    const renderField = (field) => {
        var _a;
        // Skip if field doesn't exist in schema
        if (!schemaShape || !schemaShape[field.name]) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`Field "${field.name}" is not defined in the schema`);
            }
            return null;
        }
        // Get field schema
        const fieldSchema = schemaShape[field.name];
        // Determine field properties
        const required = isFieldRequired(fieldSchema);
        const type = determineFieldType(fieldSchema, field.type);
        field.options || getOptionsFromSchema(fieldSchema);
        // Get error message if any
        const error = (_a = errors[field.name]) === null || _a === void 0 ? void 0 : _a.message;
        // If field has custom render function, use it
        if (field.render) {
            return (jsxRuntime.jsx("div", { className: `${customStyles.field || ''} ${field.className || ''}`, style: field.style, children: field.render({
                    field,
                    value: watch(field.name),
                    onChange: (value) => setValue(field.name, value),
                    onBlur: () => trigger(field.name),
                    error,
                    required,
                    disabled: field.disabled || false,
                    isDarkMode
                }) }, field.name));
        }
        // Standard field rendering
        return (jsxRuntime.jsxs("div", { className: `${customStyles.field || ''} ${field.className || ''}`, style: field.style, children: [type !== 'checkbox' && (jsxRuntime.jsxs("label", { htmlFor: field.name, className: getStyles(baseStyles.label, baseStyles.labelLight, baseStyles.labelDark), children: [field.label || formatFieldName(field.name), required && (jsxRuntime.jsx("span", { className: "text-red-500 ml-1", children: labels.required || '*' }))] })), field.description && (jsxRuntime.jsx("p", { className: getStyles(baseStyles.description, baseStyles.descriptionLight, baseStyles.descriptionDark), children: field.description })), renderInput(field, type), error && (jsxRuntime.jsx("p", { className: getStyles(baseStyles.error, baseStyles.errorLight, baseStyles.errorDark), children: error }))] }, field.name));
    };
    // Render specific input type
    const renderInput = (field, type, required) => {
        var _a, _b;
        const inputProps = {
            id: field.name,
            ...register(field.name),
            placeholder: field.placeholder,
            disabled: field.disabled,
            autoFocus: field.autoFocus
        };
        switch (type) {
            case 'textarea':
                return (jsxRuntime.jsx("textarea", { ...inputProps, rows: 5, className: getStyles(baseStyles.textarea, baseStyles.textareaLight, baseStyles.textareaDark) }));
            case 'select':
                return (jsxRuntime.jsxs("select", { ...inputProps, className: getStyles(baseStyles.select, baseStyles.selectLight, baseStyles.selectDark), children: [jsxRuntime.jsx("option", { value: "", children: "Select..." }), (_a = field.options) === null || _a === void 0 ? void 0 : _a.map(option => (jsxRuntime.jsx("option", { value: option.value, children: option.label }, option.value)))] }));
            case 'checkbox':
                return (jsxRuntime.jsxs("div", { className: baseStyles.checkboxContainer, children: [jsxRuntime.jsx("input", { type: "checkbox", id: field.name, ...register(field.name), disabled: field.disabled, className: getStyles(baseStyles.checkbox, baseStyles.checkboxLight, baseStyles.checkboxDark) }), jsxRuntime.jsx("label", { htmlFor: field.name, className: getStyles(baseStyles.checkboxLabel, baseStyles.checkboxLabelLight, baseStyles.checkboxLabelDark), children: field.label || formatFieldName(field.name) })] }));
            case 'radio':
                return (jsxRuntime.jsx("div", { className: baseStyles.radioContainer, children: (_b = field.options) === null || _b === void 0 ? void 0 : _b.map(option => (jsxRuntime.jsxs("div", { className: baseStyles.radioOption, children: [jsxRuntime.jsx("input", { type: "radio", id: `${field.name}-${option.value}`, value: option.value, ...register(field.name), disabled: field.disabled, className: getStyles(baseStyles.radio, baseStyles.radioLight, baseStyles.radioDark) }), jsxRuntime.jsx("label", { htmlFor: `${field.name}-${option.value}`, className: getStyles(baseStyles.radioLabel, baseStyles.radioLabelLight, baseStyles.radioLabelDark), children: option.label })] }, option.value))) }));
            default:
                return (jsxRuntime.jsx("input", { type: type, ...inputProps, className: getStyles(baseStyles.input, baseStyles.inputLight, baseStyles.inputDark) }));
        }
    };
    // Combine base styles with custom styles
    const formClassName = `
    ${getStyles(baseStyles.form, baseStyles.formLight, baseStyles.formDark)}
    ${className || ''}
    ${customStyles.form || ''}
    ${loading ? baseStyles.loading : ''}
  `.trim();
    // Get grid classes for fields container
    const fieldsContainerClassName = `
    ${baseStyles.fieldsContainer}
    ${getGridClasses(layout)}
  `.trim();
    return (jsxRuntime.jsxs("form", { onSubmit: handleSubmit(onSubmit), className: formClassName, style: { ...style, ...mainColorVars }, children: [jsxRuntime.jsx("div", { className: fieldsContainerClassName, children: fieldsToRender.map(renderField) }), apiError && (jsxRuntime.jsx("div", { className: getStyles(baseStyles.error, baseStyles.errorLight, baseStyles.errorDark), children: apiError.message })), jsxRuntime.jsxs("div", { className: baseStyles.buttonsContainer, children: [onCancel && (jsxRuntime.jsx("button", { type: "button", onClick: onCancel, disabled: loading, className: `
              ${baseStyles.button}
              ${getStyles(baseStyles.secondaryButton, baseStyles.secondaryButton, baseStyles.secondaryButtonDark)}
              ${customStyles.button || ''}
            `, children: labels.cancel || 'Cancel' })), jsxRuntime.jsx("button", { type: "submit", disabled: loading, className: `
            ${baseStyles.button}
            ${getStyles(baseStyles.primaryButton, baseStyles.primaryButton, baseStyles.primaryButtonDark)}
            ${customStyles.button || ''}
          `, children: loading ? 'Saving...' : labels.submit || (mode === 'create' ? 'Create' : 'Save') })] })] }));
}

/**
 * Available filter operators
 */
const OPERATORS = {
    text: [
        { label: 'Contains', value: 'contains' },
        { label: 'Equals', value: 'eq' },
        { label: 'Not equals', value: 'ne' },
        { label: 'Starts with', value: 'startsWith' },
        { label: 'Ends with', value: 'endsWith' }
    ],
    number: [
        { label: 'Equals', value: 'eq' },
        { label: 'Not equals', value: 'ne' },
        { label: 'Greater than', value: 'gt' },
        { label: 'Greater than or equal', value: 'gte' },
        { label: 'Less than', value: 'lt' },
        { label: 'Less than or equal', value: 'lte' }
    ],
    date: [
        { label: 'Equals', value: 'eq' },
        { label: 'Not equals', value: 'ne' },
        { label: 'After', value: 'gt' },
        { label: 'After or on', value: 'gte' },
        { label: 'Before', value: 'lt' },
        { label: 'Before or on', value: 'lte' }
    ],
    boolean: [
        { label: 'Is true', value: 'eq' },
        { label: 'Is false', value: 'ne' }
    ],
    select: [
        { label: 'Equals', value: 'eq' },
        { label: 'Not equals', value: 'ne' }
    ]
};
/**
 * Advanced Filter component
 */
function AdvancedFilter({ fields, filters, onAddFilter, onRemoveFilter, onResetFilters, style, texts = {}, colors = {}, className = '' }) {
    // Default texts
    const defaultTexts = {
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
    const defaultColors = {
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
    const [newFilter, setNewFilter] = React.useState({
        field: '',
        operator: '',
        value: ''
    });
    const [showAddForm, setShowAddForm] = React.useState(false);
    // Get available operators for selected field
    const getAvailableOperators = (fieldName) => {
        const field = fields.find(f => f.name === fieldName);
        if (!field)
            return [];
        if (field.operators) {
            return field.operators.map(op => {
                var _a, _b;
                return ({
                    label: ((_b = (_a = OPERATORS[field.type]) === null || _a === void 0 ? void 0 : _a.find(o => o.value === op)) === null || _b === void 0 ? void 0 : _b.label) || op,
                    value: op
                });
            });
        }
        return OPERATORS[field.type] || [];
    };
    // Handle add filter
    const handleAddFilter = () => {
        if (!newFilter.field || !newFilter.operator || newFilter.value === '') {
            return;
        }
        const field = fields.find(f => f.name === newFilter.field);
        if (!field)
            return;
        let value = newFilter.value;
        // Convert value based on field type
        if (field.type === 'number') {
            value = parseFloat(value);
            if (isNaN(value))
                return;
        }
        else if (field.type === 'boolean') {
            value = newFilter.operator === 'eq';
        }
        onAddFilter({
            field: newFilter.field,
            operator: newFilter.operator,
            value
        });
        // Reset form
        setNewFilter({ field: '', operator: '', value: '' });
        setShowAddForm(false);
    };
    // Render filter value input
    const renderValueInput = () => {
        var _a;
        const field = fields.find(f => f.name === newFilter.field);
        if (!field)
            return null;
        const inputStyle = {
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${defaultColors.border}`,
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
        };
        switch (field.type) {
            case 'select':
                return (jsxRuntime.jsxs("select", { style: inputStyle, value: newFilter.value, onChange: (e) => setNewFilter(prev => ({ ...prev, value: e.target.value })), children: [jsxRuntime.jsx("option", { value: "", children: defaultTexts.enterValue }), (_a = field.options) === null || _a === void 0 ? void 0 : _a.map(option => (jsxRuntime.jsx("option", { value: option.value, children: option.label }, option.value)))] }));
            case 'boolean':
                return (jsxRuntime.jsxs("select", { style: inputStyle, value: newFilter.value, onChange: (e) => setNewFilter(prev => ({ ...prev, value: e.target.value })), children: [jsxRuntime.jsx("option", { value: "", children: defaultTexts.enterValue }), jsxRuntime.jsx("option", { value: "true", children: "True" }), jsxRuntime.jsx("option", { value: "false", children: "False" })] }));
            case 'date':
                return (jsxRuntime.jsx("input", { type: "date", style: inputStyle, value: newFilter.value, onChange: (e) => setNewFilter(prev => ({ ...prev, value: e.target.value })) }));
            case 'number':
                return (jsxRuntime.jsx("input", { type: "number", style: inputStyle, placeholder: defaultTexts.enterValue, value: newFilter.value, onChange: (e) => setNewFilter(prev => ({ ...prev, value: e.target.value })) }));
            default:
                return (jsxRuntime.jsx("input", { type: "text", style: inputStyle, placeholder: defaultTexts.enterValue, value: newFilter.value, onChange: (e) => setNewFilter(prev => ({ ...prev, value: e.target.value })) }));
        }
    };
    // Styles
    const containerStyle = {
        backgroundColor: defaultColors.background,
        border: `1px solid ${defaultColors.border}`,
        borderRadius: '12px',
        padding: '16px',
        ...style
    };
    const buttonStyle = {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    };
    const primaryButtonStyle = {
        ...buttonStyle,
        backgroundColor: defaultColors.primary,
        color: '#ffffff'
    };
    const secondaryButtonStyle = {
        ...buttonStyle,
        backgroundColor: defaultColors.surface,
        color: defaultColors.text,
        border: `1px solid ${defaultColors.border}`
    };
    return (jsxRuntime.jsxs("div", { className: className, style: containerStyle, children: [jsxRuntime.jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }, children: [jsxRuntime.jsx("h3", { style: { margin: 0, color: defaultColors.text, fontSize: '16px', fontWeight: '600' }, children: defaultTexts.title }), jsxRuntime.jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [jsxRuntime.jsx("button", { style: primaryButtonStyle, onClick: () => setShowAddForm(!showAddForm), children: defaultTexts.addFilter }), filters.length > 0 && (jsxRuntime.jsx("button", { style: secondaryButtonStyle, onClick: onResetFilters, children: defaultTexts.resetFilters }))] })] }), showAddForm && (jsxRuntime.jsx("div", { style: {
                    backgroundColor: defaultColors.surface,
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: `1px solid ${defaultColors.border}`
                }, children: jsxRuntime.jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }, children: [jsxRuntime.jsxs("div", { children: [jsxRuntime.jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: defaultColors.textSecondary }, children: defaultTexts.field }), jsxRuntime.jsxs("select", { style: {
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: `1px solid ${defaultColors.border}`,
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }, value: newFilter.field, onChange: (e) => setNewFilter(prev => ({ ...prev, field: e.target.value, operator: '', value: '' })), children: [jsxRuntime.jsx("option", { value: "", children: defaultTexts.selectField }), fields.map(field => (jsxRuntime.jsx("option", { value: field.name, children: field.label }, field.name)))] })] }), jsxRuntime.jsxs("div", { children: [jsxRuntime.jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: defaultColors.textSecondary }, children: defaultTexts.operator }), jsxRuntime.jsxs("select", { style: {
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: `1px solid ${defaultColors.border}`,
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }, value: newFilter.operator, onChange: (e) => setNewFilter(prev => ({ ...prev, operator: e.target.value })), disabled: !newFilter.field, children: [jsxRuntime.jsx("option", { value: "", children: defaultTexts.selectOperator }), getAvailableOperators(newFilter.field).map(op => (jsxRuntime.jsx("option", { value: op.value, children: op.label }, op.value)))] })] }), jsxRuntime.jsxs("div", { children: [jsxRuntime.jsx("label", { style: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: defaultColors.textSecondary }, children: defaultTexts.value }), renderValueInput()] }), jsxRuntime.jsx("button", { style: primaryButtonStyle, onClick: handleAddFilter, disabled: !newFilter.field || !newFilter.operator || newFilter.value === '', children: defaultTexts.apply })] }) })), jsxRuntime.jsxs("div", { children: [jsxRuntime.jsx("h4", { style: { margin: '0 0 8px 0', color: defaultColors.textSecondary, fontSize: '14px', fontWeight: '500' }, children: defaultTexts.activeFilters }), filters.length === 0 ? (jsxRuntime.jsx("p", { style: { margin: 0, color: defaultColors.textSecondary, fontSize: '14px', fontStyle: 'italic' }, children: defaultTexts.noActiveFilters })) : (jsxRuntime.jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' }, children: filters.map((filter, index) => {
                            const field = fields.find(f => f.name === filter.field);
                            const operator = getAvailableOperators(filter.field).find(op => op.value === filter.operator);
                            return (jsxRuntime.jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    backgroundColor: defaultColors.primary,
                                    color: '#ffffff',
                                    padding: '4px 8px',
                                    borderRadius: '16px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }, children: [jsxRuntime.jsxs("span", { children: [field === null || field === void 0 ? void 0 : field.label, " ", operator === null || operator === void 0 ? void 0 : operator.label, " ", String(filter.value)] }), jsxRuntime.jsx("button", { style: {
                                            background: 'none',
                                            border: 'none',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            marginLeft: '4px',
                                            fontSize: '14px',
                                            padding: '0 2px'
                                        }, onClick: () => onRemoveFilter(index), children: "\u00D7" })] }, index));
                        }) }))] })] }));
}

/**
 * Component for displaying an offline indicator
 */
function OfflineIndicator({ offlineText = 'No internet connection', onlineText = 'Back online', onlineDuration = 3000, style, offlineTextStyle, onlineTextStyle, visible = true, position = 'top', className = '' }) {
    const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
    const [wasOffline, setWasOffline] = React.useState(false);
    const [showOnlineMessage, setShowOnlineMessage] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    // Listen for network changes
    React.useEffect(() => {
        const handleOnline = () => {
            // If we were offline and now we're online, show the online message
            if (isOffline) {
                setShowOnlineMessage(true);
                setIsAnimating(true);
                // Hide after duration
                setTimeout(() => {
                    setShowOnlineMessage(false);
                    setIsAnimating(false);
                }, onlineDuration);
            }
            setWasOffline(isOffline);
            setIsOffline(false);
        };
        const handleOffline = () => {
            setWasOffline(isOffline);
            setIsOffline(true);
            setShowOnlineMessage(false);
            setIsAnimating(false);
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOffline, onlineDuration]);
    // Don't render if not visible
    if (!visible) {
        return null;
    }
    // Don't render if online and not showing online message
    if (!isOffline && !showOnlineMessage) {
        return null;
    }
    // Default styles
    const defaultStyles = {
        position: 'fixed',
        left: 0,
        right: 0,
        [position]: 0,
        backgroundColor: isOffline ? '#dc2626' : '#22c55e',
        color: '#ffffff',
        padding: '12px 16px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 9999,
        transform: isAnimating ? 'translateY(0)' : 'translateY(0)',
        transition: 'all 0.3s ease-in-out',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    };
    const defaultTextStyles = {
        margin: 0,
        fontSize: '14px',
        fontWeight: '500'
    };
    const mergedStyles = {
        ...defaultStyles,
        ...style
    };
    const mergedTextStyles = {
        ...defaultTextStyles,
        ...(isOffline ? offlineTextStyle : onlineTextStyle)
    };
    return (jsxRuntime.jsxs("div", { className: className, style: mergedStyles, role: "alert", "aria-live": "polite", children: [jsxRuntime.jsx("span", { style: { fontSize: '16px' }, children: isOffline ? '⚠️' : '✅' }), jsxRuntime.jsx("span", { style: mergedTextStyles, children: isOffline ? offlineText : onlineText }), showOnlineMessage && (jsxRuntime.jsx("button", { onClick: () => {
                    setShowOnlineMessage(false);
                    setIsAnimating(false);
                }, style: {
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '0 4px',
                    marginLeft: '8px'
                }, "aria-label": "Close notification", children: "\u00D7" }))] }));
}
/**
 * Hook to get network status
 */
function useNetworkStatus() {
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    return {
        isOnline,
        isOffline: !isOnline
    };
}

/**
 * Component for displaying data in a list with sorting, filtering, and pagination
 */
function BridgeList({ renderItem, showPagination = true, showSearch = true, showFilters = true, showAdvancedFilters = false, advancedFilterFields = [], layout = { advancedFilterWidth: 30, contentWidth: 70 }, keyExtractor = (item) => item.id, onItemPress, style, loadingComponent, emptyComponent, errorComponent, paginationComponent, searchComponent, filterComponent, advancedFilterComponent, texts = {}, colors = {}, showOfflineIndicator = true, className = '', ...crudOptions }) {
    // Default texts
    const defaultTexts = {
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
    const defaultColors = {
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
    const { items, selectedItem, selectItem, loading, error, page, limit, hasMore, totalItems, setPage, setLimit, searchTerm, setSearchTerm, filters, addFilter, removeFilter, resetFilters, orderBy, orderDir, setSort, refresh } = useBridgeCrud(crudOptions);
    // Network status
    const { isOffline } = useNetworkStatus();
    // Render search component
    const renderSearch = () => {
        if (!showSearch)
            return null;
        if (searchComponent)
            return searchComponent;
        return (jsxRuntime.jsx("div", { style: { marginBottom: '16px' }, children: jsxRuntime.jsx("input", { type: "text", placeholder: defaultTexts.searchPlaceholder, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: {
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${defaultColors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    backgroundColor: defaultColors.surface
                } }) }));
    };
    // Render advanced filters
    const renderAdvancedFilters = () => {
        if (!showAdvancedFilters || advancedFilterFields.length === 0)
            return null;
        if (advancedFilterComponent)
            return advancedFilterComponent;
        return (jsxRuntime.jsx(AdvancedFilter, { fields: advancedFilterFields, filters: filters, onAddFilter: addFilter, onRemoveFilter: removeFilter, onResetFilters: resetFilters, colors: defaultColors, style: { marginBottom: '16px' } }));
    };
    // Render pagination
    const renderPagination = () => {
        if (!showPagination || !hasMore)
            return null;
        if (paginationComponent)
            return paginationComponent;
        return (jsxRuntime.jsxs("div", { style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginTop: '16px',
                padding: '16px'
            }, children: [jsxRuntime.jsx("button", { onClick: () => setPage(page + 1), disabled: loading, style: {
                        padding: '8px 16px',
                        backgroundColor: defaultColors.primary,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                    }, children: loading ? 'Loading...' : defaultTexts.loadMore }), totalItems && (jsxRuntime.jsxs("span", { style: { fontSize: '14px', color: defaultColors.textSecondary }, children: [defaultTexts.showingResults, " ", items.length, " ", defaultTexts.of, " ", totalItems, " ", defaultTexts.results] }))] }));
    };
    // Render offline indicator
    const renderOfflineIndicator = () => {
        if (!showOfflineIndicator || !isOffline)
            return null;
        return (jsxRuntime.jsx("div", { style: {
                backgroundColor: defaultColors.error,
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center'
            }, children: defaultTexts.offlineText }));
    };
    // Render loading state
    if (loading && items.length === 0) {
        return (jsxRuntime.jsx("div", { className: className, style: style, children: loadingComponent || (jsxRuntime.jsx("div", { style: {
                    textAlign: 'center',
                    padding: '32px',
                    color: defaultColors.textSecondary
                }, children: defaultTexts.loading })) }));
    }
    // Render error state
    if (error) {
        return (jsxRuntime.jsx("div", { className: className, style: style, children: errorComponent || (jsxRuntime.jsxs("div", { style: {
                    textAlign: 'center',
                    padding: '32px',
                    color: defaultColors.error
                }, children: [defaultTexts.error, jsxRuntime.jsx("br", {}), jsxRuntime.jsx("button", { onClick: refresh, style: {
                            marginTop: '16px',
                            padding: '8px 16px',
                            backgroundColor: defaultColors.primary,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }, children: "Retry" })] })) }));
    }
    // Main container style
    const containerStyle = {
        backgroundColor: defaultColors.background,
        ...style
    };
    // Layout styles
    const layoutStyle = showAdvancedFilters && advancedFilterFields.length > 0 ? {
        display: 'grid',
        gridTemplateColumns: `${layout.advancedFilterWidth}% ${layout.contentWidth}%`,
        gap: '16px'
    } : {};
    return (jsxRuntime.jsxs("div", { className: className, style: containerStyle, children: [renderOfflineIndicator(), jsxRuntime.jsxs("div", { style: layoutStyle, children: [showAdvancedFilters && advancedFilterFields.length > 0 && (jsxRuntime.jsx("div", { children: renderAdvancedFilters() })), jsxRuntime.jsxs("div", { children: [renderSearch(), items.length === 0 ? (emptyComponent || (jsxRuntime.jsx("div", { style: {
                                    textAlign: 'center',
                                    padding: '32px',
                                    color: defaultColors.textSecondary
                                }, children: defaultTexts.noResults }))) : (jsxRuntime.jsx("div", { children: items.map((item, index) => {
                                    const isSelected = selectedItem ? keyExtractor(selectedItem) === keyExtractor(item) : false;
                                    return (jsxRuntime.jsx("div", { onClick: () => {
                                            selectItem(item);
                                            if (onItemPress) {
                                                onItemPress(item);
                                            }
                                        }, style: { cursor: 'pointer' }, children: renderItem({
                                            item,
                                            index,
                                            isSelected,
                                            onSelect: () => selectItem(item)
                                        }) }, keyExtractor(item)));
                                }) })), renderPagination()] })] })] }));
}

/**
 * Professional login form component
 */
function LoginForm({ config = {}, onSuccess, onError, onPasswordReset, onAccountCreation, instanceId }) {
    const { login, isLoading } = useAuth(instanceId);
    // Form state
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState('');
    const [rememberMe, setRememberMe] = React.useState(false);
    // Configuration with defaults
    const { primaryColor = process.env.REACT_APP_PRIMARY_COLOR || '#006aff', secondaryColor = process.env.REACT_APP_SECONDARY_COLOR || '#4a90e2', appName = process.env.REACT_APP_NAME || 'Pubflow', logo = process.env.REACT_APP_LOGO, showPasswordReset = true, showAccountCreation = true, className = '', redirectPath } = config;
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // Basic validation
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        if (!password.trim()) {
            setError('Password is required');
            return;
        }
        try {
            const result = await login({ email: email.toLowerCase().trim(), password });
            if (result.success) {
                if (onSuccess) {
                    onSuccess(result.user);
                }
                // Handle redirect
                if (redirectPath && typeof window !== 'undefined') {
                    window.location.href = redirectPath;
                }
            }
            else {
                const errorMessage = result.error || 'Invalid credentials';
                setError(errorMessage);
                if (onError) {
                    onError(errorMessage);
                }
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Connection error. Please try again.';
            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        }
    };
    // Dynamic styles
    const styles = {
        container: {
            maxWidth: '400px',
            margin: '0 auto',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f0f0f0'
        },
        logoSection: {
            textAlign: 'center',
            marginBottom: '32px'
        },
        logo: {
            maxWidth: '320px',
            height: '80px',
            marginBottom: '20px'
        },
        welcomeText: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '8px',
            letterSpacing: '-0.5px'
        },
        subtitleText: {
            fontSize: '16px',
            color: '#666666',
            fontWeight: '400'
        },
        inputGroup: {
            marginBottom: '20px'
        },
        inputLabel: {
            fontSize: '15px',
            fontWeight: '600',
            color: '#333333',
            marginBottom: '8px',
            letterSpacing: '-0.2px',
            display: 'block'
        },
        inputContainer: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            border: '1px solid #e9ecef',
            padding: '0 16px',
            height: '56px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        },
        input: {
            flex: 1,
            fontSize: '16px',
            color: '#333333',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontWeight: '400'
        },
        eyeButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            marginLeft: '8px',
            color: '#666'
        },
        loginButton: {
            width: '100%',
            borderRadius: '16px',
            height: '56px',
            backgroundColor: primaryColor,
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            marginTop: '8px',
            boxShadow: `0 4px 12px ${primaryColor}40`,
            letterSpacing: '-0.2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        },
        errorContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fef2f2',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #fecaca'
        },
        errorText: {
            color: '#dc2626',
            fontSize: '14px',
            marginLeft: '8px',
            fontWeight: '500'
        },
        checkboxContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
        },
        linkButton: {
            background: 'none',
            border: 'none',
            color: primaryColor,
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
            padding: '12px',
            textAlign: 'center'
        },
        accountActions: {
            marginTop: '24px',
            marginBottom: '16px',
            textAlign: 'center'
        }
    };
    return (jsxRuntime.jsxs("div", { className: className, style: styles.container, children: [jsxRuntime.jsxs("div", { style: styles.logoSection, children: [logo && (typeof logo === 'string' ? (jsxRuntime.jsx("img", { src: logo, alt: `${appName} Logo`, style: styles.logo })) : (logo)), jsxRuntime.jsxs("h1", { style: styles.welcomeText, children: ["Welcome to ", appName] }), jsxRuntime.jsx("p", { style: styles.subtitleText, children: "Sign in to your account" })] }), jsxRuntime.jsxs("form", { onSubmit: handleSubmit, children: [error && (jsxRuntime.jsxs("div", { style: styles.errorContainer, children: [jsxRuntime.jsx("span", { style: { color: '#ff4757', fontSize: '20px' }, children: "\u26A0" }), jsxRuntime.jsx("span", { style: styles.errorText, children: error })] })), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "Email Address" }), jsxRuntime.jsxs("div", { style: styles.inputContainer, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\u2709" }), jsxRuntime.jsx("input", { type: "email", style: styles.input, placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), autoCapitalize: "none", autoComplete: "email", disabled: isLoading, required: true })] })] }), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "Password" }), jsxRuntime.jsxs("div", { style: styles.inputContainer, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\uD83D\uDD12" }), jsxRuntime.jsx("input", { type: showPassword ? 'text' : 'password', style: styles.input, placeholder: "Enter your password", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password", disabled: isLoading, required: true }), jsxRuntime.jsx("button", { type: "button", style: styles.eyeButton, onClick: () => setShowPassword(!showPassword), disabled: isLoading, children: showPassword ? '👁' : '👁‍🗨' })] })] }), jsxRuntime.jsxs("div", { style: styles.checkboxContainer, children: [jsxRuntime.jsxs("label", { style: { display: 'flex', alignItems: 'center', fontSize: '14px', color: '#666' }, children: [jsxRuntime.jsx("input", { type: "checkbox", checked: rememberMe, onChange: (e) => setRememberMe(e.target.checked), style: { marginRight: '8px' } }), "Remember me"] }), showPasswordReset && (jsxRuntime.jsx("button", { type: "button", style: { ...styles.linkButton, fontSize: '14px' }, onClick: onPasswordReset, disabled: isLoading, children: "Forgot password?" }))] }), jsxRuntime.jsx("button", { type: "submit", style: {
                            ...styles.loginButton,
                            opacity: isLoading ? 0.8 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }, disabled: isLoading, children: isLoading ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx("span", { style: { animation: 'spin 1s linear infinite' }, children: "\u27F3" }), "Signing in..."] })) : ('Sign In') })] }), showAccountCreation && (jsxRuntime.jsx("div", { style: styles.accountActions, children: jsxRuntime.jsx("button", { type: "button", style: styles.linkButton, onClick: onAccountCreation, disabled: isLoading, children: "Create New Account" }) })), jsxRuntime.jsx("style", { children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` })] }));
}

/**
 * Professional password reset form component
 */
function PasswordResetForm({ config = {}, onSuccess, onError, onBackToLogin, resetToken }) {
    // Configuration with defaults
    const { primaryColor = process.env.REACT_APP_PRIMARY_COLOR || '#006aff', appName = process.env.REACT_APP_NAME || 'Pubflow', logo = process.env.REACT_APP_LOGO, apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '', className = '' } = config;
    // Form state
    const [step, setStep] = React.useState(resetToken ? 'reset' : 'request');
    const [email, setEmail] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    // Handle password reset request
    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) {
            setError('Email is required');
            return;
        }
        setIsLoading(true);
        try {
            const resetUrl = `${window.location.origin}/reset-password`;
            const response = await fetch(`${apiBaseUrl}/auth/password-reset/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim(), resetUrl }),
            });
            const data = await response.json();
            if (response.ok) {
                setStep('sent');
            }
            else {
                setError(data.message || 'Error requesting password reset.');
                if (onError) {
                    onError(data.message || 'Error requesting password reset.');
                }
            }
        }
        catch (err) {
            const errorMessage = 'Network error. Please try again.';
            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    // Handle password reset
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (!newPassword.trim()) {
            setError('New password is required');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/auth/password-reset/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: resetToken, password: newPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                setStep('success');
                if (onSuccess) {
                    onSuccess();
                }
            }
            else {
                setError(data.message || 'Error resetting password.');
                if (onError) {
                    onError(data.message || 'Error resetting password.');
                }
            }
        }
        catch (err) {
            const errorMessage = 'Network error. Please try again.';
            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    // Dynamic styles
    const styles = {
        container: {
            maxWidth: '400px',
            margin: '0 auto',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f0f0f0'
        },
        logoSection: {
            textAlign: 'center',
            marginBottom: '32px'
        },
        logo: {
            maxWidth: '320px',
            height: '80px',
            marginBottom: '20px'
        },
        title: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '8px',
            letterSpacing: '-0.5px'
        },
        subtitle: {
            fontSize: '16px',
            color: '#666666',
            fontWeight: '400',
            marginBottom: '24px'
        },
        inputGroup: {
            marginBottom: '20px'
        },
        inputLabel: {
            fontSize: '15px',
            fontWeight: '600',
            color: '#333333',
            marginBottom: '8px',
            letterSpacing: '-0.2px',
            display: 'block'
        },
        inputContainer: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            border: '1px solid #e9ecef',
            padding: '0 16px',
            height: '56px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        },
        input: {
            flex: 1,
            fontSize: '16px',
            color: '#333333',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontWeight: '400'
        },
        eyeButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            marginLeft: '8px',
            color: '#666'
        },
        button: {
            width: '100%',
            borderRadius: '16px',
            height: '56px',
            backgroundColor: primaryColor,
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            marginTop: '8px',
            boxShadow: `0 4px 12px ${primaryColor}40`,
            letterSpacing: '-0.2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        },
        errorContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fef2f2',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #fecaca'
        },
        errorText: {
            color: '#dc2626',
            fontSize: '14px',
            marginLeft: '8px',
            fontWeight: '500'
        },
        successContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f0fdf4',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #bbf7d0'
        },
        successText: {
            color: '#166534',
            fontSize: '14px',
            marginLeft: '8px',
            fontWeight: '500'
        },
        linkButton: {
            background: 'none',
            border: 'none',
            color: primaryColor,
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
            padding: '12px',
            textAlign: 'center',
            width: '100%',
            marginTop: '16px'
        }
    };
    const renderStep = () => {
        switch (step) {
            case 'request':
                return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs("div", { style: styles.logoSection, children: [logo && (typeof logo === 'string' ? (jsxRuntime.jsx("img", { src: logo, alt: `${appName} Logo`, style: styles.logo })) : (logo)), jsxRuntime.jsx("h1", { style: styles.title, children: "Reset Password" }), jsxRuntime.jsx("p", { style: styles.subtitle, children: "Enter your email to receive reset instructions" })] }), jsxRuntime.jsxs("form", { onSubmit: handleRequestReset, children: [error && (jsxRuntime.jsxs("div", { style: styles.errorContainer, children: [jsxRuntime.jsx("span", { style: { color: '#ff4757', fontSize: '20px' }, children: "\u26A0" }), jsxRuntime.jsx("span", { style: styles.errorText, children: error })] })), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "Email Address" }), jsxRuntime.jsxs("div", { style: styles.inputContainer, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\u2709" }), jsxRuntime.jsx("input", { type: "email", style: styles.input, placeholder: "Enter your email", value: email, onChange: (e) => setEmail(e.target.value), autoCapitalize: "none", autoComplete: "email", disabled: isLoading, required: true })] })] }), jsxRuntime.jsx("button", { type: "submit", style: {
                                        ...styles.button,
                                        opacity: isLoading ? 0.8 : 1,
                                        cursor: isLoading ? 'not-allowed' : 'pointer'
                                    }, disabled: isLoading, children: isLoading ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx("span", { style: { animation: 'spin 1s linear infinite' }, children: "\u27F3" }), "Sending..."] })) : ('Send Reset Instructions') })] })] }));
            case 'sent':
                return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs("div", { style: styles.logoSection, children: [jsxRuntime.jsx("h1", { style: styles.title, children: "Check Your Email" }), jsxRuntime.jsxs("p", { style: styles.subtitle, children: ["We've sent password reset instructions to ", email] })] }), jsxRuntime.jsxs("div", { style: styles.successContainer, children: [jsxRuntime.jsx("span", { style: { color: '#22c55e', fontSize: '20px' }, children: "\u2713" }), jsxRuntime.jsx("span", { style: styles.successText, children: "Reset instructions sent successfully" })] }), jsxRuntime.jsx("p", { style: { fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '24px' }, children: "Didn't receive the email? Check your spam folder or try again." })] }));
            case 'reset':
                return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs("div", { style: styles.logoSection, children: [jsxRuntime.jsx("h1", { style: styles.title, children: "Set New Password" }), jsxRuntime.jsx("p", { style: styles.subtitle, children: "Enter your new password below" })] }), jsxRuntime.jsxs("form", { onSubmit: handleResetPassword, children: [error && (jsxRuntime.jsxs("div", { style: styles.errorContainer, children: [jsxRuntime.jsx("span", { style: { color: '#ff4757', fontSize: '20px' }, children: "\u26A0" }), jsxRuntime.jsx("span", { style: styles.errorText, children: error })] })), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "New Password" }), jsxRuntime.jsxs("div", { style: styles.inputContainer, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\uD83D\uDD12" }), jsxRuntime.jsx("input", { type: showPassword ? 'text' : 'password', style: styles.input, placeholder: "Enter new password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), autoComplete: "new-password", disabled: isLoading, required: true }), jsxRuntime.jsx("button", { type: "button", style: styles.eyeButton, onClick: () => setShowPassword(!showPassword), disabled: isLoading, children: showPassword ? '👁' : '👁‍🗨' })] })] }), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "Confirm Password" }), jsxRuntime.jsxs("div", { style: styles.inputContainer, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\uD83D\uDD12" }), jsxRuntime.jsx("input", { type: showConfirmPassword ? 'text' : 'password', style: styles.input, placeholder: "Confirm new password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), autoComplete: "new-password", disabled: isLoading, required: true }), jsxRuntime.jsx("button", { type: "button", style: styles.eyeButton, onClick: () => setShowConfirmPassword(!showConfirmPassword), disabled: isLoading, children: showConfirmPassword ? '👁' : '👁‍🗨' })] })] }), jsxRuntime.jsx("button", { type: "submit", style: {
                                        ...styles.button,
                                        opacity: isLoading ? 0.8 : 1,
                                        cursor: isLoading ? 'not-allowed' : 'pointer'
                                    }, disabled: isLoading, children: isLoading ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx("span", { style: { animation: 'spin 1s linear infinite' }, children: "\u27F3" }), "Resetting..."] })) : ('Reset Password') })] })] }));
            case 'success':
                return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs("div", { style: styles.logoSection, children: [jsxRuntime.jsx("h1", { style: styles.title, children: "Password Reset" }), jsxRuntime.jsx("p", { style: styles.subtitle, children: "Your password has been successfully reset" })] }), jsxRuntime.jsxs("div", { style: styles.successContainer, children: [jsxRuntime.jsx("span", { style: { color: '#22c55e', fontSize: '20px' }, children: "\u2713" }), jsxRuntime.jsx("span", { style: styles.successText, children: "Password reset successfully" })] })] }));
            default:
                return null;
        }
    };
    return (jsxRuntime.jsxs("div", { className: className, style: styles.container, children: [renderStep(), jsxRuntime.jsx("button", { type: "button", style: styles.linkButton, onClick: onBackToLogin, disabled: isLoading, children: "Back to Login" }), jsxRuntime.jsx("style", { children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` })] }));
}

/**
 * Professional account creation form component
 */
function AccountCreationForm({ config = {}, onSuccess, onError, onBackToLogin }) {
    // Configuration with defaults
    const { primaryColor = process.env.REACT_APP_PRIMARY_COLOR || '#006aff', appName = process.env.REACT_APP_NAME || 'Pubflow', logo = process.env.REACT_APP_LOGO, apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '', className = '', requiredFields = ['name', 'lastName', 'email', 'password'] } = config;
    // Form state
    const [step, setStep] = React.useState('form');
    const [formData, setFormData] = React.useState({
        name: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [isLoading, setIsLoading] = React.useState(false);
    // Update form field
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };
    // Validate form
    const validateForm = () => {
        const newErrors = {};
        if (requiredFields.includes('name') && !formData.name.trim()) {
            newErrors.name = 'First name is required';
        }
        if (requiredFields.includes('lastName') && !formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        if (requiredFields.includes('email')) {
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            }
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }
        if (requiredFields.includes('password')) {
            if (!formData.password.trim()) {
                newErrors.password = 'Password is required';
            }
            else if (formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${apiBaseUrl}/auth/register/public`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.toLowerCase().trim(),
                    password: formData.password,
                    name: formData.name.trim(),
                    lastName: formData.lastName.trim(),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error creating account');
            }
            // Success - show confirmation
            setStep('success');
            if (onSuccess) {
                onSuccess();
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error creating account';
            if (onError) {
                onError(errorMessage);
            }
            // Set specific field errors if available
            if (errorMessage.toLowerCase().includes('email')) {
                setErrors({ email: errorMessage });
            }
            else {
                setErrors({ general: errorMessage });
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    // Dynamic styles
    const styles = {
        container: {
            maxWidth: '400px',
            margin: '0 auto',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f0f0f0'
        },
        logoSection: {
            textAlign: 'center',
            marginBottom: '32px'
        },
        logo: {
            maxWidth: '320px',
            height: '80px',
            marginBottom: '20px'
        },
        title: {
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '8px',
            letterSpacing: '-0.5px'
        },
        subtitle: {
            fontSize: '16px',
            color: '#666666',
            fontWeight: '400',
            marginBottom: '24px'
        },
        inputGroup: {
            marginBottom: '20px'
        },
        inputLabel: {
            fontSize: '15px',
            fontWeight: '600',
            color: '#333333',
            marginBottom: '8px',
            letterSpacing: '-0.2px',
            display: 'block'
        },
        inputContainer: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            border: '1px solid #e9ecef',
            padding: '0 16px',
            height: '56px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        },
        inputError: {
            borderColor: '#dc2626'
        },
        input: {
            flex: 1,
            fontSize: '16px',
            color: '#333333',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontWeight: '400'
        },
        eyeButton: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            marginLeft: '8px',
            color: '#666'
        },
        button: {
            width: '100%',
            borderRadius: '16px',
            height: '56px',
            backgroundColor: primaryColor,
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            marginTop: '8px',
            boxShadow: `0 4px 12px ${primaryColor}40`,
            letterSpacing: '-0.2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        },
        errorText: {
            color: '#dc2626',
            fontSize: '12px',
            marginTop: '4px',
            fontWeight: '500'
        },
        successContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f0fdf4',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #bbf7d0'
        },
        successText: {
            color: '#166534',
            fontSize: '14px',
            marginLeft: '8px',
            fontWeight: '500'
        },
        linkButton: {
            background: 'none',
            border: 'none',
            color: primaryColor,
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
            padding: '12px',
            textAlign: 'center',
            width: '100%',
            marginTop: '16px'
        }
    };
    const renderStep = () => {
        switch (step) {
            case 'form':
                return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs("div", { style: styles.logoSection, children: [logo && (typeof logo === 'string' ? (jsxRuntime.jsx("img", { src: logo, alt: `${appName} Logo`, style: styles.logo })) : (logo)), jsxRuntime.jsx("h1", { style: styles.title, children: "Create Account" }), jsxRuntime.jsxs("p", { style: styles.subtitle, children: ["Join ", appName, " today"] })] }), jsxRuntime.jsxs("form", { onSubmit: handleSubmit, children: [errors.general && (jsxRuntime.jsxs("div", { style: { ...styles.successContainer, backgroundColor: '#fef2f2', borderColor: '#fecaca' }, children: [jsxRuntime.jsx("span", { style: { color: '#ff4757', fontSize: '20px' }, children: "\u26A0" }), jsxRuntime.jsx("span", { style: { ...styles.successText, color: '#dc2626' }, children: errors.general })] })), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "First Name *" }), jsxRuntime.jsxs("div", { style: { ...styles.inputContainer, ...(errors.name ? styles.inputError : {}) }, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\uD83D\uDC64" }), jsxRuntime.jsx("input", { type: "text", style: styles.input, placeholder: "Enter your first name", value: formData.name, onChange: (e) => updateField('name', e.target.value), autoComplete: "given-name", disabled: isLoading, required: true })] }), errors.name && jsxRuntime.jsx("div", { style: styles.errorText, children: errors.name })] }), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "Last Name *" }), jsxRuntime.jsxs("div", { style: { ...styles.inputContainer, ...(errors.lastName ? styles.inputError : {}) }, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\uD83D\uDC64" }), jsxRuntime.jsx("input", { type: "text", style: styles.input, placeholder: "Enter your last name", value: formData.lastName, onChange: (e) => updateField('lastName', e.target.value), autoComplete: "family-name", disabled: isLoading, required: true })] }), errors.lastName && jsxRuntime.jsx("div", { style: styles.errorText, children: errors.lastName })] }), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "Email Address *" }), jsxRuntime.jsxs("div", { style: { ...styles.inputContainer, ...(errors.email ? styles.inputError : {}) }, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\u2709" }), jsxRuntime.jsx("input", { type: "email", style: styles.input, placeholder: "Enter your email", value: formData.email, onChange: (e) => updateField('email', e.target.value), autoCapitalize: "none", autoComplete: "email", disabled: isLoading, required: true })] }), errors.email && jsxRuntime.jsx("div", { style: styles.errorText, children: errors.email })] }), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "Password *" }), jsxRuntime.jsxs("div", { style: { ...styles.inputContainer, ...(errors.password ? styles.inputError : {}) }, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\uD83D\uDD12" }), jsxRuntime.jsx("input", { type: showPassword ? 'text' : 'password', style: styles.input, placeholder: "Create a password", value: formData.password, onChange: (e) => updateField('password', e.target.value), autoComplete: "new-password", disabled: isLoading, required: true }), jsxRuntime.jsx("button", { type: "button", style: styles.eyeButton, onClick: () => setShowPassword(!showPassword), disabled: isLoading, children: showPassword ? '👁' : '👁‍🗨' })] }), errors.password && jsxRuntime.jsx("div", { style: styles.errorText, children: errors.password })] }), jsxRuntime.jsxs("div", { style: styles.inputGroup, children: [jsxRuntime.jsx("label", { style: styles.inputLabel, children: "Confirm Password *" }), jsxRuntime.jsxs("div", { style: { ...styles.inputContainer, ...(errors.confirmPassword ? styles.inputError : {}) }, children: [jsxRuntime.jsx("span", { style: { marginRight: '12px', opacity: 0.7, color: '#666' }, children: "\uD83D\uDD12" }), jsxRuntime.jsx("input", { type: showConfirmPassword ? 'text' : 'password', style: styles.input, placeholder: "Confirm your password", value: formData.confirmPassword, onChange: (e) => updateField('confirmPassword', e.target.value), autoComplete: "new-password", disabled: isLoading, required: true }), jsxRuntime.jsx("button", { type: "button", style: styles.eyeButton, onClick: () => setShowConfirmPassword(!showConfirmPassword), disabled: isLoading, children: showConfirmPassword ? '👁' : '👁‍🗨' })] }), errors.confirmPassword && jsxRuntime.jsx("div", { style: styles.errorText, children: errors.confirmPassword })] }), jsxRuntime.jsx("button", { type: "submit", style: {
                                        ...styles.button,
                                        opacity: isLoading ? 0.8 : 1,
                                        cursor: isLoading ? 'not-allowed' : 'pointer'
                                    }, disabled: isLoading, children: isLoading ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx("span", { style: { animation: 'spin 1s linear infinite' }, children: "\u27F3" }), "Creating Account..."] })) : ('Create Account') })] })] }));
            case 'success':
                return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs("div", { style: styles.logoSection, children: [jsxRuntime.jsx("h1", { style: styles.title, children: "Account Created" }), jsxRuntime.jsxs("p", { style: styles.subtitle, children: ["Welcome to ", appName, "!"] })] }), jsxRuntime.jsxs("div", { style: styles.successContainer, children: [jsxRuntime.jsx("span", { style: { color: '#22c55e', fontSize: '20px' }, children: "\u2713" }), jsxRuntime.jsx("span", { style: styles.successText, children: "Your account has been created successfully" })] }), jsxRuntime.jsx("p", { style: { fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '24px' }, children: "You can now sign in with your new account." })] }));
            default:
                return null;
        }
    };
    return (jsxRuntime.jsxs("div", { className: className, style: styles.container, children: [renderStep(), jsxRuntime.jsx("button", { type: "button", style: styles.linkButton, onClick: onBackToLogin, disabled: isLoading, children: "Back to Login" }), jsxRuntime.jsx("style", { children: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` })] }));
}

/**
 * Default theme configuration
 */
const defaultTheme = {
    primaryColor: process.env.REACT_APP_PRIMARY_COLOR || '#006aff',
    secondaryColor: process.env.REACT_APP_SECONDARY_COLOR || '#4a90e2',
    appName: process.env.REACT_APP_NAME || 'Pubflow',
    logo: process.env.REACT_APP_LOGO,
    successColor: '#22c55e',
    errorColor: '#dc2626',
    warningColor: '#f59e0b',
    backgroundColor: '#ffffff',
    surfaceColor: '#f8f9fa',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
    borderColor: '#e9ecef',
    borderColorFocus: '#006aff',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    fontFamily: process.env.REACT_APP_FONT_FAMILY || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    borderRadius: {
        small: '8px',
        medium: '12px',
        large: '16px'
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
    }
};
/**
 * Theme context
 */
const ThemeContext = React.createContext(defaultTheme);
/**
 * Theme provider component
 */
function ThemeProvider({ children, theme = {} }) {
    const mergedTheme = {
        ...defaultTheme,
        ...theme,
        borderRadius: {
            ...defaultTheme.borderRadius,
            ...theme.borderRadius
        },
        spacing: {
            ...defaultTheme.spacing,
            ...theme.spacing
        }
    };
    return (jsxRuntime.jsx(ThemeContext.Provider, { value: mergedTheme, children: children }));
}
/**
 * Hook to use theme
 */
function useTheme() {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
/**
 * Generate CSS variables from theme
 */
function generateCSSVariables(theme) {
    return {
        '--pubflow-primary-color': theme.primaryColor,
        '--pubflow-secondary-color': theme.secondaryColor,
        '--pubflow-success-color': theme.successColor,
        '--pubflow-error-color': theme.errorColor,
        '--pubflow-warning-color': theme.warningColor,
        '--pubflow-background-color': theme.backgroundColor,
        '--pubflow-surface-color': theme.surfaceColor,
        '--pubflow-text-primary': theme.textPrimary,
        '--pubflow-text-secondary': theme.textSecondary,
        '--pubflow-text-muted': theme.textMuted,
        '--pubflow-border-color': theme.borderColor,
        '--pubflow-border-color-focus': theme.borderColorFocus,
        '--pubflow-shadow-color': theme.shadowColor,
        '--pubflow-font-family': theme.fontFamily,
        '--pubflow-border-radius-small': theme.borderRadius.small,
        '--pubflow-border-radius-medium': theme.borderRadius.medium,
        '--pubflow-border-radius-large': theme.borderRadius.large,
        '--pubflow-spacing-xs': theme.spacing.xs,
        '--pubflow-spacing-sm': theme.spacing.sm,
        '--pubflow-spacing-md': theme.spacing.md,
        '--pubflow-spacing-lg': theme.spacing.lg,
        '--pubflow-spacing-xl': theme.spacing.xl
    };
}
/**
 * CSS-in-JS style generator
 */
function createStyles(theme) {
    return {
        // Container styles
        container: {
            maxWidth: '400px',
            margin: '0 auto',
            padding: theme.spacing.lg,
            backgroundColor: theme.backgroundColor,
            borderRadius: theme.borderRadius.large,
            boxShadow: `0 8px 24px ${theme.shadowColor}`,
            border: `1px solid ${theme.borderColor}`,
            fontFamily: theme.fontFamily
        },
        // Logo section
        logoSection: {
            textAlign: 'center',
            marginBottom: theme.spacing.xl
        },
        logo: {
            maxWidth: '320px',
            height: '80px',
            marginBottom: theme.spacing.lg
        },
        // Typography
        title: {
            fontSize: '28px',
            fontWeight: '700',
            color: theme.textPrimary,
            marginBottom: theme.spacing.sm,
            letterSpacing: '-0.5px'
        },
        subtitle: {
            fontSize: '16px',
            color: theme.textSecondary,
            fontWeight: '400',
            marginBottom: theme.spacing.lg
        },
        // Form elements
        inputGroup: {
            marginBottom: theme.spacing.lg
        },
        inputLabel: {
            fontSize: '15px',
            fontWeight: '600',
            color: theme.textPrimary,
            marginBottom: theme.spacing.sm,
            letterSpacing: '-0.2px',
            display: 'block'
        },
        inputContainer: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme.surfaceColor,
            borderRadius: theme.borderRadius.large,
            border: `1px solid ${theme.borderColor}`,
            padding: `0 ${theme.spacing.md}`,
            height: '56px',
            boxShadow: `0 2px 8px ${theme.shadowColor}`,
            transition: 'border-color 0.2s ease'
        },
        inputContainerFocus: {
            borderColor: theme.borderColorFocus
        },
        input: {
            flex: 1,
            fontSize: '16px',
            color: theme.textPrimary,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontWeight: '400'
        },
        // Buttons
        button: {
            width: '100%',
            borderRadius: theme.borderRadius.large,
            height: '56px',
            backgroundColor: theme.primaryColor,
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            marginTop: theme.spacing.sm,
            boxShadow: `0 4px 12px ${theme.primaryColor}40`,
            letterSpacing: '-0.2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            transition: 'all 0.2s ease'
        },
        buttonSecondary: {
            backgroundColor: theme.secondaryColor,
            boxShadow: `0 4px 12px ${theme.secondaryColor}40`
        },
        buttonDisabled: {
            opacity: 0.6,
            cursor: 'not-allowed'
        },
        linkButton: {
            background: 'none',
            border: 'none',
            color: theme.primaryColor,
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
            padding: theme.spacing.md,
            textAlign: 'center'
        },
        // Alert styles
        errorContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fef2f2',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.medium,
            marginBottom: theme.spacing.lg,
            border: '1px solid #fecaca'
        },
        successContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f0fdf4',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.medium,
            marginBottom: theme.spacing.lg,
            border: '1px solid #bbf7d0'
        },
        warningContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fffbeb',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.medium,
            marginBottom: theme.spacing.lg,
            border: '1px solid #fed7aa'
        },
        errorText: {
            color: theme.errorColor,
            fontSize: '14px',
            marginLeft: theme.spacing.sm,
            fontWeight: '500'
        },
        successText: {
            color: theme.successColor,
            fontSize: '14px',
            marginLeft: theme.spacing.sm,
            fontWeight: '500'
        },
        warningText: {
            color: theme.warningColor,
            fontSize: '14px',
            marginLeft: theme.spacing.sm,
            fontWeight: '500'
        }
    };
}

/**
 * Bridge API Raw Hook for React
 *
 * Provides raw API access for custom operations
 */
/**
 * Hook for raw Bridge API access
 *
 * @param instanceId Pubflow instance ID
 * @returns Raw API hook result
 */
function useBridgeApiRaw(instanceId) {
    const context = React.useContext(PubflowContext);
    if (!context) {
        throw new Error('useBridgeApiRaw must be used within a PubflowProvider');
    }
    const instance = instanceId || context.defaultInstance;
    const pubflowInstance = context.instances[instance];
    if (!pubflowInstance) {
        throw new Error(`Pubflow instance '${instance}' not found`);
    }
    const { apiClient } = pubflowInstance;
    // Make raw API request
    const request = async (endpoint, options = {}) => {
        const { method = 'GET', headers = {}, body, includeSession = true, timeout } = options;
        try {
            const response = await apiClient.request(endpoint, method, body, {
                headers,
                includeSession,
                timeout
            });
            return {
                data: response.data,
                status: 200, // ApiClient doesn't expose status, assume success
                headers: {}, // ApiClient doesn't expose headers
                success: response.success,
                error: response.error
            };
        }
        catch (error) {
            return {
                data: null,
                status: 500,
                headers: {},
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };
    // GET request shorthand
    const get = async (endpoint, options = {}) => {
        return request(endpoint, { ...options, method: 'GET' });
    };
    // POST request shorthand
    const post = async (endpoint, body, options = {}) => {
        return request(endpoint, { ...options, method: 'POST', body });
    };
    // PUT request shorthand
    const put = async (endpoint, body, options = {}) => {
        return request(endpoint, { ...options, method: 'PUT', body });
    };
    // DELETE request shorthand
    const deleteRequest = async (endpoint, options = {}) => {
        return request(endpoint, { ...options, method: 'DELETE' });
    };
    // PATCH request shorthand
    const patch = async (endpoint, body, options = {}) => {
        return request(endpoint, { ...options, method: 'PATCH', body });
    };
    return {
        request,
        get,
        post,
        put,
        delete: deleteRequest,
        patch
    };
}

/**
 * Server Authentication Hook for React
 *
 * Provides a hook for handling authentication with automatic redirects
 */
/**
 * Hook for handling authentication with automatic redirects
 *
 * @param options Hook options
 * @returns Authentication hook result
 */
function useServerAuth({ loginRedirectPath = '/login', allowedTypes = ['authenticated'], validateOnMount = true, instanceId, onRedirect } = {}) {
    const { user, isAuthenticated, isLoading, validateSession } = useAuth(instanceId);
    // Default redirect function
    const defaultRedirect = (path) => {
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const redirectUrl = `${path}?redirect=${encodeURIComponent(currentPath)}`;
            window.location.href = redirectUrl;
        }
    };
    const redirect = onRedirect || defaultRedirect;
    React.useEffect(() => {
        // Validate session on mount if configured
        if (validateOnMount) {
            validateSession().then(({ isValid }) => {
                if (!isValid) {
                    redirect(loginRedirectPath);
                }
            });
        }
    }, [validateOnMount, loginRedirectPath, validateSession, redirect]);
    React.useEffect(() => {
        // Skip if still loading
        if (isLoading) {
            return;
        }
        // Redirect if not authenticated
        if (!isAuthenticated) {
            redirect(loginRedirectPath);
            return;
        }
        // Check user type if allowedTypes doesn't include 'authenticated'
        if (!allowedTypes.includes('authenticated') && user) {
            const userType = user.userType || '';
            const isAllowed = allowedTypes.some(type => type.toLowerCase() === userType.toLowerCase());
            if (!isAllowed) {
                redirect('/access-denied');
            }
        }
    }, [isLoading, isAuthenticated, user, allowedTypes, loginRedirectPath, redirect]);
    return {
        user,
        isAuthenticated,
        isLoading,
        validateSession
    };
}

/**
 * Search Query Builder Hook for React
 *
 * Provides utilities for building complex search queries
 */
/**
 * Hook for building search queries
 *
 * @param fields Available search fields
 * @param initialState Initial query state
 * @returns Search query builder result
 */
function useSearchQueryBuilder(fields, initialState = {}) {
    // Default initial state
    const defaultState = {
        searchTerm: '',
        filters: [],
        page: 1,
        limit: 20,
        ...initialState
    };
    const [queryState, setQueryState] = React.useState(defaultState);
    // Set search term
    const setSearchTerm = React.useCallback((term) => {
        setQueryState(prev => ({
            ...prev,
            searchTerm: term,
            page: 1 // Reset to first page when searching
        }));
    }, []);
    // Add filter
    const addFilter = React.useCallback((filter) => {
        setQueryState(prev => ({
            ...prev,
            filters: [...prev.filters, filter],
            page: 1 // Reset to first page when filtering
        }));
    }, []);
    // Remove filter
    const removeFilter = React.useCallback((index) => {
        setQueryState(prev => ({
            ...prev,
            filters: prev.filters.filter((_, i) => i !== index),
            page: 1
        }));
    }, []);
    // Update filter
    const updateFilter = React.useCallback((index, filter) => {
        setQueryState(prev => ({
            ...prev,
            filters: prev.filters.map((f, i) => i === index ? filter : f),
            page: 1
        }));
    }, []);
    // Clear filters
    const clearFilters = React.useCallback(() => {
        setQueryState(prev => ({
            ...prev,
            filters: [],
            page: 1
        }));
    }, []);
    // Set sort
    const setSort = React.useCallback((field, direction) => {
        setQueryState(prev => ({
            ...prev,
            sortField: field,
            sortDirection: direction,
            page: 1
        }));
    }, []);
    // Clear sort
    const clearSort = React.useCallback(() => {
        setQueryState(prev => ({
            ...prev,
            sortField: undefined,
            sortDirection: undefined
        }));
    }, []);
    // Set page
    const setPage = React.useCallback((page) => {
        setQueryState(prev => ({
            ...prev,
            page
        }));
    }, []);
    // Set limit
    const setLimit = React.useCallback((limit) => {
        setQueryState(prev => ({
            ...prev,
            limit,
            page: 1 // Reset to first page when changing limit
        }));
    }, []);
    // Reset query
    const resetQuery = React.useCallback(() => {
        setQueryState(defaultState);
    }, [defaultState]);
    // Build query string
    const buildQueryString = React.useCallback(() => {
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
    const buildQueryObject = React.useCallback(() => {
        const query = {
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
    const getSearchableFields = React.useCallback(() => {
        return fields.filter(field => field.searchable !== false);
    }, [fields]);
    // Get filterable fields
    const getFilterableFields = React.useCallback(() => {
        return fields.filter(field => field.filterable !== false);
    }, [fields]);
    // Get sortable fields
    const getSortableFields = React.useCallback(() => {
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

/**
 * Authentication Utilities for React
 *
 * Provides utilities for authentication in React applications
 */
/**
 * Hook for requiring authentication
 *
 * @param options Authentication options
 * @returns Authentication result
 */
function useRequireAuth(options = {}) {
    const { allowedTypes = ['authenticated'], redirectTo = '/login', instanceId, redirectFn } = options;
    const { user, isAuthenticated, isLoading } = useAuth(instanceId);
    React.useEffect(() => {
        // Wait for loading to complete
        if (isLoading) {
            return;
        }
        // Check if authenticated
        if (!isAuthenticated) {
            if (redirectFn) {
                redirectFn(redirectTo);
            }
            else if (typeof window !== 'undefined') {
                window.location.href = redirectTo;
            }
            return;
        }
        // Convert allowedTypes to array
        const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
        // Special case: if 'authenticated' is in allowed types, just check if user is authenticated
        if (types.includes('authenticated')) {
            return;
        }
        // Check if user type is allowed
        const userType = (user === null || user === void 0 ? void 0 : user.userType) || '';
        const isAllowed = types.some(type => type.toLowerCase() === userType.toLowerCase());
        if (!isAllowed) {
            if (redirectFn) {
                redirectFn('/access-denied');
            }
            else if (typeof window !== 'undefined') {
                window.location.href = '/access-denied';
            }
        }
    }, [isLoading, isAuthenticated, user, allowedTypes, redirectTo, redirectFn]);
    return {
        user,
        isAuthenticated,
        isLoading
    };
}

exports.AccountCreationForm = AccountCreationForm;
exports.AdvancedFilter = AdvancedFilter;
exports.BridgeForm = BridgeForm;
exports.BridgeList = BridgeList;
exports.BridgeTable = BridgeTable;
exports.BridgeView = BridgeView;
exports.BrowserStorageAdapter = BrowserStorageAdapter;
exports.LoginForm = LoginForm;
exports.OfflineIndicator = OfflineIndicator;
exports.PasswordResetForm = PasswordResetForm;
exports.PubflowContext = PubflowContext;
exports.PubflowProvider = PubflowProvider;
exports.ThemeProvider = ThemeProvider;
exports.createStyles = createStyles;
exports.generateCSSVariables = generateCSSVariables;
exports.useAuth = useAuth;
exports.useBridgeApi = useBridgeApi;
exports.useBridgeApiRaw = useBridgeApiRaw;
exports.useBridgeCrud = useBridgeCrud;
exports.useBridgeMutation = useBridgeMutation;
exports.useBridgeQuery = useBridgeQuery;
exports.useNetworkStatus = useNetworkStatus;
exports.useRequireAuth = useRequireAuth;
exports.useSearchQueryBuilder = useSearchQueryBuilder;
exports.useServerAuth = useServerAuth;
exports.useTheme = useTheme;
Object.keys(core).forEach(function (k) {
    if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
        enumerable: true,
        get: function () { return core[k]; }
    });
});
//# sourceMappingURL=index.js.map
