# Receptionist Commands — How They Work

This document explains the full lifecycle of a Receptionist command: from the user clicking a button in the frontend, to the Receptionist executing the skill on the server, to the response appearing in chat.

---

## Architecture Overview

```
┌─────────────────────┐     WebSocket      ┌──────────────────────┐
│  Frontend (React)   │ ──────────────────► │  OpenClaw Gateway    │
│                     │                     │  gw.angelinvesting.it│
│  commandDefinitions │                     │                      │
│  AgentChatTab       │                     │  Agent: Receptionist │
│  useAgentChat       │ ◄────────────────── │  Skills: /home/      │
│                     │     WebSocket       │  openclaw/.openclaw/ │
│                     │                     │  skills/{name}/      │
└─────────────────────┘                     └──────────────────────┘
```

Three pieces work together:
1. **Frontend** — builds the message with `/slash-command` + context, sends via WebSocket
2. **useAgentChat.js** — maps `/slash-command` to skill name for routing
3. **Server skill** — `SKILL.md` in `/home/openclaw/.openclaw/skills/{name}/` tells the Receptionist exactly what to do

The rule is **1 slash command = 1 skill folder**. The folder name must match exactly.

---

## Step-by-step: What Happens When a User Clicks a Command

### 1. User clicks a command in the command palette

The command palette lives in the Receptionist tab (right panel). Commands are defined in:

**`src/components/command-center/commandDefinitions.js`**

Each command is either:
- **`directAction`** — auto-sends immediately with context (preferred for Receptionist commands)
- **`buildPrompt`** — puts text in the input field for the user to edit before sending (legacy, used by disabled categories like CRM, Intro, etc.)

Example of a `directAction` command:
```js
{
  id: 'create-task',
  label: 'Create task',
  directAction: 'create-task',
}
```

### 2. AgentChatTab handles the click

In **`src/components/command-center/AgentChatTab.js`**, `handleCommandSelect()` processes the action.

For `directAction` commands, it:
1. Looks up the slash command string from a map:
   ```js
   const slashActions = {
     'create-task': '/create-task',
     'accept-invitation': '/accept-invitation',
     // ...
   };
   ```
2. Builds the message by appending all available context:
   ```
   /create-task
   Contact: Mario Rossi
   Contact ID: abc-123
   Email: Re: Meeting next week
   Email inbox ID: 2c69b235-...
   Email contacts:
   - Paolo Pio | paolo@test.com | uuid1
   - Anna Rossi | anna@test.com | uuid2
   ```
3. Sends it immediately via `sendMessage()` — the user does NOT see or edit this message

### 3. useAgentChat routes to the skill

In **`src/hooks/command-center/useAgentChat.js`**, the `SLASH_COMMANDS` map tells OpenClaw which skill to load:

```js
const SLASH_COMMANDS = {
  '/create-task': 'create-task',
  '/accept-invitation': 'accept-invitation',
  // ...
};
```

The key is the slash command string. The value is the skill folder name. They must match.

### 4. Context is prepended automatically

Before sending, `useAgentChat` wraps the message with a `[CRM Context: ...]` prefix:
```
[CRM Context: Tab: "email" | Contact: "Mario Rossi" | Email: "Re: Meeting"]

/create-task
Contact: Mario Rossi
...
```

This context is NOT shown to the user in chat — it's stripped for display but sent to the Receptionist.

### 5. Receptionist loads the skill and executes

On the server, OpenClaw sees `/create-task` and loads `/home/openclaw/.openclaw/skills/create-task/SKILL.md`.

The Receptionist follows the skill instructions:
1. **Parses the context** from the message (contact names, IDs, email subject, etc.)
2. **Asks for missing info** — only what it can't infer from context
3. **Executes** — API calls (Todoist, Supabase, Google Calendar, Railway backend, etc.)
4. **Verifies** — GET request to confirm the operation succeeded
5. **Responds** — short confirmation message

### 6. Response appears in chat

The Receptionist's response streams back via WebSocket and appears in the chat. The user can then send follow-up messages in the same conversation — the Receptionist handles these using the skill context already in the conversation (no need for another slash command).

---

## The Context Object

`AgentChatTab` builds a `commandContext` from the current state of the right panel:

| Field | Source | Example |
|-------|--------|---------|
| `contactName` | Selected contact in right panel | "Mario Rossi" |
| `contactId` | Selected contact UUID | "abc-123-..." |
| `contactEmail` | Primary email of selected contact | "mario@test.com" |
| `contactPhone` | Primary mobile of selected contact | "+39 333..." |
| `emailSubject` | Subject of selected email thread | "Re: Meeting" |
| `emailInboxId` | UUID from command_center_inbox | "2c69b235-..." |
| `emailContacts` | ALL contacts from current email/chat | Array of {name, email, contact} |
| `whatsappChat` | Name of selected WhatsApp chat | "Mario Rossi" |
| `calendarEvent` | Title of selected calendar event | "Team standup" |
| `dealName` | Name of selected deal | "Acme Investment" |

