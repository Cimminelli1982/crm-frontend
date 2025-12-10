# WhatsApp Command Center Integration

## Overview

Integrazione di WhatsApp nel Command Center per avere un'unica interfaccia di staging dove l'utente può:
- Vedere email e WhatsApp insieme (tab "All") o separati
- Decidere per ogni messaggio cosa fare: processare, spam, skip
- Pulire i dati, aggiungere deals, tasks, etc.

## Architettura

### Flusso Attuale (Email)

```
Fastmail JMAP → Railway Backend → command_center_inbox
                                        ↓
                                 Command Center UI
                                        ↓
                                 User clicca "Done"
                                        ↓
                                 saveAndArchive()
                                 - Crea email_thread
                                 - Crea email record
                                 - Crea interactions
                                 - Archivia in Fastmail
                                 - Elimina da staging
```

### Flusso Nuovo (WhatsApp)

```
TimelinesAI Webhook → Railway Backend → command_center_inbox (type='whatsapp')
                                              ↓
                                       Command Center UI
                                              ↓
                                       User clicca "Done"
                                              ↓
                                       processWhatsApp()
                                       - INSERT in whatsapp_inbox con start_trigger=true
                                       - Trigger PostgreSQL esistente processa
                                       - Elimina da staging
```

### Flusso Legacy (Bypass Command Center)

Il trigger `process_whatsapp_message` su `whatsapp_inbox` rimane attivo. Se in futuro serve processare WhatsApp automaticamente senza staging:

```
TimelinesAI → Edge Function → whatsapp_inbox (start_trigger=true) → Trigger processa
```

---

## Database Changes

### 1. Nuove colonne su `command_center_inbox`

```sql
-- Tipo messaggio
ALTER TABLE command_center_inbox
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'email'
CHECK (type IN ('email', 'whatsapp'));

-- Campi specifici WhatsApp
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS chat_id TEXT;
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS chat_name TEXT;
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS chat_jid TEXT;
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS is_group_chat BOOLEAN DEFAULT false;
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'received';
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS message_uid TEXT;
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE command_center_inbox ADD COLUMN IF NOT EXISTS receiver TEXT;

-- Indice per query per tipo
CREATE INDEX IF NOT EXISTS idx_command_center_inbox_type ON command_center_inbox(type);
```

### 2. Mapping campi Email vs WhatsApp

| Campo | Email | WhatsApp |
|-------|-------|----------|
| `type` | 'email' | 'whatsapp' |
| `from_name` | nome mittente | CONCAT(first_name, ' ', last_name) |
| `from_email` | email mittente | NULL |
| `contact_number` | NULL | numero telefono |
| `subject` | subject email | chat_name (o NULL) |
| `body_text` | corpo email | messaggio |
| `snippet` | snippet | LEFT(messaggio, 100) |
| `thread_id` | gmail thread_id | NULL |
| `chat_id` | NULL | TimelinesAI chat_id |
| `chat_jid` | NULL | WhatsApp JID |
| `date` | data email | message_timestamp |
| `direction` | calcolato da from | sent/received |
| `attachments` | [{blobId, name, type, size}] | [{url, filename, type, size}] |
| `fastmail_id` | fastmail message ID | NULL |
| `message_uid` | NULL | TimelinesAI message_id |
| `is_group_chat` | false | true/false |
| `first_name` | NULL | first_name contatto |
| `last_name` | NULL | last_name contatto |
| `receiver` | NULL | numero ricevente (mio) |

---

## TimelinesAI Webhook Format

### Endpoint
```
POST https://crm-agent-api-production.up.railway.app/whatsapp-webhook
```

### Payload (Non-Aggregated)

