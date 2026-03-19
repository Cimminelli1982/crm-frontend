---
name: troubleshooting-whatsapp
description: "Diagnostic guide for WhatsApp system issues"
version: 1.0.0
category: troubleshooting
---

# troubleshooting/whatsapp.md

Guida diagnostica completa per problemi con il sistema WhatsApp del CRM.

## Messaggio WhatsApp non appare nel CRM

### Checklist diagnostica (segui in ordine)

**1. Il numero e' spam?**
```sql
SELECT * FROM whatsapp_spam WHERE mobile_number = '{PHONE}';
-- Provare anche variazioni formato
SELECT * FROM whatsapp_spam
WHERE mobile_number IN ('+393456789012', '393456789012', '3456789012');
```
Se presente: il messaggio e' stato bloccato e il counter incrementato.

**2. Il webhook e' arrivato?**
- Controllare logs di `crm-agent-service` su Railway
- Cercare POST `/whatsapp-webhook` nei log
- Se nessun log: problema lato TimelinesAI (connessione persa?)

**3. E' in staging?**
```sql
SELECT id, from_name, contact_number, chat_name, body_text, date, created_at
FROM command_center_inbox
WHERE type = 'whatsapp'
  AND contact_number = '{PHONE}'
ORDER BY created_at DESC LIMIT 10;
```
Se presente: il messaggio c'e' ma non e' stato processato (l'utente non ha cliccato "Done").

**4. E' gia' in production?**
```sql
SELECT i.interaction_id, i.interaction_date, i.summary, ch.chat_name
FROM interactions i
LEFT JOIN chats ch ON i.chat_id = ch.id
WHERE i.interaction_type = 'whatsapp'
  AND i.external_interaction_id = '{MESSAGE_UID}';
```

**5. TimelinesAI e' connesso?**
- Verificare dashboard TimelinesAI: https://timelines.ai
- Controllare che il dispositivo WhatsApp sia ancora collegato
- Se disconnesso: ricollegare da dashboard TimelinesAI

## Impossibile inviare messaggi (Baileys)

### Checklist

**1. Stato connessione Baileys**
```bash
curl -s https://command-center-backend-production.up.railway.app/whatsapp/status
```

Risposte e azioni:
| Status | Significato | Azione |
|--------|------------|--------|
| `connected` | Tutto OK | Il problema e' altrove |
| `disconnected` | Sessione persa | Serve re-scan QR |
| `connecting` | Si sta riconnettendo | Attendere 30s e riprovare |
| `qr_ready` | QR pronto per scan | Scansionare QR |

**2. Se `disconnected` o `qr_ready`:**
- Aprire: `https://command-center-backend-production.up.railway.app/whatsapp/qr-image`
- Scansionare con WhatsApp → Impostazioni → Dispositivi collegati
- Il QR scade in ~60 secondi, ricaricare se necessario

**3. Se errore "Stream Errored (conflict)":**
- Causa: due istanze Baileys con la stessa sessione (es. locale + Railway)
- Soluzione: usare UNA sola istanza alla volta
- Se necessario, fare logout e re-scan:
```bash
curl -X POST https://command-center-backend-production.up.railway.app/whatsapp/logout
```

**4. Formato numero errato:**
- Baileys NON vuole il `+` ne' lo zero iniziale
- Corretto: `393456789012`
- Errato: `+393456789012`, `03456789012`

## Messaggi inviati non appaiono in Supabase

### Causa
Il flusso di salvataggio dei messaggi inviati via Baileys dipende dal multi-device sync:
```
Baileys invia → WhatsApp sync → TimelinesAI riceve → webhook → command_center_inbox
```

### Checklist

**1. TimelinesAI e' attivo?**
- Verificare dashboard TimelinesAI
- Se disconnesso, i messaggi inviati non vengono catturati

**2. Baileys E TimelinesAI sono entrambi connessi?**
- Servono entrambi sullo stesso account WhatsApp
- Baileys come dispositivo collegato
- TimelinesAI come altro dispositivo collegato

**3. Multi-device sync funziona?**
- Inviare un messaggio di test da Baileys
- Verificare che appaia su TimelinesAI entro qualche secondo
- Se non appare: problema di sync WhatsApp multi-device

## Messaggi duplicati

