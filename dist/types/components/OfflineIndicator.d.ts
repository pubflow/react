/**
 * Offline Indicator Component for React
 *
 * Displays a banner when the user is offline
 */
import React from 'react';
/**
 * Offline Indicator props
 */
export interface OfflineIndicatorProps {
    /**
     * Text to display when offline
     */
    offlineText?: string;
    /**
     * Text to display when back online
     */
    onlineText?: string;
    /**
     * Duration to show the online message (in ms)
     */
    onlineDuration?: number;
    /**
     * Style for the container
     */
    style?: React.CSSProperties;
    /**
     * Style for the offline text
     */
    offlineTextStyle?: React.CSSProperties;
    /**
     * Style for the online text
     */
    onlineTextStyle?: React.CSSProperties;
    /**
     * Whether to show the indicator
     */
    visible?: boolean;
    /**
     * Position of the indicator
     */
    position?: 'top' | 'bottom';
    /**
     * Custom CSS class
     */
    className?: string;
}
/**
 * Component for displaying an offline indicator
 */
export declare function OfflineIndicator({ offlineText, onlineText, onlineDuration, style, offlineTextStyle, onlineTextStyle, visible, position, className }: OfflineIndicatorProps): import("react/jsx-runtime").JSX.Element | null;
/**
 * Hook to get network status
 */
export declare function useNetworkStatus(): {
    isOnline: boolean;
    isOffline: boolean;
};
