---
name: comm-email
description: "Email operations: read, search, analyze email threads and messages"
version: 2.0.0
category: communication
---

# skills/email.md

Obiettivo: consultare, cercare e analizzare le email di Simone (staging e production), gestire spam, navigare thread.

## 0) Prerequisiti
- Variabili env caricate: `source /opt/openclaw.env`
- Accesso Supabase via REST: `SUPABASE_URL`, `SUPABASE_KEY`
- Project ID Supabase: `efazuvegwxouysfcgwja`

## Architettura email (2 livelli)

### Staging: `command_center_inbox`
- Tutte le email nuove arrivano qui (sync ogni 60s da Fastmail)
- Visibili nel tab "Email" del CRM
- Restano qui finche' l'utente non le processa (click "Done")
- Filtro obbligatorio: `type = 'email'`

### Production: `emails`, `email_threads`, `email_participants`, `interactions`
- Email processate e archiviate
- Collegate a contatti via `sender_contact_id` e `email_participants`
- Record `interactions` creati automaticamente
- Rimosse da `command_center_inbox` dopo processing

### Flusso
```
Fastmail -> (60s sync) -> command_center_inbox -> (user "Done") -> emails + email_threads + interactions
```

**IMPORTANTE**: Se un'email non e' mai stata processata ("Done") nel CRM, sara' SOLO in staging o solo in Fastmail. Non cercarla in production.

## 1) Consultare email recenti (staging — non processate)

### Query
```sql
SELECT id, from_email, from_name, subject, snippet, date, direction, is_read, has_attachments
FROM command_center_inbox
WHERE type = 'email'
ORDER BY date DESC
LIMIT 20;
```

## 2) Consultare email processate (production)

### Per contatto (dato contact_id) — via sender_contact_id
```sql
SELECT email_id, subject, message_timestamp, direction, left(body_plain, 150) as snippet
FROM emails
WHERE sender_contact_id = '{CONTACT_UUID}'
ORDER BY message_timestamp DESC
LIMIT 20;
```

### Per contatto — via email_participants (include anche email dove il contatto e' in TO/CC)
```sql
SELECT e.email_id, e.subject, e.message_timestamp, e.direction, left(e.body_plain, 150) as snippet
FROM emails e
JOIN email_participants ep ON e.email_id = ep.email_id
WHERE ep.contact_id = '{CONTACT_UUID}'
ORDER BY e.message_timestamp DESC
LIMIT 20;
```

### Per indirizzo email
```sql
-- Staging (ha from_email direttamente)
SELECT id, from_email, subject, snippet, date
FROM command_center_inbox
WHERE type = 'email'
  AND (from_email = '{EMAIL}' OR to_recipients::text ILIKE '%{EMAIL}%' OR cc_recipients::text ILIKE '%{EMAIL}%')
ORDER BY date DESC;

-- Production: prima trova il contact_id dall'email
SELECT ce.contact_id FROM contact_emails ce WHERE ce.email = '{EMAIL}';
-- Poi usa il contact_id per cercare (vedi query sopra)
```

### Trovare il contact_id da un nome
```sql
SELECT c.contact_id, c.first_name, c.last_name, ce.email
FROM contacts c
LEFT JOIN contact_emails ce ON c.contact_id = ce.contact_id
WHERE c.first_name ILIKE '%{NOME}%' OR c.last_name ILIKE '%{COGNOME}%';
```

### Strategia completa: trovare email di un contatto per nome
```sql
-- Step 1: trova contact_id e email
SELECT c.contact_id, c.first_name, c.last_name, ce.email
FROM contacts c
LEFT JOIN contact_emails ce ON c.contact_id = ce.contact_id
WHERE c.first_name ILIKE '%{NOME}%' AND c.last_name ILIKE '%{COGNOME}%';

-- Step 2a: cerca in staging per indirizzo email
SELECT id, from_email, subject, snippet, date, direction
FROM command_center_inbox
WHERE type = 'email'
  AND (from_email = '{EMAIL}' OR to_recipients::text ILIKE '%{EMAIL}%')
ORDER BY date DESC LIMIT 10;

-- Step 2b: cerca in production per contact_id (sia come sender che come participant)
SELECT e.email_id, e.subject, e.message_timestamp, e.direction, left(e.body_plain, 150) as snippet
FROM emails e
LEFT JOIN email_participants ep ON e.email_id = ep.email_id
WHERE e.sender_contact_id = '{CONTACT_UUID}' OR ep.contact_id = '{CONTACT_UUID}'
ORDER BY e.message_timestamp DESC LIMIT 10;
```

