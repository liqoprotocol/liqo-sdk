# Error Handling

The SDK throws typed errors so you can handle failures precisely.

## Error classes

```ts
import { LiqoApiError, LiqoSdkError } from '@liqo/sdk';
```

- **`LiqoApiError`** — the API returned an error response. Carries:
  - `statusCode?: number` — HTTP status
  - `code?: string` — canonical Liqo error code (see below)
  - `message: string` — human-readable message
  - `requestId?: string` — include this when contacting support
  - `raw?: unknown` — the raw response (only when `debug: true`)
- **`LiqoSdkError`** — a client-side error raised by the SDK (invalid input, missing key, network failure, timeout, webhook verification failure). It's a subclass of `LiqoApiError`.

## Handling errors

```ts
try {
  await liqo.checkout.sessions.create(/* … */);
} catch (err) {
  if (err instanceof LiqoSdkError) {
    // validation / network / client-side error
    console.warn('SDK error:', err.message);
  } else if (err instanceof LiqoApiError) {
    // server returned an error envelope
    console.error(err.statusCode, err.code, err.message, err.requestId);
  } else {
    throw err;
  }
}
```

> Because `LiqoSdkError extends LiqoApiError`, check `LiqoSdkError` **first** if you want to distinguish client-side from server-side errors.

## Canonical error codes

`err.code` maps to Liqo's canonical `ErrorCode` set:

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | The request failed validation |
| `UNAUTHORIZED` | Missing/invalid API key |
| `FORBIDDEN` | Authenticated but not allowed |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Too many requests |
| `TRANSACTION_NOT_FOUND` | No such transaction |
| `CHECKOUT_SESSION_NOT_FOUND` | No such checkout session |
| `WEBHOOK_NOT_FOUND` | No such webhook |
| `PROVIDER_ERROR` | An upstream payment provider failed |
| `SETTLEMENT_FAILED` | On-chain settlement failed |
| `INTERNAL_ERROR` | Unexpected server error |

Some endpoints may return additional codes (e.g. `UNSUPPORTED_PAIR` for an unroutable quote pair). Always branch on `err.code` defensively and fall back to `err.message`.

## Retries & 5xx

The SDK automatically retries on network errors and HTTP `429`, using exponential backoff, up to `retryAttempts` (default 3). For `5xx` responses, the message is prefixed with "Liqo is temporarily unavailable:". Non-retryable errors (most `4xx`) are thrown immediately.

To observe attempts, subscribe to events:

```ts
liqo.on('error', ({ path, attempt, error }) => {
  console.warn(`Request to ${path} failed on attempt ${attempt}`);
});
```

## Timeouts

Requests time out after `timeoutMs` (default 15s). A timeout surfaces as a `LiqoApiError`. Tune per client:

```ts
const liqo = new Liqo(key, { timeoutMs: 30_000 });
```

## Validation errors are local

Input problems (bad amount, invalid wallet for chain, malformed URL/email) throw a `LiqoSdkError` **before** any network request — so you can surface them instantly in your UI/logs.
