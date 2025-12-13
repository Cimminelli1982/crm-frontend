# CRM Architecture

## Stack Tecnologico

### Frontend
| Componente | Tecnologia |
|------------|------------|
| Framework | React 18 |
| Routing | React Router |
| State | React hooks + Context |
| UI | Custom components + Tailwind-like inline styles |
| Icons | React Icons (FontAwesome) |

### Backend (Railway)

| Servizio | Stack | Porta | Funzione |
|----------|-------|-------|----------|
| `command-center-backend` | Node.js + Express | 3001 | Email sync (Fastmail JMAP) |
| `crm-agent-service` | Python + FastAPI | 8000 | WhatsApp webhook, Calendar sync, AI |

### Database
| Componente | Tecnologia |
|------------|------------|
| Database | Supabase (PostgreSQL 15) |
| Region | eu-central-1 |
| Auth | Supabase Auth |
| Storage | Supabase Storage (allegati WhatsApp) |
| Realtime | Supabase Realtime (subscriptions) |

### Servizi Esterni
| Servizio | Uso |
|----------|-----|
| Fastmail | Email (JMAP) + Calendar (ICS) |
| TimelinesAI | WhatsApp Business API |
| Apollo.io | Contact/Company enrichment |
| OpenAI | AI parsing (nomi, enrichment) |
| Todoist | Task management integration |

---

## Architettura Sistema

```
                         ┌─────────────────┐
                         │    Frontend     │
                         │   React App     │
                         │  (Vercel/Local) │
                         └────────┬────────┘
                                  │
                                  │ Supabase JS Client
                                  │
                         ┌────────▼────────┐
                         │    Supabase     │
                         │   PostgreSQL    │
                         │    Storage      │
                         │    Realtime     │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
     ┌────────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
     │  Node.js        │ │  Python        │ │  Supabase      │
     │  Backend        │ │  Backend       │ │  Triggers      │
     │  (Railway)      │ │  (Railway)     │ │  (PostgreSQL)  │
     └────────┬────────┘ └───────┬────────┘ └────────────────┘
              │                   │
     ┌────────▼────────┐ ┌───────▼────────┐
     │    Fastmail     │ │  TimelinesAI   │
     │    (JMAP)       │ │   (Webhook)    │
     └─────────────────┘ └────────────────┘
```

---

## Flusso Dati Command Center

```
FONTI ESTERNE                    RAILWAY BACKENDS                 SUPABASE
─────────────                    ────────────────                 ────────

┌──────────┐                    ┌──────────────┐
│ Fastmail │ ───JMAP poll───▶   │   Node.js    │ ────┐
│  Email   │    (60 sec)        │   Backend    │     │
└──────────┘                    └──────────────┘     │
                                                     │
┌──────────┐                    ┌──────────────┐     │    ┌─────────────────────┐
│TimelinesAI│ ───Webhook────▶   │   Python     │ ────┼───▶│ command_center_     │
│ WhatsApp │                    │   Backend    │     │    │ inbox               │
└──────────┘                    └──────────────┘     │    └──────────┬──────────┘
                                                     │               │
┌──────────┐                    ┌──────────────┐     │               │ AFTER INSERT
│ Fastmail │ ───ICS fetch───▶   │   Python     │ ────┘               │ trigger
│ Calendar │    (manual)        │   Backend    │                     ▼
└──────────┘                    └──────────────┘          ┌─────────────────────┐
                                                          │ check_data_         │
                                                          │ integrity()         │
                                                          └──────────┬──────────┘
                                                                     │
                                                                     ▼
                                                          ┌─────────────────────┐
                                                          │ data_integrity_     │
                                                          │ inbox               │
                                                          └─────────────────────┘
```

---

## Struttura Progetto

```
crm-frontend/
├── src/
│   ├── components/
│   │   ├── command-center/      # Command Center components
│   │   │   ├── CRMTab.js
│   │   │   ├── DataIntegrityTab.js
│   │   │   ├── ComposeEmailModal.js
│   │   │   └── ...
│   │   └── ...
│   ├── pages/
│   │   ├── CommandCenterPage.js  # Main Command Center
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API services
│   └── NewCRMApp.js             # Main app router
│
├── backend/                      # Node.js backend (Railway)
│   └── src/
│       ├── index.js             # Express server + email sync
│       ├── jmap.js              # Fastmail JMAP client
│       └── supabase.js          # Supabase operations
│
├── crm-agent-service/           # Python backend (Railway)
│   └── app/
│       ├── main.py              # FastAPI endpoints
│       └── database.py          # Supabase operations
│
└── docs/                        # Documentation
    ├── README.md                # This index
    ├── ARCHITECTURE.md          # Stack overview (this file)
    ├── DATA_INGESTION.md        # Data flow into system
    ├── DATA_INTEGRITY.md        # Validation checks
    └── WHATSAPP_ATTACHMENTS_IMPLEMENTATION.md
```

---

## Environment Variables

### Frontend (.env)
```
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxx
```

### Node.js Backend (Railway)
```
FASTMAIL_USERNAME=your@email.com
FASTMAIL_API_TOKEN=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
```

### Python Backend (Railway)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
TIMELINESAI_API_KEY=xxx
OPENAI_API_KEY=xxx
APOLLO_API_KEY=xxx
```

---

## Porte Sviluppo Locale

| Servizio | Porta |
|----------|-------|
| React Frontend | 3000 |
| Node.js Backend | 3001 |
| Python Backend | 8000 |
