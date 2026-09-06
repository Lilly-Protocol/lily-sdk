# Environment Variables

| Variable        | Description                     | Default  |
| --------------- | ------------------------------- | -------- |
| LILY_BASE_URL   | API base URL                    | Required |
| LILY_API_KEY    | API key for authentication      | —        |
| LILY_AUTH_TOKEN | Bearer token for authentication | —        |
| LILY_TIMEOUT_MS | Request timeout in milliseconds | 10000    |

## Usage

`ash
export LILY_BASE_URL=https://api.lily.io
export LILY_API_KEY=lk_live_xxx
`

` ypescript
import { LilySdk } from '@lily-protocol/sdk';

const sdk = LilySdk.create();
