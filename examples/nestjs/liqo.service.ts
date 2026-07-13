// NestJS — a thin injectable service wrapping the Liqo client.
import { Injectable } from '@nestjs/common';
import { Liqo, type PayParams, type PayResponse, type PublicCheckoutSession } from '@liqo/sdk';

@Injectable()
export class LiqoService {
  private readonly client = new Liqo(process.env.LIQO_API_KEY!, {
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    webhookSecret: process.env.LIQO_WEBHOOK_SECRET,
  });

  createPayment(params: PayParams): Promise<PayResponse> {
    return this.client.pay(params);
  }

  getSession(token: string): Promise<PublicCheckoutSession> {
    return this.client.checkout.sessions.retrieve(token);
  }

  verifyWebhook(rawBody: Buffer | string, headers: Record<string, string | string[] | undefined>) {
    return this.client.webhooks.verify({ payload: rawBody, headers });
  }
}
