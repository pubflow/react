/**
 * Login Form Component for React
 * 
 * Professional login form with dynamic styling based on environment variables
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { processLogoUrl } from '../../utils/asset-utils';

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
export function LoginForm({
  config = {},
  onSuccess,
  onError,
  onPasswordReset,
  onAccountCreation,
  instanceId
}: LoginFormProps) {
  const { login, isLoading } = useAuth(instanceId);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Configuration with defaults
  const {
    primaryColor = process.env.REACT_APP_PRIMARY_COLOR || '#006aff',
    secondaryColor = process.env.REACT_APP_SECONDARY_COLOR || '#4a90e2',
    appName = process.env.REACT_APP_NAME || 'Pubflow',
    logo = process.env.REACT_APP_LOGO,
    showPasswordReset = true,
    showAccountCreation = true,
    className = '',
    redirectPath
  } = config;
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    
    try {
      const result = await login({ email: email.toLowerCase().trim(), password });
      
      if (result.success) {
        if (onSuccess) {
          onSuccess(result.user);
        }
        
        // Handle redirect
        if (redirectPath && typeof window !== 'undefined') {
          window.location.href = redirectPath;
        }
      } else {
        const errorMessage = result.error || 'Invalid credentials';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection error. Please try again.';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  };
  
  // Dynamic styles
  const styles = {
    container: {
      maxWidth: '400px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f0f0f0'
    },
    logoSection: {
      textAlign: 'center' as const,
      marginBottom: '32px'
    },
    logo: {
      maxWidth: '320px',
      height: '80px',
      marginBottom: '20px'
    },
    welcomeText: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: '8px',
      letterSpacing: '-0.5px'
    },
    subtitleText: {
      fontSize: '16px',
      color: '#666666',
      fontWeight: '400'
    },
    inputGroup: {
      marginBottom: '20px'
    },
    inputLabel: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#333333',
      marginBottom: '8px',
      letterSpacing: '-0.2px',
      display: 'block'
    },
    inputContainer: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: '16px',
      border: '1px solid #e9ecef',
      padding: '0 16px',
      height: '56px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
    },
    input: {
      flex: 1,
      fontSize: '16px',
      color: '#333333',
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      fontWeight: '400'
    },
    eyeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      marginLeft: '8px',
      color: '#666'
    },
    loginButton: {
      width: '100%',
      borderRadius: '16px',
      height: '56px',
      backgroundColor: primaryColor,
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      marginTop: '8px',
      boxShadow: `0 4px 12px ${primaryColor}40`,
      letterSpacing: '-0.2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    errorContainer: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#fef2f2',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '24px',
      border: '1px solid #fecaca'
    },
    errorText: {
      color: '#dc2626',
      fontSize: '14px',
      marginLeft: '8px',
      fontWeight: '500'
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    linkButton: {
      background: 'none',
      border: 'none',
      color: primaryColor,
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
      padding: '12px',
      textAlign: 'center' as const
    },
    accountActions: {
      marginTop: '24px',
      marginBottom: '16px',
      textAlign: 'center' as const
    }
  };
  
  return (
    <div className={className} style={styles.container}>
      {/* Logo Section */}
      <div style={styles.logoSection}>
        {logo && (
          typeof logo === 'string' ? (
            <img src={processLogoUrl(logo) as string} alt={`${appName} Logo`} style={styles.logo} />
          ) : (
            logo
          )
        )}
        <h1 style={styles.welcomeText}>Welcome to {appName}</h1>
        <p style={styles.subtitleText}>Sign in to your account</p>
      </div>
      
      {/* Login Form */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={styles.errorContainer}>
            <span style={{ color: '#ff4757', fontSize: '20px' }}>⚠</span>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}
        
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>Email Address</label>
          <div style={styles.inputContainer}>
            <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>✉</span>
            <input
              type="email"
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>Password</label>
          <div style={styles.inputContainer}>
            <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              style={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? '👁' : '👁‍🗨'}
            </button>
          </div>
        </div>
        
        <div style={styles.checkboxContainer}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#666' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Remember me
          </label>
          {showPasswordReset && (
            <button
              type="button"
              style={{ ...styles.linkButton, fontSize: '14px' }}
              onClick={onPasswordReset}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          )}
        </div>
        
        <button
          type="submit"
          style={{
            ...styles.loginButton,
            opacity: isLoading ? 0.8 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      {/* Account Actions */}
      {showAccountCreation && (
        <div style={styles.accountActions}>
          <button
            type="button"
            style={styles.linkButton}
            onClick={onAccountCreation}
            disabled={isLoading}
          >
            Create New Account
          </button>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
