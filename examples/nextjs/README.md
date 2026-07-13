# Next.js example (App Router)

Server-side route handlers for creating payments and verifying webhooks.

## Files

- `app/api/checkout/route.ts` — `POST` creates a payment, returns `{ checkoutUrl, token }`
- `app/api/webhooks/liqo/route.ts` — `POST` verifies signed webhooks

## Setup

```bash
npm install @liqo/sdk
```

```bash
# .env.local
LIQO_API_KEY=sk_test_...
LIQO_WEBHOOK_SECRET=whsec_...
APP_URL=http://localhost:3000
```

## Important

- Both routes set `export const runtime = 'nodejs'` — the SDK needs Node's `crypto`/`Buffer` and won't run on the Edge runtime as-is. See [../RUNTIME_COMPATIBILITY.md](../RUNTIME_COMPATIBILITY.md).
- The webhook route reads the **raw** body via `await req.text()` before verifying. See [../../docs/WEBHOOKS.md](../../docs/WEBHOOKS.md).
- Never import the SDK into a Client Component — keep it in route handlers / server code.
