---
allowed-tools: mcp__google-calendar__list-events, mcp__todoist__get_tasks_list, mcp__todoist__get_completed_tasks, mcp__todoist__get_projects_list, mcp__supabase__execute_sql, Bash(curl:*)
description: Generate and send the daily evening briefing email (19:00 UK recap)
---

# Evening Briefing Email

Generate and send the daily end-of-day summary email.

**Today's date:** !`date +%Y-%m-%d`
**Timezone:** Europe/London
**From:** salvatore@cimminelli.com
**To:** simone@cimminelli.com

## Data to Gather (run ALL in parallel where possible)

### 1. Appointments Today (both calendars)

Use `mcp__google-calendar__list-events` for BOTH calendars with today's date range:

- **Agenda management** (primary): `simone@cimminelli.com`
- **Living with intention**: `c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com`

timeMin: `YYYY-MM-DDT00:00:00`, timeMax: `YYYY-MM-DDT23:59:59`, timeZone: `Europe/London`

### 2. Tasks Completed Today (Todoist)

Use `mcp__todoist__get_completed_tasks` with `since: YYYY-MM-DDT00:00:00Z` and `until: YYYY-MM-DDT23:59:59Z`

### 3. Tasks Open in Today View (Todoist)

Use `mcp__todoist__get_tasks_list` with filter: `today`
Also call `mcp__todoist__get_projects_list` in parallel to resolve project names from project_id.

**CRITICAL**: The `today` filter returns ALL tasks in the Todoist Today view (due today + overdue + no-date). List EVERY SINGLE task returned, grouped by project name. NEVER write "All clear" if the API returned tasks.

### 4. Tasks Added Today (Todoist)

Do NOT call the API with `created: today` — it does not work (returns same results as `today`).

Instead, reuse the results from step 3 and filter client-side: only include tasks where `added_at` starts with today's date (`YYYY-MM-DD`). If none match, show "No new tasks added today".

### 5. People Interacted With Today

**ALWAYS run ALL 4 queries in parallel**, then merge results. Data lives in two places: `interactions` (processed items) and `command_center_inbox` (pending items). A contact may appear in only one.

**5.1 Email from interactions:**
```sql
SELECT DISTINCT
  c.first_name || ' ' || c.last_name AS name,
  ce.email
FROM interactions i
JOIN contacts c ON c.contact_id = i.contact_id
LEFT JOIN contact_emails ce ON ce.contact_id = c.contact_id AND ce.is_primary = true
WHERE i.interaction_type = 'email'
  AND i.interaction_date::date = 'YYYY-MM-DD'
ORDER BY name
```

**5.2 Email from inbox:**
```sql
SELECT DISTINCT from_name AS name, from_email AS email
FROM command_center_inbox
WHERE type = 'email' AND date::date = 'YYYY-MM-DD'
ORDER BY from_name
```

**5.3 WhatsApp from interactions:**
```sql
SELECT DISTINCT
  c.first_name || ' ' || c.last_name AS name,
  cm.mobile
FROM interactions i
JOIN contacts c ON c.contact_id = i.contact_id
LEFT JOIN contact_mobiles cm ON cm.contact_id = c.contact_id AND cm.is_primary = true
WHERE i.interaction_type = 'whatsapp'
  AND i.interaction_date::date = 'YYYY-MM-DD'
ORDER BY name
```

**5.4 WhatsApp from inbox:**
```sql
SELECT DISTINCT chat_name AS name, contact_number AS mobile
FROM command_center_inbox
WHERE type = 'whatsapp' AND date::date = 'YYYY-MM-DD' AND NOT is_group_chat
ORDER BY chat_name
```

**Merge**: Combine 5.1+5.2 for email (deduplicate by email). Combine 5.3+5.4 for WhatsApp (deduplicate by mobile). Exclude entries where name is clearly a company/marketing (e.g. "Marketing").

### 6. Priorities

```sql
SELECT title, is_completed, notes
FROM priorities
WHERE scope_date = 'YYYY-MM-DD'
ORDER BY sort_order
```

If empty for today, try `scope = 'daily'` with no date filter (get latest).

### 7. Weight — Last 4 Days

```sql
SELECT date, weight_kg, body_fat_pct
FROM body_metrics
WHERE date >= (CURRENT_DATE - INTERVAL '3 days')
  AND date <= CURRENT_DATE
ORDER BY date DESC
```

Only include if there are 4 consecutive days of data.

## Email Composition

Build a clean, readable HTML email. Subject: `Evening Briefing — DD MMM YYYY`

Structure:
```
📅 APPOINTMENTS TODAY
- HH:MM - HH:MM  Event Name (Calendar Name)
- ...
(or "No appointments today")

✅ TASKS COMPLETED TODAY
- Task name (Project)
- ...
(or "No tasks completed")

⏳ TASKS IN TODAY VIEW (still open)
Group by project. List EVERY task returned by the API:

**Personal**
- Task 1
- Task 2

**Work**
- Task 3

**Birthdays 🎂**
- 🎂 Birthday: Name 1
- Name 2 (KIT reminder)
- ...

➕ TASKS ADDED TODAY
- Task name (Project)
- ...

👥 PEOPLE I INTERACTED WITH

📧 Email:
- First Last — email@example.com
- ...

💬 WhatsApp:
- First Last — [+44 xxx](https://wa.me/44xxx)
- ...
(Format mobile as wa.me link, strip spaces/dashes/plus from number for the URL)

🎯 PRIORITIES
- [x] Priority 1
- [ ] Priority 2
- ...

⚖️ WEIGHT TRACKER
| Date | Weight | Body Fat % |
|------|--------|------------|
| 9 Mar | 82.3 | 18.2% |
| ... | ... | ... |
(or skip section entirely if < 4 consecutive days)

---

🔥 I 7 COMANDAMENTI

• Libero da porno
• Mangio da atleta
• Famiglia la mia priorità
• Mi alleno da professionista
• Chiudo al 100% prima di aprire
• Trovo gioia nel tempo con Katherine
• Focus in. Vita sociale in moderazione
```

## Send Email

Use curl to send via the backend:

```bash
curl -s -X POST "https://command-center-backend-production.up.railway.app/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"email": "simone@cimminelli.com", "name": "Simone Cimminelli"}],
    "subject": "Evening Briefing — DD MMM YYYY",
    "textBody": "<plain text version>",
    "htmlBody": "<html version>"
  }'
```

## Final Output

After sending, confirm: "Evening briefing sent to simone@cimminelli.com"
