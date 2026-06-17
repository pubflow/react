import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '../LoginForm';

const mockAuth = {
  login: vi.fn(),
  verifyTwoFactor: vi.fn(),
  startTwoFactor: vi.fn(),
  isLoading: false,
  twoFactorPending: false,
  twoFactorMethods: [],
};

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockAuth
}));

describe('LoginForm', () => {
  beforeEach(() => {
    mockAuth.login.mockReset();
    mockAuth.verifyTwoFactor.mockReset();
    mockAuth.startTwoFactor.mockReset();
    mockAuth.isLoading = false;
    mockAuth.twoFactorPending = false;
    mockAuth.twoFactorMethods = [];
  });

  it('renders login form with default configuration', () => {
    render(<LoginForm />);

    expect(screen.getByText('Welcome to Pubflow')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders with custom branding configuration', () => {
    render(
      <LoginForm
        config={{
          appName: 'Test App',
          primaryColor: '#ff0000',
          showPasswordReset: false,
          showAccountCreation: false
        }}
      />
    );

    expect(screen.getByText('Welcome to Test App')).toBeInTheDocument();
    expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
    expect(screen.queryByText('Create New Account')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('normalizes email to lowercase and calls onSuccess after normal login', async () => {
    const onSuccess = vi.fn();
    const user = { id: '1', email: 'test@example.com' };
    mockAuth.login.mockResolvedValue({ success: true, user });

    render(<LoginForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'TEST@EXAMPLE.COM' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockAuth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(onSuccess).toHaveBeenCalledWith(user);
    });
  });

  it('shows OTP form when login requires 2FA', async () => {
    const onTwoFactorRequired = vi.fn();
    const methods = [{ id: 'method-1', method: 'email', status: 'active', identifier: 't@example.com' }];
    mockAuth.login.mockResolvedValue({ success: true, requires2fa: true, availableMethods: methods });

    render(<LoginForm onTwoFactorRequired={onTwoFactorRequired} />);

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      expect(onTwoFactorRequired).toHaveBeenCalledWith(methods);
    });
  });

  it('accepts session_activated as successful OTP verification', async () => {
    const onTwoFactorSuccess = vi.fn();
    const onSuccess = vi.fn();
    const methods = [{ id: 'method-1', method: 'email', status: 'active' }];
    mockAuth.login.mockResolvedValue({ success: true, requires2fa: true, availableMethods: methods });
    mockAuth.verifyTwoFactor.mockResolvedValue({ success: true, session_activated: true });

    render(<LoginForm onSuccess={onSuccess} onTwoFactorSuccess={onTwoFactorSuccess} />);

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await screen.findByLabelText('Verification Code');
    fireEvent.change(screen.getByLabelText('Verification Code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Code' }));

    await waitFor(() => {
      expect(mockAuth.verifyTwoFactor).toHaveBeenCalledWith('method-1', '123456');
      expect(onTwoFactorSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(null);
    });
  });

  it('resends 2FA code using the active method', async () => {
    const methods = [{ id: 'method-1', method: 'email', status: 'active' }];
    mockAuth.login.mockResolvedValue({ success: true, requires2fa: true, availableMethods: methods });
    mockAuth.startTwoFactor.mockResolvedValue({ success: true });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await screen.findByText("Didn't receive a code? Resend");
    fireEvent.click(screen.getByText("Didn't receive a code? Resend"));

    await waitFor(() => {
      expect(mockAuth.startTwoFactor).toHaveBeenCalledWith('method-1', 'email');
    });
  });

  it('returns to credentials step and calls onTwoFactorCancel', async () => {
    const onTwoFactorCancel = vi.fn();
    const methods = [{ id: 'method-1', method: 'email', status: 'active' }];
    mockAuth.login.mockResolvedValue({ success: true, requires2fa: true, availableMethods: methods });

    render(<LoginForm onTwoFactorCancel={onTwoFactorCancel} />);

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await screen.findByText('Back to login');
    fireEvent.click(screen.getByText('Back to login'));

    expect(onTwoFactorCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });
});
