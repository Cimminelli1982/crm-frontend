# Data Integrity System

Il sistema di Data Integrity analizza automaticamente ogni messaggio in arrivo (email, WhatsApp, calendar) e identifica problemi di integrità dati prima che l'utente clicchi "Done".

## Architettura

```
Railway Backend inserisce in command_center_inbox
                    ↓
        AFTER INSERT Trigger
                    ↓
         check_data_integrity()
                    ↓
    Per ogni partecipante chiama:
         process_participant_v2()
                    ↓
         8 check di integrità
                    ↓
    Issues salvate in data_integrity_inbox
                    ↓
    Frontend mostra issues nel DataIntegrityTab
                    ↓
    Utente risolve issues → clicca Done
```

---

## Trigger: `check_data_integrity()`

**Tipo:** AFTER INSERT on `command_center_inbox`

Estrae i partecipanti in base al tipo di messaggio:

| Tipo | Partecipanti Estratti |
|------|----------------------|
| **email** | `from_email` + `to_recipients[]` + `cc_recipients[]` |
| **whatsapp** | `contact_number` (mobile) |
| **calendar** | `to_recipients[]` (gestisce formato `MAILTO:`) |

Per ogni partecipante chiama `process_participant_v2(inbox_id, email, mobile, name)`.

---

## Funzione: `process_participant_v2()`

Esegue 8 check in sequenza, divisi in **Contact Checks** e **Company Checks**.

### Contact Checks (sempre eseguiti)

| # | Funzione | Descrizione |
|---|----------|-------------|
| 1 | `check_contact_not_in_crm` | Verifica se il contatto esiste nel CRM (cerca per email o mobile). Se non esiste → crea issue `not_in_crm` |
| 2 | `check_contact_incomplete` | Se il contatto esiste, verifica completeness score. Se basso → crea issue `incomplete` |
| 3 | `check_contact_duplicates` | Cerca altri contatti con stessa email/nome simile. Se trovati → crea issue `duplicate` |
| 4 | `check_contact_missing_company_link` | Contatto ha email con dominio business che esiste come company, ma non è linkato → crea issue `missing_company_link` |
| 5 | `check_contact_missing_company` | Contatto non ha nessuna company associata → crea issue `missing_company` |

### Company Checks (solo per email con dominio business)

**IMPORTANTE:** I company checks vengono **SKIPPATI** per domini personali:
```sql
gmail.com, yahoo.com, hotmail.com, outlook.com,
icloud.com, me.com, mac.com, live.com, msn.com,
aol.com, protonmail.com, proton.me, fastmail.com,
zoho.com, yandex.com, mail.com, gmx.com, gmx.net
```

| # | Funzione | Descrizione |
|---|----------|-------------|
| 6 | `check_company_not_in_crm` | Verifica se esiste una company con quel dominio. Se non esiste, cerca fuzzy match per nome (es. `caprelease.com` → company "Caprelease"). Se trova match → crea issue `potential_company_match`. Se non trova match → crea issue `not_in_crm` |
| 7 | `check_company_incomplete` | Se la company esiste, verifica completeness score. Se basso → crea issue `incomplete` |
| 8 | `check_company_duplicates` | Cerca altre company con stesso dominio/nome simile. Se trovate → crea issue `duplicate` |

---

## Tabelle di Storage

### `data_integrity_inbox`

Tabella principale dove vengono salvate le issues rilevate.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `id` | uuid | PK |
| `inbox_id` | uuid | FK a `command_center_inbox` |
| `issue_type` | text | Tipo: `not_in_crm`, `incomplete`, `duplicate`, `missing_company_link`, `missing_company`, `potential_company_match` |
| `entity_type` | text | `contact` o `company` |
| `entity_id` | uuid | ID del contatto/company esistente (se esiste) |
| `duplicate_entity_id` | uuid | ID dell'entità duplicata (per issue duplicate) |
| `email` | text | Email del partecipante |
| `mobile` | text | Mobile del partecipante |
| `domain` | text | Dominio estratto dall'email |
| `name` | text | Nome del partecipante |
| `details` | jsonb | Dettagli aggiuntivi (es. match_type, completeness_score) |
| `priority` | integer | Priorità dell'issue |
| `status` | text | `pending`, `resolved`, `dismissed` |
| `created_at` | timestamp | Quando è stata creata |
| `resolved_at` | timestamp | Quando è stata risolta |

### `contacts_hold`

Contatti messi "in attesa" dall'utente (non vuole aggiungerli ora, ma nemmeno marcarli spam).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `hold_id` | uuid | PK |
| `email` | varchar | Email del contatto |
| `full_name` | text | Nome completo |
| `first_name` | text | Nome |
| `last_name` | text | Cognome |
| `email_count` | integer | Quante volte è apparso in email |
| `first_seen_at` | timestamp | Prima apparizione |
| `last_seen_at` | timestamp | Ultima apparizione |
| `status` | varchar | Stato hold |

