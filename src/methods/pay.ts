import { PayParams, PayResponse } from '../types';
import { validatePayParams } from '../utils/validate';
import { LiqoClientLike } from '../client';
import { createCheckoutSession } from './checkout';

function mapPayParams(params: PayParams) {
  return {
    fromAsset: params.fromCurrency,
    toAsset: params.toAsset,
    amount: params.amount,
    recipientWallet: params.toWallet,
    payerEmail: params.payerEmail,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    targetChain: params.targetChain,
    sourceCountry: params.sourceCountry,
    method: params.method,
    expiresInMinutes: params.expiresInMinutes,
    metadata: params.metadata,
    idempotencyKey: params.idempotencyKey,
  };
}

export async function pay(client: LiqoClientLike, params: PayParams): Promise<PayResponse> {
  validatePayParams(params);
  const payload = mapPayParams(params);
  client.logDebug('Mapped checkout session payload', payload);
  return createCheckoutSession(client, payload);
}
