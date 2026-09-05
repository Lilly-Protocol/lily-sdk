# Fix: move text return outside the if block properly
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "r").read()
old_block = """  if (contentType.includes('application/json')) {
    // Read body once as text to avoid double-consumption, then parse.
    const text = await response.text();
    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      // For non-ok responses, surface the real HTTP error instead of a
      // validation error — callers lose the actual status otherwise.
      if (!response.ok) {
        throw new LilyApiError(
          `Failed to parse response body as JSON (status ${response.status}, content-type: ${contentType}).`,
          {
            code: LILY_ERROR_CODES.API_ERROR,
            statusCode: response.status,
            details: text,
            cause: error,
          },
        );
      }
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

  return text;"""

new_block = """  if (contentType.includes('application/json')) {
    // Read body once as text to avoid double-consumption, then parse.
    const text = await response.text();
    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      // For non-ok responses, surface the real HTTP error instead of a
      // validation error — callers lose the actual status otherwise.
      if (!response.ok) {
        throw new LilyApiError(
          `Failed to parse response body as JSON (status ${response.status}, content-type: ${contentType}).`,
          {
            code: LILY_ERROR_CODES.API_ERROR,
            statusCode: response.status,
            details: text,
            cause: error,
          },
        );
      }
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

  return await response.text();"""

content = content.replace(old_block, new_block)
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "w").write(content)
print("fixed")
