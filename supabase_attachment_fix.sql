-- SQL commands to fix Supabase RLS policies for attachments

-- 1. Enable RLS on attachments table (if not already enabled)
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow inserts on attachments table
CREATE POLICY "Allow insert attachments" ON attachments
FOR INSERT 
WITH CHECK (true);

-- 3. Create policy to allow reading attachments
CREATE POLICY "Allow read attachments" ON attachments
FOR SELECT 
USING (true);

-- 4. Create policy to allow updates on attachments
CREATE POLICY "Allow update attachments" ON attachments
FOR UPDATE 
USING (true);

-- 5. Enable RLS on deal_attachments table
ALTER TABLE deal_attachments ENABLE ROW LEVEL SECURITY;

-- 6. Create policy to allow inserts on deal_attachments table
CREATE POLICY "Allow insert deal_attachments" ON deal_attachments
FOR INSERT 
WITH CHECK (true);

-- 7. Create policy to allow reading deal_attachments
CREATE POLICY "Allow read deal_attachments" ON deal_attachments
FOR SELECT 
USING (true);

-- 8. Create policy to allow updates on deal_attachments
CREATE POLICY "Allow update deal_attachments" ON deal_attachments
FOR UPDATE 
USING (true);

-- 9. Create policy to allow deletes on deal_attachments
CREATE POLICY "Allow delete deal_attachments" ON deal_attachments
FOR DELETE 
USING (true);

-- Instructions for Storage Bucket:
-- Go to Supabase Dashboard > Storage > Create bucket named "attachments"
-- Set it as Public bucket
-- Add these storage policies in the bucket settings:

-- Storage Policy 1 - Allow public read access:
-- Policy name: "Allow public read access"
-- Allowed operation: SELECT
-- Target roles: public
-- Policy definition: (bucket_id = 'attachments')

-- Storage Policy 2 - Allow authenticated upload:
-- Policy name: "Allow authenticated upload" 
-- Allowed operation: INSERT
-- Target roles: authenticated
-- Policy definition: (bucket_id = 'attachments')

-- Storage Policy 3 - Allow authenticated delete:
-- Policy name: "Allow authenticated delete"
-- Allowed operation: DELETE
-- Target roles: authenticated  
-- Policy definition: (bucket_id = 'attachments')

-- Alternative simpler storage policy (if the above doesn't work):
-- Policy name: "Allow all operations"
-- Allowed operation: ALL
-- Target roles: public, authenticated
-- Policy definition: true 