---
name: crm-contacts
description: "CRM contacts: create, update, search, link emails/mobiles/tags/cities/KIT"
version: 2.0.0
category: crm
---

# Skill: crm-contacts

## Obiettivo

Gestire tutte le operazioni CRUD sui **contatti** nel CRM Supabase: creazione, aggiornamento, ricerca, collegamento di email/mobili/tag/città/KIT/aziende/chat, eliminazione associazioni e workflow completo.

---

## Prerequisiti

```bash
source /opt/openclaw.env
```

Variabili richieste:
- `SUPABASE_URL` — URL del progetto Supabase
- `SUPABASE_KEY` — Service role key

Header standard per tutte le chiamate:

```
-H "apikey: ${SUPABASE_KEY}" \
-H "Authorization: Bearer ${SUPABASE_KEY}" \
-H "Content-Type: application/json" \
-H "Prefer: return=representation"
```

---

## 0. PRE-CREATION CHECKLIST (Obbligatoria)

Prima di creare QUALSIASI contatto, eseguire TUTTI questi controlli. Creare il contatto SOLO se TUTTI restituiscono zero risultati.

### 0.1 Verificare email esatta in contact_emails

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_emails?email=eq.mario.rossi@example.com&select=email_id,contact_id,email,contacts(contact_id,first_name,last_name)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

Se restituisce risultati → il contatto esiste già. NON creare.

### 0.2 Verificare nome fuzzy in contacts

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contacts?or=(first_name.ilike.%25mario%25,last_name.ilike.%25rossi%25)&select=contact_id,first_name,last_name,category" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

Se restituisce risultati simili → verificare se è la stessa persona prima di procedere.

### 0.3 Verificare in contacts_hold

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contacts_hold?or=(first_name.ilike.%25mario%25,last_name.ilike.%25rossi%25)&select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

Se restituisce risultati → il contatto è in hold. NON creare un duplicato.

### 0.4 Verificare duplicati precedenti

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_duplicates?select=*,primary:contacts!contact_duplicates_primary_contact_id_fkey(first_name,last_name),duplicate:contacts!contact_duplicates_duplicate_contact_id_fkey(first_name,last_name)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

Verificare che il contatto non sia già stato oggetto di merge o dismiss.

**REGOLA: procedere con la creazione SOLO se TUTTI e 4 i controlli restituiscono zero risultati pertinenti.**

---

## 1. Creare contatto

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/contacts" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "first_name": "Mario",
    "last_name": "Rossi",
    "category": "Professional Investor",
    "job_role": "Partner",
    "description": "Investor presso XYZ Capital",
    "linkedin": "https://linkedin.com/in/mariorossi"
  }'
```

Campi obbligatori: `first_name`, `last_name`

Categorie valide:
`Inbox, Skip, Professional Investor, Team, WhatsApp Group Contact, Advisor, Supplier, Founder, Manager, Friend and Family, Other, Student, Media, Not Set, Institution, SUBSCRIBER NEWSLETTER, System, Hold`

Risposta: restituisce l'oggetto contatto con `contact_id` (uuid).

---

## 2. Aggiungere numero di telefono

### 2.1 Verificare se il numero esiste già

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_mobiles?mobile=eq.%2B393331234567&select=mobile_id,contact_id,mobile,type,is_primary" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

**IMPORTANTE:** Il `+` nei numeri di telefono va codificato come `%2B` nell'URL.

### 2.2 Aggiungere il numero (solo se non esiste)

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/contact_mobiles" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "contact_id": "<CONTACT_UUID>",
    "mobile": "+393331234567",
    "type": "personal",
    "is_primary": true
  }'
```

Tipi validi per `type`: `work, personal, other, WhatsApp, WhatsApp Group`

---

## 3. Aggiungere email

Le email vanno **sempre** in lowercase e trimmate prima dell'inserimento.

### 3.1 Verificare se l'email esiste già

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_emails?email=eq.mario.rossi@example.com&select=email_id,contact_id,email,type,is_primary" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 3.2 Aggiungere l'email (solo se non esiste)

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/contact_emails" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "contact_id": "<CONTACT_UUID>",
    "email": "mario.rossi@example.com",
    "type": "work",
    "is_primary": true
  }'
