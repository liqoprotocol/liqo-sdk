# API Reference

Complete reference for the `@liqo/sdk` public surface. Everything here is exported from `@liqo/sdk` and verified against the Liqo platform contract.

## `new Liqo(apiKey, options?)`

```ts
const liqo = new Liqo(apiKey: string, options?: LiqoOptions);
```

Throws `LiqoSdkError` if `apiKey` is empty.

### `LiqoOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `environment` | `'sandbox' \| 'production'` | `'sandbox'` | Selects default base URLs |
| `baseUrl` | `string` | env-based | Override API base URL |
| `checkoutBaseUrl` | `string` | `https://checkout.liqo.dev` | Override checkout base URL |
| `timeoutMs` | `number` | `15000` | Per-request timeout (`timeout` is an alias) |
| `retryAttempts` | `number` | `3` | Retries on network errors / `429` |
| `webhookSecret` | `string` | – | Enables `webhooks.verify()` |
| `debug` | `boolean` | `false` | Logs requests/responses |
| `polling` | `{ intervalMs?: number; timeoutMs?: number }` | `2000` / `60000` | Defaults for `waitForCompletion` |

### Read-only properties

`liqo.environment`, `liqo.baseUrl`, `liqo.checkoutBaseUrl`, `liqo.debug`.

---

## Payments

### `liqo.pay(params: PayParams): Promise<PayResponse>`

Creates a payment via hosted checkout. → `POST /checkout/sessions`. See [Payments](./PAYMENTS.md).

`PayParams`: `amount`, `fromCurrency`, `toAsset`, `toWallet`, `payerEmail`, `successUrl`, `cancelUrl`, optional `targetChain`, `method`, `sourceCountry`, `expiresInMinutes`, `metadata`, `idempotencyKey`.

`PayResponse` = `CheckoutSessionCreateResponse` = `{ checkoutUrl: string; session: PublicCheckoutSession }`.

---

## Checkout

### `liqo.checkout.sessions.create(params): Promise<CheckoutSessionCreateResponse>`

→ `POST /checkout/sessions`. `params` is `CreateCheckoutSessionRequest & { idempotencyKey?: string }`.

### `liqo.checkout.sessions.retrieve(token): Promise<PublicCheckoutSession>`

→ `GET /checkout/sessions/:token`.

See [Checkout](./CHECKOUT.md) for field shapes and statuses.

---

## Quotes

### `liqo.quote(params: QuoteParams): Promise<QuoteResponse>`

→ `GET /quote`. Read-only.

`QuoteParams`: `amount`, `fromCurrency`, `toAsset`, optional `targetChain`.

`QuoteResponse`: `{ fromCurrency, toAsset, inputAmount, estimatedOutput, fee, expiresAt, type?, estimatedTimeMs? }`.

---

## Transactions

### `liqo.transactions.retrieve(id): Promise<TransactionResponse>`
### `liqo.getTransaction(id): Promise<TransactionResponse>`

→ `GET /transaction/:id`. `getTransaction` is an alias.

### `liqo.waitForCompletion(id, options?): Promise<TransactionResponse>`

Polls `GET /transaction/:id` until a terminal status or timeout. `options`: `{ intervalMs?, timeoutMs? }`. Throws `LiqoSdkError` on timeout.

See [Transactions](./TRANSACTIONS.md).

---

## Webhooks

### `liqo.webhooks.verify(params): VerifiedLiqoWebhookEvent`

Verifies a signed webhook. `params`: `{ payload: string | Buffer; headers; secret?; toleranceSeconds? }`. Throws `LiqoSdkError` if invalid. See [Webhooks](./WEBHOOKS.md).

---

## Events

### `liqo.on(event, handler): () => void`

Subscribe to `'request' | 'response' | 'error'`. Returns an unsubscribe function.

```ts
const off = liqo.on('response', ({ method, path, attempt }) => { /* … */ });
off();
```

---

## Helpers & Errors

| Export | Description |
|---|---|
| `isTerminalStatus(status): boolean` | Whether a status is terminal (`completed`/`failed`) |
| `LiqoApiError` | Thrown for API error responses |
| `LiqoSdkError` | Thrown for client-side errors (subclass of `LiqoApiError`) |

## Exported types

`LiqoOptions`, `PayParams`, `PayResponse`, `CheckoutSessionCreateParams`, `CheckoutSessionCreateResponse`, `QuoteParams`, `QuoteResponse`, `TransactionResponse`, `WebhookVerifyParams`, `VerifiedWebhookEvent`, `VerifiedLiqoWebhookEvent`.

---

## Deprecated / unsupported

| Member | Status |
|---|---|
| `verifyWebhook(signature, payload)` | Deprecated — throws; use `webhooks.verify` |
| `payAndWait(params, opts)` | Unsupported for checkout — throws |
| `payAndConfirm(params, opts)` | Unsupported for checkout — throws |
