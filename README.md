<div align="center">

# @liqo/sdk

**The official TypeScript & JavaScript SDK for Liqo — Global Payments Infrastructure for Modern Businesses.**

Accept payments from anywhere, in any supported currency, and settle in the asset you choose — through a single API.

[![npm version](https://img.shields.io/badge/npm-%40liqo%2Fsdk-0FFD41.svg?style=flat-square)](https://www.npmjs.com/package/@liqo/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-0FFD41.svg?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Built on Stellar](https://img.shields.io/badge/Settles%20on-Stellar-000000.svg?style=flat-square)](./docs/INTRODUCTION.md#how-stellar-fits-in)

[Documentation](./docs/README.md) · [Quick Start](#quick-start) · [Examples](./examples) · [API Reference](./docs/API_REFERENCE.md)

</div>

---

## Table of Contents

- [What is Liqo?](#what-is-liqo)
- [Why the SDK?](#why-the-sdk)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Initializing the Client](#initializing-the-client)
- [Creating Payments](#creating-payments)
- [Hosted Checkout](#hosted-checkout)
- [Quotes](#quotes)
- [Transactions](#transactions)
- [Webhooks](#webhooks)
- [Error Handling](#error-handling)
- [TypeScript Support](#typescript-support)
- [Framework & Runtime Compatibility](#framework--runtime-compatibility)
- [How Stellar Fits In](#how-stellar-fits-in)
- [API Reference](#api-reference)
- [Documentation](#documentation)
- [Examples](#examples)
- [Versioning](#versioning)
- [Contributing](#contributing)
- [License](#license)

## What is Liqo?

**Liqo is Global Payments Infrastructure for Modern Businesses.** A business integrates Liqo once and can then accept payments in local fiat, stablecoins, or crypto and settle in the asset they actually want — without holding reserves, running a treasury, or integrating providers directly.

This SDK is the fastest way to add Liqo payments to a **Node.js backend**.

## Why the SDK?

- ⚡ **One call to accept a payment** — create a hosted checkout session and redirect your customer.
- 🔤 **Type-safe** — request and response types are derived from Liqo's canonical contracts.
- 🔐 **Secure webhooks** — verify signed events with a single method (`liqo.webhooks.verify`).
- 🔁 **Resilient by default** — automatic retries with backoff, timeouts, and idempotency keys on writes.
- 🧭 **Great DX** — fluent, discoverable API surface with helpful, typed errors.

## Installation

```bash
npm install @liqo/sdk
# or
pnpm add @liqo/sdk
# or
yarn add @liqo/sdk
```

**Requirements:** Node.js **18+**. The SDK is a server-side library — see [Framework & Runtime Compatibility](#framework--runtime-compatibility).

## Quick Start

Accept your first payment in under five minutes.

```ts
import { Liqo } from '@liqo/sdk';

const liqo = new Liqo(process.env.LIQO_API_KEY!, { environment: 'sandbox' });

// Create a hosted checkout session and redirect your customer to it.
const checkout = await liqo.pay({
  amount: 15000,
  fromCurrency: 'NGN',            // what the customer pays in
  toAsset: 'USDC',               // what you settle in
  toWallet: 'G...RECIPIENT',     // destination wallet
  payerEmail: 'customer@example.com',
  targetChain: 'stellar',
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
});

console.log(checkout.checkoutUrl);     // → send your customer here
console.log(checkout.session.token);   // → cs_… (use to look up status later)
```

## Authentication

Liqo authenticates with an **API key** sent as a Bearer token. You pass it when constructing the client; the SDK attaches it to every request.

```ts
const liqo = new Liqo(process.env.LIQO_API_KEY!);
```

- Use a **test/sandbox** key while developing (`environment: 'sandbox'`, the default).
- Switch to a **live** key with `environment: 'production'`.
- **Never expose your API key in a browser or mobile app.** The SDK is for server-side use only. Frontends should call *your* backend, which uses the SDK. See [examples/react](./examples/react).

## Initializing the Client

```ts
import { Liqo } from '@liqo/sdk';

const liqo = new Liqo('sk_live_...', {
  environment: 'production',      // 'sandbox' (default) | 'production'
  timeoutMs: 15_000,             // per-request timeout (default 15s)
  retryAttempts: 3,              // retries on network errors / 429 (default 3)
  webhookSecret: 'whsec_...',    // enables liqo.webhooks.verify()
  debug: false,                  // logs requests/responses when true
  // baseUrl / checkoutBaseUrl can be overridden for self-hosted or staging
});
```

**Base URLs** (defaults): `sandbox` → `http://localhost:3000`, `production` → `https://api.liqo.dev`. Override with `baseUrl` if you point at a different environment.

> **Note on domains:** the Liqo API and hosted checkout currently use the `liqo.dev` domain (the platform source of truth). The marketing site lives at `liqo.network`. Confirm the correct base URL for your account in your dashboard.

## Creating Payments

`liqo.pay(params)` is the recommended entry point. It validates input, creates a hosted checkout session, and returns the URL to redirect your customer to.

```ts
const checkout = await liqo.pay({
  amount: 15000,
  fromCurrency: 'NGN',
  toAsset: 'USDC',
  toWallet: 'G...RECIPIENT',
  payerEmail: 'customer@example.com',
  targetChain: 'stellar',        // 'stellar' | 'solana' | 'ethereum'
  method: 'bank_transfer',       // optional: 'bank_transfer' | 'card'
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
  expiresInMinutes: 30,          // optional (5–1440)
  metadata: { orderId: 'ord_123' },
  idempotencyKey: 'ord_123',     // optional; safe retries
});
```

**Supported values** (from the Liqo contract):

| Field | Accepted values |
|---|---|
| `fromCurrency` | `NGN`, `GHS`, `ZAR`, `USD`, `EUR`, `GBP` |
| `toAsset` | `USDC`, `USDT`, `XLM`, `ETH`, `BTC`, `SOL` |
| `targetChain` | `stellar`, `solana`, `ethereum` |
| `method` | `bank_transfer`, `card` |

The wallet is validated client-side against the target chain before the request is sent.

## Hosted Checkout

Under the hood, `pay()` calls `checkout.sessions.create()`. You can also call it directly with the canonical request shape:

```ts
const checkout = await liqo.checkout.sessions.create({
  fromAsset: 'NGN',
  toAsset: 'USDC',
  amount: 15000,
  recipientWallet: 'G...RECIPIENT',
  payerEmail: 'customer@example.com',
  targetChain: 'stellar',
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
});

// Later, look up the session by its public token:
const session = await liqo.checkout.sessions.retrieve(checkout.session.token);
console.log(session.status); // created | active | completed | expired | cancelled
```

`create()` maps to `POST /checkout/sessions`; `retrieve()` maps to `GET /checkout/sessions/:token`. See [docs/CHECKOUT.md](./docs/CHECKOUT.md).

## Quotes

Estimate output, fees, and expiry before creating a payment.

```ts
const quote = await liqo.quote({
  amount: 15000,
  fromCurrency: 'NGN',
  toAsset: 'USDC',
  targetChain: 'stellar',
});

console.log(quote.estimatedOutput, quote.fee, quote.expiresAt);
```

Maps to `GET /quote`. Quotes are read-only — the SDK never falls back to a side-effecting endpoint if a quote fails.

## Transactions

```ts
const tx = await liqo.transactions.retrieve('tx_123');
// liqo.getTransaction('tx_123') is an equivalent alias

console.log(tx.status, tx.amount, tx.asset, tx.txHash);

// Poll until the transaction reaches a terminal state:
const settled = await liqo.waitForCompletion('tx_123', { intervalMs: 2000, timeoutMs: 60_000 });
```

Maps to `GET /transaction/:id`. See [docs/TRANSACTIONS.md](./docs/TRANSACTIONS.md) for the full status model.

## Webhooks

Liqo sends signed webhooks for transaction lifecycle events. **Always verify the signature using the raw request body** before trusting a payload.

```ts
// Express example — note express.raw() to preserve the raw body
app.post('/webhooks/liqo', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const event = liqo.webhooks.verify({
      payload: req.body,      // raw Buffer/string — NOT a parsed object
      headers: req.headers,   // needs X-Liqo-Signature + X-Liqo-Timestamp
    });

    // event.event → 'transaction.completed', 'transaction.failed', …
    // event.data  → { transactionId, status, amount?, asset?, … }
    console.log(event.event, event.data.transactionId);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(400); // invalid signature / timestamp
  }
});
```

The SDK verifies `HMAC-SHA256(sha256(webhookSecret), \`${timestamp}.${rawBody}\`)` against `X-Liqo-Signature`, with a 300-second timestamp tolerance for replay protection. This matches the platform's signer exactly. See [docs/WEBHOOKS.md](./docs/WEBHOOKS.md).

## Error Handling

Every API error is thrown as a typed `LiqoApiError`; client-side/validation errors are `LiqoSdkError` (a subclass).

```ts
import { LiqoApiError, LiqoSdkError } from '@liqo/sdk';

try {
  await liqo.checkout.sessions.create(/* … */);
} catch (err) {
  if (err instanceof LiqoSdkError) {
    // input/validation/network error raised by the SDK
  } else if (err instanceof LiqoApiError) {
    console.error(err.statusCode, err.code, err.message, err.requestId);
    // err.code is a canonical Liqo error code, e.g. VALIDATION_ERROR
  }
}
```

See [docs/ERROR_HANDLING.md](./docs/ERROR_HANDLING.md) for the full error-code reference.

## TypeScript Support

The SDK is written in strict TypeScript and ships self-contained type definitions. Request/response types are derived at build time from Liqo's canonical `@liqo/contracts` and **bundled into the package** — so you get the exact enums and fields the API accepts with **no extra dependency to install**. `@liqo/sdk` has a single runtime dependency (`axios`).

```ts
import type { PayParams, QuoteResponse, TransactionResponse, VerifiedLiqoWebhookEvent } from '@liqo/sdk';
```

## Framework & Runtime Compatibility

The SDK targets **Node.js 18+** and works in any Node server framework — [Express](./examples/express), [NestJS](./examples/nestjs), [Next.js route handlers](./examples/nextjs), Fastify, and plain [Node scripts](./examples/node).

It uses Node's `crypto` and `Buffer` (for idempotency keys and webhook verification), so **edge/browser runtimes are not supported out of the box.** For Cloudflare Workers, Vercel Edge, Deno, or Bun, enable Node compatibility for your platform. See [examples/RUNTIME_COMPATIBILITY.md](./examples/RUNTIME_COMPATIBILITY.md).

**Browsers/mobile:** never use the SDK (or your API key) client-side. Call your own backend, which uses the SDK. See [examples/react](./examples/react).

## How Stellar Fits In

Liqo settles payments on the **Stellar network** — fast (seconds), low-cost, and stablecoin-native — so your customers' money arrives quickly and cheaply. As a developer you don't touch the blockchain: you call `pay()` and Liqo handles routing and settlement.

> **Current implementation:** Liqo currently leverages Stellar's existing network capabilities for settlement and payment infrastructure.
> **Future roadmap:** programmable payment workflows powered by Soroban, where they provide clear value.

More in [docs/INTRODUCTION.md](./docs/INTRODUCTION.md#how-stellar-fits-in).

## API Reference

Complete method-by-method reference: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md).

| Method | Endpoint | Description |
|---|---|---|
| `liqo.pay(params)` | `POST /checkout/sessions` | Create a payment (hosted checkout) |
| `liqo.checkout.sessions.create(params)` | `POST /checkout/sessions` | Create a checkout session |
| `liqo.checkout.sessions.retrieve(token)` | `GET /checkout/sessions/:token` | Fetch a session by token |
| `liqo.quote(params)` | `GET /quote` | Estimate output, fees, expiry |
| `liqo.transactions.retrieve(id)` | `GET /transaction/:id` | Fetch a transaction |
| `liqo.getTransaction(id)` | `GET /transaction/:id` | Alias of the above |
| `liqo.waitForCompletion(id, opts?)` | `GET /transaction/:id` (poll) | Poll until terminal |
| `liqo.webhooks.verify(params)` | — | Verify a signed webhook |
| `liqo.on(event, handler)` | — | Observe `request`/`response`/`error` |

## Documentation

Full docs live in [`docs/`](./docs/README.md):

[Introduction](./docs/INTRODUCTION.md) · [Getting Started](./docs/GETTING_STARTED.md) · [Installation](./docs/INSTALLATION.md) · [Authentication](./docs/AUTHENTICATION.md) · [Payments](./docs/PAYMENTS.md) · [Checkout](./docs/CHECKOUT.md) · [Transactions](./docs/TRANSACTIONS.md) · [Webhooks](./docs/WEBHOOKS.md) · [Error Handling](./docs/ERROR_HANDLING.md) · [API Reference](./docs/API_REFERENCE.md) · [Best Practices](./docs/BEST_PRACTICES.md) · [Troubleshooting](./docs/TROUBLESHOOTING.md) · [FAQ](./docs/FAQ.md) · [Migration Guide](./docs/MIGRATION_GUIDE.md) · [Versioning](./docs/VERSIONING.md)

## Examples

Runnable examples in [`examples/`](./examples): [node](./examples/node) · [express](./examples/express) · [nestjs](./examples/nestjs) · [nextjs](./examples/nextjs) · [react](./examples/react) · [runtime compatibility](./examples/RUNTIME_COMPATIBILITY.md).

## Versioning

`@liqo/sdk` follows [Semantic Versioning](https://semver.org). See [CHANGELOG.md](./CHANGELOG.md) and [docs/VERSIONING.md](./docs/VERSIONING.md).

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and our [Code of Conduct](./CODE_OF_CONDUCT.md). Report vulnerabilities via [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Liqo

<div align="center"><sub>Global Payments Infrastructure for Modern Businesses · <a href="https://liqo.network">liqo.network</a></sub></div>