```json
{
  "event_type": "message:received",
  "whatsapp_account": {
    "phone": "+447597685011",
    "full_name": "Account Owner",
    "email": "owner@email.com"
  },
  "chat": {
    "chat_id": "23794466",
    "full_name": "Mario Rossi",
    "is_group": false,
    "is_new_chat": false,
    "phone": "+393331234567",
    "chat_url": "https://app.timelines.ai/chat/..."
  },
  "message": {
    "message_id": "unique-message-id",
    "direction": "received",
    "timestamp": "2025-01-15T10:30:00Z",
    "text": "Ciao, come stai?",
    "sender": {
      "full_name": "Mario Rossi",
      "phone": "+393331234567"
    },
    "recipient": {
      "full_name": "Account Owner",
      "phone": "+447597685011"
    },
    "attachment": {
      "temporary_download_url": "https://...",
      "filename": "document.pdf",
      "size": 12345,
      "mimetype": "application/pdf"
    }
  }
}
```

---

## Railway Backend Changes

### File: `crm-agent-service/app/main.py`

Aggiungere endpoint:

```python
@app.post("/whatsapp-webhook")
async def whatsapp_webhook(request: Request):
    """
    Riceve webhook da TimelinesAI e salva in command_center_inbox per staging.
    """
    try:
        payload = await request.json()

        # Log per debug
        print(f"WhatsApp webhook received: {payload.get('event_type')}")

        # Solo messaggi, non eventi chat
        event_type = payload.get('event_type', '')
        if not event_type.startswith('message:'):
            return {"success": True, "skipped": "not a message event"}

        message = payload.get('message', {})
        chat = payload.get('chat', {})
        whatsapp_account = payload.get('whatsapp_account', {})

        if not message:
            return {"success": True, "skipped": "no message data"}

        # Estrai dati contatto
        direction = message.get('direction', 'received')
        if direction == 'sent':
            contact_phone = message.get('recipient', {}).get('phone') or chat.get('phone')
            contact_name = message.get('recipient', {}).get('full_name') or chat.get('full_name')
        else:
            contact_phone = message.get('sender', {}).get('phone') or chat.get('phone')
            contact_name = message.get('sender', {}).get('full_name') or chat.get('full_name')

        # Split nome
        name_parts = (contact_name or '').strip().split(' ', 1)
        first_name = name_parts[0] if name_parts else None
        last_name = name_parts[1] if len(name_parts) > 1 else None

        # Controlla spam
        if contact_phone:
            spam_check = supabase.table('whatsapp_spam').select('mobile_number').eq('mobile_number', contact_phone).execute()
            if spam_check.data:
                # Incrementa counter spam
                supabase.table('whatsapp_spam').update({
                    'counter': spam_check.data[0].get('counter', 0) + 1,
                    'last_modified_at': datetime.utcnow().isoformat()
                }).eq('mobile_number', contact_phone).execute()
                return {"success": True, "skipped": "spam number"}

        # Prepara attachment
        attachment = message.get('attachment')
        attachments_json = None
        has_attachments = False
        if attachment:
            has_attachments = True
            attachments_json = [{
                "url": attachment.get('temporary_download_url'),
                "name": attachment.get('filename'),
                "type": attachment.get('mimetype'),
                "size": attachment.get('size')
            }]

        # Inserisci in command_center_inbox
        record = {
            "type": "whatsapp",
            "from_name": contact_name,
            "contact_number": contact_phone,
            "first_name": first_name,
            "last_name": last_name,
            "subject": chat.get('full_name'),  # chat name come "subject"
            "body_text": message.get('text'),
            "snippet": (message.get('text') or '')[:100],
            "date": message.get('timestamp'),
            "direction": direction,
            "chat_id": str(chat.get('chat_id')),
            "chat_jid": str(chat.get('chat_id')),  # TimelinesAI usa chat_id come identificatore
            "chat_name": chat.get('full_name'),
            "is_group_chat": chat.get('is_group', False),
            "message_uid": message.get('message_id'),
            "receiver": whatsapp_account.get('phone'),
            "has_attachments": has_attachments,
            "attachments": attachments_json,
            "is_read": False
        }

        # Rimuovi campi None
        record = {k: v for k, v in record.items() if v is not None}

        result = supabase.table('command_center_inbox').insert(record).execute()

        return {"success": True, "id": result.data[0]['id'] if result.data else None}

    except Exception as e:
        print(f"WhatsApp webhook error: {str(e)}")
        return {"success": False, "error": str(e)}
```

### Configurazione TimelinesAI

