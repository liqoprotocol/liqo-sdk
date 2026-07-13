import { QuoteResponse, TransactionResponse } from '../types';

interface LegacyPayResponse {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'requires_action';
  estimatedOutput: number;
  txHash: string | null;
  type: 'swap' | 'payout' | 'onramp';
  estimatedTimeMs?: number;
  checkoutUrl?: string;
  error?: {
    message: string;
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function readEstimatedTime(record: Record<string, unknown>): number | undefined {
  const route = asRecord(record['routeUsed'] ?? record['route_used']);
  return readNumber(
    route,
    'totalEstimatedLatencyMs',
    'total_estimated_latency_ms',
    'estimatedLatencyMs',
    'estimated_latency_ms'
  );
}

function readFailureReason(record: Record<string, unknown>): string | undefined {
  const metadata = asRecord(record['metadata']);
  return readString(metadata, 'failureReason', 'failure_reason');
}

export function normalizeStatus(status: string | undefined): 'pending' | 'completed' | 'failed' | 'requires_action' {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'failed':
    case 'expired':
    case 'cancelled':
    case 'reverted':
    case 'reversed':
      return 'failed';
    case 'requires_action':
    case 'fiat_pending':
      return 'requires_action';
    default:
      return 'pending';
  }
}

export function isTerminalStatus(status: string | undefined): boolean {
  const normalized = normalizeStatus(status);
  return normalized === 'completed' || normalized === 'failed';
}

function readTxHash(record: Record<string, unknown>): string | null {
  const direct = readString(record, 'txHash', 'tx_hash', 'stellar_tx_hash');
  if (direct) return direct;

  const providerRefs = asRecord(record['providerRefs'] ?? record['provider_refs']);
  const finalSettlement = asRecord(providerRefs['finalSettlement'] ?? providerRefs['final_settlement']);
  return readString(finalSettlement, 'txHash', 'tx_hash') ?? null;
}

export function normalizePayResponse(
  payload: unknown,
  config: { checkoutBaseUrl?: string } = {}
): LegacyPayResponse {
  const record = asRecord(payload);
  const status = normalizeStatus(readString(record, 'status'));
  const failureReason = readFailureReason(record);
  const fiatIntent = asRecord(record['fiat_intent']);
  const fiatIntentId = readString(fiatIntent, 'id');
  const legacyPaymentUrl = readString(record, 'payment_url', 'paymentUrl');
  const checkoutBaseUrl = config.checkoutBaseUrl ?? 'https://checkout.liqo.dev';

  return {
    transactionId: readString(record, 'transaction_id', 'transactionId', 'id') ?? '',
    status,
    estimatedOutput: readNumber(record, 'estimated_output', 'estimatedOutput') ?? 0,
    txHash: readTxHash(record),
    type: status === 'requires_action' ? 'onramp' : 'swap',
    estimatedTimeMs: readEstimatedTime(record),
    checkoutUrl: status === 'requires_action'
      ? fiatIntentId
        ? `${checkoutBaseUrl.replace(/\/+$/, '')}/pay/${fiatIntentId}`
        : legacyPaymentUrl
      : undefined,
    error: status === 'failed'
      ? { message: failureReason ?? 'Operation failed' }
      : undefined,
  };
}

export function normalizeQuoteResponse(payload: unknown): QuoteResponse {
  const record = asRecord(payload);

  return {
    fromCurrency: readString(record, 'from_asset', 'fromAsset') ?? '',
    toAsset: readString(record, 'to_asset', 'toAsset', 'destination_asset', 'destinationAsset') ?? '',
    inputAmount: readNumber(record, 'input_amount', 'inputAmount', 'amount') ?? 0,
    estimatedOutput: readNumber(record, 'estimated_output', 'estimatedOutput') ?? 0,
    fee: readNumber(record, 'fee') ?? 0,
    expiresAt: readString(record, 'expires_at', 'expiresAt') ?? null,
    type: 'swap',
    estimatedTimeMs: readEstimatedTime(record),
  };
}

export function normalizeTransactionResponse(payload: unknown): TransactionResponse {
  const record = asRecord(payload);
  const status = normalizeStatus(readString(record, 'status'));
  const failureReason = readFailureReason(record);

  return {
    transactionId: readString(record, 'transaction_id', 'transactionId', 'id') ?? '',
    status,
    amount: readNumber(record, 'amount') ?? 0,
    asset:
      readString(record, 'destinationAsset', 'destination_asset', 'to_asset', 'asset') ??
      readString(record, 'sourceAsset', 'source_asset') ??
      '',
    estimatedOutput: readNumber(record, 'estimated_output', 'estimatedOutput'),
    actualOutput: readNumber(record, 'actual_output', 'actualOutput'),
    txHash: readTxHash(record),
    type: 'swap',
    estimatedTimeMs: readEstimatedTime(record),
    error: status === 'failed'
      ? { message: failureReason ?? 'Operation failed' }
      : undefined,
  };
}
