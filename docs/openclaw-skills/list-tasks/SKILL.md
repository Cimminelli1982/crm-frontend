---
name: list-tasks
description: "List tasks associated with a contact, company, or deal"
version: 1.0.0
category: tasks
---

# /list-tasks

## Flusso

1. Prendi il contact_id (o company/deal) dal contesto
2. Query junction table + tasks
3. Mostra: titolo, scadenza, priorita, progetto, status
4. Se zero risultati, comunicalo

## Query
```bash
source /opt/openclaw.env

# Tasks per contatto
TASK_IDS=$(curl -sS "${SUPABASE_URL}/rest/v1/task_contacts?contact_id=eq.{CONTACT_ID}&select=task_id" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" | jq -r '.[].task_id' | paste -sd, -)

if [ -n "$TASK_IDS" ]; then
  curl -sS "${SUPABASE_URL}/rest/v1/tasks?task_id=in.(${TASK_IDS})&status=eq.open&select=task_id,content,status,due_date,priority,todoist_project_name,todoist_section_name&order=due_date.asc.nullslast" \
    -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
else
  echo "[]"
fi

# Tasks per company (se richiesto)
# curl -sS "${SUPABASE_URL}/rest/v1/task_companies?company_id=eq.{COMPANY_ID}&select=task_id" ...

# Tasks per deal (se richiesto)
# curl -sS "${SUPABASE_URL}/rest/v1/task_deals?deal_id=eq.{DEAL_ID}&select=task_id" ...
```
