---
name: morning-briefing
description: "Morning briefing generation with calendar, tasks, and metrics"
version: 1.0.0
category: planning
---

# skills/morning-briefing.md

## REGOLA ASSOLUTA
Questo file e' l'UNICA fonte per il morning briefing.
NON usare planning.md. NON improvvisare. NON aggiungere sezioni extra.
NON usare emoji. MAI.
Segui ESATTAMENTE i 3 step sotto. NIENTE ALTRO.

Le sezioni del messaggio sono SOLO queste 4, in questo ordine:
1. APPUNTAMENTI OGGI
2. TASKS DUE / OVERDUE
3. COMPLEANNI OGGI (solo se ce ne sono, altrimenti ometti)
4. THIS WEEK — open tasks (Personal poi Work)

Chiudi SEMPRE con la domanda sulle 3 priorita'.

## Prerequisiti
- `source /opt/openclaw.env`
- Slack channel: `C0AJQN48W15`

---

## Step 1 — Raccolta dati

Esegui queste 4 query.

### 1a) Calendario oggi — DUE chiamate (entrambi i calendari)

```bash
source /opt/openclaw.env
TODAY=$(date -u +%Y-%m-%dT00:00:00Z)
TOMORROW=$(date -u -d "+1 day" +%Y-%m-%dT00:00:00Z)
echo "=== Living with Intention ===" && curl -s "https://command-center-backend-production.up.railway.app/google-calendar/events?timeMin=${TODAY}&timeMax=${TOMORROW}" && echo "" && echo "=== Agenda Management ===" && curl -s "https://command-center-backend-production.up.railway.app/google-calendar/events?timeMin=${TODAY}&timeMax=${TOMORROW}&calendarId=simone%40cimminelli.com"
```

### 1b) Tasks due today + overdue (Todoist API)

IMPORTANTE: L'API Todoist v1 pagina a 50 risultati. Devi paginare con `cursor`.
Il filtro due date NON funziona server-side — devi filtrare client-side.
Escludi il progetto Birthdays (6crr237qxV93wV9q) da questa query.

```bash
source /opt/openclaw.env
python3 -c "
import requests, json
from datetime import date
headers = {'Authorization': 'Bearer $TODOIST_API_TOKEN'}
all_tasks = []
cursor = None
while True:
    url = 'https://api.todoist.com/api/v1/tasks'
    if cursor:
        url += f'?cursor={cursor}'
    r = requests.get(url, headers=headers)
    d = r.json()
    all_tasks.extend(d.get('results', []))
    cursor = d.get('next_cursor')
    if not cursor:
        break
today = str(date.today())
due = [t for t in all_tasks if t.get('due') and t['due'].get('date') and t['due']['date'] <= today and t['project_id'] != '6crr237qxV93wV9q']
for t in due:
    pid = t['project_id']
    pname = {'6VqRM39cGMjV8pP7':'Work','6VmX2Jv6wGG8W8V5':'Personal','6VhG9MrQwJwqJJfW':'Inbox','6fp9mp2F253X67f8':'Team'}.get(pid, pid)
    ov = ' -- overdue' if t['due']['date'] < today else ''
    print(f'{t[\"content\"]} ({pname}){ov}')
if not due:
    print('Nessuna task in scadenza.')
"
```

### 1c) Compleanni oggi (Todoist API)

IMPORTANTE: Stessa paginazione. Filtra progetto Birthdays (6crr237qxV93wV9q) e due.date = oggi.

```bash
source /opt/openclaw.env
python3 -c "
import requests, json
from datetime import date
headers = {'Authorization': 'Bearer $TODOIST_API_TOKEN'}
all_tasks = []
cursor = None
while True:
    url = 'https://api.todoist.com/api/v1/tasks?project_id=6crr237qxV93wV9q'
    if cursor:
        url += f'&cursor={cursor}'
    r = requests.get(url, headers=headers)
    d = r.json()
    all_tasks.extend(d.get('results', []))
    cursor = d.get('next_cursor')
    if not cursor:
        break
today = str(date.today())
bdays = [t for t in all_tasks if t.get('due') and t['due'].get('date') == today]
for t in bdays:
    print(t['content'])
"
```

