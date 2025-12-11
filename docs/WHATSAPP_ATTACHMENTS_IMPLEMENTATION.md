# WhatsApp Attachments Implementation

## Overview
This document details the implementation of permanent WhatsApp attachment storage.

## Problem
- TimelinesAI sends temporary URLs (expire in 15 minutes)
- Attachments were stored as JSON in `command_center_inbox.attachments` (temporary)
- When "Done" is clicked, attachments were lost

## Solution
- Download attachments immediately when webhook fires
- Upload to Supabase Storage (permanent)
- Store metadata in `attachments` table (existing)
- Link to contact/chat/interaction on "Done"

---

## Database Tables Involved

### `attachments` (existing)
```sql
- attachment_id (UUID, PK)
- file_name (varchar)
- file_url (varchar) -- original temp URL
- permanent_url (text) -- Supabase Storage URL ← NEW
- file_type (varchar)
- file_size (bigint)
- contact_id (UUID, FK) -- set on Done
- interaction_id (UUID, FK) -- set on Done
- chat_id (UUID, FK) -- set on Done
- external_reference (text) -- message_uid for staging link
- processing_status (text)
- created_at (timestamp)
```

### `command_center_inbox` (staging)
```sql
- id (UUID, PK)
- message_uid (text) -- links to attachments.external_reference
- has_attachments (boolean)
- attachments (jsonb) -- keep for backwards compat, but not primary
```

### `interactions` (archived messages)
```sql
- interaction_id (UUID, PK)
- external_interaction_id (text) -- same as message_uid
```

### Supabase Storage
- Bucket: `whatsapp-attachments` (exists, public)
- Path: `{chat_id}/{message_uid}/{filename}`

---

## Implementation Steps

### STEP 1: Webhook (main.py)

**File:** `crm-agent-service/app/main.py`
**Function:** `whatsapp_webhook()` (line ~1268)

**Changes:**
1. After INSERT into `command_center_inbox`
2. For each attachment in `attachments_list`:
   - Download from `temporary_download_url`
   - Upload to Supabase Storage bucket `whatsapp-attachments`
   - INSERT into `attachments` table with:
     - `file_url` = temp URL (backup)
     - `permanent_url` = Supabase Storage URL
     - `file_name`, `file_type`, `file_size`
     - `external_reference` = message_uid (links to staging)
     - `contact_id`, `chat_id`, `interaction_id` = NULL (set on Done)

**Code location:** After line 1359 (after INSERT command_center_inbox)

```python
# Download and store attachments permanently
if attachments_list and len(attachments_list) > 0:
    message_uid = message.get('message_uid')  # TimelinesAI uses 'message_uid' NOT 'message_id'
    chat_id_external = str(chat.get('chat_id')) if chat.get('chat_id') else 'unknown'

    for att in attachments_list:
        temp_url = att.get('temporary_download_url')
        filename = att.get('filename', 'attachment')
        mimetype = att.get('mimetype', 'application/octet-stream')
        filesize = att.get('size', 0)

        if temp_url:
            try:
                # Download from temp URL
                async with httpx.AsyncClient() as client:
                    response = await client.get(temp_url, timeout=30.0)
                    if response.status_code == 200:
                        file_content = response.content

                        # Upload to Supabase Storage
                        storage_path = f"{chat_id_external}/{message_uid}/{filename}"

                        # Use supabase client to upload
                        storage_result = db.client.storage.from_('whatsapp-attachments').upload(
                            storage_path,
                            file_content,
                            {"content-type": mimetype}
                        )

                        # Get public URL
                        permanent_url = db.client.storage.from_('whatsapp-attachments').get_public_url(storage_path)

                        # Insert into attachments table
                        db.client.table('attachments').insert({
                            "file_name": filename,
                            "file_url": temp_url,
                            "permanent_url": permanent_url,
                            "file_type": mimetype,
                            "file_size": filesize,
                            "external_reference": message_uid,
                            "processing_status": "completed"
                        }).execute()

                        logger.info("attachment_stored", message_uid=message_uid, filename=filename)
            except Exception as att_error:
                logger.error("attachment_storage_error", error=str(att_error), filename=filename)
```

