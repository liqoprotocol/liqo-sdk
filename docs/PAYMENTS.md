# Payments

`liqo.pay(params)` is the recommended way to accept a payment. It validates your input, creates a hosted checkout session (`POST /checkout/sessions`), and returns a URL to redirect your customer to.

## Basic usage

```ts
const checkout = await liqo.pay({
  amount: 15000,
  fromCurrency: 'NGN',
  toAsset: 'USDC',
  toWallet: 'G...RECIPIENT',
  payerEmail: 'customer@example.com',
  targetChain: 'stellar',
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
});

// checkout.checkoutUrl → redirect the customer here
// checkout.session     → the PublicCheckoutSession (token, status, …)
```

## Parameters

| Param | Type | Required | Notes |
|---|---|---|---|
| `amount` | `number` | ✅ | Amount in `fromCurrency`, must be > 0 |
| `fromCurrency` | enum | ✅ | `NGN` `GHS` `ZAR` `USD` `EUR` `GBP` |
| `toAsset` | enum | ✅ | `USDC` `USDT` `XLM` `ETH` `BTC` `SOL` |
| `toWallet` | `string` | ✅ | Destination wallet; validated against `targetChain` |
| `payerEmail` | `string` | ✅ | Customer email (valid format) |
| `successUrl` | `string` | ✅ | Redirect on success (http/https) |
| `cancelUrl` | `string` | ✅ | Redirect on cancel (http/https) |
| `targetChain` | enum | – | `stellar` (default inferred) `solana` `ethereum` |
| `method` | enum | – | `bank_transfer` `card` |
| `sourceCountry` | `string` | – | ISO country (2–3 chars) |
| `expiresInMinutes` | `number` | – | 5–1440 |
| `metadata` | `object` | – | Arbitrary key/values echoed back |
| `idempotencyKey` | `string` | – | Safe retries (see below) |

### Client-side validation

Before any request is sent, the SDK validates: amount > 0, both assets present, a valid email, valid `http(s)` URLs, and that `toWallet` matches `targetChain`:

- `stellar` → `G…` (56 chars)
- `ethereum` → `0x…` (40 hex)
- `solana` → base58 (32–44 chars)

Invalid input throws a `LiqoSdkError` **without** a network call.

## Wallet ↔ chain matching

The destination asset also implies a chain (`SOL` → Solana, `ETH` → Ethereum, otherwise Stellar). Provide a matching `toWallet`, or set `targetChain` explicitly.

## Idempotency

Every write sends an `Idempotency-Key` header. If you don't pass one, the SDK generates a UUID per call. **Pass your own** (e.g., your order id) so that safe retries don't create duplicate sessions:

```ts
await liqo.pay({ /* … */, idempotencyKey: `order_${orderId}` });
```

## What `pay()` returns

```ts
interface PayResponse {
  checkoutUrl: string;          // redirect target
  session: PublicCheckoutSession; // token, status, amount, currency, destinationAsset, targetChain, expiresAt, …
}
```

`pay()` is a thin wrapper over [`checkout.sessions.create()`](./CHECKOUT.md) — use either.

## Payment lifecycle

```
pay() → checkout session created (status: active)
      → customer completes payment at checkoutUrl
      → Liqo routes & settles on Stellar
      → transaction reaches 'completed'
      → webhook 'transaction.completed' delivered to your server
```

Track status via [webhooks](./WEBHOOKS.md) (recommended) or by [polling the transaction](./TRANSACTIONS.md).

## Notes on deprecated helpers

`payAndWait()` and `payAndConfirm()` are **not supported** for hosted checkout sessions (checkout responses intentionally don't expose internal transaction IDs). They throw a `LiqoSdkError`. To wait for completion, retrieve the session by token or wait on a transaction id from a webhook.
