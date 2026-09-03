import { jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// Mock fetch globally before importing quickstart
const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: 'stubbed response' }),
    } as Response)
  ) as jest.Mock;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('quickstart.ts flow', () => {
  it('executes without error and uses fetch', async () => {
    const quickstartPath = path.join(__dirname, '..', 'examples', 'quickstart.ts');
    const quickstartCode = fs.readFileSync(quickstartPath, 'utf8');

    // Evaluate the quickstart code in a context with required globals
    const vm = await import('vm');
    const sandbox = {
      fetch: global.fetch,
      console,
      process: { env: {} },
      Buffer,
      setImmediate,
      clearImmediate,
      require: (mod: string) => {
        if (mod === 'node-fetch') return global.fetch;
        throw new Error(`Mocked require for ${mod} not implemented`);
      },
    };
    vm.createContext(sandbox);
    vm.runInContext(quickstartCode, sandbox);

    // Assert fetch was called at least once
    expect(global.fetch).toHaveBeenCalled();
  });
});