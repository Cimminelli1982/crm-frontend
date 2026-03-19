---
name: notes
description: "Note management: create, organize, sync with Obsidian via Supabase"
version: 1.0.0
category: notes
---

# skills/notes.md

Obiettivo: gestire le note di Simone (prendere, organizzare, mantenere in ordine) e garantire che la sync Supabase ↔ Obsidian sia operativa.

## 0) Prerequisiti
- Variabili env caricate: `source /opt/openclaw.env`
- Accesso Supabase via REST: `SUPABASE_URL`, `SUPABASE_KEY`
- Tabella: `notes` (fields: note_id, title, text, folder_path, markdown_content, last_modified_at, sync_source, obsidian_path)

## Struttura Note (stabile)
- **Inbox-local**: appunti rapidi, senza struttura
- **📅 Daily Notes**: giornalieri (format: YYYY-MM-DD.md)
- **Personal**: note personali (Ideas, Projects, Drafts)
- **CRM/Contacts**: contatti strutturati
- **La solitudine** e altre: narrativa/riflessioni long-form

### Folder Mapping
```
Root
├── Inbox-local.md
├── 📅 Daily Notes/
│   ├── YYYY-MM-DD.md
├── Personal/
│   ├── Ideas/
│   ├── Projects/
│   └── Drafts/
├── CRM/
│   └── Contacts/
│       └── {contact-slug}.md
└── Narratives/
    └── {title}.md
```

## 1) Prendere note per Simone

### Input
- testo grezzo (bullet, frasi, link, ricordi)
- categoria/folder (inbox, daily, personal, crm, etc.)
- priority (opzionale)

### Processo
1. **Parse il testo** → identificare struttura (bullets, links, date, etc.)
2. **Assegna folder** → default Inbox-local, salvo diverso
3. **Assegna titolo** → dal contenuto o da input
4. **Formatta markdown** → pulito, ben strutturato
5. **Crea in Supabase** → INSERT nella tabella notes
6. **Log operativo** → aggiungi a `ops-log.md`

### Template (curl + log) — 1 tool call
```bash
source /opt/openclaw.env

RESP=$(curl -sS -X POST "${SUPABASE_URL}/rest/v1/notes" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "title": "{TITLE}",
    "text": "{TEXT_ESCAPED}",
    "markdown_content": "{MARKDOWN_ESCAPED}",
    "folder_path": "{FOLDER}",
    "file_name": "{FILENAME}",
    "obsidian_path": "{FOLDER}/{FILENAME}.md",
    "created_by": "User",
    "note_type": "general",
    "sync_source": "slack"
  }')

NOTE_ID=$(echo "$RESP" | jq -r '.[0].note_id')

cat >> ops-log.md <<EOF
- Supabase notes: creata "{TITLE}" | folder:{FOLDER} | id:$NOTE_ID
EOF

echo "OK id=$NOTE_ID"
```

Note:
- TEXT: raw markdown (può contenere link, newline, ecc.)
- MARKDOWN_CONTENT: versione pulita per Obsidian
- FOLDER_PATH: es. "Personal/Ideas", "📅 Daily Notes", "" (root)
- Escaping: usare `jq -Rs` o equivalent per JSON escaping

## 2) Organizzare note

### Operazioni tipiche
- **Spostare** (change folder_path)
- **Rinominare** (change title + obsidian_path)
- **Consolidare** (merge contenuto in una nota)
- **Taggare** (se implemented)
- **Archiviare** (soft-delete: set deleted_at)

### Flusso atomico
1. **PATCH singola** su Supabase
2. **Log** prima/dopo
3. **Sync check** (opzionale, solo su richiesta)

### Endpoint
- PATCH `${SUPABASE_URL}/rest/v1/notes?note_id=eq.{id}`
  - headers: apikey, Authorization
  - payload: JSON con campi da aggiornare

## 3) Mantenerle in ordine

### Daily Review (rotante)
- Controllare le note di oggi (📅 Daily Notes)
- Consolidare Inbox-local in folder permanenti
- Identificare note incomplete (no title, testo vago)

### Weekly Maintenance
- Ripulire Inbox-local (move → Personal, archive, ecc.)
- Verificare orphan notes (senza folder assegnato)
- Update CRM/Contacts se nuovi contatti

### Sync Check
- Ultime N note hanno `synced_at` non null?
- Lag accettabile (TBD con Simone)
- Se fallisce: restart sync job / re-run full

## 4) Log operativo
Ogni azione finisce in `ops-log.md`:
- timestamp
- azione (created, moved, archived, etc.)
- folder/title
- note_id
- risultato

## 5) Obsidian Sync (via Railway backend)

### Creare nota in Obsidian
```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/obsidian/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "{TITLE}",
    "content": "{MARKDOWN_CONTENT}",
    "folderPath": "{FOLDER_PATH}",
    "fileName": "{FILE_NAME}"
  }'
```

### Aggiornare nota in Obsidian
```bash
curl -sS -X PUT "${COMMAND_CENTER_BACKEND_URL}/obsidian/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": "{NOTE_ID}",
    "content": "{UPDATED_MARKDOWN}"
  }'
```

### Leggere nota da Obsidian
```bash
curl -sS "${COMMAND_CENTER_BACKEND_URL}/obsidian/note?noteId={NOTE_ID}"
```

### Cancellare nota da Obsidian
```bash
curl -sS -X DELETE "${COMMAND_CENTER_BACKEND_URL}/obsidian/notes" \
  -H "Content-Type: application/json" \
  -d '{"noteId": "{NOTE_ID}"}'
```

### Stato sync Obsidian
```bash
curl -sS "${COMMAND_CENTER_BACKEND_URL}/obsidian/status"
```

### Notes CRUD via Railway (alternativa a Supabase diretto)
```bash
# Lista note
curl -sS "${COMMAND_CENTER_BACKEND_URL}/notes?folder={FOLDER}&limit=20"

# Dettaglio nota
curl -sS "${COMMAND_CENTER_BACKEND_URL}/notes/{NOTE_ID}"

# Creare nota
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/notes" \
  -H "Content-Type: application/json" \
  -d '{"title":"{TITLE}","text":"{TEXT}","folderPath":"{FOLDER}","fileName":"{FILE}"}'

# Aggiornare nota
curl -sS -X PUT "${COMMAND_CENTER_BACKEND_URL}/notes/{NOTE_ID}" \
  -H "Content-Type: application/json" \
  -d '{"title":"{TITLE}","text":"{TEXT}"}'

# Cancellare nota
curl -sS -X DELETE "${COMMAND_CENTER_BACKEND_URL}/notes/{NOTE_ID}"

# Linkare nota a entita'
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/notes/{NOTE_ID}/link" \
  -H "Content-Type: application/json" \
  -d '{"contactId":"{CONTACT_ID}"}'  # oppure companyId, dealId

# Rimuovere link
curl -sS -X DELETE "${COMMAND_CENTER_BACKEND_URL}/notes/{NOTE_ID}/link" \
  -H "Content-Type: application/json" \
  -d '{"contactId":"{CONTACT_ID}"}'

# Stato sync
curl -sS "${COMMAND_CENTER_BACKEND_URL}/notes/sync/status"

# Trigger sync manuale
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/notes/sync"
```
