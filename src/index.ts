import axios, { AxiosInstance } from 'axios';

export interface Quote {
  from_asset: string;
  to_asset: string;
  input_amount: number;
  estimated_output: number;
  routing_path: string[];
  fee: number;
  expires_at: string;
}

export interface Transaction {
  id: string;
  status: string;
  sourceAsset: string;
  destinationAsset: string;
  amount: number;
  estimatedOutput: number;
  actualOutput?: number;
  fee: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConvertResult {
  transactionId: string;
  status: string;
  estimated_output: number;
  fee: number;
}

export interface PayoutResult {
  transactionId: string;
  status: string;
}

export interface LiqoClientOptions {
  baseUrl?: string;
  timeout?: number;
}

/**
 * Official Liqo JavaScript/TypeScript SDK.
 *
 * @example
 * ```typescript
 * import { LiqoClient } from '@liqo/sdk';
 *
 * const liqo = new LiqoClient('your_api_key');
 *
 * const result = await liqo.convert({
 *   from: 'USDC',
 *   to: 'XLM',
 *   amount: 100,
 *   recipient: 'stellar_wallet_address',
 * });
 * ```
 */
export class LiqoClient {
  private readonly http: AxiosInstance;

  constructor(
    apiKey: string,
    options: LiqoClientOptions = {}
  ) {
    this.http = axios.create({
      baseURL: options.baseUrl ?? 'https://liqo-platform-production.up.railway.app',
      timeout: options.timeout ?? 30_000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': '@liqo/sdk/1.0.0',
      },
    });
  }

  /**
   * Get a conversion quote.
   */
  async getQuote(params: { from: string; to: string; amount: number }): Promise<Quote> {
    const response = await this.http.get<Quote>('/quote', {
      params: { from: params.from, to: params.to, amount: params.amount },
    });
    return response.data;
  }

  /**
   * Convert one asset to another and send to a recipient wallet.
   */
  async convert(params: {
    from: string;
    to: string;
    amount: number;
    recipient: string;
  }): Promise<ConvertResult> {
    const response = await this.http.post<ConvertResult>('/convert', {
      from_asset: params.from,
      to_asset: params.to,
      amount: params.amount,
      recipient_wallet: params.recipient,
    });
    return response.data;
  }

  /**
   * Send an asset directly to a wallet (no conversion).
   */
  async payout(params: {
    asset: string;
    amount: number;
    recipient: string;
  }): Promise<PayoutResult> {
    const response = await this.http.post<PayoutResult>('/payout', {
      asset: params.asset,
      amount: params.amount,
      recipient_wallet: params.recipient,
    });
    return response.data;
  }

  /**
   * Check the status of a transaction.
   */
  async getTransaction(id: string): Promise<Transaction> {
    const response = await this.http.get<Transaction>(`/transaction/${id}`);
    return response.data;
  }
}

export default LiqoClient;