## 3) Cercare email per keyword

### Staging
```sql
SELECT id, from_email, from_name, subject, snippet, date
FROM command_center_inbox
WHERE type = 'email'
  AND (subject ILIKE '%{KEYWORD}%' OR body_text ILIKE '%{KEYWORD}%')
ORDER BY date DESC;
```

### Production
```sql
SELECT email_id, subject, message_timestamp, direction, left(body_plain, 150) as snippet
FROM emails
WHERE subject ILIKE '%{KEYWORD}%' OR body_plain ILIKE '%{KEYWORD}%'
ORDER BY message_timestamp DESC;
```

## 4) Navigare thread email

### Tutti i messaggi di un thread
```sql
SELECT e.email_id, e.message_timestamp, e.direction, e.subject, left(e.body_plain, 150) as snippet
FROM emails e
WHERE e.email_thread_id = '{THREAD_UUID}'
ORDER BY e.message_timestamp ASC;
```

### Partecipanti di un thread
```sql
SELECT DISTINCT ep.participant_type, c.first_name, c.last_name, ce.email
FROM email_participants ep
LEFT JOIN contacts c ON ep.contact_id = c.contact_id
LEFT JOIN contact_emails ce ON ep.contact_id = ce.contact_id AND ce.is_primary = true
WHERE ep.email_id IN (SELECT email_id FROM emails WHERE email_thread_id = '{THREAD_UUID}');
```

### Thread per contatto
```sql
SELECT DISTINCT et.email_thread_id, et.subject, et.last_message_timestamp
FROM email_threads et
JOIN emails e ON et.email_thread_id = e.email_thread_id
LEFT JOIN email_participants ep ON e.email_id = ep.email_id
WHERE e.sender_contact_id = '{CONTACT_UUID}' OR ep.contact_id = '{CONTACT_UUID}'
ORDER BY et.last_message_timestamp DESC;
```

## 5) Email con allegati

```sql
-- Staging
SELECT id, subject, from_email, date, attachments
FROM command_center_inbox
WHERE type = 'email' AND has_attachments = true
ORDER BY date DESC;

-- Production
SELECT email_id, subject, message_timestamp, attachment_count
FROM emails
WHERE has_attachments = true
ORDER BY message_timestamp DESC;
```

Formato allegati staging: `[{name, type, size, blobId}, ...]`
Per scaricare allegati serve accesso JMAP a Fastmail (vedi troubleshooting/email.md).

## 6) Statistiche email

```sql
-- Totale in staging
SELECT COUNT(*) as total_staging FROM command_center_inbox WHERE type = 'email';

-- Totale in production
SELECT COUNT(*) as total_production FROM emails;

-- Top 10 contatti per volume email (come sender)
SELECT c.first_name, c.last_name, COUNT(e.email_id) as email_count
FROM contacts c
JOIN emails e ON c.contact_id = e.sender_contact_id
GROUP BY c.contact_id, c.first_name, c.last_name
ORDER BY email_count DESC LIMIT 10;

-- Distribuzione sent/received
SELECT direction, COUNT(*) as count FROM emails GROUP BY direction;
```

## 7) Gestione spam

### Verificare se un'email/dominio e' spam
```sql
SELECT * FROM emails_spam WHERE email = '{EMAIL}';
SELECT * FROM domains_spam WHERE domain = '{DOMAIN}';
```

### Lista spam completa
```sql
SELECT 'email' as type, email as value, counter FROM emails_spam
UNION ALL
SELECT 'domain' as type, domain as value, counter FROM domains_spam
ORDER BY counter DESC;
```

## 8) Interazioni email per contatto

```sql
SELECT interaction_id, interaction_type, direction, interaction_date, summary, email_thread_id
FROM interactions
WHERE contact_id = '{CONTACT_UUID}' AND interaction_type = 'email'
ORDER BY interaction_date DESC
LIMIT 20;
```

## 9) Date range

