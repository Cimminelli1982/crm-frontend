---
name: create-event
description: Create a calendar event without inviting guests. Handles School and Bath time overlaps.
version: 1.1.0
category: calendar
nativeSkills: auto
---

# Create event (no invite)

## Obiettivo
Creare un evento nel Google Calendar di Simone SENZA invitare partecipanti. Gestire overlap con eventi speciali (School, Bath time).

## Input atteso
Il messaggio contiene:
- Titolo evento
- Data (o gia' estratta dal contesto email)
- Ora inizio e fine
- Location (opzionale) — puo' essere "Google Meet", un indirizzo, o altro
- Email inbox ID (opzionale, per leggere dettagli dalla mail)

## Step 1: Estrai dettagli evento

Se c'e' un Email inbox ID, leggi la mail dal DB:

    SELECT subject, from_email, from_name, to_recipients, cc_recipients, body_text, date
    FROM command_center_inbox WHERE id = '<emailInboxId>'

Estrai dal messaggio di Simone e/o dalla mail:
- **Titolo** (obbligatorio)
- **Data** (obbligatorio)
- **Ora inizio** (obbligatorio)
- **Ora fine** (obbligatorio — se non specificata, chiedi)
- **Location** (opzionale) — vedi Step 3 per come gestire Google Meet
- **Descrizione** (opzionale)

Se mancano titolo, data o orario, chiedi a Simone. Chiedi TUTTO quello che manca in UN SOLO messaggio, non una domanda alla volta.

## Step 2: Controlla overlap

Fetch eventi del giorno:

    RAILWAY_URL="https://command-center-backend-production.up.railway.app"
    CAL_IDS="c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com,simone@cimminelli.com"

    curl -sS "${RAILWAY_URL}/google-calendar/events/all?timeMin=${DATE}T00:00:00Z&timeMax=${DATE}T23:59:59Z&calendarIds=${CAL_IDS}"

Controlla se il nuovo evento ha overlap con eventi esistenti.

### Regola speciale: School
"School" e' il nome che Simone usa per le ore di lavoro/focus. Ha flessibilita'.
Se il nuovo evento fa overlap con School:
- Proponi di accorciare School a **15 minuti prima** del nuovo evento
- Esempio: School 09:30-13:30, nuovo evento alle 12:30 → "Accorcio School a 09:30-12:15?"
- Se Simone conferma, aggiorna l'evento School con la nuova ora di fine

Per aggiornare School, serve il suo eventId e calendarId dalla risposta del fetch. Poi:

    curl -sS -X PUT "${RAILWAY_URL}/google-calendar/update-event/<eventId>" \
      -H "Content-Type: application/json" \
      -d '{"calendarId":"<calendarId>","sendUpdates":"none","end":{"dateTime":"2026-04-16T12:15:00","timeZone":"Europe/London"}}'

### Regola speciale: Bath time
"Bath time" e' il bagnetto serale con le figlie di Simone.
Se il nuovo evento fa overlap con Bath time:
- Chiedi a Simone: "Bath time overlap — informo Katherine e cancello Bath time?"
- Se si':
  1. Aggiungi katherine.manson@frostrow.com come attendee al NUOVO evento (cosi' e' informata che Simone e' fuori quella sera)
  2. Cancella l'evento Bath time

Per cancellare Bath time:

    curl -sS -X DELETE "${RAILWAY_URL}/google-calendar/delete-event/<eventId>?sendUpdates=none&calendarId=<calendarId>"

### Altri overlap
Per qualsiasi altro overlap: segnalalo ma crea comunque l'evento. Simone gestira'.

## Step 3: Crea evento

### IMPORTANTE: Google Meet vs Location

Se Simone chiede "Google Meet" (o "video call", "meet link", "call online"):
- Usa il parametro **"useGoogleMeet": true** nel JSON
- NON mettere "Google Meet" nel campo location
- Il backend crea automaticamente un link Google Meet reale nell'evento

Se Simone specifica un indirizzo fisico o altro:
- Usa il campo **"location"** normalmente

Esempio con Google Meet:

    curl -sS -X POST "${RAILWAY_URL}/google-calendar/create-event" \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Titolo evento",
        "startDate": "2026-04-16T12:30:00",
        "endDate": "2026-04-16T14:00:00",
        "timezone": "Europe/London",
        "useGoogleMeet": true,
        "calendarId": "c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com"
      }'

Esempio con location fisica:

    curl -sS -X POST "${RAILWAY_URL}/google-calendar/create-event" \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Titolo evento",
        "startDate": "2026-04-16T12:30:00",
        "endDate": "2026-04-16T14:00:00",
        "timezone": "Europe/London",
        "location": "Via Roma 1, Milano",
        "calendarId": "c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com"
      }'

IMPORTANTE: NON passare attendees. NON usare sendUpdates. Solo evento nel calendario "Living with intention".

## Step 4: Conferma

Rispondi in modo conciso:

    Creato: Titolo evento — 12:30-14:00, 16 aprile

oppure con Google Meet:

    Creato: Titolo evento — 12:30-14:00, 16 aprile
    Google Meet link nell'evento

## Regole
- Timezone: Europe/London
- Calendario: Living with intention (default)
- NON fare domande una alla volta. Se mancano piu' cose, chiedi tutto insieme.
- Se Simone dice "aggiungili anche se ci sono overlap", non chiedere conferma sugli overlap generici, crea direttamente.
- NON postare su Slack. Fai tutto tu.
