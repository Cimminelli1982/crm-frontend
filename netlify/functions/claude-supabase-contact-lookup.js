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
        last_modified,
        contact_companies (
          id,
          contact_id,
          company_id,
          is_primary,
          companies (
            id,
            name
          )
        )
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
      // Simple search logic: Split into words and handle differently based on word count
      const nameParts = name.trim().split(/\s+/);
      
      // Select query with company relationships
      const baseSelect = `
        *,
        contact_companies (
          id,
          contact_id,
          company_id,
          is_primary,
          companies (
            id,
            name
          )
        )
      `;
      
      console.log(`Search with ${nameParts.length} terms: "${name}"`);
      
      if (nameParts.length === 1) {
        // Single term - search in both first_name and last_name
        const searchTerm = nameParts[0];
        console.log(`Simple search for "${searchTerm}" in first or last name`);
        
        query = supabase
          .from('contacts')
          .select(baseSelect)
          .neq('contact_category', 'Skip')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .order('last_interaction', { ascending: false });
      } else {
        // Multiple terms - first term as first_name, remaining terms as last_name
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        console.log(`Search for first_name containing "${firstName}" and last_name containing "${lastName}"`);
        
        query = supabase
          .from('contacts')
          .select(baseSelect)
          .neq('contact_category', 'Skip')
          .ilike('first_name', `%${firstName}%`)
          .ilike('last_name', `%${lastName}%`)
          .order('last_interaction', { ascending: false });
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
    
    // Helper function to create CRM button blocks for a contact
    function createCrmButtonBlocks(contacts) {
      if (!contacts || contacts.length === 0) {
        return [];
      }
      
      const blocks = [];
      
      // Add a divider before buttons
      blocks.push({
        "type": "divider"
      });
      
      // Add a section with CRM buttons
      const buttons = contacts.slice(0, 5).map(contact => {
        const buttonText = contact.first_name && contact.last_name 
          ? `${contact.first_name} ${contact.last_name}` 
          : (contact.first_name || contact.last_name || 'Contact');
          
        return {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": `Open ${buttonText} in CRM`,
            "emoji": true
          },
          // This link opens the contact in the CRM frontend
          "url": `https://crm-frontend.netlify.app/contacts?id=${contact.id}`,
          "action_id": `open_crm_${contact.id}`
        };
      });
      
      // Create a section block with the buttons
      blocks.push({
        "type": "actions",
        "elements": buttons
      });
      
      return blocks;
    }
    
    // Helper function to format contacts for Slack
    function formatContactsForSlack(contacts, searchTerm) {
      let responseText = '';
      
      if (contacts && contacts.length > 0) {
        if (contacts.length === 1) {
          // Single contact found
          const contact = contacts[0];
          responseText = `*Contact Information for ${contact.first_name || ''} ${contact.last_name || ''}*\n\n`;
          
          if (contact.email) responseText += `*Email:* ${contact.email}\n`;
          if (contact.email2) responseText += `*Alt Email:* ${contact.email2}\n`;
          if (contact.mobile) responseText += `*Phone:* ${contact.mobile}\n`;
          if (contact.mobile2) responseText += `*Alt Phone:* ${contact.mobile2}\n`;
          if (contact.job_title) responseText += `*Job Title:* ${contact.job_title}\n`;
          
          // Display company information
          if (contact.contact_companies && contact.contact_companies.length > 0) {
            // Find primary company first
            const primaryCompany = contact.contact_companies.find(cc => cc.is_primary);
            
            if (primaryCompany && primaryCompany.companies) {
              responseText += `*Primary Company:* ${primaryCompany.companies.name} (${primaryCompany.companies.id})\n`;
            }
            
            // List other companies if any
            const otherCompanies = contact.contact_companies
              .filter(cc => !cc.is_primary && cc.companies)
              .map(cc => cc.companies.name);
              
            if (otherCompanies.length > 0) {
              responseText += `*Other Companies:* ${otherCompanies.join(', ')}\n`;
            }
          }
          
          if (contact.linkedin) responseText += `*LinkedIn:* ${contact.linkedin || 'Not available'}\n`;
          if (contact.contact_category) responseText += `*Category:* ${contact.contact_category}\n`;
          
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
          responseText = `*Found ${contacts.length} contacts matching "${searchTerm}"*\n\n`;
          
          contacts.slice(0, 5).forEach((contact, index) => {
            responseText += `*${index + 1}. ${contact.first_name || ''} ${contact.last_name || ''}*\n`;
            if (contact.email) responseText += `Email: ${contact.email}\n`;
            if (contact.email2) responseText += `Alt Email: ${contact.email2}\n`;
            
            // Display company information
            if (contact.contact_companies && contact.contact_companies.length > 0) {
              // Find primary company first
              const primaryCompany = contact.contact_companies.find(cc => cc.is_primary);
              
              if (primaryCompany && primaryCompany.companies) {
                responseText += `Company: ${primaryCompany.companies.name}\n`;
              }
            }
            
            if (contact.linkedin) responseText += `LinkedIn: ${contact.linkedin || 'Not available'}\n`;
            if (contact.last_interaction) {
              try {
                const lastDate = new Date(contact.last_interaction);
                responseText += `Last Interaction: ${lastDate.toDateString()}\n`;
              } catch (e) {}
            }
            if (contact.job_title) responseText += `Job: ${contact.job_title}\n`;
            if (contact.contact_category) responseText += `Category: ${contact.contact_category}\n`;
            responseText += '\n';
          });
          
          if (contacts.length > 5) {
            responseText += `_...and ${contacts.length - 5} more contacts_\n`;
          }
          
          responseText += "Use `/findcontact [full name]` for a more specific search.";
        }
      } else {
        responseText = `No contacts found matching "${searchTerm}"`;
      }
      
      return responseText;
    }
  
    // Prepare response based on request type
    if (isSlashCommand) {
      // Format response for Slack slash command with blocks
      const textResponse = formatContactsForSlack(data, name);
      const blocks = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": textResponse
          }
        },
        ...createCrmButtonBlocks(data)
      ];
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "response_type": "in_channel",  // "ephemeral" to only show to the user
          "blocks": blocks
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