import { PayParams, QuoteParams } from '../types';
import { LiqoSdkError } from './request';

function isLikelyStellarWallet(wallet: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(wallet);
}

function isLikelyEthereumWallet(wallet: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(wallet);
}

function isLikelySolanaWallet(wallet: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
}

function validateAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new LiqoSdkError('amount must be greater than 0');
  }
}

function validateAsset(value: string, fieldName: string): void {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw new LiqoSdkError(`${fieldName} is required`);
  }
}

function validateEmail(value: string | undefined, fieldName: string): void {
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new LiqoSdkError(`${fieldName} must be a valid email address`);
  }
}

function validateUrl(value: string | undefined, fieldName: string): void {
  try {
    const url = new URL(value ?? '');
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('invalid protocol');
    }
  } catch {
    throw new LiqoSdkError(`${fieldName} must be a valid URL`);
  }
}

export function validateQuoteParams(params: QuoteParams): void {
  validateAmount(params.amount);
  validateAsset(params.fromCurrency, 'fromCurrency');
  validateAsset(params.toAsset, 'toAsset');
}

export function validatePayParams(params: PayParams): void {
  validateQuoteParams(params);

  if (typeof params.toWallet !== 'string' || params.toWallet.trim().length < 10) {
    throw new LiqoSdkError('toWallet is required');
  }

  const wallet = params.toWallet.trim();
  if (params.targetChain === 'stellar' && !isLikelyStellarWallet(wallet)) {
    throw new LiqoSdkError('toWallet must be a valid Stellar wallet for targetChain stellar');
  }
  if (params.targetChain === 'ethereum' && !isLikelyEthereumWallet(wallet)) {
    throw new LiqoSdkError('toWallet must be a valid Ethereum wallet for targetChain ethereum');
  }
  if (params.targetChain === 'solana' && !isLikelySolanaWallet(wallet)) {
    throw new LiqoSdkError('toWallet must be a valid Solana wallet for targetChain solana');
  }

  const walletLooksValid =
    isLikelyStellarWallet(wallet) ||
    isLikelyEthereumWallet(wallet) ||
    isLikelySolanaWallet(wallet);

  if (!walletLooksValid) {
    throw new LiqoSdkError('toWallet must be a valid Stellar, Ethereum, or Solana wallet');
  }

  validateEmail(params.payerEmail, 'payerEmail');
  validateUrl(params.successUrl, 'successUrl');
  validateUrl(params.cancelUrl, 'cancelUrl');
}
