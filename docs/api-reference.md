# API Reference

## LilySdk

### Constructor
```typescript
new LilySdk(config: LilySdkConfig, httpClient?: HttpClient): LilySdk
```

### Properties
| Property | Type | Description |
|----------|------|-------------|
| `payments` | `PaymentClient` | Payment operations |
| `wallets` | `WalletClient` | Wallet operations |
| `identity` | `IdentityClient` | Identity operations |
| `agents` | `AgentClient` | Agent operations |
| `system` | `SystemClient` | System operations |
| `httpClient` | `HttpClient` | Active HTTP client |
| `version` | `string` | SDK version |

### Static Methods
| Method | Description |
|--------|-------------|
| `LilySdk.create()` | Zero-config factory from env vars |
| `LilySdk.version` | SDK version string |
