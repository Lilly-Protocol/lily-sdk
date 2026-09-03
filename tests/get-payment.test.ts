import { describe, it, expect, vi } from 'vitest';
import { PaymentClient } from '../src/clients/payment-client';

describe('PaymentClient.get (issue #3)', () => {
  it('sends GET /v1/payments/:id', async () => {
    const mockClient = {
      request: vi.fn(async (req: any) => ({
        status: 200,
        headers: new Headers(),
        data: { id: 'pay_123', amount: '10.00', currency: 'USD', status: 'completed' },
      })),
    };
    const client = new PaymentClient(mockClient as any);
    const payment = await client.get('pay_123');
    expect(mockClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/payments/pay_123',
    });
    expect(payment.id).toBe('pay_123');
    expect(payment.amount).toBe('10.00');
  });
});
