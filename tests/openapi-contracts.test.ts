import { describe, it, expect } from 'vitest';
import { generateContracts, type OpenApiSpec } from '../src/contracts/openapi-generator';

describe('OpenAPI client contracts (issue #97)', () => {
  const spec: OpenApiSpec = {
    openapi: '3.0.0',
    info: { title: 'Lily API', version: '1.0.0' },
    paths: {
      '/v1/payments': {
        get: {
          operationId: 'listPayments',
          parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }],
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentList' } } } } },
        },
        post: {
          operationId: 'createPayment',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePaymentRequest' } } } },
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Payment' } } } } },
        },
      },
      '/v1/payments/{id}': {
        get: {
          operationId: 'getPayment',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { content: { 'application/json': { schema: { $ref: '#/components/schemas/Payment' } } } } },
        },
        delete: {
          operationId: 'deletePayment',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Deleted' } },
        },
      },
    },
  };

  it('generates contracts for all operations', () => {
    const contracts = generateContracts(spec);
    expect(contracts).toHaveLength(4);
  });

  it('extracts operation IDs', () => {
    const contracts = generateContracts(spec);
    const ops = contracts.map(c => c.operationId);
    expect(ops).toContain('listPayments');
    expect(ops).toContain('createPayment');
    expect(ops).toContain('getPayment');
    expect(ops).toContain('deletePayment');
  });

  it('extracts response types from $ref', () => {
    const contracts = generateContracts(spec);
    const getPayment = contracts.find(c => c.operationId === 'getPayment');
    expect(getPayment?.responseType).toBe('Payment');
  });

  it('extracts request types from $ref', () => {
    const contracts = generateContracts(spec);
    const createPayment = contracts.find(c => c.operationId === 'createPayment');
    expect(createPayment?.requestType).toBe('CreatePaymentRequest');
  });

  it('maps parameters with required flag', () => {
    const contracts = generateContracts(spec);
    const getPayment = contracts.find(c => c.operationId === 'getPayment');
    expect(getPayment?.parameters).toHaveLength(1);
    expect(getPayment?.parameters[0]).toEqual({ name: 'id', in: 'path', required: true, type: 'string' });
  });

  it('handles empty spec gracefully', () => {
    const contracts = generateContracts({ openapi: '3.0.0', info: { title: 'Empty', version: '0' }, paths: {} });
    expect(contracts).toEqual([]);
  });
});
