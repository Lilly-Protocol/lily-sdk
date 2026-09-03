import { jest } from '@jest/globals';
import * as quickstart from './quickstart.js';

describe('quickstart.ts', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should execute successfully with stubbed fetch', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ data: 'stubbed response' }),
    };

    jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

    await expect(quickstart.main()).resolves.not.toThrow();
  });
});