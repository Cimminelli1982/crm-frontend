---
allowed-tools: Bash(curl:*), mcp__supabase__execute_sql
description: Link a note to contacts, companies, or deals
---

Link or unlink a note to/from CRM entities (contacts, companies, deals).

## Usage

User provides:
- Note identifier (UUID or title)
- Entity to link: --contact, --company, --deal (by name or UUID)
- Action: link (default) or unlink

## Steps

### 1. Find the Note

```sql
SELECT note_id, title FROM notes
WHERE deleted_at IS NULL
  AND (note_id::text = 'USER_INPUT' OR LOWER(title) LIKE LOWER('%USER_INPUT%'))
LIMIT 3
```

### 2. Find the Entity to Link

For contacts:
```sql
SELECT contact_id, first_name || ' ' || COALESCE(last_name, '') AS name
FROM contacts
WHERE LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE LOWER('%NAME%')
LIMIT 5
```

For companies:
```sql
SELECT company_id, name FROM companies WHERE LOWER(name) LIKE LOWER('%NAME%') LIMIT 5
```

For deals:
```sql
SELECT deal_id, opportunity FROM deals WHERE LOWER(opportunity) LIKE LOWER('%NAME%') LIMIT 5
```

### 3. Link or Unlink

**To link:**
```bash
curl -s -X POST "https://command-center-backend-production.up.railway.app/notes/NOTE_ID/link" \
  -H "Content-Type: application/json" \
  -d '{"contacts": ["uuid"], "companies": ["uuid"], "deals": ["uuid"]}'
```

**To unlink:**
```bash
curl -s -X DELETE "https://command-center-backend-production.up.railway.app/notes/NOTE_ID/link" \
  -H "Content-Type: application/json" \
  -d '{"contacts": ["uuid"], "companies": ["uuid"], "deals": ["uuid"]}'
```

### 4. Confirm

Show the updated linked entities for the note.

## Examples

User: "/note-link Meeting notes --contact John Smith"
→ Find note "Meeting notes", find contact John Smith, link them

User: "link the Acme meeting note to Acme Corp company"
→ Find and link note to company

User: "/note-link abc123 --unlink --contact xyz789"
→ Unlink specific contact from note
