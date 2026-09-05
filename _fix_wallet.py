content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\clients\wallet-client.ts", "r").read()
old_import = "import { encodePathSegment } from '../http/path';"
new_import = "import { encodePathSegment } from '../http/path';\nimport { validateNonEmptyString } from '../validation';"
content = content.replace(old_import, new_import)
old_get = """  public get(walletId: string): Promise<Wallet> {
    return this.request({"""
new_get = """  public get(walletId: string): Promise<Wallet> {
    validateNonEmptyString(walletId, 'walletId');
    return this.request({"""
content = content.replace(old_get, new_get)
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\clients\wallet-client.ts", "w").write(content)
print("wallet-client.ts done")
