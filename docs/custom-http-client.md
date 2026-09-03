# Custom fetch and HttpClient Injection

## Custom fetch

```typescript
const sdk = new LilySdk({
  baseUrl: 'https://api.lily.io',
  apiKey: 'lk_live_xxx',
  fetch: customFetchImplementation,
});
```

## Custom HttpClient

```typescript
import type { HttpClient } from 'lily-sdk/http';

class MyCustomClient implements HttpClient {
  async request<TResponse, TRequest>(
    req: HttpRequest<TRequest>,
  ): Promise<HttpResponse<TResponse>> {
    return { status: 200, headers: new Headers(), data: {} as TResponse };
  }
}

const sdk = new LilySdk(
  {
    baseUrl: 'https://api.lily.io',
    apiKey: 'lk_live_xxx',
  },
  new MyCustomClient(),
);
```

## In-Memory HttpClient for Unit Tests

The SDK provides a lightweight, dependency-free `MockHttpClient` and `createMockHttpClient` helper exported from `@lily-protocol/sdk/testing` (and root `@lily-protocol/sdk`). It lets consumers unit-test integrations without a network, with retries and timeouts bypassed.

```typescript
import { LilySdk } from '@lily-protocol/sdk';
import { createMockHttpClient } from '@lily-protocol/sdk/testing';

// 1. Create a mock HTTP client
const mockHttp = createMockHttpClient();

// 2. Define per-request response stubs
mockHttp
  .onGet('/v1/system/health', {
    status: 'healthy',
    version: '1.0.0',
    network: 'testnet',
  })
  .onGet('/v1/agents', [
    { id: 'agent_1', name: 'Trading Agent', status: 'active' },
  ])
  .onPost('/v1/wallets', {
    status: 201,
    data: { wallet: { address: 'GABC...' } },
  });

// 3. Inject the mock client into LilySdk
const sdk = new LilySdk({ baseUrl: 'https://api.lily.test' }, mockHttp);

// 4. Exercise SDK methods
const health = await sdk.system.health();
const agents = await sdk.agents.list();

// 5. Assert recorded requests (method, path, headers, query, body)
mockHttp.assertCalled(2);
mockHttp.assertLastRequest({
  method: 'GET',
  path: '/v1/agents',
});
```

### Request Recording & Assertion Hooks

`MockHttpClient` automatically records every request and supports an assertion hook for spies or inline validation:

```typescript
import { MockHttpClient } from '@lily-protocol/sdk/testing';

const mock = new MockHttpClient({
  onRequest: (req) => {
    // Assertion hook invoked on every request
    console.log(`Intercepted ${req.method} ${req.path}`);
  },
});

// Access recorded requests
const calls = mock.requests; // or mock.calls
const last = mock.lastRequest;

// Built-in assertions
mock.assertCalled(1);
mock.assertRequest({
  method: 'POST',
  path: '/v1/payments',
  headers: { 'Content-Type': 'application/json' },
  body: { amount: '100', assetCode: 'XLM' },
});
```
