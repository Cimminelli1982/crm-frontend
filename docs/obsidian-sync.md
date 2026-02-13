# Obsidian Vault - CRM Sync

Questo vault Obsidian è sincronizzato bidirezionalmente con il CRM Supabase tramite GitHub.

## Architettura

```
Obsidian ──Git Push──► GitHub ──Action──► Supabase
   ▲                                        ▲
   │                                        │
   │                                        │
   └────Git Pull──────────┴───Action/Cron───┘
```

## Setup

### 1. Crea il repository GitHub

```bash
cd /Users/simonecimminelli/obsidian-vault
git init
git add .
git commit -m "Initial commit"
gh repo create obsidian-vault --private --source=. --push
```

### 2. Configura i secrets GitHub

Vai su GitHub → Settings → Secrets and variables → Actions e aggiungi:

| Secret | Valore |
|--------|--------|
| `SUPABASE_URL` | `https://efazuvegwxouysfcgwja.supabase.co` |
| `SUPABASE_SERVICE_KEY` | (la service role key da Supabase) |
| `PAT_TOKEN` | Un Personal Access Token con permessi `repo` |

### 3. Configura Obsidian Git Plugin

1. Installa il plugin "Obsidian Git" dalla community
2. Configura:
   - **Vault backup interval**: 5 minutes
   - **Auto pull interval**: 5 minutes
   - **Commit message template**: `vault backup: {{date}}`
   - **Pull updates on startup**: enabled
   - **Push on backup**: enabled

### 4. Apri il vault in Obsidian

1. File → Open folder as vault
2. Seleziona `/Users/simonecimminelli/obsidian-vault`

## Struttura Cartelle

```
obsidian-vault/
├── CRM/
│   ├── Contacts/    # Note relative a contatti
│   ├── Companies/   # Note relative ad aziende
│   ├── Deals/       # Note relative a deal
│   └── Meetings/    # Note di meeting
├── Personal/        # Note personali
├── Archive/         # Note archiviate
└── Inbox.md         # Quick capture
```

## Formato Frontmatter

Ogni nota sincronizzata ha questo frontmatter YAML:

```yaml
---
note_id: uuid-della-nota
title: Titolo della nota
note_type: meeting | general | idea | project
folder_path: CRM/Meetings
created_at: 2026-01-27T10:00:00Z
last_modified_at: 2026-01-27T11:30:00Z
contacts:
  - id: uuid-contatto
    name: John Smith
companies:
  - id: uuid-azienda
    name: Acme Corp
---

Contenuto della nota in markdown...
```

## Come Funziona

### Obsidian → Supabase

1. Modifichi/crei una nota in Obsidian
2. Il plugin Obsidian Git fa commit e push (ogni 5 min o manuale)
3. GitHub Action `sync-to-supabase` processa i file .md
4. Le note vengono upsertate su Supabase

### Supabase → Obsidian

1. Crei/modifichi una nota nel CRM
2. GitHub Action `sync-from-supabase` (ogni 5 min) controlla le modifiche
3. I file .md vengono aggiornati e pushati su GitHub
4. Il plugin Obsidian Git fa pull delle modifiche

### Gestione Conflitti

- Vince il timestamp più recente
- Il campo `sync_source` traccia l'origine dell'ultima modifica
- Il campo `content_hash` evita scritture inutili

## Troubleshooting

### Le note non si sincronizzano

1. Controlla i log delle GitHub Actions
2. Verifica che i secrets siano configurati
3. Verifica che il plugin Obsidian Git sia attivo

### Conflitti frequenti

- Evita di modificare la stessa nota contemporaneamente in CRM e Obsidian
- Aspetta il sync automatico (5 min) prima di modificare dall'altra parte
