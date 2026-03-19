---
name: create-contact
description: "Conversational multi-step flow to create a new contact in the CRM"
version: 1.0.0
category: crm
---

# /create-contact

A **conversational** contact creation flow. NOT a form — gather info step by step, accept partial/multiple answers, create incrementally.

## Prerequisites

```bash
source /opt/openclaw.env
```

Reference: `skills/crm-contacts/SKILL.md` for all CRUD operations.

---

## Phase 1: Gather context

Extract as much as possible from the CRM context sent by the frontend.

### If Email Inbox ID is provided:

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/command_center_inbox?id=eq.{INBOX_ID}&select=id,from_name,from_email,subject,body_text,to_recipients,cc_recipients,date" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

Extract from the result:
- **Name**: from `from_name` (split into first_name / last_name)
- **Email**: from `from_email`
- **Company clues**: email domain (if not gmail/yahoo/hotmail/outlook/icloud), mentions in body_text
- **Role/context**: from email signature, subject, body

### If WhatsApp chat context:

```bash
source /opt/openclaw.env

# Search inbox for recent WhatsApp messages from this chat
curl -sS "${SUPABASE_URL}/rest/v1/command_center_inbox?type=eq.whatsapp&chat_name=ilike.%25{CHAT_NAME}%25&order=date.desc&limit=1&select=id,chat_name,contact_number,from_name,body_text,date" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

Extract: name from `chat_name` or `from_name`, phone from `contact_number`.

### If Contact Name is in context:

Use it directly as first_name/last_name.

---

## Phase 2: Duplicate check (6-tier)

Run ALL applicable checks before proceeding. Do NOT skip any tier.

### Tier 1 — Exact email match (100% confidence)

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/contact_emails?email=eq.{EMAIL}&select=email_id,contact_id,email,contacts(contact_id,first_name,last_name,category)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

If match → "This email already belongs to **{name}** ({category}). Is this who you mean?"

### Tier 2 — Full name match, both orderings (90%)

```bash
source /opt/openclaw.env

# Exact: first_name + last_name
curl -sS "${SUPABASE_URL}/rest/v1/contacts?first_name=ilike.{FIRST}&last_name=ilike.{LAST}&select=contact_id,first_name,last_name,category&limit=5" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Reversed: first_name = last, last_name = first
curl -sS "${SUPABASE_URL}/rest/v1/contacts?first_name=ilike.{LAST}&last_name=ilike.{FIRST}&select=contact_id,first_name,last_name,category&limit=5" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Tier 3 — Surname + first initial (85%)

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/contacts?last_name=ilike.{LAST}&first_name=ilike.{FIRST_INITIAL}%25&select=contact_id,first_name,last_name,category&limit=5" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Tier 4 — Surname only (60%, only if surname ≥ 3 chars)

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/contacts?last_name=ilike.{LAST}&select=contact_id,first_name,last_name,category&limit=10" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

Use these as **related contacts** — show them for context:
"Note: {name} ({category}) shares the surname."

### Tier 5 — First name + domain (50%, exclude free email providers)

Only if email domain is NOT in: gmail.com, yahoo.com, hotmail.com, outlook.com, icloud.com, live.com, me.com, protonmail.com, mail.com

```bash
source /opt/openclaw.env

# Find contacts with same first name who have an email at the same domain
curl -sS "${SUPABASE_URL}/rest/v1/contact_emails?email=ilike.%25@{DOMAIN}&select=contact_id,email,contacts(contact_id,first_name,last_name,category)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Tier 6 — Domain only (30%)

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/contact_emails?email=ilike.%25@{DOMAIN}&select=contact_id,email,contacts(contact_id,first_name,last_name,category)&limit=10" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Also check contacts_hold:

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/contacts_hold?or=(first_name.ilike.%25{FIRST}%25,last_name.ilike.%25{LAST}%25)&select=*" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### Present results

If **exact match** (Tier 1-2): "Found **{name}** ({category}) — is this the same person? If yes, I won't create a duplicate."

If **partial match** (Tier 3-5): "Found possible matches: {list}. Any of these the same person?"

If **related contacts** (Tier 4): "Note: {name} ({category}) shares the surname — could be related."

Wait for Simone's answer before proceeding.

---

## Phase 3: Present what's known + first question

After duplicate check clears, present what you gathered:

```
Here's what I have:
- Name: {first_name} {last_name}
- Email: {email} (if available)
- Phone: {phone} (if available)
- Source: {Email/WhatsApp}
- Related: {related contacts if any}