### 1d) This Week — Personal e Work (Todoist API)

Due chiamate per section_id. L'API puo' paginare, gestisci il cursor.

```bash
source /opt/openclaw.env
python3 -c "
import requests, json
headers = {'Authorization': 'Bearer $TODOIST_API_TOKEN'}

def get_section(section_id):
    tasks = []
    cursor = None
    while True:
        url = f'https://api.todoist.com/api/v1/tasks?section_id={section_id}'
        if cursor:
            url += f'&cursor={cursor}'
        r = requests.get(url, headers=headers)
        d = r.json()
        tasks.extend(d.get('results', []))
        cursor = d.get('next_cursor')
        if not cursor:
            break
    return tasks

personal = get_section('6fm2Mrvv4vXpwg45')
work = get_section('6fm2MrvGJPv5r4Pf')

print('=== PERSONAL ===')
for t in personal:
    due = t.get('due',{}).get('date','') if t.get('due') else ''
    print(f'{t[\"content\"]}|{due}')
if not personal:
    print('Nessuna task Personal questa settimana.')

print('=== WORK ===')
for t in work:
    due = t.get('due',{}).get('date','') if t.get('due') else ''
    print(f'{t[\"content\"]}|{due}')
if not work:
    print('Nessuna task Work questa settimana.')
"
```

---

## Step 2 — Messaggio Slack

Componi il messaggio con ESATTAMENTE questo formato. NO emoji. NO sezioni extra.

```
Buongiorno Simone,

APPUNTAMENTI OGGI ({giorno della settimana in italiano} {giorno} {mese in italiano})
- {HH:MM} - {summary evento}
- {HH:MM} - {summary evento}

TASKS DUE / OVERDUE
- {content} ({todoist_project_name}) -- overdue
- {content} ({todoist_project_name})

COMPLEANNI OGGI
- {content}

THIS WEEK — PERSONAL
- {content} ({giorno abbreviato italiano} {numero giorno})

THIS WEEK — WORK
- {content} ({giorno abbreviato italiano} {numero giorno})

Quali sono le tue 3 priorita' per oggi?
```

### Regole di formattazione
- NO emoji, MAI, in nessuna sezione
- Orari: convertire da UTC a Europe/London, formato HH:MM
- Se APPUNTAMENTI e' vuota: scrivere "Nessun appuntamento oggi."
- Se TASKS DUE e' vuota: scrivere "Nessuna task in scadenza."
- Se task ha due_date < oggi: aggiungere "-- overdue" dopo il project name
- Se COMPLEANNI e' vuota: OMETTERE l'intera sezione (non scrivere niente)
- Se THIS WEEK PERSONAL e' vuota: scrivere "Nessuna task Personal questa settimana."
- Se THIS WEEK WORK e' vuota: scrivere "Nessuna task Work questa settimana."
- CHIUDERE SEMPRE con "Quali sono le tue 3 priorita' per oggi?"

---

## Step 3 — Salvataggio priorita' (dopo risposta di Simone)

Quando Simone risponde con le sue 3 priorita':

### 3a) Cancellare priorita' daily esistenti per oggi
```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/priorities?scope=eq.daily&scope_date=eq.$(date +%Y-%m-%d)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 3b) Inserire le 3 nuove priorita'
```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/priorities" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {"title": "{PRIORITA_1}", "scope": "daily", "scope_date": "'$(date +%Y-%m-%d)'", "sort_order": 0, "is_completed": false},
    {"title": "{PRIORITA_2}", "scope": "daily", "scope_date": "'$(date +%Y-%m-%d)'", "sort_order": 1, "is_completed": false},
    {"title": "{PRIORITA_3}", "scope": "daily", "scope_date": "'$(date +%Y-%m-%d)'", "sort_order": 2, "is_completed": false}
  ]'
```

### 3c) Confermare
Rispondi: "Salvate le tue 3 priorita' per oggi."
