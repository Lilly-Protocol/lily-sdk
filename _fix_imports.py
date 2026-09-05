# Fix fetch-http-client.ts to import from defaults instead of local constant
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "r").read()

# Replace local constant with import
content = content.replace(
    "const DEFAULT_RETRYABLE_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504];\n\nexport function createFetchHttpClient",
    "import { DEFAULT_RETRYABLE_STATUS_CODES } from '../config/defaults';\n\nexport function createFetchHttpClient"
)

open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "w").write(content)
print("fetch-http-client.ts import updated")