```

Tipi validi per `type`: `work, personal, other, WhatsApp, WhatsApp Group`

---

## 4. Aggiungere città

Le città si gestiscono in due passaggi: cercare/creare la città, poi collegare al contatto.

### 4.1 Cercare la città

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/cities?name=ilike.%25milano%25&select=city_id,name" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 4.2 Creare la città (se non esiste)

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/cities" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Milano"}'
```

### 4.3 Collegare contatto a città

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/contact_cities" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "contact_id": "<CONTACT_UUID>",
    "city_id": "<CITY_UUID>"
  }'
```

---

## 5. Aggiungere tag

I tag si gestiscono in due passaggi: cercare/creare il tag, poi collegare al contatto.

### 5.1 Cercare il tag

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/tags?name=ilike.%25venture%25&select=tag_id,name" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

**ATTENZIONE:** La tabella `tags` usa il campo `name`, NON `tag_name`.

### 5.2 Creare il tag (se non esiste)

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/tags" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"name": "Venture Capital"}'
```

### 5.3 Collegare tag al contatto

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/contact_tags" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "contact_id": "<CONTACT_UUID>",
    "tag_id": "<TAG_UUID>"
  }'
```

Vincolo UNIQUE su `(contact_id, tag_id)` — il duplicato restituisce errore.

---

## 6. Keep in Touch (KIT)

La tabella `keep_in_touch` ha vincolo UNIQUE su `contact_id`. Usare **upsert** per creare o aggiornare.

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/keep_in_touch" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation,resolution=merge-duplicates" \
  -d '{
    "contact_id": "<CONTACT_UUID>",
    "frequency": "Quarterly",
    "why_keeping_in_touch": "Potenziale co-investitore",
    "christmas": "whatsapp standard",
    "easter": "no wishes set"
  }'
```

**IMPORTANTE:** L'header `Prefer: return=representation,resolution=merge-duplicates` abilita l'upsert su conflitto.

Frequenze valide: `Not Set, Monthly, Quarterly, Twice per Year, Once per Year, Weekly, Do not keep in touch`

Tipi wishes validi: `no wishes set, whatsapp standard, email standard, email custom, whatsapp custom, call, present, no wishes`

Campi aggiuntivi:
- `snooze_days` (integer, default 0) — posticipa il follow-up
- `next_follow_up_notes` (text) — note per il prossimo follow-up

---

## 7. Collegare contatto a azienda

### 7.1 Cercare l'azienda

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/companies?name=ilike.%25xyz capital%25&select=company_id,name,category" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 7.2 Collegare contatto ad azienda

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/contact_companies" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "contact_id": "<CONTACT_UUID>",
    "company_id": "<COMPANY_UUID>",
    "relationship": "employee",
    "is_primary": true
  }'
```

Tipi di relazione validi: `employee, founder, advisor, manager, investor, other, not_set, suggestion`

Vincolo UNIQUE su `(contact_id, company_id)`.

---

## 8. Collegare contatto a chat WhatsApp

```bash
source /opt/openclaw.env
curl -s -X POST "${SUPABASE_URL}/rest/v1/contact_chats" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "contact_id": "<CONTACT_UUID>",
    "chat_id": "<CHAT_ID>"
  }'
```

---

## 9. Aggiornare contatto

```bash
source /opt/openclaw.env
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/contacts?contact_id=eq.<CONTACT_UUID>" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "job_role": "Managing Partner",
    "category": "Professional Investor",
    "description": "Gestisce il fondo XYZ da 200M",
    "last_modified_by": "LLM",
    "last_modified_at": "2026-03-09T12:00:00Z"
  }'
