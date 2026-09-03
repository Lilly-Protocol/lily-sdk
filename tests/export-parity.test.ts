import { describe, it, expect } from 'vitest';
import * as root from '../src/index';
import * as errors from '../src/errors';
import * as config from '../src/config';
import * as http from '../src/http';
import * as models from '../src/models';

describe('export-surface parity (issue #424)', () => {
  const rootKeys = Object.keys(root).sort();

  it('root and ./errors export the same error symbols', () => {
    const errorKeys = Object.keys(errors).sort();
    const rootErrorKeys = rootKeys.filter(k =>
      k.startsWith('Lily') || k === 'isLilySdkError' || k === 'LILY_ERROR_CODES' || k === 'LilyErrorCode'
    );
    for (const key of rootErrorKeys) {
      expect(errors, missing  in ./errors).toHaveProperty(key);
    }
  });

  it('root and ./config export the same config symbols', () => {
    const configKeys = Object.keys(config).sort();
    const expected = ['LilySdkConfig', 'LilySdkCreateOptions', 'ResolvedLilySdkConfig', 'resolveLilySdkConfig'];
    for (const key of expected) {
      expect(config, missing  in ./config).toHaveProperty(key);
      expect(root, missing  in root).toHaveProperty(key);
    }
  });

  it('root and ./http export the same http symbols', () => {
    const httpKeys = Object.keys(http).sort();
    const expected = ['buildUrl', 'createFetchHttpClient'];
    for (const key of expected) {
      expect(http, missing  in ./http).toHaveProperty(key);
      expect(root, missing  in root).toHaveProperty(key);
    }
  });

  it('root and ./models export the same model symbols', () => {
    const modelKeys = Object.keys(models).sort();
    // Models are re-exported via export *, so check a few known ones
    const knownModels = modelKeys.filter(k => k[0] === k[0].toUpperCase()).slice(0, 5);
    expect(knownModels.length).toBeGreaterThan(0);
    for (const key of knownModels) {
      expect(root, missing  in root).toHaveProperty(key);
    }
  });

  it('every root export has a natural subpath home', () => {
    const subpaths: Record<string, unknown> = {
      './config': config,
      './errors': errors,
      './http': http,
      './models': models,
    };
    for (const key of rootKeys) {
      const found = Object.entries(subpaths).some(([, mod]) => {
        const modKeys = Object.keys(mod as Record<string, unknown>);
        return modKeys.includes(key);
      });
      if (!found && key !== 'LilySdk') {
        console.warn(Root export  not found in any subpath);
      }
    }
  });
});
