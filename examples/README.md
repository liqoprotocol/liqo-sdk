# Examples

Runnable, production-shaped examples for `@liqo/sdk`. Each shows initialization, creating a payment, hosted checkout, transactions, and secure webhook verification.

> The SDK is **server-side (Node.js 18+)**. Examples run on the server; browsers/mobile must call *your* backend (see [react](./react)).

## Directory

| Example | Runtime | Shows |
|---|---|---|
| [node](./node) | Node script | Init, quote, pay, retrieve, waitForCompletion |
| [express](./express) | Express | Checkout endpoint + webhook (raw body) |
| [nestjs](./nestjs) | NestJS | Controller + service pattern |
| [nextjs](./nextjs) | Next.js App Router | Route handlers (server-side) + webhook |
| [react](./react) | React + backend | The **secure** frontend pattern (no key in the browser) |
| [RUNTIME_COMPATIBILITY](./RUNTIME_COMPATIBILITY.md) | Edge/Bun/Deno | How to run on non-Node runtimes |

## Common setup

```bash
npm install @liqo/sdk
export LIQO_API_KEY=sk_test_...
export LIQO_WEBHOOK_SECRET=whsec_...
```

Every example reads the key from the environment — never hard-code it.

## Not sure where to start?

- Backend script or worker → [node](./node)
- REST API / webhooks → [express](./express)
- Next.js app → [nextjs](./nextjs)
- Frontend framework (React/Vue/…) → [react](./react) (call your backend)
