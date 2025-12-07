# Supabase CRM Schema

Last updated: 2025-12-07

## Tables Overview

### Core Entity Tables
| Table | Description |
|-------|-------------|
| `contacts` | Main contact records |
| `companies` | Company/organization records |
| `deals` | Deal/opportunity records |
| `investments` | Investment tracking |
| `meetings` | Meeting records |
| `notes` | Notes (linked to Obsidian) |
| `introductions` | Introduction tracking |
| `tags` | Tag definitions |
| `cities` | City reference data |

### Contact-Related Junction Tables (MERGE REQUIRED)
These tables have `contact_id` FK and need to be updated during contact merges:

| Table | Merge Action | Notes |
|-------|--------------|-------|
| `contact_emails` | Move to primary | Email addresses |
| `contact_mobiles` | Move to primary | Phone numbers |
| `contact_companies` | Move to primary, avoid duplicates | Company relationships |
| `contact_cities` | Move to primary, avoid duplicates | City associations |
| `contact_tags` | Move to primary, avoid duplicates | Tag associations |
| `contact_chats` | Move to primary | WhatsApp chat links |
| `contact_email_threads` | Move to primary | Email thread participation |
| `email_participants` | Update contact_id | Email participant records |
| `email_receivers` | Update contact_id | Email receiver records |
| `deals_contacts` | Move to primary, avoid duplicates | Deal relationships |
| `investments_contacts` | Move to primary, avoid duplicates | Investment relationships |
| `meeting_contacts` | Move to primary, avoid duplicates | Meeting participants |
| `notes_contacts` | Move to primary, avoid duplicates | Note links |
| `note_contacts` | Move to primary, avoid duplicates | Note links (alt table) |
| `interactions` | Update contact_id | Interaction history |
| `keep_in_touch` | Merge carefully | Keep-in-touch settings |
| `attachments` | Update contact_id | File attachments |
| `introduction_contacts` | Update contact_id | Introduction participants |

### Tables with sender_contact_id
| Table | Column | Merge Action |
|-------|--------|--------------|
| `emails` | `sender_contact_id` | Update to primary |

### Duplicate Management Tables (DO NOT MERGE - Administrative)
| Table | Purpose |
|-------|---------|
| `contact_duplicates` | Pending duplicate detection queue |
| `contact_duplicates_completed` | Completed merge audit log |

### Inbox/Processing Tables (Usually no action needed)
| Table | Purpose |
|-------|---------|
| `email_inbox` | Raw email import queue |
| `whatsapp_inbox` | Raw WhatsApp import queue |
| `apollo_enrichment_inbox` | Apollo enrichment queue |
| `airtable_contacts` | Airtable sync staging |

### Views (Auto-updated, no merge needed)
| View | Purpose |
|------|---------|
| `contact_emails_view` | Contact emails joined view |
| `contact_overview` | Contact summary view |
| `contact_completeness` | Data completeness metrics |
| `contacts_birthdays` | Birthday tracking view |
| `contacts_missing_info` | Missing data report |
| `contacts_with_duplicate_names` | Duplicate detection view |
| `contacts_without_*` | Various missing data views |
| `v_*` | Various reporting views |
| `mv_keep_in_touch` | Materialized view for KIT |

### Backup Tables (Reference only)
| Table | Purpose |
|-------|---------|
| `contact_mobiles_backup` | Mobile backup data |
| `deleted_spam_domain_contacts_backup` | Deleted spam contacts |
| `deleted_spam_skip_contacts_backup` | Deleted skip contacts |

### Spam Management
| Table | Purpose |
|-------|---------|
| `emails_spam` | Email spam list |
| `domains_spam` | Domain spam list |
| `whatsapp_spam` | WhatsApp spam list |
| `skip_contacts_with_emails` | Contacts to skip |

### Email Campaign Tables
| Table | Purpose |
|-------|---------|
| `email_campaigns` | Campaign definitions |
| `email_campaign_logs` | Campaign send logs |
| `email_lists` | Email list definitions |
| `email_list_members` | List membership (has contact_id) |
| `emaillist_tags` | List tag associations |

### Other Tables
| Table | Purpose |
|-------|---------|
| `chats` | WhatsApp chat records |
| `email_threads` | Email thread grouping |
| `passed` | Passed deals |
| `settings` | System settings |
| `sync_state` | Sync status tracking |
| `refresh_logs` | View refresh logs |
| `debug_logs` | Debug logging |
| `db_version` | Database version tracking |
| `migration_history` | Migration tracking |

---

## Contact Merge Logic

### Phase 1: Pre-Merge Snapshot
1. Record both contact IDs in `contact_duplicates_completed`
2. Store JSON snapshot of all related data

### Phase 2: Update Foreign Keys
For each table with `contact_id`:
```sql
UPDATE table_name
SET contact_id = :primary_contact_id
WHERE contact_id = :duplicate_contact_id;
```

### Phase 3: Handle Junction Table Duplicates
For junction tables (contact_companies, contact_tags, etc.):
```sql
-- First, delete potential duplicates that would violate unique constraints
DELETE FROM contact_companies
WHERE contact_id = :duplicate_contact_id
  AND company_id IN (
    SELECT company_id FROM contact_companies
    WHERE contact_id = :primary_contact_id
  );
-- Then move remaining
UPDATE contact_companies
SET contact_id = :primary_contact_id
WHERE contact_id = :duplicate_contact_id;
```

### Phase 4: Merge Contact Fields
Choose best values from both contacts:
- Keep non-null values
- Prefer primary for conflicts
- Merge descriptions (append)
- Keep older created_at

### Phase 5: Delete Duplicate
```sql
DELETE FROM contacts WHERE contact_id = :duplicate_contact_id;
```

### Phase 6: Post-Merge Verification
- Verify no orphaned records
- Update materialized views
- Log completion

---

## Total Tables: 90+
- Core tables: ~15
- Tables with contact_id: ~25
- Views: ~20
- Inbox/processing: ~10
- Other: ~20
