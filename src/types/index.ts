import type {
  CreateCheckoutSessionRequest,
  ErrorResponse,
  PublicCheckoutSession,
  SuccessResponse,
  TransactionStatus,
  TransactionWebhookPayload,
} from '@liqo/contracts';

export interface LiqoOptions {
  baseUrl?: string;
  checkoutBaseUrl?: string;
  timeout?: number;
  timeoutMs?: number;
  retryAttempts?: number;
  environment?: 'sandbox' | 'production';
  debug?: boolean;
  webhookSecret?: string;
  polling?: {
    intervalMs?: number;
    timeoutMs?: number;
  };
}

export interface PayParams {
  amount: number;
  fromCurrency: CreateCheckoutSessionRequest['fromAsset'];
  toAsset: CreateCheckoutSessionRequest['toAsset'];
  toWallet: string;
  payerEmail: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey?: string;
  targetChain?: 'stellar' | 'solana' | 'ethereum';
  sourceCountry?: string;
  method?: 'bank_transfer' | 'card';
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
}

export type CheckoutSessionCreateParams = CreateCheckoutSessionRequest & {
  idempotencyKey?: string;
};

export interface CheckoutSessionCreateResponse {
  checkoutUrl: string;
  session: PublicCheckoutSession;
}

export interface QuoteParams {
  amount: number;
  fromCurrency: string;
  toAsset: string;
  targetChain?: 'stellar' | 'solana' | 'ethereum';
}

export type PayResponse = CheckoutSessionCreateResponse;

export interface QuoteResponse {
  fromCurrency: string;
  toAsset: string;
  inputAmount: number;
  estimatedOutput: number;
  fee: number;
  expiresAt: string | null;
  type?: 'swap' | 'payout' | 'onramp';
  estimatedTimeMs?: number;
}

export interface TransactionResponse {
  transactionId: string;
  status: TransactionStatus | string;
  amount: number;
  asset: string;
  estimatedOutput?: number;
  actualOutput?: number;
  txHash: string | null;
  type: 'swap' | 'payout' | 'onramp';
  estimatedTimeMs?: number;
  error?: {
    message: string;
  };
}

export interface BackendErrorShape {
  error?: string;
  message?: string;
}

export type SuccessEnvelope<T> = SuccessResponse<T>;
export type ErrorEnvelope = ErrorResponse;

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

export interface InternalPayPayload {
  from_asset: string;
  to_asset: string;
  input_amount: number;
  destination_wallet: string;
  idempotency_key?: string;
  target_chain?: 'stellar' | 'solana' | 'ethereum';
  source_country?: string;
  metadata?: Record<string, unknown>;
}

export interface VerifiedWebhookEvent<T = Record<string, unknown>> {
  valid: true;
  event: T;
}

export interface WebhookVerifyParams {
  payload: string | Buffer;
  headers: Record<string, string | string[] | undefined>;
  secret?: string;
  toleranceSeconds?: number;
}

export type VerifiedLiqoWebhookEvent = VerifiedWebhookEvent<TransactionWebhookPayload>;

export type LiqoEventName = 'request' | 'response' | 'error';

export interface LiqoRequestEvent {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  attempt: number;
}

export interface LiqoResponseEvent {
  method: 'GET' | 'POST';
  path: string;
  data: unknown;
  attempt: number;
}

export interface LiqoErrorEvent {
  method: 'GET' | 'POST';
  path: string;
  error: unknown;
  attempt: number;
}
