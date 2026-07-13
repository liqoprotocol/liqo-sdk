import { QuoteParams, QuoteResponse } from '../types';
import { normalizeQuoteResponse } from '../utils/normalize';
import { validateQuoteParams } from '../utils/validate';
import { LiqoClientLike } from '../client';

export async function quote(client: LiqoClientLike, params: QuoteParams): Promise<QuoteResponse> {
  validateQuoteParams(params);
  const response = await client.get<unknown>('/quote', {
    query: {
      fromAsset: params.fromCurrency,
      toAsset: params.toAsset,
      amount: params.amount,
      targetChain: params.targetChain,
    },
  });

  return normalizeQuoteResponse(response);
}
