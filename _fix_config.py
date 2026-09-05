# Update src/config.ts to export defaults
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\config.ts", "r").read()

# Add exports for defaults
new_exports = """export type {
  LilySdkConfig,
  LilySdkCreateOptions,
  ResolvedLilySdkConfig,
} from './config/types';
export { resolveLilySdkConfig } from './config/resolve-config';
export {
  DEFAULT_TIMEOUT_MS,
  DEFAULT_RETRY_POLICY,
  DEFAULT_RETRYABLE_STATUS_CODES,
} from './config/defaults';
"""

content = new_exports
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\config.ts", "w").write(content)
print("config.ts updated")
