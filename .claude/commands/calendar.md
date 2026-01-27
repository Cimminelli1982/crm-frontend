---
allowed-tools: Read, mcp__supabase__execute_sql, Bash(curl:*)
description: Create calendar event from screenshot or text
---

Create a calendar event from the provided screenshot or text.

**Today's date:** !`date +%Y-%m-%d`
**Default timezone:** Europe/London (use CET only if user explicitly says so)

## Your Task

### 1. Extract Event Details

From the input (screenshot or text), extract:
- **Title/Subject** - meeting name or purpose
- **Date** - convert relative dates ("tomorrow", "next Monday") to absolute (YYYY-MM-DD)
- **Time** - in 24h format, assume London timezone unless user specifies CET
- **Duration** - default 1 hour if not specified
- **Location** - physical address or "Google Meet" if virtual
- **Attendees** - names of participants (if mentioned)

### 2. Look Up Attendees in CRM (if any names found)

For each attendee name, search in Supabase:

```sql
SELECT c.contact_id, c.first_name || ' ' || c.last_name AS name, ce.email
FROM contacts c
LEFT JOIN contact_emails ce ON ce.contact_id = c.contact_id AND ce.is_primary = true
WHERE LOWER(c.first_name || ' ' || c.last_name) LIKE LOWER('%NAME%')
   OR LOWER(c.first_name) LIKE LOWER('%NAME%')
LIMIT 3
```

### 3. Check for Conflicts

Query Google Calendar for the target date using **timeMin** and **timeMax** (NOT start/end):

```bash
curl -s "https://command-center-backend-production.up.railway.app/google-calendar/events?timeMin=YYYY-MM-DDT00:00:00Z&timeMax=YYYY-MM-DDT23:59:59Z" | jq '[.events[] | {summary, start: .start.dateTime, end: .end.dateTime}]'
```

This returns ALL events including recurring ones expanded for that date.

**Check for overlaps:** An overlap exists if:
- Existing event ends AFTER the new event starts, AND
- Existing event starts BEFORE the new event ends

**If ANY overlap is detected:**
- List the conflicting events with times
- Ask user how to resolve BEFORE creating the event
- Do NOT create until user confirms

### 4. Show Preview and Ask for Confirmation

Display:
```
**Event Preview:**
- Title: [extracted title]
- Date: [day, date]
- Time: [HH:MM - HH:MM] (London time)
- Location: [location or "not specified"]

**Attendees found in CRM:**
- [Name] -> [email]

**Altri eventi quel giorno:**
- [HH:MM - HH:MM] Event name
- [HH:MM - HH:MM] Event name

**Conflict Check:**
- ✅ Nessun conflitto OPPURE
- ⚠️ CONFLITTO: [event name] (HH:MM - HH:MM) si sovrappone di X minuti
  → Come vuoi gestirlo? (spostare, accorciare, lasciare così)

**Questions:**
1. Should I add [attendee names] as participants? (invites will be sent)
2. Add Google Meet link?

Confirm to create, or tell me what to change.
```

**IMPORTANT:**
- Always ask if user wants to add attendees as participants before including them.
- If there are conflicts, STOP and ask user how to resolve BEFORE creating the event.

### 5. Create Event (after user confirms)

```bash
curl -s -X POST "https://command-center-backend-production.up.railway.app/google-calendar/create-event" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "EVENT TITLE",
    "startDate": "YYYY-MM-DDTHH:MM:00",
    "endDate": "YYYY-MM-DDTHH:MM:00",
    "location": "LOCATION",
    "timezone": "Europe/London",
    "attendees": [{"email": "x@y.com", "name": "Name"}],
    "useGoogleMeet": true/false,
    "sendUpdates": "all"
  }'
```

Only include `attendees` array if user confirmed they want to invite people.

### 6. Confirm Success

Show the created event details and Google Calendar link.
