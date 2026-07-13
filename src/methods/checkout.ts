import {
  CheckoutSessionCreateParams,
  CheckoutSessionCreateResponse,
} from '../types';
import { LiqoClientLike } from '../client';

export async function createCheckoutSession(
  client: LiqoClientLike,
  params: CheckoutSessionCreateParams
): Promise<CheckoutSessionCreateResponse> {
  const { idempotencyKey, ...body } = params;
  return client.post<CheckoutSessionCreateResponse>('/checkout/sessions', body, { idempotencyKey });
}

export async function retrieveCheckoutSession(
  client: LiqoClientLike,
  token: string
): Promise<CheckoutSessionCreateResponse['session']> {
  if (!token || token.trim().length === 0) {
    throw new Error('checkout session token is required');
  }

  return client.get<CheckoutSessionCreateResponse['session']>(`/checkout/sessions/${encodeURIComponent(token)}`);
}