---

### STEP 2: Done Flow (CommandCenterPage.js)

**File:** `src/pages/CommandCenterPage.js`
**Function:** `handleWhatsAppDone()` (line 3786)

**Changes:**
After step 4 (INSERT interactions), add step 4.5:
- For each message, get the `interaction_id` just inserted
- UPDATE `attachments` SET contact_id, chat_id, interaction_id
  WHERE external_reference = message_uid

**Code location:** After line 3898 (after interactions INSERT)

```javascript
// 4.5 Link attachments to interaction, chat, and contact
const interactionResult = await supabase
  .from('interactions')
  .select('interaction_id')
  .eq('external_interaction_id', msg.message_uid || msg.id)
  .maybeSingle();

if (interactionResult.data) {
  const { error: attachmentLinkError } = await supabase
    .from('attachments')
    .update({
      contact_id: contactId,
      chat_id: crmChatId,
      interaction_id: interactionResult.data.interaction_id
    })
    .eq('external_reference', msg.message_uid || msg.id);

  if (attachmentLinkError) {
    console.error('Error linking attachments:', attachmentLinkError);
  }
}
```

---

### STEP 3: WhatsApp Spam Handler (CommandCenterPage.js)

**File:** `src/pages/CommandCenterPage.js`
**New Function:** `handleWhatsAppSpam()`

**Changes:**
Create new function similar to email spam:
1. INSERT phone into `whatsapp_spam`
2. DELETE attachments from Storage bucket
3. DELETE from `attachments` table
4. DELETE from `command_center_inbox`
5. Update local state

```javascript
const handleWhatsAppSpam = async () => {
  if (!selectedWhatsappChat) return;

  try {
    const phone = selectedWhatsappChat.contact_number;
    const messages = selectedWhatsappChat.messages || [];
    const messageUids = messages.map(m => m.message_uid || m.id).filter(Boolean);

    // 1. Add to spam list
    const { data: existing } = await supabase
      .from('whatsapp_spam')
      .select('counter')
      .eq('mobile_number', phone)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('whatsapp_spam')
        .update({ counter: existing.counter + 1 })
        .eq('mobile_number', phone);
    } else {
      await supabase
        .from('whatsapp_spam')
        .insert({ mobile_number: phone, counter: 1 });
    }

    // 2. Get attachments to delete
    if (messageUids.length > 0) {
      const { data: attachments } = await supabase
        .from('attachments')
        .select('attachment_id, permanent_url')
        .in('external_reference', messageUids);

      // 3. Delete from Storage
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          if (att.permanent_url) {
            // Extract path from URL
            const urlParts = att.permanent_url.split('/whatsapp-attachments/');
            if (urlParts[1]) {
              await supabase.storage
                .from('whatsapp-attachments')
                .remove([urlParts[1]]);
            }
          }
        }

        // 4. Delete from attachments table
        const attIds = attachments.map(a => a.attachment_id);
        await supabase
          .from('attachments')
          .delete()
          .in('attachment_id', attIds);
      }
    }

    // 5. Delete from staging
    const messageIds = messages.map(m => m.id).filter(Boolean);
    if (messageIds.length > 0) {
      await supabase
        .from('command_center_inbox')
        .delete()
        .in('id', messageIds);
    }

    // 6. Update local state
    setWhatsappChats(prev => prev.filter(c => c.chat_id !== selectedWhatsappChat.chat_id));
    setSelectedWhatsappChat(null);

    toast.success('Marked as spam');
  } catch (error) {
    console.error('Error marking as spam:', error);
    toast.error('Failed to mark as spam');
  }
};
```

---

### STEP 4: Frontend Display (WhatsAppTab.js)

