// Next.js App Router — verify Liqo webhooks. Server-side only.
// File: app/api/webhooks/liqo/route.ts
import { NextResponse } from 'next/server';
import { Liqo } from '@liqo/sdk';

// Node runtime is required (Node crypto/Buffer).
export const runtime = 'nodejs';

const liqo = new Liqo(process.env.LIQO_API_KEY!, {
  environment: 'production',
  webhookSecret: process.env.LIQO_WEBHOOK_SECRET!,
});

export async function POST(req: Request) {
  // Read the RAW body — do not JSON.parse before verifying.
  const rawBody = await req.text();

  // Convert Next's Headers into a plain object for the SDK.
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = liqo.webhooks.verify({ payload: rawBody, headers });
  } catch {
    return new NextResponse('invalid signature', { status: 400 });
  }

  if (event.event === 'transaction.completed') {
    // fulfill the order for event.data.transactionId (make this idempotent)
  }

  return NextResponse.json({ received: true });
}
