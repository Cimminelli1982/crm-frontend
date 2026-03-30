---
name: search-flights
description: "Search flights via Composio and present results with direct flight preference"
version: 3.0.0
category: search
---

# /search-flights

## Flusso

1. **Parsa il contesto** — l'utente puo' specificare destinazione, date, numero passeggeri
2. **Chiedi SOLO quello che manca:**
   - Destinazione: obbligatoria (citta' o aeroporto)
   - Date: andata (obbligatoria), ritorno (opzionale — se non specificato, solo andata)
   - Passeggeri: default 1 adulto
3. **Cerca il tool** su Composio (Step 1)
4. **Esegui la ricerca** voli (Step 2)
5. **Mostra risultati** formattati con preferenza voli diretti

## Preferenze Simone
- Aeroporto Londra preferito: **LGW** (Gatwick) — cerca PRIMA da LGW. Se non ci sono risultati buoni (nessun volo diretto, o orari scomodi), cerca anche LHR/STN/LTN e mostra le alternative
- Preferenza **FORTE**: **voli diretti** — mostrali SEMPRE per primi, evidenziati. I voli con scalo sono plan B
- **Comodita' piu' importante del prezzo** — tra un volo diretto e uno con scalo piu' economico, suggerisci il diretto. Tra orari comodi (mattina/pomeriggio) e voli notturni cheap, suggerisci orari comodi
- Valuta: **GBP**
- Classe: Economy (travel_class: 1)
- Adulti: 1 (default)

## Esecuzione

### Step 1: Search tool
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/search" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"queries":[{"use_case":"search flights between airports with dates and prices"}],"session":{"generate_id":true}}'
```
Salva il `session.id` dalla risposta. Il tool slug e' `COMPOSIO_SEARCH_FLIGHTS`.

### Step 2: Esegui ricerca voli

Il tool supporta DUE modalita':

**Opzione A — Parametri strutturati (preferita, piu' precisa):**
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/execute" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "tools":[{
      "tool_slug":"COMPOSIO_SEARCH_FLIGHTS",
      "arguments":{
        "departure_id":"{ORIGIN_IATA}",
        "arrival_id":"{DEST_IATA}",
        "outbound_date":"{YYYY-MM-DD}",
        "return_date":"{YYYY-MM-DD}",
        "adults":1,
        "travel_class":1,
        "currency":"GBP",
        "gl":"uk",
        "hl":"en"
      }
    }],
    "sync_response_to_workbench":false,
    "session_id":"{SESSION_ID}"
  }'
```

**Opzione B — Query naturale (se i parametri non sono chiari):**
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/execute" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "tools":[{
      "tool_slug":"COMPOSIO_SEARCH_FLIGHTS",
      "arguments":{
        "query":"London Gatwick to Rome on April 15 2026",
        "currency":"GBP",
        "gl":"uk",
        "hl":"en"
      }
    }],
    "sync_response_to_workbench":false,
    "session_id":"{SESSION_ID}"
  }'
```

Se solo andata, rimuovi `return_date` dal JSON. Se non specificata, `outbound_date` default a 7 giorni da oggi.

## Mapping aeroporti comuni

| Citta | IATA |
|-------|------|
| Londra (default) | LGW |
| Londra Heathrow | LHR |
| Londra Stansted | STN |
| Londra Luton | LTN |
| Roma Fiumicino | FCO |
| Roma Ciampino | CIA |
| Milano Malpensa | MXP |
| Milano Linate | LIN |
| Napoli | NAP |
| Catania | CTA |
| Palermo | PMO |
| Cagliari | CAG |
| Lamezia Terme | SUF |
| Bari | BRI |
| Cracovia | KRK |
| Varsavia | WAW |

Se la citta' non e' in lista, deduci il codice IATA piu' probabile.

## Output

IMPORTANTE:
- I link devono essere **cliccabili** — usa formato markdown `[testo](url)` invece di URL nude
- Mostra SEMPRE da quale aeroporto parte e a quale aeroporto arriva (codice IATA)
- Se Composio restituisce un booking link, usalo. Se no, costruisci un link Google Flights: `https://www.google.com/travel/flights?q=flights+from+{ORIGIN}+to+{DEST}+on+{DATE}`

Mostra risultati ordinati: voli diretti prima, poi con scali.

### Formato per ogni volo
```
✈️ **[Compagnia]** — £[prezzo]
🛫 [ORIGIN] [Partenza HH:MM] → 🛬 [DEST] [Arrivo HH:MM] ([durata]) | **DIRECT** o [N stop(s)]
[Prenota su Google Flights](url)
```

### Se andata e ritorno
Mostra separati con intestazione:
```
**Andata — [data] ([ORIGIN] → [DEST])**
[lista voli]

---

**Ritorno — [data] ([DEST] → [ORIGIN])**
[lista voli]
```

Dopo i risultati: "Vuoi che cerchi date alternative o un altro aeroporto?"

## Pitfalls (da Composio)
- Citta' ambigue (es. "Roma" potrebbe essere Roma TX) — usa SEMPRE codici IATA
- Le date possono shiftare per timezone — verifica che siano corrette per il fuso Europe/London
- Se la risposta e' vuota, prova con un aeroporto alternativo della stessa citta'

## Regole
- Timezone: Europe/London
- Se Simone dice "volo per Roma" senza date, chiedi: "Quando vuoi partire?"
- Se dice solo andata senza ritorno, cerca solo andata
- Evidenzia i voli diretti come prima scelta
- Link SEMPRE cliccabili con markdown `[testo](url)` — MAI url nude
- Log in `ops-log.md`
