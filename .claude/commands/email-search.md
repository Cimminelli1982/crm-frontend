---
allowed-tools: mcp__supabase__execute_sql
description: Search emails in Supabase DB
---

Search the emails stored in Supabase based on the user's request: $ARGUMENTS

## Supabase Project
- **Project ID**: `efazuvegwxouysfcgwja`

## Email Schema (DO NOT query information_schema, use this directly)

### emails table
```
email_id            uuid PK
gmail_id            text
thread_id           text
sender_contact_id   uuid
subject             text
body_plain          text
body_html           text
message_timestamp   timestamptz
labels              text
is_read             boolean
is_starred          boolean
created_at          timestamptz
created_by          text
email_thread_id     uuid FK -> email_threads.email_thread_id
direction           text (sent/received)
has_attachments     boolean
attachment_count    integer
special_case        text
```

### email_threads table
```
email_thread_id     uuid PK
thread_id           text
subject             text
```

### email_participants table
```
email_id            uuid FK -> emails.email_id
contact_id          uuid FK -> contacts.contact_id
participant_type    email_participant_type ENUM: sender, to, cc, bcc (⚠️ use 'sender' NOT 'from')
```

### contacts table (for joins)
```
contact_id          uuid PK
first_name          text
last_name           text
```

### contact_emails table (for joins)
```
email_id            uuid PK
contact_id          uuid FK
email               varchar
```

## Instructions

1. Go straight to querying — DO NOT run any schema discovery queries (no information_schema, no column lookups).
2. Use `ILIKE '%keyword%'` for text searches on `subject` and `body_plain`.
3. Use `LEFT(body_plain, 1500)` as `body_preview` to avoid huge results.
4. Order by `message_timestamp DESC` and `LIMIT 10` unless the user asks for more.
5. ⚠️ `body_plain` often contains HTML, not clean text. When body_plain is HTML, search `body_html` instead with `ILIKE`.
6. To extract specific info (dates, amounts, addresses) from HTML bodies, use `substring(body_html from 'pattern.{0,100}')` or `regexp_matches(body_html, 'pattern', 'gi')`.
7. Join with `email_participants` and `contacts` when the user asks about sender/recipient.
8. Present results clearly: subject, date, direction, and relevant body excerpts.
9. If the user's request is vague, search broadly by subject first, then narrow down into body content.
