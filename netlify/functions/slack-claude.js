const { WebClient } = require('@slack/web-api');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Slack WebClient
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

// Function to handle the request
exports.handler = async (event) => {
  // Verify the request is from Slack
  const payload = JSON.parse(event.body);
  
  // If this is a URL verification challenge
  if (payload.type === 'url_verification') {
    return {
      statusCode: 200,
      body: payload.challenge,
    };
  }
  
  // Only respond to direct messages to the bot or mentions in channels
  if (payload.event && 
      (payload.event.type === 'message' && 
       (payload.event.channel_type === 'im' || 
        (payload.event.text && payload.event.text.includes(`<@${process.env.SLACK_BOT_USER_ID}>`))))) {
    // Avoid responding to bot's own messages
    if (payload.event.bot_id || payload.event.subtype === 'bot_message') {
      return { statusCode: 200, body: 'Ignoring bot message' };
    }
    
    try {
      // Extract both text and attachments from the message
      let userMessage = payload.event.text || "";
      const userId = payload.event.user;
      const channelId = payload.event.channel;
      
      // Handle attachments if present
      if (payload.event.attachments && payload.event.attachments.length > 0) {
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
      }
      
      // Send typing indicator
      await web.chat.postMessage({
        channel: channelId,
        text: "Thinking...",
        thread_ts: payload.event.thread_ts,
      });
      
      // Call Claude API
      const claudeResponse = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4096,
        messages: [
          { role: "user", content: userMessage }
        ],
        system: "You are a helpful AI assistant named Claude, integrated into Slack. Be concise, friendly, and helpful. Format your responses using Slack markdown. When encountering code, use ```language syntax highlighting."
      });
      
      // Send Claude's response back to Slack
      await web.chat.postMessage({
        channel: channelId,
        text: claudeResponse.content[0].text,
        thread_ts: payload.event.thread_ts,
      });
      
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
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Event received' }),
  };
};