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

  // ─── Tip Flow (streaming platform NGN → XLM) ──────────────────────────────

  /**
   * Initialize a viewer tip. Returns a Paystack payment URL to redirect the viewer to.
   *
   * @example
   * ```typescript
   * const tip = await liqo.initializeTip({
   *   viewerEmail: 'viewer@example.com',
   *   amountNgn: 1000,
   *   streamerWallet: 'GXXXXXXX...',
   *   streamId: 'stream_abc123',
   * });
   * // Redirect viewer to tip.paymentUrl
   * window.location.href = tip.paymentUrl;
   * ```
   */
  async initializeTip(params: {
    viewerEmail: string;
    amountNgn: number;
    streamerWallet: string;
    streamId: string;
  }): Promise<{
    transactionId: string;
    paymentUrl: string;
    estimatedXlm: number;
    amountNgn: number;
    feeNgn: number;
    expiresAt: string;
  }> {
    const response = await this.http.post<{
      transaction_id: string;
      payment_url: string;
      estimated_xlm: number;
      amount_ngn: number;
      fee_ngn: number;
      expires_at: string;
    }>('/tip/initialize', {
      viewer_email: params.viewerEmail,
      amount_ngn: params.amountNgn,
      streamer_wallet: params.streamerWallet,
      stream_id: params.streamId,
    });
    return {
      transactionId: response.data.transaction_id,
      paymentUrl: response.data.payment_url,
      estimatedXlm: response.data.estimated_xlm,
      amountNgn: response.data.amount_ngn,
      feeNgn: response.data.fee_ngn,
      expiresAt: response.data.expires_at,
    };
  }

  /**
   * Confirm a tip after Paystack payment completes.
   * Verifies payment and triggers the USDC → XLM swap.
   */
  async confirmTip(paystackReference: string): Promise<{
    transactionId: string;
    status: string;
    xlmSent: number;
    streamerWallet: string;
    stellarTxHash: string;
  }> {
    const response = await this.http.post<{
      transaction_id: string;
      status: string;
      xlm_sent: number;
      streamer_wallet: string;
      stellar_tx_hash: string;
    }>('/tip/confirm', { paystack_reference: paystackReference });
    return {
      transactionId: response.data.transaction_id,
      status: response.data.status,
      xlmSent: response.data.xlm_sent,
      streamerWallet: response.data.streamer_wallet,
      stellarTxHash: response.data.stellar_tx_hash,
    };
  }

  /**
   * Check the status of a tip transaction.
   */
  async getTipStatus(transactionId: string): Promise<{
    transactionId: string;
    status: string;
    xlmSent?: number;
    streamerWallet?: string;
    stellarTxHash?: string;
  }> {
    const response = await this.http.get<{
      transaction_id: string;
      status: string;
      xlm_sent?: number;
      streamer_wallet?: string;
      stellar_tx_hash?: string;
    }>(`/tip/status/${transactionId}`);
    return {
      transactionId: response.data.transaction_id,
      status: response.data.status,
      xlmSent: response.data.xlm_sent,
      streamerWallet: response.data.streamer_wallet,
      stellarTxHash: response.data.stellar_tx_hash,
    };
  }
}

export default LiqoClient;
