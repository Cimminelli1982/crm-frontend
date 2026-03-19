---
name: comm-whatsapp
description: "WhatsApp operations: send messages, search chats, manage contacts"
version: 2.0.0
category: communication
---

# skills/whatsapp.md

Obiettivo: consultare, cercare e analizzare messaggi WhatsApp di Simone (staging e production), gestire spam, navigare chat e gruppi, inviare messaggi via Baileys.

## REGOLA CRITICA: Ordine di consultazione

**Per cercare messaggi recenti di un contatto, SEMPRE consultare in questo ordine:**

1. **PRIMA staging** (`command_center_inbox WHERE type = 'whatsapp'`) — contiene i messaggi PIU' RECENTI, non ancora processati
2. **POI production** (`interactions WHERE interaction_type = 'whatsapp'`) — contiene solo messaggi GIA' archiviati (piu' vecchi)

Se trovi messaggi recenti in staging, quelli sono i piu' aggiornati. Production ha solo lo storico processato.

## REGOLA: Disambiguazione nomi

Quando l'utente chiede messaggi di un nome generico (es. "Maria", "Marco"):
1. **NON cercare nei contatti** per chiedere "quale Maria?"
2. **Cerca PRIMA in staging** (`command_center_inbox WHERE type = 'whatsapp' AND (chat_name ILIKE '%Maria%' OR from_name ILIKE '%Maria%') ORDER BY date DESC`)
3. Se c'e' una sola chat recente con quel nome, mostra quei messaggi
4. Se ci sono piu' chat recenti, mostra i risultati raggruppati per chat e chiedi solo se necessario

L'utente intende quasi sempre la persona con cui ha parlato di recente, non un contatto a caso dal CRM.

## 0) Prerequisiti
- Variabili env caricate: `source /opt/openclaw.env`
- Accesso Supabase via REST: `SUPABASE_URL`, `SUPABASE_KEY`
- Accesso TimelinesAI API: `TIMELINES_API_KEY` (per dettagli gruppi, partecipanti)
- Base URL TimelinesAI: `https://app.timelines.ai/integrations/api`
- Project ID Supabase: `efazuvegwxouysfcgwja`

## Architettura WhatsApp (2 livelli + 2 provider)

### Ricezione: TimelinesAI (webhook)
- TimelinesAI riceve messaggi come device WhatsApp Web collegato
- Webhook POST → `crm-agent-service` (Python/FastAPI) → `command_center_inbox`
- Endpoint webhook: `/whatsapp-webhook`

### Invio: Baileys (gratuito)
- Libreria: `@whiskeysockets/baileys` (Node.js)
- Protocollo: WhatsApp Web (reverse-engineered, gratis)
- Backend: `command-center-backend` (Railway)
- Base URL: `https://command-center-backend-production.up.railway.app`

### Staging: `command_center_inbox`
- Tutti i messaggi nuovi arrivano qui
- Filtro obbligatorio: `type = 'whatsapp'`
- Restano finche' l'utente non clicca "Done"

### Production: `chats`, `interactions`, `contact_chats`
- Messaggi processati e archiviati
- Collegati a contatti via `contact_chats`
- Record `interactions` con `interaction_type = 'whatsapp'`

### Flusso completo
```
RICEZIONE: WhatsApp → TimelinesAI webhook → command_center_inbox → (user "Done") → chats + interactions
INVIO:     Baileys → WhatsApp → multi-device sync → TimelinesAI → command_center_inbox (automatico)
```

Insight chiave: anche i messaggi inviati via Baileys vengono salvati in Supabase grazie al multi-device sync di WhatsApp.

## 1) Consultare messaggi recenti (staging — non processati)

```sql
SELECT id, from_name, contact_number, chat_name, body_text, snippet, date, direction, is_group_chat, has_attachments
FROM command_center_inbox
WHERE type = 'whatsapp'
ORDER BY date DESC
LIMIT 20;
```

## 2) Consultare messaggi processati (production)

### Per contatto (dato contact_id)
```sql
SELECT i.interaction_id, i.interaction_date, i.direction, i.summary, c.chat_name, c.is_group_chat
FROM interactions i
LEFT JOIN chats c ON i.chat_id = c.id
WHERE i.contact_id = '{CONTACT_UUID}'
  AND i.interaction_type = 'whatsapp'
ORDER BY i.interaction_date DESC;
```

