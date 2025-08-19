/**
 * Asset Utilities for Pubflow React
 * 
 * Utilities for handling assets like logos, images, and other media files
 * Supports both external URLs and internal assets with proper Vite/bundler integration
 */

import React from 'react';

/**
 * Process asset URL - supports both external URLs and internal assets
 * 
 * @param assetUrl - The asset URL to process
 * @returns Processed URL ready for use in src attributes
 */
export function processAssetUrl(assetUrl: string | React.ReactNode): string | React.ReactNode {
  // Return non-string values as-is (React components, null, undefined)
  if (!assetUrl || typeof assetUrl !== 'string') {
    return assetUrl;
  }

  // Return empty string as-is (no logo case)
  if (assetUrl.trim() === '') {
    return '';
  }
  
  // Check if it's an external URL (starts with http:// or https://)
  if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://')) {
    return assetUrl;
  }
  
  // Check if it's a data URL (base64 encoded image)
  if (assetUrl.startsWith('data:')) {
    return assetUrl;
  }
  
  // Check if it's already a processed Vite asset (starts with /)
  if (assetUrl.startsWith('/')) {
    return assetUrl;
  }
  
  // Check if it's a blob URL
  if (assetUrl.startsWith('blob:')) {
    return assetUrl;
  }
  
  // For relative paths or simple filenames, assume they're in the public directory
  // This handles cases like 'logo.svg', './logo.png', '../assets/logo.jpg', etc.
  if (assetUrl.includes('.')) {
    // Remove leading ./ if present
    const cleanPath = assetUrl.replace(/^\.\//, '');
    
    // If it starts with ../, keep it as is (relative to current directory)
    if (assetUrl.startsWith('../')) {
      return assetUrl;
    }
    
    // For simple filenames or paths, prepend with /
    return `/${cleanPath}`;
  }
  
  // Return as-is for any other cases
  return assetUrl;
}

/**
 * Process logo URL specifically - alias for processAssetUrl with better naming
 * 
 * @param logoUrl - The logo URL to process
 * @returns Processed URL ready for use in img src
 */
export function processLogoUrl(logoUrl: string | React.ReactNode): string | React.ReactNode {
  return processAssetUrl(logoUrl);
}

/**
 * Check if an asset URL is external (hosted on a different domain)
 * 
 * @param assetUrl - The asset URL to check
 * @returns True if the URL is external
 */
export function isExternalAsset(assetUrl: string): boolean {
  if (!assetUrl || typeof assetUrl !== 'string') {
    return false;
  }
  
  return assetUrl.startsWith('http://') || assetUrl.startsWith('https://');
}

/**
 * Check if an asset URL is a data URL (base64 encoded)
 * 
 * @param assetUrl - The asset URL to check
 * @returns True if the URL is a data URL
 */
export function isDataUrl(assetUrl: string): boolean {
  if (!assetUrl || typeof assetUrl !== 'string') {
    return false;
  }
  
  return assetUrl.startsWith('data:');
}

/**
 * Get asset file extension from URL
 * 
 * @param assetUrl - The asset URL
 * @returns File extension (e.g., 'svg', 'png', 'jpg') or null if not found
 */
export function getAssetExtension(assetUrl: string): string | null {
  if (!assetUrl || typeof assetUrl !== 'string') {
    return null;
  }
  
  // Remove query parameters and fragments
  const cleanUrl = assetUrl.split('?')[0].split('#')[0];
  
  // Extract extension
  const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Check if an asset is an image based on its extension
 * 
 * @param assetUrl - The asset URL
 * @returns True if the asset appears to be an image
 */
export function isImageAsset(assetUrl: string): boolean {
  const extension = getAssetExtension(assetUrl);
  if (!extension) return false;
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];
  return imageExtensions.includes(extension);
}

/**
 * Create a fallback image URL for broken images
 * 
 * @param width - Image width
 * @param height - Image height
 * @param text - Text to display in fallback
 * @param backgroundColor - Background color
 * @param textColor - Text color
 * @returns Data URL for fallback image
 */
