# Fix non-json-204 test: add text() mock
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\tests\non-json-204.test.ts", "r").read()
# Add text mock to the JSON parsing test
old = """      json: vi.fn().mockResolvedValue(jsonData),
      text: vi.fn(),"""
new = """      json: vi.fn().mockResolvedValue(jsonData),
      text: vi.fn().mockResolvedValue(JSON.stringify(jsonData)),"""
content = content.replace(old, new)
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\tests\non-json-204.test.ts", "w").write(content)
print("non-json-204 test fixed")
