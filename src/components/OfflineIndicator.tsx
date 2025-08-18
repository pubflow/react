/**
 * Offline Indicator Component for React
 * 
 * Displays a banner when the user is offline
 */

import React, { useState, useEffect } from 'react';

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
export function OfflineIndicator({
  offlineText = 'No internet connection',
  onlineText = 'Back online',
  onlineDuration = 3000,
  style,
  offlineTextStyle,
  onlineTextStyle,
  visible = true,
  position = 'top',
  className = ''
}: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Listen for network changes
  useEffect(() => {
    const handleOnline = () => {
      // If we were offline and now we're online, show the online message
      if (isOffline) {
        setShowOnlineMessage(true);
        setIsAnimating(true);
        
        // Hide after duration
        setTimeout(() => {
          setShowOnlineMessage(false);
          setIsAnimating(false);
        }, onlineDuration);
      }
      
      setWasOffline(isOffline);
      setIsOffline(false);
    };
    
    const handleOffline = () => {
      setWasOffline(isOffline);
      setIsOffline(true);
      setShowOnlineMessage(false);
      setIsAnimating(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOffline, onlineDuration]);
  
  // Don't render if not visible
  if (!visible) {
    return null;
  }
  
  // Don't render if online and not showing online message
  if (!isOffline && !showOnlineMessage) {
    return null;
  }
  
  // Default styles
  const defaultStyles: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    [position]: 0,
    backgroundColor: isOffline ? '#dc2626' : '#22c55e',
    color: '#ffffff',
    padding: '12px 16px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 9999,
    transform: isAnimating ? 'translateY(0)' : 'translateY(0)',
    transition: 'all 0.3s ease-in-out',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };
  
  const defaultTextStyles: React.CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: '500'
  };
  
  const mergedStyles = {
    ...defaultStyles,
    ...style
  };
  
  const mergedTextStyles = {
    ...defaultTextStyles,
    ...(isOffline ? offlineTextStyle : onlineTextStyle)
  };
  
  return (
    <div 
      className={className} 
      style={mergedStyles}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <span style={{ fontSize: '16px' }}>
        {isOffline ? '⚠️' : '✅'}
      </span>
      
      {/* Text */}
      <span style={mergedTextStyles}>
        {isOffline ? offlineText : onlineText}
      </span>
      
      {/* Optional close button for online message */}
      {showOnlineMessage && (
        <button
          onClick={() => {
            setShowOnlineMessage(false);
            setIsAnimating(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
            marginLeft: '8px'
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Hook to get network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    isOnline,
    isOffline: !isOnline
  };
}