export function createFallbackImageUrl(
  width: number = 200,
  height: number = 100,
  text: string = 'Image',
  backgroundColor: string = '#f0f0f0',
  textColor: string = '#666666'
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
            fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Asset loading utility with error handling
 * 
 * @param assetUrl - The asset URL to load
 * @returns Promise that resolves when asset is loaded
 */
export function loadAsset(assetUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!assetUrl || typeof assetUrl !== 'string') {
      reject(new Error('Invalid asset URL'));
      return;
    }
    
    // For data URLs, resolve immediately
    if (isDataUrl(assetUrl)) {
      resolve();
      return;
    }
    
    // For images, use Image object to preload
    if (isImageAsset(assetUrl)) {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${assetUrl}`));
      img.src = processAssetUrl(assetUrl) as string;
      return;
    }
    
    // For other assets, use fetch
    fetch(processAssetUrl(assetUrl) as string)
      .then(response => {
        if (response.ok) {
          resolve();
        } else {
          reject(new Error(`Failed to load asset: ${response.status} ${response.statusText}`));
        }
      })
      .catch(error => reject(error));
  });
}

/**
 * Batch load multiple assets
 * 
 * @param assetUrls - Array of asset URLs to load
 * @returns Promise that resolves when all assets are loaded
 */
export function loadAssets(assetUrls: string[]): Promise<void[]> {
  return Promise.all(assetUrls.map(url => loadAsset(url)));
}

/**
 * Asset configuration type for components
 */
export interface AssetConfig {
  /**
   * Asset URL (logo, image, etc.)
   */
  url?: string | React.ReactNode;
  
  /**
   * Alt text for accessibility
   */
  alt?: string;
  
  /**
   * Fallback URL if main asset fails to load
   */
  fallback?: string;
  
  /**
   * Whether to show a fallback placeholder if asset fails
   */
  showFallback?: boolean;
  
  /**
   * Custom styles for the asset
   */
  style?: React.CSSProperties;
  
  /**
   * CSS class name
   */
  className?: string;
}

/**
 * Smart asset component that handles loading, errors, and fallbacks
 */
export interface SmartAssetProps extends AssetConfig {
  /**
   * Asset URL
   */
  src: string | React.ReactNode;
  
  /**
   * Component type to render
   */
  as?: 'img' | 'div';
  
  /**
   * Callback when asset loads successfully
   */
  onLoad?: () => void;
  
  /**
   * Callback when asset fails to load
   */
  onError?: (error: Error) => void;
}

/**
 * Smart Asset Component with automatic fallback handling
 */
export function SmartAsset({
  src,
  alt = '',
  fallback,
  showFallback = false,
  style = {},
  className = '',
  as = 'img',
  onLoad,
  onError
}: SmartAssetProps): React.ReactElement | null {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const processedSrc = React.useMemo(() => {
    return processAssetUrl(src) as string;
  }, [src]);
  
  const handleLoad = React.useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);
  
  const handleError = React.useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error(`Failed to load asset: ${processedSrc}`));
  }, [processedSrc, onError]);
  
  // If it's not a string (React component), render as-is
  if (typeof src !== 'string') {
    return src as React.ReactElement;
  }
  
  // If there's an error and we have a fallback
  if (hasError && fallback) {
    return React.createElement('img', {
      src: processAssetUrl(fallback) as string,
      alt: alt,
      style: style,
      className: className,
      onLoad: handleLoad,
      onError: () => setHasError(true)
    });
  }
  
  // If there's an error and we should show fallback placeholder
  if (hasError && showFallback) {
    const fallbackUrl = createFallbackImageUrl(
      (style.width as number) || 200,
      (style.height as number) || 100,
      alt || 'Image'
    );

    return React.createElement('img', {
      src: fallbackUrl,
      alt: alt,
      style: style,
      className: className
    });
  }

  // If there's an error and no fallback should be shown, return null
  if (hasError && !showFallback && !fallback) {
    return null;
  }
  
  // Render the asset
  if (as === 'img') {
    return React.createElement('img', {
      src: processedSrc,
      alt: alt,
      style: style,
      className: className,
      onLoad: handleLoad,
      onError: handleError
    });
  }

  // Render as div with background image
  return React.createElement('div', {
    style: {
      ...style,
      backgroundImage: `url(${processedSrc})`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center'
    },
    className: className,
    'aria-label': alt
  });
}