### Diagnosi
```sql
-- Duplicati in production
SELECT external_interaction_id, COUNT(*) as count
FROM interactions
WHERE interaction_type = 'whatsapp'
  AND external_interaction_id IS NOT NULL
GROUP BY external_interaction_id
HAVING COUNT(*) > 1;
```

### Causa probabile
- In staging: non dovrebbe succedere (webhook singolo per messaggio)
- In production: messaggio processato ("Done") piu' volte manualmente

## Contatto non collegato al messaggio WhatsApp

### Diagnosi
```sql
-- 1. Il contatto ha questo numero?
SELECT * FROM contact_mobiles WHERE mobile = '{PHONE}';

-- 2. Esiste il collegamento chat?
SELECT * FROM contact_chats cc
JOIN chats ch ON cc.chat_id = ch.id
WHERE cc.contact_id = '{CONTACT_UUID}';
```

### Causa probabile
- Se messaggio in staging: il collegamento avviene solo dopo processing ("Done")
- Se in production senza contact_chat: bug nel processing

## Gruppo non mostra tutti i partecipanti

### Diagnosi
```sql
-- Quanti partecipanti registrati?
SELECT COUNT(*) FROM contact_chats WHERE chat_id = '{CHAT_UUID}';

-- Chi c'e'?
SELECT c.first_name, c.last_name, cm.mobile
FROM contact_chats cc
JOIN contacts c ON cc.contact_id = c.contact_id
LEFT JOIN contact_mobiles cm ON c.contact_id = cm.contact_id
WHERE cc.chat_id = '{CHAT_UUID}';
```

### Causa probabile
- Nuovi partecipanti non vengono rilevati automaticamente
- Serve processing manuale via frontend

## Lifecycle degli stati messaggio

```
STATO 1: SOLO IN WHATSAPP
- Non ancora ricevuto da TimelinesAI
- Nessun record nel CRM
         |
    (webhook TimelinesAI)
         v
STATO 2: STAGING (command_center_inbox)
- Ricevuto via webhook
- Visibile nel tab WhatsApp del CRM
- In attesa di processing utente
         |
    (user "Done")
         v
STATO 3: PRODUCTION (chats + interactions)
- Processato e archiviato
- Collegato a contatti via contact_chats
- Record interaction creato
- Rimosso da command_center_inbox
```

### Come determinare lo stato
```sql
-- E' in staging?
SELECT EXISTS(
  SELECT 1 FROM command_center_inbox
  WHERE type = 'whatsapp' AND message_uid = '{MESSAGE_UID}'
) as in_staging;

-- E' in production?
SELECT EXISTS(
  SELECT 1 FROM interactions
  WHERE interaction_type = 'whatsapp' AND external_interaction_id = '{MESSAGE_UID}'
) as in_production;
```

## Tabella riassuntiva stati

| Stato | Dove | Indicatori |
|-------|------|------------|
| Non ricevuto | Solo WhatsApp | Nessun record CRM |
| In staging | command_center_inbox | `type = 'whatsapp'` |
| Processato | chats + interactions | Ha `interaction_id`, collegato a chat |
| Archiviato | interactions, rimosso da inbox | Ha record interaction |
| Spam | whatsapp_spam | Numero nella tabella spam |

## Servizi coinvolti

| Servizio | Platform | Ruolo |
|----------|----------|-------|
| `command-center-backend` | Railway (Node.js) | Invio via Baileys |
| `crm-agent-service` | Railway (Python/FastAPI) | Ricezione webhook TimelinesAI |
| TimelinesAI | SaaS | Ricezione messaggi WhatsApp |
| Baileys | Libreria Node.js | Invio messaggi WhatsApp (gratis) |

## Riferimenti
- Backend invio: `command-center-backend` (Railway)
- Backend ricezione: `crm-agent-service` (Railway)
- Handler webhook: `crm-agent-service/app/main.py`
- Documentazione: `/home/user/crm-frontend/docs/WHATSAPP_SENDING.md`
- Skill principale: `skills/whatsapp.md`
- Baileys API base: `https://command-center-backend-production.up.railway.app`
- QR code: `https://command-center-backend-production.up.railway.app/whatsapp/qr-image`
- TimelinesAI dashboard: https://timelines.ai
