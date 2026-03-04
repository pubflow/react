# Two-Factor Authentication (2FA) Guide

**`@pubflow/react` + `@pubflow/core`** — March 2026

---

## Overview

`@pubflow/react` ships built-in support for Two-Factor Authentication via the `useTwoFactor` hook and the automatically wired `LoginForm` / `useAuth` hook.  
It delegates all network calls to `@pubflow/core`'s `TwoFactorService`, which talks to the multi-flowless backend at `/auth/two_factor/*`.

```
@pubflow/react  ──► TwoFactorService (@pubflow/core)  ──► /auth/two_factor/* (multi-flowless)
```

---

## Requirements

| Package | Min version |
|---------|-------------|
| `@pubflow/core` | `^0.4.2` |
| `@pubflow/react` | `^0.4.7` |

Your multi-flowless backend must have these env vars set:

```env
GLOBAL_TWO_FACTOR=true
TWO_FACTOR_AVAILABLE=email          # comma-separated: email,sms
TWO_FACTOR_CONFIG={}                # optional per-method overrides
TWO_FACTOR_SECURITY={}              # optional: max_attempts, lockout_minutes
```

---

## Architecture at a glance

```
┌──────────────────────────────────────────────┐
│  @pubflow/core                               │
│                                              │
│  TwoFactorService                            │
│    .getSystem()     → GET /system            │
│    .getMethods()    → GET /methods           │
│    .setup()         → POST /:method/setup    │
│    .verify()        → POST /verify           │
│    .start()         → POST /:method/start    │
│    .toggle()        → POST /toggle           │
│    .removeMethod()  → DELETE /:id            │
└──────────────────────────────────────────────┘
           ▲
           │ used by
┌──────────────────────────────────────────────┐
│  @pubflow/react                              │
│                                              │
│  useTwoFactor()   ── settings/profile pages  │
│  useAuth()        ── login flow              │
│  LoginForm        ── built-in login + OTP    │
└──────────────────────────────────────────────┘
```

---

## Flow 1 — Login with 2FA (`useAuth` / `LoginForm`)

This flow is handled **automatically** by `LoginForm` and `useAuth`.  
You do not need to wire anything extra; just use `LoginForm` as usual.

### What happens under the hood

```
1. user.login({ email, password })
        │
        ▼
2. Backend returns { requires_2fa: true, session_id, available_methods }
        │
        ▼
3. PubflowProvider sets twoFactorPending = true
   LoginForm switches to the OTP input step automatically
        │
        ▼
4. user enters 6-digit code
        │
        ▼
5. verifyTwoFactor(methodId, code)
   → POST /auth/two_factor/verify  { action: 'login' }
        │
        ▼
6. Partial session (status=pending) is upgraded to active
   useAuth().user is populated
```

### Exposed from `useAuth()`

```ts
const {
  login,
  twoFactorPending,      // true when OTP step is required
  twoFactorMethods,      // available methods for the pending session
  verifyTwoFactor,       // (methodId, code) → TwoFactorVerifyResult
  startTwoFactor,        // (methodId, method) → resend code
} = useAuth()
```

### Custom OTP UI (if not using LoginForm)

```tsx
import { useAuth } from '@pubflow/react'

function LoginPage() {
  const { login, twoFactorPending, twoFactorMethods, verifyTwoFactor, startTwoFactor } = useAuth()

  // Step 1 — credentials
  if (!twoFactorPending) {
    return (
      <form onSubmit={async (e) => {
        e.preventDefault()
        await login({ email, password })
        // if requires_2fa → twoFactorPending becomes true automatically
      }}>
        ...
      </form>
    )
  }

  // Step 2 — OTP
  const method = twoFactorMethods[0]
  return (
    <form onSubmit={async (e) => {
      e.preventDefault()
      const result = await verifyTwoFactor(method.id, otpCode)
      if (result.verified) navigate('/dashboard')
    }}>
      <input value={otpCode} onChange={...} maxLength={6} />
      <button type="button" onClick={() => startTwoFactor(method.id, method.method)}>
        Resend code
      </button>
    </form>
  )
}
```

> **Note on Login Resends:** For the login flow, `startTwoFactor` is exported directly from `useAuth()`. For managing settings inside an active session, use `useTwoFactor().sendCode()` instead.

---

## Flow 2 — Manage 2FA settings (`useTwoFactor`)

Use this hook on a **profile / settings** page to let users add, confirm, or remove 2FA methods, and toggle 2FA on/off.

### Installation / placement

The hook must be rendered inside a `<PubflowProvider>`.

### How setup works (2 steps)

```
Step 1  POST /:method/setup  { identifier }
        └→ method created in DB with status = pending_setup
           verification code sent to the identifier (email / SMS)

Step 2  POST /verify  { method_id, code, action: 'setup' }
        └→ method status changed to active
           user's methods list refreshed
```

> **Important:** Step 2 is mandatory. A `pending_setup` method is not visible in
> `GET /methods` and does not count as active 2FA.

### Hook API

