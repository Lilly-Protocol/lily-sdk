// __tests__/retry.test.ts
import { LilyApiError } from '../src/errors';
import { LilyClient } from '../src/client';

describe('Retry Logic', () => {
  let client: LilyClient;
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    client = new LilyClient({ apiKey: 'test-key', retryCount: 3 });
    mockFetch = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should throw LilyApiError when retry exhaustion occurs', async () => {
    await expect(client.request('GET', '/test')).rejects.toThrow(LilyApiError);
    expect(mockFetch).toHaveBeenCalledTimes(4); // initial + 3 retries
  });
});