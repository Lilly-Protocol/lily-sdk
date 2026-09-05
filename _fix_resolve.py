# Fix resolve-config.ts: import defaults, support LILY_BASE_URL
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\config\resolve-config.ts", "r").read()

# Replace the inline constants with imports from defaults
content = content.replace(
    "const DEFAULT_TIMEOUT_MS = 10_000;\nconst DEFAULT_USER_AGENT",
    "import { DEFAULT_TIMEOUT_MS } from './defaults';\n\nconst DEFAULT_USER_AGENT"
)
content = content.replace(
    "const DEFAULT_RETRY_POLICY: RetryPolicy = {\n  retries: 2,\n  retryDelayMs: 250,\n  retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],\n};",
    "import { DEFAULT_RETRY_POLICY } from './defaults';"
)

# Fix resolveBaseUrl to support LILY_BASE_URL fallback
old_resolve = """function resolveBaseUrl(explicit: string | URL | undefined): URL {
  const raw =
    explicit ??
    (typeof process !== 'undefined' ? process.env.LILY_API_URL : undefined);

  if (raw === undefined) {
    throw new LilyConfigError('`baseUrl` is required.');
  }

  return safeUrl(raw);
}"""

new_resolve = """function resolveBaseUrl(explicit: string | URL | undefined): URL {
  const raw =
    explicit ??
    (typeof process !== 'undefined'
      ? process.env.LILY_API_URL ?? process.env.LILY_BASE_URL
      : undefined);

  if (raw === undefined) {
    throw new LilyConfigError(
      '`baseUrl` is required. Pass it explicitly or set LILY_API_URL / LILY_BASE_URL.',
    );
  }

  return safeUrl(raw);
}"""

content = content.replace(old_resolve, new_resolve)

# Fix resolveCredential for browser safety
old_cred = """function resolveCredential(
  explicit: string | undefined,
  envName: string,
): string | undefined {
  return explicit ?? process.env[envName] ?? undefined;
}"""

new_cred = """function resolveCredential(
  explicit: string | undefined,
  envName: string,
): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return explicit ?? process.env[envName] ?? undefined;
  }
  return explicit;
}"""

content = content.replace(old_cred, new_cred)

open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\config\resolve-config.ts", "w").write(content)
print("resolve-config.ts done")
