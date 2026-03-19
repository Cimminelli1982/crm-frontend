---
name: create-deal-from-message
description: "Extract deal info from email/WhatsApp via AI and create deal + link contact/company"
version: 1.0.0
category: deals
---

# /create-deal-from-message

## Flusso

1. **Parse context** — the frontend sends Email Inbox ID (or WhatsApp chat info)
2. **Fetch message** from `command_center_inbox` via Supabase REST
3. **Call extraction endpoint** to extract deal info from the message
4. **Present extracted info** to Simone — ask for confirmation
5. **On confirmation**, create records in sequence
6. **Verify** each record with GET
7. **Respond** with summary

## 1) Fetch the message from command_center_inbox

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/command_center_inbox?id=eq.{INBOX_ID}&select=id,type,from_email,from_name,subject,body_text,date,chat_name,contact_number,direction,attachments" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 2) Check for attachments (PDF)

If the message has attachments (check the `attachments` jsonb field), find the PDF in Supabase Storage:

```bash
source /opt/openclaw.env

# Search by file name from the attachments jsonb
curl -sS "${SUPABASE_URL}/rest/v1/attachments?file_name=ilike.*{FILENAME}*&file_type=eq.application/pdf&order=created_at.desc&limit=3&select=attachment_id,file_name,file_url,created_at" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 3) Call extraction endpoint

```bash
source /opt/openclaw.env

# For email
curl -sS -X POST "${CRM_AGENT_URL}/extract-deal-from-email" \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "{email|whatsapp}",
    "from_email": "{FROM_EMAIL}",
    "from_name": "{FROM_NAME}",
    "subject": "{SUBJECT}",
    "body_text": "{BODY_TEXT}",
    "date": "{DATE}",
    "attachment": {
      "file_name": "{FILE_NAME}",
      "file_type": "application/pdf",
      "file_url": "{FILE_URL}"
    }
  }'
```

For WhatsApp, use fields: `source_type: "whatsapp"`, `contact_phone`, `contact_name`, `conversation_text`.

If no attachment, omit the `attachment` field — the endpoint can extract from email body alone.

## 4) Present extracted info to Simone

Show the extracted data clearly:

**Deal:** {opportunity}
- Category: {category} | Stage: {stage}
- Amount: {currency} {total_investment}
- Source: {source_category}
- Description: {description}

**Contact:** {first_name} {last_name} ({use_existing ? "existing" : "NEW"})
- Email: {email} | Role: {job_role}

**Company:** {name} ({use_existing ? "existing" : "NEW"})
- Website: {website} | Category: {category}

Ask: "Shall I create this deal? (you can ask me to change any field before confirming)"

## 5) On confirmation — create records in sequence

### 5a. Contact (if new)
```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/contacts" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"first_name":"{FIRST}","last_name":"{LAST}","job_role":"{ROLE}","category":"{CAT}","created_by":"LLM"}'

# Add email
curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_emails" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contact_id":"{CONTACT_ID}","email":"{EMAIL}","is_primary":true}'
```

### 5b. Company (if new)
```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/companies" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"name":"{NAME}","website":"{WEBSITE}","category":"{CAT}","created_by":"LLM"}'

# Add domain
curl -sS -X POST "${SUPABASE_URL}/rest/v1/company_domains" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_id":"{COMPANY_ID}","domain":"{DOMAIN}","is_primary":true}'
```

### 5c. Link contact to company
```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_companies" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contact_id":"{CONTACT_ID}","company_id":"{COMPANY_ID}","relationship":"{RELATIONSHIP}"}'
```

### 5d. Create deal
```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/deals" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"opportunity":"{OPP}","total_investment":{AMOUNT},"deal_currency":"{CUR}","category":"{CAT}","stage":"{STAGE}","source_category":"{SRC}","description":"{DESC}","created_by":"LLM"}'
```

### 5e. Link deal to contact
```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/deals_contacts" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"{DEAL_ID}","contact_id":"{CONTACT_ID}","relationship":"proposer"}'
```

### 5f. Link deal to company (if deal_companies table exists)
```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/deal_companies" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"{DEAL_ID}","company_id":"{COMPANY_ID}"}'
```

## 6) Verify each record

After creating, GET each record to confirm it exists:

```bash
source /opt/openclaw.env

# Verify deal
curl -sS "${SUPABASE_URL}/rest/v1/deals?deal_id=eq.{DEAL_ID}&select=deal_id,opportunity,stage" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 7) Response format

"Created deal **{opportunity}** ({stage}) linked to {contact_name} at {company_name} ✓"

## Log operativo
Log in ops-log.md: timestamp, action: create-deal-from-message, source: email/whatsapp, inbox_id, deal_id, opportunity
