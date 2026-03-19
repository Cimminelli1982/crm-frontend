---
name: troubleshooting-email
description: "Diagnostic guide for email system issues"
version: 1.0.0
category: troubleshooting
---

# troubleshooting/email.md

Guida diagnostica completa per problemi con il sistema email del CRM.

## Email non appare nel CRM

### Checklist diagnostica (segui in ordine)

**1. E' spam?**
```sql
SELECT * FROM emails_spam WHERE email = '{SENDER_EMAIL}';
SELECT * FROM domains_spam WHERE domain = '{SENDER_DOMAIN}';
```
Se presente: l'email e' stata bloccata automaticamente e spostata in `Skip_Email`/`Skip_Domain` su Fastmail.

**2. E' in staging?**
```sql
SELECT id, from_email, subject, date, created_at
FROM command_center_inbox
WHERE type = 'email'
  AND from_email = '{SENDER_EMAIL}'
ORDER BY date DESC LIMIT 10;
```
Se presente: l'email c'e' ma non e' stata ancora processata (l'utente non ha cliccato "Done").

**3. E' gia' in production?**
```sql
-- Per Fastmail ID
SELECT email_id, subject, message_timestamp, gmail_id
FROM emails
WHERE gmail_id = '{FASTMAIL_ID}';

-- Per contact_id del mittente
SELECT email_id, subject, message_timestamp, direction
FROM emails
WHERE sender_contact_id = '{CONTACT_UUID}'
ORDER BY message_timestamp DESC LIMIT 10;
```
Nota: il campo si chiama `gmail_id` ma contiene l'ID Fastmail (nome legacy).

**4. E' stata sincronizzata da Fastmail?**
- La sync avviene ogni 60 secondi
- Fastmail marca le email sincronizzate con keyword `$crm_done`
- Se l'email ha `$crm_done` ma non e' nel CRM, potrebbe essere stata filtrata come spam

**5. Controllo via JMAP (ultimo resort)**
```bash
source /opt/openclaw.env
curl -s -X POST "https://api.fastmail.com/jmap/api/" \
  -H "Authorization: Bearer $FASTMAIL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "using": ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
    "methodCalls": [
      ["Email/query", {
        "accountId": "'$FASTMAIL_ACCOUNT_ID'",
        "filter": {"from": "{SENDER_EMAIL}"},
        "sort": [{"property": "receivedAt", "isAscending": false}],
        "limit": 5
      }, "0"]
    ]
  }'
```

## Email duplicata

### Diagnosi
```sql
SELECT gmail_id, COUNT(*) as count
FROM emails
GROUP BY gmail_id
HAVING COUNT(*) > 1;
```

### Causa probabile
- L'email e' stata processata ("Done") piu' volte
- In staging non dovrebbe mai succedere (constraint UNIQUE su `fastmail_id`)

## Contatto non collegato a email

### Diagnosi
```sql
-- 1. Il contatto ha un indirizzo email registrato?
SELECT * FROM contact_emails WHERE contact_id = '{CONTACT_UUID}';

-- 2. Il contatto appare come sender in qualche email?
SELECT email_id, subject, message_timestamp FROM emails WHERE sender_contact_id = '{CONTACT_UUID}' LIMIT 5;

-- 3. Il contatto appare come participant?
SELECT ep.participant_id, ep.email_id, ep.participant_type
FROM email_participants ep
WHERE ep.contact_id = '{CONTACT_UUID}' LIMIT 5;
```

### Causa probabile
- Se email in staging: il collegamento avviene solo dopo processing ("Done")
- Se in production senza participant: bug nel processing, verificare logs backend

## Contenuto email mancante

### Diagnosi
```sql
-- Staging: verificare campi body
SELECT id, subject,
       LENGTH(body_text) as text_length,
       LENGTH(body_html) as html_length
FROM command_center_inbox
WHERE id = '{INBOX_ID}';

-- Production
SELECT email_id, subject,
       LENGTH(body_plain) as plain_length,
       LENGTH(body_html) as html_length
FROM emails
WHERE email_id = '{EMAIL_ID}';
```

### Causa probabile
- Alcune email hanno solo HTML e niente plain text (o viceversa)
- Email vuote o con solo allegati

## Sync Fastmail non funziona

### Checklist
1. **Backend attivo?** — Il sync gira su `command-center-backend` (Railway)
2. **Token valido?** — Verificare `FASTMAIL_API_TOKEN` nell'env del backend
3. **Rate limit?** — Fastmail ha limiti su chiamate JMAP

### Verifica stato sync
```sql
-- Ultima email sincronizzata
SELECT id, from_email, subject, created_at
FROM command_center_inbox
WHERE type = 'email'
ORDER BY created_at DESC LIMIT 1;
```
Se `created_at` e' vecchio di piu' di qualche minuto, la sync potrebbe essere ferma.

## Lifecycle degli stati email

```
STATO 1: SOLO IN FASTMAIL
- Non ancora sincronizzata
- Nessun record nel CRM
         |
    (sync 60s)
         v
STATO 2: STAGING (command_center_inbox)
- Sincronizzata da Fastmail
- Marcata $crm_done in Fastmail
- Visibile nel tab Email del CRM
- In attesa di processing utente
         |
    (user "Done")
         v
STATO 3: PRODUCTION (emails + email_threads)
- Processata e archiviata
- Collegata a contatti via sender_contact_id e email_participants
- Record interactions creati
- Rimossa da command_center_inbox
```

### Come determinare lo stato
```sql
-- E' in staging?
SELECT EXISTS(
  SELECT 1 FROM command_center_inbox WHERE type = 'email' AND fastmail_id = '{FASTMAIL_ID}'
) as in_staging;

-- E' in production?
SELECT EXISTS(
  SELECT 1 FROM emails WHERE gmail_id = '{FASTMAIL_ID}'
) as in_production;

-- Ha generato un'interazione?
SELECT EXISTS(
  SELECT 1 FROM interactions
  WHERE email_thread_id IN (SELECT email_thread_id FROM emails WHERE gmail_id = '{FASTMAIL_ID}')
) as has_interaction;
```

## Tabella riassuntiva stati

| Stato | Dove | Indicatori |
|-------|------|------------|
| Non sincronizzata | Solo Fastmail | Nessun record CRM |
| In staging | command_center_inbox | `type = 'email'` |
| Processata | emails, email_threads | Ha `email_id`, collegata a thread |
| Archiviata | emails + interactions | Ha record interaction, rimossa da inbox |
| Spam | emails_spam / domains_spam | Email/dominio nelle tabelle spam |

## Accesso JMAP Fastmail (diagnostica avanzata)

Usare JMAP solo per:
- Debug sync (verificare stato email in Fastmail)
- Download allegati (tramite `blobId`)
- Verificare keyword `$crm_done`

### Endpoint
- Base URL: `https://api.fastmail.com/jmap/api/`
- Auth: `Authorization: Bearer $FASTMAIL_API_TOKEN`

### Query email per ID
```bash
source /opt/openclaw.env
curl -s -X POST "https://api.fastmail.com/jmap/api/" \
  -H "Authorization: Bearer $FASTMAIL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "using": ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
    "methodCalls": [
      ["Email/get", {
        "accountId": "'$FASTMAIL_ACCOUNT_ID'",
        "ids": ["{FASTMAIL_EMAIL_ID}"],
        "properties": ["id", "subject", "from", "receivedAt", "keywords"]
      }, "0"]
    ]
  }'
```

### Download allegato
```
GET https://api.fastmail.com/jmap/download/{ACCOUNT_ID}/{BLOB_ID}
Authorization: Bearer $FASTMAIL_API_TOKEN
```

## Riferimenti
- Backend sync: `command-center-backend` (Railway)
- Documentazione backend: `/home/user/crm-frontend/docs/DATA_INGESTION.md`
- Skill principale: `skills/email.md`
