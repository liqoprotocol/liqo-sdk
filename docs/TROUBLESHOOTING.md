# Troubleshooting

Common issues and how to resolve them.

## `An API key is required to initialize Liqo`

You constructed `new Liqo('')` or with an undefined key. Ensure `process.env.LIQO_API_KEY` is set and loaded (e.g., `dotenv`).

## Webhook verification always fails (`Invalid webhook signature`)

Almost always a **raw body** problem. The signature is over the exact bytes Liqo sent.

- **Express:** use `express.raw({ type: 'application/json' })` on the webhook route — do **not** apply `express.json()` first.
- **Next.js App Router:** read `await req.text()` and pass that string as `payload`.
- Confirm you pass the request **headers** (needs `X-Liqo-Signature` and `X-Liqo-Timestamp`).
- Confirm the `webhookSecret` (or `secret`) matches the one configured for that endpoint.

## `Webhook timestamp is outside the allowed tolerance`

The request is older than 300 seconds (or your server clock is skewed). Sync your server clock (NTP). You can widen `toleranceSeconds` if genuinely needed, but keep it tight for replay protection.

## `toWallet must be a valid Stellar/Ethereum/Solana wallet`

The wallet doesn't match the `targetChain` (or the asset-inferred chain). Stellar = `G…` (56 chars), Ethereum = `0x…` (40 hex), Solana = base58 (32–44 chars). Set `targetChain` explicitly if needed.

## `Liqo is temporarily unavailable: …`

The API returned a `5xx`. The SDK already retried network errors and `429`. Retry with backoff; if it persists, check Liqo status and include the `requestId` when contacting support.

## Requests hang or time out

- Increase `timeoutMs` if your environment/network is slow.
- In serverless, ensure the function timeout is longer than the SDK `timeoutMs`.
- Verify `baseUrl` points at a reachable environment (sandbox defaults to `http://localhost:3000`).

## `Cannot find module '@liqo/contracts'` when building from source

This is a **build-time/dev-only** concern — **published consumers of `@liqo/sdk` are unaffected** (the SDK ships self-contained types and does not depend on `@liqo/contracts`).

To build the SDK from source, check out [`liqo-platform`](https://github.com/liqoprotocol/liqo-platform) as a sibling directory (`../liqo-platform`) and build its `@liqo/contracts` package so `dist/` exists. Build/test resolution is wired via `tsconfig.json` `paths` and `jest.config.js` `moduleNameMapper`. See [CONTRIBUTING.md](../CONTRIBUTING.md#building).

## Edge/browser errors about `crypto` or `Buffer`

The SDK is server-side (Node) and uses Node built-ins. See [examples/RUNTIME_COMPATIBILITY.md](../examples/RUNTIME_COMPATIBILITY.md) for edge runtimes; never run it in a browser.

## `payAndWait is not supported for checkout sessions`

Expected — use `checkout.sessions.retrieve(token)` to poll checkout status, or wait on a transaction id received via webhook with `waitForCompletion`.

## Still stuck?

Open a [bug report](https://github.com/liqoprotocol/liqo-sdk/issues/new/choose) (redact secrets) or ask in [Discussions](https://github.com/liqoprotocol/liqo-sdk/discussions).