### Per numero di telefono
```sql
-- Staging
SELECT id, from_name, contact_number, chat_name, body_text, date
FROM command_center_inbox
WHERE type = 'whatsapp' AND contact_number = '{PHONE}'
ORDER BY date DESC;

-- Production (trova contact_id prima)
SELECT c.contact_id, c.first_name, c.last_name
FROM contacts c
JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
WHERE cm.mobile = '{PHONE}';
-- Poi usa contact_id nella query interactions
```

### Trovare contact_id da un nome
```sql
SELECT c.contact_id, c.first_name, c.last_name, cm.mobile
FROM contacts c
LEFT JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
WHERE c.first_name ILIKE '%{NOME}%' OR c.last_name ILIKE '%{COGNOME}%';
```

## 3) Messaggi di una chat specifica

### Trovare chat
```sql
SELECT id, chat_name, is_group_chat, last_message_at
FROM chats
WHERE chat_name ILIKE '%{NOME_CHAT}%';
```

### Tutti i messaggi di una chat
```sql
SELECT i.interaction_id, i.interaction_date, i.direction, i.summary, c.first_name, c.last_name
FROM interactions i
LEFT JOIN contacts c ON i.contact_id = c.contact_id
WHERE i.chat_id = '{CHAT_UUID}'
ORDER BY i.interaction_date ASC;
```

## 4) Cercare messaggi per keyword

### Staging
```sql
SELECT id, from_name, contact_number, chat_name, body_text, date
FROM command_center_inbox
WHERE type = 'whatsapp' AND body_text ILIKE '%{KEYWORD}%'
ORDER BY date DESC;
```

### Production
```sql
SELECT i.interaction_id, i.interaction_date, i.summary, ch.chat_name
FROM interactions i
LEFT JOIN chats ch ON i.chat_id = ch.id
WHERE i.interaction_type = 'whatsapp' AND i.summary ILIKE '%{KEYWORD}%'
ORDER BY i.interaction_date DESC;
```

## 5) Chat di gruppo

### Tutti i gruppi
```sql
SELECT ch.id, ch.chat_name, ch.last_message_at,
  COUNT(DISTINCT cc.contact_id) as participant_count
FROM chats ch
LEFT JOIN contact_chats cc ON ch.id = cc.chat_id
WHERE ch.is_group_chat = true
GROUP BY ch.id, ch.chat_name, ch.last_message_at
ORDER BY ch.last_message_at DESC;
```

### Partecipanti di un gruppo (production — contact_chats)
```sql
SELECT c.contact_id, c.first_name, c.last_name, cm.mobile
FROM contact_chats cc
JOIN contacts c ON cc.contact_id = c.contact_id
LEFT JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
  AND cm.type IN ('WhatsApp', 'WhatsApp Group')
WHERE cc.chat_id = '{CHAT_UUID}';
```

### Partecipanti di un gruppo via TimelinesAI API (METODO PREFERITO)

L'API TimelinesAI restituisce TUTTI i membri del gruppo con nome e numero, anche chi non ha mai scritto.

**Step 1**: Trovare il TimelinesAI chat_id (campo `chat_jid` in staging, o `external_chat_id` in chats production)
```sql
-- Da staging
SELECT DISTINCT chat_jid, chat_name
FROM command_center_inbox
WHERE type = 'whatsapp' AND chat_name ILIKE '%{NOME_GRUPPO}%'
LIMIT 1;

-- Da production
SELECT id, chat_name, external_chat_id
FROM chats
WHERE chat_name ILIKE '%{NOME_GRUPPO}%';
```

**Step 2**: Chiamare TimelinesAI API
```bash
source /opt/openclaw.env

curl -sS "https://app.timelines.ai/integrations/api/chats/{TIMELINES_CHAT_ID}" \
  -H "Authorization: Bearer $TIMELINES_API_KEY" \
  -H "Content-Type: application/json"
```

