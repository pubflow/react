# @pubflow/react

React adapter for the Pubflow framework with support for any React-based framework.

## Features

- Complete React integration for Pubflow
- SWR for data fetching and caching
- Framework-agnostic design (works with any React framework)
- Support for Remix, Next.js, Create React App, and more
- Optimized for React 17+
- TypeScript support
- Customizable components

## Installation

```bash
# Install the core package and React adapter
npm install @pubflow/core @pubflow/react

# Install SWR (required)
npm install swr

# Optional: Install Zod for schema validation
npm install zod
```

## Basic Usage

### Provider Setup

Wrap your application with the `PubflowProvider`:

```jsx
// App.jsx
import React from 'react';
import { PubflowProvider } from '@pubflow/react';

function App() {
  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
    >
      <YourApp />
    </PubflowProvider>
  );
}

export default App;
```

### Authentication

Use the `useAuth` hook to access authentication functionality:

```jsx
// Login.jsx
import React, { useState } from 'react';
import { useAuth } from '@pubflow/react';

function Login() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await login({ email, password });

      if (result.success) {
        // Redirect to dashboard
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default Login;
```

### Data Fetching with SWR

Use the `useBridgeQuery` hook to fetch data:

```jsx
// UserList.jsx
import React from 'react';
import { useBridgeApi, useBridgeQuery } from '@pubflow/react';

function UserList() {
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

export default UserList;
```

### CRUD Operations

Use the `useBridgeCrud` hook for complete CRUD operations:

```jsx
// UserManagement.jsx
import React, { useState } from 'react';
import { useBridgeCrud } from '@pubflow/react';

function UserManagement() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const {
    items: users,
    createItem,
    updateItem,
    deleteItem,
    loading,
    error
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    },
    successMessages: {
      create: 'User created successfully',
      update: 'User updated successfully',
      delete: 'User deleted successfully'
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createItem(formData);
      setFormData({ name: '', email: '' });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <div>
      <h1>User Management</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Name"
        />
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>

      {error && <div>Error: {error.message}</div>}

      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
            <button onClick={() => deleteItem(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserManagement;
```

## Persistent Cache

Pubflow supports persistent caching to improve performance and offline experience:

```jsx
import { PubflowProvider, createPersistentCache } from '@pubflow/react';

function App() {
  // Create a persistent cache provider
  const persistentCacheProvider = createPersistentCache({
    prefix: 'my_app_cache',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  });

  return (
    <PubflowProvider
      config={{
        baseUrl: 'https://api.example.com',
        bridgeBasePath: '/bridge',
        authBasePath: '/auth'
      }}
      persistentCache={{
        enabled: true,
        provider: persistentCacheProvider
      }}
    >
      <YourApp />
    </PubflowProvider>
  );
}
```

For more information, see the [Persistent Cache](./docs/persistent-cache.md) documentation.

## BridgeForm Component

Pubflow provides a powerful form component that integrates with Zod schemas and Bridge API:

```jsx
import { BridgeForm } from '@pubflow/react';
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin'], 'Role must be either user or admin')
});

function CreateUser() {
  return (
    <div>
      <h1>Create User</h1>
      <BridgeForm
        schema={userSchema}
        mode="create"
        entityConfig={{ endpoint: 'users' }}
        mainColor="#c30000"
        onSuccess={(data) => {
          console.log('User created:', data);
          // Navigate or show success message
        }}
      />
    </div>
  );
}
```

For more information, see the [BridgeForm documentation](./docs/bridge-form.md).

## Schema Validation

Pubflow recommends defining schemas at the application level, not in the adapter:

```jsx
// lib/schemas/user.js
import { z } from 'zod';

// Schema for complete user entity
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin'], 'Role must be either user or admin')
});

// Schema for creating a user
export const createUserSchema = userSchema.omit({
  id: true
});

// Schema for updating a user
export const updateUserSchema = userSchema
  .partial()
  .extend({
    id: z.string().uuid()
  });

// TypeScript types inferred from schemas
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
```

