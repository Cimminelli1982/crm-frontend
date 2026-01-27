---
allowed-tools: Bash(curl:*), mcp__supabase__execute_sql
description: Delete a note from the CRM (soft delete)
---

Delete a note from the CRM database. This is a soft delete - the note can be recovered.

## Usage

User provides:
- Note UUID or title to search

## Steps

### 1. Find the Note

If not a UUID, search by title:

```sql
SELECT note_id, title, folder_path, created_at
FROM notes
WHERE deleted_at IS NULL
  AND (note_id::text = 'USER_INPUT' OR LOWER(title) LIKE LOWER('%USER_INPUT%'))
ORDER BY last_modified_at DESC
LIMIT 5
```

### 2. Confirm Deletion

**ALWAYS ask for confirmation before deleting.**

Display:
- Note title
- Folder path
- Created date
- Number of linked entities

Ask: "Are you sure you want to delete this note?"

### 3. Delete the Note

Only after user confirms:

```bash
curl -s -X DELETE "https://command-center-backend-production.up.railway.app/notes/NOTE_ID"
```

### 4. Confirm Success

Show confirmation message with note ID for reference (in case user wants to recover).

## Examples

User: "/note-delete Meeting with John"
→ Find note, show details, ask confirmation, then delete

User: "delete the note abc123-uuid"
→ Confirm and delete by UUID
