# Multi-Backend Modules

`@pubflow/react` keeps the normal `PubflowProvider` flow and adds friendly hooks for Bridge Payments, Ultra Forms, Blog, and Onboarding.

```tsx
import { PubflowProvider } from '@pubflow/react';

export function Root() {
  return (
    <PubflowProvider
      config={{
        id: 'main',
        baseUrl: 'https://flowless.example.com',
        apiUrl: 'https://flowless.example.com',
        paymentsUrl: 'https://payments.example.com',
        formsUrl: 'https://forms.example.com',
      }}
    >
      <App />
    </PubflowProvider>
  );
}
```

Use the module hooks inside the provider:

```tsx
import { useBlog, useBridgePayments, useUltraForms } from '@pubflow/react';

function Dashboard() {
  const blog = useBlog();
  const payments = useBridgePayments();
  const forms = useUltraForms();

  // Examples:
  // await blog.listPosts({ lang: 'en' })
  // await payments.listProducts()
  // await forms.submitByCode('contact', values)
}
```

If all modules are mounted on the same host, only `baseUrl` is required. Prefixes can be customized with `modulePrefixes`.
