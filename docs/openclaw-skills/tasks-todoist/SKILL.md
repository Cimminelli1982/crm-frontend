---
name: tasks-todoist
description: "Task management via Todoist API with Supabase sync"
version: 2.0.0
category: tasks
---

# skills/tasks.md

Obiettivo: gestire le tasks (consultazione, organizzazione) e garantire che la sync Supabase ↔ Todoist sia operativa.

## 0) Prerequisiti
- Variabili env caricate: `source /opt/openclaw.env`
- Accesso Supabase via REST: `SUPABASE_URL`, `SUPABASE_KEY`
- Accesso Todoist via API: `TODOIST_API_TOKEN` (salvato in env, non nel workspace)
- (Sync) capire **dove** vive la sync (script/cron/webhook) e quali tabelle Supabase sono coinvolte.

## Todoist mapping (stabile)
- Default progetto: Inbox (se non specificato). **Ma chiedere sempre**: è meglio non lasciarle in Inbox perché poi va spostata.

### Progetti
- Inbox → project_id: 6VhG9MrQwJwqJJfW
- Work → project_id: 6VqRM39cGMjV8pP7
  - Sections:
    - This Week → section_id: 6fm2MrvGJPv5r4Pf
    - Next Week → section_id: 6fm2MrvG7V3qHw97
    - This Month → section_id: 6fm2MrwHRg8JJpC7
    - This Sprint → section_id: 6fm2MrvRgWjGFX6f
    - This Year → section_id: 6fm2Mrw8cx9chJ57
    - Next Year → section_id: 6fm2MrrmRGHQ4Rwf
    - Someday → section_id: 6fm2Mrw24Q24r2Jf
- Personal → project_id: 6VmX2Jv6wGG8W8V5
  - Sections:
    - This Week → section_id: 6fm2Mrvv4vXpwg45
    - Next Week → section_id: 6fm2Mrw6gxMWfRqX
    - This Month → section_id: 6fm2MrwCP5qXCX4X
    - This Sprint → section_id: 6fm2Mrw9J8Rc9wm5
    - This Year → section_id: 6fm2Mrw9hcq8cF3X
    - Next Year → section_id: 6fm2Mrwxpg3x3Rv5
    - Someday → section_id: 6fm2MrwW5vVXmMH5
- Team → project_id: 6fp9mp2F253X67f8
  - Sections:
    - Clarissa → section_id: 6g2F7V62h2rVmJ78
    - Katherine → section_id: 6fr2fCwgQWfGRq2g
    - Kevin → section_id: 6g2F7VmGmhR74vWg
    - Rosaria → section_id: 6fp9p56fMqXw9CHg
- Birthdays 🎂 → project_id: 6crr237qxV93wV9q
  - Sections (principali):
    - Family → section_id: 6crr336CXFRJrR8H
    - London → section_id: 6crr2wfxG9HXFCvq
    - Milano → section_id: 6cvmVXpw53jmFxVq
    - Torino → section_id: 6crr2qJvr455GG8q
    - SIS → section_id: 6crr3qfMfCMWRrmH
    - Venture Capital → section_id: 6crr3235GHcmvhgH
    - (anche This Week/Next Week/This Month/This Year/Next Year/Someday)
- Aborted → non trovato via API (probabile archiviato/deleted)

## 1) Consultare tasks aperti
### Input
- filtro: progetto (nome o project_id), status, due_date, keyword

### Output
- lista breve: `task_id`, `content`, `status`, `due_date`, `todoist_project_name`, `updated_at`, `synced_at`

### Query/Endpoint (Supabase)
- Open tasks (default: Inbox):
  - GET `${SUPABASE_URL}/rest/v1/tasks?select=task_id,content,status,due_date,priority,todoist_project_name,updated_at,synced_at&status=eq.open&todoist_project_name=eq.Inbox&order=due_date.asc.nullslast&limit=50`
- Open tasks (tutti i progetti):
  - GET `${SUPABASE_URL}/rest/v1/tasks?select=task_id,content,status,due_date,priority,todoist_project_name,updated_at,synced_at&status=eq.open&order=due_date.asc.nullslast&limit=50`

## 2) Creare task (Todoist)

### Dati richiesti (raccolta)
- progetto
- sezione (se pertinente)
- due date (opzionale)
- descrizione (opzionale)
- priority (opzionale)

