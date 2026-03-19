---
name: track-intro-promised
description: "Track a promised introduction between two contacts"
version: 1.3.0
category: introductions
---

# /track-intro-promised

## Flusso

1. **Parse context** — the frontend sends email contacts, email subject, contact name if available
2. **Ask all 4 questions in one message** (use the selected contact name from context if available):
   - **Who are the 2 people?** (always ask for both names, even if a contact is selected in the panel)
   - **Category:** Karma Points, Dealflow, or Portfolio Company?
   - **Tool:** email or whatsapp?
   - **Status:** Requested, Promised, Done & Dust, Done but need to monitor, or Aborted?
3. **Search contacts** in Supabase by name
4. **Check for existing introduction** between the 2 contacts — if found, tell Simone and ask if he wants to proceed anyway
5. **Create introduction** with the chosen status
6. **Link contacts** as introducees
7. **VERIFY** — GET to confirm the record was created
8. **Respond** with confirmation + `[INTRO_ACTION:{...}]` marker for the frontend button
9. **Log** in ops-log.md

## Step 2 detail — the 4 questions

Present them as a single compact message. ALWAYS ask for both names, even if a contact is selected in the right panel.

```
I need 4 things:
1. Who are the 2 people? (give me both names)
2. Category: Karma Points, Dealflow, or Portfolio Company?
3. Tool: email or whatsapp?
4. Status: Requested, Promised, Done & Dust, Done but need to monitor, or Aborted?
```

Simone may answer all 4 at once or partially. If partial, ask only for what's missing.

## 1) Search contacts by name

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/contacts?or=(first_name.ilike.*{NAME}*,last_name.ilike.*{NAME}*)&select=contact_id,first_name,last_name,category&limit=5" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

If multiple results, pick the best match. If no result, ask Simone to clarify.
Do this for BOTH names.

## 2) Check for existing introduction between the 2 contacts

BEFORE creating anything, check if these 2 contacts have already been introduced.

```bash
source /opt/openclaw.env

# Get all introduction_ids for contact 1
curl -sS "${SUPABASE_URL}/rest/v1/introduction_contacts?contact_id=eq.{CONTACT_1_ID}&select=introduction_id" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

From the result, extract the list of introduction_ids. Then check if contact 2 appears in any of them:

```bash
# Check if contact 2 is in any of those introductions
curl -sS "${SUPABASE_URL}/rest/v1/introduction_contacts?contact_id=eq.{CONTACT_2_ID}&introduction_id=in.({INTRO_ID_1},{INTRO_ID_2},...)&select=introduction_id,introductions(introduction_id,status,category,introduction_date,introduction_tool)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

If results are found, these 2 contacts have been introduced before. Tell Simone:
"These two were already introduced on {date} (status: {status}, category: {category}). Do you want to create a new introduction anyway?"

Wait for confirmation before proceeding. If Simone says no, stop here.

## 3) Create introduction

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/introductions" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "introduction_date": "{TODAY_YYYY-MM-DD}",
    "introduction_tool": "{TOOL}",
    "category": "{CATEGORY}",
    "text": "{OPTIONAL_NOTE}",
    "status": "{STATUS}"
  }'
```

Save the `introduction_id` from the response.

Valid categories: `Karma Points`, `Dealflow`, `Portfolio Company`
Valid tools: `email`, `whatsapp`, `in person`, `other`
Valid statuses: `Requested`, `Promised`, `Done & Dust`, `Done, but need to monitor`, `Aborted`

## 4) Link contacts

Both contacts are "introducee" (Simone is the introducer but is not stored as a contact).

```bash
source /opt/openclaw.env

# Contact 1
curl -sS -X POST "${SUPABASE_URL}/rest/v1/introduction_contacts" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"introduction_id": "{INTRO_ID}", "contact_id": "{CONTACT_1_ID}", "role": "introducee"}'

# Contact 2
curl -sS -X POST "${SUPABASE_URL}/rest/v1/introduction_contacts" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"introduction_id": "{INTRO_ID}", "contact_id": "{CONTACT_2_ID}", "role": "introducee"}'
```

If someone asked Simone to make the intro (an introducer), add them with role "introducer".

## 5) Verify

GET to confirm the introduction and links were created. Do NOT respond to Simone until you have verified.

```bash
source /opt/openclaw.env

# Introduction created
curl -sS "${SUPABASE_URL}/rest/v1/introductions?introduction_id=eq.{INTRO_ID}&select=introduction_id,introduction_date,introduction_tool,category,status,text" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Contacts linked
curl -sS "${SUPABASE_URL}/rest/v1/introduction_contacts?introduction_id=eq.{INTRO_ID}&select=contact_id,role,contacts(first_name,last_name)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

If either GET returns empty or the data doesn't match, report the error to Simone. Do NOT say it worked if it didn't.

## 6) Response

ONLY after successful verification, respond with a short confirmation AND append the `[INTRO_ACTION:...]` marker on a new line. The marker is NOT shown to the user — the frontend parses it and renders a "Make intro" button.

Format:
```
Tracked: {Contact1} <> {Contact2} | {category} | via {tool} | status: {status}

[INTRO_ACTION:{"tool":"{TOOL}","introductionId":"{INTRO_ID}","contact1":"{CONTACT1_FULL_NAME}","contact2":"{CONTACT2_FULL_NAME}","category":"{CATEGORY}"}]
```

The JSON inside INTRO_ACTION must be valid JSON on a single line. The `tool` field must be exactly "email" or "whatsapp".

IMPORTANT: Only include the [INTRO_ACTION:...] marker if the tool is "email" or "whatsapp". If tool is "in person" or "other", do NOT include the marker (no button needed).

## Log

```bash
cat >> ops-log.md <<LOGEOF
- Intro: tracked "{Contact1} <> {Contact2}" | {category} | {tool} | status:{STATUS} | id:{INTRO_ID}
LOGEOF
```
