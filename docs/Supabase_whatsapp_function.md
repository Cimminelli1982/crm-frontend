{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 CREATE OR REPLACE FUNCTION public.process_whatsapp_message()\
 RETURNS trigger\
 LANGUAGE plpgsql\
AS $function$\
    DECLARE\
        v_contact_id UUID;\
        v_chat_id UUID;\
        v_interaction_id UUID;\
        v_attachment_id UUID;\
        v_first_name TEXT;\
        v_last_name TEXT;\
        v_contact_mobile TEXT;\
        v_contact_category contact_category;\
    BEGIN\
       -- Determine contact mobile based on direction\
IF NEW.direction = 'sent' THEN\
    v_contact_mobile := NEW.receiver;\
ELSE\
    v_contact_mobile := NEW.contact_number;\
END IF;\
\
-- Only proceed with contact processing if we have a valid mobile and it's not a group chat with sent direction\
IF v_contact_mobile IS NOT NULL AND NOT (NEW.is_group_chat = TRUE AND NEW.direction = 'sent') THEN\
    -- First, find ALL contacts with this mobile number to handle duplicates\
    WITH found_contacts AS (\
        SELECT c.contact_id, c.first_name, c.last_name, c.category\
        FROM public.contact_mobiles cm\
        JOIN public.contacts c ON cm.contact_id = c.contact_id\
        WHERE cm.mobile = v_contact_mobile\
    ),\
    prioritized_contact AS (\
        -- Prioritize contacts with categories other than Skip, Not Set, or Inbox\
        SELECT contact_id, first_name, last_name, category,\
            CASE WHEN category NOT IN ('Skip', 'Not Set', 'Inbox') THEN 1 ELSE 0 END AS priority\
        FROM found_contacts\
        ORDER BY priority DESC\
        LIMIT 1\
    )\
    SELECT contact_id, first_name, last_name, category\
    INTO v_contact_id, v_first_name, v_last_name, v_contact_category\
    FROM prioritized_contact;\
\
    -- Update last_interaction_at for ALL contacts with this mobile (not just the selected one)\
    UPDATE public.contacts c\
    SET last_interaction_at = NEW.message_timestamp\
    FROM public.contact_mobiles cm\
    WHERE cm.contact_id = c.contact_id\
    AND cm.mobile = v_contact_mobile\
    AND (c.last_interaction_at IS NULL OR NEW.message_timestamp > c.last_interaction_at);\
\
    -- Skip further processing if contact is in "Skip" category\
    IF v_contact_id IS NOT NULL AND v_contact_category = 'Skip'::contact_category THEN\
        DELETE FROM public.whatsapp_inbox WHERE id = NEW.id;\
        RETURN NULL;\
    END IF;\
\
    -- Create new contact if needed\
    IF v_contact_id IS NULL THEN\
        INSERT INTO public.contacts (\
            first_name,\
            last_name,\
            category,\
            created_by,\
            last_interaction_at\
        ) VALUES (\
            NEW.first_name,\
            NEW.last_name,\
            CASE\
                WHEN NEW.is_group_chat THEN 'WhatsApp Group Contact'::contact_category\
                ELSE 'Inbox'::contact_category\
            END,\
            'User'::public.creation_source,\
            NEW.message_timestamp\
        )\
        RETURNING contact_id, first_name, last_name INTO v_contact_id, v_first_name, v_last_name;\
\
        INSERT INTO public.contact_mobiles (\
            contact_id,\
            mobile,\
            is_primary,\
            type\
        ) VALUES (\
            v_contact_id,\
            v_contact_mobile,\
            TRUE,\
            'personal'::public.contact_point_type\
        );\
    ELSE\
        -- Handle duplicate contacts if we found more than one\
        -- Find all the duplicates (excluding the primary one we'll use for this message)\
        WITH all_contacts AS (\
            SELECT c.contact_id \
            FROM public.contact_mobiles cm\
            JOIN public.contacts c ON cm.contact_id = c.contact_id\
            WHERE cm.mobile = v_contact_mobile\
            AND c.contact_id != v_contact_id -- Exclude the primary\
        )\
        INSERT INTO public.contact_duplicates (\
            primary_contact_id,\
            duplicate_contact_id,\
            mobile_number,\
            detected_at,\
            status,\
            notes\
        )\
        SELECT \
            v_contact_id,\
            all_contacts.contact_id,\
            v_contact_mobile,\
            NOW(),\
            'pending',\
            'Detected during WhatsApp message processing'\
        FROM all_contacts\
        -- Only insert if this pair doesn't already exist in contact_duplicates\
        WHERE NOT EXISTS (\
            SELECT 1 FROM public.contact_duplicates \
            WHERE primary_contact_id = v_contact_id \
            AND duplicate_contact_id = all_contacts.contact_id\
        );\
    END IF;\
ELSE\
    -- For group chats with sent messages, we don't try to find or create a contact\
    v_contact_id := NULL;\
    RAISE NOTICE 'Skipping contact processing for group chat sent message: %', NEW.id;\
END IF;\
\
        -- Chat processing (always happens)\
        -- 1. First try to match by chat_jid (if available)\
        IF NEW.chat_jid IS NOT NULL THEN\
            SELECT id INTO v_chat_id\
            FROM public.chats\
            WHERE external_chat_id = NEW.chat_jid\
            LIMIT 1;\
