---
allowed-tools: Bash(curl:*)
description: List notes from the CRM
---

List notes from the CRM database with optional filters.

## Usage

User can filter by:
- **--folder**: Folder path (Inbox, CRM, Personal, Archive)
- **--type**: Note type (general, meeting, call, research, idea, follow-up)
- **--search**: Search term in title or content
- **--contact**: Notes linked to a specific contact
- **--company**: Notes linked to a specific company
- **--limit**: Number of results (default 10)

## Steps

### 1. Build Query Parameters

```bash
curl -s "https://command-center-backend-production.up.railway.app/notes?folder=FOLDER&type=TYPE&search=SEARCH&limit=LIMIT"
```

### 2. Display Results

Format as a table:
```
| # | Title                    | Folder        | Type    | Modified          |
|---|--------------------------|---------------|---------|-------------------|
| 1 | Meeting with John        | CRM/Meetings  | meeting | 2026-01-27 10:30  |
| 2 | Project ideas            | Personal      | idea    | 2026-01-26 15:00  |
```

Include:
- Total count
- Linked contacts/companies (abbreviated)

### 3. Offer Actions

After listing, offer:
- "View note #N" to see full content
- "Edit note #N" to modify
- "Delete note #N" to remove

## Examples

User: "/note-list --folder CRM"
→ List all notes in CRM folder

User: "/note-list --search meeting --limit 5"
→ Search notes containing "meeting", show 5 results

User: "show my recent notes"
→ List most recent 10 notes
