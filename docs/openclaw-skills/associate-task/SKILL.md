---
name: associate-task
description: "Associate an existing task with contacts, companies, or deals"
version: 1.0.0
category: tasks
---

# /associate-task

## Flusso

1. Simone specifica quale task (per nome) e a chi associarla
2. Se il contesto ha un contact_id, suggerisci quello
3. Cerca la task in Supabase per content (ILIKE)
4. Cerca il contatto/company/deal per nome se necessario
5. Crea l'associazione
6. **VERIFICA OBBLIGATORIA** — GET per confermare

## Cercare task
```bash
source /opt/openclaw.env
curl -sS "${SUPABASE_URL}/rest/v1/tasks?content=ilike.*{KEYWORD}*&status=eq.open&select=task_id,content,todoist_project_name,due_date&limit=10" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```

## Cercare contatto/company/deal
```bash
source /opt/openclaw.env
# Contact
curl -sS "${SUPABASE_URL}/rest/v1/contacts?or=(first_name.ilike.*{NAME}*,last_name.ilike.*{NAME}*)&select=contact_id,first_name,last_name&limit=5" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"

# Company
curl -sS "${SUPABASE_URL}/rest/v1/companies?name=ilike.*{NAME}*&select=company_id,name&limit=5" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"

# Deal
curl -sS "${SUPABASE_URL}/rest/v1/deals?opportunity=ilike.*{NAME}*&select=deal_id,opportunity&limit=5" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```

## Creare associazione
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

## Verifica
```bash
source /opt/openclaw.env
curl -sS "${SUPABASE_URL}/rest/v1/task_contacts?task_id=eq.{TASK_ID}&select=contact_id,contacts(first_name,last_name)" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```