```sql
-- Ultimi 7 giorni (staging)
SELECT * FROM command_center_inbox
WHERE type = 'email' AND date >= NOW() - INTERVAL '7 days'
ORDER BY date DESC;

-- Ultimi 30 giorni (production)
SELECT * FROM emails
WHERE message_timestamp >= NOW() - INTERVAL '30 days'
ORDER BY message_timestamp DESC;

-- Range specifico
SELECT * FROM emails
WHERE message_timestamp BETWEEN '{DATA_INIZIO}' AND '{DATA_FINE}'
ORDER BY message_timestamp DESC;
```

## Schema reference (tabelle principali)

### command_center_inbox (staging)
| Campo | Tipo | Note |
|-------|------|------|
| id | UUID PK | |
| type | TEXT | 'email' per filtrare email |
| fastmail_id | TEXT UNIQUE | Dedup key |
| thread_id | TEXT | Fastmail thread ID |
| from_email, from_name | TEXT | Mittente |
| to_recipients, cc_recipients | JSONB | `[{email, name}, ...]` |
| subject, body_text, body_html, snippet | TEXT | Contenuto |
| date | TIMESTAMPTZ | Quando inviata/ricevuta |
| direction | TEXT | 'sent' / 'received' |
| is_read, is_starred, has_attachments | BOOLEAN | Flags |
| attachments | JSONB | `[{name, type, size, blobId}, ...]` |

### emails (production)
| Campo | Tipo | Note |
|-------|------|------|
| email_id | UUID PK | |
| email_thread_id | UUID FK | Riferimento a email_threads |
| gmail_id | TEXT | Campo legacy, contiene Fastmail ID |
| thread_id | TEXT | Fastmail thread ID |
| sender_contact_id | UUID FK | Riferimento a contacts (mittente) |
| subject | TEXT | |
| body_plain, body_html | TEXT | Contenuto (NO campo "body" o "snippet") |
| message_timestamp | TIMESTAMPTZ | Data email (NO campo "date") |
| labels | JSONB | |
| direction | TEXT | 'sent' / 'received' |
| is_read, is_starred | BOOLEAN | |
| has_attachments | BOOLEAN | |
| attachment_count | INTEGER | |
| special_case | TEXT | |
| created_at | TIMESTAMPTZ | |
| created_by | TEXT | |

### email_threads
| Campo | Tipo | Note |
|-------|------|------|
| email_thread_id | UUID PK | |
| thread_id | TEXT | Fastmail thread_id |
| subject | TEXT | |
| last_message_timestamp | TIMESTAMPTZ | (NO "last_message_date") |
| created_at, updated_at | TIMESTAMPTZ | |

### email_participants
| Campo | Tipo | Note |
|-------|------|------|
| participant_id | UUID PK | (NO campo "id") |
| email_id | UUID FK -> emails | |
| contact_id | UUID FK -> contacts | |
| participant_type | ENUM | 'from', 'to', 'cc' |
| created_at | TIMESTAMPTZ | |

**NOTA**: email_participants NON ha campo `email_address`. Per ottenere l'email di un partecipante, join su `contact_emails` via `contact_id`.

### contact_emails
| Campo | Tipo | Note |
|-------|------|------|
| email_id | UUID PK | |
| contact_id | UUID FK -> contacts | |
| email | VARCHAR | Indirizzo email |
| type | ENUM | Tipo (work, personal, etc) |
| is_primary | BOOLEAN | |

### emails_spam
| Campo | Tipo | Note |
|-------|------|------|
| email | TEXT PK | Indirizzo bloccato |
| counter | NUMERIC | Quante volte bloccato |
| filter_domain | BOOLEAN | |
| created_at, last_modified_at | TIMESTAMPTZ | |

### domains_spam
| Campo | Tipo | Note |
|-------|------|------|
| domain | VARCHAR PK | Dominio bloccato |
| counter | INTEGER | Quante volte bloccato |
| notes | TEXT | |
| created_at | TIMESTAMPTZ | |

## Troubleshooting

Per diagnostica completa, lifecycle stati, debug JMAP e guide passo-passo: vedi `troubleshooting/email.md`

Quick checks:
- Spam? `SELECT * FROM emails_spam WHERE email = '...';`
- In staging? `SELECT * FROM command_center_inbox WHERE type = 'email' AND from_email = '...' ORDER BY date DESC LIMIT 5;`
- In production? `SELECT * FROM emails WHERE sender_contact_id = '...' ORDER BY message_timestamp DESC LIMIT 5;`
- Duplicati? `SELECT gmail_id, COUNT(*) FROM emails GROUP BY gmail_id HAVING COUNT(*) > 1;`

