---
name: calendar
description: "Google Calendar operations: create, update, delete, search events"
version: 1.0.0
category: calendar
---

# skills/calendar.md

Obiettivo: consultare, creare, modificare e cancellare eventi su Google Calendar (Living with Intention e Agenda Management).

## Prerequisiti
- `source /opt/openclaw.env`
- Accesso Supabase per lettura rapida (staging)
- Backend Railway per CRUD su Google Calendar

## Architettura

```
Google Calendar "Living with Intention"
       |
   (sync 60s via Railway backend)
       v
command_center_inbox (type = 'calendar')
```

- Gli eventi vengono sincronizzati ogni 60s dal backend Railway in `command_center_inbox`
- Per lettura rapida: query Supabase
- Per create/update/delete: API backend Railway -> Google Calendar API

## Calendar IDs

| Calendario | ID | Uso |
|---|---|---|
| Living with Intention | `c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com` | Default, eventi personali |
| Agenda Management | `simone@cimminelli.com` | Calendario primario Google |

Il default (se non specifichi calendarId) e' **Living with Intention**.

## Backend Railway

Base URL: `https://command-center-backend-production.up.railway.app`

## 1) Consultare eventi (da Supabase — lettura rapida)

### Prossimi eventi (oggi e avanti)
```sql
SELECT id, event_uid, subject, date, event_end, event_location,
       from_name, to_recipients, body_text, is_all_day
FROM command_center_inbox
WHERE type = 'calendar'
  AND date >= NOW()
ORDER BY date ASC
LIMIT 20;
```

### Eventi di oggi
```sql
SELECT id, event_uid, subject, date, event_end, event_location,
       from_name, to_recipients, is_all_day
FROM command_center_inbox
WHERE type = 'calendar'
  AND date::date = CURRENT_DATE
ORDER BY date ASC;
```

### Eventi di una settimana specifica
```sql
SELECT id, event_uid, subject, date, event_end, event_location,
       from_name, to_recipients, is_all_day
FROM command_center_inbox
WHERE type = 'calendar'
  AND date >= '{DATA_INIZIO}'
  AND date < '{DATA_FINE}'
ORDER BY date ASC;
```

### Cercare eventi per keyword
```sql
SELECT id, event_uid, subject, date, event_end, event_location
FROM command_center_inbox
WHERE type = 'calendar'
  AND (subject ILIKE '%{KEYWORD}%' OR body_text ILIKE '%{KEYWORD}%' OR event_location ILIKE '%{KEYWORD}%')
ORDER BY date DESC;
```

### Eventi con un partecipante specifico
```sql
SELECT id, subject, date, event_end, event_location, to_recipients
FROM command_center_inbox
WHERE type = 'calendar'
  AND to_recipients::text ILIKE '%{NOME_O_EMAIL}%'
ORDER BY date DESC;
```

### Dettaglio partecipanti
Il campo `to_recipients` e' un JSON array con la struttura:
```json
[{"name": "...", "email": "...", "status": "ACCEPTED|NEEDSACTION|DECLINED|TENTATIVE", "self": false}]
```

## 2) Consultare eventi (da Google Calendar API — dati live)

**REGOLA**: Devi SEMPRE interrogare ENTRAMBI i calendari e unire i risultati, ordinandoli per orario.

### GET eventi in un range
```bash
source /opt/openclaw.env

# 1) Living with Intention (default)
curl -s "https://command-center-backend-production.up.railway.app/google-calendar/events?timeMin={START_ISO}&timeMax={END_ISO}"

# 2) Agenda Management
curl -s "https://command-center-backend-production.up.railway.app/google-calendar/events?timeMin={START_ISO}&timeMax={END_ISO}&calendarId=simone%40cimminelli.com"
```

**IMPORTANTE**:
- I parametri si chiamano `timeMin` e `timeMax` (NON start/end)
- Fai SEMPRE due chiamate (una per calendario) e unisci i risultati
- Ordina per orario di inizio

Parametri query string:
- `timeMin` — inizio range (ISO 8601, es. `2026-03-08T00:00:00Z`)
- `timeMax` — fine range (ISO 8601)
- `calendarId` — opzionale, default Living with Intention. Per Agenda Management: `simone%40cimminelli.com`

Risposta: `{"success": true, "events": [...]}`

Ogni evento ha: `id`, `summary`, `start`, `end`, `location`, `description`, `attendees`, `htmlLink`, `conferenceData`

### GET lista calendari
```bash
curl -s "https://command-center-backend-production.up.railway.app/google-calendar/calendars"
```

## 3) Creare eventi

### POST /google-calendar/create-event
```bash
source /opt/openclaw.env
curl -s -X POST "https://command-center-backend-production.up.railway.app/google-calendar/create-event" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "{TITOLO}",
    "startDate": "{START_ISO}",
    "endDate": "{END_ISO}",
    "description": "{DESCRIZIONE}",
    "location": "{LUOGO}",
    "attendees": ["{email1}", "{email2}"],
    "calendarId": "opzionale — default Living with Intention"
  }'
```

Risposta successo:
```json
{"success": true, "event": {"id": "...", "htmlLink": "...", "title": "...", "startDate": "...", "endDate": "..."}, "invitesSent": false}
```

### Parametri
| Parametro | Obbligatorio | Note |
|---|---|---|
| title | Si | Titolo evento |
| startDate | Si | ISO 8601 (es. `2026-03-10T14:00:00Z`) |
| endDate | Si | ISO 8601 |
| description | No | Descrizione/note |
| location | No | Luogo fisico o link |
| attendees | No | Array di email |
| calendarId | No | Default: Living with Intention |

