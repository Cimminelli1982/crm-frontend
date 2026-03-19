---
name: crm-duplicates
description: "Duplicate detection, analysis, and merge for contacts and companies"
version: 1.0.0
category: crm
---

# CRM Duplicates — Rilevamento, Analisi e Merge

## Obiettivo

Gestire l'intero ciclo di vita dei duplicati nel CRM: scansione automatica, analisi manuale, merge dei record e workflow di hold per contatti incerti. Copre sia contatti che aziende.

---

## Prerequisiti

```bash
source /opt/openclaw.env
```

Variabili necessarie:
- `$COMMAND_CENTER_BACKEND_URL` — Backend Railway (Node.js)
- `$CRM_AGENT_URL` — Agent service Railway (Python/FastAPI)
- `$SUPABASE_URL` — URL progetto Supabase
- `$SUPABASE_KEY` — Service role key Supabase

---

## 1) Triggerare la scansione duplicati

### Via Railway backend

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/agent/run-cleanup" \
  -H "Content-Type: application/json"
```

Questo avvia il processo di cleanup che include il rilevamento duplicati. I risultati vengono scritti nelle tabelle `contact_duplicates` e `company_duplicates`.

### Analisi duplicati da email

```bash
source /opt/openclaw.env
curl -sS -X POST "${CRM_AGENT_URL}/analyze-email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "esempio@dominio.com",
    "name": "Nome Cognome"
  }'
```

---

## 2) Tabelle duplicati

### contact_duplicates

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| primary_contact_id | uuid FK | Contatto principale (da mantenere) |
| duplicate_contact_id | uuid FK | Contatto duplicato (da eliminare/mergere) |
| status | text | `pending`, `resolved`, `dismissed` |
| merge_selections | jsonb | Campi scelti dall'utente per il merge |

### company_duplicates

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| primary_company_id | uuid FK | Azienda principale |
| duplicate_company_id | uuid FK | Azienda duplicata |
| status | text | `pending`, `resolved`, `dismissed` |
| merge_selections | jsonb | Campi scelti per il merge |

---

## 3) Consultare i duplicati pendenti

### Duplicati contatti pendenti

```sql
SELECT cd.*, 
  c1.first_name AS primary_first, c1.last_name AS primary_last,
  c2.first_name AS dup_first, c2.last_name AS dup_last
FROM contact_duplicates cd
JOIN contacts c1 ON cd.primary_contact_id = c1.contact_id
JOIN contacts c2 ON cd.duplicate_contact_id = c2.contact_id
WHERE cd.status = 'pending'
ORDER BY cd.created_at DESC;
```

### Duplicati aziende pendenti

```sql
SELECT cd.*,
  c1.name AS primary_name,
  c2.name AS dup_name
FROM company_duplicates cd
JOIN companies c1 ON cd.primary_company_id = c1.company_id
JOIN companies c2 ON cd.duplicate_company_id = c2.company_id
WHERE cd.status = 'pending'
ORDER BY cd.created_at DESC;
```

---

## 4) Accettare o rifiutare duplicati

### Risolvere (accettare il merge)

```sql
UPDATE contact_duplicates
SET status = 'resolved', merge_selections = '{MERGE_JSON}'
WHERE primary_contact_id = '{PRIMARY_ID}'
  AND duplicate_contact_id = '{DUPLICATE_ID}';
```

### Dismissare (non è un duplicato)

```sql
UPDATE contact_duplicates
SET status = 'dismissed'
WHERE primary_contact_id = '{PRIMARY_ID}'
  AND duplicate_contact_id = '{DUPLICATE_ID}';
```

Stessa logica per `company_duplicates` con i rispettivi campi.

---

## 5) Checklist pre-creazione contatto (4 controlli obbligatori)

Prima di creare QUALSIASI nuovo contatto, eseguire TUTTI e 4 i controlli. Creare il contatto SOLO se tutti restituiscono zero risultati.

### Check 1: Email esatta in contact_emails

```sql
SELECT c.contact_id, c.first_name, c.last_name, ce.email
FROM contact_emails ce
JOIN contacts c ON ce.contact_id = c.contact_id
WHERE ce.email ILIKE '{EMAIL_DA_VERIFICARE}';
```

### Check 2: Nome fuzzy in contacts

```sql
SELECT contact_id, first_name, last_name, category
FROM contacts
WHERE first_name ILIKE '%{FIRST_NAME}%'
  AND last_name ILIKE '%{LAST_NAME}%';
```

### Check 3: Contatti in hold

```sql
SELECT id, email, full_name, first_name, last_name, status, source_type
FROM contacts_hold
WHERE email ILIKE '{EMAIL_DA_VERIFICARE}'
   OR (first_name ILIKE '%{FIRST_NAME}%' AND last_name ILIKE '%{LAST_NAME}%');
```

### Check 4: Duplicati precedenti

```sql
SELECT cd.*, c.first_name, c.last_name
FROM contact_duplicates cd
JOIN contacts c ON c.contact_id IN (cd.primary_contact_id, cd.duplicate_contact_id)
WHERE c.first_name ILIKE '%{FIRST_NAME}%'
  AND c.last_name ILIKE '%{LAST_NAME}%';
```

### Regola finale

- Se TUTTI e 4 i check restituiscono 0 risultati → procedi con la creazione
- Se QUALSIASI check restituisce risultati → mostra a Simone e chiedi come procedere

---

## 6) Workflow di merge

Quando un duplicato viene confermato:

1. **Presentare entrambi i record** a Simone con tutti i campi a confronto
2. **Per ogni campo**, mostrare il valore di entrambi i record
3. **Simone sceglie** quale valore mantenere per ogni campo
4. **Salvare le scelte** in `merge_selections` come JSONB:

```json
{
  "first_name": "primary",
  "last_name": "primary",
  "job_role": "duplicate",
  "description": "duplicate",
  "linkedin": "primary"
}
```

5. **Aggiornare lo status** a `resolved`

---

## 7) Workflow di hold

Quando un contatto è incerto (non chiaro se duplicato, spam, o legittimo):

### Inserire in contacts_hold

```sql
INSERT INTO contacts_hold (email, full_name, first_name, last_name, source_type, status)
VALUES ('{EMAIL}', '{FULL_NAME}', '{FIRST_NAME}', '{LAST_NAME}', '{SOURCE}', 'pending');
```

`source_type`: indica da dove proviene il contatto (es. `email_sync`, `whatsapp`, `manual`)

### Consultare contatti in hold

```sql
SELECT * FROM contacts_hold WHERE status = 'pending' ORDER BY created_at DESC;
```

---

## Log operativo

Dopo ogni operazione, annotare:
- Quanti duplicati trovati (contatti e aziende)
- Quanti risolti / dismissati
- Quanti contatti messi in hold
- Eventuali merge effettuati con dettaglio dei campi scelti
```

---