1. Vai su TimelinesAI Dashboard → Settings → Webhooks
2. Aggiungi nuovo webhook:
   - URL: `https://crm-agent-api-production.up.railway.app/whatsapp-webhook`
   - Events: `message:received`, `message:sent`
   - Aggregation: "Don't aggregate" (singoli messaggi)

---

## Frontend Changes

### File: `src/pages/CommandCenterPage.js`

#### 1. Nuovi tab header

```javascript
const tabs = [
  { id: 'all', label: 'All', icon: FaInbox, count: emails.length + whatsappMessages.length },
  { id: 'email', label: 'Email', icon: FaEnvelope, count: emails.length },
  { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, count: whatsappMessages.length },
  { id: 'calendar', label: 'Calendar', icon: FaCalendar, count: 0 },
];
```

#### 2. Fetch unificato

```javascript
const fetchInbox = async () => {
  setLoading(true);

  let query = supabase.from('command_center_inbox').select('*');

  // Filtra per tipo se non "all"
  if (activeTab === 'email') {
    query = query.eq('type', 'email');
  } else if (activeTab === 'whatsapp') {
    query = query.eq('type', 'whatsapp');
  }
  // 'all' non filtra

  const { data, error } = await query.order('date', { ascending: false });

  if (!error) {
    setMessages(data || []);
    // Raggruppa per thread/chat
    const grouped = groupMessages(data || []);
    setThreads(grouped);
  }

  setLoading(false);
};
```

#### 3. Grouping intelligente

```javascript
const groupMessages = (messages) => {
  const groups = {};

  messages.forEach(msg => {
    // Usa thread_id per email, chat_jid per WhatsApp
    const groupKey = msg.type === 'email'
      ? (msg.thread_id || msg.id)
      : (msg.chat_jid || msg.id);

    if (!groups[groupKey]) {
      groups[groupKey] = {
        id: groupKey,
        type: msg.type,
        messages: [],
        latestMessage: msg
      };
    }
    groups[groupKey].messages.push(msg);
  });

  return Object.values(groups).sort((a, b) =>
    new Date(b.latestMessage.date) - new Date(a.latestMessage.date)
  );
};
```

#### 4. Render condizionale nel panel centrale

```javascript
{selectedThread && (
  selectedThread.type === 'email'
    ? <EmailThreadView thread={selectedThread} />
    : <WhatsAppChatView chat={selectedThread} />
)}
```

#### 5. Azione "Done" per WhatsApp

```javascript
const processWhatsApp = async () => {
  if (!selectedThread || selectedThread.type !== 'whatsapp') return;

  setSaving(true);

  try {
    for (const message of selectedThread.messages) {
      // Inserisci in whatsapp_inbox con start_trigger=true
      // Il trigger PostgreSQL esistente farà il processing
      const { error: insertError } = await supabase
        .from('whatsapp_inbox')
        .insert({
          first_name: message.first_name,
          last_name: message.last_name,
          contact_number: message.contact_number,
          direction: message.direction,
          is_group_chat: message.is_group_chat,
          chat_name: message.chat_name,
          chat_id: message.chat_id,
          chat_jid: message.chat_jid,
          message_timestamp: message.date,
          message_text: message.body_text,
          message_uid: message.message_uid,
          receiver: message.receiver,
          start_trigger: true,  // Attiva il trigger!
          // Attachment (se presente)
          attachment_type: message.attachments?.[0]?.type,
          attachment_url: message.attachments?.[0]?.url,
          attachment_filename: message.attachments?.[0]?.name,
          attachment_size: message.attachments?.[0]?.size,
        });

      if (insertError) throw insertError;

      // Elimina da staging
      await supabase
        .from('command_center_inbox')
        .delete()
        .eq('id', message.id);
    }

    toast.success('WhatsApp processed successfully');
    fetchInbox(); // Refresh

  } catch (error) {
    console.error('Process WhatsApp error:', error);
    toast.error('Failed to process WhatsApp');
  } finally {
    setSaving(false);
  }
};
```

#### 6. Handler "Done" unificato