**Risposta** (campo `data.group_members`):
```json
{
  "data": {
    "id": 50164075,
    "name": "I Capi",
    "is_group": true,
    "jid": "120363423986271945@g.us",
    "group_members": [
      {"name": "Katherine Manson", "phone": "+447971852682", "role": "Member", "chat_id": 23794436},
      {"name": "Paul Atefi", "phone": "+447827844026", "role": "Owner", "chat_id": 29270008},
      {"name": "Jennie (Alicia's Mum)", "phone": "+447766106934", "role": "Member", "chat_id": 49489421}
    ]
  }
}
```

Usa `group_members[].phone` per ottenere i numeri di TUTTI i partecipanti.

### Partecipanti di un gruppo (staging fallback)

Se l'API TimelinesAI non e' disponibile, cerca i messaggi in staging (mostra solo chi ha scritto):

```sql
SELECT DISTINCT contact_number, from_name
FROM command_center_inbox
WHERE type = 'whatsapp' AND chat_name ILIKE '%{NOME_GRUPPO}%'
ORDER BY from_name;
```

Poi per associare al CRM:
```sql
SELECT c.contact_id, c.first_name, c.last_name, cm.mobile
FROM contacts c
LEFT JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
WHERE c.first_name ILIKE '%{FROM_NAME}%' OR c.last_name ILIKE '%{FROM_NAME}%';
```

### Chat di un contatto
```sql
SELECT ch.id, ch.chat_name, ch.is_group_chat, ch.last_message_at
FROM chats ch
JOIN contact_chats cc ON ch.id = cc.chat_id
WHERE cc.contact_id = '{CONTACT_UUID}'
ORDER BY ch.last_message_at DESC;
```

## 6) Aggiungere numero telefono a un contatto

Quando trovi un numero da staging/gruppo che manca in `contact_mobiles`:

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_mobiles" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"contact_id":"{CONTACT_UUID}","mobile":"{PHONE}","type":"WhatsApp","is_primary":false}'
```

Tipi validi: `personal`, `work`, `other`, `WhatsApp`, `WhatsApp Group`

### Verificare se il numero e' gia' presente
```bash
source /opt/openclaw.env
# IMPORTANTE: il + va URL-encoded come %2B!
# Es: +447384967449 → %2B447384967449
curl -sS "${SUPABASE_URL}/rest/v1/contact_mobiles?mobile=eq.%2B{NUMERO_SENZA_PLUS}&select=mobile_id,contact_id,mobile,type,is_primary" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 7) Collegare contatto a chat di gruppo (contact_chats)

Quando sai che un contatto partecipa a un gruppo ma non c'e' in `contact_chats`:

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_chats" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"contact_id":"{CONTACT_UUID}","chat_id":"{CHAT_UUID}"}'
```

## 8) Allegati WhatsApp

```sql
-- Staging
SELECT id, from_name, contact_number, chat_name, date, attachments
FROM command_center_inbox
WHERE type = 'whatsapp' AND has_attachments = true
ORDER BY date DESC;

-- Dettaglio allegati
SELECT id, from_name, chat_name, jsonb_array_elements(attachments) as attachment
FROM command_center_inbox
WHERE type = 'whatsapp' AND has_attachments = true;
```

Formato allegati: `[{url, name, type, size}, ...]`
URL punta a TimelinesAI media API.

## 9) Statistiche WhatsApp

```sql
-- Totale in staging
SELECT COUNT(*) as total_staging FROM command_center_inbox WHERE type = 'whatsapp';

-- Totale in production
SELECT COUNT(*) as total_production FROM interactions WHERE interaction_type = 'whatsapp';

-- Top 10 contatti per volume messaggi
SELECT c.first_name, c.last_name, COUNT(i.interaction_id) as message_count
FROM contacts c
JOIN interactions i ON c.contact_id = i.contact_id
WHERE i.interaction_type = 'whatsapp'
GROUP BY c.contact_id, c.first_name, c.last_name
ORDER BY message_count DESC LIMIT 10;

-- Distribuzione sent/received
SELECT direction, COUNT(*) as count
FROM interactions WHERE interaction_type = 'whatsapp'
GROUP BY direction;

-- Gruppi vs 1-on-1
SELECT is_group_chat, COUNT(*) as chat_count FROM chats GROUP BY is_group_chat;
```

## 10) Gestione spam WhatsApp

### Verificare se un numero e' spam
```sql
SELECT * FROM whatsapp_spam WHERE mobile_number = '{PHONE}';

