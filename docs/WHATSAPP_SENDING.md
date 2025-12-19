# WhatsApp Sending via Baileys

This document explains how WhatsApp message sending works in the CRM, using Baileys (free, self-hosted) instead of TimelinesAI (paid).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WHATSAPP FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SENDING (Baileys - FREE)                                               │
│  ────────────────────────                                               │
│                                                                         │
│  Frontend (WhatsAppTab.js)                                              │
│       │                                                                 │
│       ▼                                                                 │
│  Railway Backend (/whatsapp/send)                                       │
│       │                                                                 │
│       ▼                                                                 │
│  Baileys (baileys.js)                                                   │
│       │                                                                 │
│       ▼                                                                 │
│  WhatsApp Web Protocol ──────────────► WhatsApp                         │
│                                              │                          │
│                                              │ (multi-device sync)      │
│                                              ▼                          │
│  RECEIVING (TimelinesAI - still used)   TimelinesAI                     │
│  ────────────────────────────────────        │                          │
│                                              │ (webhook)                │
│                                              ▼                          │
│                                    Python Backend                       │
│                                              │                          │
│                                              ▼                          │
│                                    command_center_inbox                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Points

| Aspect | Before | After |
|--------|--------|-------|
| **Sending** | TimelinesAI API (paid per message) | Baileys (free) |
| **Receiving** | TimelinesAI webhook | TimelinesAI webhook (unchanged) |
| **Storage** | TimelinesAI → Supabase | Still works via multi-device sync |
| **Cost** | ~€50-100/month | ~€0 for sending |

## How Sent Messages Are Stored

Even though we send via Baileys, messages still get saved to Supabase:

1. **Baileys** sends message to WhatsApp
2. **WhatsApp multi-device** syncs the sent message to all connected devices
3. **TimelinesAI** (still connected) receives the sent message
4. **TimelinesAI webhook** fires → Python backend → `command_center_inbox`

This happens automatically - no additional code needed.

---

## Components

### 1. Backend: `baileys.js`

Location: `backend/src/baileys.js`

Handles:
- WhatsApp Web connection via Baileys library
- Session persistence in `/app/baileys_auth/` (Railway volume)
- QR code generation for authentication
- Sending text messages
- Sending media (images, documents, audio, video)

Key functions:
```javascript
initBaileys()        // Initialize connection, generate QR if needed
getStatus()          // Get connection status
getQRCode()          // Get QR code for scanning
sendMessage(to, text)           // Send text to phone number
sendMessageToChat(chatId, text) // Send text to group
sendMedia(to, buffer, mimetype, filename, caption) // Send media
clearSession()       // Logout and clear session
```

### 2. Backend: API Endpoints

Location: `backend/src/index.js`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/whatsapp/status` | GET | Connection status |
| `/whatsapp/qr` | GET | QR code as JSON (base64) |
| `/whatsapp/qr-image` | GET | QR code as PNG image |
| `/whatsapp/connect` | POST | Trigger reconnection |
| `/whatsapp/logout` | POST | Clear session |
| `/whatsapp/send` | POST | Send text message |
| `/whatsapp/send-media` | POST | Send media message |

### 3. Frontend: `WhatsAppTab.js`

Location: `src/components/command-center/WhatsAppTab.js`

The `handleSendMessage` function:
1. Checks Baileys connection status
2. If connected → sends via Baileys (free)
3. If not connected → falls back to TimelinesAI (paid)

```javascript
const BAILEYS_API = 'https://command-center-backend-production.up.railway.app';

// In handleSendMessage:
const statusRes = await fetch(`${BAILEYS_API}/whatsapp/status`);
const statusData = await statusRes.json();
useBaileys = statusData.status === 'connected';
```

---

## Railway Deployment

### Persistent Volume

The Baileys session is stored in a **Railway volume** to persist between deployments:

- **Volume name**: `command-center-backend-volume`
- **Mount path**: `/app/baileys_auth`
- **Contains**: WhatsApp Web session credentials

Without this volume, you would need to re-scan the QR code after every deploy.

### Environment

No additional environment variables needed for Baileys - it uses the existing Railway deployment.

---

## Session Management

### Initial Setup (QR Code Scan)

1. Deploy backend to Railway
2. Visit: `https://command-center-backend-production.up.railway.app/whatsapp/qr-image`
3. Open WhatsApp on phone → Settings → Linked Devices → Link a Device
4. Scan the QR code
5. Status should change to `connected`

