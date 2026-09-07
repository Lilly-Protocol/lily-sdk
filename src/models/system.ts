export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  checks: Record<string, 'ok' | 'degraded' | 'down'>;
}

export interface ServiceInfo {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  docsUrl?: string;
}
