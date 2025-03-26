const { WebClient } = require('@slack/web-api');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const { Buffer } = require('buffer');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Slack WebClient
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

// Function to download file and convert to base64
async function downloadFileAsBase64(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data).toString('base64');
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

// Simple in-memory "cache" to track seen events (limited in serverless)
// Note: This won't persist between function invocations but may help with 
// duplicate events in quick succession
const processedEvents = new Set();

// Function to handle the request
exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event.headers));
  
  try {
    // Verify the request is from Slack
    const payload = JSON.parse(event.body);
    console.log("Parsed payload type:", payload.type);
    
    // If this is a URL verification challenge
    if (payload.type === 'url_verification') {
      console.log("Handling URL verification challenge");
      return {
        statusCode: 200,
        body: payload.challenge,
      };
    }
    
    // Event deduplication
    // Use a combination of team, event_id, and event_ts as a unique key
    const eventId = payload.event_id || '';
    const eventTs = payload.event?.ts || '';
    const teamId = payload.team_id || '';
    const eventKey = `${teamId}-${eventId}-${eventTs}`;
    
    // Check if we've seen this event before
    if (processedEvents.has(eventKey)) {
      console.log(`Duplicate event detected: ${eventKey}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Duplicate event' }),
      };
    }
    
    // Add to processed events
    processedEvents.add(eventKey);
    
    // Limit cache size to prevent memory issues
    if (processedEvents.size > 100) {
      // Remove oldest items
      const iterator = processedEvents.values();
      for (let i = 0; i < 50; i++) {
        processedEvents.delete(iterator.next().value);
      }
    }
  
  // Only respond to direct messages to the bot or mentions in channels
  console.log("Event payload:", JSON.stringify(payload.event));
  
  if (payload.event && 
      (payload.event.type === 'message' && 
       (payload.event.channel_type === 'im' || 
        (payload.event.text && payload.event.text.includes(`<@${process.env.SLACK_BOT_USER_ID}>`))))) {
    console.log("Processing message event");
    
    // Log file details if present
    if (payload.event.files) {
      console.log("Files detected:", JSON.stringify(payload.event.files));
    }
    
    // Log attachment details if present
    if (payload.event.attachments) {
      console.log("Attachments detected:", JSON.stringify(payload.event.attachments));
    }
    
    // Enhanced bot message detection to prevent infinite loops
    // Check for any indication this is a bot message or our own previous message
    if (payload.event.bot_id || 
        payload.event.subtype === 'bot_message' ||
        payload.event.user === process.env.SLACK_BOT_USER_ID ||
        (payload.event.text && 
         (payload.event.text === "Thinking..." || 
          payload.event.text.includes("Sorry, I encountered an error"))) ||
        // Event timestamp deduplication - only process events from last minute
        (payload.event.ts && (Date.now()/1000 - parseFloat(payload.event.ts)) > 60)) {
      
      console.log("Ignoring bot message or old message");
      return { statusCode: 200, body: 'Ignoring bot message or duplicate' };
    }
    
    try {
      // Extract both text and attachments from the message
      let userMessage = payload.event.text || "";
      const userId = payload.event.user;
      const channelId = payload.event.channel;
      
      // Array to hold image objects for Claude (defined at this scope)
      const imageObjects = [];
      
      console.log("Initial user message:", userMessage);
      
      // Handle files if present (like images, PDFs, etc.)
      if (payload.event.files && payload.event.files.length > 0) {
        console.log("Processing files");
        let filesText = "";
        
        // Process each file
        for (const file of payload.event.files) {
          console.log(`Processing file: ${file.name} (${file.filetype})`);
          
          // For images, download and convert to base64
          if (file.mimetype && file.mimetype.startsWith('image/')) {
            console.log(`Downloading image: ${file.url_private}`);
            
            try {
              // Download the image using Slack's token for authorization
              const base64Image = await downloadFileAsBase64(file.url_private);
              
              if (base64Image) {
                // Add to the messages array for Claude
                imageObjects.push({
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: file.mimetype,
                    data: base64Image
                  }
                });
                
                console.log("Image successfully downloaded and converted to base64");
              } else {
                filesText += `\nImage: ${file.name} (Could not download)\n`;
              }
            } catch (imageError) {
              console.error(`Error processing image ${file.name}:`, imageError);
              filesText += `\nImage: ${file.name} (Error: ${imageError.message})\n`;
            }
          } else {
            // For non-image files, just add text description
            filesText += `\nFile: ${file.name} (${file.filetype})\n`;
            
            if (file.title) {
              filesText += `Title: ${file.title}\n`;
            }
            
            if (file.url_private) {
              filesText += `URL: ${file.url_private}\n`;
            }
          }
        }
        
        // Add any non-image file descriptions to the message
        if (filesText) {
          userMessage += "\n\nAttached files:\n" + filesText;
        }
        
        console.log("Message after adding files:", userMessage);
        console.log("Number of image objects:", imageObjects.length);
      }
      
      // Handle attachments if present
      if (payload.event.attachments && payload.event.attachments.length > 0) {
        console.log("Processing attachments");
        const attachmentsText = payload.event.attachments
          .map(attachment => {
            let attachmentContent = '';
            
            // Add title if present
            if (attachment.title) {
              attachmentContent += `Title: ${attachment.title}\n`;
            }
            
            // Add text if present
            if (attachment.text) {
              attachmentContent += `${attachment.text}\n`;
            }
            
            // Add image URLs if present
            if (attachment.image_url) {
              attachmentContent += `Image: ${attachment.image_url}\n`;
            }
            
            // Add fields if present
            if (attachment.fields && attachment.fields.length > 0) {
              attachment.fields.forEach(field => {
                attachmentContent += `${field.title}: ${field.value}\n`;
              });
            }
            
            return attachmentContent;
          })
          .join('\n');
        
        // Append attachments text to user message
        userMessage += "\n\n" + attachmentsText;
        console.log("Message after adding attachments:", userMessage);
      }
      
      // Skip sending typing indicator to reduce potential for event loops
      console.log("Skipping typing indicator to reduce event noise");
      
      // Call Claude API
      console.log("Calling Claude API with message:", userMessage);
      // Declare claudeResponse at this scope so it's available outside the try block
      let claudeResponse;
      
      try {
        // Prepare message content - combine text with image objects
        let messageContent = [{ type: "text", text: userMessage }];
        
        // Add any images to the content array
        if (imageObjects && imageObjects.length > 0) {
          console.log(`Adding ${imageObjects.length} images to Claude message`);
          messageContent = messageContent.concat(imageObjects);
        }
        
        // Call Claude API with multimodal content
        claudeResponse = await anthropic.messages.create({
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 4096,
          messages: [
            { role: "user", content: messageContent }
          ],
          system: "You are a helpful AI assistant named Claude, integrated into Slack. Be concise, friendly, and helpful. Format your responses using Slack markdown. When encountering code, use ```language syntax highlighting. When shown images, describe what you see in the image clearly but concisely."
        });
        
        console.log("Claude API response received", 
                   {responseType: typeof claudeResponse, 
                    hasContent: !!claudeResponse.content, 
                    contentLength: claudeResponse.content ? claudeResponse.content.length : 0});
      } catch (apiError) {
        console.error("Claude API error:", apiError);
        throw apiError;
      }
      
      // Send Claude's response back to Slack
      console.log("Sending response back to Slack");
      try {
        if (!claudeResponse || !claudeResponse.content || !claudeResponse.content[0]) {
          throw new Error("No valid response received from Claude");
        }
        
        await web.chat.postMessage({
          channel: channelId,
          text: claudeResponse.content[0].text,
          thread_ts: payload.event.thread_ts,
        });
        console.log("Response sent successfully");
      } catch (slackError) {
        console.error("Error sending message to Slack:", slackError);
        throw slackError;
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Message processed successfully' }),
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Send error message to Slack
      await web.chat.postMessage({
        channel: payload.event.channel,
        text: "Sorry, I encountered an error processing your message.",
        thread_ts: payload.event.thread_ts,
      });
      
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error processing message' }),
      };
    }
  }
  
  // Return a 200 for any other event types
  console.log("Event type not handled, returning 200");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Event received' }),
  };
  
  } catch (error) {
    console.error("Unhandled error in handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unhandled error in function', details: error.message }),
    };
  }
};