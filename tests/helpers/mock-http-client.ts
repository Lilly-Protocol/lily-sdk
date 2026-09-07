import type {
  HttpClient,
  HttpRequest,
  HttpResponse,
} from '../../src/http/types';

export function createMockHttpClient(
  handler: (request: HttpRequest<any>) => Promise<HttpResponse<any>>,
): HttpClient {
  return {
    request: ((request) => handler(request)) as HttpClient['request'],
  };
}
