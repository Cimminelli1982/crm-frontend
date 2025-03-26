const { App } = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN, // Only needed if using Socket Mode
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
      body: JSON.stringify({ challenge: payload.challenge }),
    };
  }
  
  // Only respond to direct messages to the bot
  if (payload.event && payload.event.type === 'message' && payload.event.channel_type === 'im') {
    // Avoid responding to bot's own messages
    if (payload.event.bot_id || payload.event.subtype === 'bot_message') {
      return { statusCode: 200, body: 'Ignoring bot message' };
    }
    
    try {
      const userMessage = payload.event.text;
      const userId = payload.event.user;
      const channelId = payload.event.channel;
      
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