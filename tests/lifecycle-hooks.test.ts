import { describe, it, expect, vi } from 'vitest';
import {
  type RequestLifecycleHooks,
  composeHooks,
} from '../src/http/lifecycle-hooks';
import type { HttpRequest, HttpResponse } from '../src/http/types';

describe('RequestLifecycleHooks (issue #64)', () => {
  const sampleRequest: HttpRequest = {
    method: 'GET',
    path: '/v1/agents',
  };

  const sampleResponse: HttpResponse = {
    status: 200,
    headers: new Headers(),
    data: { ok: true },
  };

  describe('beforeRequest', () => {
    it('calls beforeRequest hook before the request', async () => {
      const calls: string[] = [];
      const hooks: RequestLifecycleHooks = {
        beforeRequest: () => {
          calls.push('before');
        },
      };
      await hooks.beforeRequest?.(sampleRequest);
      expect(calls).toEqual(['before']);
    });

    it('receives the request object', async () => {
      let received: HttpRequest | undefined;
      const hooks: RequestLifecycleHooks = {
        beforeRequest: (req) => {
          received = req;
        },
      };
      await hooks.beforeRequest?.(sampleRequest);
      expect(received).toBe(sampleRequest);
    });
  });

  describe('afterResponse', () => {
    it('calls afterResponse with request and response', async () => {
      let receivedReq: HttpRequest | undefined;
      let receivedRes: HttpResponse | undefined;
      const hooks: RequestLifecycleHooks = {
        afterResponse: (req, res) => {
          receivedReq = req;
          receivedRes = res;
        },
      };
      await hooks.afterResponse?.(sampleRequest, sampleResponse);
      expect(receivedReq).toBe(sampleRequest);
      expect(receivedRes).toBe(sampleResponse);
    });
  });

  describe('onError', () => {
    it('calls onError with request and error', async () => {
      let receivedReq: HttpRequest | undefined;
      let receivedErr: Error | undefined;
      const testError = new Error('test');
      const hooks: RequestLifecycleHooks = {
        onError: (req, err) => {
          receivedReq = req;
          receivedErr = err;
        },
      };
      await hooks.onError?.(sampleRequest, testError);
      expect(receivedReq).toBe(sampleRequest);
      expect(receivedErr).toBe(testError);
    });
  });

  describe('onRetry', () => {
    it('calls onRetry with attempt and delay', async () => {
      let receivedAttempt: number | undefined;
      let receivedDelay: number | undefined;
      const hooks: RequestLifecycleHooks = {
        onRetry: (_req, attempt, delayMs) => {
          receivedAttempt = attempt;
          receivedDelay = delayMs;
        },
      };
      await hooks.onRetry?.(sampleRequest, 1, 250);
      expect(receivedAttempt).toBe(1);
      expect(receivedDelay).toBe(250);
    });
  });

  describe('composeHooks', () => {
    it('calls all composed beforeRequest hooks in order', async () => {
      const calls: string[] = [];
      const hooks1: RequestLifecycleHooks = {
        beforeRequest: () => calls.push('1'),
      };
      const hooks2: RequestLifecycleHooks = {
        beforeRequest: () => calls.push('2'),
      };
      const composed = composeHooks(hooks1, hooks2);
      await composed.beforeRequest?.(sampleRequest);
      expect(calls).toEqual(['1', '2']);
    });

    it('swallows errors in hooks', async () => {
      const badHooks: RequestLifecycleHooks = {
        beforeRequest: () => {
          throw new Error('boom');
        },
      };
      const goodHooks: RequestLifecycleHooks = {
        beforeRequest: () => {},
      };
      const composed = composeHooks(badHooks, goodHooks);
      await expect(composed.beforeRequest?.(sampleRequest)).resolves.toBeUndefined();
    });

    it('calls all composed afterResponse hooks', async () => {
      const calls: string[] = [];
      const composed = composeHooks(
        { afterResponse: () => calls.push('a') },
        { afterResponse: () => calls.push('b') },
      );
      await composed.afterResponse?.(sampleRequest, sampleResponse);
      expect(calls).toEqual(['a', 'b']);
    });

    it('calls all composed onError hooks', async () => {
      const calls: string[] = [];
      const composed = composeHooks(
        { onError: () => calls.push('e1') },
        { onError: () => calls.push('e2') },
      );
      await composed.onError?.(sampleRequest, new Error('test'));
      expect(calls).toEqual(['e1', 'e2']);
    });

    it('handles empty hook sets gracefully', async () => {
      const composed = composeHooks();
      await expect(composed.beforeRequest?.(sampleRequest)).resolves.toBeUndefined();
    });
  });
});
