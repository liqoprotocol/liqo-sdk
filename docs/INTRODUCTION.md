# Introduction

**Liqo is Global Payments Infrastructure for Modern Businesses.** A business integrates Liqo once and can then accept payments in local fiat, stablecoins, or crypto and settle in the asset it actually wants — without holding reserves, running a treasury, or integrating payment providers directly.

`@liqo/sdk` is the official TypeScript/JavaScript client for adding Liqo payments to a **Node.js backend**.

## What the SDK does

The SDK gives you a typed, ergonomic wrapper over the Liqo API:

- **Create payments** via hosted checkout (`pay`, `checkout.sessions.create`)
- **Retrieve checkout sessions** (`checkout.sessions.retrieve`)
- **Get quotes** (`quote`)
- **Retrieve & poll transactions** (`transactions.retrieve`, `waitForCompletion`)
- **Verify signed webhooks** (`webhooks.verify`)

It handles authentication, retries with backoff, timeouts, idempotency keys on writes, response-envelope unwrapping, and typed errors — so you don't have to.

## Core concepts

| Concept | Meaning |
|---|---|
| **Checkout session** | A hosted payment page. You create one and redirect your customer to its `checkoutUrl`. Identified by a public `token` (`cs_…`). |
| **Quote** | An estimate of output amount, fee, and expiry for a conversion. Read-only. |
| **Transaction** | The record of a payment moving through its lifecycle to settlement. |
| **Webhook** | A signed HTTP callback Liqo sends your server when a transaction's status changes. |
| **Settlement** | Final delivery of the destination asset — Liqo settles on Stellar. |

## The payment lifecycle (at a glance)

```
quote (optional)
   → pay() / checkout.sessions.create()   → returns checkoutUrl + session token
   → redirect customer to checkoutUrl      → customer pays
   → Liqo routes & settles on Stellar
   → webhook: transaction.completed        → you fulfill the order
```

See [Payments](./PAYMENTS.md) and [Transactions](./TRANSACTIONS.md) for detail.

## How Stellar fits in

Liqo settles payments on the **Stellar network** because it's fast (seconds), low-cost (fractions of a cent), and stablecoin-native (USDC). Your customer's value arrives quickly and cheaply, and **as a developer you never touch the blockchain** — you call `pay()` and Liqo handles routing and settlement.

> **Current implementation:** Liqo currently leverages Stellar's existing network capabilities for settlement and payment infrastructure.
>
> **Future roadmap:** programmable payment workflows powered by Soroban, where they provide clear value. Soroban is **not** integrated today.

## What the SDK is not

- It is **not** a browser/mobile SDK. API keys are secrets; keep them server-side.
- It does **not** expose every Liqo platform capability. It focuses on the payments surface (checkout, quotes, transactions, webhooks). Account, organization, and project management are available via the API but are not part of this SDK today.

## Next steps

- [Getting Started](./GETTING_STARTED.md) — your first payment
- [Authentication](./AUTHENTICATION.md) — keys & environments
- [API Reference](./API_REFERENCE.md) — the complete surface
