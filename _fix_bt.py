content = open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "r").read()
# Fix the escaped backticks - replace \\\` with actual backtick
content = content.replace("\\`", "`").replace("\\${", "${")
open(r"C:\Users\someo\Documents\Codex\bounty_work\lily-sdk\src\http\fetch-http-client.ts", "w").write(content)
print("fixed backticks")
