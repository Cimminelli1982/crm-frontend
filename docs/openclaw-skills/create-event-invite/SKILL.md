---
name: create-event-invite
description: Create a calendar event and invite guests. Handles School and Bath time overlaps.
version: 1.1.0
category: calendar
nativeSkills: auto
---

# Create event (invite guests)

## Obiettivo
Creare un evento nel Google Calendar di Simone E invitare i partecipanti. Gestire overlap con eventi speciali (School, Bath time).

## Input atteso
Il messaggio contiene:
- Titolo evento
- Data (o gia' estratta dal contesto email)
- Ora inizio e fine
- Location (opzionale) — puo' essere "Google Meet", un indirizzo, o altro
- Partecipanti (nomi o email)
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
- **Location** (opzionale) — vedi Step 4 per come gestire Google Meet
- **Partecipanti** (obbligatorio — nomi o email)
- **Descrizione** (opzionale)

Se mancano campi obbligatori, chiedi a Simone TUTTO in un solo messaggio.

## Step 2: Risolvi email partecipanti

Se hai solo nomi, cerca le email nel CRM:

    SELECT c.first_name, c.last_name, ce.email
    FROM contacts c
    JOIN contact_emails ce ON c.contact_id = ce.contact_id
    WHERE (c.first_name ILIKE '%nome%' OR c.last_name ILIKE '%cognome%')
    AND ce.is_primary = true

Se non trovi l'email di un partecipante, chiedi a Simone.

## Step 3: Controlla overlap

Fetch eventi del giorno:

    RAILWAY_URL="https://command-center-backend-production.up.railway.app"
    CAL_IDS="c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com,simone@cimminelli.com"

    curl -sS "${RAILWAY_URL}/google-calendar/events/all?timeMin=${DATE}T00:00:00Z&timeMax=${DATE}T23:59:59Z&calendarIds=${CAL_IDS}"

### Regola speciale: School
"School" e' il nome che Simone usa per le ore di lavoro/focus. Ha flessibilita'.
Se il nuovo evento fa overlap con School:
- Proponi di accorciare School a **15 minuti prima** del nuovo evento
- Esempio: School 09:30-13:30, nuovo evento alle 12:30 → "Accorcio School a 09:30-12:15?"
- Se Simone conferma, aggiorna School:

      curl -sS -X PUT "${RAILWAY_URL}/google-calendar/update-event/<eventId>" \
        -H "Content-Type: application/json" \
        -d '{"calendarId":"<calendarId>","sendUpdates":"none","end":{"dateTime":"2026-04-16T12:15:00","timeZone":"Europe/London"}}'

### Regola speciale: Bath time
"Bath time" e' il bagnetto serale con le figlie di Simone.
Se il nuovo evento fa overlap con Bath time:
- Chiedi a Simone: "Bath time overlap — informo Katherine e cancello Bath time?"
- Se si':
  1. Aggiungi katherine.manson@frostrow.com alla lista attendees del nuovo evento
  2. Cancella Bath time:

         curl -sS -X DELETE "${RAILWAY_URL}/google-calendar/delete-event/<eventId>?sendUpdates=none&calendarId=<calendarId>"

### Altri overlap
Per qualsiasi altro overlap: segnalalo ma crea comunque l'evento. Simone gestira'.

## Step 4: Crea evento con inviti

### IMPORTANTE: Google Meet vs Location

Se Simone chiede "Google Meet" (o "video call", "meet link", "call online"):
- Usa il parametro **"useGoogleMeet": true** nel JSON
- NON mettere "Google Meet" nel campo location
- Il backend crea automaticamente un link Google Meet reale nell'invito

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
        "attendees": [
          {"email": "partecipante1@example.com"},
          {"email": "partecipante2@example.com"}
        ],
        "sendUpdates": "all",
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
        "attendees": [
          {"email": "partecipante1@example.com"}
        ],
        "sendUpdates": "all",
        "calendarId": "c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com"
      }'

IMPORTANTE: sendUpdates "all" per inviare gli inviti ai partecipanti.

## Step 5: Conferma

Rispondi in modo conciso:

    Creato: Titolo evento — 12:30-14:00, 16 aprile
    Invitati: Marco Rossi, Anna Bianchi
    Location: Google Meet (link nell'invito)
    (School accorciata a 09:30-12:15)

## Regole
- Timezone: Europe/London
- Calendario: Living with intention (default)
- NON fare domande una alla volta. Se mancano piu' cose, chiedi tutto insieme.
- Se Simone dice "aggiungili anche se ci sono overlap", non chiedere conferma sugli overlap generici, crea direttamente.
- NON postare su Slack. Fai tutto tu.
