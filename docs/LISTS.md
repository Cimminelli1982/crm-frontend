# Email Lists - Documentation

## Overview

Il sistema Email Lists permette di creare e gestire liste di contatti per campagne email. Supporta due tipi di liste:

- **Static Lists**: Membri aggiunti manualmente
- **Dynamic Lists**: Membri calcolati automaticamente in base a filtri

---

## Schema Database

### Diagramma ER

```
                              ┌─────────────────────────────┐
                              │        email_lists          │
                              ├─────────────────────────────┤
                              │ list_id          uuid PK    │
                              │ name             text       │
                              │ description      text       │
                              │ list_type        enum       │ ← 'static' | 'dynamic'
                              │ is_active        boolean    │
                              │ created_by       enum       │
                              │ created_at       timestamptz│
                              │ last_modified_by enum       │
                              │ last_modified_at timestamptz│
                              └──────────────┬──────────────┘
                                             │
                ┌────────────────────────────┼────────────────────────────┐
                │                            │                            │
                │     FILTRI (Dynamic)       │                            │
                │                            │                            │
    ┌───────────┴───────────┐    ┌──────────┴──────────┐    ┌────────────┴────────────┐
    │ email_list_filter_tags│    │email_list_filter_   │    │  email_list_members     │
    ├───────────────────────┤    │      scores         │    ├─────────────────────────┤
    │ id           uuid PK  │    ├─────────────────────┤    │ list_member_id  uuid PK │
    │ list_id      uuid FK  │    │ id          uuid PK │    │ list_id         uuid FK │
    │ tag_id       uuid FK ─┼──► │ list_id     uuid FK │    │ contact_id      uuid FK │──► contacts
    │              → tags   │    │ score       integer │    │ email_id        uuid FK │──► contact_emails
    └───────────────────────┘    └─────────────────────┘    │ membership_type enum    │ ← 'manual'|'computed'
                                                            │ is_active       boolean │
    ┌───────────────────────┐    ┌─────────────────────┐    │ added_at        timestamptz│
    │email_list_filter_     │    │email_list_filter_   │    │ added_by        enum    │
    │     categories        │    │       cities        │    └─────────────────────────┘
    ├───────────────────────┤    ├─────────────────────┤
    │ id           uuid PK  │    │ id          uuid PK │
    │ list_id      uuid FK  │    │ list_id     uuid FK │
    │ category     enum ────┼──► │ city_name   text    │
    │  →contact_category    │    └─────────────────────┘
    └───────────────────────┘

    ┌───────────────────────┐
    │email_list_filter_kit  │  (Keep In Touch)
    ├───────────────────────┤
    │ id           uuid PK  │
    │ list_id      uuid FK  │
    │ frequency    enum ────┼──► keep_in_touch_frequency
    └───────────────────────┘
```

---

### Tabelle

#### `email_lists`
Tabella principale delle liste.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| list_id | uuid | Primary key |
| name | text | Nome della lista |
| description | text | Descrizione opzionale |
| list_type | enum | `static` o `dynamic` |
| is_active | boolean | Soft delete flag |
| created_by | creation_source | Chi ha creato |
| created_at | timestamptz | Data creazione |
| last_modified_by | creation_source | Chi ha modificato |
| last_modified_at | timestamptz | Data modifica |

#### `email_list_members`
Membri delle liste (sia statiche che dinamiche).

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| list_member_id | uuid | Primary key |
| list_id | uuid | FK → email_lists |
| contact_id | uuid | FK → contacts |
| email_id | uuid | FK → contact_emails (quale email usare) |
| membership_type | enum | `manual` (aggiunto a mano) o `computed` (da filtri) |
| is_active | boolean | Soft delete flag |
| added_at | timestamptz | Data aggiunta |
| added_by | creation_source | Chi ha aggiunto |

#### Tabelle Filtri (per liste dinamiche)

| Tabella | Filtro | FK |
|---------|--------|-----|
| `email_list_filter_tags` | Tag del contatto | → tags.tag_id |
| `email_list_filter_scores` | Score del contatto | integer 1-5 |
| `email_list_filter_categories` | Categoria contatto | contact_category enum |
| `email_list_filter_cities` | Città del contatto | text |
| `email_list_filter_kit` | Keep In Touch frequency | keep_in_touch_frequency enum |

---

## Enum Types

### `list_type`
```sql
'static'   -- Membri aggiunti manualmente
'dynamic'  -- Membri calcolati da filtri
```

### `membership_type`
```sql
'manual'    -- Aggiunto manualmente dall'utente
'computed'  -- Aggiunto automaticamente dal refresh della lista dinamica
```

---

## Funzionalità

### Liste Statiche

**Creazione:**
1. Click "+" nella sidebar
2. Inserisci nome e descrizione
3. Seleziona tipo "Static"
4. Click "Create List"

**Aggiunta Membri:**
1. Seleziona una lista statica
2. Click "Add Member" (pulsante verde)
3. Cerca il contatto per nome
4. Seleziona il contatto
5. Scegli quale email usare
6. Click "Add Member"

**Rimozione Membri:**
1. Hover sul membro
2. Click sulla X a destra
3. Conferma rimozione

### Liste Dinamiche

**Creazione:**
1. Click "+" nella sidebar
2. Inserisci nome e descrizione
3. Seleziona tipo "Dynamic"
4. Click "Create List"

