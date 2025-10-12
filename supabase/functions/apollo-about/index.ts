// Supabase Edge Function for fetching LinkedIn About section from Apollo
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const APOLLO_API_URL = 'https://api.apollo.io/v1/people/enrich';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contactId, linkedinUrl } = await req.json();

    if (!contactId || !linkedinUrl) {
      return new Response(
        JSON.stringify({ error: 'Contact ID and LinkedIn URL are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Apollo API key from environment
    const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
    if (!apolloApiKey) {
      return new Response(
        JSON.stringify({ error: 'Apollo API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Fetch contact to verify it exists
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('contact_id')
      .eq('contact_id', contactId)
      .single();

    if (contactError || !contact) {
      return new Response(
        JSON.stringify({ error: 'Contact not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Call Apollo API with LinkedIn URL to get profile data
    console.log('Calling Apollo API for About section with LinkedIn URL:', linkedinUrl);

    const apolloResponse = await fetch(APOLLO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apolloApiKey,
        linkedin_url: linkedinUrl
      }),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      console.error('Apollo API error:', apolloResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Apollo API error: ${apolloResponse.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const apolloData = await apolloResponse.json();
    console.log('Full Apollo response:', JSON.stringify(apolloData, null, 2));

    // Log all available fields to find where About section is stored
    if (apolloData?.person) {
      console.log('Available person fields:', Object.keys(apolloData.person));

      // Check for any field that might contain the About section
      const possibleAboutFields = [
        'bio', 'about', 'summary', 'description', 'headline',
        'linkedin_bio', 'linkedin_summary', 'linkedin_about'
      ];

      for (const field of possibleAboutFields) {
        if (apolloData.person[field]) {
          console.log(`Found ${field}:`, apolloData.person[field].substring(0, 100) + '...');
        }
      }
    }

    // Build a professional narrative description from Apollo data
    let descriptionParts = [];

    // Add headline as the main professional identity
    if (apolloData?.person?.headline) {
      descriptionParts.push(`${apolloData.person.headline}`);
      descriptionParts.push(''); // Add blank line for spacing
    }

    // Create a professional summary paragraph
    let summaryParts = [];

    // Current role with seniority context
    if (apolloData?.person?.title && apolloData?.person?.organization?.name) {
      let roleDescription = `Currently serving as ${apolloData.person.title} at ${apolloData.person.organization.name}`;

      // Add seniority context if available
      if (apolloData?.person?.seniority) {
        const seniorityMap = {
          'c_suite': 'C-Suite executive',
          'founder': 'Founder',
          'partner': 'Partner-level',
          'vp': 'Vice President level',
          'director': 'Director level',
          'manager': 'Management',
          'senior': 'Senior professional',
          'entry': 'Early career professional'
        };
        const seniorityText = seniorityMap[apolloData.person.seniority.toLowerCase()] || apolloData.person.seniority;
        roleDescription = `${seniorityText} currently serving as ${apolloData.person.title} at ${apolloData.person.organization.name}`;
      }

      summaryParts.push(roleDescription);
    } else if (apolloData?.person?.title) {
      summaryParts.push(`Currently ${apolloData.person.title}`);
    }

    // Add location with better formatting
    if (apolloData?.person?.city || apolloData?.person?.country) {
      const locationParts = [];
      if (apolloData.person.city) locationParts.push(apolloData.person.city);
      if (apolloData.person.state && apolloData.person.country === 'United States') {
        locationParts.push(apolloData.person.state);
      }
      if (apolloData.person.country) locationParts.push(apolloData.person.country);

      if (locationParts.length > 0) {
        summaryParts.push(`based in ${locationParts.join(', ')}`);
      }
    }

    // Add the summary paragraph if we have content
    if (summaryParts.length > 0) {
      descriptionParts.push(summaryParts.join(', ') + '.');
      descriptionParts.push(''); // Add blank line
    }

    // Professional background section
    if (apolloData?.person?.employment_history && apolloData.person.employment_history.length > 0) {
      descriptionParts.push('Professional Background:');

      const recentJobs = apolloData.person.employment_history.slice(0, 4);
      recentJobs.forEach((job, index) => {
        if (!job.title && !job.organization_name) return;

        let jobText = '';

        // Format the job entry
        if (job.title && job.organization_name) {
          jobText = `• ${job.title} at ${job.organization_name}`;
        } else if (job.title) {
          jobText = `• ${job.title}`;
        } else if (job.organization_name) {
          jobText = `• ${job.organization_name}`;
        }

        // Add date range if available
        if (job.start_date || job.end_date) {
          const startDate = job.start_date ? new Date(job.start_date) : null;
          const endDate = job.end_date ? new Date(job.end_date) : null;

          if (startDate || endDate) {
            const startYear = startDate ? startDate.getFullYear() : '';
            const endYear = endDate ? endDate.getFullYear() : 'Present';

            // Check if it's current role
            if (!job.end_date || endDate > new Date()) {
              jobText += ` (${startYear}-Present)`;
            } else {
              jobText += ` (${startYear}-${endYear})`;
            }
          }
        }

        if (jobText) descriptionParts.push(jobText);
      });
    }

    // Add functional expertise if available
    if ((apolloData?.person?.functions && apolloData.person.functions.length > 0) ||
        (apolloData?.person?.departments && apolloData.person.departments.length > 0)) {

      descriptionParts.push(''); // Add blank line

      let expertise = [];

      if (apolloData.person.departments && apolloData.person.departments.length > 0) {
        const deptMap = {
          'c_suite': 'C-Suite Leadership',
          'engineering': 'Engineering',
          'sales': 'Sales',
          'marketing': 'Marketing',
          'product': 'Product Management',
          'finance': 'Finance',
          'hr': 'Human Resources',
          'operations': 'Operations'
        };

        const mappedDepts = apolloData.person.departments.map(d =>
          deptMap[d.toLowerCase()] || d.charAt(0).toUpperCase() + d.slice(1)
        );
        expertise.push(...mappedDepts);
      }

      if (apolloData.person.functions && apolloData.person.functions.length > 0) {
        const funcMap = {
          'entrepreneurship': 'Entrepreneurship',
          'leadership': 'Leadership',
          'strategy': 'Strategy',
          'business_development': 'Business Development',
          'product_management': 'Product Management',
          'engineering': 'Engineering',
          'sales': 'Sales',
          'marketing': 'Marketing'
        };

        const mappedFuncs = apolloData.person.functions.map(f =>
          funcMap[f.toLowerCase()] || f.charAt(0).toUpperCase() + f.slice(1)
        );

        // Avoid duplicates
        mappedFuncs.forEach(f => {
          if (!expertise.includes(f)) {
            expertise.push(f);
          }
        });
      }

      if (expertise.length > 0) {
        descriptionParts.push(`Areas of Expertise: ${expertise.join(', ')}`);
      }
    }

    const aboutText = descriptionParts.join('\n');

    if (aboutText) {
      // Update contact description with compiled Apollo data
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          description: aboutText,
          last_modified_at: new Date().toISOString()
        })
        .eq('contact_id', contactId);

      if (updateError) {
        console.error('Error updating contact description:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update contact' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          aboutText,
          message: `Description updated with Apollo profile data`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No profile data found in Apollo'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in apollo-about function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});