What category? (Founder, Professional Investor, Manager, Friend and Family, Advisor, Supplier, Media, Student, Other)
```

---

## Phase 4: Step-by-step input

Ask ONE thing at a time. Priority order:

1. **Category** — show options: `Founder, Professional Investor, Manager, Friend and Family, Advisor, Supplier, Media, Student, Other`
2. **Company** — "Which company?" → search existing companies by name/domain, offer to create new if not found
3. **Relationship** with company — `employee, founder, advisor, manager, investor, other`
4. **City** — "Which city?" → search existing cities
5. **Job role** — free text
6. **Score** — 1 to 5
7. **Tags** — "Any tags?" → suggest relevant ones based on category, search existing
8. **Keep in touch** — `Monthly, Quarterly, Twice per Year, Once per Year, Weekly, Do not keep in touch`
9. **Christmas wishes** — `whatsapp standard, email standard, no wishes`
10. **Easter wishes** — `whatsapp standard, email standard, no wishes`

### Rules:
- **Parse multi-field answers**. If Simone says "Founder, London, score 4" → set category=Founder, city=London, score=4 and skip those questions.
- **Accept "basta", "skip", "crea", "ok create"** → stop asking and create with what's available.
- **Don't ask for fields that are obviously not relevant** — e.g., don't ask for KIT/wishes if category is "Skip" or "Other".
- **Be smart about company**: if email domain gives a clear company clue, search it first and propose.

---

## Phase 5: Create records (sequential)

Follow `skills/crm-contacts/SKILL.md` Section 13 workflow. Always `source /opt/openclaw.env` before each curl.

### 5.1 Create contact

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/contacts" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{
    "first_name": "{FIRST}",
    "last_name": "{LAST}",
    "category": "{CATEGORY}",
    "job_role": "{JOB_ROLE}",
    "description": "{DESCRIPTION}",
    "score": {SCORE},
    "linkedin": "{LINKEDIN}",
    "show_missing": true,
    "created_by": "LLM"
  }'
```

Save `contact_id` from response.

### 5.2 Add email (if available)

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_emails" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"contact_id": "{CONTACT_ID}", "email": "{EMAIL_LOWERCASE}", "is_primary": true}'
```

### 5.3 Add phone (if available)

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_mobiles" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"contact_id": "{CONTACT_ID}", "mobile": "{PHONE}", "type": "personal", "is_primary": true}'
```

### 5.4 Link company (if set)

Search company first, create if not found:

```bash
source /opt/openclaw.env

# Search
curl -sS "${SUPABASE_URL}/rest/v1/companies?name=ilike.%25{COMPANY_NAME}%25&select=company_id,name,category" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Link
curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_companies" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"contact_id": "{CONTACT_ID}", "company_id": "{COMPANY_ID}", "relationship": "{RELATIONSHIP}", "is_primary": true}'
```

### 5.5 Add city (if set)

```bash
source /opt/openclaw.env

# Search city
curl -sS "${SUPABASE_URL}/rest/v1/cities?name=ilike.%25{CITY}%25&select=city_id,name" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Create city if not found
curl -sS -X POST "${SUPABASE_URL}/rest/v1/cities" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"name": "{CITY}"}'

# Link
curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_cities" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"contact_id": "{CONTACT_ID}", "city_id": "{CITY_ID}"}'
```

### 5.6 Add tags (if set)

```bash
source /opt/openclaw.env

# Search tag
curl -sS "${SUPABASE_URL}/rest/v1/tags?name=ilike.%25{TAG}%25&select=tag_id,name" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Link (tag must exist — search first, create only if user confirms new tag)
curl -sS -X POST "${SUPABASE_URL}/rest/v1/contact_tags" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"contact_id": "{CONTACT_ID}", "tag_id": "{TAG_ID}"}'
```

### 5.7 Set Keep in Touch (if set)

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/keep_in_touch" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation,resolution=merge-duplicates" \
  -d '{
    "contact_id": "{CONTACT_ID}",
    "frequency": "{FREQUENCY}",
    "christmas": "{CHRISTMAS}",
    "easter": "{EASTER}"
  }'
```

---

## Phase 6: Verify + report completeness

### 6.1 Verify full card

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/contacts?contact_id=eq.{CONTACT_ID}&select=*,contact_emails(*),contact_mobiles(*),contact_cities(city_id,cities(city_id,name)),contact_tags(entry_id,tags(tag_id,name)),contact_companies(contact_companies_id,relationship,is_primary,companies(company_id,name,category)),keep_in_touch(*)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### 6.2 Query completeness score

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/contact_completeness?contact_id=eq.{CONTACT_ID}&select=completeness_score,email_count,mobile_count,company_count,city_count,tag_count,kit_frequency,christmas,easter" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

### 6.3 Report

Present a summary:

```
Created **{first_name} {last_name}** ({category}) — completeness {score}%

✓ Name, ✓ Category, ✓ Email, ✓ Company (Acme Inc)
✗ Missing: description, LinkedIn, photo, birthday, tags
```

List what's present (✓) and what's missing (✗) based on the 17-point formula:
- first_name (2pt), last_name (2pt), category (1pt), score (1pt)
- description (1pt), job_role (1pt), linkedin (1pt)
- email_or_mobile (2pt), company (1pt), city (1pt)
- tags (1pt), kit_frequency (1pt), christmas (1pt), easter (1pt)

---

## Phase 7: Offer delegation

After reporting completeness, if score < 80%, offer:

"Want me to activate Barbara to enrich this contact? She can look up LinkedIn, job title, photo, city, and company details."

If Simone says yes:

```bash
source /opt/openclaw.env

# Determine missing dimensions from completeness query
# Possible dimensions: completeness, photo, note, company, company_complete

curl -sS -X POST "${SUPABASE_URL}/rest/v1/contacts_clarissa_processing" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{
    "contact_id": "{CONTACT_ID}",
    "bucket": "new_contact",
    "missing_dimensions": ["completeness", "photo", "company_complete"],
    "missing_details": {
      "missing_fields": ["linkedin", "description", "photo", "birthday"],
      "source": "create-contact"
    }
  }'
```

Respond: "Queued for Barbara — she'll enrich LinkedIn, photo, and company details."

---

## Log

```bash
cat >> ops-log.md <<LOGEOF
- Contact: created "{first_name} {last_name}" | {category} | completeness:{score}% | id:{CONTACT_ID}
LOGEOF
```
