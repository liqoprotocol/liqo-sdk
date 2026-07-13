import axios from 'axios';
import crypto from 'crypto';
import { TransactionStatus, TransactionWebhookEvent, type TransactionWebhookPayload } from '@liqo/contracts';
import { Liqo, LiqoApiError } from '../index';

jest.mock('axios');

const mockHttp = {
  get: jest.fn(),
  post: jest.fn(),
};

(axios as jest.Mocked<typeof axios>).create = jest.fn().mockReturnValue(mockHttp as never);
(axios as jest.Mocked<typeof axios>).isAxiosError = jest.fn(
  (value: unknown): value is { isAxiosError: true } => Boolean((value as { isAxiosError?: boolean } | undefined)?.isAxiosError)
) as never;

jest.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');

const validWallet = 'GAQ3UK7VQUB4D6TQF7B4W7D4J7VJLF4R7VVVJ3TQJ6Q4QX4Q4X4Q4X4Q';

const createParams = {
  fromAsset: 'NGN' as const,
  toAsset: 'USDC' as const,
  amount: 1500,
  recipientWallet: validWallet,
  payerEmail: 'buyer@example.com',
  targetChain: 'stellar' as const,
  successUrl: 'https://merchant.example/success',
  cancelUrl: 'https://merchant.example/cancel',
};

