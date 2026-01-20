import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const apolloApiKey = Deno.env.get('APOLLO_API_KEY');
const resendApiKey = Deno.env.get('RESEND_API_KEYValue');
const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL') || 'simone@cimminelli.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Send notification email
async function sendNotificationEmail(dealData: any): Promise<void> {
  if (!resendApiKey) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Deal Submission <noreply@cimminelli.com>',
        to: notificationEmail,
        subject: `New Deal: ${dealData.companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">New Deal Submission</h2>

            <h3 style="color: #475569; margin-top: 24px;">Contact</h3>
            <p><strong>Name:</strong> ${dealData.firstName} ${dealData.lastName}</p>
            <p><strong>Email:</strong> ${dealData.email}</p>
            ${dealData.mobile ? `<p><strong>WhatsApp:</strong> ${dealData.mobile}</p>` : ''}
            ${dealData.linkedin ? `<p><strong>LinkedIn:</strong> ${dealData.linkedin}</p>` : ''}
            ${dealData.jobRole ? `<p><strong>Role:</strong> ${dealData.jobRole}</p>` : ''}

            <h3 style="color: #475569; margin-top: 24px;">Company</h3>
            <p><strong>Name:</strong> ${dealData.companyName}</p>
            <p><strong>Website:</strong> ${dealData.companyWebsite}</p>
            ${dealData.companyLinkedin ? `<p><strong>LinkedIn:</strong> ${dealData.companyLinkedin}</p>` : ''}

            <h3 style="color: #475569; margin-top: 24px;">Deal</h3>
            <p><strong>Name:</strong> ${dealData.dealName}</p>
            ${dealData.investmentAmount ? `<p><strong>Amount:</strong> ${dealData.investmentAmount} ${dealData.dealCurrency}</p>` : ''}
            ${dealData.dealDescription ? `<p><strong>Pitch:</strong> ${dealData.dealDescription}</p>` : ''}
            ${dealData.deckUrl ? `<p><strong>Deck URL:</strong> <a href="${dealData.deckUrl}">${dealData.deckUrl}</a></p>` : ''}

            <p style="margin-top: 24px; padding: 12px; background: #f1f5f9; border-radius: 8px;">
              <a href="https://crm.angelinvesting.it/new-crm/command-center" style="color: #3b82f6;">Open CRM →</a>
            </p>
          </div>
        `
      })
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Send confirmation email to founder
async function sendConfirmationEmail(email: string, firstName: string): Promise<void> {
  if (!resendApiKey) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Simone Cimminelli <simone@cimminelli.com>',
        to: email,
        subject: 'Thanks for your submission',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e293b;">Thank you, ${firstName}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              I've received your deal submission and will review it carefully.
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              You can expect to hear back from me within <strong>24-48 hours</strong>.
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              In the meantime, feel free to check out my newsletter where I share insights
              on angel investing and the European startup ecosystem:
            </p>
            <p style="margin: 24px 0;">
              <a href="https://angelinvesting.it"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 12px 24px; border-radius: 8px;
                        text-decoration: none; font-weight: 600;">
                Visit AngelInvesting.it →
              </a>
            </p>
            <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
              Best,<br>
              Simone
            </p>
          </div>
        `
      })
    });
  } catch (error) {
    console.error('Error sending confirmation:', error);
  }
}

// Call Apollo to enrich company data
async function enrichWithApollo(domain: string): Promise<any> {
  if (!apolloApiKey || !domain) return null;

  try {
    const response = await fetch('https://api.apollo.io/v1/organizations/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apolloApiKey,
        domain: domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      })
    });

    const data = await response.json();
    if (data.organization) {
      return {
        description: data.organization.short_description || data.organization.long_description,
        linkedin: data.organization.linkedin_url,
        industries: data.organization.industries || [],
        logo_url: data.organization.logo_url
      };
    }
  } catch (error) {
    console.error('Apollo enrichment error:', error);
  }

  return null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Handle check-company endpoint
    if (path === 'check-company' || url.pathname.includes('check-company')) {
      const { domain, name, linkedin } = await req.json();

      let companyId = null;
      let company = null;
      let companyDomain = null;
      let apolloData = null;

      // Check by domain first
      if (domain) {
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const { data: domainMatch } = await supabase
          .from('company_domains')
          .select('company_id, domain, companies(*)')
          .eq('domain', cleanDomain)
          .single();

        if (domainMatch) {
          companyId = domainMatch.company_id;
          company = domainMatch.companies;
          companyDomain = domainMatch.domain;
        }
      }

      // Check by name if no domain match
      if (!companyId && name) {
        const { data: nameMatch } = await supabase
          .from('companies')
          .select('*')
          .ilike('name', name)
          .single();

        if (nameMatch) {
          companyId = nameMatch.company_id;
          company = nameMatch;

          // Fetch primary domain for this company
          const { data: primaryDomain } = await supabase
            .from('company_domains')
            .select('domain')
            .eq('company_id', companyId)
            .eq('is_primary', true)
            .single();

          if (primaryDomain) {
            companyDomain = primaryDomain.domain;
          } else {
            // Fallback to any domain
            const { data: anyDomain } = await supabase
              .from('company_domains')
              .select('domain')
              .eq('company_id', companyId)
              .limit(1)
              .single();
            if (anyDomain) companyDomain = anyDomain.domain;
          }
        }
      }

      // Try Apollo enrichment
      if (domain) {
        apolloData = await enrichWithApollo(domain);
      }

      // Fetch cities and tags if company found
      let companyCities: any[] = [];
      let companyTags: any[] = [];

      if (companyId) {
        // Fetch cities
        const { data: citiesData } = await supabase
          .from('company_cities')
          .select('city_id, cities(city_id, name, country)')
          .eq('company_id', companyId);

        if (citiesData) {
          companyCities = citiesData.map((c: any) => c.cities).filter(Boolean);
        }

        // Fetch tags
        const { data: tagsData } = await supabase
          .from('company_tags')
          .select('tag_id, tags(tag_id, name)')
          .eq('company_id', companyId);

        if (tagsData) {
          companyTags = tagsData.map((t: any) => t.tags).filter(Boolean);
        }
      }

      return new Response(
        JSON.stringify({
          exists: !!companyId,
          company_id: companyId,
          company: company ? { ...company, website: companyDomain ? `https://${companyDomain}` : null } : null,
          apollo_data: apolloData,
          cities: companyCities,
          tags: companyTags
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle main submit endpoint
    if (path === 'submit' || url.pathname.includes('submit')) {
      // Parse form data (for file upload)
      const contentType = req.headers.get('content-type') || '';
      let formData: any = {};
      let deckFile: File | null = null;

      if (contentType.includes('multipart/form-data')) {
        const data = await req.formData();
        for (const [key, value] of data.entries()) {
          if (key === 'deckFile' && value instanceof File) {
            deckFile = value;
          } else {
            formData[key] = value;
          }
        }
      } else {
        formData = await req.json();
      }

      const {
        email,
        existingContactId,
        firstName,
        lastName,
        mobile,
        linkedin,
        jobRole,
        cityId,
        companyName,
        companyWebsite,
        companyLinkedin,
        companyDescription,
        existingCompanyId,
        companyCityIds,
        companyTagIds,
        dealName,
        investmentAmount,
        dealCurrency,
        dealDescription,
        deckUrl,
        subscribeNewsletter
      } = formData;

      // Validate required fields
      if (!email || !firstName || !lastName || !companyName || !companyWebsite || !dealName) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let contactId = existingContactId || null;
      let companyId = existingCompanyId || null;

      // === STEP 1: Create or update contact ===
      if (contactId) {
        // Update existing contact
        await supabase
          .from('contacts')
          .update({
            first_name: firstName,
            last_name: lastName,
            linkedin: linkedin || undefined,
            job_role: jobRole || undefined,
            last_modified_by: 'Edge Function',
            last_modified_at: new Date().toISOString()
          })
          .eq('contact_id', contactId);
      } else {
        // Create new contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            linkedin: linkedin || null,
            job_role: jobRole || null,
            category: 'Founder',
            created_by: 'Edge Function'
          })
          .select('contact_id')
          .single();

        if (contactError || !newContact) {
          console.error('Error creating contact:', contactError);
          return new Response(
            JSON.stringify({ error: 'Failed to create contact' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        contactId = newContact.contact_id;

        // Add email
        await supabase
          .from('contact_emails')
          .insert({
            contact_id: contactId,
            email: email.toLowerCase(),
            type: 'work',
            is_primary: true
          });
      }

      // Add/update mobile
      if (mobile && contactId) {
        // Check if mobile exists
        const { data: existingMobile } = await supabase
          .from('contact_mobiles')
          .select('mobile_id')
          .eq('contact_id', contactId)
          .eq('mobile', mobile)
          .single();

        if (!existingMobile) {
          await supabase
            .from('contact_mobiles')
            .insert({
              contact_id: contactId,
              mobile: mobile,
              type: 'WhatsApp',
              is_primary: true
            });
        }
      }

      // Add city
      if (cityId && contactId) {
        const { data: existingCity } = await supabase
          .from('contact_cities')
          .select('entry_id')
          .eq('contact_id', contactId)
          .eq('city_id', cityId)
          .single();

        if (!existingCity) {
          await supabase
            .from('contact_cities')
            .insert({
              contact_id: contactId,
              city_id: cityId
            });
        }
      }

      // === STEP 2: Create or get company ===
      if (!companyId) {
        // Check by domain
        const cleanDomain = companyWebsite
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0];

        const { data: domainMatch } = await supabase
          .from('company_domains')
          .select('company_id')
          .eq('domain', cleanDomain)
          .single();

        if (domainMatch) {
          companyId = domainMatch.company_id;
        } else {
          // Create new company
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyName,
              linkedin: companyLinkedin || null,
              description: companyDescription || null,
              category: 'Startup',
              created_by: 'Edge Function'
            })
            .select('company_id')
            .single();

          if (companyError || !newCompany) {
            console.error('Error creating company:', companyError);
            return new Response(
              JSON.stringify({ error: 'Failed to create company' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          companyId = newCompany.company_id;

          // Add domain
          await supabase
            .from('company_domains')
            .insert({
              company_id: companyId,
              domain: cleanDomain,
              is_primary: true
            });
        }
      }

      // Link contact to company
      const { data: existingLink } = await supabase
        .from('contact_companies')
        .select('contact_companies_id')
        .eq('contact_id', contactId)
        .eq('company_id', companyId)
        .single();

      if (!existingLink) {
        await supabase
          .from('contact_companies')
          .insert({
            contact_id: contactId,
            company_id: companyId,
            relationship: 'founder',
            is_primary: true
          });
      }

      // Add company cities
      if (companyCityIds && companyId) {
        const cityIds = typeof companyCityIds === 'string' ? JSON.parse(companyCityIds) : companyCityIds;
        for (const cId of cityIds) {
          const { data: existingCity } = await supabase
            .from('company_cities')
            .select('entry_id')
            .eq('company_id', companyId)
            .eq('city_id', cId)
            .single();

          if (!existingCity) {
            await supabase
              .from('company_cities')
              .insert({
                company_id: companyId,
                city_id: cId
              });
          }
        }
      }

      // Add company tags
      if (companyTagIds && companyId) {
        const tagIds = typeof companyTagIds === 'string' ? JSON.parse(companyTagIds) : companyTagIds;
        for (const tId of tagIds) {
          const { data: existingTag } = await supabase
            .from('company_tags')
            .select('entry_id')
            .eq('company_id', companyId)
            .eq('tag_id', tId)
            .single();

          if (!existingTag) {
            await supabase
              .from('company_tags')
              .insert({
                company_id: companyId,
                tag_id: tId
              });
          }
        }
      }

      // === STEP 3: Create deal ===
      const { data: newDeal, error: dealError } = await supabase
        .from('deals')
        .insert({
          opportunity: dealName,
          stage: 'Lead',
          category: 'Startup',
          source_category: 'Cold Contacting',
          total_investment: investmentAmount ? parseFloat(investmentAmount) : null,
          deal_currency: dealCurrency || 'EUR',
          description: dealDescription || null,
          proposed_at: new Date().toISOString(),
          created_by: 'Edge Function'
        })
        .select('deal_id')
        .single();

      if (dealError || !newDeal) {
        console.error('Error creating deal:', dealError);
        return new Response(
          JSON.stringify({ error: 'Failed to create deal' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const dealId = newDeal.deal_id;

      // Link contact to deal
      await supabase
        .from('deals_contacts')
        .insert({
          deal_id: dealId,
          contact_id: contactId,
          relationship: 'proposer'
        });

      // === STEP 4: Handle deck upload or URL ===
      if (deckFile && deckFile.size > 0) {
        // Upload to Supabase Storage
        const fileName = `deals/${dealId}/${Date.now()}_${deckFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, deckFile, {
            contentType: deckFile.type
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(fileName);

          // Create attachment record
          const { data: attachment } = await supabase
            .from('attachments')
            .insert({
              file_name: deckFile.name,
              file_url: publicUrl,
              file_type: deckFile.type,
              file_size: deckFile.size,
              description: 'Pitch Deck',
              created_by: 'Edge Function'
            })
            .select('attachment_id')
            .single();

          if (attachment) {
            await supabase
              .from('deal_attachments')
              .insert({
                deal_id: dealId,
                attachment_id: attachment.attachment_id
              });
          }
        }
      } else if (deckUrl) {
        // Store URL as attachment
        const { data: attachment } = await supabase
          .from('attachments')
          .insert({
            file_name: 'Pitch Deck (URL)',
            file_url: deckUrl,
            file_type: 'url',
            description: 'Pitch Deck Link',
            created_by: 'Edge Function'
          })
          .select('attachment_id')
          .single();

        if (attachment) {
          await supabase
            .from('deal_attachments')
            .insert({
              deal_id: dealId,
              attachment_id: attachment.attachment_id
            });
        }
      }

      // === STEP 5: Newsletter subscription ===
      if (subscribeNewsletter === 'true' || subscribeNewsletter === true) {
        // Find AngelInvesting.it newsletter list
        const { data: newsletterList } = await supabase
          .from('email_lists')
          .select('list_id')
          .ilike('name', '%angelinvesting%')
          .single();

        if (newsletterList) {
          const { data: existingMember } = await supabase
            .from('email_list_members')
            .select('list_member_id')
            .eq('list_id', newsletterList.list_id)
            .eq('contact_id', contactId)
            .single();

          if (!existingMember) {
            await supabase
              .from('email_list_members')
              .insert({
                list_id: newsletterList.list_id,
                contact_id: contactId,
                is_active: true,
                added_by: 'Edge Function'
              });
          }
        }
      }

      // === STEP 6: Send emails ===
      await sendNotificationEmail({
        firstName,
        lastName,
        email,
        mobile,
        linkedin,
        jobRole,
        companyName,
        companyWebsite,
        companyLinkedin,
        dealName,
        investmentAmount,
        dealCurrency,
        dealDescription,
        deckUrl
      });

      await sendConfirmationEmail(email, firstName);

      return new Response(
        JSON.stringify({
          success: true,
          deal_id: dealId,
          contact_id: contactId,
          company_id: companyId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
