---
name: deals
description: "Deal pipeline management: create, update stage, link contacts"
version: 1.0.0
category: deals
---

# skills/deals.md - Area Deals

Obiettivo: gestire la pipeline di investimenti e deals di Simone, consultare, aggiornare stage, analizzare qualità dati, tracciare progress.

## 0) Prerequisiti
- Variabili env caricate: `source /opt/openclaw.env`
- Accesso Supabase via REST: `SUPABASE_URL`, `SUPABASE_KEY`
- Tabelle: `deals`, `deal_attachments`

## Struttura Tabella (deals)

| Campo | Tipo | Descrizione |
|---|---|---|
| deal_id | UUID PK | |
| opportunity | TEXT | Nome deal/opportunità |
| source_category | TEXT | Come è arrivato (Cold Contacting, Referral, ecc.) |
| category | TEXT | Tipo (Startup, Real Estate, Fund, ecc.) |
| stage | TEXT | Lead, Invested, Monitoring, Passed |
| description | TEXT | Pitch/descrizione |
| total_investment | NUMERIC | Importo in milioni |
| deal_currency | TEXT | EUR, GBP, USD |
| created_at | TIMESTAMP | Data creazione |
| last_modified_at | TIMESTAMP | Ultimo aggiornamento |

## 1) Consultare deals aperti

### Input
- filtro: stage, created_date, importo minimo

### Output
- lista: opportunity, stage, importo, currency, created_at, ordinata per priorità

### Query — Deals APERTI (non Passed, non Invested)
```bash
source /opt/openclaw.env

curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?stage=not.in.(Passed,Invested)&order=created_at.asc&select=opportunity,stage,total_investment,deal_currency,created_at" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Query — Deals per stage
```bash
# Lead only
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?stage=eq.Lead&order=total_investment.desc.nullslast&select=opportunity,total_investment,deal_currency" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"

# Monitoring
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?stage=eq.Monitoring&order=created_at.asc" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Query — Recap per stage (counts)
```bash
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?select=stage" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[] | .stage' | sort | uniq -c
```

## 2) Aggiornare stage

### Input
- deal_id o opportunity name
- nuovo stage: Lead, Invested, Monitoring, Passed

### Endpoint
```bash
source /opt/openclaw.env

# Via opportunity name
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/deals?opportunity=eq.{OPPORTUNITY}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stage": "Passed"}'

# Via deal_id
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/deals?deal_id=eq.{DEAL_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stage": "Monitoring"}'
```

### Flusso operativo
1. Identificare deal per opportunity name o deal_id
2. Eseguire PATCH con nuovo stage
3. Loggare in `ops-log.md`

## 3) Quality Check dati

### Verifica rapida
```bash
source /opt/openclaw.env

# Deals con importo nullo
echo "=== Importo NULLO ==="
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?total_investment=is.null&select=opportunity,stage" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[] | .opportunity'

# Deals con currency nullo (ma importo presente)
echo "=== Currency NULLO ==="
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?total_investment=not.is.null&deal_currency=is.null&select=opportunity" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"

# Opportunità duplicate
echo "=== DUPLICATI ==="
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?select=opportunity" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[] | .opportunity' | sort | uniq -d

# Stage inconsistenti (nulli)
echo "=== Stage NULLO ==="
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?stage=is.null&select=opportunity" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Scenari problematici
- **Importo nullo**: riempire o marcare come "informazione non disponibile"
- **Duplicati**: merge o delete (ricordare di cancellare allegati prima)
- **Stage nullo**: assegnare stage valido
- **Currency mismatch**: verificare e correggere

## 4) Analizzare pipeline

### Top deals per importo
```bash
source /opt/openclaw.env

curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?stage=not.eq.Passed&order=total_investment.desc.nullslast&limit=10&select=opportunity,stage,total_investment,deal_currency" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Distribuzione per categoria
```bash
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?select=category" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[] | .category' | sort | uniq -c | sort -rn
```

### Progress timeline
```bash
# Deals creati ultimi 30 giorni
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deals?created_at=gte.2026-02-06&order=created_at.desc&select=opportunity,created_at,stage" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

## 5) Allegati (deal_attachments)

### Consultare allegati per deal
```bash
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deal_attachments?deal_id=eq.{DEAL_ID}&select=file_name,file_size,created_at" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### Contare deals con/senza allegati
```bash
# Deals con almeno 1 allegato
curl -sS -X GET "${SUPABASE_URL}/rest/v1/deal_attachments?select=deal_id" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq '[.[] | .deal_id] | unique | length'

# Deals senza allegati
# (differenza tra totale deals e deals con allegati)
```

