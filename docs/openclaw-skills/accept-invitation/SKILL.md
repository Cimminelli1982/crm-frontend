---
name: accept-invitation
description: "Accept a Google Calendar invitation and save meeting to Supabase"
version: 3.0.0
category: calendar
---

# /accept-invitation

## Flusso

1. Parsa il contesto: email subject, calendar event, partecipanti
2. Cerca l'evento su Google Calendar per ricavare l'eventId
3. RSVP "accepted" via Railway backend
4. Salva il meeting in Supabase
5. Collega i partecipanti
6. Verifica e conferma

**NOTA:** L'archiviazione del calendario e' gestita dal frontend dopo il completamento del comando (bottone "Archive" nel chat).

## 1) Trovare l'evento Google Calendar

Cerca eventi recenti per matchare il subject dell'email con il titolo dell'evento:

```bash
source /opt/openclaw.env

# Cerca eventi nei prossimi 60 giorni
curl -sS "${COMMAND_CENTER_BACKEND_URL}/google-calendar/events/all?timeMin=$(date -u +%Y-%m-%dT%H:%M:%SZ)&timeMax=$(date -u -d '+60 days' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+60d +%Y-%m-%dT%H:%M:%SZ)" | jq '.events[] | select(.summary | test("{KEYWORD}"; "i")) | {id, summary, start, end, attendees}'
```

Dall'email subject estrai il titolo dell'evento (rimuovi prefissi come "Invitation:", "Accepted:", "Updated:") e cerca per keyword.

Salva: `EVENT_ID`, `CALENDAR_ID` (dal campo `organizer.email` dell'evento).

## 2) RSVP su Google Calendar

```bash
source /opt/openclaw.env

curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/google-calendar/respond-to-event" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "{EVENT_ID}",
    "status": "accepted"
  }'
```

Se conosci il calendarId specifico, passalo per velocizzare:
```json
{
  "eventId": "{EVENT_ID}",
  "calendarId": "{CALENDAR_ID}",
  "status": "accepted"
}
```

Verifica che la risposta sia `{ "success": true }`. Se 404: l'evento non esiste. Se 400: Simone non e' tra gli attendees.

## 3) Salvare meeting in Supabase

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/meetings" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{
    "meeting_name": "{TITOLO}",
    "meeting_date": "{YYYY-MM-DDTHH:MM:SSZ}",
    "description": "{DESCRIZIONE}",
    "meeting_status": "Scheduled",
    "google_meeting_id": "{EVENT_ID}",
    "created_by": "LLM"
  }'
```

Salva il `meeting_id` dalla risposta.

## 4) Collegare partecipanti

Per ogni email dei partecipanti (escluso simone@cimminelli.com):

```bash
source /opt/openclaw.env

# Cerca contatto per email
CONTACT_ID=$(curl -sS "${SUPABASE_URL}/rest/v1/contact_emails?email=eq.{EMAIL}&select=contact_id" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].contact_id')

# Se trovato, collega al meeting
if [ "$CONTACT_ID" != "null" ] && [ -n "$CONTACT_ID" ]; then
  curl -sS -X POST "${SUPABASE_URL}/rest/v1/meeting_contacts" \
    -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"meeting_id\": \"{MEETING_ID}\", \"contact_id\": \"$CONTACT_ID\"}"
fi
```

## 5) Verifica obbligatoria

```bash
source /opt/openclaw.env

# Meeting creato
curl -sS "${SUPABASE_URL}/rest/v1/meetings?meeting_id=eq.{MEETING_ID}&select=meeting_id,meeting_name,meeting_date,meeting_status" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Partecipanti collegati
curl -sS "${SUPABASE_URL}/rest/v1/meeting_contacts?meeting_id=eq.{MEETING_ID}&select=contact_id,contacts(first_name,last_name)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 6) Risposta

Formato: "Accettato: {titolo} | {data ora} | Partecipanti: {nomi}"

Se qualche step fallisce, riporta esattamente quale e l'errore. NON dire che ha funzionato se non ha funzionato.

## Log

```bash
cat >> ops-log.md <<LOGEOF
- Calendar: accettato "{TITOLO}" | {DATA} | meeting_id:{MEETING_ID} | partecipanti:{N}
LOGEOF
```
