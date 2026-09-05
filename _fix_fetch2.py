# Fix fetch-http-client.ts: return text instead of undefined
content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "r").read()
# The issue is "return text;" at the end - text is not defined there
content = content.replace(
    """  return text;\n}""",
    """  return await response.text();\n}"""
)
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "w").write(content)
print("fetch fixed")
