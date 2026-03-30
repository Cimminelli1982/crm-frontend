# 1Password Lookup

Search 1Password vault using the `op` CLI.

## Input
$ARGUMENTS — what to search for (e.g., "gmail simone@cimminelli.com", "logins netflix", "credit card revolut")

## Instructions

1. Parse the query from $ARGUMENTS
2. Search using `op item list --categories Login --format json` and filter by the query
3. If a match is found, get details with `op item get "<item-id>" --reveal --format json`
4. Show the relevant fields: username, password, URL, notes
5. If multiple matches, list them and ask which one

## Rules
- ALWAYS use `--reveal` to show actual password values
- NEVER save passwords to any file or memory
- If no match found, try broader search with `op item list --format json`
- Show results clearly formatted, never log them
