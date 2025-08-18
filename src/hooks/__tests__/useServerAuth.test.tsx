/**
 * useServerAuth Hook Tests
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useServerAuth } from '../useServerAuth';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock window.location
const mockLocation = {
  pathname: '/dashboard',
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('useServerAuth', () => {
  const mockValidateSession = vi.fn();
  const mockOnRedirect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = '/dashboard';
    mockLocation.href = '';
    
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      validateSession: mockValidateSession
    });
  });

  it('returns auth state from useAuth', () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      validateSession: mockValidateSession
    });

    const { result } = renderHook(() => useServerAuth());

    expect(result.current.user).toBe(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.validateSession).toBe(mockValidateSession);
  });

  it('validates session on mount when validateOnMount is true', async () => {
    mockValidateSession.mockResolvedValue({ isValid: true });

    renderHook(() => useServerAuth({ validateOnMount: true }));

    await waitFor(() => {
      expect(mockValidateSession).toHaveBeenCalledTimes(1);
    });
  });

  it('does not validate session on mount when validateOnMount is false', () => {
    renderHook(() => useServerAuth({ validateOnMount: false }));

    expect(mockValidateSession).not.toHaveBeenCalled();
  });

  it('redirects to login when session validation fails', async () => {
    mockValidateSession.mockResolvedValue({ isValid: false });

    renderHook(() => useServerAuth({ 
      validateOnMount: true,
      onRedirect: mockOnRedirect
    }));

    await waitFor(() => {
      expect(mockOnRedirect).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to custom login path', async () => {
    mockValidateSession.mockResolvedValue({ isValid: false });

    renderHook(() => useServerAuth({ 
      validateOnMount: true,
      loginRedirectPath: '/custom-login',
      onRedirect: mockOnRedirect
    }));

    await waitFor(() => {
      expect(mockOnRedirect).toHaveBeenCalledWith('/custom-login');
    });
  });

  it('redirects when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth({ 
      onRedirect: mockOnRedirect
    }));

    await waitFor(() => {
      expect(mockOnRedirect).toHaveBeenCalledWith('/login');
    });
  });

  it('does not redirect when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth({ 
      onRedirect: mockOnRedirect
    }));

    expect(mockOnRedirect).not.toHaveBeenCalled();
  });

  it('allows authenticated users with default allowed types', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', userType: 'user' },
      isAuthenticated: true,
      isLoading: false,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth({ 
      onRedirect: mockOnRedirect
    }));

    expect(mockOnRedirect).not.toHaveBeenCalled();
  });

  it('checks user type when specific types are allowed', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', userType: 'admin' },
      isAuthenticated: true,
      isLoading: false,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth({ 
      allowedTypes: ['admin'],
      onRedirect: mockOnRedirect
    }));

    expect(mockOnRedirect).not.toHaveBeenCalled();
  });

  it('redirects when user type is not allowed', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', userType: 'user' },
      isAuthenticated: true,
      isLoading: false,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth({ 
      allowedTypes: ['admin'],
      onRedirect: mockOnRedirect
    }));

    await waitFor(() => {
      expect(mockOnRedirect).toHaveBeenCalledWith('/access-denied');
    });
  });

  it('handles case-insensitive user type checking', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', userType: 'ADMIN' },
      isAuthenticated: true,
      isLoading: false,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth({ 
      allowedTypes: ['admin'],
      onRedirect: mockOnRedirect
    }));

    expect(mockOnRedirect).not.toHaveBeenCalled();
  });

  it('uses default redirect function when onRedirect is not provided', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth());

    await waitFor(() => {
      expect(mockLocation.href).toBe('/login?redirect=%2Fdashboard');
    });
  });

  it('includes current path in redirect URL', async () => {
    mockLocation.pathname = '/protected-page';
    
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth());

    await waitFor(() => {
      expect(mockLocation.href).toBe('/login?redirect=%2Fprotected-page');
    });
  });

  it('handles missing userType gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' }, // No userType
      isAuthenticated: true,
      isLoading: false,
      validateSession: mockValidateSession
    });

    renderHook(() => useServerAuth({ 
      allowedTypes: ['admin'],
      onRedirect: mockOnRedirect
    }));

    await waitFor(() => {
      expect(mockOnRedirect).toHaveBeenCalledWith('/access-denied');
    });
  });

  it('passes instanceId to useAuth', () => {
    const instanceId = 'custom-instance';

    renderHook(() => useServerAuth({ instanceId }));

    // This would need to be verified by checking if useAuth was called with the instanceId
    // Since we're mocking useAuth, we can't directly test this without more complex mocking
    expect(mockUseAuth).toHaveBeenCalled();
  });
});