These schemas can then be used with Pubflow's CRUD operations:

```jsx
import { useBridgeCrud } from '@pubflow/react';
import { userSchema, createUserSchema, updateUserSchema } from '../lib/schemas/user';

function UsersPage() {
  const {
    items: users,
    createItem,
    updateItem,
    deleteItem,
    validationErrors
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    },
    schemas: {
      entity: userSchema,
      create: createUserSchema,
      update: updateUserSchema
    }
  });

  // Component implementation...
}
```

## Framework Integration

Pubflow is designed to work with any React-based framework. Here are examples for popular frameworks:

For detailed Remix integration, see the [Remix Integration Guide](./docs/remix-integration.md).

### Remix Integration

```jsx
// app/routes/dashboard.jsx
import { useLoaderData, redirect } from '@remix-run/react';
import { json } from '@remix-run/node';
import { useRequireAuth } from '@pubflow/react';

// Server-side authentication check
export async function loader({ request }) {
  // Get session from cookie
  const cookieHeader = request.headers.get('Cookie');
  const token = parseCookie(cookieHeader)['pubflow_session_token'];

  if (!token) {
    return redirect('/login');
  }

  // You can also fetch initial data here
  return json({ initialData: 'some data' });
}

// Client-side component
export default function Dashboard() {
  const { initialData } = useLoaderData();

  // Client-side authentication check
  useRequireAuth({
    allowedTypes: ['admin', 'user'],
    redirectTo: '/login',
    // Use Remix's navigate function
    redirectFn: (path) => {
      window.location.href = path;
    }
  });

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### Next.js Integration

```jsx
// pages/dashboard.jsx
import { useRouter } from 'next/router';
import { useRequireAuth } from '@pubflow/react';

export default function Dashboard() {
  const router = useRouter();

  // Client-side authentication check
  useRequireAuth({
    allowedTypes: ['admin', 'user'],
    redirectTo: '/login',
    // Use Next.js router
    redirectFn: (path) => {
      router.push(path);
    }
  });

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### Create React App Integration

```jsx
// src/pages/Dashboard.jsx
import { useNavigate } from 'react-router-dom';
import { useRequireAuth } from '@pubflow/react';

export default function Dashboard() {
  const navigate = useNavigate();

  // Client-side authentication check
  useRequireAuth({
    allowedTypes: ['admin', 'user'],
    redirectTo: '/login',
    // Use React Router's navigate function
    redirectFn: (path) => {
      navigate(path);
    }
  });

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

## Components

### BridgeView

The `BridgeView` component conditionally renders content based on authentication and user type:

```jsx
import { BridgeView } from '@pubflow/react';

// Basic example
<BridgeView>
  <div>This content is only visible to authenticated users</div>
</BridgeView>

// Only for admins
<BridgeView
  allowedTypes="admin"
  fallback={<div>You don't have permission to view this content</div>}
>
  <div>This content is only visible to admins</div>
</BridgeView>

// Multiple user types
<BridgeView
  allowedTypes={['admin', 'editor']}
  loadingComponent={<div>Loading...</div>}
  onUnauthorized={() => console.log('User not authorized')}
>
  <div>This content is visible to admins and editors</div>
</BridgeView>
```

### BridgeTable

The `BridgeTable` component displays data in a table with sorting, filtering, and pagination:

```jsx
import { BridgeTable } from '@pubflow/react';

<BridgeTable
  columns={[
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role', sortable: true },
    {
      key: 'createdAt',
      header: 'Created At',
      cell: (item) => new Date(item.createdAt).toLocaleDateString(),
      sortable: true
    }
  ]}
  entityConfig={{
    endpoint: 'users'
  }}
  showSearch={true}
  showPagination={true}
  onRowClick={(user) => console.log('Selected user:', user)}
  actions={(user) => (
    <button onClick={() => handleDelete(user.id)}>Delete</button>
  )}
/>
```

## License

AGPL-3.0-or-later