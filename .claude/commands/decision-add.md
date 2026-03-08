---
allowed-tools: mcp__supabase__execute_sql
description: Add a decision to the CRM decisions tracker
---

Add a decision to the CRM decisions tracker in Supabase.

## Schema

**decisions** table:
- `decision_id` uuid PK (auto)
- `decision_date` date (default today)
- `detail` text NOT NULL — the decision description
- `category` decision_category NOT NULL — one of: Investment, Team, Time, Money, Family
- `confidence` integer NOT NULL — 1 to 5 scale
- `notes` text — optional extra notes
- `created_by` creation_source (default 'User')

**Junction tables** (optional links):
- `decision_contacts` (decision_id, contact_id)
- `decision_companies` (decision_id, company_id)
- `decision_deals` (decision_id, deal_id)

## IMPORTANT RULES

1. **ALWAYS ask for confidence** before inserting. Never default to 3. Ask: "Confidence da 1 a 5?"
2. **Infer category smartly** using these guidelines:
   - **Money**: spending, subscriptions, purchases, renewals that cost money
   - **Time**: how you spend your time, activities, commitments, events, hobbies, fitness, sport, courses
   - **Investment**: startup investments, fund commitments, financial allocations
   - **Team**: hiring, firing, team changes, roles
   - **Family**: family-related decisions
3. **Show category + ask confirmation** before inserting: "Category: Time, confidence? (1-5)"
4. **Date**: Default today unless user specifies otherwise

## Steps

### 1. Parse User Input

Extract from the request:
- **detail**: Required — what was decided
- **category**: Infer from context using the guidelines above
- **date**: Default today if not specified
- **notes**: Any additional context
- **linked entities**: Contact/company/deal names if mentioned

### 2. Ask Confirmation Before Insert

Show the user what you're about to insert and ask for confidence:

> **Decision**: [detail]
> **Category**: [inferred category]
> **Date**: [date]
> **Confidence (1-5)?**

Wait for user response before proceeding.

### 3. Look Up Linked Entities (if names mentioned)

For contacts:
```sql
SELECT contact_id, first_name || ' ' || COALESCE(last_name, '') AS name
FROM contacts
WHERE LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE LOWER('%NAME%')
LIMIT 5
```

For companies:
```sql
SELECT company_id, name FROM companies WHERE LOWER(name) LIKE LOWER('%NAME%') LIMIT 5
```

For deals:
```sql
SELECT deal_id, opportunity FROM deals WHERE LOWER(opportunity) LIKE LOWER('%NAME%') LIMIT 5
```

If multiple matches, ask the user to disambiguate.

### 4. Insert the Decision

```sql
INSERT INTO decisions (decision_date, detail, category, confidence, notes)
VALUES ('DATE', 'DETAIL', 'CATEGORY', CONFIDENCE, 'NOTES')
RETURNING decision_id, decision_date, detail, category, confidence;
```

### 5. Link Entities (if any)

```sql
INSERT INTO decision_contacts (decision_id, contact_id) VALUES ('DECISION_ID', 'CONTACT_ID');
INSERT INTO decision_companies (decision_id, company_id) VALUES ('DECISION_ID', 'COMPANY_ID');
INSERT INTO decision_deals (decision_id, deal_id) VALUES ('DECISION_ID', 'DEAL_ID');
```

### 6. Confirm

Short summary: detail, category, confidence, date, linked entities.

## Examples

User: "prenotato 3 lezioni di box"
→ Ask: "Category: Time, confidence 1-5?"
→ User: "4"
→ Insert with category Time, confidence 4

User: "investing 50k in Acme startup"
→ Ask: "Category: Investment, confidence 1-5?"
→ Link to Acme deal/company if found

User: "decided to renew the cooking academy membership even though I never go"
→ Ask: "Category: Money, confidence 1-5?"
