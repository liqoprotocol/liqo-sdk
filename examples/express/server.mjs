// Express example for @liqo/sdk — checkout endpoint + secure webhook.
// Run: LIQO_API_KEY=sk_test_... LIQO_WEBHOOK_SECRET=whsec_... node examples/express/server.mjs
import express from 'express';
import { Liqo, LiqoApiError, LiqoSdkError } from '@liqo/sdk';

const liqo = new Liqo(process.env.LIQO_API_KEY, {
  environment: 'sandbox',
  webhookSecret: process.env.LIQO_WEBHOOK_SECRET,
});

const app = express();

// IMPORTANT: register the raw-body webhook route BEFORE express.json(),
// so the webhook handler receives the exact bytes Liqo signed.
app.post('/webhooks/liqo', express.raw({ type: 'application/json' }), (req, res) => {
  let event;
  try {
    event = liqo.webhooks.verify({ payload: req.body, headers: req.headers });
  } catch (err) {
    console.warn('Webhook verification failed:', err.message);
    return res.sendStatus(400);
  }

  // Respond quickly, then process asynchronously (make this idempotent).
  res.sendStatus(200);

  if (event.event === 'transaction.completed') {
    console.log('✅ Completed:', event.data.transactionId);
    // fulfill the order for event.data.transactionId
  } else if (event.event === 'transaction.failed') {
    console.log('❌ Failed:', event.data.transactionId);
  }
});

// JSON body parsing for the rest of the API.
app.use(express.json());

// Create a payment and return the checkout URL to the frontend.
app.post('/api/checkout', async (req, res) => {
  try {
    const checkout = await liqo.pay({
      amount: req.body.amount,
      fromCurrency: req.body.fromCurrency,   // 'NGN' | 'GHS' | 'ZAR' | 'USD' | 'EUR' | 'GBP'
      toAsset: req.body.toAsset,             // 'USDC' | 'USDT' | 'XLM' | 'ETH' | 'BTC' | 'SOL'
      toWallet: req.body.toWallet,
      payerEmail: req.body.payerEmail,
      targetChain: req.body.targetChain ?? 'stellar',
      successUrl: 'https://yourapp.com/success',
      cancelUrl: 'https://yourapp.com/cancel',
      idempotencyKey: req.body.orderId,
    });

    res.json({ checkoutUrl: checkout.checkoutUrl, token: checkout.session.token });
  } catch (err) {
    if (err instanceof LiqoSdkError) return res.status(400).json({ error: err.message });
    if (err instanceof LiqoApiError) return res.status(err.statusCode ?? 502).json({ code: err.code, error: err.message });
    return res.status(500).json({ error: 'Unexpected error' });
  }
});

// Look up a session's status.
app.get('/api/checkout/:token', async (req, res) => {
  try {
    const session = await liqo.checkout.sessions.retrieve(req.params.token);
    res.json(session);
  } catch (err) {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(3000, () => console.log('Listening on http://localhost:3000'));
