/**
 * Pubflow Provider for React
 *
 * Provides a context provider for Pubflow in React applications
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { SWRConfig } from 'swr';
import {
  initConfig,
  getConfig,
  PubflowInstanceConfig,
  ApiClient,
  AuthService,
  User
} from '@pubflow/core';
import { BrowserStorageAdapter } from '../storage/BrowserStorageAdapter';

/**
 * Pubflow context value
 */
export interface PubflowContextValue {
  instances: Record<string, PubflowInstance>;
  defaultInstance: string;
}

/**
 * Pubflow instance
 */
export interface PubflowInstance {
  config: PubflowInstanceConfig;
  apiClient: ApiClient;
  authService: AuthService;
  user: User | null | undefined;  // Allow undefined to fix type issues
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email?: string; userName?: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  validateSession: () => Promise<{ isValid: boolean; expiresAt?: string; user?: User }>;
}

/**
 * Create Pubflow context
 */
export const PubflowContext = createContext<PubflowContextValue>({
  instances: {},
  defaultInstance: 'default'
});

/**
 * Persistent cache configuration
 */
export interface PersistentCacheConfig {
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
export interface PubflowProviderProps {
  children: React.ReactNode;
  config?: PubflowInstanceConfig;
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
export function PubflowProvider({
  children,
  config,
  instances,
  defaultInstance = 'default',
  onSessionExpired,
  onSessionRefreshed,
  showSessionAlerts = false,
  persistentCache = { enabled: false },
  loginRedirectPath = '/login',
  publicPaths = ['/login', '/register', '/forgot-password'],
  enableDebugTools = false,
  theme = {}
}: PubflowProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [contextValue, setContextValue] = useState<PubflowContextValue>({
    instances: {},
    defaultInstance
  });

  // Configure debug tools
  useEffect(() => {
    if (enableDebugTools) {
      console.log('Pubflow debug tools enabled');

      // Add debug utilities to window object
      if (typeof window !== 'undefined') {
        (window as any).pubflowDebug = {
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
  const handleSessionExpired = useCallback(() => {
    if (showSessionAlerts) {
      alert('Your session has expired. Please log in again.');
    }

    if (onSessionExpired) {
      onSessionExpired();
    }
  }, [onSessionExpired, showSessionAlerts]);

  // Handle session refresh
  const handleSessionRefreshed = useCallback(() => {
    if (showSessionAlerts) {
      alert('Your session has been refreshed.');
    }

    if (onSessionRefreshed) {
      onSessionRefreshed();
    }
  }, [onSessionRefreshed, showSessionAlerts]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize instances
        const instancesMap: Record<string, PubflowInstance> = {};

        if (instances && instances.length > 0) {
          // Initialize multiple instances
          for (const instanceConfig of instances) {
            // Initialize configuration
            const fullConfig = initConfig({
              ...instanceConfig,
              sessionConfig: {
                ...instanceConfig.sessionConfig,
                onSessionExpired: handleSessionExpired,
                onSessionRefreshed: handleSessionRefreshed
              }
            }, instanceConfig.id);

            // Create storage adapter
            const storage = new BrowserStorageAdapter({
              prefix: fullConfig.storageConfig?.prefix
            });

            // Create API client
            const apiClient = new ApiClient(fullConfig, storage);

            // Create auth service
            const authService = new AuthService(apiClient, storage, fullConfig);

            // Get current user
            let user = null;
            let isAuthenticated = false;

            try {
              user = await authService.getCurrentUser();
              isAuthenticated = !!user;
            } catch (error) {
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
        } else if (config) {
          // Initialize single instance
          // Initialize configuration
          const fullConfig = initConfig({
            ...config,
            sessionConfig: {
              ...config.sessionConfig,
              onSessionExpired: handleSessionExpired,
              onSessionRefreshed: handleSessionRefreshed
            }
          }, defaultInstance);

          // Create storage adapter
          const storage = new BrowserStorageAdapter({
            prefix: fullConfig.storageConfig?.prefix
          });

          // Create API client
          const apiClient = new ApiClient(fullConfig, storage);

          // Create auth service
          const authService = new AuthService(apiClient, storage, fullConfig);

          // Get current user
          let user = null;
          let isAuthenticated = false;

          try {
            user = await authService.getCurrentUser();
            isAuthenticated = !!user;
          } catch (error) {
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
      } catch (error) {
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
    return (
      <SWRConfig value={{ provider: persistentCache.provider }}>
        <PubflowContext.Provider value={contextValue}>
          {children}
        </PubflowContext.Provider>
      </SWRConfig>
    );
  }

  // Otherwise, just use the regular provider
  return (
    <PubflowContext.Provider value={contextValue}>
      {children}
    </PubflowContext.Provider>
  );
}
