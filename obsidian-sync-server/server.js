const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3003;

// Obsidian inbox path (iCloud Drive)
const INBOX_PATH = path.join(
  process.env.HOME,
  'Library/Mobile Documents/com~apple~CloudDocs/Documents/Living with Intention/Inbox.md'
);
const ARCHIVE_PATH = path.join(
  process.env.HOME,
  'Library/Mobile Documents/com~apple~CloudDocs/Documents/Living with Intention/Inbox-archive.md'
);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', inboxPath: INBOX_PATH });
});

// Read inbox content
app.get('/inbox', async (req, res) => {
  try {
    const content = await fs.readFile(INBOX_PATH, 'utf-8');
    res.json({
      success: true,
      content,
      path: INBOX_PATH,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({ success: true, content: '', message: 'File not found or empty' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// Archive and clear inbox
app.post('/archive', async (req, res) => {
  try {
    // Read current content
    let content = '';
    try {
      content = await fs.readFile(INBOX_PATH, 'utf-8');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    // Skip if empty or just header
    const trimmed = content.replace(/^#\s*Inbox\s*\n*/i, '').trim();
    if (!trimmed) {
      return res.json({ success: true, message: 'Nothing to archive' });
    }

    // Append to archive with timestamp
    const timestamp = new Date().toISOString();
    const archiveEntry = `\n\n---\n## Synced: ${timestamp}\n\n${trimmed}`;

    try {
      await fs.appendFile(ARCHIVE_PATH, archiveEntry);
    } catch (e) {
      // Create archive file if doesn't exist
      await fs.writeFile(ARCHIVE_PATH, `# Inbox Archive${archiveEntry}`);
    }

    // Clear inbox (keep header)
    await fs.writeFile(INBOX_PATH, '# Inbox\n\n');

    res.json({
      success: true,
      message: 'Archived and cleared',
      archivedLength: trimmed.length,
      timestamp
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Obsidian Sync Server running on http://localhost:${PORT}`);
  console.log(`Inbox path: ${INBOX_PATH}`);
});
