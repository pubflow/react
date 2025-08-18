/**
 * Theme Provider for React
 *
 * Provides dynamic styling system based on environment variables
 */
import { ReactNode } from 'react';
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
 * Theme provider props
 */
export interface ThemeProviderProps {
    children: ReactNode;
    theme?: Partial<ThemeConfig>;
}
/**
 * Theme provider component
 */
export declare function ThemeProvider({ children, theme }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to use theme
 */
export declare function useTheme(): ThemeConfig;
/**
 * Generate CSS variables from theme
 */
export declare function generateCSSVariables(theme: ThemeConfig): Record<string, string>;
/**
 * CSS-in-JS style generator
 */
export declare function createStyles(theme: ThemeConfig): {
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
