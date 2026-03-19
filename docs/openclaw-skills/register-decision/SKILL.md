---
name: register-decision
description: "Log decisions linked to CRM entities with category and confidence"
version: 2.0.0
category: decisions
---

# skills/decisions.md — Registrazione Decisioni

Obiettivo: registrare decisioni di Simone nel CRM e collegarle a contatti, aziende, deal.

## 0) Prerequisiti
- `source /opt/openclaw.env`
- Tabelle: `decisions`, `decision_contacts`, `decision_companies`, `decision_deals`
- Per cercare contatti/aziende/deal: vedi `modules/crm-contacts.md`

## 1) Variabili richieste

| Variabile | Obbligatoria | Default | Valori |
|---|---|---|---|
| detail | SI | — | testo libero: cosa ha deciso |
| category | no | Investment | Investment, Team, Time, Money, Family |
| confidence | no | 3 | 1-5 |
| decision_date | no | oggi | YYYY-MM-DD |
| notes | no | null | testo libero |

Se Simone non specifica `detail`, chiedi: "Cosa hai deciso?"
Se la categoria non e' chiara dal contesto, chiedi: "Investment, Team, Time, Money o Family?"

## 2) Creare la decisione

```bash
source /opt/openclaw.env

curl -sS -X POST "${SUPABASE_URL}/rest/v1/decisions" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"detail":"...","category":"Investment","confidence":3,"decision_date":"2026-03-08","notes":null,"created_by":"LLM"}'
```

Salva il `decision_id` dalla risposta.

## 3) Collegare (opzionale)

Se Simone menziona contatti, aziende o deal, cerca l'ID (vedi `modules/crm-contacts.md`) e collega.

```bash
# Contatto
curl -sS -X POST "${SUPABASE_URL}/rest/v1/decision_contacts" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"decision_id":"...","contact_id":"..."}'

# Azienda
curl -sS -X POST "${SUPABASE_URL}/rest/v1/decision_companies" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"decision_id":"...","company_id":"..."}'

# Deal
curl -sS -X POST "${SUPABASE_URL}/rest/v1/decision_deals" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"decision_id":"...","deal_id":"..."}'
```

## 4) Consultare

```bash
# Ultime 10
curl -sS "${SUPABASE_URL}/rest/v1/decisions?order=decision_date.desc&limit=10&select=decision_id,detail,category,confidence,decision_date,notes" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Per categoria
curl -sS "${SUPABASE_URL}/rest/v1/decisions?category=eq.Investment&order=decision_date.desc&select=decision_id,detail,confidence,decision_date" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"

# Con associazioni
curl -sS "${SUPABASE_URL}/rest/v1/decisions?order=decision_date.desc&limit=10&select=decision_id,detail,category,confidence,decision_date,decision_contacts(contacts(first_name,last_name)),decision_companies(companies(name)),decision_deals(deals(opportunity))" \
  -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY"
```

## 5) Flusso

1. Simone dice la decisione
2. Estrai: detail, category, confidence (chiedi se mancano detail o category ambigua)
3. POST su `decisions`
4. Se menziona contatti/aziende/deal → cerca ID e collega
5. Conferma: "Registrata: [detail] | [category] | confidence [N]/5 | collegata a [X, Y]"
6. Log in `ops-log.md`
