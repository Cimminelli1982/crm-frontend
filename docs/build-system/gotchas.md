# Gotchas

Known pitfalls. Append new ones as you discover them.

---

## CommandCenterPage.js

- **5800+ lines, deeply interleaved state.** Do NOT try to extract JSX into separate components — variables are too interconnected (lesson from Phase 9 refactoring).
- **Always grep ALL references before removing state.** State blocks are interleaved — removing a range will break other features (lesson from Phase 2 refactoring).
- `createContactModalOpen` / `createContactEmail` already exist (line ~1163). Reuse them, don't create duplicates.
- `handleEmailAddressClick` (line ~1801) creates contacts inline without a modal — different pattern, don't duplicate for new features.

## Supabase

- `tags` table uses field **`name`**, NOT `tag_name`.
- FK joins: **`table(columns)`** — NO alias syntax with `:`. Example: `contact_emails(*)` not `emails:contact_emails(*)`.
- Always `.select()` after `.insert()` if you need returned data.

## Dev Environment

- **Use `PORT=3002 npm run new-crm:dev`** — NOT `npm start` (old CRM), NOT `npm build` (unnecessary, dev server is live).
- Dev server has hot reload — save file and check browser, no restart needed.
- URL: `http://localhost:3002/new-crm/command-center`

## Backend Deploy

- **NEVER run `railway up` from the repo root** — it uploads the entire repo and breaks the deployed service (CORS errors, crash). This has happened multiple times.
- **command-center-backend**: `cd backend && railway up --detach`
- **crm-agent-service**: `cd crm-agent-service && railway up --detach`
- ALWAYS `cd` into the correct service directory FIRST, then `railway up`.
- NOT GitHub push (doesn't auto-deploy).
- Health check on `/health` (30s timeout).

## Cross-cutting State

These live in CommandCenterPage and should NOT be moved to hooks:
- `activeTab` / `setActiveTab`
- `selectedRightPanelContactId`
- `emailContacts` / `emailCompanies` (from `useContextContacts`)
- `selectedThread` (from `useEmailThreads`)
- `saving` / `setSaving` (email actions)

## Enum Values

- Always check `CLAUDE.md` for valid enum values before inserting data.
- `category` defaults vary: contacts default to `'Inbox'`, companies to `'Inbox'`, deals to `'Inbox'`.
- `created_by` should be `'User'` for user-initiated, `'LLM'` for AI-initiated.

## Smart Add Contact
- `check_contact_completeness()` è una **trigger function Supabase** su `command_center_inbox` INSERT — non un semplice check client-side.
- La nota deve avere `length(text) > 500` chars per passare la dimensione "note".
- `contact_companies` con `relationship = 'suggestion'` NON conta per la dimensione "company".
- Se manca company, anche `company_complete` fallisce automaticamente.
- Bucket b = servono decisioni umane (category/score/KIT mancanti), bucket c = fixable dall'agente.
- `contacts_clarissa_processing` ha `ON CONFLICT (contact_id)` — upsert, non insert.

## Smart Enrich
- NON refactorare `smart-create` quando aggiungi `smart-enrich`. Aggiungi codice nuovo accanto all'esistente.
- `enrichment-tools.js` contiene funzioni standalone — importale, non duplicare la logica.
- `updateContactFields` ha protezione code-level: legge valori attuali e aggiorna solo campi NULL/vuoti.
- `/contact/smart-enrich` accetta parametro opzionale `dimensions` (array) per fixare dimensioni specifiche.
- La Data Quality tab è in `DataQualityCenterContent.js` + `useDataQualityData.js`, NON in DataIntegrityTab.
- I campi che servono input umano (category, score, birthday, KIT, christmas, easter) vanno editabili inline, NON mandare al right panel.
- `keep_in_touch` ha campo `frequency` (NON `kit_frequency`) — il hook mappa `kit_frequency` → `frequency` per il DB.
