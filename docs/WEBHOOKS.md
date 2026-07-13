# Webhooks

Liqo sends signed HTTP callbacks to your server when a transaction's status changes. Webhooks are the recommended source of truth for fulfilling orders.

## Verify every webhook

**Always verify the signature before trusting a payload, using the raw request body.**

```ts
import { Liqo } from '@liqo/sdk';

const liqo = new Liqo(process.env.LIQO_API_KEY!, {
  webhookSecret: process.env.LIQO_WEBHOOK_SECRET!, // whsec_…
});

const event = liqo.webhooks.verify({
  payload: rawBody,     // string | Buffer — the RAW body, not a parsed object
  headers: req.headers, // must include X-Liqo-Signature and X-Liqo-Timestamp
});
```

You can also pass the secret per call: `liqo.webhooks.verify({ payload, headers, secret })`.

### Why the raw body matters

The signature is computed over the exact bytes Liqo sent. If your framework parses JSON first and you re-serialize it, key ordering/whitespace may differ and verification will fail. Capture the raw body:

- **Express:** `express.raw({ type: 'application/json' })`
- **Next.js (App Router):** `await req.text()`
- **Fastify:** a content-type parser that preserves the raw body

## Verified event shape

`verify()` returns a typed `VerifiedLiqoWebhookEvent`:

```ts
{
  valid: true,
  event: {
    event: 'transaction.completed', // TransactionWebhookEvent
    data: {
      transactionId: string;
      status: TransactionStatus;   // canonical status
      amount?: number;
      asset?: string;
      provider?: string;
      occurredAt?: string;
      metadata?: Record<string, unknown>;
    }
  }
}
```

> Note: `verify()` returns `{ valid, event }`. The webhook body itself is `event` — so `result.event.event` is the event name and `result.event.data` is the payload data.

## Event types

| Event | When |
|---|---|
| `transaction.created` | A transaction was created |
| `transaction.awaiting_payment` | Awaiting inbound payment |
| `transaction.payment_confirmed` | Inbound payment confirmed |
| `transaction.routing` | Route selection started |
| `transaction.executing` | Execution started |
| `transaction.settling` | Final settlement started |
| `transaction.completed` | Completed successfully |
| `transaction.failed` | Failed |
| `transaction.expired` | Expired |
| `transaction.cancelled` | Cancelled |

## How verification works

The SDK verifies exactly what the Liqo platform signs:

```
signing_key = SHA256(webhookSecret)                       // hex
expected    = HMAC_SHA256(signing_key, `${timestamp}.${rawBody}`)  // hex
```

It compares `expected` to the `X-Liqo-Signature` header using a constant-time comparison, and rejects timestamps outside a **300-second tolerance** (`toleranceSeconds`, configurable) for replay protection.

Relevant headers Liqo sends: `X-Liqo-Signature`, `X-Liqo-Timestamp`, `X-Liqo-Event`, `X-Liqo-Delivery-Id`.

## Failure handling & retries

If your endpoint doesn't return a 2xx, Liqo retries delivery with backoff over several attempts before dead-lettering. Make your handler **idempotent** — the same event may arrive more than once (dedupe on `data.transactionId` + `event`).

```ts
app.post('/webhooks/liqo', express.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = liqo.webhooks.verify({ payload: req.body, headers: req.headers });
  } catch {
    return res.sendStatus(400); // signature/timestamp invalid
  }

  // Respond fast; do heavy work asynchronously.
  res.sendStatus(200);
  void handleEvent(event);
});
```

## Deprecated API

`verifyWebhook(signature, payload)` is deprecated and throws. Use `liqo.webhooks.verify({ payload, headers })` so the timestamp can be validated and replay protection stays enabled.
