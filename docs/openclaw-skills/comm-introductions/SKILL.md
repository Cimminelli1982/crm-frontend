---
name: comm-introductions
description: "Manage introductions between contacts with status tracking"
version: 2.0.0
category: communication
---

# skills/introductions.md — Gestione Introduzioni

Obiettivo: creare, gestire e eseguire introduzioni tra contatti via email o WhatsApp.

## 0) Prerequisiti
- `source /opt/openclaw.env`
- Variabili: `SUPABASE_URL`, `SUPABASE_KEY`, `COMMAND_CENTER_BACKEND_URL`
- Tabelle: `introductions`, `introduction_contacts`, `contacts`, `contact_emails`, `contact_mobiles`

### Schema introduzioni
| Campo | Tipo | Note |
|---|---|---|
| introduction_id | uuid PK | auto |
| introduction_date | date | data introduzione |
| introduction_tool | enum | email, whatsapp, in person, other |
| category | enum | Karma Points, Dealflow, Portfolio Company |
| text | text | note/descrizione |
| status | enum | Requested, Promised, Done & Dust, Done, but need to monitor, Aborted |
| email_thread_id | uuid FK | se intro fatta via email |
| chat_id | uuid FK | se intro fatta via WhatsApp |
| whatsapp_group_jid | text | JID gruppo Baileys |
| whatsapp_group_name | text | nome gruppo |
| created_at | timestamptz | auto |

### Schema introduction_contacts
| Campo | Tipo | Note |
|---|---|---|
| introduction_contact_id | uuid PK | auto |
| introduction_id | uuid FK | link a introduzione |
| contact_id | uuid FK | link a contatto |
| role | enum | introducer, introducee |
| UNIQUE(introduction_id, contact_id) |

---

## 1) Consultare introduzioni

### Ultime 10 (con contatti)
```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/introductions?order=introduction_date.desc&limit=10&select=introduction_id,introduction_date,introduction_tool,category,text,status,introduction_contacts(contact_id,role,contacts(first_name,last_name))" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Per status
```bash
# Status validi: Requested, Promised, Done & Dust, Done, but need to monitor, Aborted
curl -sS "${SUPABASE_URL}/rest/v1/introductions?status=eq.Requested&order=introduction_date.desc&select=introduction_id,introduction_date,category,text,status,introduction_contacts(contact_id,role,contacts(first_name,last_name))" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Inbox (Requested + Promised)
```bash
curl -sS "${SUPABASE_URL}/rest/v1/introductions?status=in.(Requested,Promised)&order=introduction_date.desc&select=introduction_id,introduction_date,category,text,status,introduction_contacts(contact_id,role,contacts(first_name,last_name))" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Per contatto specifico
```bash
# Trova introduzioni di un contatto
curl -sS "${SUPABASE_URL}/rest/v1/introduction_contacts?contact_id=eq.{CONTACT_ID}&select=introduction_id,role,introductions(introduction_id,introduction_date,status,category,text,introduction_tool)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Dettaglio singola introduzione
```bash
curl -sS "${SUPABASE_URL}/rest/v1/introductions?introduction_id=eq.{INTRO_ID}&select=*,introduction_contacts(contact_id,role,contacts(contact_id,first_name,last_name))" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

---

## 2) Creare introduzione

### Step 1: Trova i contatti da introdurre
```bash
source /opt/openclaw.env

# Cerca per nome (vedi skills/crm-operations.md sezione 10)
curl -sS "${SUPABASE_URL}/rest/v1/contacts?or=(first_name.ilike.*Mario*,last_name.ilike.*Mario*)&select=contact_id,first_name,last_name,category" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Step 2: Crea record introduzione
```bash
curl -sS -X POST "${SUPABASE_URL}/rest/v1/introductions" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "introduction_date": "2026-03-08",
    "introduction_tool": "email",
    "category": "Karma Points",
    "text": "Mario vuole conoscere Luigi per parlare di startup",
    "status": "Requested"
  }'
```

Salvare il `introduction_id` dalla risposta.

Categorie valide: `Karma Points, Dealflow, Portfolio Company`
Tool validi: `email, whatsapp, in person, other`
Status validi: `Requested, Promised, Done & Dust, Done, but need to monitor, Aborted`

### Step 3: Linka i contatti
```bash
# Entrambi i contatti introdotti sono "introducee"
curl -sS -X POST "${SUPABASE_URL}/rest/v1/introduction_contacts" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"introduction_id": "{INTRO_ID}", "contact_id": "{CONTACT_1_ID}", "role": "introducee"}'

curl -sS -X POST "${SUPABASE_URL}/rest/v1/introduction_contacts" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"introduction_id": "{INTRO_ID}", "contact_id": "{CONTACT_2_ID}", "role": "introducee"}'
```

