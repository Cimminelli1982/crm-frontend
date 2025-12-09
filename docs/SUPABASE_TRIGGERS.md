# Supabase Triggers - CRM

## Riepilogo

- **31 trigger attivi**
- **17 timestamp** (aggiornano `last_modified_at`)
- **14 business logic**

---

## Trigger Attivi

| # | Trigger | Tabella | Cosa fa |
|---|---------|---------|---------|
| 1 | `update_cities_last_modified` | cities | Aggiorna timestamp |
| 2 | `update_companies_last_modified` | companies | Aggiorna timestamp |
| 3 | `update_company_cities_last_modified` | company_cities | Aggiorna timestamp |
| 4 | `update_company_domains_updated_at` | company_domains | Aggiorna timestamp |
| 5 | `update_contact_cities_last_modified` | contact_cities | Aggiorna timestamp |
| 6 | `enforce_uuid_format` | contact_companies | Blocca ID numerici invalidi |
| 7 | `contact_duplicates_start_merge_trigger` | contact_duplicates | Avvia merge duplicati (INSERT) |
| 8 | `process_merge_trigger` | contact_duplicates | Avvia merge duplicati (UPDATE) |
| 9 | `trigger_auto_associate_on_email` | contact_emails | Associa company quando aggiungi email |
| 10 | `update_contact_emails_last_modified` | contact_emails | Aggiorna timestamp |
| 11 | `update_contact_mobiles_last_modified` | contact_mobiles | Aggiorna timestamp |
| 12 | `birthday_insert_trigger` | contacts | Crea task Todoist per compleanno |
| 13 | `birthday_update_trigger` | contacts | Aggiorna task Todoist compleanno |
| 14 | `contact_keep_in_touch_trigger` | contacts | Crea/aggiorna record keep_in_touch |
| 15 | `trigger_auto_associate_inbox_contact` | contacts | Associa company a contatto Inbox |
| 16 | `update_contacts_last_modified` | contacts | Aggiorna timestamp |
| 17 | `update_keep_in_touch_frequency` | contacts | Sync frequenza keep_in_touch |
| 18 | `ensure_single_current_version` | db_version | Mantiene una sola versione DB |
| 19 | `update_deals_last_modified` | deals | Aggiorna timestamp |
| 20 | `process_email_inbox_trigger` | email_inbox | Processa email in arrivo |
| 21 | `trig_handle_email_reject` | email_inbox | Gestisce reject/spam email |
| 22 | `update_email_lists_updated_at` | email_lists | Aggiorna timestamp |
| 23 | `update_emails_spam_last_modified_column` | emails_spam | Aggiorna timestamp |
| 24 | `update_introductions_last_modified` | introductions | Aggiorna timestamp |
| 25 | `update_investments_last_modified` | investments | Aggiorna timestamp |
| 26 | `update_meetings_last_modified` | meetings | Aggiorna timestamp |
| 27 | `update_notes_timestamp` | notes | Aggiorna timestamp |
| 28 | `update_passed_last_modified` | passed | Aggiorna timestamp |
| 29 | `update_tags_last_modified` | tags | Aggiorna timestamp |
| 30 | `process_new_whatsapp_message` | whatsapp_inbox | Processa WhatsApp in arrivo |
| 31 | `update_whatsapp_spam_last_modified_column` | whatsapp_spam | Aggiorna timestamp |

---

## Trigger Eliminati (2025-12-08)

| Trigger | Motivo |
|---------|--------|
| `trigger_process_email_inbox` | Duplicato di `process_email_inbox_trigger` |
| `process_whatsapp_message_trigger` | Duplicato di `process_new_whatsapp_message` |
| `trigger_process_attachment` | Rotto - token hardcoded |
| `trigger_contact_company_association` | Duplicato di `trigger_auto_associate_on_email` |

---

## Cron Jobs Attivi

| Job | Schedule | Funzione | Stato |
|-----|----------|----------|-------|
| #1 | ogni 30 min | `email-sync` | OK |
| #4 | ogni 20 min | `gmail-sync` | OK |

---

## Note

- I trigger timestamp sono standard e innocui
- `process_email_inbox_trigger` e `process_new_whatsapp_message` sono i principali per l'elaborazione messaggi
- I trigger birthday chiamano edge function `birthday-todoist`
- I trigger keep_in_touch mantengono sync tra `contacts.keep_in_touch_frequency` e tabella `keep_in_touch`
