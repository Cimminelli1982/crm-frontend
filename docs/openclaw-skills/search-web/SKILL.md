---
name: search-web
description: "Search the web via Composio (Exa API) and present results with citations and links"
version: 1.0.0
category: search
---

# /search-web

## Flusso

1. **Parsa il contesto** — l'utente specifica cosa cercare
2. **Chiedi SOLO se manca la query** — "Cosa vuoi cercare sul web?"
3. **Cerca il tool** su Composio (Step 1)
4. **Esegui la ricerca** web (Step 2)
5. **Mostra risultati** con citazioni e link cliccabili

## Esecuzione

### Step 1: Search tool
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/search" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"queries":[{"use_case":"search the web for information"}],"session":{"generate_id":true}}'
```
Salva il `session.id` dalla risposta. Il tool slug e' `COMPOSIO_SEARCH_WEB`.

### Step 2: Esegui ricerca web
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/execute" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "tools":[{
      "tool_slug":"COMPOSIO_SEARCH_WEB",
      "arguments":{
        "query":"{SEARCH_QUERY}"
      }
    }],
    "sync_response_to_workbench":false,
    "session_id":"{SESSION_ID}"
  }'
```

### Step 3 (opzionale): Fetch contenuto pagina
Se serve leggere il contenuto completo di una pagina dai risultati:
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/execute" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "tools":[{
      "tool_slug":"COMPOSIO_SEARCH_FETCH_URL_CONTENT",
      "arguments":{
        "urls":["{URL}"],
        "text":true
      }
    }],
    "sync_response_to_workbench":false,
    "session_id":"{SESSION_ID}"
  }'
```

## Output

IMPORTANTE: i link devono essere **cliccabili** — usa formato markdown `[testo](url)` invece di URL nude.

La risposta di Composio ha due parti:
- `results.answer` — riassunto narrativo (puo' essere vago)
- `results.citations` — fonti con link (queste sono la fonte primaria)

### Formato risposta
```
**[Titolo ricerca]**

[Riassunto conciso dei risultati — 2-3 frasi max]

**Fonti:**
1. [Titolo pagina](url) — snippet rilevante
2. [Titolo pagina](url) — snippet rilevante
3. [Titolo pagina](url) — snippet rilevante
```

Mostra max 5-6 fonti piu' rilevanti. Se la risposta narrativa e' vaga, basati sulle citations.

Se Simone chiede approfondimento su una fonte, usa Step 3 (FETCH_URL_CONTENT) per leggere la pagina completa.

## Tips per query migliori
- Aggiungi anno/regione per risultati piu' precisi (es. "best CRM tools 2026 UK")
- Usa `site:` per limitare a un dominio (es. "site:github.com react hooks")
- Per persone/aziende con nomi comuni, aggiungi contesto (citta', ruolo, settore)

## Regole
- Link SEMPRE cliccabili con markdown `[testo](url)` — MAI url nude
- Usa `results.citations` come fonte primaria, non `results.answer`
- Non inventare link — usa solo quelli restituiti da Composio
- Se i risultati sono vuoti o troppo generici, suggerisci di raffinare la query
- Log in `ops-log.md`
