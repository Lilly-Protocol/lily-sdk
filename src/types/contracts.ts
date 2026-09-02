import type {
  Agent,
  CreateAgentRequest,
  ExecutePaymentRequest,
  HealthStatus,
  IdentityProfile,
  ListAgentsQuery,
  Payment,
  PaymentQuote,
  PaymentQuoteRequest,
  ProvisionWalletRequest,
  ResolveIdentityRequest,
  ServiceInfo,
  UpdateAgentRequest,
  VerificationResult,
  VerifyIdentityRequest,
  Wallet,
  WalletProvisioningResult,
} from '../models';

export interface AgentClientContract {
  list(query?: ListAgentsQuery): Promise<readonly Agent[]>;
  get(agentId: string): Promise<Agent>;
  create(input: CreateAgentRequest): Promise<Agent>;
  update(agentId: string, input: UpdateAgentRequest): Promise<Agent>;
}

export interface WalletClientContract {
  provision(input: ProvisionWalletRequest): Promise<WalletProvisioningResult>;
  get(walletId: string): Promise<Wallet>;
}

export interface PaymentClientContract {
  quote(input: PaymentQuoteRequest): Promise<PaymentQuote>;
  execute(input: ExecutePaymentRequest): Promise<Payment>;
  get(paymentId: string): Promise<Payment>;
}

export interface IdentityClientContract {
  resolve(input: ResolveIdentityRequest): Promise<IdentityProfile>;
  verify(input: VerifyIdentityRequest): Promise<VerificationResult>;
  get(identityId: string): Promise<IdentityProfile>;
}

export interface SystemClientContract {
  health(): Promise<HealthStatus>;
  info(): Promise<ServiceInfo>;
}
