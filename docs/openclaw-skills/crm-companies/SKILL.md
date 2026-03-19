---
name: crm-companies
description: "CRM companies: create, update, search, manage domains and tags"
version: 2.0.0
category: crm
---

# Skill: crm-companies

## Obiettivo

Gestione completa delle aziende nel CRM: creazione, aggiornamento, ricerca, gestione domini, tag, contatti collegati e allegati. Tutte le operazioni passano tramite Supabase REST API.

---

## Prerequisiti

```bash
source /opt/openclaw.env
```

Variabili richieste: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

Header standard per tutte le richieste:

```bash
-H "apikey: ${SUPABASE_ANON_KEY}" \
-H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
-H "Content-Type: application/json" \
-H "Prefer: return=representation"
```

---

## 1. Creare azienda

Tabella: `companies`

Campi:
- `name` (text, NOT NULL) — nome azienda
- `website` (varchar) — sito web
- `category` (company_category, default `'Inbox'`)
- `description` (text)
- `linkedin` (varchar)
- `created_by` (creation_source) — impostare SEMPRE a `'LLM'`

Categorie valide: `Professional Investor`, `Skip`, `Inbox`, `Advisory`, `Corporation`, `SME`, `Startup`, `Corporate`, `Not Set`, `Institution`, `Media`, `Hold`

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/companies" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Acme Corp",
    "website": "https://acme.com",
    "category": "Startup",
    "description": "AI-powered logistics platform",
    "linkedin": "https://linkedin.com/company/acme-corp",
    "created_by": "LLM"
  }'
```

**IMPORTANTE**: Eseguire SEMPRE la pre-creation checklist (sezione 10) prima di creare.

---

## 2. Aggiungere dominio

Tabella: `company_domains`

Campi:
- `company_id` (uuid FK → companies.company_id)
- `domain` (text, UNIQUE globale)
- `is_primary` (boolean, default `false`)

Vincolo: `UNIQUE(company_id, domain)`

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/company_domains" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "company_id": "<COMPANY_UUID>",
    "domain": "acme.com",
    "is_primary": true
  }'
```

Il dominio deve essere unico in tutta la tabella. Se il dominio esiste già, l'insert fallirà.

---

## 3. Aggiungere tag

Due passaggi: cercare/creare il tag, poi collegarlo.

### 3a. Cercare tag esistente

Tabella `tags`, campo `name` (NON `tag_name`).

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/tags?name=ilike.%25venture%25&select=tag_id,name" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### 3b. Creare tag se non esiste

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/tags" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Venture Capital"}'
```

### 3c. Collegare tag all'azienda

Tabella: `company_tags`

Vincolo: `UNIQUE(company_id, tag_id)`

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/company_tags" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "company_id": "<COMPANY_UUID>",
    "tag_id": "<TAG_UUID>"
  }'
```

---

## 4. Cercare azienda

### Per nome (ILIKE)

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/companies?name=ilike.%25acme%25&select=company_id,name,website,category" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Per dominio (tramite company_domains)

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/company_domains?domain=eq.acme.com&select=company_id,domain,is_primary,companies(company_id,name,website,category)" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Per website

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/companies?website=ilike.%25acme%25&select=company_id,name,website,category" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

---

## 5. Aggiornare azienda

```bash
source /opt/openclaw.env
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/companies?company_id=eq.<COMPANY_UUID>" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "description": "Updated description",
    "category": "Corporation",
    "last_modified_by": "LLM",
    "last_modified_at": "now()"
  }'
```

**Nota**: impostare sempre `last_modified_by` a `'LLM'` e `last_modified_at` quando si aggiorna.

---

## 6. Scheda azienda completa

Per ottenere tutti i dati di un'azienda con relazioni:

### Dati base + domini + tag

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/companies?company_id=eq.<COMPANY_UUID>&select=*,company_domains(*),company_tags(entry_id,tags(tag_id,name))" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Contatti collegati (via contact_companies)

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_companies?company_id=eq.<COMPANY_UUID>&select=contact_companies_id,relationship,is_primary,contacts(contact_id,first_name,last_name,job_role,category)" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Allegati (via company_attachments)

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/company_attachments?company_id=eq.<COMPANY_UUID>&select=company_attachment_id,created_at,attachments(attachment_id,file_name,file_url,file_type,file_size,description)" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

---

## 7. Eliminare associazioni

