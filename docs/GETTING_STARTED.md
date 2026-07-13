# Getting Started

Accept your first Liqo payment in about five minutes.

## Prerequisites

- **Node.js 18+**
- A Liqo API key (start with a **sandbox** key)

## 1. Install

```bash
npm install @liqo/sdk
```

## 2. Initialize the client

```ts
import { Liqo } from '@liqo/sdk';

const liqo = new Liqo(process.env.LIQO_API_KEY!, {
  environment: 'sandbox', // default
});
```

Store your key in an environment variable — never hard-code it.

## 3. (Optional) Get a quote

```ts
const quote = await liqo.quote({
  amount: 15000,
  fromCurrency: 'NGN',
  toAsset: 'USDC',
  targetChain: 'stellar',
});

console.log(`≈ ${quote.estimatedOutput} USDC, fee ${quote.fee}`);
```

## 4. Create a payment

```ts
const checkout = await liqo.pay({
  amount: 15000,
  fromCurrency: 'NGN',
  toAsset: 'USDC',
  toWallet: 'G...RECIPIENT',   // a valid Stellar address for targetChain 'stellar'
  payerEmail: 'customer@example.com',
  targetChain: 'stellar',
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
});

// Redirect your customer here to complete payment:
return redirect(checkout.checkoutUrl);
```

## 5. Handle the result via webhook

Liqo notifies your server when the transaction settles. Verify the signature using the **raw body**:

```ts
app.post('/webhooks/liqo', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const event = liqo.webhooks.verify({ payload: req.body, headers: req.headers });
    if (event.event === 'transaction.completed') {
      // fulfill the order for event.data.transactionId
    }
    res.sendStatus(200);
  } catch {
    res.sendStatus(400);
  }
});
```

Configure `webhookSecret` on the client (or pass `secret` to `verify`). See [Webhooks](./WEBHOOKS.md).

## 6. (Optional) Check status directly

```ts
const tx = await liqo.transactions.retrieve('tx_123');
console.log(tx.status);
```

## You're done 🎉

Next:

- [Payments](./PAYMENTS.md) — options and lifecycle
- [Checkout](./CHECKOUT.md) — sessions in depth
- [Error Handling](./ERROR_HANDLING.md) — robust integrations
- [Best Practices](./BEST_PRACTICES.md) — going to production
- Full runnable apps in [`examples/`](../examples)
