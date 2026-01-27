---
allowed-tools: Bash(curl:*), mcp__supabase__execute_sql
description: Create a new note in the CRM
---

Create a new note in the CRM database.

## Usage

The user may provide:
- A title (required)
- Content/text for the note
- Folder path (Inbox, CRM/Contacts, CRM/Companies, CRM/Meetings, Personal, Archive)
- Note type (general, meeting, call, research, idea, follow-up)
- Names of contacts/companies/deals to link

## Steps

### 1. Parse User Input

Extract from the request:
- **title**: Required - the note title
- **content**: The markdown content (if provided)
- **folder**: Default "Inbox" if not specified
- **type**: Default "general" if not specified
- **linked entities**: Contact/company/deal names to link

### 2. Look Up Linked Entities (if names provided)

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

### 3. Create the Note

```bash
curl -s -X POST "https://command-center-backend-production.up.railway.app/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "NOTE TITLE",
    "markdown_content": "CONTENT HERE",
    "folder_path": "FOLDER",
    "note_type": "TYPE",
    "contacts": ["uuid1", "uuid2"],
    "companies": ["uuid1"],
    "deals": ["uuid1"]
  }'
```

### 4. Confirm Success

Show the created note with:
- Note ID
- Title
- Folder path
- Linked entities (if any)
- Obsidian path (for sync reference)

## Examples

User: "create a note about the meeting with John Smith"
→ Create note with title "Meeting with John Smith", search for John Smith in contacts, link if found

User: "/note-create Call with Acme Corp --folder CRM/Meetings --type call"
→ Create in CRM/Meetings folder with type "call", link to Acme Corp company
