---
allowed-tools: Bash(curl:*)
description: Trigger Obsidian sync or check sync status
---

Trigger a manual sync between Supabase and Obsidian (via GitHub), or check sync status.

## Usage

- `/note-sync` - Check status and sync if needed
- `/note-sync --status` - Only check status
- `/note-sync --to-obsidian` - Push CRM changes to Obsidian
- `/note-sync --from-obsidian` - Pull Obsidian changes to CRM

## Steps

### 1. Check Sync Status

```bash
curl -s "https://command-center-backend-production.up.railway.app/notes/sync/status"
```

Display:
- GitHub connection status
- Last sync timestamp
- Last sync direction
- Files synced in last sync
- Any errors

### 2. Trigger Sync (if requested or needed)

**Push to Obsidian (CRM → GitHub → Obsidian):**
```bash
curl -s -X POST "https://command-center-backend-production.up.railway.app/notes/sync" \
  -H "Content-Type: application/json" \
  -d '{"direction": "to_github"}'
```

**Pull from Obsidian (Obsidian → GitHub → CRM):**
```bash
curl -s -X POST "https://command-center-backend-production.up.railway.app/notes/sync" \
  -H "Content-Type: application/json" \
  -d '{"direction": "from_github"}'
```

### 3. Report Result

Show:
- Sync triggered confirmation
- Workflow name that was triggered
- Note: sync runs asynchronously, check status again in ~1 minute

## Examples

User: "/note-sync"
→ Check status, show last sync info

User: "sync my notes to obsidian"
→ Trigger push sync

User: "/note-sync --from-obsidian"
→ Trigger pull sync from Obsidian
