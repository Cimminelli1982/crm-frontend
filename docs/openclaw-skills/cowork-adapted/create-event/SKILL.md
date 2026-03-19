---
name: create-event
description: "Create a calendar event with or without guests. Handles School and Bath time overlaps."
version: 1.0.0-cowork
category: calendar
platform: cowork
---

# /create-event (Cowork)

## Obiettivo
Creare un evento nel Google Calendar di Simone. Gestire overlap con eventi speciali (School, Bath time).

## Timezone
`Europe/London` — SEMPRE.

## Calendar IDs
| Calendario | ID |
|---|---|
| Living with Intention (default) | `c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com` |
| Agenda Management | `simone@cimminelli.com` |

## Input atteso
- Titolo (obbligatorio)
- Data (obbligatorio)
- Ora inizio e fine (obbligatorio)
- Location (opzionale)
- Partecipanti (opzionale — nomi o email)
- Descrizione (opzionale)

Se mancano campi obbligatori, chiedi TUTTO in un solo messaggio.

## Step 1: Risolvi email partecipanti (se presenti)

Se hai solo nomi, cerca le email nel CRM:

```sql
-- via supabase execute_sql
SELECT c.first_name, c.last_name, ce.email
FROM contacts c
JOIN contact_emails ce ON c.contact_id = ce.contact_id
WHERE (c.first_name ILIKE '%{NOME}%' OR c.last_name ILIKE '%{COGNOME}%')
AND ce.is_primary = true;
```

## Step 2: Controlla overlap

Fetch eventi del giorno da entrambi i calendari (2 chiamate parallele):

```
gcal_list_events(
  calendarId: "c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com",
  timeMin: "{DATE}T00:00:00",
  timeMax: "{DATE}T23:59:59",
  timeZone: "Europe/London"
)

gcal_list_events(
  calendarId: "simone@cimminelli.com",
  timeMin: "{DATE}T00:00:00",
  timeMax: "{DATE}T23:59:59",
  timeZone: "Europe/London"
)
```

### Regola speciale: School
"School" = ore di lavoro/focus. Ha flessibilita'.
Se overlap con School:
- Proponi di accorciare School a **15 minuti prima** del nuovo evento
- Se Simone conferma, aggiorna:

```
gcal_update_event(
  calendarId: "{CALENDAR_ID_DELLO_SCHOOL}",
  eventId: "{SCHOOL_EVENT_ID}",
  event: { end: { dateTime: "{NUOVA_FINE_ISO}", timeZone: "Europe/London" } },
  sendUpdates: "none"
)
```

### Regola speciale: Bath time
"Bath time" = bagnetto serale con le figlie.
Se overlap con Bath time:
- Chiedi: "Bath time overlap — informo Katherine e cancello Bath time?"
- Se si':
  1. Aggiungi katherine.manson@frostrow.com agli attendees del nuovo evento
  2. Cancella Bath time: `gcal_delete_event(calendarId: "...", eventId: "...")`

### Altri overlap
Segnalali ma crea comunque l'evento.

## Step 3: Crea evento

### Senza partecipanti (evento personale)

```
gcal_create_event(
  calendarId: "c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com",
  event: {
    summary: "{TITOLO}",
    start: { dateTime: "{START_ISO}", timeZone: "Europe/London" },
    end: { dateTime: "{END_ISO}", timeZone: "Europe/London" },
    location: "{LUOGO}",  // se presente
    description: "{DESCRIZIONE}"  // se presente
  },
  sendUpdates: "none"
)
```

### Con partecipanti (inviti)

```
gcal_create_event(
  calendarId: "c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com",
  event: {
    summary: "{TITOLO}",
    start: { dateTime: "{START_ISO}", timeZone: "Europe/London" },
    end: { dateTime: "{END_ISO}", timeZone: "Europe/London" },
    location: "{LUOGO}",
    attendees: [
      { email: "simone@cimminelli.com", organizer: true },
      { email: "{GUEST_EMAIL}" }
    ],
    conferenceData: {  // solo se chiede Google Meet
      createRequest: {
        conferenceSolutionKey: { type: "hangoutsMeet" },
        requestId: "meet-{TIMESTAMP}"
      }
    }
  },
  sendUpdates: "all"
)
```

### Google Meet
Se Simone chiede "Google Meet" / "video call" / "meet link":
- Usa il campo `conferenceData` come sopra
- NON mettere "Google Meet" nel campo location

## Step 4: Conferma

Formato conciso:
```
Creato: {Titolo} — {HH:MM}-{HH:MM}, {data}
```

Se Google Meet: aggiungere "Google Meet link nell'evento"

## Regole
- NON fare domande una alla volta. Se mancano piu' cose, chiedi tutto insieme.
- Calendario default: Living with Intention
- Se Simone dice "aggiungili anche se ci sono overlap", non chiedere conferma
