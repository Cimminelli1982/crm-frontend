import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Supabase Client Setup
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Service Role Key must be defined in environment variables.");
}
const supabase = createClient(supabaseUrl, supabaseKey);
// --- Configuration ---
const GMAIL_USER_EMAIL = "simone@cimminelli.com";
const CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.warn("⚠️ One or more Google API credentials are missing. Authentication may fail.");
}
const MAX_TEXT_LENGTH = 32768;
const GOOGLE_PROJECT_ID = "watchful-goods-430419-r0";
const GMAIL_PUBSUB_TOPIC = `projects/${GOOGLE_PROJECT_ID}/topics/gmail-email-notifications`;
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly"
];
// --- Google Authentication ---
let accessToken = "";
let tokenExpiry = 0;
async function refreshAccessToken() {
  console.log("🔄 Refreshing Google Access Token...");
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error("Cannot refresh token: Google API credentials missing.");
  }
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: "refresh_token"
      })
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) {
      console.error("❌ Failed to refresh token:", response.status, data);
      throw new Error(`Failed to refresh Google Access Token. Status: ${response.status}, Response: ${JSON.stringify(data)}`);
    }
    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000 - 5 * 60 * 1000;
    console.log(`✅ New Access Token obtained (valid for ~${Math.round(data.expires_in / 60)} minutes)`);
    return accessToken;
  } catch (error) {
    console.error("❌ Exception during token refresh:", error);
    throw error;
  }
}
async function getValidAccessToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    console.log("⏳ Access token expired or missing, attempting refresh...");
    try {
      return await refreshAccessToken();
    } catch (error) {
      console.error("❌ FATAL: Could not get valid access token after refresh attempt.", error.message);
      throw new Error("Unable to obtain valid Google Access Token.");
    }
  }
  return accessToken;
}
// --- Helper Functions ---
function extractNameAndEmail(address) {
  if (!address) return {
    name: "",
    email: ""
  };
  address = address.trim();
  const emailMatch = address.match(/<(.+?)>/);
  let email = "";
  let name = "";
  if (emailMatch && emailMatch[1]) {
    email = emailMatch[1].trim();
    name = address.substring(0, address.indexOf("<")).trim().replace(/^"|"$/g, "");
    if (!name) {
      name = extractNameFromEmail(email);
    }
  } else {
    if (address.includes("@")) {
      email = address;
      name = extractNameFromEmail(email);
    } else {
      console.warn(`⚠️ Could not parse email from address: "${address}". Treating as name.`);
      name = address;
      email = "";
    }
  }
  return {
    name: name || "",
    email: email || ""
  };
}
function extractNameFromEmail(email) {
  if (!email || !email.includes("@")) return "";
  const localPart = email.split("@")[0];
  return localPart.replace(/[._-]/g, " ").split(" ").filter((word)=>word.length > 0).map((word)=>word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ").trim();
}

// Helper function to extract domain from email
function extractDomainFromEmail(email) {
  if (!email || !email.includes("@")) return "";
  return email.split("@")[1]?.toLowerCase() || "";
}

function processMultipleRecipients(addressList) {
  if (!addressList) return {
    emails: "",
    names: ""
  };
  const addresses = addressList.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  const recipients = addresses.map((addr)=>extractNameAndEmail(addr.trim())).filter((r)=>r.email);
  const emails = recipients.map((r)=>r.email).join(",");
  const names = recipients.map((r)=>r.name).join(",");
  return {
    emails,
    names
  };
}
async function getFullEmailContent(emailDetails) {
  try {
    const payload = emailDetails.payload;
    if (!payload) {
      console.warn(`⚠️ No payload found for message ID: ${emailDetails.id}`);
      return emailDetails.snippet || "";
    }
    let textContent = null;
    let htmlContent = null;
    const findContentParts = (part)=>{
      if (!part) return;
      const decodeData = (data)=>{
        if (!data) return "";
        try {
          return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
        } catch (e) {
          console.error(`⚠️ Error decoding base64 data snippet: ${data.substring(0, 50)}...`, e.message);
          return "";
        }
      };
      const mimeType = part.mimeType?.toLowerCase();
      if (part.body?.data) {
        if (mimeType === "text/plain" && textContent === null) {
          textContent = decodeData(part.body.data);
          return;
        } else if (mimeType === "text/html" && htmlContent === null) {
          htmlContent = decodeData(part.body.data);
        }
      }
      if (part.parts && Array.isArray(part.parts) && textContent === null) {
        for (const subPart of part.parts){
          if (subPart.mimeType?.toLowerCase() === "text/plain") {
            findContentParts(subPart);
            if (textContent !== null) return;
          }
        }
        if (htmlContent === null) {
          for (const subPart of part.parts){
            if (subPart.mimeType?.toLowerCase() === "text/html") {
              findContentParts(subPart);
            }
          }
        }
        if (textContent === null) {
          for (const subPart of part.parts){
            if (subPart.mimeType?.toLowerCase().startsWith("multipart/") || subPart.parts && ![
              "text/plain",
              "text/html"
            ].includes(subPart.mimeType?.toLowerCase())) {
              findContentParts(subPart);
              if (textContent !== null) return;
            }
          }
        }
      }
    };
    findContentParts(payload);
    if (textContent !== null) {
      return textContent.trim();
    }
    if (htmlContent !== null) {
      console.log(`ℹ️ No text/plain found, using text/html content (stripping tags) for ${emailDetails.id}.`);
      return htmlContent.replace(/<style[^>]*>.*<\/style>/gis, " ").replace(/<script[^>]*>.*<\/script>/gis, " ").replace(/<head[^>]*>.*<\/head>/gis, " ").replace(/<[^>]+>/g, " ").replace(/ /gi, " ").replace(/\s+/g, " ").trim();
    }
    console.warn(`⚠️ No text/plain or text/html body parts found for ${emailDetails.id}. Using snippet.`);
    return emailDetails.snippet || "";
  } catch (error) {
    console.error(`❌ Error extracting full email content for ${emailDetails.id}: ${error.message}`, error.stack);
    return null;
  }
}
// --- Gmail Watch & History Processing ---
async function setupGmailWatch() {
  console.log("🔧 Setting up Gmail push notifications...");
  try {
    const token = await getValidAccessToken();
    console.log(`📡 Sending request to Gmail API watch endpoint with topic: ${GMAIL_PUBSUB_TOPIC}`);
    const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/watch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        topicName: GMAIL_PUBSUB_TOPIC,
        labelIds: [
          "INBOX",
          "SENT"
        ],
        labelFilterAction: "include"
      })
    });
    const responseText = await response.text();
    console.log("📊 Watch Response status:", response.status, response.statusText);
    console.log("📄 Watch Response body:", responseText);
    if (!response.ok) {
      console.error(`❌ Failed to set up Gmail watch: ${response.status} ${response.statusText}`);
      let errorDetails = responseText;
      try {
        errorDetails = JSON.parse(responseText);
      } catch  {}
      throw new Error(`Failed to set up Gmail watch. Response: ${JSON.stringify(errorDetails)}`);
    }
    const data = JSON.parse(responseText);
    const expirationDate = data.expiration ? new Date(Number(data.expiration)).toLocaleString() : "N/A";
    console.log(`✅ Gmail watch setup successful. History ID: ${data.historyId}, Expiration: ${expirationDate}`);
    await supabase.from("settings").upsert({
      key: "GMAIL_HISTORY_ID",
      value: data.historyId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "key"
    });
    return data;
  } catch (error) {
    console.error("❌ Exception during setupGmailWatch:", error);
    throw error;
  }
}
async function processGmailHistory(notifiedHistoryId) {
  console.log(`🔄 Processing Gmail history triggered by notification ID: ${notifiedHistoryId}...`);
  let startHistoryId = notifiedHistoryId;
  try {
    try {
      const { data: settings, error: settingsError } = await supabase.from("settings").select("value").eq("key", "GMAIL_HISTORY_ID").maybeSingle();
      if (settingsError) {
        console.warn("⚠️ Error fetching startHistoryId from settings:", settingsError.message);
      }
      if (settings?.value) {
        startHistoryId = settings.value;
        console.log(`🔍 Found stored historyId: ${startHistoryId}. Fetching changes since then.`);
      } else {
        console.log(`ℹ️ No stored historyId found, using notified historyId: ${notifiedHistoryId} as starting point.`);
      }
    } catch (fetchError) {
      console.warn(`⚠️ DB Exception fetching history ID from settings: ${fetchError.message}. Using notified ID: ${notifiedHistoryId}`);
    }
    const token = await getValidAccessToken();
    const historyUrl = `https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=${startHistoryId}`;
    console.log(` GMAIL API CALL: GET ${historyUrl.split("?")[0]}?startHistoryId=...`);
    const response = await fetch(historyUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to fetch Gmail history: ${response.status} ${response.statusText}`);
      console.error(`❌ Error details: ${errorText}`);
      return;
    }
    const historyData = await response.json();
    const newHistoryId = historyData.historyId;
    if (!historyData.history || historyData.history.length === 0) {
      console.log(`📝 No new history records found since ${startHistoryId}.`);
    } else {
      console.log(`🔍 Found ${historyData.history.length} history records.`);
      const messagesToAdd = historyData.history.flatMap((record)=>(record.messagesAdded || []).map((msgAdded)=>msgAdded.message.id));
      const uniqueMessageIds = [
        ...new Set(messagesToAdd)
      ];
      console.log(`📧 Processing ${uniqueMessageIds.length} unique messages added.`);
      let successCount = 0;
      let failureCount = 0;
      for (const messageId of uniqueMessageIds){
        try {
          const success = await processEmailById(messageId);
          if (success) successCount++;
          else failureCount++;
        } catch (procError) {
          console.error(`❌ Unhandled error processing message ${messageId} within history loop:`, procError);
          failureCount++;
        }
      }
      console.log(`📊 History batch processed. Success/Skipped: ${successCount}, Failures: ${failureCount}`);
    }
    if (newHistoryId && newHistoryId !== startHistoryId) {
      console.log(`💾 Storing latest processed historyId: ${newHistoryId}`);
      await supabase.from("settings").upsert({
        key: "GMAIL_HISTORY_ID",
        value: newHistoryId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "key"
      });
    } else if (!newHistoryId) {
      console.warn(`⚠️ No new historyId returned from the API. Stored historyId not updated.`);
    } else {
      console.log(`✅ History ID remains ${startHistoryId}. No update needed.`);
    }
  } catch (error) {
    console.error(`❌ UNHANDLED EXCEPTION in processGmailHistory starting from ${startHistoryId}:`, error);
  }
}
// --- Core Email Processing Logic ---
async function processEmailById(messageId) {
  console.log(`📨 ----- Processing message ID: ${messageId} -----`);
  try {
    // Check if email already exists
    const { data: existingEmail, error: checkError } = await supabase.from("email_inbox").select("gmail_id").eq("gmail_id", messageId).maybeSingle();
    if (checkError) {
      console.error(`❌ Error checking existing email ${messageId}:`, checkError.message);
      return false;
    }
    if (existingEmail) {
      console.log(`ℹ️ Email ${messageId} already exists in email_inbox. Skipping processing.`);
      return true;
    }
    // Fetch Full Email Details
    const token = await getValidAccessToken();
    const messageUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
    console.log(` GMAIL API CALL: GET ${messageUrl.split("?")[0]}?format=full...`);
    const emailDetailsResponse = await fetch(messageUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (emailDetailsResponse.status === 404) {
      console.warn(`⚠️ Email not found (ID: ${messageId}). Skipping.`);
      return false;
    }
    if (!emailDetailsResponse.ok) {
      const errorText = await emailDetailsResponse.text();
      console.error(`❌ Failed to fetch email details for ${messageId}. Status: ${emailDetailsResponse.status}`);
      console.error(`❌ Error details: ${errorText}`);
      return false;
    }
    const emailDetails = await emailDetailsResponse.json();
    if (!emailDetails || !emailDetails.id || !emailDetails.payload || !emailDetails.payload.headers) {
      console.error(`❌ Invalid or missing payload/headers for message ID: ${messageId}.`);
      return false;
    }
    // Extract Headers and Basic Info
    const headers = Object.fromEntries(emailDetails.payload.headers.map((h)=>[
        h.name.toLowerCase(),
        h.value
      ]));
    const fromHeader = headers["from"] || "";
    const toHeader = headers["to"] || "";
    const ccHeader = headers["cc"] || "";
    const bccHeader = headers["bcc"] || "";
    const subject = headers["subject"] || "No Subject";
    const messageTimestamp = new Date(parseInt(emailDetails.internalDate)).toISOString();
    const currentTimestamp = new Date().toISOString();
    // Parse Sender and Recipients
    const { name: fromName, email: fromEmail } = extractNameAndEmail(fromHeader);
    const toRecipients = processMultipleRecipients(toHeader);
    const ccRecipients = processMultipleRecipients(ccHeader);
    const bccRecipients = processMultipleRecipients(bccHeader);
    // Determine Direction
    let direction = "neutral";
    const fromEmailLower = fromEmail?.toLowerCase() || "";
    const userEmailLower = GMAIL_USER_EMAIL.toLowerCase();
    const toEmailsArray = toRecipients.emails?.toLowerCase().split(",").filter((e)=>e) || [];
    const ccEmailsLower = ccRecipients.emails?.toLowerCase().split(",").filter((e)=>e) || [];
    const bccEmailsLower = bccRecipients.emails?.toLowerCase().split(",").filter((e)=>e) || [];
    if (fromEmailLower === userEmailLower) {
      direction = "sent";
    } else if (toEmailsArray.includes(userEmailLower)) {
      direction = "received";
    } else if (ccEmailsLower.includes(userEmailLower) || bccEmailsLower.includes(userEmailLower)) {
      direction = "received";
    }
    // SPAM / DOMAIN SPAM / CONTACT / PENDING APPROVAL LOGIC
    let special_case = null;
    let processing_notes = null;
    if (direction === "received" && fromEmailLower && fromEmailLower !== userEmailLower) {
      console.log(`\n🔍 [SPAM FILTERING] Checking sender: ${fromEmailLower}`);

      // 1. Check email spam list first
      console.log(`   📧 [EMAIL CHECK] Checking if email "${fromEmailLower}" is in spam list...`);
      const { data: spamData, error: spamError } = await supabase.from("emails_spam").select("email, counter").eq("email", fromEmailLower).maybeSingle();
      if (spamError) {
        console.error(`   ❌ [EMAIL CHECK ERROR] Failed to check email spam list: ${spamError.message}`);
        processing_notes = "Error checking spam status";
      } else if (spamData) {
        console.log(`   🚫 [EMAIL SPAM DETECTED] Email "${fromEmailLower}" IS IN SPAM LIST!`);
        console.log(`   📊 Current counter: ${spamData.counter || 0}`);
        const newCounter = (spamData.counter || 0) + 1;
        const { error: updateError } = await supabase.from("emails_spam").update({
          counter: newCounter
        }).eq("email", fromEmailLower);
        if (updateError) {
          console.error(`   ❌ [EMAIL COUNTER ERROR] Failed to update counter: ${updateError.message}`);
        } else {
          console.log(`   ✅ [EMAIL COUNTER UPDATED] New count for "${fromEmailLower}": ${newCounter}`);
        }
        console.log(`   🛑 [SKIPPING EMAIL] Email from spam address "${fromEmailLower}" will NOT be processed`);
        return true;
      } else {
        console.log(`   ✅ [EMAIL OK] Email "${fromEmailLower}" is NOT in spam list - checking domain...`);
        // 2. Check domain spam list
        const senderDomain = extractDomainFromEmail(fromEmailLower);
        if (senderDomain) {
          console.log(`   🌐 [DOMAIN CHECK] Checking if domain "${senderDomain}" is in spam list...`);
          const { data: domainSpamData, error: domainSpamError } = await supabase
            .from("domains_spam")
            .select("domain, counter")
            .eq("domain", senderDomain)
            .maybeSingle();

          if (domainSpamError) {
            console.error(`   ❌ [DOMAIN CHECK ERROR] Failed to check domain spam list: ${domainSpamError.message}`);
          } else if (domainSpamData) {
            console.log(`   🚫 [DOMAIN SPAM DETECTED] Domain "${senderDomain}" IS IN SPAM LIST!`);
            console.log(`      📊 Current counter: ${domainSpamData.counter || 0}`);
            const newCounter = (domainSpamData.counter || 0) + 1;
            const { error: updateError } = await supabase
              .from("domains_spam")
              .update({ counter: newCounter })
              .eq("domain", senderDomain);

            if (updateError) {
              console.error(`      ❌ [DOMAIN COUNTER ERROR] Failed to update counter: ${updateError.message}`);
            } else {
              console.log(`      ✅ [DOMAIN COUNTER UPDATED] New count for "${senderDomain}": ${newCounter}`);
            }
            console.log(`      🛑 [SKIPPING EMAIL] Email from spam domain "${senderDomain}" will NOT be processed`);
            return true;
          } else {
            console.log(`   ✅ [DOMAIN OK] Domain "${senderDomain}" is NOT in spam list - proceeding to contact check`);
          }
        }

        // 3. Check contact status
        const { data: contacts, error: contactError } = await supabase.from("contact_emails").select("contact_id, contacts:contact_id(category)").eq("email", fromEmailLower).maybeSingle();
        if (contactError) {
          console.error(`❌ DB Error checking contact status for ${fromEmailLower}:`, contactError);
          processing_notes = "Error checking contact status";
        } else if (contacts) {
          const category = contacts.contacts?.category;
          if (category === "Skip") {
            console.log(`🔄 Adding ${fromEmailLower} to spam list as contact is in Skip category. Skipping.`);
            const { error: insertError } = await supabase.from("emails_spam").insert({
              email: fromEmailLower,
              counter: 1
            });
            if (insertError) {
              console.error(`❌ Error adding to spam list: ${insertError.message}`);
            } else {
              console.log(`✅ Added ${fromEmailLower} to spam list`);
            }
            return true;
          } else {
            processing_notes = `Sender contact exists (Category: ${category || "None"})`;
            console.log(`✓ Sender ${fromEmailLower} is an existing contact (Category: ${category || "None"}).`);
          }
        } else {
          const isDirectToUserOnly = toEmailsArray.length === 1 && toEmailsArray[0] === userEmailLower;
          const hasNoCC = ccEmailsLower.length === 0;
          if (isDirectToUserOnly && hasNoCC) {
            console.log(`⏳ New sender ${fromEmailLower} sent direct email with no CC. Marking as 'pending_approval'.`);
            special_case = "pending_approval";
            processing_notes = "Pending approval - New sender direct email";
          } else {
            processing_notes = "New contact";
            console.log(`ℹ️ New contact detected: ${fromName} <${fromEmailLower}> (Not marked pending - multiple recipients or CC present)`);
          }
        }
      }
    } else if (direction === "sent") {
      processing_notes = "Email sent by user";
    } else if (!fromEmailLower) {
      processing_notes = "Sender email missing";
    } else {
      processing_notes = processing_notes || "Processing notes undetermined";
    }
    // BCC Special Case
    if (bccEmailsLower.includes("deals2airtable@gmail.com")) {
      special_case = "deal";
      console.log("🏷️ Special case 'deal' detected via BCC (overrides pending if applicable).");
    } else if (bccEmailsLower.includes("intro2airtable@gmail.com")) {
      special_case = "introduction";
      console.log("🏷️ Special case 'introduction' detected via BCC (overrides pending if applicable).");
    }
    // Extract Email Body
    let message_text = await getFullEmailContent(emailDetails);
    if (message_text === null) {
      console.warn(`⚠️ Could not extract body for ${messageId}, saving empty text.`);
      message_text = "";
    }
    const limitedMessageText = message_text.substring(0, MAX_TEXT_LENGTH);
    if (message_text.length > MAX_TEXT_LENGTH) {
      console.log(`✂️ Message text truncated for ${messageId}`);
    }
    // Check Attachments
    let hasAttachments = false;
    let attachmentCount = 0;
    let attachmentMetadataArray = null;
    const findAttachmentParts = (parts)=>{
      let foundAttachments = [];
      if (!parts || !Array.isArray(parts)) {
        return foundAttachments;
      }
      for (const part of parts){
        if (part.filename && part.filename.trim() !== "" && part.body?.attachmentId) {
          foundAttachments.push({
            filename: part.filename,
            type: part.mimeType || "application/octet-stream",
            size: part.body.size || 0,
            gmail_attachment_id: part.body.attachmentId
          });
        }
        if (part.parts) {
          foundAttachments = foundAttachments.concat(findAttachmentParts(part.parts));
        }
      }
      return foundAttachments;
    };
    const allAttachments = findAttachmentParts(emailDetails.payload.parts);
    if (allAttachments.length > 0) {
      hasAttachments = true;
      attachmentCount = allAttachments.length;
      attachmentMetadataArray = allAttachments;
      console.log(`📎 Found ${attachmentCount} attachments with IDs for ${messageId}.`);
    }
    // Prepare Record
    const emailRecord = {
      gmail_id: emailDetails.id,
      thread_id: emailDetails.threadId,
      message_timestamp: messageTimestamp,
      from_email: fromEmail || null,
      from_name: fromName || null,
      to_email: toRecipients.emails || null,
      to_name: toRecipients.names || null,
      cc_email: ccRecipients.emails || null,
      cc_name: ccRecipients.names || null,
      bcc_email: bccRecipients.emails || null,
      bcc_name: bccRecipients.names || null,
      subject: subject,
      message_text: limitedMessageText,
      direction: direction,
      special_case: special_case,
      processed: false,
      processing_error: false,
      retry_count: 0,
      start_trigger: true,
      has_attachments: hasAttachments,
      attachment_count: attachmentCount,
      attachment_details: attachmentMetadataArray,
      processing_notes: processing_notes,
      error_message: null
    };
    // Upsert Record
    console.log(`💾 Saving record for gmail_id: ${emailRecord.gmail_id} (Special Case: ${special_case}, Notes: ${processing_notes})`);
    console.log(` DB QUERY: Upserting into email_inbox on conflict(gmail_id)`);
    const { error } = await supabase.from("email_inbox").upsert(emailRecord, {
      onConflict: "gmail_id"
    });
    if (error) {
      console.error(`❌ Error upserting email ${messageId} into email_inbox:`, error);
      return false;
    }
    console.log(`✅ Upsert completed for ${messageId}.`);
    return true;
  } catch (error) {
    console.error(`❌ UNHANDLED EXCEPTION processing email ${messageId}:`, error.message, error.stack);
    return false;
  } finally{
    console.log(`🏁 ----- Finished processing message ID: ${messageId} -----`);
  }
}
// --- HTTP Server ---
serve(async (req)=>{
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  console.log(`\n--- Request received: ${method} ${path} ---`);
  try {
    if (path.endsWith("/setup-watch") && method === "POST") {
      console.log("▶️ /setup-watch endpoint called");
      const data = await setupGmailWatch();
      return new Response(JSON.stringify({
        status: "success",
        message: "Gmail watch configuration attempted.",
        data
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (path.endsWith("/gmail-webhook/pubsub") && method === "POST") {
      console.log("📬 /gmail-webhook/pubsub notification received");
      if (!req.body) {
        console.warn("⚠️ Pub/Sub request received with empty body.");
        return new Response(JSON.stringify({
          status: "error",
          message: "Request body is empty"
        }), {
          status: 400
        });
      }
      const body = await req.json();
      if (body.message && body.message.data) {
        const decodedData = atob(body.message.data);
        const notification = JSON.parse(decodedData);
        if (notification.emailAddress?.toLowerCase() === GMAIL_USER_EMAIL.toLowerCase() && notification.historyId) {
          console.log(`📩 Processing history for ${notification.emailAddress} starting from historyId: ${notification.historyId}`);
          processGmailHistory(notification.historyId).catch((err)=>{
            console.error("❌ Background processGmailHistory failed:", err);
          });
          return new Response(JSON.stringify({
            status: "acknowledged",
            message: "Pub/Sub notification received, processing initiated in background."
          }), {
            status: 200
          });
        } else {
          console.warn(`⚠️ Notification ignored: Email mismatch or missing historyId. Received email: ${notification.emailAddress}, Expected: ${GMAIL_USER_EMAIL}, HistoryId present: ${!!notification.historyId}`);
          return new Response(JSON.stringify({
            status: "ignored",
            message: "Notification ignored (email mismatch or missing historyId)."
          }), {
            status: 200
          });
        }
      } else {
        console.warn("⚠️ Invalid Pub/Sub message format: Missing message or message.data.", JSON.stringify(body));
        return new Response(JSON.stringify({
          status: "error",
          message: "Invalid Pub/Sub message format"
        }), {
          status: 400
        });
      }
    }
    if (path.endsWith("/test-history") && method === "POST") {
      console.log("🧪 /test-history endpoint called");
      const { data: settings, error: dbError } = await supabase.from("settings").select("value").eq("key", "GMAIL_HISTORY_ID").maybeSingle();
      if (dbError) {
        console.error("❌ Error fetching history ID for /test-history:", dbError.message);
      }
      const historyId = settings?.value || "0";
      console.log(`🔍 Using startHistoryId: ${historyId} for manual test run.`);
      processGmailHistory(historyId).catch((err)=>{
        console.error("❌ Background /test-history processing failed:", err);
      });
      return new Response(JSON.stringify({
        status: "success",
        message: `Test history processing initiated in background from historyId: ${historyId}`
      }), {
        status: 202,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    console.log(`⚠️ Unhandled request: ${method} ${path}`);
    return new Response(JSON.stringify({
      status: "error",
      message: "Endpoint not found or method not allowed."
    }), {
      status: 404,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error(`❌ UNHANDLED EXCEPTION in HTTP server handler (${method} ${path}):`, error);
    return new Response(JSON.stringify({
      status: "error",
      message: "Internal Server Error",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
console.log(`🚀 Gmail Edge Function server started at ${new Date().toISOString()}`);
console.log(`Monitoring email: ${GMAIL_USER_EMAIL}`);
console.log(`Pub/Sub Topic: ${GMAIL_PUBSUB_TOPIC}`);