# Framework Integration Guide

This guide explains how to integrate the Pubflow React adapter with various React frameworks.

## Table of Contents

- [Overview](#overview)
- [Remix Integration](#remix-integration)
- [Next.js Integration](#nextjs-integration)
- [Create React App Integration](#create-react-app-integration)
- [Vite Integration](#vite-integration)
- [Advanced Usage](#advanced-usage)

## Overview

The `@pubflow/react` adapter is designed to work with any React-based framework. It provides a set of hooks, components, and utilities that can be used to interact with the Pubflow API from any React application.

Key features supported across all frameworks:

- Authentication (login, logout, session validation)
- Data fetching with SWR (queries, mutations, CRUD operations)
- UI components (tables, conditional rendering)
- Schema validation

## Remix Integration

### Setup

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

### Server-Side Authentication

For server-side authentication, use Remix's loader function:

```jsx
// app/routes/dashboard.jsx
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

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
  
  // Fetch initial data
  return json({ initialData: 'some data' });
}

// Client-side component
export default function Dashboard() {
  const { initialData } = useLoaderData();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Initial data: {initialData}</p>
    </div>
  );
}
```

### Client-Side Authentication

For client-side authentication, use the `useRequireAuth` hook:

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
    </div>
  );
}
```

### Data Fetching

Use the `useBridgeQuery` hook for data fetching:

```jsx
// app/routes/users.jsx
import { useBridgeApi, useBridgeQuery } from '@pubflow/react';

export default function Users() {
  const userService = useBridgeApi({ endpoint: 'users' });
  const { data: users, isLoading, error, refetch } = useBridgeQuery(
    userService,
    'list',
    { limit: 10 }
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
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Next.js Integration

### Setup

First, install the required packages:

```bash
npm install @pubflow/core @pubflow/react swr
```

Then, create a Pubflow provider in your `_app.js` file:

```jsx
// pages/_app.js
import { PubflowProvider } from '@pubflow/react';

function MyApp({ Component, pageProps }) {
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
    >
      <Component {...pageProps} />
    </PubflowProvider>
  );
}

export default MyApp;
```

### Authentication

Use the `useRequireAuth` hook for client-side authentication:

```jsx
// pages/dashboard.js
import { useRouter } from 'next/router';
import { useRequireAuth } from '@pubflow/react';

export default function Dashboard() {
  const router = useRouter();
  
  // Client-side authentication check
  const { user, isAuthenticated, isLoading } = useRequireAuth({
    allowedTypes: ['admin', 'user'],
    redirectTo: '/login',
    redirectFn: (path) => {
      router.push(path);
    }
  });
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
    </div>
  );
}
```

### Server-Side Authentication

For server-side authentication, use Next.js's `getServerSideProps`:

```jsx
// pages/dashboard.js
import { useAuth } from '@pubflow/react';

export async function getServerSideProps({ req }) {
  // Get session token from cookie
  const token = req.cookies['pubflow_session_token'];
  
  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  // Fetch initial data
  return {
    props: {
      initialData: 'some data',
    },
  };
}

export default function Dashboard({ initialData }) {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
      <p>Initial data: {initialData}</p>
    </div>
  );
}
```

## Create React App Integration

### Setup

First, install the required packages:

```bash
npm install @pubflow/core @pubflow/react swr react-router-dom
```

Then, create a Pubflow provider in your root component:

```jsx
// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PubflowProvider } from '@pubflow/react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </PubflowProvider>
  );
}

export default App;
```

### Authentication

Use the `useRequireAuth` hook for authentication:

```jsx
// src/pages/Dashboard.js
import { useNavigate } from 'react-router-dom';
import { useRequireAuth } from '@pubflow/react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Client-side authentication check
  const { user, isAuthenticated, isLoading } = useRequireAuth({
    allowedTypes: ['admin', 'user'],
    redirectTo: '/login',
    redirectFn: (path) => {
      navigate(path);
    }
  });
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
    </div>
  );
}
```

## Vite Integration

### Setup

First, install the required packages:

```bash
npm install @pubflow/core @pubflow/react swr react-router-dom
```

Then, create a Pubflow provider in your root component:

```jsx
// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PubflowProvider } from '@pubflow/react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </PubflowProvider>
  );
}

export default App;
```

The rest of the integration is similar to Create React App.

## Advanced Usage

For more advanced usage, please refer to the specific documentation for each framework:

- [Remix Integration](./remix-integration.md)
- [Next.js Integration](./nextjs-integration.md) (coming soon)
- [Create React App Integration](./cra-integration.md) (coming soon)
- [Vite Integration](./vite-integration.md) (coming soon)
