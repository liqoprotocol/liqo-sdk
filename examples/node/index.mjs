// Basic Node.js example for @liqo/sdk
// Run: LIQO_API_KEY=sk_test_... node examples/node/index.mjs
import { Liqo, LiqoApiError, LiqoSdkError, isTerminalStatus } from '@liqo/sdk';

const liqo = new Liqo(process.env.LIQO_API_KEY, {
  environment: 'sandbox',
  debug: false,
});

async function main() {
  // 1) Optional: get a quote first
  const quote = await liqo.quote({
    amount: 15000,
    fromCurrency: 'NGN',
    toAsset: 'USDC',
    targetChain: 'stellar',
  });
  console.log(`Estimated output: ~${quote.estimatedOutput} USDC (fee ${quote.fee})`);

  // 2) Create a payment (hosted checkout)
  const checkout = await liqo.pay({
    amount: 15000,
    fromCurrency: 'NGN',
    toAsset: 'USDC',
    toWallet: process.env.DESTINATION_WALLET ?? 'G...RECIPIENT',
    payerEmail: 'customer@example.com',
    targetChain: 'stellar',
    successUrl: 'https://yourapp.com/success',
    cancelUrl: 'https://yourapp.com/cancel',
    idempotencyKey: `order_${Date.now()}`,
  });

  console.log('Redirect your customer to:', checkout.checkoutUrl);
  console.log('Session token:', checkout.session.token);

  // 3) Look the session back up by its token
  const session = await liqo.checkout.sessions.retrieve(checkout.session.token);
  console.log('Session status:', session.status);
}

main().catch((err) => {
  if (err instanceof LiqoSdkError) {
    console.error('Client-side error:', err.message);
  } else if (err instanceof LiqoApiError) {
    console.error('API error:', err.statusCode, err.code, err.message, err.requestId);
  } else {
    console.error('Unexpected error:', err);
  }
  process.exitCode = 1;
});

export { isTerminalStatus };
