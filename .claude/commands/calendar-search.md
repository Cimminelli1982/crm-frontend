---
allowed-tools: mcp__google-calendar__search-events, mcp__google-calendar__list-events, mcp__google-calendar__get-event
description: Search events across all Google Calendars
---

Search calendar events based on the user's request: $ARGUMENTS

## Calendars (ALWAYS search both)

1. **Living with intention** — personal/lifestyle events
   - ID: `c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com`

2. **Agenda management** — scheduling/logistics (primary)
   - ID: `simone@cimminelli.com`

## Instructions

1. ALWAYS search BOTH calendars in parallel.
2. Default time range: if the user says "this year" use Jan 1 – Dec 31 of current year. If no time is specified, search from today to 6 months ahead.
3. Use `search-events` for text queries, `list-events` for browsing a date range.
4. Present results clearly: event name, date/time, calendar name, location (if any).
5. If results are empty on both calendars, say so clearly.
6. The user speaks both Italian and English — interpret queries in either language.
