---
allowed-tools: Bash(curl:*), mcp__supabase__execute_sql
description: Edit an existing note in the CRM
---

Edit an existing note in the CRM database.

## Usage

The user provides:
- Note identifier (UUID or title search)
- What to change (title, content, folder, type)

## Steps

### 1. Find the Note

If user provides a UUID, use it directly. Otherwise search by title:

```sql
SELECT note_id, title, folder_path, note_type, markdown_content, synced_at
FROM notes
WHERE deleted_at IS NULL
  AND (note_id::text = 'USER_INPUT' OR LOWER(title) LIKE LOWER('%USER_INPUT%'))
ORDER BY last_modified_at DESC
LIMIT 5
```

If multiple matches, list them and ask user to specify.

### 2. Show Current Content

Display:
- Title
- Folder path
- Note type
- Current content (first 500 chars if long)
- Last modified date

Ask user what they want to change.

### 3. Update the Note

```bash
curl -s -X PUT "https://command-center-backend-production.up.railway.app/notes/NOTE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "NEW TITLE",
    "markdown_content": "NEW CONTENT",
    "folder_path": "NEW FOLDER",
    "note_type": "NEW TYPE"
  }'
```

Only include fields that are being changed.

### 4. Confirm Success

Show the updated note details.

## Examples

User: "edit the note about John Smith meeting"
→ Search for note, show current content, ask what to change

User: "/note-edit abc123-uuid --content 'Updated meeting notes...'"
→ Update content directly
