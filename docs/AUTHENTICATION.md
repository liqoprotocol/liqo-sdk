# Authentication

Liqo authenticates every request with an **API key** sent as a Bearer token. The SDK attaches it automatically.

## Providing your key

```ts
import { Liqo } from '@liqo/sdk';

const liqo = new Liqo(process.env.LIQO_API_KEY!);
```

The SDK sends `Authorization: Bearer <your key>` on every request, along with `X-Liqo-Version` (the API version) and SDK identification headers.

## Environments

```ts
const sandbox = new Liqo(process.env.LIQO_TEST_KEY!, { environment: 'sandbox' });    // default
const live    = new Liqo(process.env.LIQO_LIVE_KEY!, { environment: 'production' });
```

| Environment | Default base URL |
|---|---|
| `sandbox` (default) | `http://localhost:3000` |
| `production` | `https://api.liqo.dev` |

Override with `baseUrl` if you target a hosted staging environment:

```ts
const liqo = new Liqo(key, { environment: 'production', baseUrl: 'https://api.your-liqo.example' });
```

> **Domains:** the Liqo API and hosted checkout currently use `liqo.dev` (the platform source of truth); the marketing site is `liqo.network`. Confirm your account's base URL in the dashboard.

## Security rules

- **Server-side only.** Never ship an API key to a browser, mobile app, or any client the user controls. Frontends should call *your* backend, which uses the SDK. See [examples/react](../examples/react).
- **Use environment variables.** Never hard-code or commit keys.
- **Separate keys per environment.** Sandbox keys for development/testing; live keys only in production.
- **Rotate keys** if one is exposed, using your Liqo dashboard.

## Authentication errors

If a key is missing or invalid, the API responds with an error the SDK raises as a `LiqoApiError` (e.g. `code: 'UNAUTHORIZED'`). See [Error Handling](./ERROR_HANDLING.md).

```ts
new Liqo(''); // throws LiqoSdkError('An API key is required to initialize Liqo')
```
