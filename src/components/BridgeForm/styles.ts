/**
 * Styles for BridgeForm component
 */

/**
 * Base styles for the form and its elements
 */
export const baseStyles = {
  // Form container
  form: `
    w-full max-w-4xl mx-auto p-6 rounded-lg
    transition-colors duration-200 ease-in-out
  `,
  formLight: `
    bg-white border border-gray-200 shadow-sm
  `,
  formDark: `
    bg-gray-800 border border-gray-700 shadow-md
  `,
  
  // Fields container
  fieldsContainer: `
    grid gap-6
  `,
  
  // Individual field
  field: `
    relative
  `,
  
  // Labels
  label: `
    block mb-2 font-medium text-sm
    transition-colors duration-200
  `,
  labelLight: `
    text-gray-700
  `,
  labelDark: `
    text-gray-200
  `,
  
  // Description text
  description: `
    text-sm mb-2
  `,
  descriptionLight: `
    text-gray-500
  `,
  descriptionDark: `
    text-gray-400
  `,
  
  // Text inputs
  input: `
    w-full px-4 py-2 rounded-md border
    focus:ring-2 focus:outline-none
    transition-colors duration-200
  `,
  inputLight: `
    bg-white text-gray-900 border-gray-300
    focus:border-[var(--bridge-form-primary-color,#3b82f6)]
    focus:ring-[var(--bridge-form-primary-focus,rgba(59,130,246,0.5))]
    placeholder-gray-400
  `,
  inputDark: `
    bg-gray-700 text-white border-gray-600
    focus:border-[var(--bridge-form-primary-color,#3b82f6)]
    focus:ring-[var(--bridge-form-primary-focus,rgba(59,130,246,0.3))]
    placeholder-gray-400
  `,
  
  // Textarea
  textarea: `
    w-full px-4 py-2 rounded-md border
    focus:ring-2 focus:outline-none
    transition-colors duration-200
    min-h-[120px] resize-y
  `,
  textareaLight: `
    bg-white text-gray-900 border-gray-300
    focus:border-blue-500 focus:ring-blue-200
    placeholder-gray-400
  `,
  textareaDark: `
    bg-gray-700 text-white border-gray-600
    focus:border-blue-400 focus:ring-blue-800
    placeholder-gray-400
  `,
  
  // Select
  select: `
    w-full px-4 py-2 rounded-md border
    focus:ring-2 focus:outline-none
    transition-colors duration-200
    appearance-none bg-no-repeat bg-right
  `,
  selectLight: `
    bg-white text-gray-900 border-gray-300
    focus:border-blue-500 focus:ring-blue-200
    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"%3E%3Cpath stroke="%236B7280" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 8 4 4 4-4"/%3E%3C/svg%3E')]
    bg-[length:1.25em_1.25em]
    pr-10
  `,
  selectDark: `
    bg-gray-700 text-white border-gray-600
    focus:border-blue-400 focus:ring-blue-800
    bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"%3E%3Cpath stroke="%239CA3AF" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m6 8 4 4 4-4"/%3E%3C/svg%3E')]
    bg-[length:1.25em_1.25em]
    pr-10
  `,
  
  // Checkbox
  checkboxContainer: `
    flex items-center
  `,
  checkbox: `
    w-4 h-4 rounded focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
  `,
  checkboxLight: `
    text-[var(--bridge-form-primary-color,#3b82f6)]
    focus:ring-[var(--bridge-form-primary-color,#3b82f6)]
    border-gray-300
  `,
  checkboxDark: `
    text-[var(--bridge-form-primary-color,#3b82f6)]
    focus:ring-[var(--bridge-form-primary-color,#3b82f6)]
    border-gray-600
  `,
  checkboxLabel: `
    ml-2 text-sm font-medium
  `,
  checkboxLabelLight: `
    text-gray-700
  `,
  checkboxLabelDark: `
    text-gray-200
  `,
  
  // Radio
  radioContainer: `
    space-y-2
  `,
  radioOption: `
    flex items-center
  `,
  radio: `
    w-4 h-4 focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
  `,
  radioLight: `
    text-blue-600 focus:ring-blue-500 border-gray-300
  `,
  radioDark: `
    text-blue-500 focus:ring-blue-800 border-gray-600
  `,
  radioLabel: `
    ml-2 text-sm font-medium
  `,
  radioLabelLight: `
    text-gray-700
  `,
  radioLabelDark: `
    text-gray-200
  `,
  
  // Error message
  error: `
    mt-1 text-sm
  `,
  errorLight: `
    text-red-600
  `,
  errorDark: `
    text-red-400
  `,
  
  // Buttons container
  buttonsContainer: `
    mt-8 flex justify-end space-x-4
  `,
  
  // Button base
  button: `
    px-5 py-2 rounded-md font-medium
    transition-all duration-200
    focus:outline-none focus:ring-2
  `,
  
  // Primary button (submit)
  primaryButton: `
    bg-[var(--bridge-form-primary-color,#3b82f6)] text-white
    hover:bg-[var(--bridge-form-primary-hover,#2563eb)]
    focus:ring-[var(--bridge-form-primary-focus,rgba(59,130,246,0.5))]
  `,
  primaryButtonDark: `
    bg-[var(--bridge-form-primary-color,#3b82f6)] text-white
    hover:bg-[var(--bridge-form-primary-hover,#2563eb)]
    focus:ring-[var(--bridge-form-primary-focus,rgba(59,130,246,0.3))]
  `,
  
  // Secondary button (cancel)
  secondaryButton: `
    bg-gray-200 text-gray-800
    hover:bg-gray-300
    focus:ring-gray-300
  `,
  secondaryButtonDark: `
    bg-gray-700 text-gray-200
    hover:bg-gray-600
    focus:ring-gray-600
  `,
  
  // Loading state
  loading: `
    opacity-70 cursor-not-allowed
  `
};

/**
 * Combines base styles with theme-specific styles
 * @param base Base style
 * @param light Light theme style
 * @param dark Dark theme style
 * @param isDarkMode Whether dark mode is active
 * @returns Combined style string
 */
export function getThemedStyle(
  base: string,
  light: string,
  dark: string,
  isDarkMode: boolean
): string {
  return `${base} ${isDarkMode ? dark : light}`.trim();
}
