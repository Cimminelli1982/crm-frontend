---
name: list-related-deals
description: "Show deals linked to the current contact"
version: 1.0.0
category: deals
---

# /list-related-deals

## Flusso

1. **Parse context** — the frontend sends Contact ID and Contact Name
2. **If no Contact ID** — ask Simone which contact to look up
3. **Query deals_contacts** — find all deals linked to this contact
4. **Format and display** — show deal opportunity, stage, category, amount, linked contacts
5. **Handle edge cases** — no deals found → say so

## 1) Find deals for contact

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/deals_contacts?contact_id=eq.{CONTACT_ID}&select=relationship,deals(deal_id,opportunity,deal_name,stage,category,total_investment,deal_currency,source_category,description,created_at)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 2) Get linked contacts for each deal (optional, for richer display)

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/deals_contacts?deal_id=eq.{DEAL_ID}&select=relationship,contacts(contact_id,first_name,last_name)" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 3) Format response

Present each deal as:
- **{opportunity}** — Stage: {stage} | Category: {category}
  - Amount: {currency} {total_investment} (if set)
  - Source: {source_category}
  - Role: {relationship} (the contact's role in this deal)
  - Created: {created_at}

If no deals found, respond: "No deals found linked to {contact name}."

## Log operativo
Log in ops-log.md: timestamp, action: list-related-deals, contact_id, result count
