-- Notes table for tracking Obsidian notes with CRM metadata
CREATE TABLE IF NOT EXISTS notes (
  note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  obsidian_path TEXT, -- e.g., "CRM/Meetings/2024-12-07 Call with John"
  note_type TEXT DEFAULT 'general', -- meeting, call, research, idea, follow-up
  summary TEXT, -- Brief summary/description
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for note-contact relationships
CREATE TABLE IF NOT EXISTS note_contacts (
  note_contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(note_id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, contact_id)
);

-- Junction table for note-company relationships
CREATE TABLE IF NOT EXISTS note_companies (
  note_company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(note_id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(note_id, company_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type);
CREATE INDEX IF NOT EXISTS idx_note_contacts_note_id ON note_contacts(note_id);
CREATE INDEX IF NOT EXISTS idx_note_contacts_contact_id ON note_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_note_companies_note_id ON note_companies(note_id);
CREATE INDEX IF NOT EXISTS idx_note_companies_company_id ON note_companies(company_id);

-- Disable RLS for now (like other tables)
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE note_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE note_companies DISABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE notes IS 'Registry of Obsidian notes with CRM metadata';
COMMENT ON TABLE note_contacts IS 'Links notes to contacts';
COMMENT ON TABLE note_companies IS 'Links notes to companies';