**Important:** `emailContacts` contains ALL participants of the current email/chat, not just the one selected in the right panel. This is critical for commands like `create-event-invite` that need to invite all participants.

---

## Two Types of directAction

There are two kinds of `directAction` in the system:

### Slash-command actions (go to Receptionist)
These match an entry in the `slashActions` map in `handleCommandSelect()`. They build a message and auto-send it to the Receptionist.

Examples: `create-task`, `accept-invitation`, `what-in-calendar`, `reply-all-draft`

### Frontend-only actions
These are handled entirely by the frontend without involving the Receptionist.

- `archive`, `waiting`, `actions` — email status changes, handled by `handleDirectEmailAction()`
- `free-slots` — opens the FreeSlotPickerModal via `onOpenFreeSlots()`

---

## How to Add a New Command

### Step 0: Verify backend endpoints exist (BEFORE writing the skill)

Skills call backend APIs (Railway, Todoist, Supabase). Before writing a skill, check that every endpoint it needs actually exists and works.

**Railway backend** (`https://command-center-backend-production.up.railway.app`):
- Source code: `backend/src/index.js`
- Check existing endpoints: `grep "app.post\|app.get\|app.put\|app.delete" backend/src/index.js`

**If an endpoint doesn't exist, you must create it first.** The skill will fail silently or the Receptionist will hallucinate success if the endpoint returns 404/502.

Example: `/accept-invitation` needs `POST /google-calendar/respond-to-event` to RSVP on Google Calendar. This endpoint didn't exist — we had to implement it in the Railway backend before the skill could work.

**Checklist before writing the skill:**
1. List every API call the skill will make (Railway, Todoist direct, Supabase REST)
2. For each Railway endpoint: `curl -sS -o /dev/null -w "%{http_code}" https://command-center-backend-production.up.railway.app/endpoint` — must return 200, not 404
3. For Supabase tables: verify the table and columns exist via `mcp__supabase__execute_sql` or the schema in CLAUDE.md
4. For Todoist: verify via `curl -sS https://api.todoist.com/api/v1/tasks -H "Authorization: Bearer $TOKEN"` that auth works

**If an endpoint is missing:**
- Implement it in `backend/src/index.js`
- Follow the pattern of existing endpoints (see `POST /google-calendar/create-event` as reference)
- Deploy to Railway
- Test the endpoint manually before writing the skill
- Only then proceed to Step 1

### Step 1: Create the skill on the server

SSH into `209.97.183.72` and create the skill folder:

```bash
mkdir -p /home/openclaw/.openclaw/skills/my-new-command
```

Create `SKILL.md` inside it. Follow this structure:

```markdown
---
name: my-new-command
description: "What this command does"
version: 1.0.0
category: relevant-category
---

# /my-new-command

## Flusso

1. Parse context (what the frontend sends)
2. Ask for missing info (only what's needed)
3. Execute (API calls, curl commands, etc.)
4. **VERIFICA OBBLIGATORIA** — GET to confirm
5. Respond with confirmation

## API calls

(Include exact curl commands with templates the Receptionist can fill in)

## Verifica

(Include exact GET commands to verify the operation)
```

**Skill best practices:**
- Include exact curl commands — don't rely on the Receptionist knowing endpoints
- Include all IDs/mappings the Receptionist needs (e.g., Todoist project IDs)
- Always end with a verification GET
- Keep the flow numbered and sequential
- Specify what to ask the user and what to infer from context

### Step 2: Register the slash command in useAgentChat.js

Add the mapping in `src/hooks/command-center/useAgentChat.js`:

```js
const SLASH_COMMANDS = {
  // ... existing commands
  '/my-new-command': 'my-new-command',  // ← add this
};
```

The key (`/my-new-command`) is what appears in the message. The value (`my-new-command`) is the skill folder name on the server. They must match.

### Step 3: Register the slash-command action in AgentChatTab.js

In `src/components/command-center/AgentChatTab.js`, add to the `slashActions` map inside `handleCommandSelect()`:

```js
const slashActions = {
  // ... existing actions
  'my-new-command': '/my-new-command',  // ← add this
};
```

The key is the `directAction` value from commandDefinitions. The value is the slash command string.

### Step 4: Add the command to commandDefinitions.js

In `src/components/command-center/commandDefinitions.js`, add the action to the appropriate category:

