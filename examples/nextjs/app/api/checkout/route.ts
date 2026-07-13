// Next.js App Router — create a payment. Server-side only.
// File: app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { Liqo, LiqoApiError, LiqoSdkError } from '@liqo/sdk';

// The SDK uses Node's crypto/Buffer — force the Node.js runtime (not edge).
export const runtime = 'nodejs';

const liqo = new Liqo(process.env.LIQO_API_KEY!, { environment: 'sandbox' });

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const checkout = await liqo.pay({
      amount: body.amount,
      fromCurrency: body.fromCurrency,
      toAsset: body.toAsset,
      toWallet: body.toWallet,
      payerEmail: body.payerEmail,
      targetChain: body.targetChain ?? 'stellar',
      successUrl: `${process.env.APP_URL}/success`,
      cancelUrl: `${process.env.APP_URL}/cancel`,
      idempotencyKey: body.orderId,
    });
    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, token: checkout.session.token });
  } catch (err) {
    if (err instanceof LiqoSdkError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof LiqoApiError) return NextResponse.json({ code: err.code, error: err.message }, { status: err.statusCode ?? 502 });
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
