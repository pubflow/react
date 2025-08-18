/**
 * Utility functions for BridgeForm
 */
import { z } from 'zod';
import { FieldConfig } from './types';

/**
 * Formats a string to title case with spaces
 * @param str String to format
 * @returns Formatted string
 */
export function formatFieldName(str: string): string {
  // Handle camelCase
  const spacedStr = str.replace(/([A-Z])/g, ' $1');

  // Capitalize first letter and trim
  return spacedStr.charAt(0).toUpperCase() + spacedStr.slice(1).trim();
}

/**
 * Determines the field type based on Zod schema and field config
 * @param schema Zod schema for the field
 * @param configType Type specified in field config
 * @returns Determined field type
 */
export function determineFieldType(
  schema: z.ZodTypeAny,
  configType?: string
): string {
  // If type is specified in config, use it
  if (configType) return configType;

  // Try to determine type from Zod schema
  if (schema instanceof z.ZodString) {
    // Check for specific string formats
    if (schema._def.checks) {
      for (const check of schema._def.checks) {
        if (check.kind === 'email') return 'email';
        if (check.kind === 'url') return 'url';
        if (check.kind === 'uuid') return 'text';
        if (check.kind === 'regex') {
          // Try to determine if it's a date pattern
          if (check.regex.source.includes('\\d{4}-\\d{2}-\\d{2}')) return 'date';
        }
      }
    }
    return 'text';
  }

  if (schema instanceof z.ZodNumber) return 'number';
  if (schema instanceof z.ZodBoolean) return 'checkbox';
  if (schema instanceof z.ZodDate) return 'date';
  if (schema instanceof z.ZodEnum) return 'select';
  if (schema instanceof z.ZodNativeEnum) return 'select';

  // Default to text for other types
  return 'text';
}

/**
 * Checks if a field is required based on Zod schema
 * @param schema Zod schema for the field
 * @returns Whether the field is required
 */
export function isFieldRequired(schema: z.ZodTypeAny): boolean {
  // Check if it's an optional field
  if (schema instanceof z.ZodOptional) return false;

  // Check if it's a nullable field with a default value
  if (schema instanceof z.ZodNullable && 'defaultValue' in schema._def && schema._def.defaultValue !== undefined) {
    return false;
  }

  // Check if it has a default value
  if (schema._def.defaultValue !== undefined) return false;

  return true;
}

/**
 * Gets options for select/radio fields from Zod enum schema
 * @param schema Zod schema for the field
 * @returns Options array or undefined
 */
export function getOptionsFromSchema(
  schema: z.ZodTypeAny
): Array<{value: any, label: string}> | undefined {
  if (schema instanceof z.ZodEnum) {
    return schema._def.values.map((value: string) => ({
      value,
      label: formatFieldName(value)
    }));
  }

  if (schema instanceof z.ZodNativeEnum) {
    const enumObject = schema._def.values;
    return Object.keys(enumObject)
      .filter(key => isNaN(Number(key))) // Filter out numeric keys
      .map(key => ({
        value: enumObject[key],
        label: formatFieldName(key)
      }));
  }

  return undefined;
}

/**
 * Gets responsive grid classes based on layout configuration
 * @param layout Layout configuration
 * @returns CSS class string
 */
export function getGridClasses(layout?: {
  columns?: number | { sm?: number; md?: number; lg?: number };
  gap?: string;
}): string {
  if (!layout) return 'grid-cols-1';

  let classes = 'grid ';

  // Add gap
  if (layout.gap) {
    classes += `gap-${layout.gap} `;
  } else {
    classes += 'gap-6 ';
  }

  // Add columns
  if (typeof layout.columns === 'number') {
    classes += `grid-cols-1 md:grid-cols-${layout.columns}`;
  } else if (typeof layout.columns === 'object') {
    const { sm = 1, md = 1, lg = 1 } = layout.columns;
    classes += `grid-cols-1 `;
    if (sm > 1) classes += `sm:grid-cols-${sm} `;
    if (md > 1) classes += `md:grid-cols-${md} `;
    if (lg > 1) classes += `lg:grid-cols-${lg} `;
  } else {
    classes += 'grid-cols-1';
  }

  return classes.trim();
}

/**
 * Extracts field configs from Zod schema
 * @param schema Zod schema
 * @returns Array of field configs
 */
export function getFieldsFromSchema<T extends Record<string, any>>(
  schema: z.ZodType<T>
): FieldConfig[] {
  // Get the shape of the schema
  const shape = (schema as any)._def.shape?.();
  if (!shape) return [];

  return Object.entries(shape).map(([key, fieldSchema]) => {
    const fieldType = determineFieldType(fieldSchema as z.ZodTypeAny);
    const options = getOptionsFromSchema(fieldSchema as z.ZodTypeAny);

    return {
      name: key,
      label: formatFieldName(key),
      type: fieldType as any, // Cast to satisfy FieldConfig type
      ...(options ? { options } : {})
    };
  });
}

/**
 * Adjusts a color by a percentage
 * @param color Hex color code
 * @param percent Percentage to adjust (-100 to 100)
 * @param alpha Whether to adjust opacity instead of brightness
 * @returns Adjusted color
 */
export function adjustColor(color: string, percent: number, alpha: boolean = false): string {
  // Remove # if present
  color = color.replace('#', '');

  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  if (alpha) {
    // Convert to rgba with opacity
    const opacity = Math.max(0, Math.min(1, 1 - (Math.abs(percent) / 100)));
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  } else {
    // Adjust brightness
    const amount = Math.round(2.55 * percent);
    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  }
}
