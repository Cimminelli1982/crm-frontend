# Data Cleaning System

Il sistema di Data Cleaning gestisce le azioni utente su contatti e company non ancora nel CRM, permettendo di aggiungerli, metterli in hold, o marcarli come spam.

## Architettura

```
                    COMMAND CENTER UI
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌───────────┐     ┌──────────┐
   │   Add   │      │   Hold    │     │   Spam   │
   └────┬────┘      └─────┬─────┘     └────┬─────┘
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌───────────┐     ┌──────────┐
   │contacts │      │contacts_  │     │emails_   │
   │companies│      │hold       │     │spam      │
   └─────────┘      │companies_ │     │domains_  │
                    │hold       │     │spam      │
                    └───────────┘     │whatsapp_ │
                                      │spam      │
                                      └──────────┘
```

---

## Azioni per Tipo di Entità

### Contacts (Email & WhatsApp)

| Azione | Handler | Tabella Target | Effetto |
|--------|---------|----------------|---------|
| **Add** | `handleOpenCreateContact()` | `contacts` | Apre modal per creare contatto |
| **Hold** | `handlePutOnHold()` | `contacts_hold` | Salva per decisione futura |
| **Spam** | `handleAddToSpam()` | `emails_spam` / `whatsapp_spam` | Blocca mittente, cancella messaggi |

### Companies (Domains)

| Azione | Handler | Tabella Target | Effetto |
|--------|---------|----------------|---------|
| **Add** | `handleAddCompanyFromDomain()` | `companies` + `company_domains` | Crea company con dominio |
| **Hold** | `handleDomainAction(item, 'hold')` | `companies_hold` | Salva per decisione futura |
| **Spam** | `handleDomainAction(item, 'spam')` | `domains_spam` | Blocca dominio, cancella email |

---

## 1. Spam Flow

### Email Spam

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Spam" on email contact                            │
│  (CRM Tab or Data Integrity Tab)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. UPSERT to emails_spam                                       │
│     { email: 'sender@example.com', counter: 1 }                 │
│     onConflict: increment counter                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ARCHIVE in Fastmail                                         │
│     For each email with matching from_email:                    │
│       → Call archiveInFastmail(fastmail_id)                     │
│       → Moves to Archive folder                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DELETE from command_center_inbox                            │
│     WHERE from_email ILIKE 'sender@example.com'                 │
│     → Cascade deletes data_integrity_inbox issues               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. DISMISS data_integrity issues                               │
│     UPDATE data_integrity_inbox                                 │
│     SET status = 'dismissed'                                    │
│     WHERE email ILIKE 'sender@example.com'                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. REFRESH UI                                                  │
│     → removeEmailsBySender() updates local state                │
│     → refreshThreads() reloads inbox                            │
│     → Select first remaining thread                             │
└─────────────────────────────────────────────────────────────────┘
```

### WhatsApp Spam

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Spam" on WhatsApp contact                         │
│  (CRM Tab or Data Integrity Tab)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. UPSERT to whatsapp_spam                                     │
│     { mobile_number: '+393271907451', counter: 1 }              │
│     onConflict: increment counter                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. GET message_uids                                            │
│     SELECT message_uid FROM command_center_inbox                │
│     WHERE contact_number = '+393271907451'                      │
│     → Needed for attachment cleanup                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DELETE attachments                                          │
│     DELETE FROM attachments                                     │
│     WHERE external_reference IN (message_uids)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. DELETE from command_center_inbox                            │
│     WHERE contact_number = '+393271907451'                      │
│     AND type = 'whatsapp'                                       │
│     → Cascade deletes data_integrity_inbox issues               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. REFRESH UI                                                  │
│     → setWhatsappChats() removes chat from state                │
│     → setWhatsappMessages() removes messages                    │
│     → Select first remaining chat                               │
└─────────────────────────────────────────────────────────────────┘
```

### Domain Spam

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Spam" on company/domain                           │
│  (Data Integrity Tab → Companies sub-tab)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. UPSERT to domains_spam                                      │
│     { domain: 'example.com', counter: 1 }                       │
│     onConflict: increment counter                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ARCHIVE in Fastmail                                         │
│     For each email WHERE from_email ILIKE '%@example.com':      │
│       → Call archiveInFastmail(fastmail_id)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DELETE from command_center_inbox                            │
│     WHERE from_email ILIKE '%@example.com'                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. DISMISS data_integrity issues                               │
│     UPDATE data_integrity_inbox                                 │
│     SET status = 'dismissed'                                    │
│     WHERE domain = 'example.com'                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. REFRESH UI                                                  │
│     → refreshThreads() reloads inbox                            │
│     → setNotInCrmDomains() removes from list                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Hold Flow

