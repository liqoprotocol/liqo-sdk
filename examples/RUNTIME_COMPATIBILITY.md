# Runtime Compatibility

`@liqo/sdk` is a **server-side Node.js library**. It uses:

- `axios` for HTTP
- Node's `crypto` (idempotency keys via `randomUUID`, webhook HMAC verification)
- Node's `Buffer` (webhook payload handling)

Because of the `crypto`/`Buffer` usage, it does **not** run unmodified on browser or pure-edge runtimes. Here's how it behaves per runtime.

| Runtime | Supported? | Notes |
|---|---|---|
| **Node.js 18+** | ✅ Fully | The primary target. |
| **Bun** | ✅ Likely | Bun implements Node's `crypto`/`Buffer`. Test webhook verification in your setup. |
| **Deno** | ⚠️ With Node compat | Import via `npm:@liqo/sdk` and enable Node built-ins (`node:crypto`, `node:buffer`). |
| **Cloudflare Workers** | ⚠️ With `nodejs_compat` | Add the `nodejs_compat` flag so `node:crypto`/`node:buffer` resolve. Prefer a small Node service if you hit limitations. |
| **Vercel Functions (Node)** | ✅ | Use the **Node.js** runtime, not Edge. In Next.js route handlers set `export const runtime = 'nodejs'`. |
| **Vercel Edge / Next.js Edge** | ❌ as-is | No Node `crypto`/`Buffer`. Use the Node runtime instead. |
| **Browsers / React Native** | ❌ Never | API keys are secrets — call your backend. See [react](./react). |

## Recommended patterns

- **Serverless (Node):** construct the client at module scope so it's reused across warm invocations.
- **Edge-first apps:** run Liqo calls in a Node function/route (e.g., `runtime = 'nodejs'`), and keep only non-secret UI logic at the edge.
- **Webhook verification** specifically needs Node `crypto`. Always run your webhook handler on a Node runtime and verify the **raw** body.

## If you must run on the edge

Enable your platform's Node compatibility layer (`nodejs_compat` on Cloudflare, `--unstable-node-globals`/npm specifiers on Deno). If a runtime lacks `crypto.timingSafeEqual` or `Buffer`, webhook verification will fail — verify webhooks on a Node runtime instead.

See also [docs/INSTALLATION.md](../docs/INSTALLATION.md).
