# NestJS example

An injectable `LiqoService` and a `LiqoController` exposing checkout + webhook endpoints.

## Files

- `liqo.service.ts` — wraps the `Liqo` client (create payment, get session, verify webhook)
- `liqo.controller.ts` — `POST /api/checkout`, `GET /api/checkout/:token`, `POST /webhooks/liqo`

## Raw body for webhooks

The webhook route must receive the **raw** request body. In `main.ts`, enable the raw body and use it for the webhook path, e.g.:

```ts
import { NestFactory } from '@nestjs/core';
import { json, raw } from 'express';

const app = await NestFactory.create(AppModule);
app.use('/webhooks/liqo', raw({ type: 'application/json' }));
app.use(json());
```

Register `LiqoService` and `LiqoController` in your module's `providers`/`controllers`.

## Env

```bash
LIQO_API_KEY=sk_test_...
LIQO_WEBHOOK_SECRET=whsec_...
```

See [../../docs/WEBHOOKS.md](../../docs/WEBHOOKS.md).
