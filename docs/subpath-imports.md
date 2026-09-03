# Subpath Imports

| Subpath | Description |
|---------|-------------|
| `lily-sdk` | Full SDK (all clients) |
| `lily-sdk/config` | Configuration types and resolver |
| `lily-sdk/errors` | Error classes and type guards |
| `lily-sdk/http` | HTTP transport layer |
| `lily-sdk/models` | Domain models |
| `lily-sdk/types` | Shared type definitions |

## Usage

```typescript
import { LilySdk } from 'lily-sdk';
import { LilyApiError, isLilySdkError } from 'lily-sdk/errors';
import type { LilySdkConfig } from 'lily-sdk/config';
import { createFetchHttpClient } from 'lily-sdk/http';
```

## Tree-Shaking

Each subpath is independently buildable for minimal bundle size.
