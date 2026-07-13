# Hosted Checkout

Liqo Checkout is a hosted payment page. You create a session, redirect your customer to it, and Liqo collects payment and settles the destination asset.

## Create a session

```ts
const checkout = await liqo.checkout.sessions.create({
  fromAsset: 'NGN',
  toAsset: 'USDC',
  amount: 15000,
  recipientWallet: 'G...RECIPIENT',
  payerEmail: 'customer@example.com',
  targetChain: 'stellar',
  method: 'bank_transfer',        // optional
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
  expiresInMinutes: 30,           // optional (5–1440)
  metadata: { orderId: 'ord_123' },
});

console.log(checkout.checkoutUrl);    // redirect here
console.log(checkout.session.token);  // cs_… — store to look up later
```

Maps to `POST /checkout/sessions`. The request shape is Liqo's canonical `CreateCheckoutSessionRequest`. `create()` accepts an optional `idempotencyKey` alongside the body.

> `liqo.pay(...)` is a convenience wrapper that maps friendlier field names (`fromCurrency`/`toWallet`) onto this request. See [Payments](./PAYMENTS.md).

## Retrieve a session

```ts
const session = await liqo.checkout.sessions.retrieve('cs_...');
```

Maps to `GET /checkout/sessions/:token`. The token is the public, opaque handle.

## The `PublicCheckoutSession` shape

```ts
interface PublicCheckoutSession {
  token: string;
  status: 'created' | 'active' | 'completed' | 'expired' | 'cancelled';
  amount: number;
  currency: string;             // the fiat currency paid in
  destinationAsset: string;     // the settlement asset
  targetChain: string;
  expiresAt: string;            // ISO 8601
  successUrl: string;
  cancelUrl: string;
  payment?: {
    provider: string;
    instructions?: Record<string, unknown>;
  };
  createdAt: string;
  updatedAt: string;
}
```

## Session statuses

| Status | Meaning |
|---|---|
| `created` | Session created, not yet active |
| `active` | Awaiting customer payment |
| `completed` | Payment completed and settled |
| `expired` | Session expired before completion |
| `cancelled` | Session was cancelled |

Retrieving a session refreshes its status server-side (it can transition to `completed` or `expired`).

## Recommended flow

1. **Backend:** `checkout.sessions.create(...)` (or `pay(...)`).
2. **Redirect** the customer to `checkoutUrl`.
3. **Customer pays** on the hosted page.
4. **Backend:** treat the signed [`transaction.completed` webhook](./WEBHOOKS.md) as the source of truth; use `successUrl`/`cancelUrl` only for UX.

## Security

- Session tokens are opaque; only hashes are stored server-side.
- Create sessions from your **backend** — never expose your API key in a browser.
- Rely on webhooks (verified) for fulfillment, not on the redirect alone.
