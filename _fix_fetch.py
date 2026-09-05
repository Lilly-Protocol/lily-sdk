# Fix fetch-http-client.ts parseResponse for non-2xx JSON errors
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "r").read()

old_parse = """async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as unknown;
    } catch (error) {
      throw new LilyValidationError(
        `Failed to parse response body as JSON (status ${response.status}, content-type: ${contentType}).`,
        {
          code: 'RESPONSE_VALIDATION_ERROR',
          statusCode: response.status,
          cause: error,
        },
      );
    }
  }

  return await response.text();
}"""

new_parse = """async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as unknown;
    } catch (error) {
      // For non-ok responses, surface the real HTTP error instead of a
      // validation error — callers lose the actual status otherwise.
      if (!response.ok) {
        const rawText = await response.text();
        throw new LilyApiError(
          \`Failed to parse response body as JSON (status \${response.status}, content-type: \${contentType}).\`,
          {
            code: LILY_ERROR_CODES.API_ERROR,
            statusCode: response.status,
            details: rawText,
            cause: error,
          },
        );
      }
      throw new LilyValidationError(
        \`Failed to parse response body as JSON (status \${response.status}, content-type: \${contentType}).\`,
        {
          code: 'RESPONSE_VALIDATION_ERROR',
          statusCode: response.status,
          cause: error,
        },
      );
    }
  }

  return await response.text();
}"""

content = content.replace(old_parse, new_parse)
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "w").write(content)
print("fetch-http-client.ts done")