```javascript
const handleDone = () => {
  if (!selectedThread) return;

  if (selectedThread.type === 'email') {
    handleDoneClick(); // Logica esistente per email
  } else {
    processWhatsApp(); // Nuova logica per WhatsApp
  }
};
```

---

## Panel Destro - Estrazione Contatti

### Funzione unificata

```javascript
const getContactsFromThread = (thread) => {
  if (!thread) return [];

  if (thread.type === 'email') {
    // Logica esistente: estrai da from_email, to_recipients, cc_recipients
    return extractEmailContacts(thread.messages);
  } else {
    // WhatsApp: estrai da contact_number
    const contacts = [];
    const seen = new Set();

    thread.messages.forEach(msg => {
      if (msg.contact_number && !seen.has(msg.contact_number)) {
        seen.add(msg.contact_number);
        contacts.push({
          phone: msg.contact_number,
          name: msg.from_name || `${msg.first_name || ''} ${msg.last_name || ''}`.trim(),
          first_name: msg.first_name,
          last_name: msg.last_name,
        });
      }
    });

    return contacts;
  }
};
```

### Lookup contatti esistenti

```javascript
// Per email: cerca per email
const { data: emailContacts } = await supabase
  .from('contact_emails')
  .select('contact_id, email, contacts(*)')
  .in('email', emailAddresses);

// Per WhatsApp: cerca per mobile
const { data: mobileContacts } = await supabase
  .from('contact_mobiles')
  .select('contact_id, mobile, contacts(*)')
  .in('mobile', phoneNumbers);
```

---

## Spam Handling

### Email Spam (esistente)
- Tabella: `emails_spam`
- Campo: `email`
- Azione: archivio in Fastmail + elimina da staging

### WhatsApp Spam (nuovo)
- Tabella: `whatsapp_spam` (già esiste)
- Campo: `mobile_number`
- Azione: elimina da staging (no archivio esterno)

```javascript
const handleAddToSpamWhatsApp = async (phoneNumber) => {
  // 1. Aggiungi a whatsapp_spam
  await supabase.from('whatsapp_spam').upsert({
    mobile_number: phoneNumber,
    counter: 1,
    created_at: new Date().toISOString(),
    last_modified_at: new Date().toISOString(),
  }, { onConflict: 'mobile_number' });

  // 2. Elimina tutti i messaggi da questo numero
  await supabase
    .from('command_center_inbox')
    .delete()
    .eq('type', 'whatsapp')
    .eq('contact_number', phoneNumber);

  toast.success(`${phoneNumber} added to spam`);
  fetchInbox();
};
```

---

## Testing Checklist

### Database
- [ ] Colonne aggiunte a `command_center_inbox`
- [ ] Indici creati
- [ ] Record di test inseriti

### Railway Backend
- [ ] Endpoint `/whatsapp-webhook` deployato
- [ ] Spam check funzionante
- [ ] Logging attivo

### TimelinesAI
- [ ] Webhook configurato con URL corretto
- [ ] Test webhook inviato e ricevuto

### Frontend
- [ ] Tab "All" mostra email + WhatsApp
- [ ] Tab "WhatsApp" mostra solo WhatsApp
- [ ] Selezione messaggio WA funziona
- [ ] Panel destro mostra contatti da numero
- [ ] "Done" processa correttamente
- [ ] "Spam" funziona per numeri

---

## File da Modificare

1. **Database**: Migration SQL
2. **Railway**: `crm-agent-service/app/main.py`
3. **Frontend**: `src/pages/CommandCenterPage.js` (dopo refactoring)

---

## Note Importanti

1. **Il trigger `process_whatsapp_message` su `whatsapp_inbox` rimane attivo** - quando facciamo "Done" su un WhatsApp, inseriamo in `whatsapp_inbox` con `start_trigger=true` e il trigger fa tutto il lavoro.

2. **Attachments WhatsApp hanno URL temporanei** (15 minuti) - se serve scaricarli permanentemente, bisogna farlo nel webhook Railway prima di salvare.

3. **Il refactoring del Command Center è in corso** - aspettare che finisca prima di implementare le modifiche frontend.

4. **TimelinesAI webhook URL**: `https://crm-agent-api-production.up.railway.app/whatsapp-webhook`
