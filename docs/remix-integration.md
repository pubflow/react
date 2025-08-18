# Remix Integration Guide

This guide explains how to integrate Pubflow with Remix.

## Table of Contents

- [Setup](#setup)
- [Authentication](#authentication)
  - [Server-Side Authentication](#server-side-authentication)
  - [Client-Side Authentication](#client-side-authentication)
- [Data Fetching](#data-fetching)
  - [Server-Side Data Fetching](#server-side-data-fetching)
  - [Client-Side Data Fetching](#client-side-data-fetching)
- [Forms and Mutations](#forms-and-mutations)
- [Advanced Usage](#advanced-usage)
  - [Error Handling](#error-handling)
  - [Nested Routes](#nested-routes)
  - [Resource Routes](#resource-routes)

## Setup

First, install the required packages:

```bash
npm install @pubflow/core @pubflow/react swr
```

Then, create a Pubflow provider in your root component:

```jsx
// app/root.jsx
import { PubflowProvider } from '@pubflow/react';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <PubflowProvider
          config={{
            baseUrl: 'https://api.example.com',
            bridgeBasePath: '/bridge',
            authBasePath: '/auth'
          }}
        >
          <Outlet />
        </PubflowProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
```

## Authentication

Remix provides both server-side and client-side authentication capabilities. Pubflow can be integrated with both approaches.

### Server-Side Authentication

For server-side authentication, you can use Remix's loader function to check authentication:

```jsx
// app/routes/dashboard.jsx
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { initConfig, ApiClient, AuthService } from '@pubflow/core';
import { BrowserStorageAdapter } from '@pubflow/react';

// Helper function to parse cookies
function parseCookie(cookieHeader) {
  if (!cookieHeader) return {};
  
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

// Server-side authentication check
export async function loader({ request }) {
  // Get session token from cookie
  const cookieHeader = request.headers.get('Cookie');
  const cookies = parseCookie(cookieHeader);
  const token = cookies['pubflow_session_token'];
  
  if (!token) {
    return redirect('/login');
  }
  
  try {
    // Initialize Pubflow
    const config = initConfig({
      baseUrl: 'https://api.example.com',
      bridgeBasePath: '/bridge',
      authBasePath: '/auth'
    });
    
    // Create API client
    const apiClient = new ApiClient(config);
    
    // Set token
    apiClient.setToken(token);
    
    // Validate session
    const response = await apiClient.get('/auth/validate');
    
    if (!response.isValid) {
      return redirect('/login');
    }
    
    // Fetch user data
    const userData = response.user;
    
    // Check user type if needed
    if (userData.userType !== 'admin' && userData.userType !== 'user') {
      return redirect('/access-denied');
    }
    
    // Fetch additional data
    const dashboardData = await apiClient.get('/bridge/dashboard');
    
    return json({
      user: userData,
      dashboardData
    });
  } catch (error) {
    return redirect('/login');
  }
}

// Client-side component
export default function Dashboard() {
  const { user, dashboardData } = useLoaderData();
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <div>
        {/* Dashboard content using dashboardData */}
      </div>
    </div>
  );
}
```

### Client-Side Authentication

For client-side authentication, you can use the `useRequireAuth` hook:

```jsx
// app/routes/admin.jsx
import { useRequireAuth } from '@pubflow/react';

export default function Admin() {
  // Client-side authentication check
  const { user, isAuthenticated, isLoading } = useRequireAuth({
    allowedTypes: 'admin',
    redirectTo: '/login',
    redirectFn: (path) => {
      window.location.href = path;
    }
  });
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
      {/* Admin content */}
    </div>
  );
}
```

## Data Fetching

Remix provides both server-side and client-side data fetching capabilities. Pubflow can be integrated with both approaches.

### Server-Side Data Fetching

For server-side data fetching, you can use Remix's loader function:

```jsx
// app/routes/users.jsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { initConfig, ApiClient } from '@pubflow/core';

export async function loader({ request }) {
  // Initialize Pubflow
  const config = initConfig({
    baseUrl: 'https://api.example.com',
    bridgeBasePath: '/bridge',
    authBasePath: '/auth'
  });
  
  // Create API client
  const apiClient = new ApiClient(config);
  
  // Get token from cookie
  const cookieHeader = request.headers.get('Cookie');
  const cookies = parseCookie(cookieHeader);
  const token = cookies['pubflow_session_token'];
  
  if (token) {
    apiClient.setToken(token);
  }
  
  try {
    // Fetch users
    const response = await apiClient.get('/bridge/users', {
      limit: 10,
      page: 1
    });
    
    return json({
      users: response.data,
      meta: response.meta
    });
  } catch (error) {
    return json({
      users: [],
      meta: { total: 0, page: 1, limit: 10, hasMore: false },
      error: error.message
    });
  }
}

export default function Users() {
  const { users, meta, error } = useLoaderData();
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <div>
        Showing {users.length} of {meta.total} users
      </div>
    </div>
  );
}
```

### Client-Side Data Fetching

For client-side data fetching, you can use the `useBridgeQuery` hook:

```jsx
// app/routes/users/client.jsx
import { useBridgeApi, useBridgeQuery } from '@pubflow/react';

export default function ClientUsers() {
  const userService = useBridgeApi({ endpoint: 'users' });
  const { data: users, meta, isLoading, error, refetch } = useBridgeQuery(
    userService,
    'list',
    { limit: 10, page: 1 }
  );
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return (
      <div>
        <div>Error: {error.message}</div>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Users (Client-Side)</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
      <div>
        Showing {users.length} of {meta.total} users
      </div>
    </div>
  );
}
```

## Forms and Mutations

Remix provides both server-side and client-side form handling. Pubflow can be integrated with both approaches.

### Server-Side Form Handling

```jsx
// app/routes/users/new.jsx
import { redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';
import { initConfig, ApiClient } from '@pubflow/core';

export async function action({ request }) {
  // Get form data
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  
  // Initialize Pubflow
  const config = initConfig({
    baseUrl: 'https://api.example.com',
    bridgeBasePath: '/bridge',
    authBasePath: '/auth'
  });
  
  // Create API client
  const apiClient = new ApiClient(config);
  
  // Get token from cookie
  const cookieHeader = request.headers.get('Cookie');
  const cookies = parseCookie(cookieHeader);
  const token = cookies['pubflow_session_token'];
  
  if (token) {
    apiClient.setToken(token);
  }
  
  try {
    // Create user
    await apiClient.post('/bridge/users', {
      name,
      email
    });
    
    return redirect('/users');
  } catch (error) {
    return json({
      error: error.message
    });
  }
}

export default function NewUser() {
  return (
    <div>
      <h1>New User</h1>
      <Form method="post">
        <div>
          <label>
            Name:
            <input type="text" name="name" />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input type="email" name="email" />
          </label>
        </div>
        <button type="submit">Create User</button>
      </Form>
    </div>
  );
}
```

### Client-Side Form Handling

```jsx
// app/routes/users/new-client.jsx
import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { useBridgeApi, useBridgeMutation } from '@pubflow/react';

export default function NewClientUser() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const userService = useBridgeApi({ endpoint: 'users' });
  const { mutate, isLoading, error } = useBridgeMutation(
    userService,
    'create',
    {
      successMessage: 'User created successfully',
      errorMessage: 'Failed to create user',
      onSuccess: () => {
        navigate('/users');
      }
    }
  );
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await mutate({
        name,
        email
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  return (
    <div>
      <h1>New User (Client-Side)</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create User'}
        </button>
        {error && <div>Error: {error.message}</div>}
      </form>
    </div>
  );
}
```

## Advanced Usage

### Error Handling

Remix provides error boundaries for handling errors. You can integrate Pubflow with Remix's error handling:

```jsx
// app/routes/users.jsx
import { json } from '@remix-run/node';
import { useLoaderData, useCatch, ErrorBoundary } from '@remix-run/react';
import { useBridgeApi, useBridgeQuery } from '@pubflow/react';

export function ErrorBoundary({ error }) {
  return (
    <div>
      <h1>Error</h1>
      <p>{error.message}</p>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  
  return (
    <div>
      <h1>Caught</h1>
      <p>Status: {caught.status}</p>
      <p>Message: {caught.data.message}</p>
    </div>
  );
}

export default function Users() {
  // Component implementation...
}
```

For more information on Remix, visit the [Remix documentation](https://remix.run/docs/en/main).
