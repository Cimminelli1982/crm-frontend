-- Create function that triggers when date_of_birth changes
CREATE OR REPLACE FUNCTION notify_birthday_change()
RETURNS TRIGGER AS $$
DECLARE
  function_url text;
BEGIN
  -- Only trigger if date_of_birth actually changed
  IF NEW.date_of_birth IS DISTINCT FROM OLD.date_of_birth AND NEW.date_of_birth IS NOT NULL THEN

    -- Get the Edge Function URL
    function_url := current_setting('app.edge_function_url', true);

    -- If URL is not set, use default pattern
    IF function_url IS NULL THEN
      function_url := 'https://' || current_setting('app.supabase_project_ref') || '.supabase.co/functions/v1/birthday-todoist';
    END IF;

    -- Call Edge Function via pg_net (if available) or http extension
    BEGIN
      PERFORM
        net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
          ),
          body := jsonb_build_object(
            'contact_id', NEW.id,
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'date_of_birth', NEW.date_of_birth
          )
        );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the original update
        RAISE NOTICE 'Failed to call birthday-todoist function: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on contacts table
DROP TRIGGER IF EXISTS birthday_update_trigger ON contacts;

CREATE TRIGGER birthday_update_trigger
  AFTER UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION notify_birthday_change();

-- Also create trigger for INSERT (when new contact with birthday is added)
DROP TRIGGER IF EXISTS birthday_insert_trigger ON contacts;

CREATE TRIGGER birthday_insert_trigger
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION notify_birthday_change();

-- Create the birthday view for easy querying
CREATE OR REPLACE VIEW contacts_birthdays AS
SELECT
  id,
  first_name,
  last_name,
  date_of_birth,
  EXTRACT(MONTH FROM date_of_birth) AS birth_month,
  EXTRACT(DAY FROM date_of_birth) AS birth_day,
  -- Today's birthday check
  (EXTRACT(MONTH FROM date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND EXTRACT(DAY FROM date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)) AS is_birthday_today
FROM contacts
WHERE date_of_birth IS NOT NULL;

-- Add comment
COMMENT ON VIEW contacts_birthdays IS 'View of contacts with birthdays, including month/day extraction and today check';