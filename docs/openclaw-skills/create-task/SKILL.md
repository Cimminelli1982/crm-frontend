---
name: create-task
description: "Create a new task in Todoist and associate it in Supabase"
version: 1.0.0
category: tasks
---

# /create-task

## Flusso

1. **Parsa il contesto** — il frontend passa contact, email, deal, whatsapp se disponibili
2. **Chiedi SOLO quello che manca:**
   - Titolo: se non ovvio dal contesto, chiedi
   - Progetto (Work/Personal/Team): chiedi sempre se non specificato
   - Sezione (This Week/Next Week/This Month/This Sprint/This Year/Next Year/Someday): chiedi sempre se non specificata
   - Due date: chiedi se non specificata
   - Associazioni: suggerisci quelle probabili dal contesto ("Vuoi associarla a [contatto X]? A un deal? A un'azienda?")
   - Priorita: chiedi solo se non specificata (default: 1, range 1-4 dove 4=urgent)
3. **Crea la task su Todoist** (1 sola tool call, curl + log)
4. **Associa in Supabase** se richiesto
5. **VERIFICA OBBLIGATORIA** — GET sulla task + GET sulle junction tables

## Todoist API

### Endpoint
POST `https://api.todoist.com/api/v1/tasks`
Headers: `Authorization: Bearer $TODOIST_API_TOKEN`, `Content-Type: application/json`

### Progetti e Sezioni

| Progetto | project_id |
|----------|-----------|
| Inbox | 6VhG9MrQwJwqJJfW |
| Work | 6VqRM39cGMjV8pP7 |
| Personal | 6VmX2Jv6wGG8W8V5 |
| Team | 6fp9mp2F253X67f8 |
| Birthdays | 6crr237qxV93wV9q |

**Work sections:**
This Week: 6fm2MrvGJPv5r4Pf | Next Week: 6fm2MrvG7V3qHw97 | This Month: 6fm2MrwHRg8JJpC7 | This Sprint: 6fm2MrvRgWjGFX6f | This Year: 6fm2Mrw8cx9chJ57 | Next Year: 6fm2MrrmRGHQ4Rwf | Someday: 6fm2Mrw24Q24r2Jf

**Personal sections:**
This Week: 6fm2Mrvv4vXpwg45 | Next Week: 6fm2Mrw6gxMWfRqX | This Month: 6fm2MrwCP5qXCX4X | This Sprint: 6fm2Mrw9J8Rc9wm5 | This Year: 6fm2Mrw9hcq8cF3X | Next Year: 6fm2Mrwxpg3x3Rv5 | Someday: 6fm2MrwW5vVXmMH5

**Team sections:**
Clarissa: 6g2F7V62h2rVmJ78 | Katherine: 6fr2fCwgQWfGRq2g | Kevin: 6g2F7VmGmhR74vWg | Rosaria: 6fp9p56fMqXw9CHg

### Template curl + log (1 tool call)
```bash
source /opt/openclaw.env

RESP=$(curl -sS -X POST "https://api.todoist.com/api/v1/tasks" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "{CONTENT}",
    "project_id": "{PROJECT_ID}",
    "section_id": "{SECTION_ID}",
    "due_string": "{DUE_STRING}",
    "priority": {PRIORITY}
  }')

TASK_ID=$(echo "$RESP" | jq -r '.id')
echo "$RESP" | jq .

cat >> ops-log.md <<LOGEOF
- Todoist: creato "{CONTENT}" | {PROJECT}/{SECTION} | due:{DUE} | p:{PRIORITY} | id:$TASK_ID
LOGEOF
```
Se un campo opzionale non c'e', rimuovilo dal JSON.

## Associazioni Supabase

### Junction tables
- `task_contacts`: `id` (uuid PK), `task_id`, `contact_id`, `created_at`
- `task_companies`: `id` (uuid PK), `task_id`, `company_id`, `created_at`
- `task_deals`: `id` (uuid PK), `task_id`, `deal_id`, `created_at`

### Trovare il task_id in Supabase dopo creazione Todoist
```bash
source /opt/openclaw.env
curl -sS "${SUPABASE_URL}/rest/v1/tasks?todoist_id=eq.{TODOIST_TASK_ID}&select=task_id" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```
NOTA: la sync Todoist->Supabase potrebbe non essere immediata. Se il task non esiste ancora, crealo direttamente:
```bash
curl -sS -X POST "${SUPABASE_URL}/rest/v1/tasks" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{
    "todoist_id": "{TODOIST_TASK_ID}",
    "content": "{CONTENT}",
    "status": "open",
    "todoist_project_id": "{PROJECT_ID}",
    "todoist_project_name": "{PROJECT_NAME}",
    "todoist_section_id": "{SECTION_ID}",
    "todoist_section_name": "{SECTION_NAME}",
    "due_date": "{DUE_DATE}",
    "due_string": "{DUE_STRING}",
    "priority": {PRIORITY},
    "created_at": "now()"
  }'
```

### Creare associazione
```bash
source /opt/openclaw.env
# Task <-> Contact
curl -sS -X POST "${SUPABASE_URL}/rest/v1/task_contacts" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"task_id": "{TASK_ID}", "contact_id": "{CONTACT_ID}"}'

# Task <-> Company
curl -sS -X POST "${SUPABASE_URL}/rest/v1/task_companies" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"task_id": "{TASK_ID}", "company_id": "{COMPANY_ID}"}'

# Task <-> Deal
curl -sS -X POST "${SUPABASE_URL}/rest/v1/task_deals" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"task_id": "{TASK_ID}", "deal_id": "{DEAL_ID}"}'
```

### Cercare contatto/company/deal per nome (per associazione)
```bash
source /opt/openclaw.env
# Contact by name
curl -sS "${SUPABASE_URL}/rest/v1/contacts?or=(first_name.ilike.*{NAME}*,last_name.ilike.*{NAME}*)&select=contact_id,first_name,last_name&limit=5" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"

# Company by name
curl -sS "${SUPABASE_URL}/rest/v1/companies?name=ilike.*{NAME}*&select=company_id,name&limit=5" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"

# Deal by name
curl -sS "${SUPABASE_URL}/rest/v1/deals?opportunity=ilike.*{NAME}*&select=deal_id,opportunity&limit=5" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```

## Verifica obbligatoria

Dopo creazione e associazione, GET per confermare:
```bash
source /opt/openclaw.env
# Task
curl -sS "${SUPABASE_URL}/rest/v1/tasks?todoist_id=eq.{TODOIST_TASK_ID}&select=task_id,content,status,due_date,priority,todoist_project_name" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"

# Associations
curl -sS "${SUPABASE_URL}/rest/v1/task_contacts?task_id=eq.{TASK_ID}&select=contact_id,contacts(first_name,last_name)" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```