### Flusso obbligatorio (NUOVA REGOLA)
Dopo che ho **tutti i dati**, il flusso è **sempre**:
1) Eseguire il blocco unico **curl + log** (1 sola tool call)
2) Rispondere in chat con conferma creazione

**STOP:** non fare query su Supabase per verificare la sync. Non cercare endpoint RPC. Non controllare se il task è arrivato in Supabase. La verifica sync è un’operazione separata e si fa solo se Simone la chiede esplicitamente.

### Endpoint (Todoist)
- POST `https://api.todoist.com/api/v1/tasks`
  - headers: `Authorization: Bearer $TODOIST_API_TOKEN`, `Content-Type: application/json`
  - payload: `content`, `project_id`, `section_id` (opz), `due_string`/`due_date` (opz), `priority` (opz), `description` (opz)

#### Template unico (curl + log) — 1 tool call
```bash
source /opt/openclaw.env

# valorizzare queste variabili prima di eseguire
# CONTENT, PROJECT, SECTION, DUE, PRIORITY
# e nel JSON: PROJECT_ID, SECTION_ID (opz), DUE_STRING (opz), DESCRIPTION (opz)

RESP=$(curl -sS -X POST "https://api.todoist.com/api/v1/tasks" \
  -H "Authorization: Bearer $TODOIST_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "{CONTENT}",
    "project_id": "{PROJECT_ID}",
    "section_id": "{SECTION_ID}",
    "due_string": "{DUE_STRING}",
    "priority": {PRIORITY},
    "description": "{DESCRIPTION}"
  }')

TASK_ID=$(echo "$RESP" | jq -r '.id')

cat >> ops-log.md <<EOF
- Todoist: creato "{CONTENT}" | {PROJECT}/{SECTION} | due:{DUE} | p:{PRIORITY} | id:$TASK_ID
EOF

echo "OK id=$TASK_ID"
```
Note:
- Se un campo opzionale non c’è, **rimuovilo** dal JSON (non mettere stringhe vuote).
- `PRIORITY` in Todoist è 1–4.
- Logging: usare sempre heredoc come sopra (niente `printf`).

## 3) Organizzare tasks
### Operazioni tipiche
- cambiare status (open/closed)
- cambiare progetto/section/priority (se presenti)
- aggiornare contenuto, due_date, labels/tags

### Regole
- preferire operazioni atomiche (1 update per volta) e loggare prima/dopo

### Endpoint (placeholder)
- PATCH `${SUPABASE_URL}/rest/v1/tasks?task_id=eq.{id}` con payload JSON

## 3) Sync Supabase ↔ Todoist (health + fix)
### Healthcheck (minimo)
- verificare che esistano aggiornamenti recenti su `tasks.last_modified_at`
- verificare che i task Todoist creati/chiusi compaiano in Supabase (lag accettabile da definire)

### Diagnosi rapida
- dov’è il job? (cron, worker, webhook)
- dove logga? (file, tabella, stdout)
- quali credenziali usa (env)

### Fix playbook (placeholder)
- restart del job/servizio
- re-run di una sync full (se esiste)
- verifiche post-fix: conteggi, ultimi N task, mismatch

## 4) Log operativo
Ogni azione su tasks deve finire in `ops-log.md`:
- timestamp
- azione
- query/endpoint
- risultato (count + primi item)

## 5) Todoist via Railway proxy (alternativa)

Il backend Railway offre un proxy per le operazioni Todoist. Utile se l'API diretta ha problemi.

### Lista tasks
```bash
source /opt/openclaw.env
curl -sS "${COMMAND_CENTER_BACKEND_URL}/todoist/tasks"
# Con filtri:
curl -sS "${COMMAND_CENTER_BACKEND_URL}/todoist/tasks?project_id={PROJECT_ID}&section_id={SECTION_ID}"
```

### Dettaglio task
```bash
curl -sS "${COMMAND_CENTER_BACKEND_URL}/todoist/tasks/{TASK_ID}"
```

### Creare task
```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/todoist/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "{CONTENT}",
    "project_id": "{PROJECT_ID}",
    "section_id": "{SECTION_ID}",
    "due_string": "{DUE}",
    "priority": {PRIORITY},
    "description": "{DESC}"
  }'
```

