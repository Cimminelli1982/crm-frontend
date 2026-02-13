# CRM Architecture

## Stack

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 |
| Routing | React Router |
| State | React hooks + Context |
| UI | Custom components + inline styles |
| Icons | React Icons (FontAwesome) |

### Backend (Railway)

| Service | Stack | Port | Function |
|---------|-------|------|----------|
| `command-center-backend` | Node.js + Express | 3001 | Email sync (Fastmail JMAP), Google Calendar, email send, save-and-archive, AI chat |
| `crm-agent-service` | Python + FastAPI | 8000 | WhatsApp webhook (TimelinesAI), WhatsApp save-and-archive, calendar dismiss |

### Database
| Component | Technology |
|-----------|-----------|
| Database | Supabase (PostgreSQL 15) |
| Region | eu-central-1 |
| Auth | Supabase Auth |
| Storage | Supabase Storage (WhatsApp attachments, profile images, files) |
| Realtime | Supabase Realtime (subscriptions) |

### External Services
| Service | Use |
|---------|-----|
| Fastmail | Email (JMAP protocol) |
| Google Calendar | Calendar sync (API v3) |
| TimelinesAI | WhatsApp Business API (webhook) |
| Baileys | WhatsApp sending (direct) |
| Apollo.io | Contact/Company enrichment |
| OpenAI | AI parsing (names, enrichment) |
| Anthropic Claude | AI chat (via backend `/chat` endpoint) |
| Todoist | Task management integration |

---

## System Architecture

```
                         ┌─────────────────┐
                         │    Frontend     │
                         │   React App     │
                         │  localhost:3002  │
                         └────────┬────────┘
                                  │
                                  │ Supabase JS Client (reads + writes)
                                  │ + fetch() to backends
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
     ┌────────┼────────┐ ┌───────▼────────┐
     │   Fastmail      │ │  TimelinesAI   │
     │   (JMAP)        │ │   (Webhook)    │
     ├────────┼────────┤ └────────────────┘
     │ Google Calendar  │
     │   (API v3)      │
     └─────────────────┘
```

---

## Data Flow

```
SOURCES                         RAILWAY BACKENDS                 SUPABASE
───────                         ────────────────                 ────────

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
│ Google   │ ───API poll────▶   │   Node.js    │ ────┘               │ trigger
│ Calendar │                    │   Backend    │                     ▼
└──────────┘                    └──────────────┘          ┌─────────────────────┐
                                                          │ check_data_         │
                                                          │ integrity()         │
        USER CLICKS "DONE"                                └──────────┬──────────┘
        ──────────────────                                           │
                                                                     ▼
        Frontend ──▶ Backend ──▶ CRM tables              ┌─────────────────────┐
        (see done-processing-flow.md)                     │ data_integrity_     │
                                                          │ inbox               │
                                                          └─────────────────────┘
```

---

## Project Structure

