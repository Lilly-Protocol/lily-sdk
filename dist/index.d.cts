import { ListAgentsQuery, Agent, CreateAgentRequest, UpdateAgentRequest, ResolveIdentityRequest, IdentityProfile, VerifyIdentityRequest, VerificationResult, PaymentQuoteRequest, PaymentQuote, ExecutePaymentRequest, Payment, HealthStatus, ServiceInfo, ProvisionWalletRequest, WalletProvisioningResult, Wallet, PaginationQuery } from './models.cjs';
export { AuditMetadata, MoneyAmount, PaymentStatus, ResourceStatus, normalizeMoneyAmount } from './models.cjs';
import { AgentClientContract, IdentityClientContract, PaymentClientContract, SystemClientContract, WalletClientContract } from './types.cjs';
import { H as HttpClient, R as ResolvedLilySdkConfig, c as HttpRequest, L as LilySdkConfig } from './types-DQe6dLwq.cjs';
export { a as HttpHeaders, b as HttpMethod, d as HttpResponse, e as LilySdkCreateOptions, f as RetryPolicy } from './types-DQe6dLwq.cjs';
export { resolveLilySdkConfig } from './config.cjs';
export { L as LILY_ERROR_CODES, a as LilyApiError, b as LilyAuthenticationError, c as LilyAuthorizationError, d as LilyConfigError, e as LilyConflictError, f as LilyErrorCode, g as LilyNotFoundError, h as LilyRateLimitError, i as LilySdkError, j as LilyServerError, k as LilyTransportError, l as LilyValidationError, m as isLilySdkError } from './errors-jEgvFRKI.cjs';
export { createFetchHttpClient } from './http.cjs';

declare abstract class BaseClient {
    protected readonly httpClient: HttpClient;
    protected readonly config?: ResolvedLilySdkConfig;
    constructor(httpClientOrConfig: HttpClient | ResolvedLilySdkConfig);
    protected requireNonEmptyString(value: unknown, field: string): asserts value is string;
    protected requireAtLeastOneNonEmptyString(input: unknown, fields: readonly string[]): void;
    protected buildPath(...segments: string[]): string;
    request<TResponse, TRequest = undefined>(request: HttpRequest<TRequest>): Promise<TResponse>;
}

declare class AgentClient extends BaseClient implements AgentClientContract {
    list(query?: ListAgentsQuery): Promise<readonly Agent[]>;
    get(agentId: string): Promise<Agent>;
    create(input: CreateAgentRequest): Promise<Agent>;
    update(agentId: string, input: UpdateAgentRequest): Promise<Agent>;
    delete(agentId: string): Promise<void>;
}

declare class IdentityClient extends BaseClient implements IdentityClientContract {
    resolve(input: ResolveIdentityRequest): Promise<IdentityProfile>;
    verify(input: VerifyIdentityRequest): Promise<VerificationResult>;
    get(identityId: string): Promise<IdentityProfile>;
}

declare class PaymentClient extends BaseClient implements PaymentClientContract {
    quote(input: PaymentQuoteRequest): Promise<PaymentQuote>;
    execute(input: ExecutePaymentRequest): Promise<Payment>;
    get(paymentId: string): Promise<Payment>;
    list(query?: {
        limit?: number;
        cursor?: string;
    }): Promise<readonly Payment[]>;
}

declare class SystemClient extends BaseClient implements SystemClientContract {
    private readonly validateResponses;
    constructor(httpClientOrConfig: HttpClient | ResolvedLilySdkConfig);
    health(): Promise<HealthStatus>;
    info(): Promise<ServiceInfo>;
}

declare class WalletClient extends BaseClient implements WalletClientContract {
    provision(input: ProvisionWalletRequest): Promise<WalletProvisioningResult>;
    get(walletId: string): Promise<Wallet>;
    list(query?: PaginationQuery): Promise<readonly Wallet[]>;
}

declare class LilySdk {
    static readonly version: string;
    readonly config: ResolvedLilySdkConfig;
    readonly httpClient: HttpClient;
    get http(): HttpClient;
    readonly agents: AgentClient;
    readonly wallets: WalletClient;
    readonly payments: PaymentClient;
    readonly identity: IdentityClient;
    readonly system: SystemClient;
    constructor(config?: Partial<LilySdkConfig>, httpClient?: HttpClient);
    /**
     * Creates a LilySdk instance with sensible defaults from environment variables.
     * Explicit options always take precedence over environment variables.
     *
     * Env vars read:
     * - LILY_API_URL (or LILY_BASE_URL)
     * - LILY_API_KEY
     * - LILY_AUTH_TOKEN
     *
     * Throws if no baseUrl is provided and no env var is set.
     */
    static create(options?: Partial<LilySdkConfig>, httpClient?: HttpClient): LilySdk;
    /**
     * Sends a typed request using the SDK's shared HttpClient and returns the
     * parsed response data, mirroring the client method API.
     */
    request<TResponse, TRequest = unknown>(request: HttpRequest<TRequest>): Promise<TResponse>;
    /**
     * Creates a new LilySdk instance with merged configuration.
     * Useful for multi-tenant scenarios where credentials or baseUrl differ per tenant.
     */
    withConfig(overrides: Partial<LilySdkConfig>): LilySdk;
}

declare const SDK_VERSION = "0.1.0";
declare global {
    const __LILY_SDK_VERSION__: string;
}

export { Agent, AgentClient, BaseClient, CreateAgentRequest, ExecutePaymentRequest, HealthStatus, HttpClient, HttpRequest, IdentityClient, IdentityProfile, LilySdk, LilySdkConfig, ListAgentsQuery, PaginationQuery, Payment, PaymentClient, PaymentQuote, PaymentQuoteRequest, ProvisionWalletRequest, ResolveIdentityRequest, ResolvedLilySdkConfig, SDK_VERSION, ServiceInfo, SystemClient, UpdateAgentRequest, VerificationResult, VerifyIdentityRequest, Wallet, WalletClient, WalletProvisioningResult };
