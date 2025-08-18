# Components Reference

This document provides a comprehensive reference for all components available in the `@pubflow/react` package.

## Table of Contents

- [BridgeForm](#bridgeform)
- [BridgeView](#bridgeview)
- [BridgeTable](#bridgetable)

## BridgeForm

The `BridgeForm` component provides an easy way to create forms that automatically connect to your API through the Bridge API. It integrates with Zod schemas for validation and uses `useBridgeCrud` for data operations.

### Usage

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

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| schema | z.ZodType<T> | Zod schema for validation | Required |
| mode | 'create' \| 'update' \| 'partial' | Form mode | Required |
| entityConfig | EntityConfig | Entity configuration | Required |
| instanceId | string | Pubflow instance ID | 'default' |
| initialData | Partial<T> | Initial data (for update/partial mode) | undefined |
| id | string | Record ID (for update/partial mode) | undefined |
| fields | FieldConfig[] | Fields to display | All schema fields |
| layout | object | Layout configuration | undefined |
| onSuccess | (data: T) => void | Success callback | undefined |
| onError | (error: Error) => void | Error callback | undefined |
| onCancel | () => void | Cancel callback | undefined |
| labels | object | Custom labels | {} |
| theme | 'light' \| 'dark' \| 'auto' | Theme | 'auto' |
| mainColor | string | Main color for the form | undefined |
| className | string | Custom CSS class | undefined |
| style | CSSProperties | Inline styles | undefined |
| customStyles | object | Custom styles for form elements | {} |

For more detailed information, see the [BridgeForm documentation](./bridge-form.md).

## BridgeView

The `BridgeView` component conditionally renders content based on authentication and user type.

### Usage

```jsx
import { BridgeView } from '@pubflow/react';

// Basic example - only visible to authenticated users
function AuthenticatedContent() {
  return (
    <BridgeView>
      <div>This content is only visible to authenticated users</div>
    </BridgeView>
  );
}

// Only visible to admins
function AdminContent() {
  return (
    <BridgeView
      allowedTypes="admin"
      fallback={<div>You don't have permission to view this content</div>}
    >
      <div>This content is only visible to admins</div>
    </BridgeView>
  );
}

// Multiple user types with loading state
function EditorContent() {
  return (
    <BridgeView
      allowedTypes={['admin', 'editor']}
      loadingComponent={<div>Loading...</div>}
      onUnauthorized={() => console.log('User not authorized')}
    >
      <div>This content is visible to admins and editors</div>
    </BridgeView>
  );
}
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| children | React.ReactNode | Content to render if conditions are met | Required |
| allowedTypes | string \| string[] | User types allowed to view the content | ['authenticated'] |
| fallback | React.ReactNode | Content to render if conditions are not met | null |
| loadingComponent | React.ReactNode | Loading component | null |
| onUnauthorized | () => void | Callback when user is not authorized | undefined |
| instanceId | string | Pubflow instance ID | 'default' |

## BridgeTable

The `BridgeTable` component displays data in a table with sorting, filtering, and pagination.

### Usage

```jsx
import { BridgeTable } from '@pubflow/react';

function UserTable() {
  const handleDelete = (id) => {
    // Delete user logic
    console.log(`Delete user with ID: ${id}`);
  };

  return (
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
  );
}
```

### Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| columns | ColumnDef<T>[] | Column definitions | Required |
| entityConfig | EntityConfig | Entity configuration | Required |
| showPagination | boolean | Whether to show pagination | true |
| showSearch | boolean | Whether to show search | true |
| showFilters | boolean | Whether to show filters | true |
| rowKey | (item: T) => string | Function to get row key | (item) => item.id |
| onRowClick | (item: T) => void | Row click handler | undefined |
| className | string | Table class name | undefined |
| loadingComponent | React.ReactNode | Loading component | Default loading component |
| emptyComponent | React.ReactNode | Empty component | Default empty component |
| errorComponent | React.ReactNode | Error component | Default error component |
| paginationComponent | React.ReactNode | Pagination component | Default pagination component |
| searchComponent | React.ReactNode | Search component | Default search component |
| filterComponent | React.ReactNode | Filter component | Default filter component |
| searchPlaceholder | string | Search placeholder | 'Search...' |
| actions | (item: T) => React.ReactNode | Actions renderer | undefined |
| instanceId | string | Pubflow instance ID | 'default' |
| schemas | EntitySchemas<T, U, V> | Entity schemas | undefined |
| searchConfig | SearchConfig | Search configuration | {} |
| successMessages | SuccessMessages | Success messages | {} |
| errorMessages | ErrorMessages | Error messages | {} |
| notificationConfig | NotificationConfig | Notification configuration | { autoNotify: true } |

#### ColumnDef<T>

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| key | string | Column key | Required |
| header | React.ReactNode | Column header | Required |
| cell | (item: T, index: number) => React.ReactNode | Cell renderer | undefined |
| sortable | boolean | Whether the column is sortable | false |
| filterable | boolean | Whether the column is filterable | true |
| width | string \| number | Column width | undefined |
| align | 'left' \| 'center' \| 'right' | Column alignment | 'left' |

#### EntityConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| endpoint | string | API endpoint | Required |
| basePath | string | Base path for the API | '/bridge' |

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

#### EntitySchemas<T, U, V>

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| entity | any | Schema for the complete entity | undefined |
| create | any | Schema for creating an entity | undefined |
| update | any | Schema for updating an entity | undefined |

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

The `BridgeTable` component internally uses the `useBridgeCrud` hook and provides a complete UI for CRUD operations. It handles all the state management, data fetching, and UI rendering for you.
