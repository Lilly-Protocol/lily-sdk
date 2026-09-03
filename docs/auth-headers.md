# Authentication Headers

## API Key

When `apiKey` is set, the SDK adds it to every request as:

```
x-api-key: <your-api-key>
```

## Auth Token

When `authToken` is set, the SDK adds a Bearer token:

```
Authorization: Bearer <your-auth-token>
```

## Both

When both are set, both headers are sent on every request.

## Example

```typescript
const sdk = new LilySdk({
  baseUrl: 'https://api.lily.io',
  apiKey: 'lk_live_xxx',        // → x-api-key: lk_live_xxx
  authToken: 'eyJhbGciOi...',   // → Authorization: Bearer eyJhbGciOi...
});
```

## Custom Headers

You can also add custom default headers:

```typescript
const sdk = new LilySdk({
  baseUrl: 'https://api.lily.io',
  apiKey: 'lk_live_xxx',
  defaultHeaders: {
    'X-Request-Source': 'mobile-app',
  },
});
```
