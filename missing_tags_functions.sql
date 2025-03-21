-- Function to count contacts without tags (with recent interactions only)
CREATE OR REPLACE FUNCTION get_contacts_without_tags_count()
RETURNS TABLE (count bigint) 
LANGUAGE plpgsql
AS $
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::bigint
  FROM contacts c
  WHERE NOT EXISTS (
    SELECT 1 
    FROM contact_tags ct 
    WHERE ct.contact_id = c.id
  )
  AND c.contact_category != 'Skip'
  AND c.contact_category != 'WhatsApp Group Contact'
  AND c.last_interaction >= (NOW() - INTERVAL '7 days');
END;
$;

-- Function to get paginated contacts without tags (with recent interactions only)
CREATE OR REPLACE FUNCTION get_contacts_without_tags(
  page_size integer,
  page_number integer,
  search_term text
)
RETURNS SETOF contacts 
LANGUAGE plpgsql
AS $
DECLARE
  safe_page_number integer;
BEGIN
  -- Ensure page_number is at least 1
  safe_page_number := GREATEST(1, page_number);
  
  RETURN QUERY
  SELECT c.*
  FROM contacts c
  WHERE 
    NOT EXISTS (
      SELECT 1 
      FROM contact_tags ct 
      WHERE ct.contact_id = c.id
    )
    AND c.contact_category != 'Skip'
    AND c.contact_category != 'WhatsApp Group Contact'
    AND c.last_interaction >= (NOW() - INTERVAL '7 days')
    AND (
      search_term = '' 
      OR c.first_name ILIKE '%' || search_term || '%'
      OR c.last_name ILIKE '%' || search_term || '%'
      OR c.email ILIKE '%' || search_term || '%'
    )
  ORDER BY c.last_interaction DESC
  LIMIT page_size
  OFFSET (safe_page_number - 1) * page_size;
END;
$;

-- Create index on contact_tags(contact_id) for optimized lookups
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact_id ON contact_tags(contact_id);