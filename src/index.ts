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
  paymentUrl?: string;     // present for fiat → crypto conversions
  estimatedOutput: number;
  fromAsset: string;
  toAsset: string;
  fee: number;
  stellarTxHash?: string;  // present for completed crypto → XLM conversions
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
   *
   * - **Fiat → crypto** (NGN/GHS/ZAR/USD/EUR → XLM/USDC): returns `paymentUrl` to
   *   redirect the payer to Paystack. The conversion executes automatically once
   *   payment is confirmed via Paystack webhook.
   * - **Crypto → XLM** (USDC → XLM): executes immediately via the Liqo hot wallet
   *   and returns `status: "completed"` with a `stellarTxHash`.
   *
   * @example Fiat conversion (requires `payerEmail`)
   * ```typescript
   * const result = await liqo.convert({
   *   from: 'NGN', to: 'XLM',
   *   amount: 1000,
   *   recipient: 'GXXXXXXX...',
   *   payerEmail: 'user@example.com',
   * });
   * window.location.href = result.paymentUrl!; // redirect to Paystack
   * ```
   *
   * @example Crypto conversion
   * ```typescript
   * const result = await liqo.convert({
   *   from: 'USDC', to: 'XLM',
   *   amount: 100,
   *   recipient: 'GXXXXXXX...',
   * });
   * console.log(result.stellarTxHash); // on-chain proof
   * ```
   */
  async convert(params: {
    from: string;
    to: string;
    amount: number;
    recipient: string;
    payerEmail?: string;              // required for fiat conversions
    metadata?: Record<string, unknown>;
  }): Promise<ConvertResult> {
    const response = await this.http.post<{
      transaction_id: string;
      status: string;
      payment_url?: string;
      estimated_output: number;
      from_asset: string;
      to_asset: string;
      fee: number;
      stellar_tx_hash?: string;
    }>('/convert', {
      from_asset: params.from,
      to_asset: params.to,
      amount: params.amount,
      recipient_wallet: params.recipient,
      payer_email: params.payerEmail,
      metadata: params.metadata,
    });
    return {
      transactionId: response.data.transaction_id,
      status: response.data.status,
      paymentUrl: response.data.payment_url,
      estimatedOutput: response.data.estimated_output,
      fromAsset: response.data.from_asset,
      toAsset: response.data.to_asset,
      fee: response.data.fee,
      stellarTxHash: response.data.stellar_tx_hash,
    };
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
  /**
   * Streaming-platform convenience wrapper over `convert()`.
   * Converts NGN → XLM and returns a Paystack payment URL for the viewer.
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
    const result = await this.convert({
      from: 'NGN',
      to: 'XLM',
      amount: params.amountNgn,
      recipient: params.streamerWallet,
      payerEmail: params.viewerEmail,
      metadata: { streamId: params.streamId },
    });
    return {
      transactionId: result.transactionId,
      paymentUrl: result.paymentUrl ?? '',
      estimatedXlm: result.estimatedOutput,
      amountNgn: params.amountNgn,
      feeNgn: result.fee,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
