import { TransactionResponse } from '../types';
import { normalizeTransactionResponse } from '../utils/normalize';
import { LiqoClientLike } from '../client';

export async function getTransaction(client: LiqoClientLike, transactionId: string): Promise<TransactionResponse> {
  const response = await client.get<unknown>(`/transaction/${transactionId}`);
  return normalizeTransactionResponse(response);
}
