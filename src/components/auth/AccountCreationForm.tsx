/**
 * Account Creation Form Component for React
 * 
 * Professional account creation form with validation
 */

import React, { useState } from 'react';
import { processLogoUrl } from '../../utils/asset-utils';

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

type CreationStep = 'form' | 'success';

/**
 * Professional account creation form component
 */
export function AccountCreationForm({
  config = {},
  onSuccess,
  onError,
  onBackToLogin
}: AccountCreationFormProps) {
  // Configuration with defaults
  const {
    primaryColor = process.env.REACT_APP_PRIMARY_COLOR || '#006aff',
    appName = process.env.REACT_APP_NAME || 'Pubflow',
    logo = process.env.REACT_APP_LOGO,
    apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '',
    className = '',
    requiredFields = ['name', 'lastName', 'email', 'password']
  } = config;
  
  // Form state
  const [step, setStep] = useState<CreationStep>('form');
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Update form field
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (requiredFields.includes('name') && !formData.name.trim()) {
      newErrors.name = 'First name is required';
    }
    
    if (requiredFields.includes('lastName') && !formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (requiredFields.includes('email')) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (requiredFields.includes('password')) {
      if (!formData.password.trim()) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiBaseUrl}/auth/register/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          name: formData.name.trim(),
          lastName: formData.lastName.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error creating account');
      }
      
      // Success - show confirmation
      setStep('success');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating account';
      if (onError) {
        onError(errorMessage);
      }
      
      // Set specific field errors if available
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ email: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Dynamic styles
  const styles = {
    container: {
      maxWidth: '400px',
      width: '100%',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
      border: '1px solid #f0f0f0',
      boxSizing: 'border-box' as const
    },
    logoSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center' as const,
      marginBottom: '32px',
      width: '100%'
    },
    logo: {
      maxWidth: '320px',
      maxHeight: '80px',
      height: 'auto',
      width: 'auto',
      objectFit: 'contain' as const,
      marginBottom: '20px',
      display: 'block'
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
    inputError: {
      borderColor: '#dc2626'
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
    errorText: {
      color: '#dc2626',
      fontSize: '12px',
      marginTop: '4px',
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
      case 'form':
        return (
          <>
            <div style={styles.logoSection}>
              {logo && (
                typeof logo === 'string' ? (
                  <img src={processLogoUrl(logo) as string} alt={`${appName} Logo`} style={styles.logo} />
                ) : (
                  logo
                )
              )}
              <h1 style={styles.title}>Create Account</h1>
              <p style={styles.subtitle}>Join {appName} today</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              {errors.general && (
                <div style={{ ...styles.successContainer, backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                  <span style={{ color: '#ff4757', fontSize: '20px' }}>⚠</span>
                  <span style={{ ...styles.successText, color: '#dc2626' }}>{errors.general}</span>
                </div>
              )}
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>First Name *</label>
                <div style={{ ...styles.inputContainer, ...(errors.name ? styles.inputError : {}) }}>
                  <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>👤</span>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Enter your first name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    autoComplete="given-name"
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.name && <div style={styles.errorText}>{errors.name}</div>}
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Last Name *</label>
                <div style={{ ...styles.inputContainer, ...(errors.lastName ? styles.inputError : {}) }}>
                  <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>👤</span>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    autoComplete="family-name"
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.lastName && <div style={styles.errorText}>{errors.lastName}</div>}
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Email Address *</label>
                <div style={{ ...styles.inputContainer, ...(errors.email ? styles.inputError : {}) }}>
                  <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>✉</span>
                  <input
                    type="email"
                    style={styles.input}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.email && <div style={styles.errorText}>{errors.email}</div>}
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Password *</label>
                <div style={{ ...styles.inputContainer, ...(errors.password ? styles.inputError : {}) }}>
                  <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={styles.input}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
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
                {errors.password && <div style={styles.errorText}>{errors.password}</div>}
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Confirm Password *</label>
                <div style={{ ...styles.inputContainer, ...(errors.confirmPassword ? styles.inputError : {}) }}>
                  <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>🔒</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    style={styles.input}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
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
                {errors.confirmPassword && <div style={styles.errorText}>{errors.confirmPassword}</div>}
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
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </>
        );
        
      case 'success':
        return (
          <>
            <div style={styles.logoSection}>
              <h1 style={styles.title}>Account Created</h1>
              <p style={styles.subtitle}>Welcome to {appName}!</p>
            </div>
            
            <div style={styles.successContainer}>
              <span style={{ color: '#22c55e', fontSize: '20px' }}>✓</span>
              <span style={styles.successText}>
                Your account has been created successfully
              </span>
            </div>
            
            <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '24px' }}>
              You can now sign in with your new account.
            </p>
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
