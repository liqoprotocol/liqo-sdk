# Best Practices

Recommendations for a robust, secure production integration.

## Security

- **Keep API keys server-side.** Never expose them to browsers or mobile apps. Frontends call your backend; your backend calls Liqo.
- **Load keys from environment variables**, never hard-coded or committed.
- **Verify every webhook** with `liqo.webhooks.verify()` using the **raw body** before acting on it.
- **Separate sandbox and live keys** and never test against production.

## Idempotency

- Pass a stable `idempotencyKey` (e.g., your order id) to `pay()` / `checkout.sessions.create()` so retries never create duplicate sessions.
- Make webhook handlers **idempotent** — dedupe on `data.transactionId` + event name; the same event can arrive more than once.

## Prefer webhooks over polling

- Use [webhooks](./WEBHOOKS.md) as your source of truth for fulfillment — they're immediate and cheap.
- Reserve `waitForCompletion()` for short-lived, interactive flows or as a fallback. Keep `timeoutMs` sane.

## Reliability

- The SDK retries network errors and `429` automatically. Keep your own operations idempotent so retries are safe.
- Respond to webhooks **fast** (return 2xx immediately) and do heavy work asynchronously; slow handlers cause redelivery.
- Set a `timeoutMs` appropriate to your environment (serverless functions have their own limits).

## Client lifecycle

- **Reuse a single `Liqo` instance** across requests instead of constructing one per request — it holds a configured HTTP client.
- In serverless, construct it at module scope so it's reused across warm invocations.

## Observability

- Use `liqo.on('request' | 'response' | 'error', …)` to feed your logging/metrics.
- Enable `debug: true` only in development — it logs request/response bodies.
- Persist `error.requestId` from `LiqoApiError` to correlate with Liqo support.

## Money & correctness

- Treat amounts explicitly in the `fromCurrency` unit; don't mix currencies.
- Confirm the destination `toWallet` matches `targetChain` (the SDK validates this, but validate upstream in your own UI too).
- Use [quotes](./PAYMENTS.md) to show estimated output/fees before creating a payment; quotes expire (`expiresAt`).

## Error handling

- Branch on `err.code` (canonical codes) and fall back to `err.message`. See [Error Handling](./ERROR_HANDLING.md).
- Distinguish `LiqoSdkError` (client-side/validation) from `LiqoApiError` (server) to decide whether to retry or surface to the user.

## Testing

- Develop against `environment: 'sandbox'`.
- Mock the HTTP layer in unit tests (the SDK uses `axios`), or point `baseUrl` at a local mock server.