### Aggiornare task
```bash
curl -sS -X PATCH "${COMMAND_CENTER_BACKEND_URL}/todoist/tasks/{TASK_ID}" \
  -H "Content-Type: application/json" \
  -d '{"content": "{NUOVO_CONTENT}", "due_string": "{NUOVA_DUE}"}'
```

### Chiudere task
```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/todoist/tasks/{TASK_ID}/close"
```

### Riaprire task
```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/todoist/tasks/{TASK_ID}/reopen"
```

### Cancellare task
```bash
curl -sS -X DELETE "${COMMAND_CENTER_BACKEND_URL}/todoist/tasks/{TASK_ID}"
```

### Progetti e sezioni
```bash
curl -sS "${COMMAND_CENTER_BACKEND_URL}/todoist/projects"
curl -sS "${COMMAND_CENTER_BACKEND_URL}/todoist/sections?project_id={PROJECT_ID}"
```

### Trigger sync Supabase ↔ Todoist
```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/todoist/sync"
```

## 6) Associare task a contatti/companies/deals (Supabase)

Le task possono essere associate a contatti, aziende e deals tramite junction tables in Supabase.

### Junction tables
- `task_contacts` — colonne: `id` (uuid PK), `task_id` (uuid FK → tasks), `contact_id` (uuid FK → contacts), `created_at`
- `task_companies` — colonne: `id` (uuid PK), `task_id` (uuid FK → tasks), `company_id` (uuid FK → companies), `created_at`
- `task_deals` — colonne: `id` (uuid PK), `task_id` (uuid FK → tasks), `deal_id` (uuid FK → deals), `created_at`

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

### Listare task associate a un contatto
```bash
source /opt/openclaw.env
# 1. Get task_ids for contact
TASK_IDS=$(curl -sS "${SUPABASE_URL}/rest/v1/task_contacts?contact_id=eq.{CONTACT_ID}&select=task_id" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}" | jq -r '.[].task_id' | paste -sd, -)

# 2. Get task details
curl -sS "${SUPABASE_URL}/rest/v1/tasks?task_id=in.(${TASK_IDS})&select=task_id,content,status,due_date,priority,todoist_project_name&order=due_date.asc.nullslast" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### Rimuovere associazione
```bash
source /opt/openclaw.env
curl -sS -X DELETE "${SUPABASE_URL}/rest/v1/task_contacts?task_id=eq.{TASK_ID}&contact_id=eq.{CONTACT_ID}" \
  -H "apikey: ${SUPABASE_KEY}" -H "Authorization: Bearer ${SUPABASE_KEY}"
```

## 7) Flusso interattivo per /create-task

Quando Simone usa il comando /create-task dalla command palette:

1. **Parsa il contesto** — il frontend passa contact, email, deal, whatsapp se disponibili
2. **Chiedi SOLO quello che manca** — se dal contesto si capisce il titolo, non chiederlo. Chiedi sempre:
   - Progetto (Work/Personal/Team) se non ovvio
   - Sezione (This Week/Next Week/etc) se non ovvia
   - Due date se non specificata
   - Suggerisci associazioni probabili: "Vuoi associarla a [contatto X]? A un deal? A un'azienda?"
   - Priorita solo se non specificata (default: 1)
3. **Crea la task** — segui sezione 2 (curl Todoist + log)
4. **Associa** — segui sezione 6 per ogni associazione richiesta
5. **VERIFICA OBBLIGATORIA** — GET sulla task creata + GET sulle junction tables per confermare

## 8) Flusso per /associate-task

1. Simone specifica quale task (per nome) e a chi associarla
2. Cerca la task in Supabase per content (ILIKE)
3. Cerca il contatto/company/deal per nome
4. Crea l'associazione (sezione 6)
5. **VERIFICA OBBLIGATORIA** — GET per confermare

## 9) Flusso per /list-tasks

1. Prendi il contact_id dal contesto
2. Query task_contacts + tasks (sezione 6)
3. Mostra: titolo, scadenza, priorita, progetto, status
4. Se zero risultati, comunicalo

## 10) Flusso per /complete-task

1. Simone specifica quale task (per nome)
2. Cerca in tasks per content (ILIKE)
3. Chiudi su Todoist: POST /todoist/tasks/{todoist_id}/close (sezione 5)
4. Aggiorna Supabase: PATCH tasks set status=completed, completed_at=NOW
5. **VERIFICA OBBLIGATORIA** — GET per confermare
