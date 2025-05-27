// Test script to verify contact creation and association
import { supabase } from './src/lib/supabaseClient.js';

async function testContactCreation() {
  console.log('Testing contact creation and association...');
  
  try {
    // First, get a company to test with
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('company_id, name')
      .limit(1);
      
    if (companiesError) throw companiesError;
    
    if (!companies || companies.length === 0) {
      console.log('No companies found to test with');
      return;
    }
    
    const testCompany = companies[0];
    console.log('Testing with company:', testCompany);
    
    // Create a test contact
    const testContactData = {
      first_name: 'Test',
      last_name: 'Contact',
      category: 'Inbox',
      created_by: 'User'
    };
    
    console.log('Creating contact with data:', testContactData);
    
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert(testContactData)
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating contact:', createError);
      return;
    }
    
    console.log('Contact created successfully:', newContact);
    
    // Associate the contact with the company
    const associationData = {
      company_id: testCompany.company_id,
      contact_id: newContact.contact_id,
      relationship: 'not_set',
      is_primary: false
    };
    
    console.log('Creating association with data:', associationData);
    
    const { data: association, error: associationError } = await supabase
      .from('contact_companies')
      .insert(associationData)
      .select();
      
    if (associationError) {
      console.error('Error creating association:', associationError);
      return;
    }
    
    console.log('Association created successfully:', association);
    
    // Verify the association by querying
    const { data: verification, error: verificationError } = await supabase
      .from('contact_companies')
      .select(`
        *,
        contacts:contact_id(first_name, last_name),
        companies:company_id(name)
      `)
      .eq('contact_id', newContact.contact_id)
      .eq('company_id', testCompany.company_id);
      
    if (verificationError) {
      console.error('Error verifying association:', verificationError);
      return;
    }
    
    console.log('Verification successful:', verification);
    
    // Clean up - remove the test data
    await supabase.from('contact_companies').delete().eq('contact_id', newContact.contact_id);
    await supabase.from('contacts').delete().eq('contact_id', newContact.contact_id);
    
    console.log('Test completed successfully and cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testContactCreation(); 