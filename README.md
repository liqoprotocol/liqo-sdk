# @liqo/sdk

Official JavaScript/TypeScript SDK for Liqo — liquidity routing infrastructure for Web3 apps.

## Installation

```bash
npm install @liqo/sdk
```

## Quick Start

```typescript
import { LiqoClient } from '@liqo/sdk'

const liqo = new LiqoClient('your_api_key')

const quote = await liqo.getQuote({
  from: 'USDC',
  to: 'XLM',
  amount: 100
})

const result = await liqo.convert({
  from: 'USDC',
  to: 'XLM',
  amount: 100,
  recipient: 'stellar_wallet_address'
})

console.log(result.transactionId)
```

## Methods

| Method | Description |
|---|---|
| `getQuote(params)` | Get a conversion quote |
| `convert(params)` | Convert assets and send to recipient |
| `payout(params)` | Send asset to wallet without conversion |
| `getTransaction(id)` | Check transaction status |

## Documentation

[https://docs.liqo.dev](https://docs.liqo.dev)

## License

MIT
