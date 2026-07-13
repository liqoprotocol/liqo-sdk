# Migration Guide

## Upgrading to 2.x

The 2.x line aligns the SDK with Liqo's canonical contract layer and the hosted-checkout payment model.

### Payments are hosted-checkout based

`pay()` now creates a **hosted checkout session** and returns a `checkoutUrl` to redirect your customer to (plus the `session`). Redirect the customer rather than expecting an immediate settled transaction.

```ts
const checkout = await liqo.pay({ /* … */ });
return redirect(checkout.checkoutUrl);
```

### Webhook verification API changed

Use the object form, which validates the timestamp and enables replay protection:

```ts
// Before (deprecated — throws)
liqo.verifyWebhook(signature, payload);

// Now
const event = liqo.webhooks.verify({ payload: rawBody, headers: req.headers });
```

Pass the **raw** request body. See [Webhooks](./WEBHOOKS.md).

### `payAndWait` / `payAndConfirm` are unsupported

They throw for hosted checkout sessions (checkout responses don't expose internal transaction IDs). Instead:

- Poll the session: `liqo.checkout.sessions.retrieve(token)`, or
- Wait on a transaction id received via webhook: `liqo.waitForCompletion(transactionId)`.

### Status normalization

`TransactionResponse.status` is a normalized value (`pending` / `requires_action` / `completed` / `failed`). For the full canonical `TransactionStatus`, read `data.status` from the [webhook payload](./WEBHOOKS.md). In 2.0, `cancelled` is correctly treated as terminal by `isTerminalStatus`/`waitForCompletion`.

### Package metadata

`@liqo/sdk` is now described as *Global Payments Infrastructure for Modern Businesses*. No import paths changed.

## Deprecation policy

Deprecated members remain importable for one major version where practical and throw or warn with guidance. Breaking changes are called out in [CHANGELOG.md](../CHANGELOG.md) and here.

## Getting help

If you hit a migration issue, open a [discussion](https://github.com/liqoprotocol/liqo-sdk/discussions) or [issue](https://github.com/liqoprotocol/liqo-sdk/issues/new/choose).
