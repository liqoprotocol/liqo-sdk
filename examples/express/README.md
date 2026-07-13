# Express example

A minimal Express server that creates payments and verifies webhooks.

## Run

```bash
npm install express @liqo/sdk
export LIQO_API_KEY=sk_test_...
export LIQO_WEBHOOK_SECRET=whsec_...
node examples/express/server.mjs
```

## Endpoints

- `POST /api/checkout` — create a payment, returns `{ checkoutUrl, token }`
- `GET /api/checkout/:token` — retrieve session status
- `POST /webhooks/liqo` — verifies signed webhooks (raw body)

## Key detail: raw body for webhooks

The webhook route uses `express.raw({ type: 'application/json' })` and is registered **before** `express.json()`. Verification is computed over the exact bytes Liqo signed — parsing/re-serializing first will break it. See [../../docs/WEBHOOKS.md](../../docs/WEBHOOKS.md).
