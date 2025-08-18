/**
 * Bridge View Component for React
 *
 * Provides a component for conditional rendering based on authentication and user type
 */
import React from 'react';
/**
 * Bridge View props
 */
export interface BridgeViewProps {
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
export declare function BridgeView({ children, allowedTypes, fallback, loadingComponent, onUnauthorized, instanceId }: BridgeViewProps): import("react/jsx-runtime").JSX.Element;
