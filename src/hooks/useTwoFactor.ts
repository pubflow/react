/**
 * useTwoFactor Hook for React
 *
 * Convenience hook for managing 2FA settings (setup, toggle, remove).
 * For the LOGIN-TIME 2FA flow use useAuth() which surfaces
 * twoFactorPending / verifyTwoFactor / startTwoFactor.
 */

import { useState, useCallback } from 'react';
import { useContext } from 'react';
import { PubflowContext } from '../context/PubflowProvider';
import type {
    TwoFactorMethod,
    TwoFactorSystemInfo,
    TwoFactorSetupResult,
    TwoFactorToggleResult,
} from '@pubflow/core';

export interface UseTwoFactorResult {
    /** Whether the 2FA system is globally enabled on this server */
    systemEnabled: boolean;
    /** Available methods on the server (e.g. ['email']) */
    availableMethods: string[];
    /** User's configured 2FA methods */
    methods: TwoFactorMethod[];
    isLoading: boolean;
    error: string | null;
    /** Load system info and user methods */
    refresh: () => Promise<void>;
    /**
     * Set up a new 2FA method.
     * @param method  e.g. 'email'
     * @param identifier  email address or phone number
     */
    setup: (method: string, identifier: string) => Promise<TwoFactorSetupResult>;
    /**
     * Enable or disable 2FA for the user.
     * When disabling with existing methods a verification code is required.
     */
    toggle: (
        enabled: boolean,
        verificationCode?: string,
        verificationMethodId?: string,
    ) => Promise<TwoFactorToggleResult>;
    /**
     * Remove a 2FA method. Requires a verification code from another active method.
     */
    removeMethod: (
        methodId: string,
        verificationCode: string,
        verificationMethodId: string,
    ) => Promise<{ success: boolean; message?: string; error?: string }>;
}

/**
 * Hook for managing 2FA settings.
 *
 * Must be used inside a PubflowProvider.
 *
 * @param instanceId Optional Pubflow instance ID
 */
export function useTwoFactor(instanceId?: string): UseTwoFactorResult {
    const context = useContext(PubflowContext);
    if (!context) throw new Error('useTwoFactor must be used within a PubflowProvider');

    const id = instanceId || context.defaultInstance;
    const instance = context.instances[id];

    const [systemEnabled, setSystemEnabled] = useState(false);
    const [availableMethods, setAvailableMethods] = useState<string[]>([]);
    const [methods, setMethods] = useState<TwoFactorMethod[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!instance) return;
        setIsLoading(true);
        setError(null);
        try {
            const [sys, userMethods] = await Promise.all([
                instance.twoFactorService.getSystem(),
                instance.twoFactorService.getMethods(),
            ]);
            setSystemEnabled(sys.global_two_factor_enabled);
            setAvailableMethods(sys.available_methods);
            setMethods(userMethods);
        } catch (e: any) {
            setError(e?.message || 'Failed to load 2FA info');
        } finally {
            setIsLoading(false);
        }
    }, [instance]);

    const setup = useCallback(
        async (method: string, identifier: string): Promise<TwoFactorSetupResult> => {
            if (!instance) return { success: false, error: 'Pubflow not initialized' };
            setIsLoading(true);
            setError(null);
            try {
                const result = await instance.twoFactorService.setup(method, identifier);
                if (result.success) await refresh();
                return result;
            } catch (e: any) {
                const msg = e?.message || 'Setup failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [instance, refresh],
    );

    const toggle = useCallback(
        async (
            enabled: boolean,
            verificationCode?: string,
            verificationMethodId?: string,
        ): Promise<TwoFactorToggleResult> => {
            if (!instance) return { success: false, error: 'Pubflow not initialized' };
            setIsLoading(true);
            setError(null);
            try {
                const result = await instance.twoFactorService.toggle(
                    enabled,
                    verificationCode,
                    verificationMethodId,
                );
                if (result.success) await refresh();
                return result;
            } catch (e: any) {
                const msg = e?.message || 'Toggle failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [instance, refresh],
    );

    const removeMethod = useCallback(
        async (
            methodId: string,
            verificationCode: string,
            verificationMethodId: string,
        ): Promise<{ success: boolean; message?: string; error?: string }> => {
            if (!instance) return { success: false, error: 'Pubflow not initialized' };
            setIsLoading(true);
            setError(null);
            try {
                const result = await instance.twoFactorService.removeMethod(
                    methodId,
                    verificationCode,
                    verificationMethodId,
                );
                if (result.success) await refresh();
                return result;
            } catch (e: any) {
                const msg = e?.message || 'Remove failed';
                setError(msg);
                return { success: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [instance, refresh],
    );

    return {
        systemEnabled,
        availableMethods,
        methods,
        isLoading,
        error,
        refresh,
        setup,
        toggle,
        removeMethod,
    };
}
