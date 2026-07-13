# FAQ

## General

**What is Liqo?**
Global Payments Infrastructure for Modern Businesses — accept payments in fiat, stablecoins, or crypto and settle in the asset you want, through a single API. See [Introduction](./INTRODUCTION.md).

**Is this SDK server-side or client-side?**
Server-side (Node.js 18+). Never use it or your API key in a browser or mobile app.

**Which languages/runtimes are supported?**
TypeScript and JavaScript on Node.js. Edge runtimes need Node compatibility — see [examples/RUNTIME_COMPATIBILITY.md](../examples/RUNTIME_COMPATIBILITY.md).

## Payments

**What currencies can customers pay in?**
`NGN`, `GHS`, `ZAR`, `USD`, `EUR`, `GBP`.

**What assets can I settle in?**
`USDC`, `USDT`, `XLM`, `ETH`, `BTC`, `SOL`.

**What's the difference between `pay()` and `checkout.sessions.create()`?**
`pay()` is a friendlier wrapper (uses `fromCurrency`/`toWallet`) that calls `checkout.sessions.create()` (canonical `fromAsset`/`recipientWallet`). Both create the same hosted checkout session.

**How do I know when a payment is complete?**
Listen for the `transaction.completed` [webhook](./WEBHOOKS.md) (recommended), or poll with `waitForCompletion()`.

**Do quotes commit me to anything?**
No. Quotes are read-only estimates and expire (`expiresAt`).

## Webhooks

**Why does verification fail even though the secret is right?**
You're almost certainly verifying a parsed/re-serialized body. Use the **raw** request body. See [Troubleshooting](./TROUBLESHOOTING.md).

**Can the same webhook arrive twice?**
Yes. Make your handler idempotent (dedupe on `transactionId` + event).

## Errors & Reliability

**Does the SDK retry?**
Yes — network errors and `429`, with exponential backoff, up to `retryAttempts` (default 3).

**How do I tell a validation error from a server error?**
`LiqoSdkError` is client-side (validation/network); `LiqoApiError` is a server response. See [Error Handling](./ERROR_HANDLING.md).

## Stellar

**Do I need to know anything about blockchains?**
No. You call `pay()`; Liqo routes and settles on Stellar for you.

**Does Liqo use Soroban smart contracts?**
Not today. Liqo currently leverages Stellar's existing network capabilities for settlement and payment infrastructure. Programmable workflows powered by Soroban are a future roadmap item.

## Project

**Is the SDK open source?**
Yes — MIT licensed. See [CONTRIBUTING.md](../CONTRIBUTING.md).

**Where's the source of truth for the API?**
The [`liqo-platform`](https://github.com/liqoprotocol/liqo-platform) repository and its `@liqo/contracts` package.
