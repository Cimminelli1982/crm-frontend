---
name: complete-task
description: "Mark a task as completed in Todoist and Supabase"
version: 1.0.0
category: tasks
---

# /complete-task

## Flusso

1. Simone specifica quale task (per nome)
2. Cerca in Supabase per content (ILIKE)
3. Se piu risultati, chiedi quale
4. Chiudi su Todoist + aggiorna Supabase
5. **VERIFICA OBBLIGATORIA** — GET per confermare

## Cercare task
```bash
source /opt/openclaw.env
curl -sS "${SUPABASE_URL}/rest/v1/tasks?content=ilike.*{KEYWORD}*&status=eq.open&select=task_id,todoist_id,content,todoist_project_name,due_date&limit=10" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```

## Chiudere su Todoist
```bash
source /opt/openclaw.env
curl -sS -X POST "https://api.todoist.com/api/v1/tasks/${TODOIST_ID}/close" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN"
```

## Aggiornare Supabase
```bash
source /opt/openclaw.env
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/tasks?task_id=eq.{TASK_ID}" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"status": "completed", "completed_at": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}'
```

## Verifica
```bash
source /opt/openclaw.env
curl -sS "${SUPABASE_URL}/rest/v1/tasks?task_id=eq.{TASK_ID}&select=task_id,content,status,completed_at" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```

## Log
```bash
cat >> ops-log.md <<LOGEOF
- Todoist: completato "{CONTENT}" | id:{TODOIST_ID}
LOGEOF
```
