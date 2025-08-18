/**
 * Theme Provider for React
 * 
 * Provides dynamic styling system based on environment variables
 */

import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
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
 * Default theme configuration
 */
const defaultTheme: ThemeConfig = {
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
const ThemeContext = createContext<ThemeConfig>(defaultTheme);

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
  children: ReactNode;
  theme?: Partial<ThemeConfig>;
}

/**
 * Theme provider component
 */
export function ThemeProvider({ children, theme = {} }: ThemeProviderProps) {
  const mergedTheme: ThemeConfig = {
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
  
  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to use theme
 */
export function useTheme(): ThemeConfig {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Generate CSS variables from theme
 */
export function generateCSSVariables(theme: ThemeConfig): Record<string, string> {
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
export function createStyles(theme: ThemeConfig) {
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
      textAlign: 'center' as const,
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
      position: 'relative' as const,
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
      textAlign: 'center' as const
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
