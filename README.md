# @liqo/sdk

Official JavaScript/TypeScript SDK for [Liqo](https://liqo.dev) — liquidity routing infrastructure for Web3 apps.

Stop managing token reserves. Make one API call; Liqo routes the conversion through external liquidity providers automatically.

## Installation

```bash
npm install @liqo/sdk
```

## Quick Start

Get your API key from the [Liqo Developer Dashboard](https://liqo-dashboard.vercel.app).

```typescript
import { LiqoClient } from '@liqo/sdk';

const liqo = new LiqoClient('liqo_test_your_api_key_here');

// Get a quote
const quote = await liqo.getQuote({
  from: 'USDC',
  to: 'XLM',
  amount: 100,
});
console.log(`You'll receive ~${quote.estimated_output} XLM (fee: ${quote.fee} USDC)`);

// Execute the conversion
const result = await liqo.convert({
  from: 'USDC',
  to: 'XLM',
  amount: 100,
  recipient: 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
});
console.log(`Transaction ${result.transactionId} is ${result.status}`);
```

## Supported Pairs

| From | To | Provider |
|---|---|---|
| USDC | XLM | Stellar DEX |
| XLM | USDC | Stellar DEX |
| USDC | ETH | Stellar DEX |
| ETH | USDC | Stellar DEX |
| NGN | USDC | Transak |
| GHS | USDC | Transak |
| ZAR | USDC | Transak |
| USD | USDC | Transak |
| EUR | USDC | Transak |
| NGN / GHS / ZAR / USD / EUR | XLM | Transak + Stellar DEX |

## API Reference

### `new LiqoClient(apiKey, options?)`

```typescript
const liqo = new LiqoClient('liqo_test_...', {
  baseUrl: 'https://liqo-platform-production.up.railway.app', // optional override
  timeout: 30000, // ms, default 30s
});
```

### `liqo.getQuote({ from, to, amount })`

Returns a price quote valid for 60 seconds.

```typescript
const quote = await liqo.getQuote({ from: 'NGN', to: 'USDC', amount: 10000 });
// {
//   from_asset: 'NGN',
//   to_asset: 'USDC',
//   input_amount: 10000,
//   estimated_output: 6.3,
//   routing_path: ['NGN', 'Transak', 'USDC'],
//   fee: 0.15,
//   expires_at: '2024-01-01T00:01:00Z'
// }
```

### `liqo.convert({ from, to, amount, recipient })`

Converts an asset and sends it to a recipient wallet.

```typescript
const result = await liqo.convert({
  from: 'NGN',
  to: 'USDC',
  amount: 10000,
  recipient: '0xWalletAddress...',
});
// {
//   transactionId: 'uuid',
//   status: 'processing',
//   estimated_output: 6.3,
//   fee: 0.15
// }
```

### `liqo.payout({ asset, amount, recipient })`

Sends an asset to a wallet without conversion.

```typescript
const result = await liqo.payout({
  asset: 'USDC',
  amount: 50,
  recipient: '0xWalletAddress...',
});
```

### `liqo.getTransaction(id)`

Polls the status of a transaction.

```typescript
const tx = await liqo.getTransaction('transaction-uuid');
// {
//   id: 'uuid',
//   status: 'completed', // pending | processing | completed | failed
//   sourceAsset: 'USDC',
//   destinationAsset: 'XLM',
//   amount: 100,
//   estimatedOutput: 1020,
//   actualOutput: 1019.8,
//   fee: 0.35,
//   createdAt: '...',
//   updatedAt: '...'
// }
```

## API Base URL

```
https://liqo-platform-production.up.railway.app
```

All endpoints require `Authorization: Bearer <API_KEY>`.

## Links

- Dashboard: [https://liqo-dashboard.vercel.app](https://liqo-dashboard.vercel.app)
- Docs: [https://docs.liqo.dev](https://docs.liqo.dev)
- GitHub: [github.com/liqoprotocol/liqo-sdk](https://github.com/liqoprotocol/liqo-sdk)

## License

MIT
