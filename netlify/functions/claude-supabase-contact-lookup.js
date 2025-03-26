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
      // Handle full name or partial name searches
      const nameParts = name.trim().split(/\s+/);
      
      if (nameParts.length > 1) {
        // Full name provided (first and last)
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        console.log(`Searching for name: first="${firstName}", last="${lastName}"`);
        
        // Multi-tier search strategy
        // 1. Try exact match first (strict)
        const exactQuery = supabase
          .from('contacts')
          .select(`
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
          `)
          .neq('contact_category', 'Skip')
          .eq('first_name', firstName) // Exact match using =
          .eq('last_name', lastName)   // Exact match using =
          .order('last_interaction', { ascending: false });
          
        const { data: exactMatches, error: exactError } = await exactQuery;
        
        if (!exactError && exactMatches && exactMatches.length > 0) {
          console.log(`Found ${exactMatches.length} exact matches`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: isSlashCommand 
              ? JSON.stringify({
                  "response_type": "in_channel",
                  "text": formatContactsForSlack(exactMatches, name)
                })
              : JSON.stringify({ contacts: exactMatches }),
          };
        }
        
        console.log("No exact matches, trying case-insensitive exact match");
        
        // 2. Try case-insensitive exact match
        const ciExactQuery = supabase
          .from('contacts')
          .select(`
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
          `)
          .neq('contact_category', 'Skip')
          .ilike('first_name', `^${firstName}$`)  // Case-insensitive exact match 
          .ilike('last_name', `^${lastName}$`)    // Case-insensitive exact match
          .order('last_interaction', { ascending: false });
          
        const { data: ciExactMatches, error: ciExactError } = await ciExactQuery;
        
        if (!ciExactError && ciExactMatches && ciExactMatches.length > 0) {
          console.log(`Found ${ciExactMatches.length} case-insensitive exact matches`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: isSlashCommand 
              ? JSON.stringify({
                  "response_type": "in_channel",
                  "text": formatContactsForSlack(ciExactMatches, name)
                })
              : JSON.stringify({ contacts: ciExactMatches }),
          };
        }
        
        console.log("No case-insensitive exact matches, trying starts-with match");
        
        // 3. Try starts-with match (less strict)
        const startsWithQuery = supabase
          .from('contacts')
          .select(`
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
          `)
          .neq('contact_category', 'Skip')
          .ilike('first_name', `${firstName}%`)  // First name starts with
          .ilike('last_name', `${lastName}%`)    // Last name starts with
          .order('last_interaction', { ascending: false });
          
        const { data: startsWithMatches, error: startsWithError } = await startsWithQuery;
        
        if (!startsWithError && startsWithMatches && startsWithMatches.length > 0) {
          console.log(`Found ${startsWithMatches.length} starts-with matches`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: isSlashCommand 
              ? JSON.stringify({
                  "response_type": "in_channel",
                  "text": formatContactsForSlack(startsWithMatches, name)
                })
              : JSON.stringify({ contacts: startsWithMatches }),
          };
        }
        
        console.log("No starts-with matches, trying fuzzy search");
        
        // 4. Finally, try a fuzzy contains search (most flexible)
        // But limit to top matches only
        query = supabase
          .from('contacts')
          .select(`
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
          `)
          .neq('contact_category', 'Skip')
          .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`)
          .order('last_interaction', { ascending: false })
          .limit(3);  // Limit to top 3 most relevant matches
      } else {
        // Single name component - check both first and last name
        // But make the search stricter - start with starts with match
        
        // First try starts-with match for better results
        console.log(`Trying prefix match for "${name}"`);
        const prefixQuery = supabase
          .from('contacts')
          .select(`
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
          `)
          .neq('contact_category', 'Skip')
          .or(`first_name.ilike.${name}%,last_name.ilike.${name}%`)
          .order('last_interaction', { ascending: false });
          
        const { data: prefixMatches, error: prefixError } = await prefixQuery;
        
        if (!prefixError && prefixMatches && prefixMatches.length > 0) {
          console.log(`Found ${prefixMatches.length} prefix matches`);
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: isSlashCommand 
              ? JSON.stringify({
                  "response_type": "in_channel",
                  "text": formatContactsForSlack(prefixMatches, name)
                })
              : JSON.stringify({ contacts: prefixMatches }),
          };
        }
        
        // If no prefix matches, fall back to contains search
        console.log("No prefix matches, falling back to contains search");
        query = supabase
          .from('contacts')
          .select(`
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
          `)
          .neq('contact_category', 'Skip')
          .or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`)
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
      // Format response for Slack slash command
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "response_type": "in_channel",  // "ephemeral" to only show to the user
          "text": formatContactsForSlack(data, name)
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