# Obsidian Sync Server

Local server to sync Obsidian inbox with Supabase notes.

## Setup

```bash
cd obsidian-sync-server
npm install
```

## Usage

Start the server:
```bash
npm start
# or from project root:
npm run obsidian-sync
```

Server runs on `http://localhost:3003`

## Endpoints

- `GET /health` - Check server status
- `GET /inbox` - Read Obsidian inbox content
- `POST /archive` - Archive inbox to `Inbox-archive.md` and clear inbox

## Flow

1. Write notes in Obsidian `Inbox.md`
2. Click the Obsidian sync button in CRM Notes tab
3. Content is saved as a new note in Supabase
4. Original inbox is archived and cleared

## Configuration

Edit `server.js` to change:
- `PORT` - Server port (default: 3003)
- `INBOX_PATH` - Path to Obsidian inbox file
- `ARCHIVE_PATH` - Path to archive file