**Configurazione Filtri (via SQL/Supabase):**
```sql
-- Aggiungi filtro per score = 5
INSERT INTO email_list_filter_scores (list_id, score)
VALUES ('uuid-della-lista', 5);

-- Aggiungi filtro per tag specifico
INSERT INTO email_list_filter_tags (list_id, tag_id)
VALUES ('uuid-della-lista', 'uuid-del-tag');

-- Aggiungi filtro per categoria
INSERT INTO email_list_filter_categories (list_id, category)
VALUES ('uuid-della-lista', 'Professional Investor');
```

**Refresh Automatico:**
I trigger su ogni tabella filtro chiamano automaticamente `refresh_dynamic_list()` quando i filtri cambiano.

**Refresh Manuale:**
```sql
SELECT * FROM refresh_dynamic_list('uuid-della-lista');
-- Returns: added (int), removed (int)
```

---

## Logica Filtri Dinamici

I filtri usano logica **AND** tra tipi diversi e **OR** all'interno dello stesso tipo:

```
(score IN [5])
AND (tag IN ['investor', 'advisor'])  -- OR tra tag
AND (category IN ['Professional Investor'])
AND (city IN ['Milan', 'Rome'])  -- OR tra città
AND (keep_in_touch IN ['Monthly', 'Quarterly'])
```

**Esempio:**
Se una lista ha:
- Filtro score: 5
- Filtri tag: "investor", "advisor"
- Filtro città: "Milan"

Un contatto deve avere:
- Score = 5 **E**
- Almeno uno dei tag "investor" o "advisor" **E**
- Città = "Milan"

---

## Function: `refresh_dynamic_list()`

Ricalcola i membri di una lista dinamica.

```sql
CREATE OR REPLACE FUNCTION refresh_dynamic_list(p_list_id uuid)
RETURNS TABLE(added integer, removed integer)
```

**Comportamento:**
1. Verifica che la lista sia dinamica
2. Trova tutti i contatti che matchano i filtri
3. Rimuove membri `computed` che non matchano più
4. Aggiunge nuovi membri con `membership_type = 'computed'`
5. Non tocca i membri `manual` (se presenti)

---

## Triggers

Ogni modifica ai filtri triggera il refresh automatico:

```sql
-- Trigger su ogni tabella filtro
CREATE TRIGGER trg_refresh_on_tag_filter_change
  AFTER INSERT OR UPDATE OR DELETE ON email_list_filter_tags
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_dynamic_list();

-- Stesso pattern per:
-- - email_list_filter_scores
-- - email_list_filter_categories
-- - email_list_filter_cities
-- - email_list_filter_kit
```

---

## UI Components

### ListsTab.js

Componente principale con layout a 3 colonne:

```
┌─────────────┬─────────────────────────┬─────────────────┐
│             │                         │                 │
│   LISTS     │        MEMBERS          │  ACTION CENTER  │
│             │                         │                 │
│ ┌─────────┐ │  ┌───────────────────┐  │                 │
│ │ Dynamic │ │  │ [Avatar] Name     │  │   Coming Soon   │
│ │ - List1 │ │  │ email@example.com │  │                 │
│ │ - List2 │ │  │              Auto │  │   - Campaigns   │
│ └─────────┘ │  └───────────────────┘  │   - Analytics   │
│             │                         │   - Filters     │
│ ┌─────────┐ │  ┌───────────────────┐  │                 │
│ │ Static  │ │  │ [Avatar] Name   X │  │                 │
│ │ - List3 │ │  │ email@example.com │  │                 │
│ └─────────┘ │  │            Manual │  │                 │
│             │  └───────────────────┘  │                 │
│    [+]      │                         │                 │
└─────────────┴─────────────────────────┴─────────────────┘
```

**Features:**
- Ricerca liste
- Sezioni espandibili (Dynamic/Static)
- Conteggio membri
- Add Member (solo liste statiche)
- Remove Member (solo membri manuali)
- Delete List

---

## API Queries

### Fetch Lists
```javascript
const { data } = await supabase
  .from('email_lists')
  .select('*')
  .eq('is_active', true)
  .order('name');
```

### Fetch Members
```javascript
const { data } = await supabase
  .from('email_list_members')
  .select(`
    list_member_id,
    is_active,
    membership_type,
    added_at,
    contact_id,
    contacts (contact_id, first_name, last_name, profile_image_url),
    email_id,
    contact_emails (email)
  `)
  .eq('list_id', listId)
  .eq('is_active', true);
```

### Add Member
```javascript
const { data } = await supabase
  .from('email_list_members')
  .insert({
    list_id: listId,
    contact_id: contactId,
    email_id: emailId,
    membership_type: 'manual',
    is_active: true,
    added_by: 'User',
  })
  .select(/* ... */)
  .single();
```

### Remove Member
```javascript
await supabase
  .from('email_list_members')
  .update({ is_active: false })
  .eq('list_member_id', memberId);
```

---

## Best Practices

1. **Email Reference**: Usa sempre `email_id` invece di copiare l'email come stringa. Così se l'email del contatto cambia, la lista rimane aggiornata.

2. **Soft Delete**: Usa `is_active = false` invece di DELETE per mantenere lo storico.

3. **Liste Dinamiche**: Configura i filtri prima di aspettarti membri. I membri vengono calcolati solo quando i filtri esistono.

4. **Performance**: Per liste molto grandi, considera di eseguire `refresh_dynamic_list()` in background o schedulato.

---

## Future Improvements (Action Center)

- [ ] Invio campagne email
- [ ] Gestione filtri dinamici da UI
- [ ] Analytics (open rate, click rate)
- [ ] A/B testing
- [ ] Scheduling invii
- [ ] Template email
- [ ] Unsubscribe management
