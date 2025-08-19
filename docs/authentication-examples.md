# Authentication Examples

This document provides practical examples of using authentication features in the `@pubflow/react` package.

## Table of Contents

- [Basic Authentication](#basic-authentication)
- [Route Protection](#route-protection)
- [User Type Restrictions](#user-type-restrictions)
- [Session Management](#session-management)
- [Error Handling](#error-handling)
- [Framework-Specific Examples](#framework-specific-examples)

## Basic Authentication

### Simple Login Component

```jsx
import { useState } from 'react';
import { useAuth } from '@pubflow/react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      // Success - user state will update automatically
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### User Profile Display

```jsx
import { useAuth } from '@pubflow/react';

function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <p><strong>Name:</strong> {user?.name}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>User Type:</strong> {user?.userType}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Route Protection

### Protected Dashboard

```jsx
import { useAuthGuard } from '@pubflow/react';
import { useNavigate } from 'react-router-dom'; // or your router

function Dashboard() {
  const navigate = useNavigate();
  
  const { user, isLoading } = useAuthGuard({
    validateOnMount: true,
    allowedTypes: ['authenticated'],
    onRedirect: (path, reason) => {
      console.log(`Redirecting to ${path} because: ${reason}`);
      navigate(path);
    },
    enableLogging: true
  });

  if (isLoading) {
    return (
      <div className="loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome back, {user?.name}!</p>
      <div>
        {/* Dashboard content */}
      </div>
    </div>
  );
}
```

### Simple Route Protection (No Router)

```jsx
import { useSimpleAuthGuard } from '@pubflow/react';

function ProtectedPage() {
  const { user, isLoading } = useSimpleAuthGuard({
    validateOnMount: true,
    enableLogging: true
  });

  if (isLoading) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Hello, {user?.name}!</p>
    </div>
  );
}
```

## User Type Restrictions

### Admin-Only Component

```jsx
import { useAuthGuard } from '@pubflow/react';

function AdminPanel() {
  const { user, isAuthorized } = useAuthGuard({
    allowedTypes: ['admin'],
    onRedirect: (path, reason) => {
      if (reason === 'unauthorized') {
        alert('Admin access required');
      }
      window.location.href = path;
    }
  });

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Welcome, Admin {user?.name}!</p>
      <div>
        {/* Admin-only content */}
      </div>
    </div>
  );
}
```

### Multi-Role Access

```jsx
import { useAuthGuard } from '@pubflow/react';

function TeacherOrAdminPage() {
  const { user, isAuthorized } = useAuthGuard({
    allowedTypes: ['admin', 'teacher'],
    onRedirect: (path, reason) => {
      if (reason === 'unauthorized') {
        alert('Teacher or Admin access required');
      }
      window.location.href = path;
    }
  });

  return (
    <div>
      <h1>Staff Area</h1>
      <p>Welcome, {user?.name}!</p>
      <p>Your role: {user?.userType}</p>
      
      {user?.userType === 'admin' && (
        <div>
          <h2>Admin Tools</h2>
          {/* Admin-specific content */}
        </div>
      )}
      
      {user?.userType === 'teacher' && (
        <div>
          <h2>Teacher Tools</h2>
          {/* Teacher-specific content */}
        </div>
      )}
    </div>
  );
}
```

## Session Management

### Manual Session Validation

```jsx
import { useAuth } from '@pubflow/react';
import { useState } from 'react';

function SessionManager() {
  const { validateSession } = useAuth();
  const [sessionStatus, setSessionStatus] = useState('unknown');

  const checkSession = async () => {
    const result = await validateSession();
    setSessionStatus(result.isValid ? 'valid' : 'invalid');
    
    if (!result.isValid) {
      alert('Your session has expired. Please log in again.');
    }
  };

  return (
    <div>
      <h3>Session Management</h3>
      <p>Session Status: {sessionStatus}</p>
      <button onClick={checkSession}>
        Check Session
      </button>
    </div>
  );
}
```

### Automatic Session Monitoring

```jsx
import { useAuthGuard } from '@pubflow/react';
import { useEffect } from 'react';

function AutoSessionMonitor() {
  const { validateSession } = useAuthGuard({
    validateOnMount: true,
    onSessionExpired: () => {
      console.log('Session expired, cleaning up...');
      // Clear any local data
      localStorage.removeItem('user-preferences');
    }
  });

  // Check session every 5 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await validateSession();
      if (!result.isValid) {
        console.log('Session validation failed');
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [validateSession]);

  return (
    <div>
      <h3>Auto Session Monitor</h3>
      <p>Session is being monitored automatically</p>
    </div>
  );
}
```

## Error Handling

### Comprehensive Error Handling

```jsx
import { useAuth } from '@pubflow/react';
import { useState } from 'react';

function LoginWithErrorHandling() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError('');

    try {
      const result = await login(credentials);
      
      if (!result.success) {
        // Handle different error types
        switch (result.error) {
          case 'Invalid credentials':
            setError('Email or password is incorrect');
            break;
          case 'Account locked':
            setError('Your account has been temporarily locked');
            break;
          case 'Email not verified':
            setError('Please verify your email before logging in');
            break;
          default:
            setError(result.error || 'Login failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}
      {/* Login form */}
    </div>
  );
}
```

## Framework-Specific Examples

### TanStack Start Example

```tsx
// src/routes/protected.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthGuard } from '@pubflow/react';

export const Route = createFileRoute('/protected')({
  component: ProtectedPage,
});

function ProtectedPage() {
  const navigate = useNavigate();
  
  const { user, isLoading } = useAuthGuard({
    onRedirect: (path, reason) => {
      navigate({ to: path });
    }
  });

  if (isLoading) return <div>Loading...</div>;
  
  return <div>Protected content for {user?.name}</div>;
}
```

### Next.js Example

```jsx
// pages/dashboard.js
import { useRouter } from 'next/router';
import { useAuthGuard } from '@pubflow/react';

export default function Dashboard() {
  const router = useRouter();
  
  const { user } = useAuthGuard({
    onRedirect: (path) => router.push(path)
  });

  return <div>Dashboard for {user?.name}</div>;
}
```

### React Router Example

```jsx
// src/pages/Dashboard.jsx
import { useNavigate } from 'react-router-dom';
import { useAuthGuard } from '@pubflow/react';

function Dashboard() {
  const navigate = useNavigate();
  
  const { user } = useAuthGuard({
    onRedirect: (path) => navigate(path)
  });

  return <div>Dashboard for {user?.name}</div>;
}
```
