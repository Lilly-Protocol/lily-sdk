import { describe, it, expect } from 'vitest';
import { LilySdk } from '../src/sdk';

describe('LilySdk.withConfig', () => {
  it('creates a new instance with overridden baseUrl', () => {
    const original = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'key-1',
    });
    const derived = original.withConfig({ baseUrl: 'https://api.other.com' });

    expect(derived).toBeInstanceOf(LilySdk);
    expect(derived).not.toBe(original);
    // resolveLilySdkConfig normalizes baseUrl to a URL object with trailing slash
    expect(String(derived.config.baseUrl)).toBe('https://api.other.com/');
    expect(derived.config.apiKey).toBe('key-1');
  });

  it('preserves original config when no overrides are provided', () => {
    const original = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'key-1',
    });
    const derived = original.withConfig({});

    expect(String(derived.config.baseUrl)).toBe('https://api.example.com/');
    expect(derived.config.apiKey).toBe('key-1');
  });

  it('overrides credentials independently per tenant', () => {
    const base = new LilySdk({
      baseUrl: 'https://api.example.com',
      apiKey: 'shared-key',
    });
    const tenantA = base.withConfig({ apiKey: 'tenant-a-key' });
    const tenantB = base.withConfig({ apiKey: 'tenant-b-key' });

    expect(tenantA.config.apiKey).toBe('tenant-a-key');
    expect(tenantB.config.apiKey).toBe('tenant-b-key');
    expect(base.config.apiKey).toBe('shared-key');
  });

  it('preserves validateResponses setting across reconfigurations', () => {
    const baseFalse = new LilySdk({
      baseUrl: 'https://api.example.com',
      validateResponses: false,
    });
    const derivedFalse = baseFalse.withConfig({ apiKey: 'new-key' });
    expect(derivedFalse.config.validateResponses).toBe(false);

    const baseTrue = new LilySdk({
      baseUrl: 'https://api.example.com',
      validateResponses: true,
    });
    const derivedTrue = baseTrue.withConfig({ apiKey: 'new-key' });
    expect(derivedTrue.config.validateResponses).toBe(true);
  });

  it('allows overriding validateResponses in withConfig', () => {
    const base = new LilySdk({
      baseUrl: 'https://api.example.com',
      validateResponses: false,
    });
    const derived = base.withConfig({ validateResponses: true });
    expect(derived.config.validateResponses).toBe(true);

    const backToFalse = derived.withConfig({ validateResponses: false });
    expect(backToFalse.config.validateResponses).toBe(false);
  });
});
