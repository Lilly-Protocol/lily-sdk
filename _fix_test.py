# Fix: add null handler to mock client calls
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\tests\client-id-validation.test.ts", "r").read()
content = content.replace("createMockHttpClient()", "createMockHttpClient(() => Promise.resolve({ status: 200, headers: new Headers(), data: null }))")
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\tests\client-id-validation.test.ts", "w").write(content)
print("test fixed")
