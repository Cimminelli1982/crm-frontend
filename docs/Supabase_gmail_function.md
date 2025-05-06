{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 CREATE OR REPLACE FUNCTION public.process_email_inbox_record()\
 RETURNS trigger\
 LANGUAGE plpgsql\
 SECURITY DEFINER\
 SET search_path TO 'public'\
AS $function$\
DECLARE\
    -- Variables for IDs\
    v_sender_contact_id UUID;\
    v_email_thread_id UUID;\
    v_email_id UUID;\
    v_interaction_id UUID;\
    v_prioritized_contact_id UUID;\
    v_contact_category public.contact_category;\
\
    -- Variables for looping and processing contacts\
    v_all_contact_ids UUID[] := '\{\}'::UUID[];\
    v_email_record RECORD;\
    v_duplicate_record RECORD;\
    v_participant_email TEXT;\
    v_participant_name TEXT;\
    v_participant_role public.email_participant_type;\
    v_email_list TEXT[];\
    v_name_list TEXT[];\
    i INTEGER;\
    v_first_name TEXT; -- Moved variable declaration to proper scope\
    v_last_name TEXT;  -- Moved variable declaration to proper scope\
\
    -- Variable for attachment processing\
    v_att_data JSONB;\
    v_placeholder_url TEXT := 'https://placeholder-attachment-url.com/pending-download'; -- Added placeholder URL\
\
    -- Variables for error handling\
    v_error_message TEXT;\
    v_error_context TEXT;\
    \
    -- Variable to check if email already exists\
    v_existing_email_id UUID;\
BEGIN\
    RAISE NOTICE 'Processing email_inbox id: % via UPDATE trigger', NEW.id;\
\
    -- 1. Skip Logic\
    IF NEW.processing_notes LIKE '%Sender is in Skip category%' THEN\
        RAISE NOTICE 'Sender is in Skip category for email_inbox id: %. Deleting inbox record.', NEW.id;\
        DELETE FROM public.email_inbox WHERE id = NEW.id;\
        RETURN NULL;\
    END IF;\
\
    -- 2. Process Contacts\
    -- Drop temp table if it exists to avoid "relation already exists" error\
    DROP TABLE IF EXISTS temp_participants;\
    \
    CREATE TEMP TABLE temp_participants (\
        email TEXT,\
        name TEXT,\
        role public.email_participant_type,\
        contact_id UUID NULL\
    ) ON COMMIT DROP;\
\
    -- Insert Sender, To, Cc, Bcc into temp_participants\
    IF NEW.from_email IS NOT NULL AND NEW.from_email <> '' THEN\
        INSERT INTO temp_participants (email, name, role)\
        VALUES (lower(trim(NEW.from_email)), trim(NEW.from_name), 'sender');\
    END IF;\
    IF NEW.to_email IS NOT NULL AND NEW.to_email <> '' THEN\
        v_email_list := string_to_array(NEW.to_email, ',');\
        v_name_list := string_to_array(NEW.to_name, ',');\
        FOR i IN 1..array_length(v_email_list, 1) LOOP\
            IF trim(v_email_list[i]) <> '' THEN\
                 INSERT INTO temp_participants (email, name, role)\
                 VALUES (lower(trim(v_email_list[i])), trim(COALESCE(v_name_list[i], '')), 'to');\
            END IF;\
        END LOOP;\
    END IF;\
    IF NEW.cc_email IS NOT NULL AND NEW.cc_email <> '' THEN\
        v_email_list := string_to_array(NEW.cc_email, ',');\
        v_name_list := string_to_array(NEW.cc_name, ',');\
        FOR i IN 1..array_length(v_email_list, 1) LOOP\
             IF trim(v_email_list[i]) <> '' THEN\
                 INSERT INTO temp_participants (email, name, role)\
                 VALUES (lower(trim(v_email_list[i])), trim(COALESCE(v_name_list[i], '')), 'cc');\
             END IF;\
        END LOOP;\
    END IF;\
    IF NEW.bcc_email IS NOT NULL AND NEW.bcc_email <> '' THEN\
        v_email_list := string_to_array(NEW.bcc_email, ',');\
        v_name_list := string_to_array(NEW.bcc_name, ',');\
        FOR i IN 1..array_length(v_email_list, 1) LOOP\
             IF trim(v_email_list[i]) <> '' THEN\
                 INSERT INTO temp_participants (email, name, role)\
                 VALUES (lower(trim(v_email_list[i])), trim(COALESCE(v_name_list[i], '')), 'bcc');\
             END IF;\
        END LOOP;\
    END IF;\
\
    -- Process unique emails\
    FOR v_participant_email IN SELECT DISTINCT email FROM temp_participants LOOP\
        v_prioritized_contact_id := NULL;\
\
        -- Drop temp table if it exists to avoid "relation already exists" error\
        DROP TABLE IF EXISTS temp_found_contacts;\
        \
        CREATE TEMP TABLE temp_found_contacts AS\
        SELECT\
            c.contact_id, c.first_name, c.last_name, c.category,\
            c.created_at AS contact_created_at -- Alias added\
        FROM public.contact_emails ce\
        JOIN public.contacts c ON ce.contact_id = c.contact_id\
        WHERE ce.email = v_participant_email;\
\
        UPDATE public.contacts c\
        SET last_interaction_at = NEW.message_timestamp\
        WHERE c.contact_id IN (SELECT contact_id FROM temp_found_contacts)\
          AND (c.last_interaction_at IS NULL OR NEW.message_timestamp > c.last_interaction_at);\
\
        SELECT contact_id, category\
        INTO v_prioritized_contact_id, v_contact_category\
        FROM temp_found_contacts\
        ORDER BY CASE category WHEN 'Skip' THEN 3 WHEN 'Inbox' THEN 2 WHEN 'Not Set' THEN 2 ELSE 1 END,\
                 contact_created_at ASC -- Use alias\
        LIMIT 1;\
\
        IF v_prioritized_contact_id IS NULL THEN\
            SELECT name INTO v_participant_name FROM temp_participants WHERE email = v_participant_email LIMIT 1;\
            -- Parse name into first and last name\
            v_first_name := split_part(v_participant_name, ' ', 1);\
            v_last_name := trim(substring(v_participant_name from position(' ' in v_participant_name)));\
            IF v_last_name = '' THEN v_last_name = NULL; END IF;\
            \
            RAISE NOTICE 'Creating new contact for email: %', v_participant_email;\
            INSERT INTO public.contacts (first_name, last_name, category, last_interaction_at, created_by)\
            VALUES (\
                v_first_name,\
                v_last_name,\
                'Inbox'::contact_category,\
                NEW.message_timestamp,\
                'User'::creation_source  -- Changed from Edge Function to User based on schema\
            )\
            RETURNING contact_id INTO v_prioritized_contact_id;\
            INSERT INTO public.contact_emails (contact_id, email, is_primary, type)\
            VALUES (v_prioritized_contact_id, v_participant_email, true, 'personal'::contact_point_type);\
        ELSE\
            RAISE NOTICE 'Found existing contact for email: % -> Contact ID: %', v_participant_email, v_prioritized_contact_id;\
            FOR v_duplicate_record IN SELECT contact_id FROM temp_found_contacts WHERE contact_id != v_prioritized_contact_id LOOP\
                PERFORM 1 FROM public.contact_duplicates WHERE primary_contact_id = v_prioritized_contact_id AND duplicate_contact_id = v_duplicate_record.contact_id;\
                IF NOT FOUND THEN\
                    RAISE NOTICE 'Logging duplicate contact: Primary %, Duplicate % for email %', v_prioritized_contact_id, v_duplicate_record.contact_id, v_participant_email;\
                    INSERT INTO public.contact_duplicates (primary_contact_id, duplicate_contact_id, email, detected_at, status, notes)\
                    VALUES (v_prioritized_contact_id, v_duplicate_record.contact_id, v_participant_email, NOW(), 'pending', 'Detected during email processing');\
                END IF;\
            END LOOP;\
        END IF;\
\
        UPDATE temp_participants SET contact_id = v_prioritized_contact_id WHERE email = v_participant_email;\
        v_all_contact_ids := array_append(v_all_contact_ids, v_prioritized_contact_id);\
        IF v_participant_email = lower(trim(NEW.from_email)) THEN\
            v_sender_contact_id := v_prioritized_contact_id;\
        END IF;\
        DROP TABLE temp_found_contacts;\
    END LOOP;\
\
    IF v_sender_contact_id IS NULL THEN\
       RAISE WARNING 'Could not determine sender contact ID for email_inbox id: %', NEW.id;\
       -- Optionally handle this case, e.g., by setting v_sender_contact_id to a default or skipping inserts that require it.\
       -- For now, we let it proceed, which might cause NOT NULL violations later if columns require it.\
    END IF;\
\
\
    SELECT array_agg(DISTINCT e) INTO v_all_contact_ids FROM unnest(v_all_contact_ids) e;\
    RAISE NOTICE 'Prioritized Contact IDs for this email: %', v_all_contact_ids;\
\
    -- 3. Process Email Thread\
    SELECT email_thread_id INTO v_email_thread_id FROM public.email_threads WHERE thread_id = NEW.thread_id LIMIT 1;\
    IF v_email_thread_id IS NULL THEN\
        RAISE NOTICE 'Creating new email thread for thread_id: %', NEW.thread_id;\
        INSERT INTO public.email_threads (thread_id, subject, last_message_timestamp, updated_at)\
        VALUES (NEW.thread_id, NEW.subject, NEW.message_timestamp, NOW())\
        RETURNING email_thread_id INTO v_email_thread_id;\
    ELSE\
        RAISE NOTICE 'Found existing email thread: %', v_email_thread_id;\
        UPDATE public.email_threads SET last_message_timestamp = NEW.message_timestamp, subject = NEW.subject, updated_at = NOW() WHERE email_thread_id = v_email_thread_id;\
    END IF;\
\
    -- 4. Link Contacts to Thread\
    IF array_length(v_all_contact_ids, 1) > 0 THEN\
        RAISE NOTICE 'Linking % contacts to email thread %', array_length(v_all_contact_ids, 1), v_email_thread_id;\
        INSERT INTO public.contact_email_threads (contact_id, email_thread_id) SELECT unnest(v_all_contact_ids), v_email_thread_id ON CONFLICT (contact_id, email_thread_id) DO NOTHING;\
    END IF;\
\
    -- 5. Check if email already exists in emails table\
    SELECT email_id INTO v_existing_email_id FROM public.emails WHERE gmail_id = NEW.gmail_id LIMIT 1;\
    \
    IF v_existing_email_id IS NULL THEN\
        -- Email doesn't exist, create new record\
        RAISE NOTICE 'Creating new emails record for gmail_id: %', NEW.gmail_id;\
        INSERT INTO public.emails (email_thread_id, gmail_id, thread_id, sender_contact_id, subject, body_plain, message_timestamp, direction, has_attachments, attachment_count, special_case, created_by)\
        VALUES (\
            v_email_thread_id,\
            NEW.gmail_id,\
            NEW.thread_id,\
            v_sender_contact_id,\
            NEW.subject,\
            NEW.message_text,\
            NEW.message_timestamp,\
            COALESCE(NEW.direction, 'neutral'),\
            COALESCE(NEW.has_attachments, false),\
            COALESCE(NEW.attachment_count, 0),\
            NEW.special_case::text, -- Cast special_case to text since schema shows it as USER-DEFINED\
            'Edge Function'::text  -- Use text type as per schema\
        )\
        RETURNING email_id INTO v_email_id;\
        \
        -- 6. Create 'email_participants' Records\
        RAISE NOTICE 'Creating email_participants records for email_id: %', v_email_id;\
        INSERT INTO public.email_participants (email_id, contact_id, participant_type) \
        SELECT v_email_id, contact_id, role FROM temp_participants \
        WHERE contact_id IS NOT NULL \
        ON CONFLICT (email_id, contact_id, participant_type) DO NOTHING;\
        \
        -- 7. Create 'interactions' Record\
        RAISE NOTICE 'Creating interactions record for email_id: %', v_email_id;\
        INSERT INTO public.interactions (contact_id, interaction_type, direction, interaction_date, chat_id, summary, external_interaction_id, special_case_tag, email_thread_id)\
        VALUES (\
            v_sender_contact_id,                        -- contact_id\
            'email'::public.interaction_type,           -- interaction_type\
            COALESCE(NEW.direction, 'neutral')::public.interaction_direction,-- direction\
            NEW.message_timestamp,                      -- interaction_date\
            NULL, -- CORRECTED: Use NULL for chat_id for emails\
            NEW.subject,                                -- summary\
            NEW.gmail_id,                               -- external_interaction_id (using gmail_id)\
            NEW.special_case::text,                     -- special_case_tag\
            v_email_thread_id                           -- email_thread_id (link to the email thread)\
        )\
        RETURNING interaction_id INTO v_interaction_id;\
        \
        -- 8. Create Initial 'attachments' Records\
        IF COALESCE(NEW.has_attachments, false) = true AND NEW.attachment_details IS NOT NULL AND jsonb_array_length(NEW.attachment_details) > 0 THEN\
            RAISE NOTICE 'Creating % attachment records for interaction_id: %', jsonb_array_length(NEW.attachment_details), v_interaction_id;\
            FOR v_att_data IN SELECT jsonb_array_elements(NEW.attachment_details) LOOP\
                INSERT INTO public.attachments (interaction_id, email_thread_id, contact_id, file_name, file_url, file_type, file_size, external_reference, processing_status, created_by)\
                VALUES (\
                    v_interaction_id,\
                    v_email_thread_id,\
                    v_sender_contact_id,\
                    v_att_data->>'filename',\
                    v_placeholder_url,  -- Added placeholder URL since this is a NOT NULL field\
                    v_att_data->>'type',\
                    (v_att_data->>'size')::bigint,\
                    v_att_data->>'gmail_attachment_id',\
                    'pending',\
                    'User'::creator_type -- Changed to User based on schema\
                );\
            END LOOP;\
        END IF;\
    ELSE\
        -- Email already exists, use the existing ID\
        RAISE NOTICE 'Email with gmail_id: % already exists as email_id: %. Skipping insert.', NEW.gmail_id, v_existing_email_id;\
        v_email_id := v_existing_email_id;\
        \
        -- Get the interaction_id associated with this email if needed for further processing\
        SELECT interaction_id INTO v_interaction_id \
        FROM public.interactions \
        WHERE external_interaction_id = NEW.gmail_id \
        LIMIT 1;\
    END IF;\
\
    -- 9. Cleanup\
    RAISE NOTICE 'Deleting processed email_inbox record: %', NEW.id;\
    DELETE FROM public.email_inbox WHERE id = NEW.id;\
\
    -- 10. Finish\
    RAISE NOTICE 'Successfully processed email_inbox id: %', NEW.id;\
    RETURN NULL;\
\
EXCEPTION\
    WHEN OTHERS THEN\
        GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT,\
                                v_error_context = PG_EXCEPTION_CONTEXT;\
        -- *** IMPROVED ERROR LOGGING ***\
        RAISE NOTICE E'--- ERROR Processing email_inbox id: % ---', NEW.id;\
        RAISE NOTICE E'Error Message: %', v_error_message;\
        RAISE NOTICE E'Function Context:\\n%', v_error_context; -- Context includes function name and line number\
        RAISE NOTICE E'--- END ERROR Context ---';\
\
        UPDATE public.email_inbox\
        SET processing_error = TRUE, error_message = left(v_error_message, 1000), retry_count = COALESCE(retry_count, 0) + 1, last_processed_at = NOW(), start_trigger = FALSE\
        WHERE id = NEW.id;\
\
        RETURN NULL;\
END;\
$function$\
}