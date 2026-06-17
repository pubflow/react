# Complete Route Coverage

`@pubflow/react` keeps `PubflowProvider` as the React integration point and exposes the complete backend clients through hooks:

```ts
const pay = useBridgePayments();
const forms = useUltraForms();

await pay.webhooks.list();
await pay.hosted.portalUrl();
await forms.tickets.create({ subject: 'Support request' });
await forms.modules.status();
```

Use separate hosts when Bridge Payments and Ultra Forms are deployed independently:

```tsx
<PubflowProvider
  instances={{
    default: {
      baseUrl: 'https://flowless.example.com',
      apiUrl: 'https://flowless.example.com',
      paymentsUrl: 'https://payments.example.com',
      formsUrl: 'https://forms.example.com',
      modulePrefixes: {
        payments: '/bridge-payment',
        forms: '/api/v1',
      },
    },
  }}
>
  <App />
</PubflowProvider>
```

The route-to-method matrix is maintained in `@pubflow/core/docs/complete-route-coverage.md`. The React hooks mirror that shape with `useBridgePayments()`, `useUltraForms()`, `useBlog()`, and `useOnboarding()`.