### Contact Hold

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Hold" on contact                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. DETERMINE contact type                                      │
│     isWhatsApp = item.mobile && !item.email                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. UPSERT to contacts_hold                                     │
│                                                                 │
│     Email contact:                                              │
│     { email: 'john@example.com',                                │
│       full_name: 'John Doe',                                    │
│       source_type: 'email' }                                    │
│                                                                 │
│     WhatsApp contact:                                           │
│     { email: 'whatsapp_393271907451@placeholder.hold',          │
│       mobile: '+393271907451',                                  │
│       full_name: '+393271907451',                               │
│       source_type: 'whatsapp' }                                 │
│                                                                 │
│     onConflict: increment email_count                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DISMISS data_integrity issues                               │
│     UPDATE data_integrity_inbox                                 │
│     SET status = 'dismissed'                                    │
│     WHERE email/mobile matches                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. UPDATE UI state                                             │
│     → Add to holdContacts list                                  │
│     → Remove from notInCrmEmails list                           │
└─────────────────────────────────────────────────────────────────┘
```

### Company Hold

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Hold" on company/domain                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. CHECK if domain exists in companies_hold                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. INSERT/UPDATE companies_hold                                │
│     { domain: 'example.com',                                    │
│       name: 'example.com',                                      │
│       email_count: 1,                                           │
│       status: 'pending' }                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. UPDATE UI state                                             │
│     → Add to holdCompanies list                                 │
│     → Remove from notInCrmDomains list                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Actions from Hold

Contacts/companies in hold can be:
- **Added to CRM** → Creates contact/company, removes from hold
- **Marked as Spam** → Moves to spam table, removes from hold
- **Deleted** → Just removes from hold (no other action)

### From Hold: Add Contact

```
handleAddFromHold(item)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. CREATE contact in contacts table                            │
│     { first_name, last_name, category: 'Inbox' }                │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ADD email/mobile to contact_emails/contact_mobiles          │
│     Based on source_type                                        │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DELETE from contacts_hold                                   │
│     WHERE email = item.email                                    │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. UPDATE UI state                                             │
│     → Remove from holdContacts                                  │
└─────────────────────────────────────────────────────────────────┘
```

### From Hold: Spam Contact

```
handleSpamFromHold(item)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. DETERMINE type from source_type                             │
│     'whatsapp' → whatsapp_spam                                  │
│     'email' → emails_spam                                       │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. UPSERT to appropriate spam table                            │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. DELETE from contacts_hold                                   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. DELETE messages from command_center_inbox                   │
│     (if any exist for this contact)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Spam Tables Schema

### emails_spam

| Column | Type | Description |
|--------|------|-------------|
| `email` | text (PK) | Email address |
| `counter` | numeric | Times blocked |
| `filter_domain` | boolean | Also block domain |

### domains_spam

| Column | Type | Description |
|--------|------|-------------|
| `domain` | varchar (PK) | Domain name |
| `counter` | integer | Times blocked |
| `notes` | text | Optional notes |

### whatsapp_spam

| Column | Type | Description |
|--------|------|-------------|
| `mobile_number` | text (PK) | Phone number (E.164 format) |
| `counter` | numeric | Times blocked |

---

## Hold Tables Schema

### contacts_hold

| Column | Type | Description |
|--------|------|-------------|
| `hold_id` | uuid (PK) | Primary key |
| `email` | varchar | Email (or placeholder for WhatsApp) |
| `mobile` | text | Phone number (WhatsApp only) |
| `full_name` | text | Contact name |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `email_count` | integer | Times seen |
| `source_type` | varchar | 'email' or 'whatsapp' |
| `status` | varchar | 'pending' |
| `first_seen_at` | timestamp | First appearance |
| `last_seen_at` | timestamp | Last appearance |

### companies_hold

| Column | Type | Description |
|--------|------|-------------|
| `hold_id` | uuid (PK) | Primary key |
| `domain` | varchar | Domain name |
| `name` | text | Company name |
| `email_count` | integer | Times seen |
| `status` | varchar | 'pending' |

---

## UI Components

### CRM Tab (Contacts without CRM match)

```
┌─────────────────────────────────────────────────────────┐
│  T  The Blink Team                                      │
│     From: no-reply@account.blink.com                    │
│     [Add] [Hold] [Spam]                                 │
└─────────────────────────────────────────────────────────┘
```

### Data Integrity Tab

**Not in CRM - Contacts:**
```
┌─────────────────────────────────────────────────────────┐
│  john@example.com                                       │
│  John Doe                                               │
│  [Add] [Hold] [Spam]                                    │
└─────────────────────────────────────────────────────────┘
```

**Not in CRM - Companies:**
```
┌─────────────────────────────────────────────────────────┐
│  example.com                                            │
│  john@example.com                                       │
│  [Add] [Hold] [Spam]                                    │
└─────────────────────────────────────────────────────────┘
```

**Hold Section:**
```
┌─────────────────────────────────────────────────────────┐
│  jane@example.com (seen 3 times)                        │
│  Jane Doe                                               │
│  [Add] [Spam] [Delete]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Key Files

| Function | File |
|----------|------|
| Spam handlers | `src/pages/CommandCenterPage.js` |
| Hold handlers | `src/pages/CommandCenterPage.js` |
| CRM Tab UI | `src/components/command-center/CRMTab.js` |
| Data Integrity UI | `src/components/command-center/DataIntegrityTab.js` |
| Context hook | `src/hooks/useContextContacts.js` |

---

## TODO (Not Yet Implemented)

- [ ] Bulk actions (select multiple → spam all)
- [ ] Undo spam action
- [ ] Spam from Data Integrity Tab → Companies sub-tab (done)
- [ ] Domain spam should also spam all contacts from that domain
- [ ] Export spam lists
- [ ] Import spam lists
- [ ] Auto-spam based on patterns (like email ingestion)
- [ ] Spam analytics dashboard
