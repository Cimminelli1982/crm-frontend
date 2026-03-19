---
name: change-deal-stage
description: "Update the stage of a deal in the pipeline"
version: 1.0.0
category: deals
---

# /change-deal-stage

## Flusso

1. **Parse context** — the frontend sends Deal ID, Deal Name, Contact ID
2. **If no Deal ID** — ask Simone which deal (search by name)
3. **Show current stage** and list valid stages
4. **Ask for new stage** (if not already specified in the message)
5. **Update** the deal stage via PATCH
6. **Verify** with GET after update
7. **Respond** with confirmation

## Valid stages
Lead, Evaluating, Qualified, Closing, Negotiation, Invested, Closed Won, Monitoring, Closed Lost, Passed

## 1) Get current deal info

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/deals?deal_id=eq.{DEAL_ID}&select=deal_id,opportunity,deal_name,stage,category,total_investment,deal_currency" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 2) If no Deal ID — search by name

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/deals?or=(opportunity.ilike.*{SEARCH}*,deal_name.ilike.*{SEARCH}*)&select=deal_id,opportunity,deal_name,stage&limit=5" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

If multiple results, ask Simone to pick one. If no results, tell him.

## 3) Update stage

```bash
source /opt/openclaw.env

curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/deals?deal_id=eq.{DEAL_ID}" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"stage": "{NEW_STAGE}", "last_modified_by": "LLM", "last_modified_at": "{ISO_TIMESTAMP}"}'
```

## 4) Verify

```bash
source /opt/openclaw.env

curl -sS "${SUPABASE_URL}/rest/v1/deals?deal_id=eq.{DEAL_ID}&select=deal_id,opportunity,stage" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 5) Response format

"Updated **{opportunity}** from {old_stage} → **{new_stage}** ✓"

## Log operativo
Log in ops-log.md: timestamp, action: change-deal-stage, deal_id, old_stage → new_stage
