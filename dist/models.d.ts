interface AuditMetadata {
    createdAt: string;
    updatedAt: string;
}
interface PaginationQuery {
    limit?: number;
    cursor?: string;
}
/**
 * Represents a monetary amount and currency/asset identifier within Lily Protocol
 * and the underlying Stellar network.
 *
 * All amounts must be formatted as base-10 decimal strings (e.g. `'10.50'`) rather than
 * JavaScript numbers to prevent floating-point precision loss and truncation errors.
 *
 * ### Stellar Asset Semantics:
 * - **Native Asset (`XLM`):** Omit `assetIssuer` (or set to `undefined`). Native Stellar Lumens
 *   have no issuing account.
 * - **Issued Assets (e.g. `USDC`, `EURC`):** Specify `assetCode` (1-12 alphanumeric chars) and
 *   `assetIssuer` (56-character Stellar public key / G-address).
 * - **Precision:** Stellar supports up to 7 decimal places (1 stroop = `0.0000001`).
 *
 * @example
 * ```ts
 * // Native Stellar Lumens
 * const nativeAmount: MoneyAmount = {
 *   assetCode: 'XLM',
 *   amount: '25.5000000',
 * };
 *
 * // Issued asset with issuer public key
 * const usdcAmount: MoneyAmount = {
 *   assetCode: 'USDC',
 *   assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
 *   amount: '100.00',
 * };
 * ```
 */
interface MoneyAmount {
    /**
     * The asset code representing the currency or token.
     *
     * For the native network asset, use `'XLM'`. For credit/issued assets, use a 1-to-12 character
     * alphanumeric code (Alpha4: 1-4 chars like `'USDC'`; Alpha12: 5-12 chars).
     */
    assetCode: string;
    /**
     * The 56-character Stellar public key (G-address) of the issuing account.
     *
     * - **Native asset (`XLM`):** Must be omitted or `undefined`.
     * - **Issued assets:** Required to uniquely identify the asset on Stellar (alongside `assetCode`),
     *   linking to the issuer's account and home domain SEP-1 metadata.
     */
    assetIssuer?: string;
    /**
     * The monetary quantity formatted strictly as a base-10 decimal string (e.g., `'10.50'`, `'0.0000001'`).
     *
     * Floating-point numbers (`number`) and exponential notation (e.g., `'1e-5'`) are prohibited
     * to avoid floating-point rounding/truncation bugs. Precision should match the asset's scale,
     * up to Stellar's maximum 7 decimal places (1 stroop = 0.0000001).
     */
    amount: string;
}
type ResourceStatus = 'pending' | 'active' | 'inactive' | 'failed' | 'paused';
/**
 * Normalizes a decimal string amount to exactly two decimal places.
 *
 * Leading zeros are stripped and the fractional part is truncated (not
 * rounded) to two digits and padded with trailing zeros, e.g.
 * `'0075.5'` becomes `'75.50'`. The input object is not mutated.
 *
 * Throws a `RangeError` when the amount is not a base-10 decimal string
 * (e.g. exponential notation like `'1e-5'` or a JavaScript number).
 */
declare function normalizeMoneyAmount(input: MoneyAmount): MoneyAmount;

interface Agent extends AuditMetadata {
    id: string;
    name: string;
    description?: string;
    status: ResourceStatus;
    network: 'stellar-testnet' | 'stellar-mainnet';
    identityId?: string;
    walletId?: string;
    capabilities: readonly string[];
}
interface ListAgentsQuery extends PaginationQuery {
    status?: ResourceStatus;
}
interface CreateAgentRequest {
    name: string;
    description?: string;
    network: Agent['network'];
    capabilities?: string[];
    metadata?: Record<string, string>;
}
interface UpdateAgentRequest {
    name?: string;
    description?: string;
    capabilities?: string[];
    status?: ResourceStatus;
}

interface IdentityProfile extends AuditMetadata {
    id: string;
    agentId: string;
    displayName: string;
    stellarAddress?: string;
    domain?: string;
    status: ResourceStatus;
    verificationLevel: 'none' | 'basic' | 'enhanced';
}
interface ResolveIdentityRequest {
    agentId?: string;
    stellarAddress?: string;
    domain?: string;
}
interface VerifyIdentityRequest {
    identityId: string;
    challenge: string;
    signature: string;
}
interface VerificationResult {
    identityId: string;
    verified: boolean;
    verifiedAt?: string;
}

type PaymentStatus = 'queued' | 'processing' | 'submitted' | 'settled' | 'failed';
interface Payment extends AuditMetadata {
    id: string;
    fromWalletId: string;
    toAddress: string;
    amount: MoneyAmount;
    memo?: string;
    status: PaymentStatus;
    transactionHash?: string;
}
interface PaymentQuoteRequest {
    fromWalletId: string;
    toAddress: string;
    amount: MoneyAmount;
}
interface PaymentQuote {
    amount: MoneyAmount;
    estimatedFee: MoneyAmount;
    expiresAt: string;
}
interface ExecutePaymentRequest {
    fromWalletId: string;
    toAddress: string;
    amount: MoneyAmount;
    memo?: string;
    /** Sent as the `Idempotency-Key` header when the payment is executed. */
    idempotencyKey?: string;
}

interface HealthStatus {
    status: 'ok' | 'degraded' | 'down';
    version: string;
    timestamp: string;
    checks: Record<string, 'ok' | 'degraded' | 'down'>;
}
interface ServiceInfo {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    docsUrl?: string;
}

interface Wallet extends AuditMetadata {
    id: string;
    agentId: string;
    address: string;
    network: 'stellar-testnet' | 'stellar-mainnet';
    status: ResourceStatus;
    balances: readonly MoneyAmount[];
}
interface ProvisionWalletRequest {
    agentId: string;
    network: Wallet['network'];
    fundingAsset?: {
        assetCode: string;
        amount: string;
    };
}
interface WalletProvisioningResult {
    wallet: Wallet;
    recoveryHint?: string;
}

export { type Agent, type AuditMetadata, type CreateAgentRequest, type ExecutePaymentRequest, type HealthStatus, type IdentityProfile, type ListAgentsQuery, type MoneyAmount, type PaginationQuery, type Payment, type PaymentQuote, type PaymentQuoteRequest, type PaymentStatus, type ProvisionWalletRequest, type ResolveIdentityRequest, type ResourceStatus, type ServiceInfo, type UpdateAgentRequest, type VerificationResult, type VerifyIdentityRequest, type Wallet, type WalletProvisioningResult, normalizeMoneyAmount };
