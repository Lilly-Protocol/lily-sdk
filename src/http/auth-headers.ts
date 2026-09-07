import { resolveAuthHeaders } from './resolve-auth-headers';

export { resolveAuthHeaders, toBearer } from './resolve-auth-headers';

export const toHeaders = resolveAuthHeaders;
