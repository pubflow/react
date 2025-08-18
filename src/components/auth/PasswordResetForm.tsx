/**
 * Password Reset Form Component for React
 * 
 * Professional password reset form with step-by-step flow
 */

import React, { useState } from 'react';

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

type ResetStep = 'request' | 'sent' | 'reset' | 'success';

/**
 * Professional password reset form component
 */
export function PasswordResetForm({
  config = {},
  onSuccess,
  onError,
  onBackToLogin,
  resetToken
}: PasswordResetFormProps) {
  // Configuration with defaults
  const {
    primaryColor = process.env.REACT_APP_PRIMARY_COLOR || '#006aff',
    appName = process.env.REACT_APP_NAME || 'Pubflow',
    logo = process.env.REACT_APP_LOGO,
    apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '',
    className = ''
  } = config;
  
  // Form state
  const [step, setStep] = useState<ResetStep>(resetToken ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle password reset request
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      const response = await fetch(`${apiBaseUrl}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), resetUrl }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('sent');
      } else {
        setError(data.message || 'Error requesting password reset.');
        if (onError) {
          onError(data.message || 'Error requesting password reset.');
        }
      }
    } catch (err) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiBaseUrl}/auth/password-reset/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('success');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(data.message || 'Error resetting password.');
        if (onError) {
          onError(data.message || 'Error resetting password.');
        }
      }
    } catch (err) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
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
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: '8px',
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '16px',
      color: '#666666',
      fontWeight: '400',
      marginBottom: '24px'
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
    button: {
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
    successContainer: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#f0fdf4',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '24px',
      border: '1px solid #bbf7d0'
    },
    successText: {
      color: '#166534',
      fontSize: '14px',
      marginLeft: '8px',
      fontWeight: '500'
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
      textAlign: 'center' as const,
      width: '100%',
      marginTop: '16px'
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case 'request':
        return (
          <>
            <div style={styles.logoSection}>
              {logo && (
                typeof logo === 'string' ? (
                  <img src={logo} alt={`${appName} Logo`} style={styles.logo} />
                ) : (
                  logo
                )
              )}
              <h1 style={styles.title}>Reset Password</h1>
              <p style={styles.subtitle}>Enter your email to receive reset instructions</p>
            </div>
            
            <form onSubmit={handleRequestReset}>
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
              
              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: isLoading ? 0.8 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>
          </>
        );
        
      case 'sent':
        return (
          <>
            <div style={styles.logoSection}>
              <h1 style={styles.title}>Check Your Email</h1>
              <p style={styles.subtitle}>
                We've sent password reset instructions to {email}
              </p>
            </div>
            
            <div style={styles.successContainer}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✓</span>
              <span style={styles.successText}>
                Reset instructions sent successfully
              </span>
            </div>
            
            <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '24px' }}>
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </>
        );
        
      case 'reset':
        return (
          <>
            <div style={styles.logoSection}>
              <h1 style={styles.title}>Set New Password</h1>
              <p style={styles.subtitle}>Enter your new password below</p>
            </div>
            
            <form onSubmit={handleResetPassword}>
              {error && (
                <div style={styles.errorContainer}>
                  <span style={{ color: '#ff4757', fontSize: '20px' }}>⚠</span>
                  <span style={styles.errorText}>{error}</span>
                </div>
              )}
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>New Password</label>
                <div style={styles.inputContainer}>
                  <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={styles.input}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
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
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Confirm Password</label>
                <div style={styles.inputContainer}>
                  <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>🔒</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    style={styles.input}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    style={styles.eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? '👁' : '👁‍🗨'}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                style={{
                  ...styles.button,
                  opacity: isLoading ? 0.8 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </>
        );
        
      case 'success':
        return (
          <>
            <div style={styles.logoSection}>
              <h1 style={styles.title}>Password Reset</h1>
              <p style={styles.subtitle}>Your password has been successfully reset</p>
            </div>
            
            <div style={styles.successContainer}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✓</span>
              <span style={styles.successText}>
                Password reset successfully
              </span>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={className} style={styles.container}>
      {renderStep()}
      
      {/* Back to Login */}
      <button
        type="button"
        style={styles.linkButton}
        onClick={onBackToLogin}
        disabled={isLoading}
      >
        Back to Login
      </button>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
