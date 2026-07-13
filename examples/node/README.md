# Node.js example

A plain Node script: quote → create payment → retrieve session.

## Run

```bash
npm install @liqo/sdk
export LIQO_API_KEY=sk_test_...
export DESTINATION_WALLET=G...   # a valid Stellar address
node examples/node/index.mjs
```

## What it shows

- Initializing the client (`new Liqo`)
- Getting a quote (`liqo.quote`)
- Creating a payment (`liqo.pay`) and reading `checkoutUrl` / `session.token`
- Retrieving a session (`liqo.checkout.sessions.retrieve`)
- Typed error handling (`LiqoSdkError` vs `LiqoApiError`)

See [../../docs/GETTING_STARTED.md](../../docs/GETTING_STARTED.md).
