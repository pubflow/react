import { BridgeFormProps } from './types';
/**
 * BridgeForm component
 */
export declare function BridgeForm<T extends Record<string, any>>({ schema, mode, entityConfig, instanceId, initialData, id, fields, layout, onSuccess, onError, onCancel, labels, theme, mainColor, className, style, customStyles }: BridgeFormProps<T>): import("react/jsx-runtime").JSX.Element;
export * from './types';
