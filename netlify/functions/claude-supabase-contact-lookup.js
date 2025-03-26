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
    
    // Parse the query parameters
    const { name, email, id } = JSON.parse(event.body || '{}');
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
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: data }),
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};