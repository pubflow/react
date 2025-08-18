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
export declare function formatFieldName(str: string): string;
/**
 * Determines the field type based on Zod schema and field config
 * @param schema Zod schema for the field
 * @param configType Type specified in field config
 * @returns Determined field type
 */
export declare function determineFieldType(schema: z.ZodTypeAny, configType?: string): string;
/**
 * Checks if a field is required based on Zod schema
 * @param schema Zod schema for the field
 * @returns Whether the field is required
 */
export declare function isFieldRequired(schema: z.ZodTypeAny): boolean;
/**
 * Gets options for select/radio fields from Zod enum schema
 * @param schema Zod schema for the field
 * @returns Options array or undefined
 */
export declare function getOptionsFromSchema(schema: z.ZodTypeAny): Array<{
    value: any;
    label: string;
}> | undefined;
/**
 * Gets responsive grid classes based on layout configuration
 * @param layout Layout configuration
 * @returns CSS class string
 */
export declare function getGridClasses(layout?: {
    columns?: number | {
        sm?: number;
        md?: number;
        lg?: number;
    };
    gap?: string;
}): string;
/**
 * Extracts field configs from Zod schema
 * @param schema Zod schema
 * @returns Array of field configs
 */
export declare function getFieldsFromSchema<T extends Record<string, any>>(schema: z.ZodType<T>): FieldConfig[];
/**
 * Adjusts a color by a percentage
 * @param color Hex color code
 * @param percent Percentage to adjust (-100 to 100)
 * @param alpha Whether to adjust opacity instead of brightness
 * @returns Adjusted color
 */
export declare function adjustColor(color: string, percent: number, alpha?: boolean): string;