### Check Status

```bash
curl https://command-center-backend-production.up.railway.app/whatsapp/status
```

Response:
```json
{
  "status": "connected",
  "error": null,
  "hasQR": false,
  "hasSession": true
}
```

### Reconnection

If disconnected, the backend auto-reconnects. If that fails:

1. Check status endpoint
2. If `hasQR: true`, scan the QR again
3. If persistent issues, logout and re-scan:

```bash
curl -X POST https://command-center-backend-production.up.railway.app/whatsapp/logout
```

---

## API Usage

### Send Text Message

```bash
curl -X POST https://command-center-backend-production.up.railway.app/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+393456789012",
    "message": "Hello from Baileys!"
  }'
```

### Send to Group

```bash
curl -X POST https://command-center-backend-production.up.railway.app/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "123456789@g.us",
    "message": "Hello group!"
  }'
```

### Send Media

```bash
curl -X POST https://command-center-backend-production.up.railway.app/whatsapp/send-media \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+393456789012",
    "caption": "Check this out",
    "file": {
      "data": "base64_encoded_file_data",
      "mimetype": "image/jpeg",
      "filename": "photo.jpg"
    }
  }'
```

---

## Troubleshooting

### "Stream Errored (conflict)"

**Cause**: Two Baileys instances with the same session (e.g., local + Railway)

**Solution**: Only run ONE instance at a time. Stop local backend if using Railway.

### "WhatsApp not connected"

**Cause**: Session expired or not initialized

**Solution**:
1. Check `/whatsapp/status`
2. If `hasQR: true`, scan QR at `/whatsapp/qr-image`
3. If `hasSession: false`, the volume might be empty - scan QR

### Messages not appearing in Supabase

**Cause**: TimelinesAI webhook not receiving sent messages

**Check**:
- Is TimelinesAI still connected to the same WhatsApp account?
- Multi-device sync should propagate sent messages to TimelinesAI

### QR code expired

**Cause**: QR codes expire after ~60 seconds

**Solution**: Refresh `/whatsapp/qr-image` and scan quickly

---

## Risks & Considerations

### Ban Risk (Low but Present)

Baileys uses reverse-engineered WhatsApp Web protocol. WhatsApp could:
- Temporarily block the number
- Permanently ban in extreme cases

**Mitigation**:
- Don't send bulk/spam messages
- Keep message patterns human-like
- If banned, you lose BOTH sending (Baileys) AND receiving (TimelinesAI)

### Session Conflicts

Only ONE Baileys session per WhatsApp account. Don't run:
- Local backend + Railway simultaneously
- Multiple Railway instances

### Dependency on TimelinesAI

Receiving still depends on TimelinesAI. If you cancel TimelinesAI:
- Sending still works (Baileys)
- Receiving stops (no webhook)
- Sent messages won't be saved to Supabase

---

## Files Reference

| File | Purpose |
|------|---------|
| `backend/src/baileys.js` | Baileys connection & messaging |
| `backend/src/index.js` | WhatsApp API endpoints (lines 1674-1850) |
| `src/components/command-center/WhatsAppTab.js` | Frontend send handler |
| `backend/baileys_auth/` | Local session storage |
| Railway Volume `/app/baileys_auth` | Production session storage |

---

## Costs Comparison

| Item | TimelinesAI Only | Baileys + TimelinesAI |
|------|------------------|----------------------|
| Sending | ~€0.02-0.05/msg | **Free** |
| Receiving | Included in plan | Included in plan |
| Monthly (est. 1000 msgs) | €50-100 | **€20-30** (receiving only) |

You can potentially negotiate a lower TimelinesAI plan since you only need receiving.
