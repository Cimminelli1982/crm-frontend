---
name: what-in-calendar
description: Check what's in Simone's calendar for a specific day and assess availability for a proposed event
version: 1.0.0
category: calendar
nativeSkills: auto
---

# What's in my calendar

## Obiettivo
Quando Simone riceve un invito o proposta di meeting, mostrare cosa ha in calendario quel giorno e suggerire se ci sta.

## Input atteso
Il messaggio puo' contenere:
- **Event date**: data dell'evento proposto (es. "Mon Mar 10, 2026")
- **Event**: titolo dell'evento
- **Time**: orario proposto (es. "10:00 - 11:00")
- **Email inbox ID**: per leggere i dettagli completi dalla mail

## Step 1: Estrai dettagli evento

Se c'e' un Email inbox ID, leggi la mail dal DB:

    SELECT subject, from_email, from_name, to_recipients, cc_recipients, body_text, date
    FROM command_center_inbox WHERE id = '<emailInboxId>'

Dal subject o body, estrai:
- **Titolo** evento
- **Data** (se non esplicita, deduci dal contesto)
- **Ora inizio e fine** (se presenti)
- **Location** (se presente)
- **Partecipanti**

Se la data non e' esplicitata, usa oggi.

## Step 2: Fetch eventi del giorno

Chiama Railway per ottenere TUTTI gli eventi di quel giorno dai 2 calendari principali:

    RAILWAY_URL="https://command-center-backend-production.up.railway.app"
    DATE="2026-03-10"  # la data dell'evento
    TIME_MIN="${DATE}T00:00:00Z"
    TIME_MAX="${DATE}T23:59:59Z"
    CAL_IDS="c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com,simone@cimminelli.com"

    curl -sS "${RAILWAY_URL}/google-calendar/events/all?timeMin=${TIME_MIN}&timeMax=${TIME_MAX}&calendarIds=${CAL_IDS}"

## Step 3: Filtra e organizza

Dagli eventi ricevuti:
1. **Includi**: tutti gli eventi con orario (meetings, calls, etc.)
2. **Includi full-day events** MA escludi:
   - Eventi dal calendario Todoist (calendarId contiene "c_226cbbb37b26b95d")
   - Eventi con titolo che contiene "Birthday" o "Compleanno"
3. **Ordina** per ora di inizio

IMPORTANTE: salva TUTTI gli eventId e i rispettivi calendarId dalla risposta API. Ti serviranno per i follow-up (Step 6). Scrivi un file temporaneo per ricordarli:

    echo '<json con mapping titolo -> {eventId, calendarId, start, end}>' > /tmp/calendar-events-cache.json

## Step 4: Mostra il calendario del giorno

Includi SEMPRE un link a Google Calendar per quel giorno.
Formato link: https://calendar.google.com/calendar/u/0/r/week/YYYY/M/D
(M e D senza zero iniziale, es. 2026/4/16 non 2026/04/16)

Formato risposta (esempio):

    Martedi 10 Marzo 2026
    https://calendar.google.com/calendar/u/0/r/week/2026/3/10

    All day: Company offsite

    Timeline:
    09:00-10:00  Meeting con Marco (Google Meet)
    10:00-10:30  (buffer)
    10:30-11:30  Call con investor
    11:30-13:00  FREE
    13:00-14:00  Lunch con team
    14:00-17:00  FREE

## Step 5: Valuta disponibilita' per l'evento proposto

Se c'e' un evento proposto con orario:
1. Controlla se lo slot e' libero
2. Calcola il **buffer** prima e dopo:
   - Buffer minore di 15 min: "Tight, no buffer"
   - Buffer 15-30 min: "Ok, poco buffer"
   - Buffer maggiore di 30 min: "Comodo"
3. Se c'e' conflitto, suggerisci slot alternativi liberi nella stessa giornata

Formato (esempio):

    Evento proposto: Lunch con Andrea alle 13:00
    Slot libero! Buffer: 45 min prima, 1h dopo. Comodo.

    oppure

    Conflitto con [evento] alle [ora].
    Alternative libere: 11:30-13:00, 15:00-17:00

Se l'evento proposto NON ha orario, mostra solo la timeline e chiedi:
"A che ora vorresti fissarlo?"

## Step 6: Follow-up actions

Dopo aver mostrato il calendario, Simone potrebbe chiedere azioni come:
- "Accorcia School" → aggiorna l'evento School con nuova ora di fine
- "Cancella Bath time" → elimina l'evento
- "Sposta X alle Y" → aggiorna orario

Leggi gli eventId dal file cache scritto in Step 3:

    cat /tmp/calendar-events-cache.json

Trova l'eventId e calendarId dell'evento da modificare.

Per aggiornare un evento (es. accorciare School):

    RAILWAY_URL="https://command-center-backend-production.up.railway.app"
    curl -sS -X PUT "${RAILWAY_URL}/google-calendar/update-event/<eventId>" \
      -H "Content-Type: application/json" \
      -d '{"calendarId":"<calendarId>","sendUpdates":"none","end":{"dateTime":"2026-04-16T12:15:00","timeZone":"Europe/London"}}'

Per cancellare un evento (calendarId va in query string):

    curl -sS -X DELETE "${RAILWAY_URL}/google-calendar/delete-event/<eventId>?sendUpdates=none&calendarId=<calendarId>"

IMPORTANTE: gestisci questi follow-up direttamente. NON postare su Slack. NON chiedere conferma se la richiesta e' chiara.

### Regole speciali per overlap
- **School** overlap: proponi di accorciare School a 15 min prima dell'evento che fa overlap
- **Bath time** overlap: chiedi se informare Katherine (katherine.manson@frostrow.com) e cancellare Bath time

## Regole
- Timezone: Europe/London (UK)
- Rispondi in modo conciso e visuale
- Se non riesci a determinare la data, chiedi
- Gestisci follow-up direttamente senza relay su Slack
