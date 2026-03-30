---
name: search-flights
description: "Search flights via Composio"
version: 1.0.0
category: search
---

# /search-flights

Cerca voli usando Composio. Preferenze di default: Gatwick (LGW), voli diretti, GBP.

## Flusso

1. Parsa l'input dell'utente (es. "/search-flights Roma 13 aprile ritorno 15 aprile")
2. Chiama Composio SEARCH_TOOLS per trovare il tool
3. Esegui COMPOSIO_SEARCH_FLIGHTS
4. Mostra risultati con preferenza per voli diretti

## Preferenze Simone
- Aeroporto Londra: **LGW** (Gatwick)
- Preferenza: **voli diretti**
- Valuta: **GBP**
- Classe: Economy
- Adulti: 1

## Esecuzione

### Step 1: Search tool
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/search" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"queries":[{"use_case":"search flights"}],"session":{"generate_id":true}}'
```
Salva il `session.id` dalla risposta.

### Step 2: Esegui ricerca voli
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

## Output
Mostra in tabella: compagnia, volo, orari, durata, scali, prezzo. Evidenzia voli diretti.
