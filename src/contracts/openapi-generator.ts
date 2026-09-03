export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, any>>;
  components?: { schemas?: Record<string, any> };
}

export interface ClientContract {
  endpoint: string;
  method: string;
  operationId: string;
  requestType?: string;
  responseType?: string;
  parameters: { name: string; in: string; required: boolean; type: string }[];
}

export function generateContracts(spec: OpenApiSpec): ClientContract[] {
  const contracts: ClientContract[] = [];

  for (const [path, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
      const op = operation as any;
      contracts.push({
        endpoint: path,
        method: method.toUpperCase(),
        operationId: op.operationId || `${method}_${path.replace(/[{}\/]/g, '_')}`,
        requestType: op.requestBody?.content?.['application/json']?.schema?.$ref?.split('/')?.pop(),
        responseType: op.responses?.['200']?.content?.['application/json']?.schema?.$ref?.split('/')?.pop(),
        parameters: (op.parameters || []).map((p: any) => ({
          name: p.name,
          in: p.in,
          required: p.required || false,
          type: p.schema?.type || 'string',
        })),
      });
    }
  }

  return contracts;
}