**File:** `src/components/command-center/WhatsAppTab.js`

**Changes:**
1. Add styled component for images
2. In `stagingMessages` mapping, include `message_uid`
3. Fetch attachments from `attachments` table
4. Render images in MessageBubble

**Code changes:**

```javascript
// Add styled component (after EmptyState)
const AttachmentImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: ${props => props.$hasText ? '8px' : '0'};
  cursor: pointer;
`;

// In component, add state for attachments
const [attachmentsMap, setAttachmentsMap] = useState({});

// Fetch attachments when chat changes
useEffect(() => {
  const fetchAttachments = async () => {
    if (!selectedChat?.messages) return;

    const messageUids = selectedChat.messages
      .map(m => m.message_uid || m.id)
      .filter(Boolean);

    if (messageUids.length === 0) return;

    const { data } = await supabase
      .from('attachments')
      .select('external_reference, permanent_url, file_name, file_type')
      .in('external_reference', messageUids);

    if (data) {
      const map = {};
      data.forEach(att => {
        if (!map[att.external_reference]) {
          map[att.external_reference] = [];
        }
        map[att.external_reference].push(att);
      });
      setAttachmentsMap(map);
    }
  };

  fetchAttachments();
}, [selectedChat?.messages]);

// In MessageBubble rendering, add attachments
{msg.messageUid && attachmentsMap[msg.messageUid]?.map((att, i) => (
  att.file_type?.startsWith('image/') ? (
    <AttachmentImage
      key={i}
      src={att.permanent_url}
      alt={att.file_name}
      $hasText={!!msg.text}
      onClick={() => window.open(att.permanent_url, '_blank')}
    />
  ) : (
    <a key={i} href={att.permanent_url} target="_blank" rel="noopener noreferrer">
      📎 {att.file_name}
    </a>
  )
))}
```

---

## Implementation Status

✅ **COMPLETED** - 2025-12-11

### Changes Made:

1. **main.py (webhook)** - Lines 1364-1412
   - Downloads attachment from TimelinesAI temp URL
   - Uploads to Supabase Storage bucket `whatsapp-attachments`
   - Inserts into `attachments` table with `external_reference` = message_uid

2. **CommandCenterPage.js (handleWhatsAppDone)** - Lines 3910-3926
   - After inserting interaction, updates `attachments` with contact_id, chat_id, interaction_id

3. **CommandCenterPage.js (handleWhatsAppSpam)** - Lines 3988-4076
   - New function to mark WhatsApp as spam
   - Deletes attachments from Storage and table
   - Deletes messages from staging

4. **WhatsAppTab.js** - Multiple changes
   - Added `AttachmentImage` and `AttachmentLink` styled components
   - Added `attachmentsMap` state and fetch useEffect
   - Added `messageUid` to message mapping
   - Renders attachments inside MessageBubble

## Testing Checklist

1. [ ] Send WhatsApp message with image → check Storage bucket
2. [ ] Verify `attachments` table has record with permanent_url
3. [ ] Verify image displays in Command Center chat
4. [ ] Click "Done" → verify attachments table updated with contact_id, chat_id, interaction_id
5. [ ] Verify image still displays in archived chat
6. [ ] Test spam → verify attachment deleted from Storage and table
7. [ ] Test with audio/video attachments

---

## Rollback Plan

If issues occur:
1. Revert main.py webhook changes
2. Revert CommandCenterPage.js changes
3. Revert WhatsAppTab.js changes
4. Attachments in Storage can remain (won't cause issues)

---

## Files Modified

| File | Changes |
|------|---------|
| `crm-agent-service/app/main.py` | Webhook attachment handling |
| `src/pages/CommandCenterPage.js` | Done flow + Spam handler |
| `src/components/command-center/WhatsAppTab.js` | Display attachments |

---

## Dependencies

- Supabase Storage bucket `whatsapp-attachments` (exists, public)
- httpx for async HTTP requests (already imported)
- supabase-py storage client

