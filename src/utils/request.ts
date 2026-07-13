import axios, { AxiosError, AxiosInstance } from 'axios';
import crypto from 'crypto';
import {
  BackendErrorShape,
  ErrorEnvelope,
  LiqoErrorEvent,
  LiqoRequestEvent,
  LiqoResponseEvent,
  RequestOptions,
  SuccessEnvelope,
} from '../types';

export class LiqoApiError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly raw?: unknown;

  constructor(message: string, options: { statusCode?: number; code?: string; requestId?: string; raw?: unknown } = {}) {
    super(message);
    this.name = 'LiqoApiError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.requestId = options.requestId;
    this.raw = options.raw;
  }
}

export class LiqoSdkError extends LiqoApiError {
  constructor(message: string, options: { statusCode?: number; code?: string; requestId?: string; raw?: unknown } = {}) {
    super(message, options);
    this.name = 'LiqoSdkError';
  }
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (value as { success?: unknown }).success === false &&
    (value as { error?: unknown }).error
  );
}

function isSuccessEnvelope<T>(value: unknown): value is SuccessEnvelope<T> {
  return Boolean(
    value &&
    typeof value === 'object' &&
    (value as { success?: unknown }).success === true &&
    'data' in (value as Record<string, unknown>)
  );
}

function unwrapResponse<T>(value: unknown): T {
  return isSuccessEnvelope<T>(value) ? value.data : value as T;
}

function buildMessage(error: AxiosError<BackendErrorShape | ErrorEnvelope>): string {
  const responseBody = error.response?.data;
  const message = isErrorEnvelope(responseBody)
    ? responseBody.error.message
    : responseBody?.message ?? error.message ?? 'Request failed';
  return typeof message === 'string' && message.length > 0 ? message : 'Request failed';
}

function readErrorCode(error: AxiosError<BackendErrorShape | ErrorEnvelope>): string | undefined {
  const responseBody = error.response?.data;
  return isErrorEnvelope(responseBody) ? responseBody.error.code : responseBody?.error;
}

function readRequestId(error: AxiosError<BackendErrorShape | ErrorEnvelope>): string | undefined {
  const responseBody = error.response?.data;
  return isErrorEnvelope(responseBody) ? responseBody.error.requestId : undefined;
}

function formatErrorMessage(error: AxiosError<BackendErrorShape | ErrorEnvelope>): string {
  const message = buildMessage(error);
  if (error.response?.status && error.response.status >= 500) {
    return `Liqo is temporarily unavailable: ${message}`;
  }
  return message;
}

function buildUrl(path: string, options?: RequestOptions): string {
  if (!options?.query) return path;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const queryString = search.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export interface Requester {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
}

function sleep(delayMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

function shouldRetry(error: AxiosError<BackendErrorShape | ErrorEnvelope>): boolean {
  if (error.response) {
    return error.response.status === 429;
  }

  return true;
}

export function createRequester(config: {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  debug: boolean;
  retryAttempts: number;
  emit: {
    request: (event: LiqoRequestEvent) => void;
    response: (event: LiqoResponseEvent) => void;
    error: (event: LiqoErrorEvent) => void;
  };
}): Requester {
  const http: AxiosInstance = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'X-Liqo-Version': '2',
      'X-Liqo-SDK': 'js/2.x',
      'User-Agent': '@liqo/sdk/2.0.0',
    },
  });

  function debugLog(label: string, payload: unknown): void {
    if (!config.debug) return;
    console.log(`[LIQO SDK] ${label}`, payload);
  }

  async function request<T>(method: 'get' | 'post', path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = buildUrl(path, options);
    const requestHeaders: Record<string, string> = { ...(options?.headers ?? {}) };
    if (method === 'post') {
      requestHeaders['Idempotency-Key'] = options?.idempotencyKey ?? crypto.randomUUID();
    }
    const requestConfig = Object.keys(requestHeaders).length > 0 ? { headers: requestHeaders } : undefined;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt += 1) {
      try {
        debugLog(`Request ${method.toUpperCase()} ${url}`, body ?? null);
        config.emit.request({
          method: method.toUpperCase() as 'GET' | 'POST',
          path: url,
          body,
          headers: requestHeaders,
          attempt,
        });
        const response =
          method === 'get'
            ? await http.get<T>(url, requestConfig)
            : await http.post<T>(url, body, requestConfig);
        debugLog(`Response ${method.toUpperCase()} ${url}`, response.data);
        config.emit.response({
          method: method.toUpperCase() as 'GET' | 'POST',
          path: url,
          data: response.data,
          attempt,
        });
        return unwrapResponse<T>(response.data);
      } catch (error) {
        if (axios.isAxiosError<BackendErrorShape | ErrorEnvelope>(error)) {
          debugLog(`Error ${method.toUpperCase()} ${url}`, {
            attempt,
            status: error.response?.status,
            message: buildMessage(error),
          });

          config.emit.error({
            method: method.toUpperCase() as 'GET' | 'POST',
            path: url,
            error,
            attempt,
          });

          if (shouldRetry(error) && attempt < config.retryAttempts) {
            await sleep(300 * 2 ** (attempt - 1));
            continue;
          }

          throw new LiqoApiError(formatErrorMessage(error), {
            statusCode: error.response?.status,
            code: readErrorCode(error),
            requestId: readRequestId(error),
            raw: config.debug ? error.response?.data ?? error : undefined,
          });
        }

        debugLog(`Error ${method.toUpperCase()} ${url}`, {
          attempt,
          message: error instanceof Error ? error.message : 'Request failed',
        });
        config.emit.error({
          method: method.toUpperCase() as 'GET' | 'POST',
          path: url,
          error,
          attempt,
        });

        throw new LiqoApiError(error instanceof Error ? error.message : 'Request failed', {
          raw: config.debug ? error : undefined,
        });
      }
    }

    throw new LiqoApiError('Request failed after retries');
  }

  return {
    get<T>(path: string, options?: RequestOptions): Promise<T> {
      return request<T>('get', path, undefined, options);
    },
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
      return request<T>('post', path, body, options);
    },
  };
}
