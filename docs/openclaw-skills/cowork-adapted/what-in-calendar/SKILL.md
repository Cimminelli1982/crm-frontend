---
name: what-in-calendar
description: "Check what's on Simone's Google Calendar - today, this week, or any date range"
version: 1.0.0-cowork
category: calendar
platform: cowork
---

# /what-in-calendar (Cowork)

## Obiettivo
Consultare il calendario di Simone. Mostrare eventi di oggi, domani, questa settimana, o qualsiasi range.

## Timezone
Simone vive a Londra: timezone = `Europe/London`

## Calendar IDs
| Calendario | ID | Uso |
|---|---|---|
| Living with Intention | `c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com` | Default, eventi personali |
| Agenda Management | `simone@cimminelli.com` | Calendario primario Google |

**REGOLA**: Interrogare SEMPRE **entrambi** i calendari e unire i risultati ordinati per orario.

## Flusso

### 1) Determinare il range di date
- "oggi" → da inizio a fine giornata
- "domani" → giorno dopo
- "questa settimana" → lunedi a domenica corrente
- "prossima settimana" → lunedi a domenica prossima
- Range specifico → usare le date indicate

### 2) Fetch eventi da entrambi i calendari

Fare **2 chiamate in parallelo** con `gcal_list_events`:

**Chiamata 1 — Living with Intention:**
```
gcal_list_events(
  calendarId: "c_8f8642e4bc489eca1f00590c765009d0dd778e62ea7d2b60a684863fb6094c62@group.calendar.google.com",
  timeMin: "{START_ISO}",
  timeMax: "{END_ISO}",
  timeZone: "Europe/London"
)
```

**Chiamata 2 — Agenda Management:**
```
gcal_list_events(
  calendarId: "simone@cimminelli.com",
  timeMin: "{START_ISO}",
  timeMax: "{END_ISO}",
  timeZone: "Europe/London"
)
```

### 3) Unire e ordinare
- Combina eventi dai 2 calendari
- Ordina per orario di inizio
- Raggruppa per giorno se range > 1 giorno

### 4) Presentare

Formato conciso per ogni evento:
```
HH:MM - HH:MM  Titolo evento [Location se presente]
```

Per eventi all-day:
```
Tutto il giorno  Titolo evento
```

## Regole
- Se non specifica range, default = **oggi**
- Mostra anche eventi passati se chiede "oggi" (per contesto)
- Se un evento ha attendees, mostrarli solo se richiesto
- Se un evento ha Google Meet link, menzionarlo
- Se "School" appare, e' il blocco focus/lavoro di Simone
- Se "Bath time" appare, e' il bagnetto serale con le figlie
