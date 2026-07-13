import { getTransaction as getTransactionMethod } from './methods/getTransaction';
import { createCheckoutSession, retrieveCheckoutSession } from './methods/checkout';
import { pay as payMethod } from './methods/pay';
import { quote as quoteMethod } from './methods/quote';
import {
  LiqoErrorEvent,
  LiqoEventName,
  LiqoOptions,
  LiqoRequestEvent,
  LiqoResponseEvent,
  PayParams,
  PayResponse,
  QuoteParams,
  QuoteResponse,
  RequestOptions,
  TransactionResponse,
  CheckoutSessionCreateParams,
  CheckoutSessionCreateResponse,
  WebhookVerifyParams,
  VerifiedWebhookEvent,
  VerifiedLiqoWebhookEvent,
} from './types';
import { createRequester, LiqoSdkError, Requester } from './utils/request';
import { isTerminalStatus } from './utils/normalize';
import { verifyWebhookPayload } from './utils/webhook';

export interface LiqoClientLike {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  readonly environment: 'sandbox' | 'production';
  readonly debug: boolean;
  readonly baseUrl: string;
  readonly checkoutBaseUrl: string;
  logDebug(label: string, payload: unknown): void;
}

export class Liqo implements LiqoClientLike {
  private readonly requester: Requester;
  private readonly webhookSecret?: string;
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;
  private readonly pollingDefaults: { intervalMs: number; timeoutMs: number };
  private readonly listeners: {
    request: Set<(event: LiqoRequestEvent) => void>;
    response: Set<(event: LiqoResponseEvent) => void>;
    error: Set<(event: LiqoErrorEvent) => void>;
  };
  readonly environment: 'sandbox' | 'production';
  readonly debug: boolean;
  readonly baseUrl: string;
  readonly checkoutBaseUrl: string;
  readonly checkout: {
    sessions: {
      create(params: CheckoutSessionCreateParams): Promise<CheckoutSessionCreateResponse>;
      retrieve(token: string): Promise<CheckoutSessionCreateResponse['session']>;
    };
  };
  readonly transactions: {
    retrieve(transactionId: string): Promise<TransactionResponse>;
  };
  readonly webhooks: {
    verify(params: WebhookVerifyParams): VerifiedLiqoWebhookEvent;
  };

  constructor(apiKey: string, options: LiqoOptions = {}) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new LiqoSdkError('An API key is required to initialize Liqo');
    }

    this.environment = options.environment ?? 'sandbox';
    this.debug = options.debug ?? false;
    this.webhookSecret = options.webhookSecret;
    this.timeoutMs = options.timeoutMs ?? options.timeout ?? 15_000;
    this.retryAttempts = options.retryAttempts ?? 3;
    this.pollingDefaults = {
      intervalMs: options.polling?.intervalMs ?? 2_000,
      timeoutMs: options.polling?.timeoutMs ?? 60_000,
    };
    this.listeners = {
      request: new Set(),
      response: new Set(),
      error: new Set(),
    };
    this.baseUrl = options.baseUrl ?? (this.environment === 'production' ? 'https://api.liqo.dev' : 'http://localhost:3000');
    this.checkoutBaseUrl = options.checkoutBaseUrl ?? 'https://checkout.liqo.dev';

    this.requester = createRequester({
      apiKey,
      baseUrl: this.baseUrl,
      timeout: this.timeoutMs,
      debug: this.debug,
      retryAttempts: this.retryAttempts,
      emit: {
        request: event => this.emit('request', event),
        response: event => this.emit('response', event),
        error: event => this.emit('error', event),
      },
    });

    this.checkout = {
      sessions: {
        create: params => createCheckoutSession(this, params),
        retrieve: token => retrieveCheckoutSession(this, token),
      },
    };
    this.transactions = {
      retrieve: transactionId => this.getTransaction(transactionId),
    };
    this.webhooks = {
      verify: params => verifyWebhookPayload(this.webhookSecret, params),
    };
  }

  logDebug(label: string, payload: unknown): void {
    if (!this.debug) return;
    console.log(`[LIQO SDK] ${label}`, payload);
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.requester.get<T>(path, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.requester.post<T>(path, body, options);
  }

  on(eventName: 'request', handler: (event: LiqoRequestEvent) => void): () => void;
  on(eventName: 'response', handler: (event: LiqoResponseEvent) => void): () => void;
  on(eventName: 'error', handler: (event: LiqoErrorEvent) => void): () => void;
  on(
    eventName: LiqoEventName,
    handler: ((event: LiqoRequestEvent) => void) | ((event: LiqoResponseEvent) => void) | ((event: LiqoErrorEvent) => void)
  ): () => void {
    const listeners = this.listeners[eventName] as Set<(event: unknown) => void>;
    listeners.add(handler as (event: unknown) => void);
    return () => {
      listeners.delete(handler as (event: unknown) => void);
    };
  }

  pay(params: PayParams): Promise<PayResponse> {
    return payMethod(this, params);
  }

  quote(params: QuoteParams): Promise<QuoteResponse> {
    return quoteMethod(this, params);
  }

  getTransaction(transactionId: string): Promise<TransactionResponse> {
    return getTransactionMethod(this, transactionId);
  }

  async payAndWait(
    params: PayParams,
    options: { intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<TransactionResponse> {
    void params;
    void options;
    throw new LiqoSdkError('payAndWait is not supported for checkout sessions; use checkout.sessions.retrieve(token) to poll checkout status');
  }

  async payAndConfirm(
    params: PayParams,
    options: { intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<TransactionResponse> {
    return this.payAndWait(params, options);
  }

  async waitForCompletion(
    transactionId: string,
    options: { intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<TransactionResponse> {
    const intervalMs = options.intervalMs ?? this.pollingDefaults.intervalMs;
    const timeoutMs = options.timeoutMs ?? this.pollingDefaults.timeoutMs;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const transaction = await this.getTransaction(transactionId);
      if (isTerminalStatus(transaction.status)) {
        return transaction;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new LiqoSdkError(`Timed out waiting for transaction ${transactionId} to complete`);
  }

  /**
   * @deprecated Use liqo.webhooks.verify({ payload, headers }) so X-Liqo-Timestamp
   * can be validated and replay protection remains enabled.
   */
  verifyWebhook<T = Record<string, unknown>>(_signature: string, _payload: string): VerifiedWebhookEvent<T> {
    throw new LiqoSdkError('verifyWebhook(signature, payload) is deprecated; use liqo.webhooks.verify({ payload, headers })');
  }

  private emit(eventName: 'request', payload: LiqoRequestEvent): void;
  private emit(eventName: 'response', payload: LiqoResponseEvent): void;
  private emit(eventName: 'error', payload: LiqoErrorEvent): void;
  private emit(eventName: LiqoEventName, payload: LiqoRequestEvent | LiqoResponseEvent | LiqoErrorEvent): void {
    const listeners = this.listeners[eventName];
    if (listeners.size === 0) return;

    for (const listener of listeners) {
      listener(payload as never);
    }
  }
}