-- Con variazioni formato
SELECT * FROM whatsapp_spam
WHERE mobile_number IN ('+393456789012', '393456789012', '3456789012');
```

### Lista spam completa
```sql
SELECT mobile_number, count, category
FROM whatsapp_spam
ORDER BY count DESC;
```

## 11) Numeri WhatsApp di un contatto

```sql
SELECT cm.mobile, cm.type, cm.is_primary
FROM contact_mobiles cm
WHERE cm.contact_id = '{CONTACT_UUID}'
  AND cm.type IN ('WhatsApp', 'WhatsApp Group', 'personal')
ORDER BY cm.is_primary DESC;
```

## 12) Date range

```sql
-- Ultimi 7 giorni (staging)
SELECT * FROM command_center_inbox
WHERE type = 'whatsapp' AND date >= NOW() - INTERVAL '7 days'
ORDER BY date DESC;

-- Ultimi 30 giorni (production)
SELECT * FROM interactions
WHERE interaction_type = 'whatsapp' AND interaction_date >= NOW() - INTERVAL '30 days'
ORDER BY interaction_date DESC;

-- Range specifico
SELECT * FROM interactions
WHERE interaction_type = 'whatsapp'
  AND interaction_date BETWEEN '{DATA_INIZIO}' AND '{DATA_FINE}'
ORDER BY interaction_date DESC;
```

## 13) Invio messaggi via Baileys

### Controllare stato connessione
```bash
curl -s https://command-center-backend-production.up.railway.app/whatsapp/status
```
Risposte possibili: `connected`, `disconnected`, `connecting`, `qr_ready`

### Inviare messaggio testo (1-on-1)
```bash
curl -sS -X POST "https://command-center-backend-production.up.railway.app/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{"phone": "{PHONE}", "message": "{TESTO}"}'
```
Nota: il numero NON deve avere `+` ne' zero iniziale. Es: `393456789012` (non `+393456789012`)

### Inviare messaggio a gruppo
```bash
curl -sS -X POST "https://command-center-backend-production.up.railway.app/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "{GROUP_JID}", "message": "{TESTO}"}'
```
Formato JID gruppo: `123456789@g.us`

### Inviare media
```bash
curl -sS -X POST "https://command-center-backend-production.up.railway.app/whatsapp/send-media" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "{PHONE}",
    "caption": "{CAPTION}",
    "file": {"data": "{BASE64}", "mimetype": "{MIME}", "filename": "{FILENAME}"}
  }'
```

### Formato numeri per Baileys (JID)
| Tipo | Formato | Esempio |
|------|---------|---------|
| 1-on-1 | `{phone}@s.whatsapp.net` | `393456789012@s.whatsapp.net` |
| Gruppo | `{groupId}@g.us` | `123456789@g.us` |

### Funzioni Baileys disponibili
| Endpoint/Funzione | Scopo |
|-------------------|-------|
| `GET /whatsapp/status` | Stato connessione |
| `GET /whatsapp/qr-image` | QR code per pairing |
| `POST /whatsapp/send` | Invio testo |
| `POST /whatsapp/send-media` | Invio media |
| `POST /whatsapp/logout` | Disconnetti e cancella sessione |
| `isRegistered(phone)` | Verifica se numero ha WhatsApp |
| `fetchAllGroups()` | Lista gruppi |
| `findGroupByName(name)` | Cerca gruppo per nome |
| `verifyWhatsAppNumbers(phones[])` | Verifica bulk numeri |
| `createGroup(name, participants[])` | Crea gruppo |

## 14) TimelinesAI API (accesso diretto)

TimelinesAI e' il provider WhatsApp (ricezione). L'API REST permette di accedere a dati che Supabase NON ha:
- Numeri telefono di TUTTI i partecipanti di un gruppo (anche chi non ha mai scritto)
- Storico messaggi completo di qualsiasi chat
- Ricerca chat per nome o numero
- Stato account WhatsApp

**Base URL**: `https://app.timelines.ai/integrations/api`
**Auth**: `Authorization: Bearer $TIMELINES_API_KEY`

### 14a) Cercare una chat per nome

