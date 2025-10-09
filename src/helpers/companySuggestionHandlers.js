import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

/**
 * Handle accepting a company suggestion for a contact
 * Either creates a new company or associates an existing one
 */
export const handleAcceptSuggestion = async (contact, company, setCompanySuggestions, onContactUpdate) => {
  try {
    let companyIdToUse;

    if (company.suggestionType === 'create') {
      // Create new company first
      console.log(`🏢 Creating new company: ${company.name}`);
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: company.name,
          category: company.category || 'Corporate'
        })
        .select()
        .single();

      if (createError) throw createError;
      companyIdToUse = newCompany.company_id;

      // Create domain entry in company_domains table
      const { error: domainError } = await supabase
        .from('company_domains')
        .insert({
          company_id: companyIdToUse,
          domain: company.domain || company.website,
          is_primary: true
        });

      if (domainError) throw domainError;

      console.log(`✅ Created domain entry: ${company.domain || company.website} for company: ${company.name}`);
      toast.success(`Created ${company.name} company and associated with ${contact.first_name}`);
    } else {
      // Use existing company - handle different data structures
      companyIdToUse = company.company_id || company.id || company.companies?.company_id;
      toast.success(`Associated ${contact.first_name} with ${company.name}`);
    }

    // Associate contact with company
    const { error: associateError } = await supabase
      .from('contact_companies')
      .insert({
        contact_id: contact.contact_id,
        company_id: companyIdToUse,
        is_primary: true
      });

    if (associateError) throw associateError;

    // Remove from suggestions and refresh contacts
    setCompanySuggestions(prev => {
      const updated = { ...prev };
      delete updated[contact.contact_id];
      return updated;
    });

    if (onContactUpdate) onContactUpdate();
  } catch (err) {
    console.error('Error accepting suggestion:', err);
    toast.error(company.suggestionType === 'create' ? 'Failed to create company' : 'Failed to associate company');
  }
};

/**
 * Handle rejecting a company suggestion for a contact
 * Opens the manual company association modal
 */
export const handleRejectSuggestion = async (
  contact,
  setContactForQuickEdit,
  setQuickEditContactCompanies,
  setQuickEditAssociateCompanyModalOpen
) => {
  setContactForQuickEdit(contact);

  // Load company associations for the contact
  try {
    const { data: companiesData, error } = await supabase
      .from('contact_companies')
      .select(`
        contact_companies_id,
        relationship,
        is_primary,
        companies (
          company_id,
          name,
          category,
          description
        )
      `)
      .eq('contact_id', contact.contact_id);

    if (error) throw error;
    setQuickEditContactCompanies(companiesData || []);
  } catch (error) {
    console.error('Error loading company associations:', error);
    setQuickEditContactCompanies([]);
  }

  setQuickEditAssociateCompanyModalOpen(true);
};