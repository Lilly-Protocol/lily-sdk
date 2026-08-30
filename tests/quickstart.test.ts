import { describe, expect, it } from 'vitest';

import { runQuickstart } from '../examples/quickstart-flow';

describe('quickstart example', () => {
  it('runs the health and wallet provisioning flow through the shared stub', async () => {
    const output: unknown[][] = [];

    const result = await runQuickstart((...values) => output.push(values));

    expect(result.healthStatus).toBe('ok');
    expect(result.walletAddress).toBe('GDEMOEXAMPLEADDRESS1234567890');
    expect(output).toEqual([
      ['Service health:', 'ok', '0.1.0'],
      ['Provisioned wallet:', 'wal_demo_123', 'GDEMOEXAMPLEADDRESS1234567890'],
    ]);
  });
});
