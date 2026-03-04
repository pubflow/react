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
    TwoFactorVerifyResult,
    TwoFactorStartResult,
} from '@pubflow/core';

export interface UseTwoFactorResult {
    /** Whether the 2FA system is globally enabled on this server */
    systemEnabled: boolean;
    /** Available methods on the server (e.g. ['email']) */
    availableMethods: string[];
    /** User's configured 2FA methods (status = active only) */
    methods: TwoFactorMethod[];
    isLoading: boolean;
    error: string | null;
    /** Load system info and user methods */
    refresh: () => Promise<void>;
    /**
     * Step 1 of setup: register method + send verification code.
     * Returns { success, method_id, status: 'pending_setup', ... }
     */
    setup: (method: string, identifier: string) => Promise<TwoFactorSetupResult>;
    /**
     * Step 2 of setup: confirm the code received → activates the method.
     */
    confirmSetup: (methodId: string, method: string, code: string) => Promise<TwoFactorVerifyResult>;
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
    /**
     * Send a verification code to an existing active method (re-auth / sensitive action).
     * Call this BEFORE showing the code input for disable or remove flows.
     */
    sendCode: (
        methodId: string,
        method: string,
        action?: string,
    ) => Promise<TwoFactorStartResult>;
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

    const confirmSetup = useCallback(
        async (methodId: string, method: string, code: string): Promise<TwoFactorVerifyResult> => {
            if (!instance) return { success: false, verified: false, error: 'Pubflow not initialized' };
            setIsLoading(true);
            setError(null);
            try {
                // action='setup' activates a pending_setup method in the DB
                const result = await instance.twoFactorService.verify(methodId, code, 'setup');
                if (result.verified) await refresh();
                return result;
            } catch (e: any) {
                const msg = e?.message || 'Confirmation failed';
                setError(msg);
                return { success: false, verified: false, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [instance, refresh],
    );

    const sendCode = useCallback(
        async (
            methodId: string,
            method: string,
            action: string = 'sensitive_action',
        ): Promise<TwoFactorStartResult> => {
            if (!instance) return { success: false, error: 'Pubflow not initialized' };
            try {
                return await instance.twoFactorService.start(methodId, method, action);
            } catch (e: any) {
                return { success: false, error: e?.message || 'Failed to send code' };
            }
        },
        [instance],
    );

    return {
        systemEnabled,
        availableMethods,
        methods,
        isLoading,
        error,
        refresh,
        setup,
        confirmSetup,
        toggle,
        removeMethod,
        sendCode,
    };
}