const publicSession = {
  token: 'cs_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopq',
  status: 'active',
  amount: 1500,
  currency: 'NGN',
  destinationAsset: 'USDC',
  targetChain: 'stellar',
  expiresAt: '2099-01-01T00:00:00.000Z',
  successUrl: 'https://merchant.example/success',
  cancelUrl: 'https://merchant.example/cancel',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Liqo SDK Sprint 7', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses centralized API client headers', () => {
    new Liqo('sk_test_123', { timeoutMs: 12_000, retryAttempts: 5 });

    expect((axios as jest.Mocked<typeof axios>).create).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 12_000,
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test_123',
          'X-Liqo-Version': '2',
          'X-Liqo-SDK': 'js/2.x',
        }),
      })
    );
  });

  it('creates checkout sessions through liqo.checkout.sessions.create', async () => {
    mockHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          checkoutUrl: 'https://checkout.liqo.dev/pay/cs_123',
          session: publicSession,
        },
      },
    });

    const liqo = new Liqo('sk_test_123');
    const result = await liqo.checkout.sessions.create({
      ...createParams,
      idempotencyKey: 'idem_123',
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/checkout/sessions',
      createParams,
      {
        headers: {
          'Idempotency-Key': 'idem_123',
        },
      }
    );
    expect(result.checkoutUrl).toBe('https://checkout.liqo.dev/pay/cs_123');
    expect(result.session).toEqual(publicSession);
  });

  it('retrieves checkout sessions by token', async () => {
    mockHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: publicSession,
      },
    });

    const liqo = new Liqo('sk_test_123');
    const result = await liqo.checkout.sessions.retrieve(publicSession.token);

    expect(mockHttp.get).toHaveBeenCalledWith(`/checkout/sessions/${publicSession.token}`, undefined);
    expect(result).toEqual(publicSession);
  });

  it('quotes using canonical camelCase request fields only', async () => {
    mockHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          fromAsset: 'NGN',
          toAsset: 'USDC',
          inputAmount: 1500,
          estimatedOutput: 1,
          fee: 10,
          expiresAt: '2099-01-01T00:00:00.000Z',
        },
      },
    });

    const liqo = new Liqo('sk_test_123');
    const result = await liqo.quote({
      amount: 1500,
      fromCurrency: 'NGN',
      toAsset: 'USDC',
      targetChain: 'stellar',
    });

    expect(mockHttp.get).toHaveBeenCalledWith(
      '/quote?fromAsset=NGN&toAsset=USDC&amount=1500&targetChain=stellar',
      undefined
    );
    expect(mockHttp.post).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      fromCurrency: 'NGN',
      toAsset: 'USDC',
      inputAmount: 1500,
    });
  });

  it('does not fall back to /convert when quote fails', async () => {
    mockHttp.get.mockRejectedValueOnce({
      isAxiosError: true,
      message: 'Request failed with status code 503',
      response: {
        status: 503,
        data: {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'quote unavailable',
          },
        },
      },
    });

    const liqo = new Liqo('sk_test_123');
    await expect(liqo.quote({
      amount: 1500,
      fromCurrency: 'NGN',
      toAsset: 'USDC',
    })).rejects.toMatchObject({
      name: 'LiqoApiError',
      message: 'Liqo is temporarily unavailable: quote unavailable',
    });
    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it('pay() wraps checkout.sessions.create()', async () => {
    mockHttp.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          checkoutUrl: 'https://checkout.liqo.dev/pay/cs_123',
          session: publicSession,
        },
      },
    });

    const liqo = new Liqo('sk_test_123');
    const result = await liqo.pay({
      amount: createParams.amount,
      fromCurrency: createParams.fromAsset,
      toAsset: createParams.toAsset,
      toWallet: createParams.recipientWallet,
      payerEmail: createParams.payerEmail,
      targetChain: createParams.targetChain,
      successUrl: createParams.successUrl,
      cancelUrl: createParams.cancelUrl,
    });

    expect(mockHttp.post).toHaveBeenCalledWith(
      '/checkout/sessions',
      expect.objectContaining({
        fromAsset: 'NGN',
        toAsset: 'USDC',
        recipientWallet: validWallet,
        payerEmail: 'buyer@example.com',
      }),
      expect.any(Object)
    );
    expect(result.session.token).toBe(publicSession.token);
  });

  it('retrieves transactions through liqo.transactions.retrieve', async () => {
    mockHttp.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 'tx_123',
          status: 'completed',
          amount: 1500,
          destinationAsset: 'USDC',
          actualOutput: 1490,
          providerRefs: {
            finalSettlement: {
              txHash: 'stellar_hash_1',
            },
          },
        },
      },
    });

    const liqo = new Liqo('sk_test_123');
    const result = await liqo.transactions.retrieve('tx_123');

    expect(mockHttp.get).toHaveBeenCalledWith('/transaction/tx_123', undefined);
    expect(result).toMatchObject({
      transactionId: 'tx_123',
      status: 'completed',
      amount: 1500,
      asset: 'USDC',
      actualOutput: 1490,
      txHash: 'stellar_hash_1',
    });
  });

  it('verifies signed webhook payloads', () => {
    const payload = JSON.stringify({
      event: TransactionWebhookEvent.Completed,
      data: {
        transactionId: 'tx_123',
        status: TransactionStatus.Completed,
        occurredAt: '2099-01-01T00:00:00.000Z',
      },
    } satisfies TransactionWebhookPayload);
    const secret = 'whsec_test_secret';
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signingKey = crypto.createHash('sha256').update(secret).digest('hex');
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const liqo = new Liqo('sk_test_123', { webhookSecret: secret });
    const result = liqo.webhooks.verify({
      payload,
      headers: {
        'X-Liqo-Signature': signature,
        'X-Liqo-Timestamp': timestamp,
      },
    });

    expect(result.valid).toBe(true);
    expect(result.event.event).toBe('transaction.completed');
    expect(result.event.data.transactionId).toBe('tx_123');
    expect(result.event.data.occurredAt).toBe('2099-01-01T00:00:00.000Z');
  });

  it('rejects invalid webhook signatures', () => {
    const liqo = new Liqo('sk_test_123', { webhookSecret: 'whsec_test_secret' });

    expect(() => liqo.webhooks.verify({
      payload: '{"ok":true}',
      headers: {
        'X-Liqo-Signature': 'bad-signature',
        'X-Liqo-Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
    })).toThrow('Invalid webhook signature');
  });

  it('throws for deprecated verifyWebhook(signature, payload)', () => {
    const liqo = new Liqo('sk_test_123', { webhookSecret: 'whsec_test_secret' });

    expect(() => liqo.verifyWebhook('signature', '{}')).toThrow(
      'verifyWebhook(signature, payload) is deprecated'
    );
  });

  it('rejects invalid wallet and targetChain combinations client-side', async () => {
    const liqo = new Liqo('sk_test_123');

    await expect(liqo.pay({
      amount: createParams.amount,
      fromCurrency: createParams.fromAsset,
      toAsset: createParams.toAsset,
      toWallet: validWallet,
      payerEmail: createParams.payerEmail,
      successUrl: createParams.successUrl,
      cancelUrl: createParams.cancelUrl,
      targetChain: 'ethereum',
    })).rejects.toMatchObject({
      message: 'toWallet must be a valid Ethereum wallet for targetChain ethereum',
    });

    expect(mockHttp.post).not.toHaveBeenCalled();
  });

  it('converts backend error envelopes into LiqoApiError', async () => {
    mockHttp.post.mockRejectedValueOnce({
      isAxiosError: true,
      message: 'Request failed with status code 400',
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'recipientWallet is required',
            requestId: 'req_123',
          },
        },
      },
    });

    const liqo = new Liqo('sk_test_123');

    await expect(liqo.checkout.sessions.create(createParams)).rejects.toMatchObject<LiqoApiError>({
      name: 'LiqoApiError',
      message: 'recipientWallet is required',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      requestId: 'req_123',
    });
  });
});
