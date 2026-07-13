# React example — the secure frontend pattern

**`@liqo/sdk` must never run in a browser.** API keys are secrets; a browser can't keep one. This example shows the correct architecture for any frontend framework (React, Vue, Svelte, mobile, …):

```
Browser (React)  ──POST /api/checkout──►  Your backend (uses @liqo/sdk)  ──►  Liqo API
      ▲                                                                         │
      └──────────────── redirect to checkoutUrl ◄──────────────────────────────┘
```

- The browser calls **your** backend endpoint (`/api/checkout`).
- Your backend (see [../express](../express) or [../nextjs](../nextjs)) uses the SDK to create the payment and returns `{ checkoutUrl }`.
- The browser redirects the user to `checkoutUrl`.
- Fulfillment happens on your backend via verified [webhooks](../../docs/WEBHOOKS.md) — never trust the client.

## File

- `CheckoutButton.tsx` — a button that calls your backend and redirects to the hosted checkout.

## Why not call Liqo directly from React?

Because it would expose your API key to every visitor. There is no safe way to embed a secret key in client-side code. Always proxy through your backend.