### Campo `gmail_id`
Il campo `emails.gmail_id` e' un nome legacy — contiene l'ID Fastmail, non Gmail.

## Log operativo
Ogni azione su email deve finire in `ops-log.md`:
- timestamp
- azione (ricerca, analisi, report)
- risultato sintetico

## 10) Inviare email (via Railway backend)

### POST /send (nuova email)

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["dest@example.com"],
    "subject": "Subject",
    "textBody": "Plain text body",
    "htmlBody": null,
    "cc": [],
    "bcc": []
  }'
```

Non servono header di autenticazione per il backend Railway.

### POST /reply (rispondere a email)

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/reply" \
  -H "Content-Type: application/json" \
  -d '{
    "inReplyTo": "{FASTMAIL_EMAIL_ID}",
    "to": ["dest@example.com"],
    "textBody": "Reply text",
    "cc": []
  }'
```

NOTA: `inReplyTo` = Fastmail email ID. Corrisponde al campo `gmail_id` nella tabella `emails`, oppure `fastmail_id` nella tabella di staging `command_center_inbox`.

### POST /forward (inoltrare email)

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/forward" \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "{FASTMAIL_EMAIL_ID}",
    "to": ["dest@example.com"],
    "textBody": "FYI, see forwarded email below."
  }'
```

### POST /archive (archiviare email in Fastmail)

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/archive" \
  -H "Content-Type: application/json" \
  -d '{"emailId": "{FASTMAIL_EMAIL_ID}"}'
```

Sposta l'email dalla Inbox all'archivio in Fastmail. Non cancella l'email, resta cercabile.

---

## 11) Creare bozze email in Fastmail

### Parametri da raccogliere

Prima di creare una bozza, servono:
- **to**: nome e email del destinatario
- **subject**: oggetto dell'email
- **body**: testo della mail
- **cc** (opzionale): destinatari in copia

### Trovare email del destinatario

```sql
SELECT c.first_name, c.last_name, ce.email
FROM contacts c JOIN contact_emails ce ON c.contact_id = ce.contact_id
WHERE (c.first_name ILIKE '%{NOME}%' AND c.last_name ILIKE '%{COGNOME}%')
ORDER BY ce.is_primary DESC LIMIT 3;
```

Se ci sono più email per lo stesso contatto, preferire quella con `is_primary = true`.

### Creare draft via JMAP

```bash
source /opt/openclaw.env
curl -s -X POST "https://api.fastmail.com/jmap/api/" \
  -H "Authorization: Bearer $FASTMAIL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "using": ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
    "methodCalls": [
      ["Email/set", {
        "accountId": "'"$FASTMAIL_ACCOUNT_ID"'",
        "create": {
          "draft1": {
            "mailboxIds": {"P3V": true},
            "keywords": {"$draft": true},
            "from": [{"name": "Simone Cimminelli", "email": "'"$FASTMAIL_FROM_EMAIL"'"}],
            "to": [{"name": "{DEST_NAME}", "email": "{DEST_EMAIL}"}],
            "subject": "{SUBJECT}",
            "textBody": [{"partId": "body", "type": "text/plain"}],
            "bodyValues": {"body": {"value": "{BODY_TEXT}"}}
          }
        }
      }, "0"]
    ]
  }'
```

### Varianti

**Per aggiungere CC:**

Aggiungere il campo `"cc"` allo stesso livello di `"to"`:

```json
"cc": [{"name": "Nome CC", "email": "cc@example.com"}]
```

**Per body HTML** (al posto di plain text):

Sostituire `"textBody"` con `"htmlBody"`:

```json
"htmlBody": [{"partId": "body", "type": "text/html"}],
"bodyValues": {"body": {"value": "<p>Contenuto HTML della mail</p>"}}
```

### Verifica successo

La risposta contiene `"created": {"draft1": {"id": "..."}}` se la bozza è stata creata con successo.

Se la risposta contiene `"notCreated"`, c'è stato un errore — controllare il campo `"description"` per dettagli.

### Importante

Questo comando NON invia la mail. Salva solo come bozza nella cartella Drafts di Fastmail. Simone potrà rivederla e inviarla manualmente dal client Fastmail.