```js
{
  id: 'my-new-command',
  label: 'My New Command',
  directAction: 'my-new-command',
},
```

If you need a new category, add it to `COMMAND_CATEGORIES` and to `ENABLED_CATEGORIES`.

### Step 5: SOUL.md — usually no changes needed

The Receptionist's `SOUL.md` (`/home/openclaw/.openclaw/workspace-receptionist/SOUL.md`) describes general behavior. You do NOT need to edit it for new commands. The skill auto-loading is handled by OpenClaw — when a message starts with `/my-new-command`, it loads the matching skill folder automatically.

Only edit SOUL.md if you need to change the Receptionist's general behavior (e.g., how it handles follow-ups, how it formats responses, etc.).

---

## Naming Rules

| Thing | Convention | Example |
|-------|-----------|---------|
| Skill folder | kebab-case, matches slash command | `create-task` |
| Slash command | `/` + folder name | `/create-task` |
| SLASH_COMMANDS key | same as slash command | `'/create-task': 'create-task'` |
| slashActions key | same as directAction value | `'create-task': '/create-task'` |
| directAction value | same as skill folder name | `directAction: 'create-task'` |
| Command ID | same as skill folder name | `id: 'create-task'` |

Everything must be the same string. If the skill folder is `create-task`, then:
- slash command is `/create-task`
- SLASH_COMMANDS entry is `'/create-task': 'create-task'`
- slashActions entry is `'create-task': '/create-task'`
- directAction is `'create-task'`
- id is `'create-task'`

---

## Files Reference

| File | What it does |
|------|-------------|
| `src/components/command-center/commandDefinitions.js` | Defines command categories and actions shown in the palette |
| `src/components/command-center/AgentChatTab.js` | Handles command clicks, builds messages, manages chat UI |
| `src/hooks/command-center/useAgentChat.js` | WebSocket connection, slash command → skill routing, message sending |
| Server: `/home/openclaw/.openclaw/skills/{name}/SKILL.md` | Skill instructions for the Receptionist |
| Server: `/home/openclaw/.openclaw/workspace-receptionist/SOUL.md` | Receptionist general behavior (rarely edited) |

---

## Current Commands (March 2026)

### Email (frontend-only actions, no skill)
- `archive` — marks email as done
- `waiting` — marks email as waiting input
- `actions` — marks email as needs actions

### Email (Receptionist skills)
- `/reply-all-draft` — drafts a reply-all
- `/reply-all-send` — sends a reply-all
- `/reply-to-draft` — drafts a reply to sender
- `/reply-to-send` — sends a reply to sender

### Calendar
- `/what-in-calendar` — shows what's in the calendar
- `/create-event` — creates event without inviting guests
- `/create-event-invite` — creates event and invites guests
- `/accept-invitation` — accepts a calendar invitation, saves meeting, archives email
- `free-slots` — frontend-only, opens FreeSlotPickerModal

### Task
- `/create-task` — creates task in Todoist, optionally associates to contacts/companies/deals
- `/associate-task` — links existing task to contacts/companies/deals
- `/list-tasks` — lists tasks associated with current contact
- `/complete-task` — marks task as done in Todoist + Supabase

### Decision
- `/register-decision` — logs a decision with category, confidence, linked entities

---

## Common Mistakes to Avoid

1. **Skill name doesn't match slash command** — if the folder is `create-task` but you write `/create_task`, it won't load. Use exact same kebab-case string everywhere.

2. **Putting skill logic in the frontend** — NEVER put API calls, curl commands, or step-by-step instructions in `AgentChatTab.js` or `commandDefinitions.js`. That belongs in the skill SKILL.md on the server. The frontend only sends context.

3. **Forgetting to register in all 3 places** — a new command needs entries in: (1) `commandDefinitions.js`, (2) `slashActions` map in `AgentChatTab.js`, (3) `SLASH_COMMANDS` in `useAgentChat.js`. Miss one and it won't work.

4. **Using `buildPrompt` instead of `directAction`** — `buildPrompt` puts text in the input for the user to edit. `directAction` sends immediately. For Receptionist commands, always use `directAction` — the user shouldn't have to manually edit slash commands.

5. **Passing only the selected contact** — use `emailContacts` (from `contextContactsHook`) to include ALL participants, not just `contactName`/`contactId` which is only the contact selected in the right panel.

6. **Not including verification in the skill** — every skill that writes data must end with a GET to verify. This is non-negotiable.

7. **Writing a skill before the backend endpoint exists** — the Receptionist will either fail with 404/502 or worse, hallucinate that it succeeded. ALWAYS verify every endpoint the skill calls before deploying the skill. Test with curl first. See Step 0.
