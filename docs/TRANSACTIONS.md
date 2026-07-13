# Transactions

A transaction is the record of a payment moving through its lifecycle to settlement.

## Retrieve a transaction

```ts
const tx = await liqo.transactions.retrieve('tx_123');
// alias: await liqo.getTransaction('tx_123')
```

Maps to `GET /transaction/:id`. Returns:

```ts
interface TransactionResponse {
  transactionId: string;
  status: string;              // normalized status (see below)
  amount: number;
  asset: string;               // destination/settlement asset
  estimatedOutput?: number;
  actualOutput?: number;
  txHash: string | null;       // on-chain settlement hash, when available
  type: 'swap' | 'payout' | 'onramp';
  estimatedTimeMs?: number;
  error?: { message: string };
}
```

## Status model

The Liqo platform tracks a rich, canonical set of transaction statuses:

`created` · `awaiting_payment` · `payment_confirmed` · `routing` · `executing` · `settling` · `completed` · `failed` · `expired` · `cancelled`

For convenience, the SDK **normalizes** these into four states on `TransactionResponse.status`:

| SDK status | Canonical statuses it covers |
|---|---|
| `pending` | created, awaiting_payment, payment_confirmed, routing, executing, settling |
| `requires_action` | (awaiting inbound fiat payment) |
| `completed` | completed |
| `failed` | failed, expired, cancelled |

Use `isTerminalStatus()` to check for a final state:

```ts
import { isTerminalStatus } from '@liqo/sdk';

if (isTerminalStatus(tx.status)) {
  // completed or failed — safe to stop polling
}
```

> If you need the full canonical status, read it from the [webhook payload](./WEBHOOKS.md) `data.status`, which carries the platform's exact `TransactionStatus`.

## Waiting for completion

Poll until a transaction reaches a terminal state:

```ts
const settled = await liqo.waitForCompletion('tx_123', {
  intervalMs: 2000,   // default 2s
  timeoutMs: 60_000,  // default 60s
});
```

Throws a `LiqoSdkError` if the timeout elapses first. Defaults come from the client's `polling` option.

> **Prefer webhooks over polling** for production fulfillment — they're immediate and cheaper. Use polling for short-lived flows or as a fallback. See [Best Practices](./BEST_PRACTICES.md).

## Transaction types

- `swap` — currency/asset conversion
- `onramp` — fiat-funded flow requiring customer action
- `payout` — sending an asset to a wallet
