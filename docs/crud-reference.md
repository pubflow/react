# CRUD Reference

This document provides a comprehensive reference for the CRUD functionality in the `@pubflow/react` package.

## Table of Contents

- [useBridgeCrud Hook](#usebridgecrud-hook)
  - [Usage](#usage)
  - [Parameters](#parameters)
  - [Return Value](#return-value)
- [Schema Validation](#schema-validation)
  - [Using Zod](#using-zod)
  - [Using Other Validation Libraries](#using-other-validation-libraries)
- [Advanced Usage](#advanced-usage)
  - [Custom Notifications](#custom-notifications)
  - [Optimistic Updates](#optimistic-updates)
  - [Offline Support](#offline-support)

## useBridgeCrud Hook

The `useBridgeCrud` hook provides a complete CRUD interface for an entity.

### Usage

```jsx
import { useBridgeCrud } from '@pubflow/react';
import { userSchema, createUserSchema, updateUserSchema } from '../lib/schemas/user';

function UserManagement() {
  const {
    // Data
    items: users,
    selectedItem,
    totalItems,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Errors
    error,
    validationErrors,
    
    // Pagination
    page,
    limit,
    hasMore,
    setPage,
    setLimit,
    
    // Sorting
    orderBy,
    orderDir,
    setSort,
    
    // Search
    searchTerm,
    setSearchTerm,
    filters,
    addFilter,
    removeFilter,
    resetFilters,
    
    // CRUD operations
    getItem,
    createItem,
    updateItem,
    deleteItem,
    
    // Refresh
    refresh,
    
    // Selection
    selectItem
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    },
    schemas: {
      entity: userSchema,
      create: createUserSchema,
      update: updateUserSchema
    },
    successMessages: {
      create: 'User created successfully',
      update: 'User updated successfully',
      delete: 'User deleted successfully'
    },
    errorMessages: {
      create: 'Failed to create user',
      update: 'Failed to update user',
      delete: 'Failed to delete user',
      fetch: 'Failed to fetch users'
    },
    notificationConfig: {
      autoNotify: true,
      showNotification: (message, type) => {
        // Custom notification logic
        console.log(`${type}: ${message}`);
      }
    },
    searchConfig: {
      initialSearchTerm: '',
      initialFilters: [],
      initialSort: { field: 'name', direction: 'asc' },
      initialPage: 1,
      initialLimit: 10
    }
  });
  
  // Implement UI for CRUD operations
  // ...
}
```

### Parameters

The `useBridgeCrud` hook accepts a single object parameter with the following properties:

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| entityConfig | EntityConfig | Entity configuration | Required |
| instanceId | string | Pubflow instance ID | 'default' |
| schemas | EntitySchemas<T, U, V> | Entity schemas | undefined |
| searchConfig | SearchConfig | Search configuration | {} |
| successMessages | SuccessMessages | Success messages | {} |
| errorMessages | ErrorMessages | Error messages | {} |
| notificationConfig | NotificationConfig | Notification configuration | { autoNotify: true } |

#### EntityConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| endpoint | string | API endpoint | Required |
| basePath | string | Base path for the API | '/bridge' |

#### EntitySchemas<T, U, V>

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| entity | any | Schema for the complete entity | undefined |
| create | any | Schema for creating an entity | undefined |
| update | any | Schema for updating an entity | undefined |

#### SearchConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| initialSearchTerm | string | Initial search term | '' |
| initialFilters | Array<{ field: string; operator: string; value: any }> | Initial filters | [] |
| initialSort | { field: string; direction: 'asc' \| 'desc' } | Initial sort | undefined |
| initialPage | number | Initial page | 1 |
| initialLimit | number | Initial limit | 10 |
| searchFields | string[] | Fields to search | undefined |
| debounceMs | number | Debounce time in milliseconds | undefined |
| autoSearch | boolean | Whether to search automatically | true |

#### SuccessMessages

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| create | string | Success message for create operation | undefined |
| update | string | Success message for update operation | undefined |
| delete | string | Success message for delete operation | undefined |

#### ErrorMessages

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| create | string | Error message for create operation | undefined |
| update | string | Error message for update operation | undefined |
| delete | string | Error message for delete operation | undefined |
| fetch | string | Error message for fetch operation | undefined |

#### NotificationConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| autoNotify | boolean | Whether to show notifications automatically | true |
| showNotification | (message: string, type: 'success' \| 'error') => void | Function to show notifications | undefined |

### Return Value

The `useBridgeCrud` hook returns an object with the following properties:

#### Data

| Property | Type | Description |
|----------|------|-------------|
| items | T[] | List of items |
| selectedItem | T \| null | Selected item |
| totalItems | number | Total number of items |

#### Loading States

| Property | Type | Description |
|----------|------|-------------|
| loading | boolean | Whether data is being loaded |
| creating | boolean | Whether an item is being created |
| updating | boolean | Whether an item is being updated |
| deleting | boolean | Whether an item is being deleted |

#### Errors

| Property | Type | Description |
|----------|------|-------------|
| error | Error \| null | Error object |
| validationErrors | Record<string, string[]> \| null | Validation errors |

#### Pagination

| Property | Type | Description |
|----------|------|-------------|
| page | number | Current page |
| limit | number | Items per page |
| hasMore | boolean | Whether there are more pages |
| setPage | (page: number) => void | Function to set the current page |
| setLimit | (limit: number) => void | Function to set the items per page |

#### Sorting

| Property | Type | Description |
|----------|------|-------------|
| orderBy | string \| undefined | Field to sort by |
| orderDir | 'asc' \| 'desc' \| undefined | Sort direction |
| setSort | (field: string, direction?: 'asc' \| 'desc') => void | Function to set the sort |

#### Search

| Property | Type | Description |
|----------|------|-------------|
| searchTerm | string | Search term |
| setSearchTerm | (term: string) => void | Function to set the search term |
| filters | Array<{ field: string; operator: string; value: any }> | Active filters |
| addFilter | (field: string, operator: string, value: any) => void | Function to add a filter |
| removeFilter | (field: string) => void | Function to remove a filter |
| resetFilters | () => void | Function to reset all filters |

#### CRUD Operations

| Property | Type | Description |
|----------|------|-------------|
| getItem | (id: string) => Promise<T> | Function to get an item by ID |
| createItem | (data: Partial<T>, options?: MutationOptions) => Promise<T> | Function to create an item |
| updateItem | (id: string, data: Partial<T>, options?: MutationOptions) => Promise<T> | Function to update an item |
| deleteItem | (id: string, options?: MutationOptions) => Promise<void> | Function to delete an item |

#### Other

| Property | Type | Description |
|----------|------|-------------|
| refresh | () => Promise<void> | Function to refresh the data |
| selectItem | (item: T \| null) => void | Function to select an item |

## Schema Validation

The `useBridgeCrud` hook supports schema validation through the `schemas` parameter. You can use any validation library that returns a validation result with a `success` property and an `errors` property.

### Using Zod

[Zod](https://github.com/colinhacks/zod) is a TypeScript-first schema validation library that works well with Pubflow.

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

Then, use these schemas with the `useBridgeCrud` hook:

```jsx
import { useBridgeCrud } from '@pubflow/react';
import { userSchema, createUserSchema, updateUserSchema } from '../lib/schemas/user';

function UserManagement() {
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
  
  // Implement UI for CRUD operations
  // ...
}
```

### Using Other Validation Libraries

You can use any validation library that returns a validation result with a `success` property and an `errors` property. If your validation library doesn't match this format, you can create an adapter function.

## Advanced Usage

### Custom Notifications

You can provide a custom notification function to handle success and error messages:

```jsx
import { useBridgeCrud } from '@pubflow/react';
import { toast } from 'react-toastify';

function UserManagement() {
  const { items: users, createItem, updateItem, deleteItem } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    },
    successMessages: {
      create: 'User created successfully',
      update: 'User updated successfully',
      delete: 'User deleted successfully'
    },
    errorMessages: {
      create: 'Failed to create user',
      update: 'Failed to update user',
      delete: 'Failed to delete user'
    },
    notificationConfig: {
      autoNotify: true,
      showNotification: (message, type) => {
        if (type === 'success') {
          toast.success(message);
        } else {
          toast.error(message);
        }
      }
    }
  });
  
  // Implement UI for CRUD operations
  // ...
}
```

### Optimistic Updates

You can perform optimistic updates by manually updating the cache:

```jsx
import { useBridgeCrud } from '@pubflow/react';

function UserManagement() {
  const { items: users, updateItem } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    }
  });
  
  const handleToggleActive = async (user) => {
    try {
      // Optimistic update
      const updatedUser = { ...user, isActive: !user.isActive };
      
      // Update the item
      await updateItem(user.id, { isActive: !user.isActive }, {
        // Disable automatic cache invalidation
        invalidateQueries: false,
        // Manually update the cache
        onSuccess: () => {
          // Cache is already updated optimistically
        }
      });
    } catch (error) {
      // Handle error
      console.error('Failed to toggle active status:', error);
    }
  };
  
  // Implement UI for CRUD operations
  // ...
}
```

### Offline Support

The `useBridgeCrud` hook supports offline operations through the `offlineConfig` parameter:

```jsx
import { useBridgeCrud } from '@pubflow/react';

function UserManagement() {
  const { 
    items: users, 
    createItem, 
    updateItem, 
    deleteItem,
    isOffline
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    },
    offlineConfig: {
      queueMutations: true,
      showOfflineAlerts: true
    }
  });
  
  // Implement UI for CRUD operations
  // ...
}
```

For more information on offline support, please refer to the [Offline Support](./offline-support.md) document.
