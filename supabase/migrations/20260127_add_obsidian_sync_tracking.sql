-- Migration: add_obsidian_sync_tracking
-- Add sync tracking fields to notes table for Obsidian bidirectional sync

-- Add sync tracking fields to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS git_sha TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS sync_source TEXT DEFAULT 'crm';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for efficient sync queries
CREATE INDEX IF NOT EXISTS idx_notes_sync_source ON notes(sync_source);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_content_hash ON notes(content_hash);

-- Create obsidian_sync_state table for tracking overall sync state
CREATE TABLE IF NOT EXISTS obsidian_sync_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_github_sha TEXT,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  sync_direction TEXT NOT NULL, -- 'to_supabase', 'from_supabase'
  files_synced INTEGER DEFAULT 0,
  files_created INTEGER DEFAULT 0,
  files_updated INTEGER DEFAULT 0,
  files_deleted INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for quick lookup of last sync
CREATE INDEX IF NOT EXISTS idx_obsidian_sync_state_last_sync ON obsidian_sync_state(last_sync_at DESC);

-- Comment for documentation
COMMENT ON TABLE obsidian_sync_state IS 'Tracks sync operations between Obsidian vault (via GitHub) and Supabase';
COMMENT ON COLUMN notes.git_sha IS 'Last Git commit SHA that modified this note';
COMMENT ON COLUMN notes.sync_source IS 'Source of last modification: obsidian, crm, or github';
COMMENT ON COLUMN notes.content_hash IS 'SHA256 hash of markdown_content for change detection';
COMMENT ON COLUMN notes.deleted_at IS 'Soft delete timestamp - null means active';