### Evento all-day
Per eventi tutto il giorno, usare formato data senza ora:
```json
{"startDate": "2026-03-10", "endDate": "2026-03-11"}
```

## 4) Modificare eventi

### PUT /google-calendar/update-event/:eventId
```bash
curl -s -X PUT "https://command-center-backend-production.up.railway.app/google-calendar/update-event/{EVENT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "{NUOVO_TITOLO}",
    "startDate": "{NUOVO_START_ISO}",
    "endDate": "{NUOVO_END_ISO}",
    "description": "{NUOVA_DESCRIZIONE}",
    "location": "{NUOVO_LUOGO}",
    "calendarId": "opzionale"
  }'
```

**IMPORTANTE**: L'`eventId` e' il campo `id` dalla risposta Google Calendar API (es. `uiv4rlhsc73u1t9u161r56flfg`), NON l'`event_uid` di Supabase.

Per trovare l'eventId di un evento esistente:
1. Cerca in Supabase per avere il `event_uid`
2. Usa GET `/google-calendar/events` per trovare l'`id` Google

## 5) Cancellare eventi

### DELETE /google-calendar/delete-event/:eventId
```bash
curl -s -X DELETE "https://command-center-backend-production.up.railway.app/google-calendar/delete-event/{EVENT_ID}?calendarId={OPTIONAL}"
```

Risposta: `{"success": true, "eventId": "..."}`

## 6) Tabella calendar_dismissed

Eventi che l'utente ha dismissato dal CRM (non vengono ri-sincronizzati):

```sql
SELECT event_uid, subject, dismissed_at
FROM calendar_dismissed
ORDER BY dismissed_at DESC;
```

## Schema reference

### command_center_inbox (eventi calendar)
| Campo | Tipo | Note |
|-------|------|------|
| id | UUID PK | ID Supabase |
| type | TEXT | Sempre 'calendar' |
| event_uid | TEXT | ID evento Google Calendar (dedup key) |
| subject | TEXT | Titolo evento |
| body_text | TEXT | Descrizione |
| date | TIMESTAMPTZ | Inizio evento |
| event_end | TIMESTAMPTZ | Fine evento |
| event_location | TEXT | Luogo |
| from_name | TEXT | Organizer (es. "Living with intention") |
| from_email | TEXT | Email organizer |
| to_recipients | JSONB | Attendees `[{name, email, status, self}]` |
| etag | TEXT | Change detection Google |
| sequence | INTEGER | Versione evento |
| is_all_day | BOOLEAN | Evento tutto il giorno |
| event_status | TEXT | Status evento |
| recurrence_rule | TEXT | RRULE per eventi ricorrenti |
| status | TEXT | Status nel CRM |

### calendar_dismissed
| Campo | Tipo | Note |
|-------|------|------|
| id | UUID PK | |
| event_uid | TEXT | Riferimento evento |
| subject | TEXT | |
| dismissed_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

## Flusso operativo

### Consultare
1. Per check rapido → query Supabase (dati gia' sincronizzati)
2. Per dati live/aggiornati al secondo → GET backend Railway

### Creare
1. Raccogliere: titolo, data/ora inizio e fine, luogo (opzionale), partecipanti (opzionale)
2. POST `/google-calendar/create-event`
3. Confermare con link Google Calendar

### Modificare
1. Trovare l'evento (query Supabase o GET API)
2. Ottenere l'eventId Google
3. PUT `/google-calendar/update-event/:eventId`

### Cancellare
1. Confermare con l'utente prima di cancellare
2. DELETE `/google-calendar/delete-event/:eventId`

## Timezone
- Simone vive a Londra: timezone = `Europe/London`
- Gli eventi in Supabase hanno date in UTC
- DEVI SEMPRE passare `"timezone": "Europe/London"` quando crei/modifichi eventi
- Quando l.utente dice "domani alle 10", intende 10:00 Europe/London

## Log operativo
Ogni azione su calendar deve finire in `ops-log.md`:
- timestamp
- azione (consulta, crea, modifica, cancella)
- dettaglio evento
- risultato

## 7) Estrarre evento da testo (email/WhatsApp)

### POST /calendar/extract-event
Estrae informazioni evento da un testo libero (es. email, messaggio WhatsApp) e propone la creazione.

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/calendar/extract-event" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "{TESTO_EMAIL_O_WHATSAPP}",
    "context": "{CONTESTO_OPZIONALE}"
  }'
```

Risposta: evento proposto con titolo, data/ora, luogo, partecipanti estratti dal testo.

### POST /calendar/import-invitation
Importa un invito calendario (ICS) ricevuto via email.

```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/calendar/import-invitation" \
  -H "Content-Type: application/json" \
  -d '{
    "icsContent": "{ICS_CONTENT}",
    "calendarId": "opzionale"
  }'
```

## 8) Query multi-calendario in una sola chiamata

### GET /google-calendar/events/all
Interroga TUTTI i calendari in una sola chiamata (evita di fare 2 GET separati).

```bash
source /opt/openclaw.env
curl -sS "${COMMAND_CENTER_BACKEND_URL}/google-calendar/events/all?timeMin={START_ISO}&timeMax={END_ISO}"
```

Risposta: eventi da tutti i calendari, gia' uniti e ordinati per data.

### GET /google-calendar/status
Verifica stato sync calendario.

```bash
curl -sS "${COMMAND_CENTER_BACKEND_URL}/google-calendar/status"
```

### POST /google-calendar/sync
Trigger sync manuale.

```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/google-calendar/sync"
```
