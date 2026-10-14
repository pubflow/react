/**
 * BridgeForm component for React
 *
 * A form component that integrates with Zod schemas and useBridgeCrud
 */
import React, { useState, useEffect } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBridgeCrud } from '../../hooks/useBridgeCrud';
import { BridgeFormProps, FieldConfig } from './types';
import {
  formatFieldName,
  determineFieldType,
  isFieldRequired,
  getOptionsFromSchema,
  getGridClasses,
  getFieldsFromSchema,
  adjustColor
} from './utils';
import { baseStyles, getThemedStyle } from './styles';

/**
 * BridgeForm component
 */
export function BridgeForm<T extends Record<string, any>>({
  schema,
  mode,
  entityConfig,
  instanceId,
  initialData,
  id,
  fields,
  layout,
  onSuccess,
  onError,
  onCancel,
  labels = {},
  theme = 'auto',
  mainColor,
  className,
  style,
  customStyles = {}
}: BridgeFormProps<T>) {
  // Determine if dark mode is active
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;

    // If 'auto', detect system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen for system theme changes if theme is 'auto'
  useEffect(() => {
    if (theme !== 'auto' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Get the shape of the schema
  const zodSchema = schema as any;
  const schemaShape = zodSchema._def.shape?.();

  // Determine fields to display
  const fieldsToRender = fields || getFieldsFromSchema(schema);

  // Set up form with React Hook Form and Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    reset
  } = useForm<T>({
    resolver: zodResolver(schema) as Resolver<T>,
    defaultValues: (initialData || {}) as any
  });

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    }
  }, [initialData, setValue]);

  // Set up CRUD operations with useBridgeCrud
  const {
    createItem,
    updateItem,
    loading,
    error: apiError,
    validationErrors: apiValidationErrors
  } = useBridgeCrud({
    entityConfig,
    instanceId,
    schemas: {
      create: mode === 'create' ? schema : undefined,
      update: mode === 'update' || mode === 'partial' ? schema : undefined
    }
  });

  // Handle form submission
  const onSubmit = async (data: T) => {
    try {
      let result: unknown;

      if (mode === 'create') {
        result = await createItem(data);
      } else if (mode === 'update') {
        if (!id) {
          throw new Error('ID is required for update mode');
        }
        result = await updateItem(id, data);
      } else if (mode === 'partial') {
        if (!id) {
          throw new Error('ID is required for partial mode');
        }

        // Only send changed fields
        const changedFields = Object.keys(data).reduce<Partial<T>>((acc, key) => {
          const k = key as keyof T;
          if (initialData && data[k] !== initialData[k]) {
            acc[k] = data[k];
          }
          return acc;
        }, {});

        if (Object.keys(changedFields).length > 0) {
          result = await updateItem(id, changedFields);
        } else {
          // No changes
          result = data;
        }
      }

      // Call onSuccess with the result
      if (onSuccess) {
        // Cast the result to T to satisfy TypeScript
        onSuccess(result as T);
      }
    } catch (error) {
      if (onError) onError(error as Error);
    }
  };

  // Helper to get themed styles
  const getStyles = (base: string, light: string, dark: string) => {
    return getThemedStyle(base, light, dark, isDarkMode);
  };

  // Generate CSS variables for main color if provided
  const mainColorVars = mainColor ? {
    '--bridge-form-primary-color': mainColor,
    '--bridge-form-primary-hover': adjustColor(mainColor, -10),
    '--bridge-form-primary-focus': adjustColor(mainColor, 30, true),
  } as React.CSSProperties : {};

  // Render a field based on its type
  const renderField = (field: FieldConfig) => {
    // Skip if field doesn't exist in schema
    if (!schemaShape || !schemaShape[field.name]) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Field "${field.name}" is not defined in the schema`);
      }
      return null;
    }

    // Get field schema
    const fieldSchema = schemaShape[field.name];

    // Determine field properties
    const required = isFieldRequired(fieldSchema);
    const type = determineFieldType(fieldSchema, field.type);
    const options = field.options || getOptionsFromSchema(fieldSchema);

    // Get error message if any
    const error = errors[field.name]?.message as string | undefined;

    // If field has custom render function, use it
    if (field.render) {
      return (
        <div
          key={field.name}
          className={`${customStyles.field || ''} ${field.className || ''}`}
          style={field.style}
        >
          {field.render({
            field,
            value: watch(field.name as any),
            onChange: (value) => setValue(field.name as any, value),
            onBlur: () => trigger(field.name as any),
            error,
            required,
            disabled: field.disabled || false,
            isDarkMode
          })}
        </div>
      );
    }

    // Standard field rendering
    return (
      <div
        key={field.name}
        className={`${customStyles.field || ''} ${field.className || ''}`}
        style={field.style}
      >
        {/* Label (except for checkboxes which have label after input) */}
        {type !== 'checkbox' && (
          <label
            htmlFor={field.name}
            className={getStyles(
              baseStyles.label,
              baseStyles.labelLight,
              baseStyles.labelDark
            )}
          >
            {field.label || formatFieldName(field.name)}
            {required && (
              <span className="text-red-500 ml-1">
                {labels.required || '*'}
              </span>
            )}
          </label>
        )}

        {/* Description */}
        {field.description && (
          <p className={getStyles(
            baseStyles.description,
            baseStyles.descriptionLight,
            baseStyles.descriptionDark
          )}>
            {field.description}
          </p>
        )}

        {/* Render appropriate input based on type */}
        {renderInput(field, type, required)}

        {/* Error message */}
        {error && (
          <p className={getStyles(
            baseStyles.error,
            baseStyles.errorLight,
            baseStyles.errorDark
          )}>
            {error}
          </p>
        )}
      </div>
    );
  };

  // Render specific input type
  const renderInput = (field: FieldConfig, type: string, required: boolean) => {
    const inputProps = {
      id: field.name,
      ...register(field.name as any),
      placeholder: field.placeholder,
      disabled: field.disabled,
      autoFocus: field.autoFocus
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...inputProps}
            rows={5}
            className={getStyles(
              baseStyles.textarea,
              baseStyles.textareaLight,
              baseStyles.textareaDark
            )}
          />
        );

      case 'select':
        return (
          <select
            {...inputProps}
            className={getStyles(
              baseStyles.select,
              baseStyles.selectLight,
              baseStyles.selectDark
            )}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className={baseStyles.checkboxContainer}>
            <input
              type="checkbox"
              id={field.name}
              {...register(field.name as any)}
              disabled={field.disabled}
              className={getStyles(
                baseStyles.checkbox,
                baseStyles.checkboxLight,
                baseStyles.checkboxDark
              )}
            />
            <label
              htmlFor={field.name}
              className={getStyles(
                baseStyles.checkboxLabel,
                baseStyles.checkboxLabelLight,
                baseStyles.checkboxLabelDark
              )}
            >
              {field.label || formatFieldName(field.name)}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className={baseStyles.radioContainer}>
            {field.options?.map(option => (
              <div key={option.value} className={baseStyles.radioOption}>
                <input
                  type="radio"
                  id={`${field.name}-${option.value}`}
                  value={option.value}
                  {...register(field.name as any)}
                  disabled={field.disabled}
                  className={getStyles(
                    baseStyles.radio,
                    baseStyles.radioLight,
                    baseStyles.radioDark
                  )}
                />
                <label
                  htmlFor={`${field.name}-${option.value}`}
                  className={getStyles(
                    baseStyles.radioLabel,
                    baseStyles.radioLabelLight,
                    baseStyles.radioLabelDark
                  )}
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={type}
            {...inputProps}
            className={getStyles(
              baseStyles.input,
              baseStyles.inputLight,
              baseStyles.inputDark
            )}
          />
        );
    }
  };

  // Combine base styles with custom styles
  const formClassName = `
    ${getStyles(baseStyles.form, baseStyles.formLight, baseStyles.formDark)}
    ${className || ''}
    ${customStyles.form || ''}
    ${loading ? baseStyles.loading : ''}
  `.trim();

  // Get grid classes for fields container
  const fieldsContainerClassName = `
    ${baseStyles.fieldsContainer}
    ${getGridClasses(layout)}
  `.trim();

  return (
    <form
      onSubmit={handleSubmit(onSubmit as any)}
      className={formClassName}
      style={{ ...style, ...mainColorVars }}
    >
      {/* Fields container */}
      <div className={fieldsContainerClassName}>
        {fieldsToRender.map(renderField)}
      </div>

      {/* API error message */}
      {apiError && (
        <div className={getStyles(
          baseStyles.error,
          baseStyles.errorLight,
          baseStyles.errorDark
        )}>
          {apiError.message}
        </div>
      )}

      {/* Buttons */}
      <div className={baseStyles.buttonsContainer}>
        {/* Cancel button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`
              ${baseStyles.button}
              ${getStyles(
                baseStyles.secondaryButton,
                baseStyles.secondaryButton,
                baseStyles.secondaryButtonDark
              )}
              ${customStyles.button || ''}
            `}
          >
            {labels.cancel || 'Cancel'}
          </button>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            ${baseStyles.button}
            ${getStyles(
              baseStyles.primaryButton,
              baseStyles.primaryButton,
              baseStyles.primaryButtonDark
            )}
            ${customStyles.button || ''}
          `}
        >
          {loading ? 'Saving...' : labels.submit || (
            mode === 'create' ? 'Create' : 'Save'
          )}
        </button>
      </div>
    </form>
  );
}

export * from './types';
