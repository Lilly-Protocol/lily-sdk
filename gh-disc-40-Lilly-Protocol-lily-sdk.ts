// lily-transport-error.ts
export class LilyTransportError extends Error {
  constructor(
    message: string,
    options?: { cause?: unknown; code?: string }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'LilyTransportError';
    
    // For Node.js <18.0.0 or older environments without native cause support
    if (options?.cause && !(this as any).cause) {
      (this as any).cause = options.cause;
    }
    
    if (options?.code) {
      this.code = options.code;
    }
    
    // Maintain proper prototype chain
    Object.setPrototypeOf(this, LilyTransportError.prototype);
  }

  code?: string;
}

// lily-transport-error.test.ts
import { LilyTransportError } from './lily-transport-error';

describe('LilyTransportError', () => {
  test('should propagate cause correctly', () => {
    const originalError = new Error('Original error');
    const transportError = new LilyTransportError('Transport failed', {
      cause: originalError,
      code: 'NETWORK_ERROR'
    });

    expect(transportError.message).toBe('Transport failed');
    expect(transportError.cause).toBe(originalError);
    expect(transportError.code).toBe('NETWORK_ERROR');
  });

  test('should handle cause as non-Error object', () => {
    const cause = { message: 'Custom cause', code: 500 };
    const transportError = new LilyTransportError('Transport failed', {
      cause
    });

    expect(transportError.cause).toBe(cause);
  });

  test('should work without cause', () => {
    const transportError = new LilyTransportError('Transport failed');

    expect(transportError.message).toBe('Transport failed');
    expect(transportError.cause).toBeUndefined();
  });

  test('should maintain prototype chain', () => {
    const transportError = new LilyTransportError('Test error');
    expect(transportError).toBeInstanceOf(LilyTransportError);
  });
});