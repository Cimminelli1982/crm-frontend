---
name: reply-all-send
description: "Send email reply all via Railway backend"
version: 1.1.0
category: communication
---

# Skill: reply-all-send

## Obiettivo

Invia una reply-all email tramite il backend Railway.

## Procedura

1. Estrai Email Inbox ID dal contesto CRM (campo "Email Inbox ID")
2. Se manca l'Email Inbox ID -> rispondi "Errore: Email non trovata. Verifica che l'email sia ancora in inbox."
3. Prendi il testo dopo il comando — questo è il corpo email da inviare
4. Invia:

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/reply" \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "<INBOX_ID>",
    "textBody": "<TESTO>",
    "replyAll": true
  }'
```

5. Se successo -> "Reply-all inviata."
6. Se errore -> mostra errore

## Regole

- NON modificare il testo — invialo esattamente come ricevuto
- NON richiedere contatto CRM — serve solo l'Email Inbox ID
- Rispondi in modo breve: solo conferma o errore
