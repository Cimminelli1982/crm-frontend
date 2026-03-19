---
name: crm-contact-intelligence
description: "Deep contact review and Obsidian note creation from interaction history"
version: 1.0.0
category: crm
---

# CRM Contact Intelligence — Deep Review e Note Obsidian

## Obiettivo

Per ogni contatto, fare un deep review di tutte le interazioni (email, WhatsApp, meeting, call, note) e creare o aggiornare una nota strutturata in Obsidian. Due modalità: first review (analisi completa) e incremental review (solo nuove interazioni).

---

## Prerequisiti

```bash
source /opt/openclaw.env
```

Variabili necessarie:
- `$SUPABASE_URL` — URL progetto Supabase
- `$SUPABASE_KEY` — Service role key Supabase
- `$COMMAND_CENTER_BACKEND_URL` — Backend Railway (Node.js)

---

## 1) Determinare se è first review o incremental

### Verificare se esiste già una nota per il contatto

```sql
SELECT n.note_id, n.title, n.content, n.updated_at
FROM notes n
JOIN notes_contacts nc ON n.note_id = nc.note_id
WHERE nc.contact_id = '{CONTACT_ID}'
  AND n.folder_path = 'CRM/Contacts'
ORDER BY n.updated_at DESC
LIMIT 1;
```

- Se **nessun risultato** → First review (analisi completa)
- Se **esiste nota** → Incremental review (solo nuove interazioni dalla data `updated_at`)

---

## 2) Query per la review

### Tutte le interazioni (first review)

```sql
SELECT interaction_date, interaction_type, direction, summary
FROM interactions WHERE contact_id = '{CONTACT_ID}'
ORDER BY interaction_date ASC;
```

### Thread email completi (first review)

```sql
SELECT e.subject, e.body_plain, e.message_timestamp, e.direction
FROM emails e JOIN email_participants ep ON e.email_id = ep.email_id
WHERE ep.contact_id = '{CONTACT_ID}' ORDER BY e.message_timestamp ASC;
```

### Messaggi WhatsApp dallo staging (first review)

```sql
SELECT body_text, date, direction, chat_name FROM command_center_inbox
WHERE contact_number IN (SELECT mobile FROM contact_mobiles WHERE contact_id = '{CONTACT_ID}')
AND type = 'whatsapp' ORDER BY date ASC;
```

### Solo nuove interazioni (incremental — dalla data dell'ultima review)

```sql
SELECT i.contact_id, c.first_name, c.last_name, i.summary, i.interaction_type, i.direction, i.interaction_date
FROM interactions i JOIN contacts c ON i.contact_id = c.contact_id
WHERE i.contact_id = '{CONTACT_ID}'
  AND i.interaction_date > '{LAST_REVIEW_DATE}'
  AND i.summary IS NOT NULL
ORDER BY i.interaction_date ASC;
```

### Nuove interazioni di oggi (batch giornaliero)

```sql
SELECT i.contact_id, c.first_name, c.last_name, i.summary, i.interaction_type, i.direction, i.interaction_date
FROM interactions i JOIN contacts c ON i.contact_id = c.contact_id
WHERE i.interaction_date::date = CURRENT_DATE AND i.summary IS NOT NULL
ORDER BY i.contact_id, i.interaction_date;
```

---

## 3) Criteri di analisi

### Vale la pena annotare

- Decisioni chiave prese durante conversazioni
- Cambiamenti di ruolo o azienda
- Interessi o bisogni espressi esplicitamente
- Contesto di deal (investimenti, partnership, opportunità)
- Dettagli personali rilevanti (famiglia, hobby, preferenze)
- Evoluzione della relazione nel tempo
- Impegni presi o promesse fatte (da entrambe le parti)
- Connessioni con altri contatti del CRM

### NON vale la pena annotare

- Scheduling routinario ("ci vediamo giovedì alle 15")
- Convenevoli generici ("grazie", "buona giornata")
- Informazioni già presenti nei campi strutturati del CRM (job_role, company, email, etc.)
- Contenuto di newsletter o email automatiche

---

## 4) Creare nota in Obsidian

### POST — Nuova nota

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/obsidian/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "{First Last} — Contact Notes",
    "content": "{MARKDOWN_CONTENT}",
    "folderPath": "CRM/Contacts",
    "fileName": "{first-last-slug}"
  }'
```

### PUT — Aggiornare nota esistente

```bash
source /opt/openclaw.env
curl -sS -X PUT "${COMMAND_CENTER_BACKEND_URL}/obsidian/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "{NOTE_ID}",
    "content": "{UPDATED_MARKDOWN}"
  }'
```

---

## 5) Collegare nota al contatto

Dopo la creazione della nota, collegarla al contatto nel DB:

```bash
source /opt/openclaw.env
curl -sS -X POST "${SUPABASE_URL}/rest/v1/notes_contacts" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"note_id": "{NOTE_ID}", "contact_id": "{CONTACT_ID}"}'
```

---

## 6) Checklist creazione nota

Quando si crea una nuova nota, verificare questi parametri:

| Campo | Valore |
|-------|--------|
| folder_path | `CRM/Contacts` |
| file_name | Nome slugificato (es. `mario-rossi`) |
| obsidian_path | `CRM/Contacts/{slug}.md` |
| created_by | `LLM` |
| note_type | `general` |
| title | `{First Last} — Contact Notes` |

---

## 7) Struttura consigliata della nota Markdown

```markdown
# {First Last} — Contact Notes

**Last reviewed**: {DATA}
**Contact ID**: {CONTACT_ID}
**Role**: {JOB_ROLE} @ {COMPANY}

## Contesto

Breve descrizione di chi è il contatto e come lo conosce Simone.

## Timeline chiave

### {ANNO}
- **{DATA}** ({tipo}): {cosa è successo di rilevante}
- **{DATA}** ({tipo}): {altra cosa rilevante}

## Interessi e bisogni

- ...

## Deal e opportunità

- ...

## Note personali

- ...

## Prossimi passi

- ...
```

---

## Log operativo

Dopo ogni review, annotare:
- Contatto analizzato (nome + ID)
- Tipo di review (first / incremental)
- Numero di interazioni analizzate
- Nota creata o aggiornata (note_id)
- Punti chiave emersi dalla review
```

---