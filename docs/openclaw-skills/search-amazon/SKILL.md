---
name: search-amazon
description: "Search products on Amazon UK via Composio and present results with prices and links"
version: 2.0.0
category: search
---

# /search-amazon

## Flusso

1. **Parsa il contesto** — l'utente specifica cosa cercare
2. **Chiedi SOLO se manca la query** — "Cosa vuoi cercare su Amazon?"
3. **Cerca il tool** su Composio (Step 1)
4. **Esegui la ricerca** prodotti (Step 2)
5. **Mostra risultati** formattati con prezzo, rating, link

## Preferenze Simone
- Amazon domain: **amazon.co.uk** (UK)
- Valuta: **GBP (£)**

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

IMPORTANTE: i link devono essere **cliccabili** — usa formato markdown `[testo](url)` invece di URL nude.

### Formato libri
Se il prodotto e' un libro (detecta da categoria o titolo), usa questo formato:
```
📖 **[Titolo]** — [Autore]
£[prezzo] | ⭐ [rating]/5
[Copertina: Hardcover/Paperback/Kindle] | [Editore, Anno se disponibile]
[Compra su Amazon](url)
```

### Formato prodotti generici
```
**[Nome prodotto]** — £[prezzo]
⭐ [rating]/5 ([num reviews] reviews)
[Vedi su Amazon](url)
```

Mostra max 6-8 risultati piu' rilevanti. Ordina per rilevanza (come li restituisce Amazon).

Dopo i risultati: se la query era generica, suggerisci di raffinare. Se specifica, chiedi "Vuoi che cerchi qualcos'altro?"

## Regole
- Sempre Amazon UK (amazon.co.uk), mai .com o .it
- Prezzi in £ (GBP)
- Link SEMPRE cliccabili con markdown `[testo](url)` — MAI url nude
- Se il prodotto non ha prezzo, mostra "Prezzo non disponibile"
- Non inventare link — usa solo quelli restituiti da Composio
- Log in `ops-log.md`
