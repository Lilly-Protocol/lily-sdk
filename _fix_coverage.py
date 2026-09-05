# Fix fetch-http-client-coverage test: add text() mocks
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\tests\fetch-http-client-coverage.test.ts", "r").read()
# Fix the buildUrl test mock
old1 = """      json: async () => ({ ok: true }),
      text: async () => '',"""
new1 = """      json: async () => ({ ok: true }),
      text: async () => JSON.stringify({ ok: true }),"""
content = content.replace(old1, new1)
# Fix the serializeBody test mock
old2 = """      json: async () => ({}),
      text: async () => '',"""
new2 = """      json: async () => ({}),
      text: async () => '{}',"""
content = content.replace(old2, new2)
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\tests\fetch-http-client-coverage.test.ts", "w").write(content)
print("coverage test fixed")
