/**
 * Account Creation Form Component for React
 *
 * Professional account creation form with validation
 */
import React from 'react';
/**
 * Account creation form configuration
 */
export interface AccountCreationFormConfig {
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
export interface AccountCreationFormProps {
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
export declare function AccountCreationForm({ config, onSuccess, onError, onBackToLogin }: AccountCreationFormProps): import("react/jsx-runtime").JSX.Element;
