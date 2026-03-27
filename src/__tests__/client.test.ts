import axios from 'axios';
import { LiqoClient } from '../index';

jest.mock('axios');
const mockedAxios = {
  create: jest.fn().mockReturnValue({
    get: jest.fn(),
    post: jest.fn(),
  }),
};
(axios as jest.Mocked<typeof axios>).create = mockedAxios.create;

describe('LiqoClient', () => {
  let client: LiqoClient;
  let mockHttp: { get: jest.Mock; post: jest.Mock };

  beforeEach(() => {
    client = new LiqoClient('test_api_key', { baseUrl: 'http://localhost:3000' });
    mockHttp = mockedAxios.create.mock.results[0]!.value as { get: jest.Mock; post: jest.Mock };
    jest.clearAllMocks();
  });

  describe('getQuote()', () => {
    it('calls GET /quote with correct params', async () => {
      const mockQuote = {
        from_asset: 'USDC', to_asset: 'XLM', input_amount: 100,
        estimated_output: 1020, routing_path: ['USDC', 'XLM'], fee: 0.35, expires_at: '...',
      };
      mockHttp.get.mockResolvedValueOnce({ data: mockQuote });

      const result = await client.getQuote({ from: 'USDC', to: 'XLM', amount: 100 });
      expect(result.estimated_output).toBe(1020);
      expect(mockHttp.get).toHaveBeenCalledWith('/quote', expect.objectContaining({
        params: { from: 'USDC', to: 'XLM', amount: 100 },
      }));
    });
  });

  describe('convert()', () => {
    it('calls POST /convert and returns transaction', async () => {
      mockHttp.post.mockResolvedValueOnce({
        data: { transactionId: 'tx-123', status: 'processing', estimated_output: 1020, fee: 0.35 },
      });

      const result = await client.convert({
        from: 'USDC', to: 'XLM', amount: 100, recipient: 'GTEST',
      });
      expect(result.transactionId).toBe('tx-123');
      expect(mockHttp.post).toHaveBeenCalledWith('/convert', expect.objectContaining({
        from_asset: 'USDC',
        to_asset: 'XLM',
        amount: 100,
        recipient_wallet: 'GTEST',
      }));
    });
  });

  describe('payout()', () => {
    it('calls POST /payout', async () => {
      mockHttp.post.mockResolvedValueOnce({ data: { transactionId: 'tx-456', status: 'sent' } });
      const result = await client.payout({ asset: 'USDC', amount: 50, recipient: 'GTEST' });
      expect(result.status).toBe('sent');
    });
  });

  describe('getTransaction()', () => {
    it('calls GET /transaction/:id', async () => {
      mockHttp.get.mockResolvedValueOnce({
        data: { id: 'tx-789', status: 'completed', sourceAsset: 'USDC', destinationAsset: 'XLM', amount: 100, estimatedOutput: 1020, fee: 0.35, createdAt: '', updatedAt: '' },
      });
      const tx = await client.getTransaction('tx-789');
      expect(tx.id).toBe('tx-789');
      expect(tx.status).toBe('completed');
    });
  });
});
