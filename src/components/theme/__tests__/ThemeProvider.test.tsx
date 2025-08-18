/**
 * ThemeProvider Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, useTheme, generateCSSVariables, createStyles } from '../ThemeProvider';

// Test component that uses the theme
const TestComponent = () => {
  const theme = useTheme();
  return (
    <div data-testid="theme-consumer">
      <span data-testid="primary-color">{theme.primaryColor}</span>
      <span data-testid="app-name">{theme.appName}</span>
      <span data-testid="font-family">{theme.fontFamily}</span>
    </div>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.REACT_APP_PRIMARY_COLOR;
    delete process.env.REACT_APP_NAME;
    delete process.env.REACT_APP_FONT_FAMILY;
  });

  it('provides default theme values', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('primary-color')).toHaveTextContent('#006aff');
    expect(screen.getByTestId('app-name')).toHaveTextContent('Pubflow');
    expect(screen.getByTestId('font-family')).toHaveTextContent(
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    );
  });

  it('uses environment variables for default values', () => {
    // Mock environment variables
    process.env.REACT_APP_PRIMARY_COLOR = '#ff0000';
    process.env.REACT_APP_NAME = 'Test App';
    process.env.REACT_APP_FONT_FAMILY = 'Arial, sans-serif';

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('primary-color')).toHaveTextContent('#ff0000');
    expect(screen.getByTestId('app-name')).toHaveTextContent('Test App');
    expect(screen.getByTestId('font-family')).toHaveTextContent('Arial, sans-serif');
  });

  it('allows theme override through props', () => {
    const customTheme = {
      primaryColor: '#00ff00',
      appName: 'Custom App',
      fontFamily: 'Comic Sans MS'
    };

    render(
      <ThemeProvider theme={customTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('primary-color')).toHaveTextContent('#00ff00');
    expect(screen.getByTestId('app-name')).toHaveTextContent('Custom App');
    expect(screen.getByTestId('font-family')).toHaveTextContent('Comic Sans MS');
  });

  it('merges custom theme with defaults', () => {
    const partialTheme = {
      primaryColor: '#purple'
    };

    render(
      <ThemeProvider theme={partialTheme}>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('primary-color')).toHaveTextContent('#purple');
    expect(screen.getByTestId('app-name')).toHaveTextContent('Pubflow'); // Default value
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    console.error = originalError;
  });
});

describe('generateCSSVariables', () => {
  it('generates CSS variables from theme', () => {
    const theme = {
      primaryColor: '#006aff',
      secondaryColor: '#4a90e2',
      appName: 'Test App',
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
      fontFamily: 'Arial, sans-serif',
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

    const cssVars = generateCSSVariables(theme);

    expect(cssVars).toEqual({
      '--pubflow-primary-color': '#006aff',
      '--pubflow-secondary-color': '#4a90e2',
      '--pubflow-success-color': '#22c55e',
      '--pubflow-error-color': '#dc2626',
      '--pubflow-warning-color': '#f59e0b',
      '--pubflow-background-color': '#ffffff',
      '--pubflow-surface-color': '#f8f9fa',
      '--pubflow-text-primary': '#1a1a1a',
      '--pubflow-text-secondary': '#666666',
      '--pubflow-text-muted': '#999999',
      '--pubflow-border-color': '#e9ecef',
      '--pubflow-border-color-focus': '#006aff',
      '--pubflow-shadow-color': 'rgba(0, 0, 0, 0.1)',
      '--pubflow-font-family': 'Arial, sans-serif',
      '--pubflow-border-radius-small': '8px',
      '--pubflow-border-radius-medium': '12px',
      '--pubflow-border-radius-large': '16px',
      '--pubflow-spacing-xs': '4px',
      '--pubflow-spacing-sm': '8px',
      '--pubflow-spacing-md': '16px',
      '--pubflow-spacing-lg': '24px',
      '--pubflow-spacing-xl': '32px'
    });
  });
});

describe('createStyles', () => {
  it('creates style objects from theme', () => {
    const theme = {
      primaryColor: '#006aff',
      secondaryColor: '#4a90e2',
      appName: 'Test App',
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
      fontFamily: 'Arial, sans-serif',
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

    const styles = createStyles(theme);

    expect(styles.container).toEqual({
      maxWidth: '400px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e9ecef',
      fontFamily: 'Arial, sans-serif'
    });

    expect(styles.button).toEqual({
      width: '100%',
      borderRadius: '16px',
      height: '56px',
      backgroundColor: '#006aff',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      marginTop: '8px',
      boxShadow: '0 4px 12px #006aff40',
      letterSpacing: '-0.2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease'
    });

    expect(styles.errorContainer).toEqual({
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#fef2f2',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '24px',
      border: '1px solid #fecaca'
    });
  });

  it('uses theme colors in button styles', () => {
    const theme = {
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      appName: 'Test App',
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
      fontFamily: 'Arial, sans-serif',
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

    const styles = createStyles(theme);

    expect(styles.button.backgroundColor).toBe('#ff0000');
    expect(styles.button.boxShadow).toBe('0 4px 12px #ff000040');
    expect(styles.buttonSecondary.backgroundColor).toBe('#00ff00');
    expect(styles.buttonSecondary.boxShadow).toBe('0 4px 12px #00ff0040');
  });
});
