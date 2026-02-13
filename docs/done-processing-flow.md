# Done Processing Flow

What happens when a user clicks "Done" on inbox items. This is step 4 in the data pipeline — moving items from the staging table (`command_center_inbox`) into the final CRM tables.

---

## Overview

There are three types of inbox items, each with its own Done flow:

| Type | Handler | Location |
|------|---------|----------|
| Email | `saveAndArchiveAsync()` | `useEmailActions.js` |
| WhatsApp | `handleWhatsAppDoneAsync()` | `useWhatsAppData.js` |
| Calendar | Dismiss via backend | `useCalendarData.js` |

The keyboard shortcut `3` triggers Done for the active tab.

---

## Email Done Flow

The email Done flow is the most complex. It uses an **optimistic async pattern**: the UI updates immediately, then a backend call does the heavy lifting.

### Step-by-step

#### 1. Attachment check
When the user clicks Done (or sends a reply), `handleDoneClick()` runs first:
- Collects all attachments from the email thread
- Filters out images and `.ics` files (auto-skipped)
- If there are relevant attachments (PDFs, docs, etc.), shows the `AttachmentSaveModal` so the user can save them to the CRM
- Once the modal is closed (or if no attachments), calls `saveAndArchiveAsync()`

#### 2. Optimistic UI update (`saveAndArchiveAsync`)
- Sets status to `'archiving'` in `command_center_inbox` (a quick DB update, ~200ms)
- Updates local state so the thread shows as archiving
- Selects the next thread in the list
- Fires off a **non-blocking** `fetch` to the backend

#### 3. Backend processing (`POST /email/save-and-archive`)
The backend does all the CRM record creation:

**a. Create/update `email_threads`**
- Looks up by `thread_id`. If it exists, updates `last_message_timestamp`. If not, creates a new row.
- Subject is cleaned (strips `Re:` / `Fwd:` prefixes).

**b. Create `emails` record**
- One row per email in the thread
- Uses `fastmail_id` as the unique key (`gmail_id` column) to avoid duplicates
- Sets `direction` based on whether sender is `simone@cimminelli.com`
- Stores `body_plain`, `body_html`, `subject`, `message_timestamp`, attachment info

**c. Create `email_participants`**
- Links each CRM contact to the email with their role: `sender`, `to`, or `cc`
- Skips if the participant already exists

**d. Create `interactions`**
- One interaction per CRM contact per thread (not per email)
- Uses `email_thread_id` to check for duplicates
- Direction: `sent` if I sent it, `received` if they sent it
- Summary = email subject

**e. Link thread to contacts**
- Creates rows in `contact_email_threads` (junction table)

**f. Update `last_interaction_at`**
- Updates the `contacts` table for each participant
- Only updates if the email date is newer than current value

**g. Archive in Fastmail**
- Calls `POST /archive` to move the email out of Fastmail inbox

**h. Delete from `command_center_inbox`**
- Removes the staged row (or updates status if keeping in inbox with a special status like `need_actions`)

#### 4. Success / Rollback
- On success: removes the thread from local state, shows toast
- On failure: rolls back the `command_center_inbox` status to `null`, shows error toast

### Special case: Send + Done
When the user sends a reply via `handleSendWithAttachmentCheck()`, the same Done flow runs after the email is sent. The `pendingInboxStatusRef` can keep the email in the inbox with a status (e.g., `need_actions` or `waiting_input`) instead of deleting it.

---

## WhatsApp Done Flow

Similar pattern to email, also has sync and async versions.

### Step-by-step (`handleWhatsAppDoneAsync`)

#### 1. Optimistic UI update
- Sets all messages in the chat to `status: 'archiving'` in `command_center_inbox`
- Updates local state, selects next chat

#### 2. Backend processing (`POST /whatsapp/save-and-archive`)
The backend handles:

**a. Find or create `chats` record**
- Looks up by `external_chat_id` (TimelinesAI ID)
- For groups, also tries matching by `chat_name`
- Creates new chat if no match

**b. Link chat to contact**
- Finds contact by phone number in `contact_mobiles`
- Creates row in `contact_chats` junction table

**c. Create `interactions`**
- One interaction per message
- Uses `message_uid` as `external_interaction_id` to avoid duplicates
- Links to `chat_id` and `contact_id`

**d. Link attachments**
- Updates `attachments` table rows (matched by `external_reference`) with `chat_id`, `contact_id`, `interaction_id`

**e. Update `last_interaction_at`**
- Same as email — updates contact's timestamp if newer

**f. Delete from `command_center_inbox`**

**g. Track in `whatsapp_chat_done`**
- Records the `chat_id` and `last_message_uid` to prevent sent messages from reappearing in the inbox on future syncs

#### 3. Success / Rollback
Same pattern as email — rollback on failure.

---

## Calendar Done Flow

Calendar events have a simpler "dismiss" flow rather than a full CRM save.

### Step-by-step
1. User confirms dismissal
2. Calls `POST /calendar/delete-event` on the Python backend (`crm-agent-service`)
3. Backend deletes the event from `command_center_inbox`
4. Removes from local state, selects next event

Calendar events don't create interactions or link to contacts through the Done button — that linking happens through the meetings system separately.

---

## Status Values in `command_center_inbox`

| Status | Meaning |
|--------|---------|
| `null` | Normal inbox item |
| `need_actions` | User flagged as needing action |
| `waiting_input` | User is waiting for a response |
| `archiving` | Being processed (optimistic, pre-backend) |

---

## Tables Written To

| Table | Email Done | WhatsApp Done | Calendar Done |
|-------|-----------|---------------|---------------|
| `email_threads` | ✅ create/update | | |
| `emails` | ✅ create | | |
| `email_participants` | ✅ create | | |
| `interactions` | ✅ create | ✅ create | |
| `contact_email_threads` | ✅ create | | |
| `chats` | | ✅ create/update | |
| `contact_chats` | | ✅ create | |
| `attachments` | | ✅ update links | |
| `whatsapp_chat_done` | | ✅ upsert | |
| `contacts` | ✅ update `last_interaction_at` | ✅ update `last_interaction_at` | |
| `command_center_inbox` | ✅ delete | ✅ delete | ✅ delete |

---

## Key Files

| File | What it does |
|------|-------------|
| `src/hooks/command-center/useEmailActions.js` | Email Done logic (frontend + backend call) |
| `src/hooks/command-center/useWhatsAppData.js` | WhatsApp Done logic |
| `src/hooks/command-center/useCalendarData.js` | Calendar dismiss logic |
| `backend/src/index.js` | Backend endpoints (`/email/save-and-archive`, `/archive`) |
