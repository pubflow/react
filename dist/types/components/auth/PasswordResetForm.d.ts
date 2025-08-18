/**
 * Password Reset Form Component for React
 *
 * Professional password reset form with step-by-step flow
 */
import React from 'react';
/**
 * Password reset form configuration
 */
export interface PasswordResetFormConfig {
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
export interface PasswordResetFormProps {
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
export declare function PasswordResetForm({ config, onSuccess, onError, onBackToLogin, resetToken }: PasswordResetFormProps): import("react/jsx-runtime").JSX.Element;
