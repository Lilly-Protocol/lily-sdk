commit ee07021ef5d70a0d83a28fa41e0ebaac954d64dc
Author: Zac Lou <97340247+ZacLou@users.noreply.github.com>
Date:   Thu Sep 3 11:35:21 2026 +0800

    docs: rewrite money-and-stellar-assets to match actual MoneyAmount and PaymentClient APIs
    
    - Replace incorrect MoneyAmount = string with the object type from
      src/models/common.ts (assetCode, assetIssuer?, amount).
    - Document quote/execute/get instead of the non-existent create.
    - Remove currency and stellarAsset fields that do not exist in the API.
    - Document memo validation: 28-byte text or 64-char hex hash.
    - Document the two validator paths (canonical vs PaymentClient-route)
      and the leading-zero divergence.
    - Add parity table and end-to-end USDC payment example.
    
    Closes #418

diff --git a/docs/money-and-stellar-assets.md b/docs/money-and-stellar-assets.md
new file mode 100644
index 0000000..8828646
--- /dev/null
+++ b/docs/money-and-stellar-assets.md
@@ -0,0 +1,139 @@
+# MoneyAmount and Stellar Asset Semantics
+
+## MoneyAmount
+
+All monetary values use `MoneyAmount`, an object containing the Stellar asset identifier and the decimal amount string.
+
+```typescript
+// src/models/common.ts
+interface MoneyAmount {
+  assetCode: string;   // 1-12 alphanumeric characters (Stellar asset code)
+  assetIssuer?: string; // optional Stellar issuing account (G… public key)
+  amount: string;      // non-negative decimal string, at most 7 fractional digits
+}
+```
+
+### Validation Rules
+
+The canonical validator lives at `src/validation.ts` (`validateMoneyAmount`).
+
+- `assetCode` must be a 1-12 character alphanumeric string matching `/^[A-Za-z0-9]{1,12}$/`.
+- `amount` must be a non-negative decimal string matching `/^\d+(\.\d+)?$/` with at most 7 fractional digits (the Stellar network precision limit).
+- `assetIssuer` is optional. When provided it must be a non-empty string.
+
+The `PaymentClient`-side validator in `src/validation/payment.ts` additionally rejects leading-zero decimals like `"01.5"` via a stricter pattern `/^(?:0|[1-9]\d*)(?:\.\d{1,7})?$/`. The SDK gateway normalises both forms, so the stricter pattern guards against downstream systems that may not accept leading zeros.
+
+| Input | `src/validation.ts` (canonical) | `PaymentClient` route |
+|---|---|---|
+| `"10.50"` | pass | pass |
+| `"01.5"`  | pass | rejected |
+| `"0.000001"` | pass | pass |
+| `"100"`   | pass | pass |
+| `"1.12345678"` | rejected (>7 digits) | rejected (>7 digits) |
+
+## Stellar Memo
+
+Memo is validated by both `src/validation.ts` (`validateMemo`) and `src/validation/payment.ts` (`validateMemo`). The two implementations agree on the byte-length limit (28 UTF-8 bytes for text memos) but differ on hex-memo recognition:
+
+| Implementation | Hex memo pattern | Text memo limit |
+|---|---|---|
+| `src/validation.ts` | any even-length hex string, max 64 chars | 28 UTF-8 bytes |
+| `src/validation/payment.ts` | exactly 64 hex chars | 28 UTF-8 bytes |
+
+The runtime behaviour is identical for Stellar-compatible memos: a 64-char hex string is treated as a hash memo in both paths, and any non-hex string at most 28 UTF-8 bytes passes.
+
+```typescript
+// Valid memos (both implementations):
+sdk.payments.execute({ /* ... */, memo: 'Invoice #42' })        // text, 11 bytes
+sdk.payments.execute({ /* ... */, memo: '3b9f...' })            // 64-char hex hash
+sdk.payments.execute({ /* ... */, memo: undefined })            // memo is optional
+```
+
+## Payment Client API
+
+The `PaymentClient` exposes three methods. There is **no** `create` method, **no** `currency` field, and **no** `stellarAsset` field in the public API.
+
+```typescript
+// src/clients/payment-client.ts
+class PaymentClient {
+  quote(input: PaymentQuoteRequest): Promise<PaymentQuote>;
+  execute(input: ExecutePaymentRequest): Promise<Payment>;
+  get(paymentId: string): Promise<Payment>;
+}
+```
+
+### Quote
+
+Request a price estimate before submitting a payment.
+
+```typescript
+const quote = await sdk.payments.quote({
+  fromWalletId: 'wallet_abc123',
+  toAddress: 'GDJF2F45C375PS4FVELH5XMA2N7V4G5BKMSPFOYZSQ2QYNYD32DHQGGM',
+  amount: {
+    assetCode: 'USDC',
+    assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
+    amount: '15.50',
+  },
+});
+
+console.log(quote.amount);          // { assetCode: 'USDC', amount: '15.50' }
+console.log(quote.estimatedFee);    // { assetCode: 'XLM', amount: '0.00001' }
+console.log(quote.expiresAt);       // "2026-09-03T03:35:00Z"
+```
+
+### Execute
+
+Submit the on-chain payment. An `idempotencyKey` prevents duplicate submissions.
+
+```typescript
+const payment = await sdk.payments.execute({
+  fromWalletId: 'wallet_abc123',
+  toAddress: 'GDJF2F45C375PS4FVELH5XMA2N7V4G5BKMSPFOYZSQ2QYNYD32DHQGGM',
+  amount: {
+    assetCode: 'USDC',
+    assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
+    amount: '15.50',
+  },
+  memo: 'Invoice #42',
+  idempotencyKey: 'tx_20260903_001',
+});
+
+console.log(payment.status);         // "submitted"
+console.log(payment.transactionHash); // "3b9f..."
+```
+
+### Get
+
+Fetch the current status of a payment by ID.
+
+```typescript
+const payment = await sdk.payments.get('pay_xyz789');
+console.log(payment.status); // "settled"
+```
+
+## Example: End-to-End USDC Payment
+
+```typescript
+const sdk = LilySdk.create({ apiKey: 'lily_sk_...', baseUrl: 'https://api.lily.tech' });
+
+const wallet = await sdk.wallets.get('wallet_abc123');
+console.log(wallet.balances);
+// [{ assetCode: 'USDC', assetIssuer: 'GA5ZSEJ...', amount: '250.00' }]
+
+const quote = await sdk.payments.quote({
+  fromWalletId: wallet.id,
+  toAddress: 'GDJF2F45...',
+  amount: { assetCode: 'USDC', assetIssuer: 'GA5ZSEJ...', amount: '15.50' },
+});
+
+const payment = await sdk.payments.execute({
+  fromWalletId: wallet.id,
+  toAddress: 'GDJF2F45...',
+  amount: quote.amount,
+  memo: '2026-09-03 payout batch #14',
+});
+
+const confirmed = await sdk.payments.get(payment.id);
+// confirmed.status === 'settled'
+```
