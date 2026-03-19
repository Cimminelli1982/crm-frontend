---
name: accept-invitation
description: "Accept a Google Calendar invitation and save meeting to Supabase CRM"
version: 1.0.0-cowork
category: calendar
platform: cowork
---

# /accept-invitation (Cowork)

## Flusso

1. Parsa il contesto: email subject, calendar event, partecipanti
2. Cerca l'evento su Google Calendar
3. RSVP "accepted" via gcal MCP
4. Salva il meeting in Supabase
5. Collega i partecipanti
6. Verifica e conferma

## 1) Trovare l'evento Google Calendar

Usa `gcal_list_events` per cercare l'evento per keyword dal subject:

```
gcal_list_events(
  q: "{KEYWORD_DAL_SUBJECT}",
  timeMin: "{NOW_ISO}",
  timeMax: "{60_GIORNI_ISO}",
  timeZone: "Europe/London"
)
```

Dall'email subject estrai il titolo dell'evento (rimuovi prefissi come "Invitation:", "Accepted:", "Updated:").

Salva: `EVENT_ID` dall'evento trovato.

## 2) RSVP su Google Calendar

```
gcal_respond_to_event(
  eventId: "{EVENT_ID}",
  response: "accepted"
)
```

## 3) Salvare meeting in Supabase

```sql
-- via supabase execute_sql
INSERT INTO meetings (meeting_name, meeting_date, description, meeting_status, google_meeting_id, created_by)
VALUES ('{TITOLO}', '{YYYY-MM-DDTHH:MM:SSZ}', '{DESCRIZIONE}', 'Scheduled', '{EVENT_ID}', 'LLM')
RETURNING meeting_id;
```

Salva il `meeting_id` dalla risposta.

## 4) Collegare partecipanti

Per ogni email dei partecipanti (escluso simone@cimminelli.com):

```sql
-- Cerca contatto per email
SELECT ce.contact_id FROM contact_emails ce WHERE ce.email = '{EMAIL}';

-- Se trovato, collega al meeting
INSERT INTO meeting_contacts (meeting_id, contact_id)
VALUES ('{MEETING_ID}', '{CONTACT_ID}');
```

## 5) Verifica obbligatoria

```sql
-- Meeting creato
SELECT meeting_id, meeting_name, meeting_date, meeting_status
FROM meetings WHERE meeting_id = '{MEETING_ID}';

-- Partecipanti collegati
SELECT mc.contact_id, c.first_name, c.last_name
FROM meeting_contacts mc
JOIN contacts c ON mc.contact_id = c.contact_id
WHERE mc.meeting_id = '{MEETING_ID}';
```

## 6) Risposta

Formato: "Accettato: {titolo} | {data ora} | Partecipanti: {nomi}"

Se qualche step fallisce, riporta esattamente quale e l'errore.