### Cancellare allegati (prima di cancellare deal)
```bash
curl -sS -X DELETE "${SUPABASE_URL}/rest/v1/deal_attachments?deal_id=eq.{DEAL_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"

# POI cancella il deal
curl -sS -X DELETE "${SUPABASE_URL}/rest/v1/deals?deal_id=eq.{DEAL_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

## 6) Flusso di interazione tipico

### Setup mattina
1. Consultare deals aperti (Lead + Monitoring)
2. Conteggio per stage
3. Mostrare top 3 per importo

### Aggiornamento settimanale
1. Quality check dati
2. Aggiornare stage su richiesta
3. Identificare opportunities sospese
4. Review allegati

### Cleanup
1. Identificare deals "Passed" vecchi (>6 mesi)
2. Archiviare o consolidare
3. Pulire duplicati

## 7) Log operativo
Ogni azione finisce in `ops-log.md`:
- timestamp
- azione (viewed, updated stage, quality check, deleted)
- opportunity name
- deal_id
- dettagli (vecchio stage → nuovo stage, ecc.)

## 8) Estrazione Deal da PDF/Email/WhatsApp (ex deal-extraction)


Obiettivo: estrarre informazioni deal (contatto, azienda, investimento) da PDF allegati a email o WhatsApp, usando il servizio crm-agent-service su Railway.

## 0) Prerequisiti
- Variabili env: `source /opt/openclaw.env`
- Serve: `CRM_AGENT_URL`, `SUPABASE_URL`, `SUPABASE_KEY`
- Gli allegati (PDF) sono GIA' in Supabase Storage — arrivano automaticamente dai sync email e WhatsApp
- Tabelle coinvolte: `attachments`, `contacts`, `chats`, `email_threads`, `deals`, `companies`, `contact_companies`, `deals_contacts`

## 1) Trovare il PDF in Supabase

I PDF arrivano da due canali: WhatsApp ed Email. Il sync automatico:
1. Carica il file su Supabase Storage
2. Crea un record in `attachments` con `file_url` pubblico

IMPORTANTE: quando il messaggio e' ancora in staging (`command_center_inbox`, non ancora "Done"),
il record `attachments` esiste MA con `chat_id=null` e `email_thread_id=null`.
Solo dopo il "Done" i FK vengono collegati. Quindi:
- **Cerca SEMPRE per nome file** (metodo 1c) come primo tentativo
- Cerca per `chat_id`/`email_thread_id` solo per messaggi gia' processati

### 1a. PDF da WhatsApp (messaggi gia' processati)
```bash
source /opt/openclaw.env

# Trovare il chat_id del contatto (es. per nome)
CHAT_ID=$(curl -sS "${SUPABASE_URL}/rest/v1/chats?chat_name=ilike.*Federico%20Allegro*&select=id" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].id')

# Cercare PDF allegati a quella chat
curl -sS "${SUPABASE_URL}/rest/v1/attachments?chat_id=eq.${CHAT_ID}&file_type=eq.application/pdf&order=created_at.desc&limit=5&select=attachment_id,file_name,file_url,created_at" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

URL pattern WhatsApp: `https://efazuvegwxouysfcgwja.supabase.co/storage/v1/object/public/whatsapp-attachments/...`

### 1b. PDF da Email (messaggi gia' processati)
```bash
source /opt/openclaw.env

# Cercare PDF allegati a un email thread
curl -sS "${SUPABASE_URL}/rest/v1/attachments?email_thread_id=eq.{THREAD_ID}&file_type=eq.application/pdf&order=created_at.desc&limit=5&select=attachment_id,file_name,file_url,created_at" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### 1c. Cercare PDF per nome file (METODO PREFERITO — funziona anche in staging)
```bash
source /opt/openclaw.env

# Cerca per nome file (funziona sempre, anche se il messaggio non e' stato "Done")
curl -sS "${SUPABASE_URL}/rest/v1/attachments?file_name=ilike.*pitch*deck*&file_type=eq.application/pdf&order=created_at.desc&limit=5&select=attachment_id,file_name,file_url,created_at,chat_id,email_thread_id" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

### 1d. Trovare il nome file da command_center_inbox (staging)

Se non conosci il nome del file, trovalo dal messaggio in staging:
```bash
source /opt/openclaw.env

# Cercare messaggi con allegati per un contatto in staging
curl -sS "${SUPABASE_URL}/rest/v1/command_center_inbox?chat_name=ilike.*Federico%20Allegro*&has_attachments=eq.true&order=date.desc&limit=3&select=id,chat_name,date,attachments" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

Il campo `attachments` e' un jsonb array con oggetti: `{"name": "file.pdf", "type": "application/pdf", "url": "...", "size": 123}`
- Il campo `url` e' un URL TimelinesAI S3 firmato che SCADE dopo 15 minuti — NON usarlo
- Usa il campo `name` per cercare in `attachments` tabella (metodo 1c) dove il file e' gia' su Supabase Storage con URL permanente

## 2) Chiamare il Railway endpoint per estrazione

Una volta ottenuto il `file_url` dal passo 1, chiamare l'endpoint di estrazione.

### Endpoint
POST ${CRM_AGENT_URL}/extract-deal-from-email

### Esempio: PDF da WhatsApp
```bash
source /opt/openclaw.env