### Rimuovere dominio

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/company_domains?id=eq.<DOMAIN_UUID>" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Rimuovere tag

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/company_tags?entry_id=eq.<ENTRY_UUID>" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

Per rimuovere per combinazione:

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/company_tags?company_id=eq.<COMPANY_UUID>&tag_id=eq.<TAG_UUID>" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

---

## 8. Collegare contatto a azienda

Tabella: `contact_companies`

Campi:
- `contact_id` (uuid FK → contacts.contact_id)
- `company_id` (uuid FK → companies.company_id)
- `relationship` (contact_company_relationship_type)
- `is_primary` (boolean, default `false`)

Vincolo: `UNIQUE(contact_id, company_id)`

Relationship valide: `employee`, `founder`, `advisor`, `manager`, `investor`, `other`, `not_set`, `suggestion`

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/contact_companies" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "contact_id": "<CONTACT_UUID>",
    "company_id": "<COMPANY_UUID>",
    "relationship": "founder",
    "is_primary": true
  }'
```

### Aggiornare relazione

```bash
source /opt/openclaw.env
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/contact_companies?contact_id=eq.<CONTACT_UUID>&company_id=eq.<COMPANY_UUID>" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"relationship": "advisor"}'
```

### Rimuovere collegamento

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/contact_companies?contact_id=eq.<CONTACT_UUID>&company_id=eq.<COMPANY_UUID>" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

---

## 9. Company attachments

Tabella junction: `company_attachments`

Campi:
- `company_id` (uuid FK → companies.company_id)
- `attachment_id` (uuid FK → attachments.attachment_id)

### Collegare allegato esistente

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/company_attachments" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "company_id": "<COMPANY_UUID>",
    "attachment_id": "<ATTACHMENT_UUID>"
  }'
```

### Rimuovere collegamento allegato

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/company_attachments?company_attachment_id=eq.<CA_UUID>" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

---

## 10. PRE-CREATION CHECKLIST

**OBBLIGATORIO prima di creare qualsiasi azienda.** Creare SOLO se TUTTI i check restituiscono zero risultati.

### Check 1: Fuzzy match per nome

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/companies?name=ilike.%25acme%25&select=company_id,name,website,category" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Check 2: Match esatto per dominio

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/company_domains?domain=eq.acme.com&select=company_id,domain,companies(company_id,name)" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Check 3: Aziende in hold

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/companies_hold?name=ilike.%25acme%25&select=*" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Decisione

| Check 1 (nome) | Check 2 (dominio) | Check 3 (hold) | Azione |
|---|---|---|---|
| 0 risultati | 0 risultati | 0 risultati | Procedere con la creazione |
| ≥1 risultato | qualsiasi | qualsiasi | STOP — possibile duplicato, chiedere all'utente |
| qualsiasi | ≥1 risultato | qualsiasi | STOP — dominio già assegnato, chiedere all'utente |
| qualsiasi | qualsiasi | ≥1 risultato | STOP — azienda in hold, chiedere all'utente |

---

## Verifica

Dopo ogni operazione di creazione o aggiornamento, verificare il risultato:

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/companies?company_id=eq.<COMPANY_UUID>&select=*,company_domains(*),company_tags(entry_id,tags(tag_id,name))" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

Controllare che:
- Tutti i campi siano stati salvati correttamente
- I domini siano collegati
- I tag siano collegati
- `created_by` sia `'LLM'`

---

## Log operativo

Dopo ogni operazione, registrare:

```
[COMPANIES] <operazione> | <nome_azienda> | company_id: <uuid> | dettagli: <campi modificati>
```

Esempi:
```
[COMPANIES] CREATE | Acme Corp | company_id: abc-123 | category: Startup, domain: acme.com
[COMPANIES] UPDATE | Acme Corp | company_id: abc-123 | category: Corporation
[COMPANIES] ADD_DOMAIN | Acme Corp | company_id: abc-123 | domain: acme.io, is_primary: false
[COMPANIES] ADD_TAG | Acme Corp | company_id: abc-123 | tag: Venture Capital
[COMPANIES] LINK_CONTACT | Acme Corp | company_id: abc-123 | contact: Mario Rossi, relationship: founder
[COMPANIES] DELETE_DOMAIN | Acme Corp | company_id: abc-123 | domain: old-acme.com
[COMPANIES] ADD_ATTACHMENT | Acme Corp | company_id: abc-123 | file: pitch-deck.pdf
```