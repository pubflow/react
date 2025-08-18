/**
 * Styles for BridgeForm component
 */
/**
 * Base styles for the form and its elements
 */
export declare const baseStyles: {
    form: string;
    formLight: string;
    formDark: string;
    fieldsContainer: string;
    field: string;
    label: string;
    labelLight: string;
    labelDark: string;
    description: string;
    descriptionLight: string;
    descriptionDark: string;
    input: string;
    inputLight: string;
    inputDark: string;
    textarea: string;
    textareaLight: string;
    textareaDark: string;
    select: string;
    selectLight: string;
    selectDark: string;
    checkboxContainer: string;
    checkbox: string;
    checkboxLight: string;
    checkboxDark: string;
    checkboxLabel: string;
    checkboxLabelLight: string;
    checkboxLabelDark: string;
    radioContainer: string;
    radioOption: string;
    radio: string;
    radioLight: string;
    radioDark: string;
    radioLabel: string;
    radioLabelLight: string;
    radioLabelDark: string;
    error: string;
    errorLight: string;
    errorDark: string;
    buttonsContainer: string;
    button: string;
    primaryButton: string;
    primaryButtonDark: string;
    secondaryButton: string;
    secondaryButtonDark: string;
    loading: string;
};
/**
 * Combines base styles with theme-specific styles
 * @param base Base style
 * @param light Light theme style
 * @param dark Dark theme style
 * @param isDarkMode Whether dark mode is active
 * @returns Combined style string
 */
export declare function getThemedStyle(base: string, light: string, dark: string, isDarkMode: boolean): string;
