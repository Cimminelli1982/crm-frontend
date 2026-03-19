---
name: crm-enrichment
description: "Contact enrichment: Apollo API, LinkedIn, Google research workflow"
version: 1.0.0
category: crm
---

# CRM Enrichment Skill

## Obiettivo

Arricchire contatti CRM con dati da Apollo, LinkedIn, Google. Workflow in 5 step da eseguire ogni volta che un contatto viene aggiunto o ha dati incompleti.

## Prerequisiti

- `source /opt/openclaw.env`
- Apollo API Key disponibile nell'environment (o header `X-Api-Key`)
- Accesso Supabase (MCP tools o REST API)

---

## Step 1: Check existing interactions

Leggere i messaggi che hanno generato il contatto. Estrarre contesto da firme email (titolo, azienda, telefono), contesto relazionale.

```sql
SELECT type, from_name, from_email, subject, snippet, body_text, date, direction,
       to_recipients, cc_recipients, contact_number
FROM command_center_inbox
WHERE from_email ILIKE '{EMAIL}' OR body_text ILIKE '%{EMAIL}%' OR contact_number = '{MOBILE}'
ORDER BY date DESC;
```

---

## Step 2: Call Apollo

**Endpoint principale — match by name/email:**

```
POST https://api.apollo.io/v1/people/match
Header: X-Api-Key: {APOLLO_API_KEY}
Content-Type: application/json

{
  "first_name": "...",
  "last_name": "...",
  "email": "...",
  "organization_name": "..."
}
```

**Endpoint alternativo — enrich by LinkedIn URL:**

```
POST https://api.apollo.io/v1/people/enrich
Header: X-Api-Key: {APOLLO_API_KEY}
Content-Type: application/json

{
  "linkedin_url": "https://www.linkedin.com/in/..."
}
```

### Field Mapping: Apollo → CRM

| Apollo Field | CRM Field | Tabella | Note |
|---|---|---|---|
| `person.linkedin_url` | `linkedin` | `contacts` | |
| `person.title` | `job_role` | `contacts` | |
| `person.bio` | `description` | `contacts` | Non sovrascrivere se esiste gia |
| `person.city` | city link | `cities` + `contact_cities` | Cercare/creare citta, poi linkare |
| `person.keywords[]` | tag links | `tags` + `contact_tags` | Cercare/creare tag, poi linkare |
| `person.organization.name` | company link | `companies` + `contact_companies` | Cercare/creare company, poi linkare |
| `person.organization.website_url` | `website` | `companies` | |
| `person.organization.short_description` | `description` | `companies` | |
| `person.photo_url` | profile image | `contacts` | Vedi Step 5 |

**IMPORTANTE:** Controllare sempre se citta/companies/tags esistono gia (case-insensitive con `ILIKE`) prima di inserire nuovi record.

---

## Step 3: Browse LinkedIn

Se Apollo ha restituito `linkedin_url`, verificare e colmare lacune. Controllare:

- Ruolo attuale e headline
- Location
- Connessioni in comune
- Attivita recente (post, articoli)

Se Apollo NON ha trovato `linkedin_url`, cercare manualmente per nome + azienda.

---

## Step 4: Google Research

Cercare nome + azienda/ruolo/dominio. Cercare:

- Menzioni stampa, conferenze, articoli
- Profili Crunchbase
- Annunci di fundraising

**Per founder:** storia dell'azienda, funding rounds, exit precedenti.

**Per investitori:** portfolio, dimensione fondo, investment thesis.

---

## Step 5: Synthesize + Profile Image

Combinare tutte le fonti in campi CRM strutturati.

### Profile image via edge function

```bash
source /opt/openclaw.env
curl -sS -X POST "https://efazuvegwxouysfcgwja.supabase.co/functions/v1/apollo-profile-image" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contactId": "{CONTACT_ID}", "linkedinUrl": "{LINKEDIN_URL}"}'
```

**BUG IMPORTANTE:** La edge function restituisce l'URL ma NON salva nel DB. Aggiornare SEMPRE manualmente:

```bash
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/contacts?contact_id=eq.{CONTACT_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"profile_image_url": "{RETURNED_URL}", "last_modified_by": "LLM", "last_modified_at": "now()"}'
```

### Profile image via WhatsApp (alternativa)

```bash
curl -sS -X POST "${CRM_AGENT_URL}/whatsapp-profile-image" \
  -H "Content-Type: application/json" \
  -d '{"contact_id": "{CONTACT_ID}"}'
```

---

## Quando usare questa skill

- Dopo aver creato un nuovo contatto
- Quando un contatto ha `show_missing = true` o dati incompleti
- Su richiesta di Simone ("arricchisci questo contatto")
- Durante risoluzione issues `incomplete` da `data_integrity_inbox`

---

## Log operativo

Ogni enrichment va registrato in `ops-log.md` con il seguente formato:

- **timestamp**: data e ora dell'operazione
- **azione**: `enrichment`
- **contact**: nome completo + `contact_id`
- **sources**: quali fonti usate (Apollo / LinkedIn / Google)
- **fields updated**: lista campi aggiornati
- **risultato**: esito (successo, parziale, nessun dato trovato)