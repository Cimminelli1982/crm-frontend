# Codebase Map

Quick architectural reference. Full DB schema is in `CLAUDE.md` — don't duplicate it here.

## Stack

| Layer | Tech | Where |
|-------|------|-------|
| Frontend | React, styled-components, react-hot-toast | `src/` on `localhost:3002` |
| Backend | Express (Node.js) on Railway | `backend/src/index.js` (~67 endpoints) |
| Database | Supabase (Postgres) | MCP tools or `supabaseClient.js` |
| AI | Claude API (Anthropic SDK) | Backend `index.js` — Sonnet for chat, Haiku for classification |
| WhatsApp | Baileys + TimelinesAI | `backend/src/baileys.js` |
| Calendar | Google Calendar API | `backend/src/google-calendar.js` |
| Email | Fastmail JMAP | `backend/src/jmap.js` |

## Frontend entry points

- **Main page**: `src/pages/CommandCenterPage.js` (~5800 lines) — initialises all hooks, renders modals, passes props to layout
- **Layout assembly**: `src/components/command-center/DesktopLayout.js` → Header + Left + Center + Right panels
- **Styles**: `src/pages/CommandCenterPage.styles.js` — all styled-components, theme via prop

## Key patterns

### Hooks (`src/hooks/command-center/`)
Each domain has a hook: `useDealsData`, `useCalendarData`, `useWhatsAppData`, etc.
Pattern: state + fetch + handlers → return flat object. Consumed in `CommandCenterPage.js`.

### Modals (`src/components/modals/`)
~50 modals. Standard props: `isOpen`, `onClose`, `theme`, `onSuccess`.
Rendered at bottom of `CommandCenterPage.js` JSX.

### Left panel (`src/components/command-center/left-panel/`)
Per-tab content: `EmailLeftContent`, `DealsLeftContent`, `KITLeftContent`, etc.
Shared shell: `LeftPanelShell.js` (search + scrollable list).

### Command palette (`commandDefinitions.js` → `AgentChatTab.js` → `useAgentChat.js`)
`directAction` field in command definitions → maps to `SLASH_COMMANDS` in `useAgentChat.js` → dispatched to backend `/chat`.

## Backend structure (`backend/src/`)

- `index.js` — Express server, all endpoints, email sync loop (60s), spam classifier
- `mcp-client.js` — MCP tools for Claude agent (Supabase, memory, CRM tools)
- `supabase.js` — Supabase client + DB helper functions
- `jmap.js` — Fastmail JMAP client
- `google-calendar.js` — Google Calendar API
- `baileys.js` — WhatsApp via Baileys
- `evening-briefing.js` / `morning-briefing.js` — scheduled briefings
- `today-page.js` — today page routes

## Deploy

- **Frontend**: Netlify (auto-deploy on push)
- **Backend**: `cd backend && railway up --detach` (NOT GitHub push)
- **Dev**: `PORT=3002 npm run new-crm:dev` (NOT `npm start`, NOT `npm build`)
