---
name: preferences
description: "Manage personal preferences: hotels, restaurants, activities, books"
version: 1.0.0
category: preferences
---

# skills/preferences.md - Area Preferences

Obiettivo: gestire le preferenze personali di Simone (hotel, ristoranti, attività, libri) in filesystem e sincronizzare con Supabase (notes table).

## 0) Prerequisiti
- Cartella: `{baseDir}/` (skill condivisa)
- Variabili env caricate: `source /opt/openclaw.env`
- Accesso Supabase via REST: `SUPABASE_URL`, `SUPABASE_KEY`
- Tabella: `notes` (per sincronizzazione)

## Struttura Preferences

### Filesystem (`{baseDir}/` (skill condivisa))
```
{baseDir}/
├── hotels.md          (5 hotel favoriti)
├── restaurants.md     (16 ristoranti)
├── activities.md      (template in attesa dati)
├── books.md           (libri consigliati)
└── ... (futuri)
```

### Template uniforme
Ogni file segue questo pattern:

```markdown
# [Tipo] Preferiti

## Template
- **Nome**: [specifico]
- **Location**: [dove]
- **Categoria**: [tipo]
- **Note**: [dettagli]
- **Frequenza**: [quanto spesso]

---

## [Entità]

### 1. [Nome]
- **Campo1**: valore
- **Campo2**: valore
```

## 1) Consultare preferenze

### Lettura da filesystem
```bash
# Leggere un file preference
cat {baseDir}/hotels.md

# Cercare una preferenza specifica
grep -i "nome_hotel" {baseDir}/hotels.md
```

### Consultare in Supabase (sync)
```bash
source /opt/openclaw.env

# Tutte le preferenze (note nella folder Personal/Preferences)
curl -sS -X GET "${SUPABASE_URL}/rest/v1/notes?folder_path=ilike.Personal/Preferences&select=title,file_name" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"

# Una preference specifica (es. books)
curl -sS -X GET "${SUPABASE_URL}/rest/v1/notes?file_name=eq.books&select=title,text,markdown_content" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"
```

## 2) Aggiungere una preferenza

### Input
- tipo: hotel, restaurant, activity, book, ecc.
- dati: nome, location, categoria, note personali

### Flusso
1. **Crea file** in `{baseDir}/{tipo}.md` (o aggiungi a file esistente)
2. **Formatta** secondo template uniforme
3. **Sincronizza** in Supabase (nota nella folder Personal/Preferences)

### Template per nuovo file
```bash
# Crea il file
cat > {baseDir}/{TIPO}.md <<'EOF'
# {TIPO} Preferiti

## Template
- **Nome**: [...]
- **Location**: [...]
- **Category**: [...]
- **Note**: [...]

---

## {TIPO}

### 1. [Nome]
- **Campo1**: valore
EOF
```

### Sincronizzazione in Supabase (curl + log)
```bash
source /opt/openclaw.env

# Leggi il contenuto del file
CONTENT=$(cat {baseDir}/{TIPO}.md)

# Escapa per JSON
CONTENT_ESCAPED=$(echo "$CONTENT" | jq -Rs .)

# Crea nota in Supabase
curl -sS -X POST "${SUPABASE_URL}/rest/v1/notes" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"{TIPO} - Preferiti\",
    \"text\": \"$CONTENT_ESCAPED\",
    \"folder_path\": \"Personal/Preferences\",
    \"file_name\": \"{TIPO}\",
    \"note_type\": \"preferences\",
    \"sync_source\": \"slack\"
  }"

cat >> ops-log.md <<EOF
- Supabase notes: sincronizzato preference file "{TIPO}" | Personal/Preferences
EOF
```

## 3) Modificare una preferenza

### Aggiornare voce in file
```bash
# Modifica il file in {baseDir}/
nano {baseDir}/hotels.md

# Poi risincronizza in Supabase (vedi sezione 2)
```

### Aggiornare in Supabase
```bash
source /opt/openclaw.env

# Trovare la nota
NOTE_ID=$(curl -sS -X GET "${SUPABASE_URL}/rest/v1/notes?file_name=eq.hotels&select=note_id" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq -r '.[0].note_id')

# Aggiornare il testo
curl -sS -X PATCH "${SUPABASE_URL}/rest/v1/notes?note_id=eq.$NOTE_ID" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "nuovo contenuto"}'
```

## 4) Flusso di interazione tipico

### Aggiungere una nuova preferenza
1. Simone: "Aggiungi hotel XYZ alle preferenze"
2. Barbara: Crea voce in `{baseDir}/hotels.md`
3. Barbara: Sincronizza in Supabase (notes)
4. Log in `ops-log.md`

### Consultare preferenze
1. Simone: "Quanti hotel ho?"
2. Barbara: Conta da `{baseDir}/hotels.md` o query Supabase
3. Risposta rapida

### Sincronizzazione completa (batch)
1. Leggi tutti i file in `{baseDir}/` (skill condivisa)
2. Sincronizza batch in Supabase (una nota per file)
3. Log operativo

## 5) Attualmente gestite

| Tipo | File | Elementi | Status |
|---|---|---|---|
| Hotel | hotels.md | 5 | ✅ Sincronizzato |
| Ristoranti | restaurants.md | 16 | ✅ Sincronizzato |
| Attività | activities.md | 0 (template) | ✅ Sincronizzato |
| Libri | books.md | 2 | ✅ Sincronizzato |

## 6) Log operativo
Ogni azione finisce in `ops-log.md`:
- timestamp
- azione (creato, modificato, sincronizzato)
- tipo preference
- numero elementi
- sync status
