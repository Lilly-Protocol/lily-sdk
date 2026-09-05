# Fix non-json-204 test: update assertions for new parseResponse behavior
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\tests\non-json-204.test.ts", "r").read()
old = """    expect(result.data).toEqual(jsonData);
    expect(mockResponse.json).toHaveBeenCalled();
    expect(mockResponse.text).not.toHaveBeenCalled();"""
new = """    expect(result.data).toEqual(jsonData);
    // New implementation reads text once then JSON.parse, not response.json()
    expect(mockResponse.text).toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();"""
content = content.replace(old, new)
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\tests\non-json-204.test.ts", "w").write(content)
print("fixed")
