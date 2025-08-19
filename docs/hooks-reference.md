# Hooks Reference

This document provides a comprehensive reference for all hooks available in the `@pubflow/react` package.

## Table of Contents

- [Authentication Hooks](#authentication-hooks)
  - [useAuth](#useauth)
  - [useAuthGuard](#useauthguard)
  - [useSimpleAuthGuard](#usesimpleauthguard)
- [Data Hooks](#data-hooks)
  - [useBridgeApi](#usebridgeapi)
  - [useBridgeQuery](#usebridgequery)
  - [useBridgeMutation](#usebridgemutation)
  - [useBridgeCrud](#usebridgecrud)

## Authentication Hooks

### useAuth

The `useAuth` hook provides access to authentication functionality.

#### Usage

```jsx
import { useAuth } from '@pubflow/react';

function Profile() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    validateSession,
    refreshUser
  } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| instanceId | string | Pubflow instance ID | 'default' |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| user | User \| null | Current user or null if not authenticated |
| isAuthenticated | boolean | Whether the user is authenticated |
| isLoading | boolean | Whether authentication is being checked |
| login | (credentials: { email?: string; userName?: string; password: string }) => Promise<any> | Function to log in |
| logout | () => Promise<void> | Function to log out |
| validateSession | () => Promise<{ isValid: boolean; expiresAt?: string }> | Function to validate the current session |
| refreshUser | () => Promise<User \| null> | Function to refresh user data |

### useAuthGuard

The `useAuthGuard` hook provides advanced route protection with automatic session validation and flexible redirect handling. This is a framework-agnostic hook that works with any React router.

#### Usage

**With TanStack Start:**
```jsx
import { useAuthGuard } from '@pubflow/react';
import { useNavigate } from '@tanstack/react-router';

function ProtectedPage() {
  const navigate = useNavigate();

  const { user, isAuthenticated, isLoading, isAuthorized } = useAuthGuard({
    validateOnMount: true,
    allowedTypes: ['authenticated'],
    onRedirect: (path, reason) => {
      console.log(`Redirecting to ${path} because: ${reason}`);
      navigate({ to: path });
    },
    onSessionExpired: () => {
      console.log('Session expired, cleaning up...');
    },
    enableLogging: true
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Welcome, {user?.name}!</p>
    </div>
  );
}
```

**With Next.js:**
```jsx
import { useAuthGuard } from '@pubflow/react';
import { useRouter } from 'next/router';

function AdminPanel() {
  const router = useRouter();

  const { user, isAuthorized } = useAuthGuard({
    allowedTypes: ['admin'],
    onRedirect: (path, reason) => {
      if (reason === 'unauthorized') {
        alert('Admin access required');
      }
      router.push(path);
    }
  });

  return <div>Admin Panel for {user?.name}</div>;
}
```

#### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| options | UseAuthGuardOptions | Configuration options | {} |

##### UseAuthGuardOptions

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| validateOnMount | boolean | Validate session when component mounts | true |
| allowedTypes | string[] | User types allowed to access | ['authenticated'] |
| onRedirect | (path: string, reason: string) => void | Custom redirect function | undefined |
| onSessionExpired | () => void | Callback when session expires | undefined |
| loginRedirectPath | string | Path to redirect for login | '/login' |
| accessDeniedPath | string | Path to redirect for access denied | '/access-denied' |
| enableLogging | boolean | Enable console logging | false |
| instanceId | string | Pubflow instance ID | undefined |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| user | User \| null | Current user data |
| isAuthenticated | boolean | Whether user is authenticated |
| isLoading | boolean | Whether authentication is loading |
| isAuthorized | boolean | Whether user has required permissions |
| validateSession | () => Promise<{isValid: boolean}> | Manual session validation |
| redirectReason | string \| null | Reason for redirect if applicable |

### useSimpleAuthGuard

A simplified version of `useAuthGuard` that uses `window.location` for redirects. Perfect for simple React apps without complex routing.

#### Usage

```jsx
import { useSimpleAuthGuard } from '@pubflow/react';

function Dashboard() {
  const { user, isAuthenticated, isLoading } = useSimpleAuthGuard({
    validateOnMount: true,
    allowedTypes: ['authenticated'],
    enableLogging: true
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name}!</p>
    </div>
  );
}
```

#### Parameters

Same as `useAuthGuard` except `onRedirect` is handled automatically using `window.location.href`.

#### Return Value

Same as `useAuthGuard`.

## Data Hooks

### useBridgeApi

The `useBridgeApi` hook provides access to the Bridge API service.

#### Usage

```jsx
import { useBridgeApi } from '@pubflow/react';

function UserList() {
  const userService = useBridgeApi({ endpoint: 'users' });
  
  // Use the service to fetch data
  // ...
}
```

#### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| config | EntityConfig | Entity configuration | Required |
| instanceId | string | Pubflow instance ID | 'default' |

##### EntityConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| endpoint | string | API endpoint | Required |
| basePath | string | Base path for the API | '/bridge' |

#### Return Value

Returns a `BridgeApiService<T>` instance that can be used to interact with the API.

### useBridgeQuery

The `useBridgeQuery` hook provides a way to fetch data from the API using SWR.

#### Usage

```jsx
import { useBridgeApi, useBridgeQuery } from '@pubflow/react';

function UserList() {
  const userService = useBridgeApi({ endpoint: 'users' });
  const { 
    data: users, 
    meta, 
    isLoading, 
    error, 
    refetch 
  } = useBridgeQuery(
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

#### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| service | BridgeApiService<T> | Bridge API service | Required |
| type | 'list' \| 'get' \| 'search' | Query type | Required |
| params | QueryParams<T> | Query parameters | Required |
| config | SWRConfiguration | SWR configuration | {} |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| data | T[] \| T \| null | Query result data |
| meta | { page: number; limit: number; total: number; hasMore: boolean } \| null | Pagination metadata |
| isLoading | boolean | Whether the query is loading |
| error | Error \| null | Query error |
| refetch | () => Promise<void> | Function to refetch data |

### useBridgeMutation

The `useBridgeMutation` hook provides a way to mutate data in the API.

#### Usage

```jsx
import { useBridgeApi, useBridgeMutation } from '@pubflow/react';

function CreateUser() {
  const userService = useBridgeApi({ endpoint: 'users' });
  const { 
    mutate: createUser, 
    isLoading, 
    error 
  } = useBridgeMutation(
    userService,
    'create',
    {
      successMessage: 'User created successfully',
      errorMessage: 'Failed to create user'
    }
  );
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createUser({
        name: 'John Doe',
        email: 'john@example.com'
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  return (
    <div>
      <h1>Create User</h1>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

#### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| service | BridgeApiService<T> | Bridge API service | Required |
| type | 'create' \| 'update' \| 'delete' | Mutation type | Required |
| defaultOptions | MutationOptions | Default mutation options | {} |

##### MutationOptions

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| invalidateQueries | boolean | Whether to invalidate queries after mutation | true |
| successMessage | string | Success message | undefined |
| errorMessage | string | Error message | undefined |
| onSuccess | (data: any) => void | Success callback | undefined |
| onError | (error: Error) => void | Error callback | undefined |
| showAlerts | boolean | Whether to show alerts for success/error | false |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| mutate | (params: MutationParams<T, M>, options?: MutationOptions) => Promise<MutationResult<T, M>> | Function to perform the mutation |
| isLoading | boolean | Whether the mutation is loading |
| error | Error \| null | Mutation error |
| reset | () => void | Function to reset the mutation state |

### useBridgeCrud

The `useBridgeCrud` hook provides a complete CRUD interface for an entity.

#### Usage

```jsx
import { useBridgeCrud } from '@pubflow/react';

function UserManagement() {
  const {
    items: users,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refresh,
    page,
    setPage,
    limit,
    setLimit,
    totalItems,
    hasMore
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
  
  // Implement UI for CRUD operations
  // ...
}
```

For a complete reference of the `useBridgeCrud` hook, please refer to the [CRUD Reference](./crud-reference.md) document.