### `companies_hold`

Domini/company messi "in attesa".

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `hold_id` | uuid | PK |
| `domain` | varchar | Dominio |
| `name` | text | Nome company |
| `email_count` | integer | Quante volte è apparso |
| `status` | varchar | Stato hold |

---

## Frontend: DataIntegrityTab

Il componente mostra le issues raggruppate in sezioni espandibili:

### 1. Suggestions From Message (blu)
Issues relative al messaggio attualmente selezionato.

### 2. Potential Company Matches (verde)
Domini che potrebbero appartenere a company esistenti (fuzzy match per nome).
- **Esempio**: `caprelease.com` → company "Caprelease" (dominio non linkato)
- **Azioni**: Link Domain (collega dominio alla company), Dismiss

### 3. Not in CRM (rosso)
- **Contacts tab**: Partecipanti email/mobile non trovati nel CRM
- **Companies tab**: Domini business senza company nel CRM
- **Azioni**: Add, Hold, Spam

### 4. Hold (giallo)
- **Contacts tab**: Contatti messi in hold
- **Companies tab**: Domini messi in hold
- **Azioni**: Add, Spam, Delete

### 5. Incomplete (blu)
- **Contacts tab**: Contatti con completeness score basso
- **Companies tab**: Company con dati mancanti
- **Azioni**: Click apre modal per completare i dati

### 6. Duplicates (viola)
- **Contacts tab**: Coppie di contatti duplicati (Keep/Remove)
- **Companies tab**: Coppie di company duplicate
- **Azioni**: Confirm Merge, Dismiss
- **Note**: Frontend deduplica le coppie per evitare di mostrare stesso pair più volte (es. per DOMAIN + NAME match)

### 7. Missing Company Links (arancione)
Contatti con email business che hanno una company nel CRM ma non sono linkati.
- **Azioni**: Link (associa contatto a company)

### 8. Contacts Missing Company (viola)
Contatti senza nessuna company associata.
- **Azioni**: Add Company (apre modal)

---

## Flusso Utente Tipico

```
1. Arriva email da mario@acme.com
                    ↓
2. Trigger check_data_integrity() scatta
                    ↓
3. process_participant_v2() analizza mario@acme.com
                    ↓
4. Check trova:
   - mario@acme.com non esiste → issue not_in_crm (contact)
   - acme.com non esiste → issue not_in_crm (company)
                    ↓
5. Utente apre Command Center, seleziona email
                    ↓
6. DataIntegrityTab mostra:
   - "Not in CRM" con 2 issues
                    ↓
7. Utente clicca "Add" su Mario → crea contatto
   Utente clicca "Add" su acme.com → crea company
                    ↓
8. Issues risolte, utente clicca "Done"
                    ↓
9. Email processata, archiviata
```

---

## Issue Types Summary

| issue_type | entity_type | Descrizione | Azione UI |
|------------|-------------|-------------|-----------|
| `not_in_crm` | contact | Email/mobile non trovato | Add, Hold, Spam |
| `not_in_crm` | company | Dominio non trovato (no fuzzy match) | Add, Hold, Delete |
| `potential_company_match` | company | Dominio matcha nome company esistente | Link Domain, Dismiss |
| `incomplete` | contact | Dati mancanti | Edit modal |
| `incomplete` | company | Dati mancanti | Edit modal |
| `duplicate` | contact | Contatto duplicato | Merge, Dismiss |
| `duplicate` | company | Company duplicata | Merge, Dismiss |
| `missing_company_link` | contact | Ha dominio ma non linkato | Link |
| `missing_company` | contact | Nessuna company | Add Company |

---

## Note Tecniche

1. **Deduplicazione Backend**: Le issues sono create con upsert basato su `(inbox_id, issue_type, entity_type, email/mobile/domain)` per evitare duplicati

2. **Deduplicazione Frontend Duplicati**: Per la sezione Duplicates, il frontend raggruppa le coppie per (source_id, duplicate_id) indipendentemente dall'ordine e dal match_type. Se una coppia appare sia per DOMAIN che per NAME, viene mostrata una sola card con entrambi i badge.

3. **Performance**: Il trigger è AFTER INSERT, quindi non rallenta l'inserimento del messaggio

4. **Domini Personali**: Il check dei domini personali avviene PRIMA dei company checks (6-8), non dei contact checks (1-5)

5. **Priorità**: Le issues hanno un campo `priority` per ordinare le più importanti. `potential_company_match` ha priorità 1 (alta).

6. **Stato**: Le issues partono come `pending`, possono diventare `resolved` (azione completata) o `dismissed` (ignorata dall'utente)

7. **Fuzzy Match Company**: La funzione `check_company_not_in_crm` estrae il nome dal dominio (es. `caprelease.com` → `caprelease`) e usa `are_company_names_similar()` per cercare company con nome simile.
