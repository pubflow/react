/**
 * Login Form Component for React
 *
 * Professional login form with dynamic styling based on environment variables
 */
import React from 'react';
/**
 * Login form configuration
 */
export interface LoginFormConfig {
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
export interface LoginFormProps {
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
export declare function LoginForm({ config, onSuccess, onError, onPasswordReset, onAccountCreation, instanceId }: LoginFormProps): import("react/jsx-runtime").JSX.Element;