curl -sS -X POST "${CRM_AGENT_URL}/extract-deal-from-email" \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "whatsapp",
    "contact_phone": "+393331234567",
    "contact_name": "Federico Allegro",
    "conversation_text": "[Federico]: Hi Simone, here is the deck for the project...",
    "date": "2026-03-08T15:10:00Z",
    "attachment": {
      "file_name": "Pitch_Deck.pdf",
      "file_type": "application/pdf",
      "file_url": "https://efazuvegwxouysfcgwja.supabase.co/storage/v1/object/public/whatsapp-attachments/..."
    }
  }'
```

### Esempio: PDF da Email
```bash
source /opt/openclaw.env

curl -sS -X POST "${CRM_AGENT_URL}/extract-deal-from-email" \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "email",
    "from_email": "founder@startup.com",
    "from_name": "John Doe",
    "subject": "Series A Pitch Deck",
    "body_text": "Hi Simone, attached our pitch deck...",
    "date": "2026-03-08T10:00:00Z",
    "attachment": {
      "file_name": "pitch_deck.pdf",
      "file_type": "application/pdf",
      "file_url": "https://efazuvegwxouysfcgwja.supabase.co/storage/v1/object/public/attachments/deals/..."
    }
  }'
```

## 3) Output (risposta API)

La risposta JSON contiene:
```json
{
  "contact": {
    "use_existing": true,
    "existing_contact_id": "uuid",
    "first_name": "...",
    "last_name": "...",
    "email": "...",
    "job_role": "...",
    "category": "..."
  },
  "company": {
    "use_existing": true,
    "existing_company_id": "uuid",
    "name": "...",
    "website": "...",
    "domain": "...",
    "category": "...",
    "description": "..."
  },
  "deal": {
    "opportunity": "...",
    "total_investment": 500000,
    "deal_currency": "EUR",
    "category": "Startup",
    "stage": "Lead",
    "source_category": "...",
    "description": "..."
  },
  "associations": {
    "contact_is_proposer": true,
    "link_contact_to_company": true,
    "contact_company_relationship": "founder"
  }
}
```

## 4) Creare deal nel CRM dopo conferma di Simone

IMPORTANTE: mostrare SEMPRE il risultato a Simone e aspettare conferma prima di creare.

### 4a. Contatto
- Se `use_existing=true`: usa `existing_contact_id`
- Se `use_existing=false`: crea nuovo contatto
```bash
curl -sS -X POST "${SUPABASE_URL}/rest/v1/contacts" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"first_name":"...","last_name":"...","job_role":"...","category":"...","created_by":"LLM"}'
```

### 4b. Azienda
- Se `use_existing=true`: usa `existing_company_id`
- Se `use_existing=false`: crea nuova company
```bash
curl -sS -X POST "${SUPABASE_URL}/rest/v1/companies" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name":"...","website":"...","category":"...","created_by":"LLM"}'
```

### 4c. Deal
```bash
curl -sS -X POST "${SUPABASE_URL}/rest/v1/deals" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"opportunity":"...","total_investment":500000,"deal_currency":"EUR","category":"Startup","stage":"Lead","source_category":"...","description":"...","created_by":"LLM"}'
```

### 4d. Associazioni
```bash
# Link contact -> company
curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_companies" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contact_id":"...","company_id":"...","relationship":"founder"}'

# Link contact -> deal
curl -sS -X POST "${SUPABASE_URL}/rest/v1/deals_contacts" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"...","contact_id":"...","relationship":"proposer"}'
```

### 4e. Collegare il PDF al deal
```bash
# Link attachment -> deal
curl -sS -X POST "${SUPABASE_URL}/rest/v1/deal_attachments" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"...","attachment_id":"...","created_by":"LLM"}'
```

## 5) Flusso tipico (da Slack)

1. Simone dice "guarda il WhatsApp/email di X, mi ha mandato un deck — estrailo come deal"
2. Barbara cerca il contatto e trova gli allegati PDF in `attachments`
3. Prende il `file_url` (gia' pubblico in Supabase Storage)
4. Chiama `/extract-deal-from-email` con il file_url
5. Mostra risultato a Simone per conferma
6. Su conferma, crea contatto/azienda/deal + associazioni nel CRM
7. Collega il PDF al deal (deal_attachments)
8. Logga in `ops-log.md`

## Log operativo
Ogni estrazione va in `ops-log.md`:
- timestamp
- azione: deal_extraction
- source: whatsapp/email
- file: nome PDF
- risultato: opportunity name, contatto, azienda
- status: extracted / created / confirmed