\
            -- If we found a match, we're done with chat lookup\
            IF v_chat_id IS NOT NULL THEN\
                RAISE NOTICE 'Found chat by chat_jid: %', NEW.chat_jid;\
            END IF;\
        END IF;\
\
        -- 2. If no match by ID, try matching by name (old method)\
        IF v_chat_id IS NULL AND NEW.chat_name IS NOT NULL THEN\
            SELECT id INTO v_chat_id\
            FROM public.chats\
            WHERE chat_name = NEW.chat_name\
            LIMIT 1;\
\
            -- If we found a match by name, update the external_chat_id if available\
            IF v_chat_id IS NOT NULL AND NEW.chat_jid IS NOT NULL THEN\
                RAISE NOTICE 'Found chat by name, updating with chat_jid: %', NEW.chat_jid;\
                UPDATE public.chats\
                SET external_chat_id = NEW.chat_jid\
                WHERE id = v_chat_id;\
            END IF;\
        END IF;\
\
        -- 3. If still no match, create a new chat\
        IF v_chat_id IS NULL AND (NEW.chat_name IS NOT NULL OR NEW.chat_jid IS NOT NULL) THEN\
            INSERT INTO public.chats (\
                chat_name,\
                external_chat_id,\
                is_group_chat,\
                category,\
                created_by\
            ) VALUES (\
                COALESCE(NEW.chat_name, CONCAT(v_first_name, ' ', v_last_name)),\
                NEW.chat_jid,\
                COALESCE(NEW.is_group_chat, FALSE),\
                CASE WHEN COALESCE(NEW.is_group_chat, FALSE) THEN 'group'::public.chat_category\
                     ELSE 'individual'::public.chat_category END,\
                'Edge Function'\
            )\
            RETURNING id INTO v_chat_id;\
\
            RAISE NOTICE 'Created new chat: % with chat_jid: %', NEW.chat_name, NEW.chat_jid;\
        END IF;\
\
        -- 4. Track group chat participants (only for valid contacts)\
        IF v_contact_id IS NOT NULL AND COALESCE(NEW.is_group_chat, FALSE) = TRUE AND v_chat_id IS NOT NULL THEN\
            -- Check if this contact is already associated with this chat\
            PERFORM 1 FROM public.contact_chats\
            WHERE contact_id = v_contact_id AND chat_id = v_chat_id;\
\
            -- If not found, create the association\
            IF NOT FOUND THEN\
                INSERT INTO public.contact_chats (\
                    contact_id,\
                    chat_id\
                ) VALUES (\
                    v_contact_id,\
                    v_chat_id\
                );\
                RAISE NOTICE 'Added participant % to group chat %', v_contact_id, v_chat_id;\
            END IF;\
        END IF;\
\
        -- Always create an interaction\
        -- Now contact_id can be NULL for group chat sent messages\
        INSERT INTO public.interactions (\
            contact_id,\
            interaction_type,\
            direction,\
            interaction_date,\
            chat_id,\
            summary\
        ) VALUES (\
            v_contact_id, -- This can now be NULL for group sent messages\
            'whatsapp'::public.interaction_type,\
            CASE\
                WHEN NEW.direction = 'sent' THEN 'sent'::public.interaction_direction\
                WHEN NEW.direction = 'received' THEN 'received'::public.interaction_direction\
                ELSE 'neutral'::public.interaction_direction\
            END,\
            NEW.message_timestamp,\
            v_chat_id,\
            NEW.message_text\
        )\
        RETURNING interaction_id INTO v_interaction_id;\
\
        IF NEW.attachment_url IS NOT NULL THEN\
            BEGIN\
                INSERT INTO public.attachments (\
                    file_name,\
                    file_url,\
                    file_type,\
                    file_size,\
                    created_by,\
                    interaction_id,\
                    chat_id,\
                    contact_id\
                ) VALUES (\
                    NEW.attachment_filename,\
                    NEW.attachment_url,\
                    NEW.attachment_type,\
                    NEW.attachment_size,\
                    'User'::public.creator_type,\
                    v_interaction_id,\
                    v_chat_id,\
                    v_contact_id\
                )\
                RETURNING attachment_id INTO v_attachment_id;\
            EXCEPTION WHEN undefined_column THEN\
                -- Fallback for old schema without chat_id or contact_id columns\
                INSERT INTO public.attachments (\
                    file_name,\
                    file_url,\
                    file_type,\
                    file_size,\
                    created_by,\
                    interaction_id\
                ) VALUES (\
                    NEW.attachment_filename,\
                    NEW.attachment_url,\
                    NEW.attachment_type,\
                    NEW.attachment_size,\
                    'User'::public.creator_type,\
                    v_interaction_id\
                )\
                RETURNING attachment_id INTO v_attachment_id;\
            END;\
        END IF;\
\
        -- Always delete the processed message\
        DELETE FROM public.whatsapp_inbox WHERE id = NEW.id;\
\
        RETURN NULL;\
    EXCEPTION WHEN OTHERS THEN\
        RAISE NOTICE 'Error processing message %: %', NEW.id, SQLERRM;\
\
        UPDATE whatsapp_inbox\
        SET\
            processing_error = TRUE,\
            error_message = SQLERRM,\
            retry_count = COALESCE(retry_count, 0) + 1,\
            last_processed_at = NOW(),\
            start_trigger = FALSE\
        WHERE id = NEW.id;\
\
        RETURN NULL;\
    END;\
    $function$\
}