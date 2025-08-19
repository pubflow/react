/**
 * Pubflow Provider for React
 *
 * Provides a context provider for Pubflow in React applications
 * Following the same pattern as Next.js and React Native packages
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
 * Pubflow provider props
 */
export interface PubflowProviderProps {
  children: React.ReactNode;
  config?: PubflowInstanceConfig;
  instances?: PubflowInstanceConfig[];
  defaultInstance?: string;
  enableDebugTools?: boolean;
  showSessionAlerts?: boolean;
  persistentCache?: {
    enabled: boolean;
    maxAge?: number;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    appName?: string;
    logo?: string;
  };
  loginRedirectPath?: string;
  publicPaths?: string[];
}

/**
 * Pubflow Provider Component
 */
export function PubflowProvider({
  children,
  config,
  instances,
  defaultInstance = 'default',
  enableDebugTools = false,
  showSessionAlerts = false,
  persistentCache = { enabled: false },
  theme = {},
  loginRedirectPath = '/login',
  publicPaths = []
}: PubflowProviderProps) {
  const [contextValue, setContextValue] = useState<PubflowContextValue>({
    instances: {},
    defaultInstance
  });

  // Session handlers
  const handleSessionExpired = useCallback(() => {
    if (showSessionAlerts && typeof window !== 'undefined') {
      console.warn('Session expired');
    }
  }, [showSessionAlerts]);

  const handleSessionRefreshed = useCallback(() => {
    if (showSessionAlerts && typeof window !== 'undefined') {
      console.log('Session refreshed');
    }
  }, [showSessionAlerts]);

  // Initialize instances
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const instancesMap: Record<string, PubflowInstance> = {};

        if (instances && instances.length > 0) {
          // Initialize multiple instances
          for (const instanceConfig of instances) {
            if (!isMounted) return;

            const fullConfig = initConfig({
              ...instanceConfig,
              sessionConfig: {
                ...instanceConfig.sessionConfig,
                onSessionExpired: handleSessionExpired,
                onSessionRefreshed: handleSessionRefreshed
              }
            }, instanceConfig.id);

            const storage = new BrowserStorageAdapter({
              prefix: fullConfig.storageConfig?.prefix
            });

            const apiClient = new ApiClient(fullConfig, storage);
            const authService = new AuthService(apiClient, storage, fullConfig);

            // Get current user (non-blocking)
            let user = null;
            let isAuthenticated = false;

            instancesMap[instanceConfig.id] = {
              config: fullConfig,
              apiClient,
              authService,
              user,
              isAuthenticated,
              isLoading: true,
              login: async (credentials) => {
                const result = await authService.login(credentials);
                if (result.success && result.user && isMounted) {
                  setContextValue(prev => ({
                    ...prev,
                    instances: {
                      ...prev.instances,
                      [instanceConfig.id]: {
                        ...prev.instances[instanceConfig.id],
                        user: result.user,
                        isAuthenticated: true,
                        isLoading: false
                      }
                    }
                  }));
                }
                return result;
              },
              logout: async () => {
                await authService.logout();
                if (isMounted) {
                  setContextValue(prev => ({
                    ...prev,
                    instances: {
                      ...prev.instances,
                      [instanceConfig.id]: {
                        ...prev.instances[instanceConfig.id],
                        user: null,
                        isAuthenticated: false,
                        isLoading: false
                      }
                    }
                  }));
                }
              },
              validateSession: async () => {
                const result = await authService.validateSession();
                if (isMounted) {
                  setContextValue(prev => ({
                    ...prev,
                    instances: {
                      ...prev.instances,
                      [instanceConfig.id]: {
                        ...prev.instances[instanceConfig.id],
                        user: result.user || null,
                        isAuthenticated: result.isValid,
                        isLoading: false
                      }
                    }
                  }));
                }
                return result;
              }
            };

            // Load user asynchronously
            authService.getCurrentUser().then(currentUser => {
              if (isMounted) {
                setContextValue(prev => ({
                  ...prev,
                  instances: {
                    ...prev.instances,
                    [instanceConfig.id]: {
                      ...prev.instances[instanceConfig.id],
                      user: currentUser,
                      isAuthenticated: !!currentUser,
                      isLoading: false
                    }
                  }
                }));
              }
            }).catch(() => {
              if (isMounted) {
                setContextValue(prev => ({
                  ...prev,
                  instances: {
                    ...prev.instances,
                    [instanceConfig.id]: {
                      ...prev.instances[instanceConfig.id],
                      isLoading: false
                    }
                  }
                }));
              }
            });
          }
        } else if (config) {
          // Single instance mode (simplified)
          const fullConfig = initConfig({
            ...config,
            sessionConfig: {
              ...config.sessionConfig,
              onSessionExpired: handleSessionExpired,
              onSessionRefreshed: handleSessionRefreshed
            }
          }, config.id || defaultInstance);

          const storage = new BrowserStorageAdapter({
            prefix: fullConfig.storageConfig?.prefix
          });

          const apiClient = new ApiClient(fullConfig, storage);
          const authService = new AuthService(apiClient, storage, fullConfig);

          instancesMap[defaultInstance] = {
            config: fullConfig,
            apiClient,
            authService,
            user: null,
            isAuthenticated: false,
            isLoading: true,
            login: async (credentials) => {
              const result = await authService.login(credentials);
              if (result.success && result.user && isMounted) {
                setContextValue(prev => ({
                  ...prev,
                  instances: {
                    ...prev.instances,
                    [defaultInstance]: {
                      ...prev.instances[defaultInstance],
                      user: result.user,
                      isAuthenticated: true,
                      isLoading: false
                    }
                  }
                }));
              }
              return result;
            },
            logout: async () => {
              await authService.logout();
              if (isMounted) {
                setContextValue(prev => ({
                  ...prev,
                  instances: {
                    ...prev.instances,
                    [defaultInstance]: {
                      ...prev.instances[defaultInstance],
                      user: null,
                      isAuthenticated: false,
                      isLoading: false
                    }
                  }
                }));
              }
            },
            validateSession: async () => {
              const result = await authService.validateSession();
              if (isMounted) {
                setContextValue(prev => ({
                  ...prev,
                  instances: {
                    ...prev.instances,
                    [defaultInstance]: {
                      ...prev.instances[defaultInstance],
                      user: result.user || null,
                      isAuthenticated: result.isValid,
                      isLoading: false
                    }
                  }
                }));
              }
              return result;
            }
          };

          // Load user asynchronously
          authService.getCurrentUser().then(currentUser => {
            if (isMounted) {
              setContextValue(prev => ({
                ...prev,
                instances: {
                  ...prev.instances,
                  [defaultInstance]: {
                    ...prev.instances[defaultInstance],
                    user: currentUser,
                    isAuthenticated: !!currentUser,
                    isLoading: false
                  }
                }
              }));
            }
          }).catch(() => {
            if (isMounted) {
              setContextValue(prev => ({
                ...prev,
                instances: {
                  ...prev.instances,
                  [defaultInstance]: {
                    ...prev.instances[defaultInstance],
                    isLoading: false
                  }
                }
              }));
            }
          });
        }

        // Only set context value if we have instances to set
        if (isMounted && Object.keys(instancesMap).length > 0) {
          setContextValue({
            instances: instancesMap,
            defaultInstance
          });
        }
      } catch (error) {
        console.error('Error initializing Pubflow:', error);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [config, instances, defaultInstance, handleSessionExpired, handleSessionRefreshed]);

  // Debug tools (simplified)
  useEffect(() => {
    if (enableDebugTools && typeof window !== 'undefined') {
      (window as any).pubflowDebug = {
        getInstances: () => contextValue.instances,
        getDefaultInstance: () => contextValue.defaultInstance
      };
    }
  }, [enableDebugTools]);

  // SWR configuration
  const swrConfig = {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    ...(persistentCache.enabled && {
      provider: () => new Map(),
      isOnline: () => true,
      isVisible: () => true
    })
  };

  return (
    <PubflowContext.Provider value={contextValue}>
      <SWRConfig value={swrConfig}>
        {children}
      </SWRConfig>
    </PubflowContext.Provider>
  );
}