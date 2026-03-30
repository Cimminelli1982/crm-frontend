---
name: search-amazon
description: "Search products on Amazon UK via Composio"
version: 1.0.0
category: search
---

# /search-amazon

Cerca prodotti su Amazon UK usando Composio.

## Flusso

1. Parsa l'input dell'utente (es. "/search-amazon airpods pro case")
2. Chiama Composio SEARCH_TOOLS per trovare il tool
3. Esegui COMPOSIO_SEARCH_AMAZON
4. Mostra risultati

## Esecuzione

### Step 1: Search tool
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/search" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"queries":[{"use_case":"search products on Amazon"}],"session":{"generate_id":true}}'
```
Salva il `session.id` dalla risposta.

### Step 2: Esegui ricerca
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/execute" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "tools":[{
      "tool_slug":"COMPOSIO_SEARCH_AMAZON",
      "arguments":{
        "query":"{SEARCH_QUERY}",
        "amazon_domain":"amazon.co.uk"
      }
    }],
    "sync_response_to_workbench":false,
    "session_id":"{SESSION_ID}"
  }'
```

## Output
Mostra per ogni prodotto: nome, prezzo (£), rating, link.
