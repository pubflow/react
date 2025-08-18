# Schema Validation

This document explains how to use schema validation with the `@pubflow/react` package.

## Table of Contents

- [Overview](#overview)
- [Using Zod](#using-zod)
  - [Basic Schema Definition](#basic-schema-definition)
  - [Advanced Schema Definition](#advanced-schema-definition)
  - [TypeScript Integration](#typescript-integration)
- [Using Other Validation Libraries](#using-other-validation-libraries)
  - [Yup](#yup)
  - [Joi](#joi)
  - [Custom Validation](#custom-validation)
- [Integration with CRUD Operations](#integration-with-crud-operations)
  - [With useBridgeCrud](#with-usebridgecrud)
  - [With useBridgeMutation](#with-usebridgemutation)
  - [With BridgeTable](#with-bridgetable)
- [Handling Validation Errors](#handling-validation-errors)
  - [Displaying Errors](#displaying-errors)
  - [Custom Error Handling](#custom-error-handling)

## Overview

Pubflow recommends defining schemas at the application level, not in the adapter. This allows for better reusability and separation of concerns. The `@pubflow/react` package provides integration with various schema validation libraries, with a focus on [Zod](https://github.com/colinhacks/zod).

## Using Zod

[Zod](https://github.com/colinhacks/zod) is a TypeScript-first schema validation library that works well with Pubflow.

### Basic Schema Definition

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
```

### Advanced Schema Definition

```jsx
// lib/schemas/product.js
import { z } from 'zod';

// Schema for product variant
const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Variant name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int('Stock must be an integer').nonnegative('Stock must be non-negative')
});

// Schema for complete product entity
export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters'),
  price: z.number().positive('Price must be positive'),
  isActive: z.boolean(),
  tags: z.array(z.string()),
  variants: z.array(productVariantSchema).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

// Schema for creating a product
export const createProductSchema = productSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    variants: z.array(productVariantSchema.omit({ id: true })).optional()
  });

// Schema for updating a product
export const updateProductSchema = productSchema
  .partial()
  .extend({
    id: z.string().uuid()
  });
```

### TypeScript Integration

Zod allows you to infer TypeScript types from your schemas:

```tsx
// lib/schemas/user.ts
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

## Using Other Validation Libraries

### Yup

[Yup](https://github.com/jquense/yup) is another popular schema validation library:

```jsx
// lib/schemas/user.js
import * as yup from 'yup';

// Schema for complete user entity
export const userSchema = yup.object({
  id: yup.string().uuid().optional(),
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  role: yup.string().oneOf(['user', 'admin'], 'Role must be either user or admin').required('Role is required')
});

// Schema for creating a user
export const createUserSchema = userSchema.omit(['id']);

// Schema for updating a user
export const updateUserSchema = userSchema.partial().shape({
  id: yup.string().uuid().required('ID is required')
});

// Adapter function for Pubflow
export function validateWithYup(schema, data) {
  try {
    const validData = schema.validateSync(data, { abortEarly: false });
    return { success: true, data: validData };
  } catch (error) {
    const errors = {};
    
    if (error.inner) {
      error.inner.forEach((err) => {
        if (!errors[err.path]) {
          errors[err.path] = [];
        }
        errors[err.path].push(err.message);
      });
    }
    
    return { success: false, errors };
  }
}
```

### Joi

[Joi](https://github.com/sideway/joi) is another validation library:

```jsx
// lib/schemas/user.js
import Joi from 'joi';

// Schema for complete user entity
export const userSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  name: Joi.string().min(2).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email address',
    'any.required': 'Email is required'
  }),
  role: Joi.string().valid('user', 'admin').required().messages({
    'any.only': 'Role must be either user or admin',
    'any.required': 'Role is required'
  })
});

// Schema for creating a user
export const createUserSchema = userSchema.fork('id', (schema) => schema.forbidden());

// Schema for updating a user
export const updateUserSchema = userSchema.fork(['name', 'email', 'role'], (schema) => schema.optional());

// Adapter function for Pubflow
export function validateWithJoi(schema, data) {
  const result = schema.validate(data, { abortEarly: false });
  
  if (result.error) {
    const errors = {};
    
    result.error.details.forEach((detail) => {
      const path = detail.path.join('.');
      
      if (!errors[path]) {
        errors[path] = [];
      }
      
      errors[path].push(detail.message);
    });
    
    return { success: false, errors };
  }
  
  return { success: true, data: result.value };
}
```

### Custom Validation

You can also create your own validation function:

```jsx
// lib/validation.js
export function validate(schema, data) {
  // Your custom validation logic
  const errors = {};
  let isValid = true;
  
  // Example: validate name
  if (schema.name && schema.name.required && !data.name) {
    errors.name = ['Name is required'];
    isValid = false;
  } else if (schema.name && schema.name.minLength && data.name && data.name.length < schema.name.minLength) {
    errors.name = [`Name must be at least ${schema.name.minLength} characters`];
    isValid = false;
  }
  
  // Example: validate email
  if (schema.email && schema.email.required && !data.email) {
    errors.email = ['Email is required'];
    isValid = false;
  } else if (schema.email && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = ['Invalid email address'];
    isValid = false;
  }
  
  // Return validation result
  return {
    success: isValid,
    data: isValid ? data : undefined,
    errors: isValid ? undefined : errors
  };
}
```

## Integration with CRUD Operations

### With useBridgeCrud

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

### With useBridgeMutation

```jsx
import { useBridgeApi, useBridgeMutation } from '@pubflow/react';
import { createUserSchema } from '../lib/schemas/user';
import { validateWithSchema } from '@pubflow/core';

function CreateUser() {
  const [validationErrors, setValidationErrors] = useState(null);
  const userService = useBridgeApi({ endpoint: 'users' });
  const { mutate: createUser, isLoading, error } = useBridgeMutation(
    userService,
    'create'
  );
  
  const handleSubmit = async (data) => {
    // Validate data
    const result = validateWithSchema(createUserSchema, data);
    
    if (!result.success) {
      setValidationErrors(result.errors);
      return;
    }
    
    // Clear validation errors
    setValidationErrors(null);
    
    try {
      await createUser(result.data);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  // Implement UI for creating a user
  // ...
}
```

### With BridgeTable

```jsx
import { BridgeTable } from '@pubflow/react';
import { userSchema, createUserSchema, updateUserSchema } from '../lib/schemas/user';

function UserTable() {
  return (
    <BridgeTable
      columns={[
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'role', header: 'Role', sortable: true }
      ]}
      entityConfig={{
        endpoint: 'users'
      }}
      schemas={{
        entity: userSchema,
        create: createUserSchema,
        update: updateUserSchema
      }}
    />
  );
}
```

## Handling Validation Errors

### Displaying Errors

```jsx
import { useBridgeCrud } from '@pubflow/react';
import { userSchema, createUserSchema, updateUserSchema } from '../lib/schemas/user';

function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });
  
  const {
    createItem,
    validationErrors
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    },
    schemas: {
      create: createUserSchema
    }
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createItem(formData);
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        role: 'user'
      });
    } catch (error) {
      // Validation errors are handled by the hook
      console.error('Failed to create user:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Name:
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </label>
        {validationErrors?.name && (
          <div style={{ color: 'red' }}>
            {validationErrors.name.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <label>
          Email:
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </label>
        {validationErrors?.email && (
          <div style={{ color: 'red' }}>
            {validationErrors.email.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <label>
          Role:
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {validationErrors?.role && (
          <div style={{ color: 'red' }}>
            {validationErrors.role.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>
      
      <button type="submit">Create User</button>
    </form>
  );
}
```

### Custom Error Handling

```jsx
import { useBridgeCrud } from '@pubflow/react';
import { userSchema, createUserSchema, updateUserSchema } from '../lib/schemas/user';

function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });
  
  const {
    createItem,
    validationErrors
  } = useBridgeCrud({
    entityConfig: {
      endpoint: 'users'
    },
    schemas: {
      create: createUserSchema
    }
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Perform client-side validation before sending to the server
      const result = validateWithSchema(createUserSchema, formData);
      
      if (!result.success) {
        // Handle validation errors
        console.error('Validation failed:', result.errors);
        return;
      }
      
      await createItem(result.data);
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        role: 'user'
      });
    } catch (error) {
      // Handle other errors
      console.error('Failed to create user:', error);
    }
  };
  
  // Implement form UI
  // ...
}
```