```
crm-frontend/
├── src/
│   ├── pages/
│   │   ├── CommandCenterPage.js      # Main page — hooks init + layout orchestration (~5800 lines)
│   │   ├── CommandCenterPage.styles.js
│   │   └── ...                        # Legacy pages (Contacts, Companies, etc.)
│   │
│   ├── components/
│   │   ├── command-center/
│   │   │   ├── DesktopLayout.js       # Main layout compositor
│   │   │   ├── layout/               # Four layout panels
│   │   │   │   ├── DesktopHeader.js
│   │   │   │   ├── DesktopLeftPanel.js
│   │   │   │   ├── DesktopCenterPanel.js
│   │   │   │   └── DesktopRightPanel.js
│   │   │   ├── left-panel/           # Per-tab left panel content
│   │   │   │   ├── EmailLeftContent.js
│   │   │   │   ├── KITLeftContent.js
│   │   │   │   ├── DealsLeftContent.js
│   │   │   │   ├── CalendarLeftContent.js
│   │   │   │   ├── IntroductionsLeftContent.js
│   │   │   │   ├── NotesLeftContent.js
│   │   │   │   ├── LeftPanelShell.js
│   │   │   │   ├── LeftPanelSearch.js
│   │   │   │   ├── CollapsibleSection.js
│   │   │   │   └── items/            # List item renderers
│   │   │   ├── center-panel/
│   │   │   │   └── NotesCenterContent.js
│   │   │   ├── ContactDetailsTab.js, CompanyDetailsTab.js  # Right panel tabs
│   │   │   ├── ContactSelector.js, AddMenu.js              # Right panel tools
│   │   │   ├── RightPanelEmailTab.js, RightPanelWhatsAppTab.js
│   │   │   ├── CalendarPanelTab.js, IntroductionsPanelTab.js
│   │   │   ├── DealsTab.js, RelatedTab.js, FilesTab.js
│   │   │   ├── NotesTab.js, TasksTab.js, TasksFullTab.js
│   │   │   ├── AITab.js, ChatTab.js
│   │   │   ├── SendEmailTab.js, ComposeEmailModal.js
│   │   │   ├── WhatsAppChatTab.js, WhatsAppTab.js
│   │   │   ├── DataIntegrityTab.js, DataIntegrityWarningBar.js
│   │   │   ├── CRMTab.js, IntroductionsTab.js, ListsTab.js
│   │   │   └── modals/               # Command center specific modals
│   │   │
│   │   ├── modals/                   # ~50 shared modals (CRUD for all entities)
│   │   ├── mobile/command-center/    # Mobile layout + views
│   │   ├── shared/                   # PageLayout, PageWrapper
│   │   └── ...                        # Legacy components
│   │
│   ├── hooks/
│   │   ├── command-center/           # Command center hooks
│   │   │   ├── useEmailActions.js    # Email Done/archive/spam logic
│   │   │   ├── useWhatsAppData.js    # WhatsApp inbox + Done logic
│   │   │   ├── useCalendarData.js    # Calendar events + dismiss
│   │   │   ├── useDealsData.js
│   │   │   ├── useIntroductionsData.js
│   │   │   ├── useKeepInTouchData.js
│   │   │   ├── useNotesData.js
│   │   │   ├── useDataIntegrity.js
│   │   │   └── useRightPanelState.js
│   │   ├── useContactDetails.js
│   │   ├── useContactsData.js
│   │   ├── useContextContacts.js
│   │   ├── useEmailCompose.js
│   │   ├── useEmailThreads.js
│   │   ├── useKeepInTouch.js
│   │   ├── useCompanySuggestions.js
│   │   ├── useSupabaseTasks.js
│   │   ├── useTodoistTasks.js
│   │   ├── useChatWithClaude.js
│   │   ├── useQuickEditModal.js
│   │   ├── useProfileImageModal.js
│   │   └── useViewport.js
│   │
│   ├── helpers/                      # Utility functions
│   ├── utils/                        # More utilities
│   ├── context/AuthContext.js
│   ├── lib/supabaseClient.js
│   └── NewCRMApp.js                  # Main app router
│
├── backend/                          # Node.js backend (Railway)
│   └── src/
│       ├── index.js                  # Express server + email sync loop
│       ├── jmap.js                   # Fastmail JMAP client
│       ├── google-calendar.js        # Google Calendar API
│       ├── baileys.js                # WhatsApp sending
│       ├── sync.js                   # Sync state management
│       ├── mcp-client.js             # MCP tools client
│       ├── supabase.js               # Supabase DB operations
│       └── caldav.js                 # Legacy CalDAV (mostly replaced)
│
├── docs/                             # Documentation
│   ├── README.md
│   ├── ARCHITECTURE.md               # This file
│   ├── done-processing-flow.md       # What happens when user clicks Done
│   ├── DATA_INGESTION.md             # How data enters the system
│   ├── DATA_INTEGRITY.md             # Automated validation checks
│   ├── DATA_CLEANING.md              # Add/Hold/Spam flows
│   ├── LISTS.md                      # Email lists (static/dynamic)
│   ├── SUPABASE_SCHEMA.md            # Full DB schema
│   ├── WHATSAPP_ATTACHMENTS_IMPLEMENTATION.md
│   └── WHATSAPP_SENDING.md           # Baileys sending architecture
│
└── CLAUDE.md                         # Project memory (schema, enums, conventions)
```

---

## Development Ports

| Service | Port |
|---------|------|
| React Frontend | 3002 (`PORT=3002 npm run new-crm:dev`) |
| Node.js Backend | 3001 |
| Python Backend | 8000 |

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
GOOGLE_CALENDAR_CREDENTIALS=xxx
```

### Python Backend (Railway)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
TIMELINESAI_API_KEY=xxx
OPENAI_API_KEY=xxx
APOLLO_API_KEY=xxx
```
