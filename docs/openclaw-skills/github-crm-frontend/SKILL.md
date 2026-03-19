---
name: github-crm-frontend
description: "Consultare ed editare la codebase CRM frontend (React). Pull, push, branch, PR, file search, refactor."
version: 1.0.0
category: development
---

# CRM Frontend — GitHub Repo

## Repo
- **GitHub**: git@github.com:Cimminelli1982/crm-frontend.git
- **Clone locale**: `/home/openclaw/.openclaw/workspace-salvatore/repos/crm-frontend`
- **Auth**: SSH deploy key (read/write) — configurata su questo server
- **Branch principale**: `main`

## Protocollo

### Prima di qualsiasi modifica
```bash
cd /home/openclaw/.openclaw/workspace-salvatore/repos/crm-frontend
git fetch origin
git status
git pull --ff-only
```

### Modificare file
1. Cerca cosa toccare: `rg "<keyword>" --type js`
2. Leggi il file prima di editare
3. Modifica
4. Verifica: `git diff`

### Commit + Push
```bash
cd /home/openclaw/.openclaw/workspace-salvatore/repos/crm-frontend
git checkout -b fix/<nome-breve>
git add <file specifici>
git commit -m "fix: <descrizione breve>"
git push -u origin fix/<nome-breve>
```

### PR (se richiesto)
Dopo il push, crea PR manualmente o chiedi a Simone.

## Struttura progetto (quick ref)
- `src/pages/CommandCenterPage.js` — Pagina principale (~13K righe)
- `src/components/command-center/` — Componenti CC
  - `layout/` — Desktop panels (header, left, center, right)
  - `left-panel/` — Contenuti pannello sinistro
  - `center-panel/` — Contenuti pannello centrale
- `src/hooks/command-center/` — Custom hooks (9 hook estratti)
- `src/components/modals/` — ~50 modal
- `backend/src/` — Express server (email sync, calendar, WhatsApp)
- `package.json` — Scripts: `npm run new-crm:dev` (dev), `npm run build` (build)

## Regole
- **NON committare**: `.env*`, credenziali, token
- **NON fare push su main** senza OK di Simone
- **Branch naming**: `fix/<cosa>`, `feat/<cosa>`, `chore/<cosa>`
- **Commit message**: convenzionale (`fix:`, `feat:`, `chore:`)
- Dev server: `PORT=3002 npm run new-crm:dev`
- URL: `http://localhost:3002/new-crm/command-center`
