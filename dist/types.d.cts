import { ListAgentsQuery, Agent, CreateAgentRequest, UpdateAgentRequest, ResolveIdentityRequest, IdentityProfile, VerifyIdentityRequest, VerificationResult, ProvisionWalletRequest, WalletProvisioningResult, Wallet, PaginationQuery, PaymentQuoteRequest, PaymentQuote, ExecutePaymentRequest, Payment, HealthStatus, ServiceInfo } from './models.cjs';

interface AgentClientContract {
    list(query?: ListAgentsQuery): Promise<readonly Agent[]>;
    get(agentId: string): Promise<Agent>;
    create(input: CreateAgentRequest): Promise<Agent>;
    update(agentId: string, input: UpdateAgentRequest): Promise<Agent>;
    delete(agentId: string): Promise<void>;
}
interface WalletClientContract {
    provision(input: ProvisionWalletRequest): Promise<WalletProvisioningResult>;
    get(walletId: string): Promise<Wallet>;
    list(query?: PaginationQuery): Promise<readonly Wallet[]>;
}
interface PaymentClientContract {
    quote(input: PaymentQuoteRequest): Promise<PaymentQuote>;
    execute(input: ExecutePaymentRequest): Promise<Payment>;
    get(paymentId: string): Promise<Payment>;
    list(query?: PaginationQuery): Promise<readonly Payment[]>;
}
interface IdentityClientContract {
    resolve(input: ResolveIdentityRequest): Promise<IdentityProfile>;
    verify(input: VerifyIdentityRequest): Promise<VerificationResult>;
    get(identityId: string): Promise<IdentityProfile>;
}
interface SystemClientContract {
    health(): Promise<HealthStatus>;
    info(): Promise<ServiceInfo>;
}

export type { AgentClientContract, IdentityClientContract, PaymentClientContract, SystemClientContract, WalletClientContract };
