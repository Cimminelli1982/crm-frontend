import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';

const ContactEnrichment = () => {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [cities, setCities] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // External data
  const [hubspotData, setHubspotData] = useState(null);
  const [apolloData, setApolloData] = useState(null);
  const [airtableData, setAirtableData] = useState(null);
  
  useEffect(() => {
    if (id) {
      fetchContactData(id);
    }
  }, [id]);
  
  const fetchContactData = async (contactId) => {
    setLoading(true);
    try {
      // Fetch contact basic information
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
        
      if (contactError) throw contactError;
      setContact(contactData);
      
      // Fetch associated companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('contact_companies')
        .select('companies(id, name, website, description)')
        .eq('contact_id', contactId);
        
      if (companiesError) throw companiesError;
      setCompanies(companiesData.map(item => item.companies));
      
      // Fetch associated cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('contact_cities')
        .select('cities(id, name)')
        .eq('contact_id', contactId);
        
      if (citiesError) throw citiesError;
      setCities(citiesData.map(item => item.cities));
      
      // Fetch associated tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('contact_tags')
        .select('tags(id, name)')
        .eq('contact_id', contactId);
        
      if (tagsError) throw tagsError;
      setTags(tagsData.map(item => item.tags));
      
    } catch (error) {
      console.error('Error fetching contact data:', error);
      setError('Failed to load contact data');
    } finally {
      setLoading(false);
    }
  };
  
  const enrichWithHubspot = async () => {
    try {
      if (!contact.email) {
        throw new Error('Contact has no email to search with');
      }
      
      // Diagnostic information object
      const diagnostics = {
        contactEmail: contact.email,
        apiTests: {}
      };
      
      // PicaOS API token
      const picaApiToken = 'api_iXVeaUbmdKfQZjBrLtgN7MuGRNYwPsWk';
      const headers = {
        'Authorization': `Bearer ${picaApiToken}`,
        'Content-Type': 'application/json'
      };
      
      // Direct HubSpot API calls via PicaOS
      try {
        // First get a list of contacts to test the connection
        const response = await axios.get('https://app.picaos.com/api/proxy/hubspot/crm/v3/objects/contacts', {
          headers,
          params: { limit: 5 }
        });
        
        console.log('HubSpot contacts response via Pica:', response.data);
        diagnostics.apiTests.contactsList = {
          status: 'success',
          count: response.data.results?.length || 0,
          sample: response.data.results?.[0] || null
        };
        
        // Only set this if we have contact data
        diagnostics.allContacts = response.data.results || [];
      } catch (contactsError) {
        console.error('HubSpot contacts endpoint error:', contactsError);
        diagnostics.apiTests.contactsList = {
          status: 'error',
          message: contactsError.message,
          code: contactsError.response?.status
        };
      }
      
      // Try to get companies list too
      try {
        const companiesResponse = await axios.get('https://app.picaos.com/api/proxy/hubspot/crm/v3/objects/companies', {
          headers,
          params: { limit: 5 }
        });
        
        console.log('HubSpot companies response via Pica:', companiesResponse.data);
        diagnostics.apiTests.companiesList = {
          status: 'success',
          count: companiesResponse.data.results?.length || 0,
          sample: companiesResponse.data.results?.[0] || null
        };
        
        // Only set this if we have companies data
        diagnostics.allCompanies = companiesResponse.data.results || [];
      } catch (companiesError) {
        console.error('HubSpot companies endpoint error:', companiesError);
        diagnostics.apiTests.companiesList = {
          status: 'error',
          message: companiesError.message,
          code: companiesError.response?.status
        };
      }
      
      // Now try to search for this specific contact
      try {
        const searchResponse = await axios.post('https://app.picaos.com/api/proxy/hubspot/crm/v3/objects/contacts/search', {
          filterGroups: [
            {
              filters: [
                {
                  value: contact.email,
                  propertyName: 'email',
                  operator: 'EQ'
                }
              ]
            }
          ],
          properties: [
            'email', 'firstname', 'lastname', 'jobtitle', 'company', 
            'phone', 'mobilephone', 'city', 'linkedin', 'website'
          ]
        }, { headers });
        
        diagnostics.apiTests.contactSearch = {
          status: 'success', 
          count: searchResponse.data.results?.length || 0
        };
        
        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
          setHubspotData({
            searchResults: searchResponse.data.results[0],
            diagnostics: diagnostics
          });
        } else {
          setHubspotData({ 
            error: 'No matching contact found in HubSpot',
            diagnostics: diagnostics
          });
        }
      } catch (searchError) {
        console.error('Error searching HubSpot:', searchError);
        diagnostics.apiTests.contactSearch = {
          status: 'error',
          message: searchError.message,
          code: searchError.response?.status,
          data: searchError.response?.data
        };
        
        setHubspotData({ 
          error: searchError.message || 'Failed to search in HubSpot',
          diagnostics: diagnostics
        });
      }
    } catch (error) {
      console.error('Error accessing HubSpot:', error);
      setHubspotData({ 
        error: error.message || 'Failed to access HubSpot API',
        diagnostics: {
          fatalError: error.message,
          response: error.response?.data
        }
      });
    }
  };
  
  const enrichWithApollo = async () => {
    try {
      // Use PicaOS API for Apollo enrichment
      console.log('Attempting to enrich contact using Apollo via PicaOS...');
      
      // PicaOS API token
      const picaApiToken = 'api_iXVeaUbmdKfQZjBrLtgN7MuGRNYwPsWk';
      const headers = {
        'Authorization': `Bearer ${picaApiToken}`,
        'Content-Type': 'application/json'
      };
      
      try {
        // Prepare Apollo request data
        const apolloRequestData = {
          api_key: 'api_NzVCaFdGMHbfDtJCw9gWZg', // Not a real key - need to request one
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email || contact.email2 || contact.email3 || null,
          phone: contact.mobile || contact.mobile2 || null,
        };
        
        // Call Apollo API via PicaOS
        const apolloResponse = await axios.post(
          'https://app.picaos.com/api/proxy/apollo/v1/people/match',
          apolloRequestData,
          { headers }
        );
        
        console.log('Apollo API response via PicaOS:', apolloResponse.data);
        
        if (apolloResponse.data.person) {
          // Process the Apollo data and simulate the data format from the edge function
          const enrichedData = {
            message: "Contact successfully enriched via PicaOS",
            data: {
              linkedin: apolloResponse.data.person?.linkedin_url || null,
              job_title: apolloResponse.data.person?.title || null,
              about_the_contact: apolloResponse.data.person?.bio || null,
              enrichment_date: new Date().toISOString(),
              enrichment_source: 'apollo via picaos',
              city: apolloResponse.data.person?.city || null,
              company: apolloResponse.data.person?.organization?.name || null,
              tags: apolloResponse.data.person?.keywords || []
            },
            rawResponse: apolloResponse.data
          };
          
          setApolloData(enrichedData);
        } else {
          setApolloData({
            error: 'No person data returned from Apollo API',
            response: apolloResponse.data
          });
        }
      } catch (apolloError) {
        console.error('Error calling Apollo API via PicaOS:', apolloError);
        
        // Try Supabase Edge Function as fallback
        try {
          console.log('Falling back to Supabase Edge Function for Apollo enrichment...');
          const { data, error } = await supabase.functions.invoke('apollo-enrich', {
            body: { contactId: contact.id }
          });
          
          if (error) {
            console.error('Supabase function returned error:', error);
            throw new Error(`Supabase function error: ${error.message}`);
          }
          
          console.log('Apollo enrichment successful via Supabase:', data);
          setApolloData({
            ...data,
            source: 'supabase_edge_function_fallback'
          });
        } catch (supabaseError) {
          // Both PicaOS and Supabase Edge Function failed
          console.error('Both PicaOS and Supabase Edge Functions failed:', supabaseError.message);
          
          setApolloData({ 
            error: 'All Apollo API enrichment methods failed',
            picaError: apolloError.message,
            supabaseError: supabaseError.message,
            diagnostics: {
              contactId: contact.id,
              email: contact.email,
              supabaseUrl: supabase.supabaseUrl
            }
          });
        }
      }
    } catch (outerError) {
      console.error('Unexpected error during Apollo enrichment:', outerError);
      setApolloData({ 
        error: outerError.message || 'Unexpected error during Apollo enrichment',
        stack: outerError.stack
      });
    }
  };
  
  const enrichWithAirtable = async () => {
    // Define Airtable configuration at the beginning of the function
    // so it's in scope for all blocks, including catch blocks
    const airtableBaseId = 'appTMYAU4N43eJdxG';
    const companiesTableId = 'tblzOon59xoKHt8da';
    const companiesViewId = 'viwWxnEEc6dFtffn9';
    const contactsTableId = 'tblUx9VGA0rxLmidU';
    const contactsViewId = 'viwx7ZW3VoWGHP3yH';
    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${companiesTableId}?view=${companiesViewId}&maxRecords=100`;
    
    try {
      // Call the Supabase Edge Function for contact enrichment
      let supabaseEdgeFunctionResult = null;
      
      try {
        console.log('Attempting to call Supabase Edge Function for Airtable enrichment...');
        const { data, error } = await supabase.functions.invoke('airtable-enrich', {
          body: { contactId: contact.id }
        });
        
        if (error) {
          console.error('Airtable enrichment function error:', error);
          throw new Error(`Supabase function error: ${error.message}`);
        }
        
        console.log('Airtable enrichment successful:', data);
        supabaseEdgeFunctionResult = { success: true, data };
      } catch (supabaseError) {
        console.error('Failed to call Airtable enrichment function:', supabaseError);
        supabaseEdgeFunctionResult = { 
          success: false, 
          error: supabaseError.message,
          stack: supabaseError.stack
        };
      }
      
      // Also fetch companies data directly from Airtable using API via PicaOS
      try {
        // PicaOS API token
        const picaApiToken = 'api_iXVeaUbmdKfQZjBrLtgN7MuGRNYwPsWk';
        const picaHeaders = {
          'Authorization': `Bearer ${picaApiToken}`,
          'Content-Type': 'application/json'
        };
        
        // Airtable Auth headers for direct requests
        const airtableHeaders = {
          'Authorization': 'Bearer patsAqQtI4eM71EIp.e42097d6cd529026d446be3da1b627c423ed3a5a7b59b0b38a9d77585e0909ea',
          'Content-Type': 'application/json'
        };
        
        // Get HubSpot companies data via PicaOS
        const companiesResponse = await axios.get('https://app.picaos.com/api/proxy/hubspot/crm/v3/objects/companies', {
          headers: picaHeaders,
          params: { limit: 20 }
        });
        
        // Attempt to retrieve data from Airtable via PicaOS (companies and contacts)
        let airtableData = {
          companies: null,
          contact: null
        };
        
        // 1. Fetch companies data via PicaOS proxy
        try {
          console.log('Attempting to fetch Airtable companies data via PicaOS...');
          
          const picaAirtableUrl = `https://app.picaos.com/api/proxy/airtable/v0/${airtableBaseId}/${companiesTableId}?view=${companiesViewId}&cellFormat=json`;
          const companiesResponse = await axios.get(picaAirtableUrl, { headers: picaHeaders });
          
          if (companiesResponse.status === 200) {
            airtableData.companies = companiesResponse.data;
            console.log(`Successfully retrieved ${companiesResponse.data.records?.length || 0} companies from Airtable via PicaOS`);
          } else {
            console.error('Companies request failed:', companiesResponse.status);
            airtableData.companies = { 
              error: `Airtable API error via PicaOS: ${companiesResponse.status}`,
              details: companiesResponse.data
            };
          }
        } catch (companiesError) {
          console.error('Failed to fetch companies from Airtable via PicaOS:', companiesError);
          
          // Fallback to direct Airtable API call
          try {
            console.log('Falling back to direct Airtable API call...');
            const companiesRequest = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${companiesTableId}?view=${companiesViewId}&cellFormat=json`, {
              method: 'GET',
              headers: airtableHeaders
            });
            
            if (companiesRequest.ok) {
              const companiesData = await companiesRequest.json();
              airtableData.companies = companiesData;
              console.log(`Successfully retrieved ${companiesData.records?.length || 0} companies from Airtable directly`);
            } else {
              airtableData.companies = { 
                error: `Direct Airtable API error: ${companiesRequest.status}`,
                details: await companiesRequest.text()
              };
            }
          } catch (directError) {
            airtableData.companies = { 
              error: 'Both PicaOS and direct Airtable requests failed',
              picaError: companiesError.message,
              directError: directError.message 
            };
          }
        }
        
        // 2. Try to find the specific contact by email
        if (contact.email) {
          try {
            console.log('Attempting to find contact in Airtable by email via PicaOS...');
            const filterFormula = encodeURIComponent(`{Primary email}="${contact.email}"`);
            const picaContactsUrl = `https://app.picaos.com/api/proxy/airtable/v0/${airtableBaseId}/${contactsTableId}?view=${contactsViewId}&filterByFormula=${filterFormula}&cellFormat=json`;
            
            const contactsResponse = await axios.get(picaContactsUrl, { headers: picaHeaders });
            
            if (contactsResponse.status === 200) {
              if (contactsResponse.data.records && contactsResponse.data.records.length > 0) {
                airtableData.contact = contactsResponse.data.records[0];
                console.log('Successfully found contact in Airtable via PicaOS:', airtableData.contact.id);
                
                // 3. If we found a contact and it has a company reference, fetch the company details
                if (airtableData.contact.fields && airtableData.contact.fields.Company) {
                  try {
                    const companyId = airtableData.contact.fields.Company;
                    if (typeof companyId === 'string' && companyId.startsWith('rec')) {
                      console.log('Fetching linked company details via PicaOS:', companyId);
                      const picaCompanyUrl = `https://app.picaos.com/api/proxy/airtable/v0/${airtableBaseId}/${companiesTableId}/${companyId}?cellFormat=json`;
                      
                      const companyResponse = await axios.get(picaCompanyUrl, { headers: picaHeaders });
                      
                      if (companyResponse.status === 200) {
                        airtableData.contactCompany = companyResponse.data;
                        console.log('Successfully retrieved linked company via PicaOS:', companyResponse.data?.fields?.Name);
                      }
                    }
                  } catch (companyLookupError) {
                    console.error('Failed to fetch linked company via PicaOS:', companyLookupError);
                    airtableData.contactCompanyError = companyLookupError.message;
                  }
                }
              } else {
                console.log('No matching contact found in Airtable via PicaOS');
                airtableData.contact = { error: 'No matching contact found' };
              }
            } else {
              console.error('Contact search request failed via PicaOS:', contactsResponse.status);
              airtableData.contact = { 
                error: `Airtable API error via PicaOS: ${contactsResponse.status}`,
                details: contactsResponse.data
              };
            }
          } catch (contactSearchError) {
            console.error('Failed to search for contact in Airtable via PicaOS:', contactSearchError);
            
            // Fall back to direct Airtable API
            try {
              console.log('Falling back to direct Airtable API for contact search...');
              const filterFormula = encodeURIComponent(`{Primary email}="${contact.email}"`);
              const contactsRequest = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${contactsTableId}?view=${contactsViewId}&filterByFormula=${filterFormula}&cellFormat=json`, {
                method: 'GET',
                headers: airtableHeaders
              });
              
              if (contactsRequest.ok) {
                const contactsData = await contactsRequest.json();
                if (contactsData.records && contactsData.records.length > 0) {
                  airtableData.contact = contactsData.records[0];
                  console.log('Successfully found contact in Airtable directly:', airtableData.contact.id);
                }
              } else {
                airtableData.contact = { 
                  error: 'Both PicaOS and direct Airtable contact searches failed',
                  picaError: contactSearchError.message,
                  directError: await contactsRequest.text()
                };
              }
            } catch (directError) {
              airtableData.contact = { 
                error: 'Both PicaOS and direct Airtable contact searches failed',
                picaError: contactSearchError.message,
                directError: directError.message
              };
            }
          }
        } else {
          airtableData.contact = { error: 'No email provided to search with' };
        }
        
        // Combine the data
        setAirtableData({
          supabaseFunction: supabaseEdgeFunctionResult,
          companiesDataFromHubspot: companiesResponse.data,
          airtable: airtableData,
          airtableConfig: {
            baseId: airtableBaseId,
            companiesTableId,
            companiesViewId,
            contactsTableId,
            contactsViewId,
            url: airtableUrl
          }
        });
      } catch (companiesError) {
        console.error('Error fetching companies from Airtable:', companiesError);
        setAirtableData({
          supabaseFunction: supabaseEdgeFunctionResult,
          companiesError: companiesError.message || 'Failed to fetch companies data',
          airtableConfig: {
            baseId: airtableBaseId,
            companiesTableId,
            companiesViewId,
            contactsTableId,
            contactsViewId,
            url: airtableUrl
          }
        });
      }
    } catch (error) {
      console.error('Error enriching from Airtable:', error);
      setAirtableData({ error: error.message || 'Failed to enrich from Airtable' });
    }
  };
  
  const enrichFromAllSources = async () => {
    await Promise.all([
      enrichWithHubspot(),
      enrichWithApollo(),
      enrichWithAirtable()
    ]);
  };
  
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'black' }}>Loading contact information...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }
  
  if (!contact) {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'black' }}>Contact not found</p>
      </div>
    );
  }
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      color: 'black', 
      backgroundColor: 'white',
      minHeight: '100vh'
    }}>
        <h1 style={{ margin: '0 0 20px 0', color: 'black' }}>Contact Data: {contact.first_name} {contact.last_name}</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={enrichFromAllSources} 
            style={{ 
              padding: '10px 15px', 
              marginRight: '10px',
              background: 'black',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Enrich from All Sources
          </button>
          <button 
            onClick={enrichWithHubspot} 
            style={{ 
              padding: '10px 15px', 
              marginRight: '10px',
              background: 'white',
              color: 'black',
              border: '1px solid black',
              cursor: 'pointer'
            }}
          >
            HubSpot Only
          </button>
          <button 
            onClick={enrichWithApollo} 
            style={{ 
              padding: '10px 15px', 
              marginRight: '10px',
              background: 'white',
              color: 'black',
              border: '1px solid black',
              cursor: 'pointer'
            }}
          >
            Apollo Only
          </button>
          <button 
            onClick={enrichWithAirtable} 
            style={{ 
              padding: '10px 15px',
              background: 'white',
              color: 'black',
              border: '1px solid black',
              cursor: 'pointer'
            }}
          >
            Airtable Only
          </button>
        </div>
        
        <div style={{ border: '1px solid black', padding: '15px' }}>
          <h2 style={{ margin: '0 0 15px 0', borderBottom: '1px solid black', paddingBottom: '5px', color: 'black' }}>
            All Data
          </h2>
          
          <h3 style={{ color: 'black' }}>Contact Information</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', color: 'black' }}>
            {JSON.stringify(contact, null, 2)}
          </pre>
          
          <h3 style={{ color: 'black' }}>Companies</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', color: 'black' }}>
            {JSON.stringify(companies, null, 2)}
          </pre>
          
          <h3 style={{ color: 'black' }}>Cities</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', color: 'black' }}>
            {JSON.stringify(cities, null, 2)}
          </pre>
          
          <h3 style={{ color: 'black' }}>Tags</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', color: 'black' }}>
            {JSON.stringify(tags, null, 2)}
          </pre>
          
          <h3 style={{ color: 'black' }}>HubSpot Data</h3>
          {hubspotData ? (
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', color: 'black' }}>
              {JSON.stringify(hubspotData, null, 2)}
            </pre>
          ) : (
            <p style={{ color: 'black' }}>No HubSpot data - click button to fetch</p>
          )}
          
          <h3 style={{ color: 'black' }}>Apollo Data</h3>
          {apolloData ? (
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', color: 'black' }}>
              {JSON.stringify(apolloData, null, 2)}
            </pre>
          ) : (
            <p style={{ color: 'black' }}>No Apollo data - click button to fetch</p>
          )}
          
          <h3 style={{ color: 'black' }}>Airtable Data</h3>
          {airtableData ? (
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', color: 'black' }}>
              {JSON.stringify(airtableData, null, 2)}
            </pre>
          ) : (
            <p style={{ color: 'black' }}>No Airtable data - click button to fetch</p>
          )}
        </div>
      </div>
  );
};

export default ContactEnrichment;