```bash
source /opt/openclaw.env

# Lista chat (paginata, default 50)
curl -sS "https://app.timelines.ai/integrations/api/chats?limit=50&offset=0" \
  -H "Authorization: Bearer $TIMELINES_API_KEY"
```

Risposta: `data.chats[]` — array di chat con `id`, `name`, `phone`, `jid`, `is_group`, `group_members[]`

NOTA: non c'e' filtro per nome nell'API. Per trovare una chat specifica:
1. Cerca il `chat_jid` da staging: `SELECT DISTINCT chat_jid, chat_name FROM command_center_inbox WHERE type='whatsapp' AND chat_name ILIKE '%{NOME}%' LIMIT 1`
2. Oppure `external_chat_id` da production: `SELECT external_chat_id FROM chats WHERE chat_name ILIKE '%{NOME}%'`
3. Poi chiama `GET /chats/{id}` con quell'ID

### 14b) Dettagli chat (inclusi partecipanti gruppo)

```bash
source /opt/openclaw.env

curl -sS "https://app.timelines.ai/integrations/api/chats/{TIMELINES_CHAT_ID}" \
  -H "Authorization: Bearer $TIMELINES_API_KEY"
```

Risposta chiave per gruppi:
```json
{
  "data": {
    "id": 50164075,
    "name": "I Capi",
    "jid": "120363423986271945@g.us",
    "is_group": true,
    "group_members": [
      {"name": "Katherine Manson", "phone": "+447971852682", "role": "Member", "chat_id": 23794436},
      {"name": "Paul Atefi", "phone": "+447827844026", "role": "Owner", "chat_id": 29270008}
    ]
  }
}
```

`group_members[].phone` = numero di OGNI partecipante
`group_members[].chat_id` = ID della chat 1-on-1 con quel partecipante su TimelinesAI

Per chat 1-on-1, il campo `phone` nell'oggetto principale contiene il numero del contatto.

### 14c) Storico messaggi di una chat

```bash
source /opt/openclaw.env

# Ultimi messaggi (piu' recenti prima)
curl -sS "https://app.timelines.ai/integrations/api/chats/{TIMELINES_CHAT_ID}/messages?limit=20" \
  -H "Authorization: Bearer $TIMELINES_API_KEY"
```

Risposta: `data.messages[]` — ogni messaggio ha:
- `uid` — ID unico messaggio
- `sender_phone` — numero mittente (con +)
- `sender_name` — nome mittente
- `text` — testo messaggio
- `timestamp` — data/ora
- `from_me` — true se inviato da Simone
- `has_attachment` — true se ha allegato
- `attachment_url` — URL allegato (se presente)

### 14d) Trovare il numero di un contatto da una chat 1-on-1

Se conosci il nome ma non il numero:
1. Cerca la chat in staging o production per trovare il TimelinesAI chat_id
2. Chiama `GET /chats/{id}`
3. Per chat 1-on-1: il numero e' in `data.phone`
4. Per gruppo: cerca in `data.group_members[]` per nome

### 14e) Inviare messaggio via TimelinesAI API

```bash
source /opt/openclaw.env

# Invio per numero di telefono
curl -sS -X POST "https://app.timelines.ai/integrations/api/messages" \
  -H "Authorization: Bearer $TIMELINES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+447766106934",
    "text": "Ciao!",
    "whatsapp_account_id": "447597685011@s.whatsapp.net"
  }'

# Invio a chat specifica (per ID)
curl -sS -X POST "https://app.timelines.ai/integrations/api/chats/{TIMELINES_CHAT_ID}/messages" \
  -H "Authorization: Bearer $TIMELINES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Ciao!"}'
```

NOTA: preferire Baileys (sezione 13) per invio — e' gratuito. TimelinesAI potrebbe avere limiti.

### 14f) Stato account WhatsApp

```bash
source /opt/openclaw.env

curl -sS "https://app.timelines.ai/integrations/api/whatsapp_accounts" \
  -H "Authorization: Bearer $TIMELINES_API_KEY"
```

Risposta: `data.whatsapp_accounts[]` — status (`active`/`disconnected`), phone, owner_name.
Account Simone: `447597685011@s.whatsapp.net`

### 14g) Labels su chat

