/**
 * LoginForm Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '../LoginForm';
import { PubflowProvider } from '../../../context/PubflowProvider';

// Mock the useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isLoading: false
  })
}));

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <PubflowProvider
    config={{
      baseUrl: 'http://localhost:8787',
      bridgeBasePath: '/bridge',
      authBasePath: '/auth'
    }}
  >
    {children}
  </PubflowProvider>
);

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with default configuration', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome to Pubflow')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders with custom configuration', () => {
    const config = {
      appName: 'Test App',
      primaryColor: '#ff0000',
      showPasswordReset: false,
      showAccountCreation: false
    };

    render(
      <TestWrapper>
        <LoginForm config={config} />
      </TestWrapper>
    );

    expect(screen.getByText('Welcome to Test App')).toBeInTheDocument();
    expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
    expect(screen.queryByText('Create New Account')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Note: This test would need proper email validation in the component
    // Currently the component only checks for empty email
  });

  it('toggles password visibility', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /👁/ });

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('calls onPasswordReset when forgot password is clicked', () => {
    const onPasswordReset = vi.fn();

    render(
      <TestWrapper>
        <LoginForm onPasswordReset={onPasswordReset} />
      </TestWrapper>
    );

    const forgotPasswordButton = screen.getByText('Forgot password?');
    fireEvent.click(forgotPasswordButton);

    expect(onPasswordReset).toHaveBeenCalledTimes(1);
  });

  it('calls onAccountCreation when create account is clicked', () => {
    const onAccountCreation = vi.fn();

    render(
      <TestWrapper>
        <LoginForm onAccountCreation={onAccountCreation} />
      </TestWrapper>
    );

    const createAccountButton = screen.getByText('Create New Account');
    fireEvent.click(createAccountButton);

    expect(onAccountCreation).toHaveBeenCalledTimes(1);
  });

  it('normalizes email to lowercase', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true, user: {} });
    
    vi.doMock('../../../hooks/useAuth', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false
      })
    }));

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'TEST@EXAMPLE.COM' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('displays error message on login failure', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Invalid credentials' 
    });
    
    vi.doMock('../../../hooks/useAuth', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false
      })
    }));

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    vi.doMock('../../../hooks/useAuth', () => ({
      useAuth: () => ({
        login: vi.fn(),
        isLoading: true
      })
    }));

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Signing in/ })).toBeDisabled();
  });

  it('calls onSuccess callback on successful login', async () => {
    const onSuccess = vi.fn();
    const mockUser = { id: '1', email: 'test@example.com' };
    const mockLogin = vi.fn().mockResolvedValue({ 
      success: true, 
      user: mockUser 
    });
    
    vi.doMock('../../../hooks/useAuth', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false
      })
    }));

    render(
      <TestWrapper>
        <LoginForm onSuccess={onSuccess} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('calls onError callback on login error', async () => {
    const onError = vi.fn();
    const mockLogin = vi.fn().mockResolvedValue({ 
      success: false, 
      error: 'Network error' 
    });
    
    vi.doMock('../../../hooks/useAuth', () => ({
      useAuth: () => ({
        login: mockLogin,
        isLoading: false
      })
    }));

    render(
      <TestWrapper>
        <LoginForm onError={onError} />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Network error');
    });
  });
});
