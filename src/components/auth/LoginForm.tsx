/**
 * Login Form Component for React
 *
 * Professional login form with login-time 2FA and dynamic branding.
 */

import React, { useContext, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { processLogoUrl } from '../../utils/asset-utils';
import { PubflowContext } from '../../context/PubflowProvider';
import type { TwoFactorMethod } from '@pubflow/core';

export interface LoginFormConfig {
  primaryColor?: string;
  secondaryColor?: string;
  appName?: string;
  logo?: string | React.ReactNode;
  showPasswordReset?: boolean;
  showAccountCreation?: boolean;
  className?: string;
  redirectPath?: string;
  subtitle?: string;
  twoFactorSubtitle?: string;
  passwordResetText?: string;
  accountCreationText?: string;
}

export interface LoginFormProps {
  config?: LoginFormConfig;
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  onPasswordReset?: () => void;
  onAccountCreation?: () => void;
  onTwoFactorRequired?: (methods: TwoFactorMethod[]) => void;
  onTwoFactorSuccess?: () => void;
  onTwoFactorCancel?: () => void;
  instanceId?: string;
}

function getEnv(keys: string[]): string | undefined {
  const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;

  for (const key of keys) {
    const value = importMetaEnv?.[key] ?? (typeof process !== 'undefined' ? process.env?.[key] : undefined);
    if (value) return value;
  }

  return undefined;
}

function getMethodLabel(method: TwoFactorMethod): string {
  const name = method.method.toUpperCase();
  return method.identifier ? `${name} - ${method.identifier}` : name;
}

export function LoginForm({
  config = {},
  onSuccess,
  onError,
  onPasswordReset,
  onAccountCreation,
  onTwoFactorRequired,
  onTwoFactorSuccess,
  onTwoFactorCancel,
  instanceId
}: LoginFormProps) {
  const {
    login,
    verifyTwoFactor,
    startTwoFactor,
    isLoading,
    twoFactorPending,
    twoFactorMethods
  } = useAuth(instanceId);
  const pubflowContext = useContext(PubflowContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpCode, setOtpCode] = useState('');
  const [pendingMethods, setPendingMethods] = useState<TwoFactorMethod[]>([]);
  const [activeMethodId, setActiveMethodId] = useState<string | null>(null);
  const [activeMethodName, setActiveMethodName] = useState('email');
  const [otpLoading, setOtpLoading] = useState(false);

  const {
    primaryColor = pubflowContext.theme?.primaryColor || getEnv(['VITE_PRIMARY_COLOR', 'NEXT_PUBLIC_PRIMARY_COLOR', 'REACT_APP_PRIMARY_COLOR']) || '#006aff',
    secondaryColor = pubflowContext.theme?.secondaryColor || getEnv(['VITE_SECONDARY_COLOR', 'NEXT_PUBLIC_SECONDARY_COLOR', 'REACT_APP_SECONDARY_COLOR']) || '#4a90e2',
    appName = pubflowContext.theme?.appName || getEnv(['VITE_APP_NAME', 'NEXT_PUBLIC_APP_NAME', 'REACT_APP_NAME']) || 'Pubflow',
    logo = pubflowContext.theme?.logo || getEnv(['VITE_APP_LOGO', 'NEXT_PUBLIC_APP_LOGO', 'REACT_APP_LOGO']),
    showPasswordReset = true,
    showAccountCreation = true,
    className = '',
    redirectPath,
    subtitle = 'Sign in to your account',
    twoFactorSubtitle = 'Enter the verification code we sent you.',
    passwordResetText = 'Forgot password?',
    accountCreationText = 'Create New Account'
  } = config;

  useEffect(() => {
    if (!twoFactorPending) return;

    const methods = twoFactorMethods ?? [];
    setPendingMethods(methods);
    if (methods.length > 0 && !activeMethodId) {
      setActiveMethodId(methods[0].id);
      setActiveMethodName(methods[0].method);
    }
    setStep('otp');
  }, [twoFactorPending, twoFactorMethods, activeMethodId]);

  const finishSuccess = (user?: any) => {
    if (onSuccess) onSuccess(user ?? null);
    if (redirectPath && typeof window !== 'undefined') {
      window.location.href = redirectPath;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

      if (result.requires2fa) {
        const methods: TwoFactorMethod[] = result.availableMethods ?? [];
        setPendingMethods(methods);
        if (methods.length > 0) {
          setActiveMethodId(methods[0].id);
          setActiveMethodName(methods[0].method);
        }
        setStep('otp');
        if (onTwoFactorRequired) onTwoFactorRequired(methods);
        return;
      }

      if (result.success) {
        finishSuccess(result.user);
        return;
      }

      const message = result.error || 'Invalid credentials';
      setError(message);
      if (onError) onError(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection error. Please try again.';
      setError(message);
      if (onError) onError(message);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMethodId) {
      setError('No verification method is available.');
      return;
    }

    setError('');
    setOtpLoading(true);

    try {
      const result = await verifyTwoFactor(activeMethodId, otpCode.trim());
      if (result.verified || result.session_activated) {
        if (onTwoFactorSuccess) onTwoFactorSuccess();
        finishSuccess(null);
        return;
      }

      const message = result.error ||
        (result.attempts_remaining !== undefined
          ? `Incorrect code. ${result.attempts_remaining} attempt(s) remaining.`
          : 'Incorrect code.');
      setError(message);
      if (onError) onError(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      if (onError) onError(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (!activeMethodId) return;

    setError('');
    setOtpLoading(true);
    try {
      await startTwoFactor(activeMethodId, activeMethodName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not resend the code.';
      setError(message);
      if (onError) onError(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleMethodChange = (methodId: string) => {
    const selected = pendingMethods.find(method => method.id === methodId);
    setActiveMethodId(selected?.id ?? null);
    setActiveMethodName(selected?.method ?? 'email');
    setOtpCode('');
  };

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
    welcomeText: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: '8px',
      letterSpacing: '0'
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
      letterSpacing: '0',
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
      letterSpacing: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    secondaryButton: {
      backgroundColor: secondaryColor,
      boxShadow: `0 4px 12px ${secondaryColor}40`
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
      <div style={styles.logoSection}>
        {logo && (
          typeof logo === 'string'
            ? <img src={processLogoUrl(logo) as string} alt={`${appName} Logo`} style={styles.logo} />
            : logo
        )}
        <h1 style={styles.welcomeText}>Welcome to {appName}</h1>
        <p style={styles.subtitleText}>
          {step === 'otp' ? twoFactorSubtitle : subtitle}
        </p>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <span style={{ color: '#ff4757', fontSize: '20px' }}>!</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {step === 'otp' ? (
        <form onSubmit={handleOtpSubmit} noValidate>
          {pendingMethods.length > 1 && (
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Verification Method</label>
              <div style={styles.inputContainer}>
                <select
                  style={{ ...styles.input, width: '100%' }}
                  value={activeMethodId ?? ''}
                  onChange={(e) => handleMethodChange(e.target.value)}
                  disabled={otpLoading}
                >
                  {pendingMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {getMethodLabel(method)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label htmlFor="pubflow-otp-code" style={styles.inputLabel}>Verification Code</label>
            <div style={styles.inputContainer}>
              <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>#</span>
              <input
                id="pubflow-otp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                style={{ ...styles.input, letterSpacing: '0.4em', textAlign: 'center' }}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                autoComplete="one-time-code"
                disabled={otpLoading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.loginButton,
              opacity: otpLoading || otpCode.length < 6 ? 0.7 : 1,
              cursor: otpLoading || otpCode.length < 6 ? 'not-allowed' : 'pointer',
            }}
            disabled={otpLoading || otpCode.length < 6}
          >
            {otpLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              type="button"
              style={{ ...styles.linkButton, fontSize: '14px' }}
              onClick={handleResend}
              disabled={otpLoading || !activeMethodId}
            >
              Didn't receive a code? Resend
            </button>
            <button
              type="button"
              style={{ ...styles.linkButton, fontSize: '13px', color: '#888' }}
              onClick={() => {
                setStep('credentials');
                setError('');
                setOtpCode('');
                if (onTwoFactorCancel) onTwoFactorCancel();
              }}
            >
              Back to login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.inputGroup}>
            <label htmlFor="pubflow-login-email" style={styles.inputLabel}>Email Address</label>
            <div style={styles.inputContainer}>
              <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>@</span>
              <input
                id="pubflow-login-email"
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
            <label htmlFor="pubflow-login-password" style={styles.inputLabel}>Password</label>
            <div style={styles.inputContainer}>
              <span style={{ marginRight: '12px', opacity: 0.7, color: '#666' }}>*</span>
              <input
                id="pubflow-login-password"
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
                {showPassword ? 'Hide' : 'Show'}
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
                {passwordResetText}
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {showAccountCreation && (
            <div style={styles.accountActions}>
              <button
                type="button"
                style={styles.linkButton}
                onClick={onAccountCreation}
                disabled={isLoading}
              >
                {accountCreationText}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
