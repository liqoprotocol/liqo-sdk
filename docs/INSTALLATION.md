# Installation

## Requirements

- **Node.js 18 or newer**
- A package manager: npm, pnpm, yarn, or bun

## Install

```bash
npm install @liqo/sdk
# or
pnpm add @liqo/sdk
# or
yarn add @liqo/sdk
# or
bun add @liqo/sdk
```

## Import

```ts
// ESM / TypeScript
import { Liqo } from '@liqo/sdk';

// CommonJS
const { Liqo } = require('@liqo/sdk');
```

The package ships type definitions (`dist/index.d.ts`); no `@types` package is needed.

## Configure your API key

Load your key from the environment:

```bash
# .env
LIQO_API_KEY=sk_test_your_key_here
```

```ts
const liqo = new Liqo(process.env.LIQO_API_KEY!);
```

Add `.env` to your `.gitignore`. Never commit API keys.

## Peer/runtime notes

- The SDK depends on `axios` and Node's built-in `crypto`/`Buffer`. It is a **server-side** library.
- For edge runtimes (Cloudflare Workers, Vercel Edge, Deno, Bun), see [examples/RUNTIME_COMPATIBILITY.md](../examples/RUNTIME_COMPATIBILITY.md).

## Verifying the install

```ts
import { Liqo } from '@liqo/sdk';
const liqo = new Liqo('sk_test_123', { environment: 'sandbox' });
console.log(liqo.baseUrl); // http://localhost:3000
```

## Next

- [Getting Started](./GETTING_STARTED.md)
- [Authentication](./AUTHENTICATION.md)
