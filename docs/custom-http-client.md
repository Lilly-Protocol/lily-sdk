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
  async request<TResponse, TRequest>(req: HttpRequest<TRequest>): Promise<HttpResponse<TResponse>> {
    return { status: 200, headers: new Headers(), data: {} as TResponse };
  }
}

const sdk = new LilySdk({
  baseUrl: 'https://api.lily.io',
  apiKey: 'lk_live_xxx',
}, new MyCustomClient());
```