NOTA: se c'e' un introducer (chi ha chiesto a Simone di fare l'intro), aggiungilo con role "introducer".

---

## 3) Aggiornare introduzione

### Cambiare status
```bash
source /opt/openclaw.env

curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/introductions?introduction_id=eq.{INTRO_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"status": "Done & Dust"}'
```

Transizioni tipiche:
- Requested → Promised (qualcuno ha promesso di fare l'intro)
- Requested → Done & Dust (intro fatta in un colpo)
- Promised → Done & Dust (intro completata)
- Requested/Promised → Done, but need to monitor (fatta ma da seguire)
- Qualsiasi → Aborted (annullata)

### Aggiornare tool/category/note
```bash
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/introductions?introduction_id=eq.{INTRO_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"introduction_tool": "whatsapp", "category": "Dealflow", "text": "Nota aggiornata"}'
```

---

## 4) Fare introduzione via Email

### Step 1: Trova le email dei contatti
```bash
source /opt/openclaw.env

# Email del contatto 1
curl -sS "${SUPABASE_URL}/rest/v1/contact_emails?contact_id=eq.{CONTACT_1_ID}&select=email_id,email,type,is_primary&order=is_primary.desc" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Email del contatto 2
curl -sS "${SUPABASE_URL}/rest/v1/contact_emails?contact_id=eq.{CONTACT_2_ID}&select=email_id,email,type,is_primary&order=is_primary.desc" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

Preferire email con `is_primary=true`. Escludere tipo "WhatsApp Group".

### Step 2: Componi e invia email
```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/email/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["mario@example.com", "luigi@example.com"],
    "subject": "Introduction: Mario <> Luigi",
    "textBody": "Hi Mario, Hi Luigi,\n\nI wanted to introduce you two.\n\nMario — [breve descrizione di Mario]\nLuigi — [breve descrizione di Luigi]\n\n[motivo della intro]\n\nI will leave it to you two to connect.\n\nBest,\nSimone",
    "htmlBody": null
  }'
```

NESSUN header di autenticazione richiesto per il backend.

Campi richiesti: `to` (array), `subject`, `textBody`
Campi opzionali: `cc`, `bcc`, `htmlBody`, `attachments`

### Step 3: Aggiorna l'introduzione
```bash
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/introductions?introduction_id=eq.{INTRO_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"status": "Done, but need to monitor", "introduction_tool": "email"}'
```

### Template Email Italiano
```
Ciao [Nome1], Ciao [Nome2],

Vi volevo presentare.

[Nome1] — [ruolo/descrizione breve]
[Nome2] — [ruolo/descrizione breve]

[Motivo della presentazione / contesto]

Vi lascio in contatto.

A presto,
Simone
```

### Template Email Inglese
```
Hi [Name1], Hi [Name2],

I wanted to introduce you two.

[Name1] — [brief role/description]
[Name2] — [brief role/description]

[Reason for the introduction / context]

I will leave it to you two to connect.

Best,
Simone
```

---

## 5) Fare introduzione via WhatsApp

### Step 1: Trova i numeri dei contatti
```bash
source /opt/openclaw.env

# Numeri del contatto 1
curl -sS "${SUPABASE_URL}/rest/v1/contact_mobiles?contact_id=eq.{CONTACT_1_ID}&select=mobile_id,mobile,type,is_primary&order=is_primary.desc" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Numeri del contatto 2
curl -sS "${SUPABASE_URL}/rest/v1/contact_mobiles?contact_id=eq.{CONTACT_2_ID}&select=mobile_id,mobile,type,is_primary&order=is_primary.desc" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

Preferire: `is_primary=true`, tipo "WhatsApp" o "personal". Escludere "WhatsApp Group".

### Step 2: Crea gruppo WhatsApp
```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/whatsapp/create-group" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mario <> Luigi",
    "phones": ["+393331234567", "+393339876543"],
    "contactIds": ["{CONTACT_1_ID}", "{CONTACT_2_ID}"]
  }'
```

Risposta:
```json
{
  "success": true,
  "groupJid": "120363xxx@g.us",
  "groupName": "Mario <> Luigi",
  "chatId": "uuid-chat-supabase",
  "participants": 2,
  "invalidPhones": []
}
```

Salvare: `groupJid`, `chatId`, `groupName`.

NOTA: il formato nome gruppo e' "`NomeContatto1 <> NomeContatto2`" (nome di battesimo).
NOTA: se `invalidPhones` non e' vuoto, quei numeri non hanno WhatsApp — segnalare a Simone.

### Step 3: Invia messaggio introduttivo nel gruppo
```bash
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "{GROUP_JID}",
    "message": "Ciao Mario, ciao Luigi! Vi presento. Mario — [desc]. Luigi — [desc]. [motivo]. Vi lascio in contatto!"
  }'
```

NOTA: per il campo `chat_id` usare il `groupJid` dalla risposta create-group (es. 120363xxx@g.us).

### Step 4: Aggiorna l'introduzione
```bash
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/introductions?introduction_id=eq.{INTRO_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "status": "Done, but need to monitor",
    "introduction_tool": "whatsapp",
    "chat_id": "{CHAT_ID_SUPABASE}",
    "whatsapp_group_jid": "{GROUP_JID}",
    "whatsapp_group_name": "{GROUP_NAME}"
  }'
```

---

## 6) Collegare comunicazione esistente a introduzione

### Linkare email thread
```bash
source /opt/openclaw.env

# Cerca email thread
curl -sS "${SUPABASE_URL}/rest/v1/email_threads?subject=ilike.*introduction*Mario*&select=email_thread_id,subject,thread_id&order=created_at.desc&limit=5" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Collega
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/introductions?introduction_id=eq.{INTRO_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"email_thread_id": "{EMAIL_THREAD_ID}"}'
```

### Linkare chat WhatsApp
```bash
# Cerca chat
curl -sS "${SUPABASE_URL}/rest/v1/chats?chat_name=ilike.*Mario*Luigi*&select=id,chat_name,is_group_chat" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Collega
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/introductions?introduction_id=eq.{INTRO_ID}" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"chat_id": "{CHAT_ID}"}'
```

---

## 7) Eliminare contatto da introduzione

```bash
source /opt/openclaw.env

curl -sS -X DELETE "${SUPABASE_URL}/rest/v1/introduction_contacts?introduction_id=eq.{INTRO_ID}&contact_id=eq.{CONTACT_ID}" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

---

## 8) Workflow completi

### A) Registrare intro gia' avvenuta
Quando Simone dice "ho presentato Mario a Luigi ieri via email":
1. Cerca i 2 contatti (sezione 2 step 1)
2. Crea introduzione con status "Done & Dust", tool appropriato, data passata (sezione 2 step 2)
3. Linka i contatti come introducee (sezione 2 step 3)
4. Se c'e' un email thread correlato, linkalo (sezione 6)

### B) Intro via email da zero
Quando Simone chiede "presenta Mario a Luigi via email":
1. Cerca i 2 contatti
2. Crea introduzione con status "Requested" (sezione 2)
3. Linka i contatti come introducee
4. Trova le email dei contatti (sezione 4 step 1)
5. Mostra a Simone il draft dell'email con template (sezione 4, template IT o EN)
6. **CHIEDI CONFERMA** prima di inviare
7. Su conferma, invia email (sezione 4 step 2)
8. Aggiorna status a "Done, but need to monitor" (sezione 4 step 3)

### C) Intro via WhatsApp da zero
Quando Simone chiede "presenta Mario a Luigi su WhatsApp":
1. Cerca i 2 contatti
2. Crea introduzione con status "Requested" (sezione 2)
3. Linka i contatti come introducee
4. Trova i numeri dei contatti (sezione 5 step 1)
5. **CHIEDI CONFERMA** prima di creare il gruppo — mostra i numeri trovati
6. Su conferma, crea gruppo WhatsApp (sezione 5 step 2)
7. Mostra a Simone il messaggio proposto per il gruppo
8. **CHIEDI CONFERMA** per inviare il messaggio
9. Invia messaggio (sezione 5 step 3)
10. Aggiorna intro con status + chat_id + jid (sezione 5 step 4)

### D) Cambiare status introduzione
Quando Simone dice "l'intro con Mario e' fatta" o "segna come done":
1. Cerca l'introduzione per contatto o per le ultime (sezione 1)
2. Se ambiguo, chiedi quale
3. Aggiorna status (sezione 3)

REGOLE:
- **SEMPRE chiedere conferma** prima di inviare email o creare gruppi WhatsApp
- Se manca il numero/email di un contatto, segnalarlo a Simone (non inventare)
- Per email: soggetto formato "Introduction: Nome1 <> Nome2"
- Per WhatsApp: nome gruppo formato "Nome1 <> Nome2"
- Se Simone non specifica tool, chiedere: "Via email o WhatsApp?"
- Se non specifica category, chiedere: "Karma Points, Dealflow o Portfolio Company?"
- Dopo ogni operazione, confermare con riepilogo

## Log operativo
Ogni operazione va in `ops-log.md`:
- timestamp
- azione: create_introduction / update_introduction / send_intro_email / create_intro_whatsapp_group
- dettagli: contatti coinvolti, status, tool