```

Impostare sempre `last_modified_by` e `last_modified_at` quando si aggiorna via API.

---

## 10. Cercare contatto

### 10.1 Per nome (fuzzy)

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contacts?or=(first_name.ilike.%25mario%25,last_name.ilike.%25rossi%25)&select=contact_id,first_name,last_name,category,job_role" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 10.2 Per email

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_emails?email=eq.mario.rossi@example.com&select=email_id,contact_id,email,contacts(contact_id,first_name,last_name,category)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 10.3 Per telefono

**IMPORTANTE:** Il `+` va codificato come `%2B`.

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_mobiles?mobile=eq.%2B393331234567&select=mobile_id,contact_id,mobile,contacts(contact_id,first_name,last_name,category)" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

---

## 11. Scheda contatto completa

Recuperare tutti i dati associati a un contatto in un'unica query.

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contacts?contact_id=eq.<CONTACT_UUID>&select=*,contact_emails(*),contact_mobiles(*),contact_cities(city_id,cities(city_id,name)),contact_tags(entry_id,tags(tag_id,name)),contact_companies(contact_companies_id,relationship,is_primary,companies(company_id,name,category,website)),keep_in_touch(*),contact_chats(chat_id,chats(id,chat_name,is_group))" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

Questa query restituisce in un colpo solo: email, mobili, città, tag, aziende collegate, impostazioni KIT e chat WhatsApp.

---

## 12. Eliminare associazioni

### 12.1 Rimuovere tag dal contatto

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/contact_tags?contact_id=eq.<CONTACT_UUID>&tag_id=eq.<TAG_UUID>" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 12.2 Rimuovere città dal contatto

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/contact_cities?contact_id=eq.<CONTACT_UUID>&city_id=eq.<CITY_UUID>" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 12.3 Rimuovere email dal contatto

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/contact_emails?email_id=eq.<EMAIL_UUID>" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 12.4 Rimuovere numero di telefono

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/contact_mobiles?mobile_id=eq.<MOBILE_UUID>" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 12.5 Rimuovere collegamento azienda

```bash
source /opt/openclaw.env
curl -s -X DELETE "${SUPABASE_URL}/rest/v1/contact_companies?contact_id=eq.<CONTACT_UUID>&company_id=eq.<COMPANY_UUID>" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

---

## 13. Workflow: creare contatto completo

Sequenza ordinata per creare un contatto con tutti i dati associati:

1. **Pre-creation checklist** (Sezione 0) — verificare che il contatto non esista già
2. **Creare contatto** (Sezione 1) → ottenere `contact_id`
3. **Aggiungere email** (Sezione 3) — una o più, sempre lowercase
4. **Aggiungere telefono** (Sezione 2) — verificare che non esista già
5. **Aggiungere città** (Sezione 4) — cercare/creare città, poi collegare
6. **Aggiungere tag** (Sezione 5) — cercare/creare tag, poi collegare
7. **Collegare azienda** (Sezione 7) — cercare azienda, poi collegare
8. **Impostare KIT** (Sezione 6) — upsert con frequenza e note
9. **Collegare chat** (Sezione 8) — se applicabile
10. **Verifica** (Sezione 14) — GET di controllo finale

---

## 14. VERIFICA OBBLIGATORIA

Dopo ogni creazione o modifica, eseguire SEMPRE una GET di controllo per confermare che i dati siano stati scritti correttamente.

### 14.1 Verifica contatto base

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contacts?contact_id=eq.<CONTACT_UUID>&select=contact_id,first_name,last_name,category,job_role" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 14.2 Verifica email collegate

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_emails?contact_id=eq.<CONTACT_UUID>&select=email_id,email,type,is_primary" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 14.3 Verifica telefoni collegati

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/contact_mobiles?contact_id=eq.<CONTACT_UUID>&select=mobile_id,mobile,type,is_primary" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

### 14.4 Verifica scheda completa

Usare la query della Sezione 11 per verificare tutti i dati in una volta.

### 14.5 Verifica KIT

```bash
source /opt/openclaw.env
curl -s "${SUPABASE_URL}/rest/v1/keep_in_touch?contact_id=eq.<CONTACT_UUID>&select=*" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"
```

---

## Log operativo

Al termine di ogni operazione, riportare un riepilogo strutturato:

```
### Operazione completata
- **Azione**: [creare/aggiornare/collegare/eliminare]
- **Contatto**: [Nome Cognome] (contact_id: <UUID>)
- **Dettagli**: [cosa è stato fatto]
- **Verifiche**: [esito dei controlli GET]
- **Note**: [eventuali anomalie o avvisi]
```