```bash
source /opt/openclaw.env

# Leggere labels
curl -sS "https://app.timelines.ai/integrations/api/chats/{TIMELINES_CHAT_ID}/labels" \
  -H "Authorization: Bearer $TIMELINES_API_KEY"

# Aggiungere labels
curl -sS -X POST "https://app.timelines.ai/integrations/api/chats/{TIMELINES_CHAT_ID}/labels" \
  -H "Authorization: Bearer $TIMELINES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"labels": ["VIP", "Deal"]}'
```

### 14h) Chiudere/riaprire una chat

```bash
source /opt/openclaw.env

# Chiudere
curl -sS -X PATCH "https://app.timelines.ai/integrations/api/chats/{TIMELINES_CHAT_ID}" \
  -H "Authorization: Bearer $TIMELINES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"closed": true}'

# Riaprire
curl -sS -X PATCH "https://app.timelines.ai/integrations/api/chats/{TIMELINES_CHAT_ID}" \
  -H "Authorization: Bearer $TIMELINES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"closed": false}'
```

### 14i) Workflow: controllare partecipanti gruppo vs CRM

Quando Simone chiede "chi c'e' nel gruppo X? chi manca dal CRM?" segui questi step MECCANICAMENTE:

**Step 1**: Trova TimelinesAI chat_id
```bash
source /opt/openclaw.env
curl -sS "${SUPABASE_URL}/rest/v1/command_center_inbox?type=eq.whatsapp&chat_name=ilike.*{NOME_GRUPPO}*&select=chat_jid,chat_name&limit=1" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

**Step 2**: Chiama TimelinesAI API per ottenere TUTTI i membri
```bash
curl -sS "https://app.timelines.ai/integrations/api/chats/{CHAT_ID}" \
  -H "Authorization: Bearer $TIMELINES_API_KEY"
