import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const DEAL_STAGES = ['Lead', 'Monitoring', 'Invested', 'Closed'];
const DEAL_CATEGORIES = ['Inbox', 'Startup', 'Fund', 'Real Estate', 'Private Debt', 'Private Equity', 'Other'];
const DEAL_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];
const DEAL_SOURCES = ['Not Set', 'Cold Contacting', 'Introduction'];
const DEAL_RELATIONSHIP_TYPES = ['proposer', 'introducer', 'co-investor', 'advisor', 'other'];

const getDealCategoryColor = (category) => {
  const colors = {
    'Real Estate': '#3B82F6',
    'Fund': '#8B5CF6',
    'Startup': '#10B981',
    'Infrastructure': '#F59E0B',
    'Private Equity': '#EC4899',
    'Venture Capital': '#06B6D4',
    'Debt': '#EF4444',
    'Other': '#6B7280',
  };
  return colors[category] || '#6B7280';
};

const useDealsData = (activeTab) => {
  // Pipeline deals state
  const [pipelineDeals, setPipelineDeals] = useState([]);
  const [selectedPipelineDeal, setSelectedPipelineDeal] = useState(null);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsSections, setDealsSections] = useState({
    open: true,
    invested: false,
    monitoring: false,
    closed: false
  });

  // Inline edit states
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [investmentEditOpen, setInvestmentEditOpen] = useState(false);
  const [investmentEditValue, setInvestmentEditValue] = useState('');
  const [currencyEditValue, setCurrencyEditValue] = useState('EUR');
  const [titleEditOpen, setTitleEditOpen] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const [descriptionEditOpen, setDescriptionEditOpen] = useState(false);
  const [descriptionEditValue, setDescriptionEditValue] = useState('');

  // Add contact to deal modal
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState([]);
  const [contactSearchLoading, setContactSearchLoading] = useState(false);
  const [selectedContactRelationship, setSelectedContactRelationship] = useState('other');

  // Add company to deal modal
  const [addDealCompanyModalOpen, setAddDealCompanyModalOpen] = useState(false);
  const [dealCompanySearchQuery, setDealCompanySearchQuery] = useState('');
  const [dealCompanySearchResults, setDealCompanySearchResults] = useState([]);
  const [dealCompanySearchLoading, setDealCompanySearchLoading] = useState(false);

  // Add attachment to deal modal
  const [addDealAttachmentModalOpen, setAddDealAttachmentModalOpen] = useState(false);
  const [dealAttachmentSearchQuery, setDealAttachmentSearchQuery] = useState('');
  const [dealAttachmentSearchResults, setDealAttachmentSearchResults] = useState([]);
  const [dealAttachmentSearchLoading, setDealAttachmentSearchLoading] = useState(false);
  const [dealAttachmentUploading, setDealAttachmentUploading] = useState(false);
  const dealAttachmentFileInputRef = useRef(null);

  // Create deal modal
  const [createDealModalOpen, setCreateDealModalOpen] = useState(false);
  const [createDealAIOpen, setCreateDealAIOpen] = useState(false);
  const [newDealForm, setNewDealForm] = useState({
    opportunity: '',
    category: 'Inbox',
    total_investment: '',
    deal_currency: 'EUR',
    description: ''
  });

  // Fetch deals when tab is active
  useEffect(() => {
    const fetchDeals = async () => {
      setDealsLoading(true);

      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          deals_contacts (
            contact_id,
            relationship,
            contacts (
              contact_id,
              first_name,
              last_name,
              profile_image_url
            )
          ),
          deal_companies (
            company_id,
            is_primary,
            companies (
              company_id,
              name
            )
          ),
          deal_attachments (
            deal_attachment_id,
            attachment_id,
            created_at,
            attachments (
              attachment_id,
              file_name,
              file_url,
              permanent_url,
              file_type,
              file_size
            )
          )
        `)
        .neq('stage', 'DELETE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
      } else {
        setPipelineDeals(data || []);
        if (data && data.length > 0) {
          const openDeals = data.filter(d => ['Lead', 'Qualified', 'Evaluating', 'Negotiation', 'Closing'].includes(d.stage));
          setSelectedPipelineDeal(openDeals.length > 0 ? openDeals[0] : data[0]);
        }
      }
      setDealsLoading(false);
    };

    if (activeTab === 'deals') {
      fetchDeals();
    }
  }, [activeTab]);

  // --- Handlers ---

  const handlePipelineDealStageChange = async (newStage) => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage, last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, stage: newStage };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setStageDropdownOpen(false);
      toast.success(`Stage updated to ${newStage}`);
    } catch (err) {
      console.error('Error updating deal stage:', err);
      toast.error('Failed to update stage');
    }
  };

  const handleUpdateDealCategory = async (newCategory) => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ category: newCategory, last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, category: newCategory };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setCategoryDropdownOpen(false);
      toast.success(`Category updated to ${newCategory}`);
    } catch (err) {
      console.error('Error updating deal category:', err);
      toast.error('Failed to update category');
    }
  };

  const handleUpdateDealSource = async (newSource) => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ source_category: newSource, last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, source_category: newSource };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setSourceDropdownOpen(false);
      toast.success(`Source updated to ${newSource}`);
    } catch (err) {
      console.error('Error updating deal source:', err);
      toast.error('Failed to update source');
    }
  };

  const handleUpdateDealInvestment = async () => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          total_investment: investmentEditValue ? parseFloat(investmentEditValue) : null,
          deal_currency: currencyEditValue,
          last_modified_at: new Date().toISOString()
        })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = {
        ...selectedPipelineDeal,
        total_investment: investmentEditValue ? parseFloat(investmentEditValue) : null,
        deal_currency: currencyEditValue
      };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setInvestmentEditOpen(false);
      toast.success('Investment updated');
    } catch (err) {
      console.error('Error updating deal investment:', err);
      toast.error('Failed to update investment');
    }
  };

  const handleUpdateDealTitle = async () => {
    if (!selectedPipelineDeal || !titleEditValue.trim()) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ opportunity: titleEditValue.trim(), last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, opportunity: titleEditValue.trim() };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setTitleEditOpen(false);
      toast.success('Title updated');
    } catch (err) {
      console.error('Error updating deal title:', err);
      toast.error('Failed to update title');
    }
  };

  const handleUpdateDealDescription = async () => {
    if (!selectedPipelineDeal) return;
    try {
      const { error } = await supabase
        .from('deals')
        .update({ description: descriptionEditValue.trim() || null, last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const updatedDeal = { ...selectedPipelineDeal, description: descriptionEditValue.trim() || null };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setDescriptionEditOpen(false);
      toast.success('Description updated');
    } catch (err) {
      console.error('Error updating deal description:', err);
      toast.error('Failed to update description');
    }
  };

  const handleRemoveDealContact = async (contactId) => {
    if (!selectedPipelineDeal || !contactId) return;
    try {
      const { error } = await supabase
        .from('deals_contacts')
        .delete()
        .eq('deal_id', selectedPipelineDeal.deal_id)
        .eq('contact_id', contactId);
      if (error) throw error;
      const updatedContacts = selectedPipelineDeal.deals_contacts.filter(dc => dc.contact_id !== contactId);
      const updatedDeal = { ...selectedPipelineDeal, deals_contacts: updatedContacts };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      toast.success('Contact removed from deal');
    } catch (err) {
      console.error('Error removing contact from deal:', err);
      toast.error('Failed to remove contact');
    }
  };

  const handleRemoveDealCompany = async (companyId) => {
    if (!selectedPipelineDeal || !companyId) return;
    try {
      const { error } = await supabase
        .from('deal_companies')
        .delete()
        .eq('deal_id', selectedPipelineDeal.deal_id)
        .eq('company_id', companyId);
      if (error) throw error;
      const updatedCompanies = selectedPipelineDeal.deal_companies.filter(dc => dc.company_id !== companyId);
      const updatedDeal = { ...selectedPipelineDeal, deal_companies: updatedCompanies };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      toast.success('Company removed from deal');
    } catch (err) {
      console.error('Error removing company from deal:', err);
      toast.error('Failed to remove company');
    }
  };

  const handleSearchContacts = async (query) => {
    setContactSearchQuery(query);
    if (!query.trim()) {
      setContactSearchResults([]);
      return;
    }
    setContactSearchLoading(true);
    try {
      const searchTerms = query.trim().split(/\s+/);
      let nameSearchQuery = supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, profile_image_url, contact_emails(email)');
      searchTerms.forEach(term => {
        nameSearchQuery = nameSearchQuery.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
      });
      const nameSearch = nameSearchQuery.limit(10);
      const emailSearch = supabase
        .from('contact_emails')
        .select('contact_id, email, contacts(contact_id, first_name, last_name, profile_image_url)')
        .ilike('email', `%${searchTerms[0]}%`)
        .limit(10);
      const [nameResult, emailResult] = await Promise.all([nameSearch, emailSearch]);
      if (nameResult.error) throw nameResult.error;
      if (emailResult.error) throw emailResult.error;
      const contactMap = new Map();
      (nameResult.data || []).forEach(c => {
        contactMap.set(c.contact_id, { ...c, email: c.contact_emails?.[0]?.email || null });
      });
      (emailResult.data || []).forEach(e => {
        if (e.contacts && !contactMap.has(e.contact_id)) {
          contactMap.set(e.contact_id, { ...e.contacts, email: e.email });
        }
      });
      const linkedContactIds = (selectedPipelineDeal?.deals_contacts || []).map(dc => dc.contact_id);
      const filteredResults = Array.from(contactMap.values()).filter(c => !linkedContactIds.includes(c.contact_id));
      setContactSearchResults(filteredResults.slice(0, 10));
    } catch (err) {
      console.error('Error searching contacts:', err);
      toast.error('Failed to search contacts');
    } finally {
      setContactSearchLoading(false);
    }
  };

  const handleAddDealContact = async (contact) => {
    if (!selectedPipelineDeal || !contact) return;
    try {
      const { error } = await supabase
        .from('deals_contacts')
        .insert({
          deal_id: selectedPipelineDeal.deal_id,
          contact_id: contact.contact_id,
          relationship: selectedContactRelationship
        });
      if (error) throw error;
      const newContactLink = {
        deal_id: selectedPipelineDeal.deal_id,
        contact_id: contact.contact_id,
        relationship: selectedContactRelationship,
        contacts: contact
      };
      const updatedContacts = [...(selectedPipelineDeal.deals_contacts || []), newContactLink];
      const updatedDeal = { ...selectedPipelineDeal, deals_contacts: updatedContacts };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setContactSearchQuery('');
      setContactSearchResults([]);
      setAddContactModalOpen(false);
      toast.success('Contact added to deal');
    } catch (err) {
      console.error('Error adding contact to deal:', err);
      toast.error('Failed to add contact');
    }
  };

  const handleSearchDealCompanies = async (query) => {
    setDealCompanySearchQuery(query);
    if (!query.trim()) {
      setDealCompanySearchResults([]);
      return;
    }
    setDealCompanySearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, company_domains(domain)')
        .ilike('name', `%${query}%`)
        .limit(10);
      if (error) throw error;
      const linkedCompanyIds = (selectedPipelineDeal?.deal_companies || []).map(dc => dc.company_id);
      const filteredResults = (data || []).filter(c => !linkedCompanyIds.includes(c.company_id));
      const resultsWithDomain = filteredResults.map(c => ({
        ...c,
        domain: c.company_domains?.[0]?.domain || null
      }));
      setDealCompanySearchResults(resultsWithDomain);
    } catch (err) {
      console.error('Error searching companies:', err);
      toast.error('Failed to search companies');
    } finally {
      setDealCompanySearchLoading(false);
    }
  };

  const handleAddDealCompany = async (company) => {
    if (!selectedPipelineDeal || !company) return;
    try {
      const { error } = await supabase
        .from('deal_companies')
        .insert({
          deal_id: selectedPipelineDeal.deal_id,
          company_id: company.company_id,
          is_primary: false
        });
      if (error) throw error;
      const newCompanyLink = {
        deal_id: selectedPipelineDeal.deal_id,
        company_id: company.company_id,
        is_primary: false,
        companies: company
      };
      const updatedCompanies = [...(selectedPipelineDeal.deal_companies || []), newCompanyLink];
      const updatedDeal = { ...selectedPipelineDeal, deal_companies: updatedCompanies };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setDealCompanySearchQuery('');
      setDealCompanySearchResults([]);
      setAddDealCompanyModalOpen(false);
      toast.success('Company added to deal');
    } catch (err) {
      console.error('Error adding company to deal:', err);
      toast.error('Failed to add company');
    }
  };

  const handleSearchDealAttachments = async (query) => {
    setDealAttachmentSearchQuery(query);
    if (!query.trim()) {
      setDealAttachmentSearchResults([]);
      return;
    }
    setDealAttachmentSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('attachment_id, file_name, file_url, permanent_url, file_type, file_size, created_at')
        .ilike('file_name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      const linkedAttachmentIds = (selectedPipelineDeal?.deal_attachments || []).map(da => da.attachment_id);
      const filteredResults = (data || []).filter(a => !linkedAttachmentIds.includes(a.attachment_id));
      setDealAttachmentSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching attachments:', err);
      toast.error('Failed to search attachments');
    } finally {
      setDealAttachmentSearchLoading(false);
    }
  };

  const handleAddDealAttachment = async (attachment) => {
    if (!selectedPipelineDeal || !attachment) return;
    try {
      const { error } = await supabase
        .from('deal_attachments')
        .insert({
          deal_id: selectedPipelineDeal.deal_id,
          attachment_id: attachment.attachment_id,
          created_by: 'User'
        });
      if (error) throw error;
      const newAttachmentLink = {
        deal_id: selectedPipelineDeal.deal_id,
        attachment_id: attachment.attachment_id,
        attachments: attachment
      };
      const updatedAttachments = [...(selectedPipelineDeal.deal_attachments || []), newAttachmentLink];
      const updatedDeal = { ...selectedPipelineDeal, deal_attachments: updatedAttachments };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      setDealAttachmentSearchQuery('');
      setDealAttachmentSearchResults([]);
      setAddDealAttachmentModalOpen(false);
      toast.success('Attachment added to deal');
    } catch (err) {
      console.error('Error adding attachment to deal:', err);
      toast.error('Failed to add attachment');
    }
  };

  const handleRemoveDealAttachment = async (attachmentId) => {
    if (!selectedPipelineDeal || !attachmentId) return;
    try {
      const { error } = await supabase
        .from('deal_attachments')
        .delete()
        .eq('deal_id', selectedPipelineDeal.deal_id)
        .eq('attachment_id', attachmentId);
      if (error) throw error;
      const updatedAttachments = selectedPipelineDeal.deal_attachments.filter(da => da.attachment_id !== attachmentId);
      const updatedDeal = { ...selectedPipelineDeal, deal_attachments: updatedAttachments };
      setSelectedPipelineDeal(updatedDeal);
      setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      toast.success('Attachment removed from deal');
    } catch (err) {
      console.error('Error removing attachment from deal:', err);
      toast.error('Failed to remove attachment');
    }
  };

  const handleUploadDealAttachment = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedPipelineDeal) return;

    setDealAttachmentUploading(true);
    try {
      for (const file of files) {
        const sanitizedName = file.name
          .replace(/[^\w\s.-]/g, '_')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_');
        const fileName = `${Date.now()}_${sanitizedName}`;
        const filePath = `deals/${selectedPipelineDeal.deal_id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file, {
            contentType: file.type || 'application/octet-stream'
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        const { data: attachmentRecord, error: insertError } = await supabase
          .from('attachments')
          .insert({
            file_name: file.name,
            file_url: uploadData.path,
            file_type: file.type,
            file_size: file.size,
            permanent_url: urlData.publicUrl,
            created_by: 'User'
          })
          .select()
          .single();
        if (insertError) throw insertError;

        const { error: linkError } = await supabase
          .from('deal_attachments')
          .insert({
            deal_id: selectedPipelineDeal.deal_id,
            attachment_id: attachmentRecord.attachment_id,
            created_by: 'User'
          });
        if (linkError) throw linkError;

        const newAttachmentLink = {
          deal_id: selectedPipelineDeal.deal_id,
          attachment_id: attachmentRecord.attachment_id,
          attachments: attachmentRecord
        };
        const updatedAttachments = [...(selectedPipelineDeal.deal_attachments || []), newAttachmentLink];
        const updatedDeal = { ...selectedPipelineDeal, deal_attachments: updatedAttachments };
        setSelectedPipelineDeal(updatedDeal);
        setPipelineDeals(prev => prev.map(d => d.deal_id === selectedPipelineDeal.deal_id ? updatedDeal : d));
      }

      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully`);
      setAddDealAttachmentModalOpen(false);
    } catch (err) {
      console.error('Error uploading attachment:', err);
      toast.error('Failed to upload file: ' + err.message);
    } finally {
      setDealAttachmentUploading(false);
      if (dealAttachmentFileInputRef.current) {
        dealAttachmentFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDeal = async () => {
    if (!selectedPipelineDeal) return;
    if (!window.confirm(`Are you sure you want to delete "${selectedPipelineDeal.deal_name || selectedPipelineDeal.opportunity}"?`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: 'DELETE', last_modified_at: new Date().toISOString() })
        .eq('deal_id', selectedPipelineDeal.deal_id);
      if (error) throw error;
      const remainingDeals = pipelineDeals.filter(d => d.deal_id !== selectedPipelineDeal.deal_id);
      setPipelineDeals(remainingDeals);
      if (remainingDeals.length > 0) {
        const openDeals = remainingDeals.filter(d => ['Lead', 'Qualified', 'Evaluating', 'Negotiation', 'Closing'].includes(d.stage));
        setSelectedPipelineDeal(openDeals.length > 0 ? openDeals[0] : remainingDeals[0]);
      } else {
        setSelectedPipelineDeal(null);
      }
      toast.success('Deal deleted');
    } catch (err) {
      console.error('Error deleting deal:', err);
      toast.error('Failed to delete deal');
    }
  };

  const handleCreateDeal = async () => {
    if (!newDealForm.opportunity.trim()) {
      toast.error('Please enter a deal name');
      return;
    }
    try {
      const insertData = {
        opportunity: newDealForm.opportunity.trim(),
        stage: 'Lead',
        category: newDealForm.category,
        total_investment: newDealForm.total_investment ? parseFloat(newDealForm.total_investment) : null,
        deal_currency: newDealForm.deal_currency,
        description: newDealForm.description || null,
        source_category: 'Not Set',
        created_at: new Date().toISOString(),
        last_modified_at: new Date().toISOString()
      };
      const { data: newDeal, error } = await supabase
        .from('deals')
        .insert([insertData])
        .select('*')
        .single();
      if (error) throw error;
      setPipelineDeals(prev => [newDeal, ...prev]);
      setSelectedPipelineDeal(newDeal);
      setNewDealForm({
        opportunity: '',
        category: 'Inbox',
        total_investment: '',
        deal_currency: 'EUR',
        description: ''
      });
      setCreateDealModalOpen(false);
      setDealsSections(prev => ({ ...prev, open: true }));
      toast.success('Deal created');
    } catch (err) {
      console.error('Error creating deal:', err);
      toast.error('Failed to create deal');
    }
  };

  const toggleDealsSection = (section) => {
    setDealsSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filterDealsByStatus = (deals, statusCategory) => {
    const openStages = ['Lead', 'Qualified', 'Evaluating', 'Negotiation', 'Closing'];
    const investedStages = ['Closed Won', 'Invested'];
    const monitoringStages = ['Monitoring'];
    const closedStages = ['Passed', 'Closed Lost'];

    let filtered;
    switch (statusCategory) {
      case 'open':
        filtered = deals.filter(d => openStages.includes(d.stage));
        break;
      case 'invested':
        filtered = deals.filter(d => investedStages.includes(d.stage));
        break;
      case 'monitoring':
        filtered = deals.filter(d => monitoringStages.includes(d.stage));
        break;
      case 'closed':
        filtered = deals.filter(d => closedStages.includes(d.stage));
        break;
      default:
        filtered = deals;
    }
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  return {
    // Constants
    DEAL_STAGES,
    DEAL_CATEGORIES,
    DEAL_CURRENCIES,
    DEAL_SOURCES,
    DEAL_RELATIONSHIP_TYPES,
    getDealCategoryColor,

    // State
    pipelineDeals,
    setPipelineDeals,
    selectedPipelineDeal,
    setSelectedPipelineDeal,
    dealsLoading,
    dealsSections,
    stageDropdownOpen,
    setStageDropdownOpen,
    categoryDropdownOpen,
    setCategoryDropdownOpen,
    sourceDropdownOpen,
    setSourceDropdownOpen,
    investmentEditOpen,
    setInvestmentEditOpen,
    investmentEditValue,
    setInvestmentEditValue,
    currencyEditValue,
    setCurrencyEditValue,
    titleEditOpen,
    setTitleEditOpen,
    titleEditValue,
    setTitleEditValue,
    descriptionEditOpen,
    setDescriptionEditOpen,
    descriptionEditValue,
    setDescriptionEditValue,
    addContactModalOpen,
    setAddContactModalOpen,
    contactSearchQuery,
    setContactSearchQuery,
    contactSearchResults,
    contactSearchLoading,
    selectedContactRelationship,
    setSelectedContactRelationship,
    addDealCompanyModalOpen,
    setAddDealCompanyModalOpen,
    dealCompanySearchQuery,
    dealCompanySearchResults,
    dealCompanySearchLoading,
    addDealAttachmentModalOpen,
    setAddDealAttachmentModalOpen,
    dealAttachmentSearchQuery,
    dealAttachmentSearchResults,
    dealAttachmentSearchLoading,
    dealAttachmentUploading,
    dealAttachmentFileInputRef,
    createDealModalOpen,
    setCreateDealModalOpen,
    createDealAIOpen,
    setCreateDealAIOpen,
    newDealForm,
    setNewDealForm,

    // Handlers
    handlePipelineDealStageChange,
    handleUpdateDealCategory,
    handleUpdateDealSource,
    handleUpdateDealInvestment,
    handleUpdateDealTitle,
    handleUpdateDealDescription,
    handleRemoveDealContact,
    handleRemoveDealCompany,
    handleSearchContacts,
    handleAddDealContact,
    handleSearchDealCompanies,
    handleAddDealCompany,
    handleSearchDealAttachments,
    handleAddDealAttachment,
    handleRemoveDealAttachment,
    handleUploadDealAttachment,
    handleDeleteDeal,
    handleCreateDeal,
    toggleDealsSection,
    filterDealsByStatus,
  };
};

export default useDealsData;
