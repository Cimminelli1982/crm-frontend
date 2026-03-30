---
name: search-news
description: "Search recent news about a contact or company via Composio, with user confirmation before searching"
version: 1.0.0
category: search
---

# /search-news

## Flusso

1. **Estrai dal contesto CRM** — nome contatto, nome company (dal messaggio in corso)
2. **Proponi le query** — mostra cosa cercheresti e chiedi conferma
3. **Aspetta validazione** — l'utente conferma, modifica, o suggerisce alternative
4. **Esegui la ricerca** news (Step 1 + Step 2)
5. **Mostra risultati** con link cliccabili e date

## Step 0: Proponi prima di cercare

IMPORTANTE: la lista "Email contacts" nel contesto puo' essere STALE (riferita a un'email precedente). NON fidarti ciecamente.

Per determinare persona e company, usa questo ordine di priorita':
1. **Email inbox ID** — se presente, leggi l'email dal DB per avere il FROM reale:
   ```bash
   source /opt/openclaw.env
   curl -sS "${SUPABASE_URL}/rest/v1/command_center_inbox?id=eq.{INBOX_ID}&select=from_name,from_email,subject" \
     -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
   ```
2. **Contact** nel contesto (se presente, e' il contatto selezionato nel right panel)
3. **Email subject** — spesso contiene il nome della company
4. **Email contacts** — usa SOLO come fallback, puo' essere stale

Da queste info estrai:
- **Nome persona**: dal FROM dell'email o dal contatto nel right panel
- **Nome company**: dal dominio email, dal subject, o dalla firma

Poi PROPONI, non eseguire subito:

```
Ho trovato nel contesto:
👤 **[Nome Cognome]** — [job role se disponibile]
🏢 **[Nome Company]** — [dominio se disponibile]

Cercherei news su:
1. "[Nome Cognome] [Company]"
2. "[Company name] news"

Va bene o vuoi cercare qualcos'altro?
```

Se manca il contesto (nessun contatto/company), chiedi: "Su chi vuoi cercare news?"

## Esecuzione (dopo conferma)

### Step 1: Search tool
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/search" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"queries":[{"use_case":"search recent news articles"}],"session":{"generate_id":true}}'
```
Salva il `session.id` dalla risposta. Il tool slug e' `COMPOSIO_SEARCH_NEWS`.

### Step 2: Esegui ricerca news
```bash
source /opt/openclaw.env
curl -sS -X POST "https://backend.composio.dev/api/v3/mcp/tools/execute" \
  -H "x-api-key: ${COMPOSIO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "tools":[{
      "tool_slug":"COMPOSIO_SEARCH_NEWS",
      "arguments":{
        "query":"{SEARCH_QUERY}",
        "when":"m",
        "gl":"uk",
        "hl":"en"
      }
    }],
    "sync_response_to_workbench":false,
    "session_id":"{SESSION_ID}"
  }'
```

Parametri `when`:
- `d` = ultimo giorno
- `w` = ultima settimana
- `m` = ultimo mese (default)
- `y` = ultimo anno

Se i risultati sono vuoti con `m`, riprova con `y`.

### Step 3 (opzionale): Approfondimento
Se Simone chiede dettagli su un articolo, usa `COMPOSIO_SEARCH_FETCH_URL_CONTENT` per leggere la pagina:
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

IMPORTANTE: i link devono essere **cliccabili** — usa formato markdown `[testo](url)`.

I risultati sono in `results.news_results`. Formato:

```
📰 **News su [Nome/Company]**

1. **[Titolo articolo]** — [fonte]
   [data] | [Leggi](url)
   > [snippet 1-2 righe]

2. **[Titolo articolo]** — [fonte]
   [data] | [Leggi](url)
   > [snippet 1-2 righe]
```

Mostra max 5-6 articoli, ordinati per data (piu' recenti prima).

Se nessun risultato: "Nessuna news recente trovata su [query]. Vuoi che allarghi la ricerca all'ultimo anno o che cerchi con termini diversi?"

## Regole
- **MAI cercare senza prima proporre** — mostra sempre cosa cercheresti e aspetta ok
- Link SEMPRE cliccabili con markdown `[testo](url)` — MAI url nude
- Se `news_results` e' vuoto, allarga il periodo (`when: y`) prima di dire "nessun risultato"
- Priorita' contesto: nome persona > nome company > dominio email
- Se il contesto ha sia persona che company, cerca entrambi in query separate
- Log in `ops-log.md`
