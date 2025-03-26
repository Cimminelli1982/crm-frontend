/**
 * Utility functions for Claude's contact lookup superpower.
 * These helper functions support natural language processing of contact-related requests.
 */
const fetch = require('node-fetch');

// Helper to detect contact lookup requests
function isContactLookupRequest(text) {
  // First, check for explicit command format
  const commandPatterns = [
    /^\/contact\s+(.+)/i,
    /^\/lookup\s+(.+)/i,
    /^\/find\s+(.+)/i,
    /^contact lookup[:\s]+(.+)/i,
    /^lookup contact[:\s]+(.+)/i,
    /^crm lookup[:\s]+(.+)/i,
    /^db lookup[:\s]+(.+)/i
  ];
  
  // If any explicit command pattern matches, prioritize these
  for (const pattern of commandPatterns) {
    if (pattern.test(text)) {
      console.log("Detected explicit contact lookup command");
      return true;
    }
  }
  
  // Then check for natural language patterns
  const naturalPatterns = [
    /what is the (email|phone|contact|info|number) (for|of) (.*)/i,
    /tell me about (.*)/i,
    /find (contact|person|details for) (.*)/i,
    /who is (.*)/i,
    /lookup (.*)/i,
    /search for (.*)/i,
    /get (info|details|contact) (for|about) (.*)/i,
    /contact (details|info) for (.*)/i,
    /find email for (.*)/i,
    /how (can i|do i|to) contact (.*)/i
  ];
  
  const isNaturalRequest = naturalPatterns.some(pattern => pattern.test(text));
  if (isNaturalRequest) {
    console.log("Detected natural language contact lookup request");
  }
  
  return isNaturalRequest;
}

// Extract name from the request
function extractNameFromRequest(text) {
  // First check for command syntax
  const commandPatterns = [
    /^\/contact\s+(.+)/i,
    /^\/lookup\s+(.+)/i, 
    /^\/find\s+(.+)/i,
    /^contact lookup[:\s]+(.+)/i,
    /^lookup contact[:\s]+(.+)/i,
    /^crm lookup[:\s]+(.+)/i,
    /^db lookup[:\s]+(.+)/i
  ];
  
  // Check command patterns first
  for (const pattern of commandPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      console.log(`Extracted name from command syntax: "${name}"`);
      return name;
    }
  }
  
  // Then check natural language patterns
  const naturalPatterns = [
    /what is the (email|phone|contact|info|number) (for|of) (.*)/i,
    /tell me about (.*)/i,
    /find (contact|person|details for) (.*)/i,
    /who is (.*)/i,
    /lookup (.*)/i,
    /search for (.*)/i,
    /get (info|details|contact) (for|about) (.*)/i,
    /contact (details|info) for (.*)/i,
    /find email for (.*)/i,
    /how (can i|do i|to) contact (.*)/i
  ];
  
  for (const pattern of naturalPatterns) {
    const match = text.match(pattern);
    if (match) {
      // The last capture group contains the name
      const name = match[match.length - 1].trim();
      console.log(`Extracted name from natural language: "${name}"`);
      return name;
    }
  }
  
  console.log("Could not extract name from request");
  return null;
}

// Function to format contact data for display in Slack
function formatContactForDisplay(contact) {
  let text = `*${contact.first_name || ''} ${contact.last_name || ''}*\n\n`;
  
  if (contact.job_title) text += `*Job Title:* ${contact.job_title}\n`;
  if (contact.email) text += `*Email:* ${contact.email}\n`;
  if (contact.email2) text += `*Alt Email:* ${contact.email2}\n`;
  if (contact.mobile) text += `*Phone:* ${contact.mobile}\n`;
  if (contact.mobile2) text += `*Alt Phone:* ${contact.mobile2}\n`;
  if (contact.linkedin) text += `*LinkedIn:* ${contact.linkedin}\n`;
  
  // Format dates nicely
  if (contact.last_interaction) {
    try {
      const lastInteractionDate = new Date(contact.last_interaction);
      text += `*Last Interaction:* ${lastInteractionDate.toDateString()}\n`;
    } catch (e) {
      text += `*Last Interaction:* ${contact.last_interaction}\n`;
    }
  }
  
  if (contact.next_interaction_due_at) {
    try {
      const nextInteractionDate = new Date(contact.next_interaction_due_at);
      text += `*Next Interaction Due:* ${nextInteractionDate.toDateString()}\n`;
    } catch (e) {
      text += `*Next Interaction Due:* ${contact.next_interaction_due_at}\n`;
    }
  }
  
  if (contact.birthday) {
    try {
      const birthdayDate = new Date(contact.birthday);
      text += `*Birthday:* ${birthdayDate.toDateString()}\n`;
    } catch (e) {
      text += `*Birthday:* ${contact.birthday}\n`;
    }
  }
  
  // Add notes and about sections if available
  if (contact.about_the_contact) {
    text += `\n*About:*\n${contact.about_the_contact}\n`;
  }
  
  if (contact.note) {
    text += `\n*Notes:*\n${contact.note}\n`;
  }
  
  return text;
}

// Function to call the contact-lookup Netlify function
async function lookupContact(name, baseUrl = '') {
  try {
    // Use relative or absolute URL
    const url = baseUrl ? 
      `${baseUrl}/.netlify/functions/claude-supabase-contact-lookup` : 
      '/.netlify/functions/claude-supabase-contact-lookup';
    
    // Call our Netlify function
    console.log(`Calling contact lookup at ${url} for name "${name}"`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return data.contacts;
  } catch (error) {
    console.error('Error looking up contact:', error);
    return null;
  }
}

module.exports = {
  isContactLookupRequest,
  extractNameFromRequest,
  formatContactForDisplay,
  lookupContact,
};