```ts
const {
  systemEnabled,       // boolean — is 2FA available on this server?
  availableMethods,    // string[] — e.g. ['email']
  methods,             // TwoFactorMethod[] — user's ACTIVE methods only
  isLoading,
  error,
  refresh,             // () => Promise<void>  — reload system info + methods

  // Setup (2-step)
  setup,               // (method, identifier) → TwoFactorSetupResult
  confirmSetup,        // (methodId, method, code) → TwoFactorVerifyResult

  // Toggle on/off
  toggle,              // (enabled, code?, methodId?) → TwoFactorToggleResult

  // Re-auth / Sensitive actions (new in 0.4.14)
  // Send a code to an active method before disabling or removing
  sendCode,            // (methodId, method, action?) → TwoFactorStartResult

  // Remove a method (requires code from another active method)
  removeMethod,        // (methodId, code, verifyMethodId) → { success }
} = useTwoFactor()
```

### Flow for Sensitive Actions (Disable / Remove)

When users want to disable 2FA entirely or remove a specific method, you must verify their identity using an existing active 2FA method:
1. **Send code:** Call `sendCode(methodId, method, 'sensitive_action')` to dispatch an OTP.
2. **Accept input:** Show the 6-digit input specifically for the disable or remove flow.
3. **Submit:** Pass the entered code into `toggle(false, code, methodId)` or `removeMethod(removedId, code, verifyMethodId)`.

### Minimal example

```tsx
import { useTwoFactor } from '@pubflow/react'

function TwoFactorSettings() {
  const { systemEnabled, methods, setup, confirmSetup, toggle, removeMethod, refresh } = useTwoFactor()

  const [pendingSetup, setPendingSetup] = useState<{
    methodId: string; method: string; identifier: string
  } | null>(null)

  useEffect(() => { refresh() }, [])

  // ── Step 1
  const handleSetup = async () => {
    const result = await setup('email', 'user@example.com')
    if (result.success) {
      // code was sent; show OTP input
      setPendingSetup({ methodId: result.method_id, method: 'email', identifier: 'user@example.com' })
    }
  }

  // ── Step 2
  const handleConfirm = async (code: string) => {
    if (!pendingSetup) return
    const result = await confirmSetup(pendingSetup.methodId, pendingSetup.method, code)
    if (result.verified) {
      setPendingSetup(null)
      // methods list refreshed automatically
    }
  }

  if (!systemEnabled) return <p>2FA is not available on this server.</p>

  return (
    <div>
      {/* Active methods */}
      {methods.map(m => (
        <div key={m.id}>
          {m.method} — {m.identifier}
          <button onClick={async () => {
             // 1. Send code to verify removal
             await sendCode(m.id, m.method)
             // 2. Prompt user for it (simplified here)
             const code = prompt('Enter the code we just sent you:')
             if (code) await removeMethod(m.id, code, m.id)
          }}>Remove</button>
        </div>
      ))}

      {/* Add method */}
      {!pendingSetup && (
        <button onClick={handleSetup}>Add email method</button>
      )}

      {/* Confirm OTP */}
      {pendingSetup && (
        <input maxLength={6} onChange={e => handleConfirm(e.target.value)} />
      )}

      {/* Toggle */}
      <button onClick={async () => {
         const method = methods[0]
         if (method) {
             await sendCode(method.id, method.method)
             const code = prompt('Enter code to disable 2FA:')
             if (code) await toggle(false, code, method.id)
         }
      }}>Disable 2FA</button>
    </div>
  )
}
```

---

## Types (from `@pubflow/core`)

```ts
// A resolved, active 2FA method
interface TwoFactorMethod {
  id: string
  user_id: string
  method: 'email' | 'sms' | 'totp'
  status: 'active' | 'pending_setup'
  identifier?: string    // email address or phone number
  last_used_at?: string
  created_at: string
}

// System-level info (GET /system)
interface TwoFactorSystemInfo {
  global_two_factor_enabled: boolean
  available_methods: string[]
}

// setup() result — step 1
interface TwoFactorSetupResult {
  success: boolean
  method_id?: string
  status?: string          // 'pending_setup'
  verification_sent?: boolean
  expires_in?: number      // seconds
  error?: string
}

// sendCode() / start() result — sensitive actions
interface TwoFactorStartResult {
  success: boolean
  method?: string
  verification_sent?: boolean
  expires_in?: number
  message?: string
  error?: string
}

// verify() / confirmSetup() result — step 2
interface TwoFactorVerifyResult {
  success: boolean
  verified: boolean
  session_activated?: boolean
  expires_at?: string
  attempts_remaining?: number
  error?: string
}

// toggle() result
interface TwoFactorToggleResult {
  success: boolean
  two_factor_enabled?: boolean
  error?: string
}
```

---

## Security notes

- Codes are **Argon2id-hashed** in the database — never stored as plaintext.
- `pending_setup` methods are excluded from `GET /methods` — they are invisible as active 2FA until confirmed.
- Partial sessions (`status=pending`) expire in **5 minutes**.
- Rate limiting is applied per-endpoint on the backend (fail-open: if Redis is unavailable, the check passes gracefully).

---

## Pre-built component

`@pubflow/react` ships a ready-made `TwoFactorCard` component in the `pubflow-flowfull-client` template that covers the full setup + confirm + remove + toggle flow with i18n and shadcn UI. See:

```
src/components/custom/TwoFactorCard.tsx
```

Translation keys are under `auth.twoFactor.*` in `src/locales/{en,es}/auth.json`.
