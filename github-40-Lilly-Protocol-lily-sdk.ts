// lily-sdk/src/errors/LilyTransportError.ts
export class LilyTransportError extends Error {
  readonly cause?: Error;

  constructor(message: string, options?: { cause?: Error }) {
    super(message);
    this.name = 'LilyTransportError';
    if (options?.cause) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        enumerable: false,
        writable: true,
        configurable: true
      });
    }
    // Ensure proper stack trace capture
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LilyTransportError);
    }
  }
}

// lily-sdk/src/errors/__tests__/LilyTransportError.test.ts
import { LilyTransportError } from '../LilyTransportError';

describe('LilyTransportError', () => {
  it('should propagate cause correctly', () => {
    const originalError = new Error('original error');
    const wrappedError = new LilyTransportError('transport failed', { cause: originalError });
    
    expect(wrappedError.cause).toBe(originalError);
    expect(wrappedError.message).toBe('transport failed');
    expect(wrappedError.name).toBe('LilyTransportError');
  });

  it('should handle missing cause gracefully', () => {
    const error = new LilyTransportError('no cause provided');
    
    expect(error.cause).toBeUndefined();
    expect(error.message).toBe('no cause provided');
  });
});