```
Salva `data.group_members[]`. Escludi Simone Cimminelli (+447597685011) dal report.

**Step 3**: Per OGNI membro, controlla se il numero esiste in contact_mobiles

ATTENZIONE: il `+` nei numeri va URL-encoded come `%2B`, altrimenti Supabase lo interpreta come spazio!
```bash
# Ripeti per OGNI numero (uno alla volta!)
# IMPORTANTE: sostituire + con %2B nel numero! Es: +447384967449 → %2B447384967449
curl -sS "${SUPABASE_URL}/rest/v1/contact_mobiles?mobile=eq.%2B{NUMERO_SENZA_PLUS}&select=mobile_id,contact_id,mobile" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```
Esempio: per `+447384967449`:
```bash
curl -sS "${SUPABASE_URL}/rest/v1/contact_mobiles?mobile=eq.%2B447384967449&select=mobile_id,contact_id,mobile" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```
- Se ritorna `[]` (array vuoto) → numero NON salvato
- Se ritorna un oggetto con dati → numero GIA' salvato, prendi il `contact_id`

**Step 4**: Per OGNI membro, controlla se il nome esiste in contacts
```bash
# Cerca per nome (split first_name / last_name se possibile)
curl -sS "${SUPABASE_URL}/rest/v1/contacts?or=(first_name.ilike.*{FIRST_NAME}*,last_name.ilike.*{LAST_NAME}*)&select=contact_id,first_name,last_name" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```
- Se ritorna `[]` → contatto NON nel CRM
- Se ritorna risultati → contatto nel CRM

**Step 5**: Componi report con 3 colonne:

| Contatto | Nel CRM | Numero Salvato |
|---|---|---|
| Nome Cognome | Si/No | Si (+numero) / No |

**REGOLE:**
- NON includere Simone nel report
- NON assumere — esegui OGNI query
- Se una query fallisce, mostra l'errore e riprova
- Controlla OGNI membro singolarmente, non fare assunzioni da risultati di altri

## Schema reference (tabelle principali)

### command_center_inbox (staging — filtro `type = 'whatsapp'`)
| Campo | Tipo | Note |
|-------|------|------|
| id | UUID PK | |
| type | TEXT | `'whatsapp'` |
| from_name, first_name, last_name | TEXT | Info mittente |
| contact_number | TEXT | Numero telefono (es. `+447971852682`) |
| chat_id | TEXT | Identificativo chat (esterno TimelinesAI) |
| chat_jid | TEXT | WhatsApp JID (es. `123456@s.whatsapp.net`) |
| chat_name | TEXT | Nome visualizzato chat |
| is_group_chat | BOOLEAN | True per gruppi |
| body_text, snippet | TEXT | Contenuto messaggio |
| date | TIMESTAMPTZ | Timestamp messaggio |
| direction | TEXT | `'sent'` / `'received'` |
| message_uid | TEXT | ID unico da TimelinesAI |
| receiver | TEXT | Account WhatsApp ricevente |
| has_attachments | BOOLEAN | |
| attachments | JSONB | `[{url, name, type, size}, ...]` |

### chats (production)
| Campo | Tipo | Note |
|-------|------|------|
| id | UUID PK | |
| chat_name | TEXT | Nome chat/gruppo |
| external_id | TEXT | ID esterno TimelinesAI |
| external_chat_id | TEXT | Chat ID esterno |
| is_group_chat | BOOLEAN | True per gruppi |
| baileys_jid | TEXT | WhatsApp JID per Baileys |
| last_message_at | TIMESTAMPTZ | |
| category | TEXT | |
| chat_type | TEXT | |

### contact_chats
| Campo | Tipo | Note |
|-------|------|------|
| id | UUID PK | |
| contact_id | UUID FK → contacts | |
| chat_id | UUID FK → chats | |
| UNIQUE(contact_id, chat_id) | | |

### interactions (filtro `interaction_type = 'whatsapp'`)
| Campo | Tipo | Note |
|-------|------|------|
| interaction_id | UUID PK | |
| contact_id | UUID FK → contacts | |
| interaction_type | ENUM | `'whatsapp'` |
| direction | ENUM | `'sent'`, `'received'`, `'interactive'` |
| summary | TEXT | Contenuto messaggio |
| chat_id | UUID FK → chats | Link alla chat |
| interaction_date | TIMESTAMPTZ | |
| external_interaction_id | TEXT | message_uid da TimelinesAI |

### whatsapp_spam
| Campo | Tipo | Note |
|-------|------|------|
| id | UUID PK | |
| mobile_number | TEXT UNIQUE | Numero bloccato |
| count | INTEGER | Volte bloccato |
| category | TEXT | Opzionale |

### contact_mobiles
| Campo | Tipo | Note |
|-------|------|------|
| mobile_id | UUID PK | |
| contact_id | UUID FK → contacts | |
| mobile | TEXT | Numero telefono |
| type | contact_point_type | `'personal'`, `'work'`, `'WhatsApp'`, `'WhatsApp Group'` |
| is_primary | BOOLEAN | |

## Troubleshooting

Per diagnostica completa, debug Baileys/TimelinesAI, e guide passo-passo: vedi `troubleshooting/whatsapp.md`

Quick checks:
- Spam? `SELECT * FROM whatsapp_spam WHERE mobile_number = '...';`
- In staging? `SELECT * FROM command_center_inbox WHERE type = 'whatsapp' AND contact_number = '...' ORDER BY created_at DESC LIMIT 5;`
- Baileys connesso? `curl https://command-center-backend-production.up.railway.app/whatsapp/status`
- Duplicati? `SELECT external_interaction_id, COUNT(*) FROM interactions WHERE interaction_type = 'whatsapp' AND external_interaction_id IS NOT NULL GROUP BY external_interaction_id HAVING COUNT(*) > 1;`

## Log operativo
Ogni azione su WhatsApp deve finire in `ops-log.md`:
- timestamp
- azione (ricerca, invio messaggio, analisi)
- risultato sintetico

## Endpoint aggiuntivi Railway

### POST /whatsapp/verify-numbers
Verifica se numeri di telefono hanno account WhatsApp attivo.

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/whatsapp/verify-numbers" \
  -H "Content-Type: application/json" \
  -d '{"phones": ["+393331234567", "+447766106934"]}'
```

### GET /whatsapp/find-group
Cerca un gruppo WhatsApp per nome.

```bash
curl -sS "${COMMAND_CENTER_BACKEND_URL}/whatsapp/find-group?name={NOME_GRUPPO}"
```

### POST /whatsapp/sync-groups
Sincronizza tutti i gruppi WhatsApp con Supabase.

```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/whatsapp/sync-groups"
```
