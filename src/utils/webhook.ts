import crypto from 'crypto';
import { VerifiedWebhookEvent, WebhookVerifyParams } from '../types';
import { LiqoSdkError } from './request';

function readHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const lowerName = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === lowerName);
  const value = entry?.[1];
  return Array.isArray(value) ? value[0] : value;
}

function parseSignature(signature: string | undefined): string {
  if (!signature) return '';
  const parts = signature.split(',');
  const candidate = parts.find(part => part.trim().startsWith('v1=')) ?? signature;
  return candidate.includes('=') ? candidate.split('=')[1]!.trim() : candidate.trim();
}

function hashWebhookSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function toPayloadString(payload: string | Buffer): string {
  return Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
}

export function verifyWebhookPayload<T = Record<string, unknown>>(
  webhookSecret: string | undefined,
  params: WebhookVerifyParams
): VerifiedWebhookEvent<T> {
  const secret = params.secret ?? webhookSecret;
  if (!secret) {
    throw new LiqoSdkError('webhookSecret is required to verify webhooks');
  }

  const signature = parseSignature(readHeader(params.headers, 'x-liqo-signature'));
  const timestamp = readHeader(params.headers, 'x-liqo-timestamp');
  const payload = toPayloadString(params.payload);

  if (!signature || !timestamp || !payload) {
    throw new LiqoSdkError('X-Liqo-Signature, X-Liqo-Timestamp, and payload are required for webhook verification');
  }

  const toleranceSeconds = params.toleranceSeconds ?? 300;
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    throw new LiqoSdkError('Invalid webhook timestamp');
  }

  if (Number.isFinite(toleranceSeconds) && Math.abs(Date.now() / 1000 - timestampSeconds) > toleranceSeconds) {
    throw new LiqoSdkError('Webhook timestamp is outside the allowed tolerance');
  }

  const signingKey = hashWebhookSecret(secret);
  const expected = crypto
    .createHmac('sha256', signingKey)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    throw new LiqoSdkError('Invalid webhook signature');
  }

  return {
    valid: true,
    event: JSON.parse(payload) as T,
  };
}
