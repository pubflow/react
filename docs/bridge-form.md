# BridgeForm Component

The `BridgeForm` component provides an easy way to create forms that automatically connect to your API through the Bridge API. It integrates with Zod schemas for validation and uses `useBridgeCrud` for data operations.

## Features

- 🔄 Automatic integration with `useBridgeCrud` for CRUD operations
- ✅ Form validation using Zod schemas
- 🎨 Beautiful, customizable styling with dark mode support
- 📱 Responsive layout options
- 🧩 Support for various field types
- 🔍 Automatic field type detection from Zod schema
- 🛠️ Customizable rendering for advanced use cases

## Basic Usage

```tsx
import { BridgeForm } from '@pubflow/react';
import { z } from 'zod';

// Define your schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin'], { 
    errorMap: () => ({ message: 'Role must be either user or admin' })
  })
});

// Use the form in your component
function CreateUserPage() {
  return (
    <div>
      <h1>Create User</h1>
      <BridgeForm
        schema={userSchema}
        mode="create"
        entityConfig={{ endpoint: 'users' }}
        onSuccess={(data) => {
          console.log('User created:', data);
          // Navigate or show success message
        }}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `schema` | `z.ZodType<T>` | Zod schema for validation |
| `mode` | `'create' \| 'update' \| 'partial'` | Form mode |
| `entityConfig` | `EntityConfig` | Entity configuration for BridgeApi |
| `instanceId` | `string` (optional) | Pubflow instance ID |
| `initialData` | `Partial<T>` (optional) | Initial data (for update/partial mode) |
| `id` | `string` (optional) | Record ID (for update/partial mode) |
| `fields` | `FieldConfig[]` (optional) | Fields to display (all schema fields by default) |
| `layout` | `object` (optional) | Layout configuration |
| `onSuccess` | `(data: T) => void` (optional) | Success callback |
| `onError` | `(error: Error) => void` (optional) | Error callback |
| `onCancel` | `() => void` (optional) | Cancel callback |
| `labels` | `object` (optional) | Custom labels |
| `theme` | `'light' \| 'dark' \| 'auto'` (optional) | Theme (default: 'auto') |
| `mainColor` | `string` (optional) | Main color for the form (buttons, focus rings, etc.) |
| `className` | `string` (optional) | Custom CSS class |
| `style` | `CSSProperties` (optional) | Inline styles |
| `customStyles` | `object` (optional) | Custom styles for form elements |

## Advanced Usage

### Custom Field Configuration

```tsx
<BridgeForm
  schema={userSchema}
  mode="update"
  entityConfig={{ endpoint: 'users' }}
  id={userId}
  initialData={userData}
  fields={[
    { 
      name: 'name',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      description: 'Your first and last name',
      width: '50%'
    },
    { 
      name: 'email',
      type: 'email',
      width: '50%'
    },
    { 
      name: 'role', 
      type: 'select',
      options: [
        { value: 'user', label: 'Regular User' },
        { value: 'admin', label: 'Administrator' }
      ]
    },
    { 
      name: 'bio',
      type: 'textarea',
      description: 'Tell us about yourself'
    }
  ]}
/>
```

### Responsive Layout

```tsx
<BridgeForm
  schema={productSchema}
  mode="create"
  entityConfig={{ endpoint: 'products' }}
  layout={{
    columns: {
      sm: 1,  // 1 column on small screens
      md: 2,  // 2 columns on medium screens
      lg: 3   // 3 columns on large screens
    },
    gap: '4'  // Gap between fields (1rem)
  }}
/>
```

### Custom Styling

```tsx
<BridgeForm
  schema={userSchema}
  mode="create"
  entityConfig={{ endpoint: 'users' }}
  theme="dark"  // Force dark theme
  mainColor="#c30000"  // Set main color to red
  className="my-8 shadow-xl"
  customStyles={{
    form: 'bg-gradient-to-r from-gray-900 to-gray-800 border-none',
    field: 'mb-6',
    label: 'text-blue-300',
    input: 'border-blue-500 focus:ring-blue-400',
    button: 'uppercase tracking-wider'
  }}
/>
```

### Partial Updates

```tsx
<BridgeForm
  schema={userSchema}
  mode="partial"
  entityConfig={{ endpoint: 'users' }}
  id={userId}
  initialData={userData}
  fields={[
    { name: 'status' }  // Only update the status field
  ]}
  onSuccess={() => refetch()}
/>
```

### Custom Field Rendering

```tsx
<BridgeForm
  schema={productSchema}
  mode="create"
  entityConfig={{ endpoint: 'products' }}
  fields={[
    // Other fields...
    {
      name: 'category',
      render: ({ value, onChange, error, required, isDarkMode }) => (
        <div>
          <label className="block mb-2 font-bold">
            Product Category {required && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Electronics', 'Clothing', 'Food'].map(category => (
              <button
                key={category}
                type="button"
                className={`p-3 border rounded-md ${
                  value === category 
                    ? 'bg-blue-500 text-white' 
                    : isDarkMode 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-white text-gray-800'
                }`}
                onClick={() => onChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      )
    }
  ]}
/>
```

## Field Types

The `BridgeForm` component supports the following field types:

- `text` - Text input (default)
- `number` - Number input
- `email` - Email input
- `password` - Password input
- `select` - Select dropdown
- `checkbox` - Checkbox
- `radio` - Radio buttons
- `date` - Date picker
- `textarea` - Multiline text input
- `file` - File upload
- `color` - Color picker
- `range` - Range slider
- `hidden` - Hidden input

## Field Configuration

Each field can be configured with the following options:

```tsx
interface FieldConfig {
  name: string;                // Field name (must exist in the schema)
  label?: string;              // Custom label
  placeholder?: string;        // Placeholder text
  description?: string;        // Help text
  type?: string;               // Field type
  options?: Array<{            // Options for select/radio
    value: any;
    label: string;
  }>;
  width?: string;              // Field width
  hidden?: boolean;            // Whether to hide the field
  disabled?: boolean;          // Whether to disable the field
  defaultValue?: any;          // Default value
  autoFocus?: boolean;         // Whether to autofocus
  className?: string;          // Custom CSS class
  style?: CSSProperties;       // Inline styles
  render?: Function;           // Custom render function
}
```
