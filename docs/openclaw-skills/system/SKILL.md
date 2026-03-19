---
name: system
description: "System configuration, env management, Railway backend, and meta-skill structure"
version: 2.0.0
category: system
---

# skills/system.md

Obiettivo: gestire la parte "sistema" (config, env, servizi backend, restart) e la struttura delle skill condivise.

## 1) Meta skills (struttura)

### Dove vive cosa
- `SOUL.md`: identita' agente + indice competenze + link a skills
- `skills/<nome>/SKILL.md`: playbook operativo (cosa fa, input, output, procedure, mapping, esempi)
- `ops-log.md`: log cronologico delle operazioni effettuate (senza credenziali)

### Naming convention skill
Le skill usano prefissi per categoria:
- `crm-*`: CRM core (contacts, companies, enrichment, duplicates, contact-intelligence)
- `comm-*`: Comunicazione (email, whatsapp, introductions)
- `tasks-*`: Task e decisioni (todoist, decisions)
- `health-*`: Salute e fitness (peso, meal-planning, meal-logging, training-log)
- Senza prefisso: calendar, deals, notes, morning-briefing, preferences, planning, github-crm-frontend, system, troubleshooting-*

### Regole di scrittura
- Una skill deve essere eseguibile "a freddo": include prerequisiti, comandi/endpoint, esempi.
- YAML frontmatter obbligatorio: `name`, `description`, `version`, `category`
- Preferire liste e snippet pronti.
- Aggiornare subito la skill quando scopriamo nuovi campi/ID.

## 2) Railway Backend

### command-center-backend (Node.js)
- **URL**: `https://command-center-backend-production.up.railway.app`
- **Env var**: `COMMAND_CENTER_BACKEND_URL` (in /opt/openclaw.env)
- **No auth required** per le API calls
- **Health check**: `curl -sS "${COMMAND_CENTER_BACKEND_URL}/health"`

Servizi disponibili:
| Area | Endpoints | Descrizione |
|------|-----------|-------------|
| Email | POST /send, /reply, /forward, /archive | Invio/gestione email Fastmail |
| Email processing | POST /email/save-and-archive | Processa email da staging a production |
| WhatsApp | POST /whatsapp/send, /send-media, /create-group | Invio messaggi e gestione gruppi |
| WhatsApp | GET /whatsapp/status, /verify-numbers | Stato connessione e verifica numeri |
| Calendar | GET /google-calendar/events, /events/all, /calendars | Lettura calendari |
| Calendar | POST /google-calendar/create-event | Creazione eventi |
| Calendar | PUT /google-calendar/update-event/:id | Modifica eventi |
| Calendar | DELETE /google-calendar/delete-event/:id | Cancellazione eventi |
| Calendar | POST /calendar/extract-event | Estrai evento da testo email/WhatsApp |
| Todoist | GET/POST/PATCH/DELETE /todoist/tasks, /tasks/:id | CRUD tasks via proxy |
| Todoist | POST /todoist/tasks/:id/close, /reopen | Chiudi/riapri task |
| Notes | POST/PUT/DELETE /obsidian/notes | CRUD note Obsidian |
| Notes | GET /obsidian/status, /obsidian/note | Stato sync e lettura |
| Notes | GET/POST/PUT/DELETE /notes, /notes/:id | CRUD note Supabase |
| Notes | POST /notes/:id/link, DELETE /notes/:id/link | Link note a entita' |
| Agent | POST /agent/run-cleanup | Trigger pulizia duplicati |
| Sync | POST /sync | Trigger sync email manuale |

### crm-agent-service (Python/FastAPI)
- **URL**: `https://crm-agent-api-production.up.railway.app`
- **Env var**: `CRM_AGENT_URL` (in /opt/openclaw.env)
- Endpoints:
  - POST /whatsapp-webhook — ricezione webhook TimelinesAI
  - POST /extract-deal-from-email — estrazione deal da PDF
  - POST /analyze-email — analisi duplicati da email

### Verifica servizi
```bash
source /opt/openclaw.env
echo "=== Command Center ==="
curl -sS "${COMMAND_CENTER_BACKEND_URL}/health"
echo ""
echo "=== CRM Agent ==="
curl -sS "${CRM_AGENT_URL}/health" 2>/dev/null || echo "Agent service: no /health endpoint"
echo ""
echo "=== WhatsApp ==="
curl -sS "${COMMAND_CENTER_BACKEND_URL}/whatsapp/status"
```

## 3) Salvare env (segreti)

### Principio
- **Mai** salvare token/chiavi nel workspace.
- I segreti vanno in `/opt/openclaw.env`

### File env usato
`/opt/openclaw.env` contiene:
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_ANON_KEY`
- `TODOIST_API_TOKEN`
- `FASTMAIL_API_TOKEN`, `FASTMAIL_ACCOUNT_ID`, `FASTMAIL_FROM_EMAIL`
- `COMMAND_CENTER_BACKEND_URL`
- `CRM_AGENT_URL`
- `TIMELINES_API_KEY`
- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`
- `ANTHROPIC_API_KEY`

### Come aggiornare env
```bash
# Aggiungi/aggiorna variabile
sudo /usr/local/bin/openclaw-setenv VAR_NAME "valore"

# Elimina variabile
sudo /usr/local/bin/openclaw-setenv --delete VAR_NAME

# Riavvia gateway (necessario dopo modifiche env)
sudo /usr/local/bin/openclaw-setenv --restart
```

### Verifica rapida
```bash
source /opt/openclaw.env
echo $COMMAND_CENTER_BACKEND_URL   # non loggare/mai incollare valori sensibili in chat
```

## 4) Restart servizi

### OpenClaw Gateway
```bash
openclaw gateway status
openclaw gateway restart
```

### Via systemd
```bash
sudo systemctl status openclaw.service
sudo systemctl restart openclaw.service
```

## 5) Supabase
- **Project ID**: efazuvegwxouysfcgwja
- **Region**: eu-central-1
- **DB Host**: db.efazuvegwxouysfcgwja.supabase.co
- Accesso via REST API: `${SUPABASE_URL}/rest/v1/{table}`
- Headers: `apikey: $SUPABASE_KEY`, `Authorization: Bearer $SUPABASE_KEY`
