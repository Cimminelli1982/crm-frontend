-- Function to get airtable contact data by airtable_id
CREATE OR REPLACE FUNCTION get_airtable_contact(airtable_id_param TEXT)
RETURNS TABLE (
  full_name TEXT,
  primary_email TEXT,
  mobile_phone_number1 TEXT,
  main_category TEXT,
  keywords TEXT,
  keep_in_touch TEXT,
  notes TEXT,
  description TEXT,
  company TEXT
) 
LANGUAGE SQL
AS $$
  SELECT 
    "Full Name",
    "Primary_email",
    "Mobile_phone_number1",
    "Main_Category",
    "Keywords",
    "Keep_in_Touch",
    "NOTES",
    "Description",
    "Company"
  FROM 
    airtable.contacts_full
  WHERE 
    "Airtable_ID" = airtable_id_param
$$;