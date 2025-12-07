-- Migration: Refactor introductions to use junction table pattern
-- This replaces the contact_ids ARRAY column with a proper junction table

-- Step 1: Create the introduction_role enum type
DO $$ BEGIN
  CREATE TYPE introduction_role AS ENUM ('introducer', 'introducee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create the introduction_contacts junction table
CREATE TABLE IF NOT EXISTS introduction_contacts (
  introduction_contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  introduction_id UUID NOT NULL REFERENCES introductions(introduction_id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
  role introduction_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(introduction_id, contact_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_introduction_contacts_introduction_id
  ON introduction_contacts(introduction_id);
CREATE INDEX IF NOT EXISTS idx_introduction_contacts_contact_id
  ON introduction_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_introduction_contacts_role
  ON introduction_contacts(role);

-- Step 4: Migrate existing data from contact_ids array to junction table
-- The first contact in the array is assumed to be the introducer, rest are introducees
INSERT INTO introduction_contacts (introduction_id, contact_id, role)
SELECT
  i.introduction_id,
  unnest_with_ordinality.contact_id,
  CASE
    WHEN unnest_with_ordinality.ordinality = 1 THEN 'introducer'::introduction_role
    ELSE 'introducee'::introduction_role
  END as role
FROM introductions i
CROSS JOIN LATERAL (
  SELECT contact_id, ordinality
  FROM unnest(i.contact_ids) WITH ORDINALITY AS u(contact_id, ordinality)
) AS unnest_with_ordinality
WHERE i.contact_ids IS NOT NULL
  AND array_length(i.contact_ids, 1) > 0
ON CONFLICT (introduction_id, contact_id) DO NOTHING;

-- Step 5: Drop the old contact_ids column (commented out for safety - run manually after verification)
-- ALTER TABLE introductions DROP COLUMN contact_ids;

-- Add comment for documentation
COMMENT ON TABLE introduction_contacts IS
  'Junction table linking introductions to contacts with their role (introducer or introducee)';
