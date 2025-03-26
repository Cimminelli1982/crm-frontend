const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with project details
const supabaseUrl = 'https://efazuvegwxouysfcgwja.supabase.co';
// Use service key for admin privileges or anon key as fallback
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmYXp1dmVnd3hvdXlzZmNnd2phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5Mjk1MjcsImV4cCI6MjA1MTUwNTUyN30.1G5n0CyQEHGeE1XaJld_PbpstUFd0Imaao6N8MUmfvE';

console.log(`Initializing Supabase client with URL: ${supabaseUrl}`);
console.log(`Using key type: ${process.env.SUPABASE_SERVICE_KEY ? 'service key' : 'anon key'}`);

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  try {
    console.log("Contact lookup function invoked");
    console.log("Headers:", JSON.stringify(event.headers));
    
    // Determine if this is a slash command or direct API call
    const isSlashCommand = event.headers['content-type'] === 'application/x-www-form-urlencoded';
    let name, email, id;
    
    if (isSlashCommand) {
      // Parse the URL-encoded form data from Slack slash command
      const params = new URLSearchParams(event.body);
      const text = params.get('text') || '';
      console.log(`Slash command received with text: ${text}`);
      
      // The text after the slash command becomes the name to search
      name = text.trim();
      
      // For debugging
      console.log("Slash command parameters:", Object.fromEntries(params));
    } else {
      // Regular JSON API call (from our existing function)
      const payload = JSON.parse(event.body || '{}');
      name = payload.name;
      email = payload.email;
      id = payload.id;
    }
    
    console.log(`Search parameters: name=${name}, email=${email}, id=${id}`);
    
    // Start building the query
    let query = supabase
      .from('contacts')
      .select(`
        id, 
        first_name, 
        last_name, 
        email, 
        email2,
        email3,
        mobile,
        mobile2,
        job_title,
        company_id,
        linkedin,
        last_interaction,
        next_interaction_due_at,
        about_the_contact,
        note,
        contact_category,
        birthday,
        last_modified
      `)
      .neq('contact_category', 'Skip'); // Apply default filter
      
    // Apply search criteria
    if (id) {
      query = query.eq('id', id);
      console.log(`Searching by ID: ${id}`);
    } else if (email) {
      // Check all email fields
      query = query.or(`email.ilike.%${email}%,email2.ilike.%${email}%,email3.ilike.%${email}%`);
      console.log(`Searching by email: ${email}`);
    } else if (name) {
      // Handle full name or partial name searches
      const nameParts = name.trim().split(/\s+/);
      
      if (nameParts.length > 1) {
        // Likely first and last name provided
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        // Try various name combinations
        query = query.or(
          `first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`,
          `first_name.ilike.%${lastName}%,last_name.ilike.%${firstName}%` // Handle reversed order
        );
        console.log(`Searching by full name: first="${firstName}", last="${lastName}"`);
      } else {
        // Single name component - check both first and last name
        query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
        console.log(`Searching by partial name: "${name}"`);
      }
    } else {
      // No search parameters provided
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing search parameters' }),
      };
    }
    
    // Sort by last interaction date descending (default sort)
    query = query.order('last_interaction', { ascending: false });
    
    // Execute the query
    console.log("Executing Supabase query");
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database query failed', details: error.message }),
      };
    }
    
    console.log(`Query returned ${data ? data.length : 0} results`);
    
    // Prepare response based on request type
    if (isSlashCommand) {
      // Format response for Slack slash command
      let responseText = '';
      
      if (data && data.length > 0) {
        if (data.length === 1) {
          // Single contact found
          const contact = data[0];
          responseText = `*Contact Information for ${contact.first_name || ''} ${contact.last_name || ''}*\n\n`;
          
          if (contact.email) responseText += `*Email:* ${contact.email}\n`;
          if (contact.email2) responseText += `*Alt Email:* ${contact.email2}\n`;
          if (contact.mobile) responseText += `*Phone:* ${contact.mobile}\n`;
          if (contact.mobile2) responseText += `*Alt Phone:* ${contact.mobile2}\n`;
          if (contact.job_title) responseText += `*Job Title:* ${contact.job_title}\n`;
          if (contact.linkedin) responseText += `*LinkedIn:* ${contact.linkedin}\n`;
          
          // Format dates
          if (contact.last_interaction) {
            try {
              const lastDate = new Date(contact.last_interaction);
              responseText += `*Last Interaction:* ${lastDate.toDateString()}\n`;
            } catch (e) {
              responseText += `*Last Interaction:* ${contact.last_interaction}\n`;
            }
          }
          
          if (contact.about_the_contact) {
            responseText += `\n*About:*\n${contact.about_the_contact}\n`;
          }
          
          if (contact.note) {
            responseText += `\n*Notes:*\n${contact.note}\n`;
          }
        } else {
          // Multiple contacts found
          responseText = `*Found ${data.length} contacts matching "${name}"*\n\n`;
          
          data.slice(0, 5).forEach((contact, index) => {
            responseText += `*${index + 1}. ${contact.first_name || ''} ${contact.last_name || ''}*\n`;
            if (contact.email) responseText += `Email: ${contact.email}\n`;
            if (contact.job_title) responseText += `Job: ${contact.job_title}\n`;
            responseText += '\n';
          });
          
          if (data.length > 5) {
            responseText += `_...and ${data.length - 5} more contacts_\n`;
          }
          
          responseText += "Use `/lookup [full name]` for a more specific search.";
        }
      } else {
        responseText = `No contacts found matching "${name}"`;
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "response_type": "in_channel",  // "ephemeral" to only show to the user
          "text": responseText
        })
      };
    } else {
      // Return regular JSON response for API calls
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: data }),
      };
    }
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};