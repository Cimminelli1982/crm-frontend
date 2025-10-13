import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaArrowLeft, FaEdit, FaTrash, FaGlobe, FaLinkedin, FaLayerGroup, FaRocket } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ContactsListDRY from '../components/ContactsListDRY';
import EditCompanyModal from '../components/modals/EditCompanyModal';
import CompanyContactsModal from '../components/modals/CompanyContactsModal';
import CompanyDuplicateModal from '../components/modals/CompanyDuplicateModal';
import CompanyEnrichmentModal from '../components/modals/CompanyEnrichmentModal';
import CompanyFiles from '../components/CompanyFiles';

const CompanyDetailPage = ({ theme }) => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Main company data
  const [company, setCompany] = useState(null);
  const [companyDomains, setCompanyDomains] = useState([]);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation management
  const [activeTab, setActiveTab] = useState(() => location.state?.activeRelatedTab || 'Contacts');
  const [activeContactsSubTab, setActiveContactsSubTab] = useState('Associated');

  // Description expand state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Related data
  const [companyContacts, setCompanyContacts] = useState([]);
  const [companyCities, setCompanyCities] = useState([]);
  const [companyTags, setCompanyTags] = useState([]);
  const [suggestedContacts, setSuggestedContacts] = useState([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Contacts modal state
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);

  // Merge modal state
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Enrichment modal state
  const [isEnrichmentModalOpen, setIsEnrichmentModalOpen] = useState(false);

  const fetchCompany = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      // Fetch company data
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      setCompany(data);

      // Fetch company domains
      const { data: domainsData, error: domainsError } = await supabase
        .from('company_domains')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (domainsError) {
        console.error('Error fetching domains:', domainsError);
        // Don't fail the whole request if domains fail
        setCompanyDomains([]);
      } else {
        setCompanyDomains(domainsData || []);
      }

      // Fetch company logo
      const { data: logoData, error: logoError } = await supabase
        .from('company_attachments')
        .select(`
          attachments (
            file_url,
            permanent_url,
            file_type,
            file_name
          )
        `)
        .eq('company_id', companyId)
        .eq('is_logo', true)
        .single();

      if (logoError && logoError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching logo:', logoError);
        setCompanyLogo(null);
      } else if (logoData?.attachments) {
        setCompanyLogo(logoData.attachments);
      } else {
        setCompanyLogo(null);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company details');
      navigate('/sort');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    if (!companyId) return;

    setLoadingRelatedData(true);
    try {
      // Fetch contacts associated with this company with all required fields for ContactCard
      const { data: contacts, error: contactsError } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          is_primary,
          relationship,
          contacts (
            contact_id,
            first_name,
            last_name,
            job_role,
            category,
            score,
            description,
            linkedin,
            profile_image_url,
            birthday
          )
        `)
        .eq('company_id', companyId);

      if (contactsError) throw contactsError;

      // Fetch contact emails and mobiles for all contacts
      const contactIds = (contacts || []).map(cr => cr.contacts?.contact_id).filter(Boolean);

      const [emailsResult, mobilesResult, keepInTouchResult] = await Promise.all([
        supabase
          .from('contact_emails')
          .select('contact_id, email, is_primary, type')
          .in('contact_id', contactIds),
        supabase
          .from('contact_mobiles')
          .select('contact_id, mobile, is_primary, type')
          .in('contact_id', contactIds),
        supabase
          .from('keep_in_touch')
          .select('contact_id, frequency, christmas, easter')
          .in('contact_id', contactIds)
      ]);

      // Create lookup maps
      const emailsByContact = {};
      const mobilesByContact = {};
      const keepInTouchByContact = {};

      (emailsResult.data || []).forEach(email => {
        if (!emailsByContact[email.contact_id]) {
          emailsByContact[email.contact_id] = [];
        }
        emailsByContact[email.contact_id].push(email);
      });

      (mobilesResult.data || []).forEach(mobile => {
        if (!mobilesByContact[mobile.contact_id]) {
          mobilesByContact[mobile.contact_id] = [];
        }
        mobilesByContact[mobile.contact_id].push(mobile);
      });

      (keepInTouchResult.data || []).forEach(kit => {
        keepInTouchByContact[kit.contact_id] = kit;
      });

      // Transform the contacts data to match ContactCard expectations
      const transformedContacts = (contacts || []).map(contactRelation => {
        const contact = contactRelation.contacts;
        const kitData = keepInTouchByContact[contact.contact_id] || {};
        return {
          ...contact,
          // Add keep in touch data
          keep_in_touch_frequency: kitData.frequency,
          christmas: kitData.christmas,
          easter: kitData.easter,
          // Add relationship info for display
          company_relationship: contactRelation.relationship,
          is_primary_company_contact: contactRelation.is_primary,
          // Add emails and mobiles
          emails: emailsByContact[contact.contact_id] || [],
          mobiles: mobilesByContact[contact.contact_id] || [],
          companies: [{
            company_id: companyId,
            name: company.name
          }]
        };
      });

      // Fetch cities associated with this company
      const { data: cities, error: citiesError } = await supabase
        .from('company_cities')
        .select(`
          entry_id,
          cities (
            city_id,
            name,
            country
          )
        `)
        .eq('company_id', companyId);

      if (citiesError) throw citiesError;

      // Fetch tags associated with this company
      const { data: tags, error: tagsError } = await supabase
        .from('company_tags')
        .select(`
          entry_id,
          tags (
            tag_id,
            name
          )
        `)
        .eq('company_id', companyId);

      if (tagsError) throw tagsError;

      setCompanyContacts(transformedContacts || []);
      setCompanyCities(cities || []);
      setCompanyTags(tags || []);

      console.log('Related data loaded:', {
        originalContacts: contacts,
        transformedContacts,
        cities,
        tags
      });
    } catch (error) {
      console.error('Error fetching related data:', error);
      toast.error('Failed to load related data');
    } finally {
      setLoadingRelatedData(false);
    }
  };

  // Smart suggestion logic - adapted from ContactsList but reversed for this company
  const fetchSuggestedContacts = async () => {
    if (!companyId) return;

    try {
      console.log(`🔍 Finding contacts that should be associated with company: ${company?.name}`);

      // Get all domains for this company (like ContactsList does)
      const { data: companyDomains, error: domainsError } = await supabase
        .from('company_domains')
        .select('domain, is_primary')
        .eq('company_id', companyId);

      if (domainsError) throw domainsError;

      if (!companyDomains || companyDomains.length === 0) {
        console.log('⚠️ No domains found for company');
        setSuggestedContacts([]);
        return;
      }

      console.log(`📍 Company domains:`, companyDomains.map(d => d.domain));

      // Get contacts already associated with this company
      const { data: existingAssociations } = await supabase
        .from('contact_companies')
        .select('contact_id')
        .eq('company_id', companyId);

      const existingContactIds = (existingAssociations || []).map(assoc => assoc.contact_id);

      // Find contacts with emails matching ANY of this company's domains
      // (Using the same domain matching logic as ContactsList)
      const emailSearchPromises = companyDomains.map(async (domainData) => {
        let domain = domainData.domain;

        // Remove www. prefix if present (equinox.com works for both www.equinox.com and equinox.com emails)
        const cleanDomain = domain.replace(/^www\./, '');

        console.log(`🔍 Searching for emails matching: @${cleanDomain}`);

        // Search contact_emails table (same as ContactsList fetchCompanySuggestion)
        const { data: contactsWithMatchingEmails, error: emailError } = await supabase
          .from('contact_emails')
          .select(`
            contact_id,
            email,
            is_primary,
            type,
            contacts (
              contact_id,
              first_name,
              last_name,
              job_role,
              category,
              score,
              description,
              linkedin,
              profile_image_url,
              birthday,
              created_at
            )
          `)
          .ilike('email', `%@${cleanDomain}`)
          .limit(20); // Reasonable limit per domain

        if (emailError) {
          console.error(`Error searching emails for domain ${domain}:`, emailError);
          return [];
        }

        const matchingContacts = (contactsWithMatchingEmails || []);
        console.log(`📧 Found ${matchingContacts.length} contacts with @${cleanDomain} emails:`,
          matchingContacts.map(r => `${r.contacts?.first_name} ${r.contacts?.last_name} (${r.email}) - ${r.contacts?.category}`)
        );

        const filteredContacts = matchingContacts
          .filter(result => {
            if (!result.contacts) {
              console.log(`❌ Skipping result with no contact data`);
              return false;
            }
            if (existingContactIds.includes(result.contacts.contact_id)) {
              console.log(`❌ Skipping ${result.contacts.first_name} ${result.contacts.last_name} - already associated`);
              return false;
            }
            if (result.contacts.category === 'Skip') {
              console.log(`❌ Skipping ${result.contacts.first_name} ${result.contacts.last_name} - Skip category`);
              return false;
            }
            console.log(`✅ Including ${result.contacts.first_name} ${result.contacts.last_name} - ${result.contacts.category}`);
            return true;
          })
          .map(result => ({
            ...result.contacts,
            matching_email: result.email,
            matching_domain: cleanDomain,
            is_primary_domain: domainData.is_primary,
            emails: [{ email: result.email, is_primary: true }], // Format for ContactsList
            mobiles: [],
            companies: [], // No companies (that's why they're suggested)
            tags: [],
            cities: []
          }));

        console.log(`🎯 After filtering: ${filteredContacts.length} contacts for domain ${cleanDomain}`);
        return filteredContacts;
      });

      const allMatches = await Promise.all(emailSearchPromises);
      const flatMatches = allMatches.flat();

      // Remove duplicates by contact_id (same contact might match multiple domains)
      const uniqueContacts = flatMatches.reduce((acc, contact) => {
        if (!acc.find(c => c.contact_id === contact.contact_id)) {
          acc.push(contact);
        }
        return acc;
      }, []);

      // Fetch mobiles for suggested contacts
      if (uniqueContacts.length > 0) {
        const suggestedContactIds = uniqueContacts.map(c => c.contact_id);
        const { data: mobilesData } = await supabase
          .from('contact_mobiles')
          .select('contact_id, mobile, is_primary, type')
          .in('contact_id', suggestedContactIds);

        // Add mobiles to contacts
        const mobilesByContactId = {};
        (mobilesData || []).forEach(mobile => {
          if (!mobilesByContactId[mobile.contact_id]) {
            mobilesByContactId[mobile.contact_id] = [];
          }
          mobilesByContactId[mobile.contact_id].push(mobile);
        });

        uniqueContacts.forEach(contact => {
          contact.mobiles = mobilesByContactId[contact.contact_id] || [];
        });
      }

      console.log(`✅ Found ${uniqueContacts.length} contacts matching company domains`);
      setSuggestedContacts(uniqueContacts);

    } catch (error) {
      console.error('Error fetching suggested contacts:', error);
      setSuggestedContacts([]);
    }
  };


  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  useEffect(() => {
    if (company) {
      fetchRelatedData();
      fetchSuggestedContacts();
    }
  }, [company, companyId]);

  const handleBack = () => {
    const previousContactId = location.state?.previousContactId;
    if (previousContactId) {
      // Navigate back to the specific contact detail page
      navigate(`/contact/${previousContactId}`, {
        state: { activeTab: 'Related', activeRelatedTab: 'Companies' }
      });
    } else {
      // Fallback: go back in history
      navigate(-1);
    }
  };

  const handleWebsiteClick = (domain = null) => {
    // Use provided domain or fall back to primary domain or first domain
    const targetDomain = domain ||
                         companyDomains.find(d => d.is_primary)?.domain ||
                         companyDomains[0]?.domain ||
                         company?.website; // Legacy fallback

    if (!targetDomain) return;

    let url = targetDomain;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    window.open(url, '_blank');
  };

  const handleLinkedInClick = () => {
    if (!company?.linkedin) return;

    let url = company.linkedin;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://linkedin.com/company/${url}`;
    }
    window.open(url, '_blank');
  };

  const handleContactClick = (contact) => {
    if (!contact?.contacts?.contact_id) return;

    navigate(`/contact/${contact.contacts.contact_id}`, {
      state: {
        activeTab: 'Related',
        activeRelatedTab: 'Companies',
        previousCompanyId: companyId
      }
    });
  };

  const handleCityClick = (city) => {
    if (!city?.cities?.city_id || !city?.cities?.name) return;

    navigate(`/city/${city.cities.city_id}/contacts`, {
      state: {
        cityName: city.cities.name,
        companyId: companyId
      }
    });
  };

  const handleTagClick = (tag) => {
    if (!tag?.tags?.tag_id || !tag?.tags?.name) return;

    navigate(`/tag/${tag.tags.tag_id}/contacts`, {
      state: {
        tagName: tag.tags.name,
        companyId: companyId
      }
    });
  };

  const getRelationshipBadgeColor = (relationship) => {
    switch (relationship) {
      case 'founder': return '#10B981'; // Green
      case 'employee': return '#3B82F6'; // Blue
      case 'advisor': return '#8B5CF6'; // Purple
      case 'manager': return '#F59E0B'; // Orange
      case 'investor': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  // Button handlers
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    // Refresh company data after edit
    fetchCompany();
    fetchRelatedData();
  };

  const handleAddContacts = () => {
    setIsContactsModalOpen(true);
  };

  const handleContactsModalClose = () => {
    setIsContactsModalOpen(false);
    // Refresh related data after contacts changes
    fetchRelatedData();
  };

  const handleMerge = () => {
    setIsMergeModalOpen(true);
  };

  const handleMergeModalClose = () => {
    setIsMergeModalOpen(false);
    // Refresh company data after potential merge
    fetchCompany();
    fetchRelatedData();
  };

  const handleEnrich = () => {
    setIsEnrichmentModalOpen(true);
  };

  const handleEnrichmentModalClose = () => {
    setIsEnrichmentModalOpen(false);
    // Refresh company data after enrichment
    fetchCompany();
    fetchRelatedData();
  };

  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploadingLogo(true);
      try {
        // Upload file to Supabase Storage
        const fileName = `company_logos/${company.company_id}_${Date.now()}.${file.name.split('.').pop()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Create attachment record
        const { data: attachmentData, error: attachmentError } = await supabase
          .from('attachments')
          .insert({
            file_name: file.name,
            file_url: uploadData.path,
            file_type: file.type,
            file_size: file.size,
            permanent_url: supabase.storage.from('attachments').getPublicUrl(uploadData.path).data.publicUrl
          })
          .select()
          .single();

        if (attachmentError) throw attachmentError;

        // Remove existing logo if any
        await supabase
          .from('company_attachments')
          .delete()
          .eq('company_id', company.company_id)
          .eq('is_logo', true);

        // Link attachment to company as logo
        const { error: linkError } = await supabase
          .from('company_attachments')
          .insert({
            company_id: company.company_id,
            attachment_id: attachmentData.attachment_id,
            is_logo: true
          });

        if (linkError) throw linkError;

        toast.success('Logo uploaded successfully!');
        fetchCompany(); // Refresh to show new logo
      } catch (error) {
        console.error('Error uploading logo:', error);
        toast.error('Failed to upload logo: ' + error.message);
      } finally {
        setIsUploadingLogo(false);
      }
    };
    input.click();
  };

  const handleDelete = async () => {
    if (!company) return;

    const confirmMessage = `Are you sure you want to delete "${company.name}"?\n\nThis will permanently delete:\n• The company record\n• All associated tags, cities, and contacts\n• All attachments, investments, and notes\n• This action cannot be undone!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('Deleting company and all associated records:', company.company_id);

      // First, get all attachments to delete the actual files
      const { data: attachments } = await supabase
        .from('company_attachments')
        .select('file_path, file_name')
        .eq('company_id', company.company_id);

      // Delete actual files from storage if they exist
      if (attachments && attachments.length > 0) {
        console.log('Deleting attachment files:', attachments.length);
        for (const attachment of attachments) {
          if (attachment.file_path) {
            try {
              const { error: storageError } = await supabase.storage
                .from('attachments') // Adjust bucket name as needed
                .remove([attachment.file_path]);

              if (storageError) {
                console.warn('Could not delete file:', attachment.file_path, storageError);
              }
            } catch (fileError) {
              console.warn('Error deleting file:', attachment.file_path, fileError);
            }
          }
        }
      }

      // Delete ALL references to the company from ALL tables
      await Promise.all([
        supabase.from('company_attachments').delete().eq('company_id', company.company_id),
        supabase.from('company_cities').delete().eq('company_id', company.company_id),
        supabase.from('company_tags').delete().eq('company_id', company.company_id),
        supabase.from('contact_companies').delete().eq('company_id', company.company_id),
        supabase.from('investments').delete().eq('related_company', company.company_id),
        supabase.from('notes_companies').delete().eq('company_id', company.company_id)
      ]);

      console.log('All references cleaned up, now deleting company');

      // Delete the company
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('company_id', company.company_id);

      if (deleteError) {
        console.error('Failed to delete company:', deleteError);
        toast.error('Failed to delete company: ' + deleteError.message);
        return;
      }

      console.log('Successfully deleted company');
      toast.success(`"${company.name}" has been permanently deleted`);

      // Navigate back to companies list
      navigate('/companies');

    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company: ' + error.message);
    }
  };

  if (loading) {
    return (
      <PageContainer theme={theme}>
        <LoadingContainer>
          <LoadingSpinner theme={theme} />
          <LoadingText theme={theme}>Loading company details...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (!company) {
    return (
      <PageContainer theme={theme}>
        <ErrorContainer>
          <ErrorText theme={theme}>Company not found</ErrorText>
        </ErrorContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer theme={theme}>
      <CompanyDetailView>
        {/* Header */}
        <CompanyHeader theme={theme}>
          <HeaderTop>
            <BackButton theme={theme} onClick={handleBack}>
              <FaArrowLeft />
              <span>Back</span>
            </BackButton>
          </HeaderTop>

          <HeaderMain>
            <CompanyInfo>
              <CompanyAvatar theme={theme}>
                {companyLogo ? (
                  <LogoImage
                    src={companyLogo.permanent_url || companyLogo.file_url}
                    alt={`${company.name} logo`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <LogoFallback
                  style={{ display: companyLogo ? 'none' : 'block' }}
                  onClick={handleLogoUpload}
                  title="Click to upload company logo"
                >
                  {isUploadingLogo ? '⏳' : ''}
                </LogoFallback>
              </CompanyAvatar>
              <CompanyDetails>
                <CompanyName theme={theme}>{company.name}</CompanyName>
                {company.category && (
                  <CompanyCategory
                    theme={theme}
                    $clickable={company.category === 'Not Set'}
                    onClick={company.category === 'Not Set' ? handleEdit : undefined}
                  >
                    {company.category}
                  </CompanyCategory>
                )}
                {company.description && (
                  <CompanyDescription theme={theme}>
                    {isDescriptionExpanded || company.description.length <= 200
                      ? company.description
                      : `${company.description.substring(0, 200)}...`
                    }
                    {company.description.length > 200 && (
                      <ShowMoreButton
                        theme={theme}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDescriptionExpanded(!isDescriptionExpanded);
                        }}
                      >
                        {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                      </ShowMoreButton>
                    )}
                  </CompanyDescription>
                )}
                {(companyTags.length > 0 || companyCities.length > 0) && (
                  <CompanyMeta>
                    {companyCities.length > 0 && (
                      <MetaSection>
                        <MetaLabel>🌍 Cities:</MetaLabel>
                        <MetaItems>
                          {companyCities.slice(0, 3).map((cityRelation, index) => (
                            <MetaItem key={index} theme={theme}>
                              {cityRelation.cities?.name}
                              {cityRelation.cities?.country && cityRelation.cities.country !== 'Unknown' && (
                                <span>, {cityRelation.cities.country}</span>
                              )}
                            </MetaItem>
                          ))}
                          {companyCities.length > 3 && (
                            <MetaItem theme={theme}>+{companyCities.length - 3} more</MetaItem>
                          )}
                        </MetaItems>
                      </MetaSection>
                    )}
                    {companyTags.length > 0 && (
                      <MetaSection>
                        <MetaLabel>🏷️ Tags:</MetaLabel>
                        <MetaItems>
                          {companyTags.slice(0, 4).map((tagRelation, index) => (
                            <MetaTag key={index} theme={theme}>
                              {tagRelation.tags?.name}
                            </MetaTag>
                          ))}
                          {companyTags.length > 4 && (
                            <MetaTag theme={theme}>+{companyTags.length - 4}</MetaTag>
                          )}
                        </MetaItems>
                      </MetaSection>
                    )}
                  </CompanyMeta>
                )}
                <CompanyLinks>
                  {(companyDomains.length > 0 || company.website) && (
                    <>
                      {companyDomains.length > 1 ? (
                        <DomainDropdownContainer>
                          <LinkButton theme={theme} onClick={() => handleWebsiteClick()}>
                            <FaGlobe />
                            <span>Websites ({companyDomains.length})</span>
                          </LinkButton>
                          <DomainList theme={theme} className="domain-list">
                            {companyDomains.map((domainObj, index) => (
                              <DomainItem
                                key={index}
                                theme={theme}
                                onClick={() => handleWebsiteClick(domainObj.domain)}
                              >
                                {domainObj.domain}
                                {domainObj.is_primary && <PrimaryBadge theme={theme}>Primary</PrimaryBadge>}
                              </DomainItem>
                            ))}
                          </DomainList>
                        </DomainDropdownContainer>
                      ) : (
                        <LinkButton theme={theme} onClick={() => handleWebsiteClick()}>
                          <FaGlobe />
                          <span>Website</span>
                        </LinkButton>
                      )}
                    </>
                  )}
                  {company.linkedin && (
                    <LinkButton theme={theme} onClick={handleLinkedInClick}>
                      <FaLinkedin />
                      <span>LinkedIn</span>
                    </LinkButton>
                  )}
                </CompanyLinks>
              </CompanyDetails>
            </CompanyInfo>

            <ActionButtons>
              <ActionButton theme={theme} $primary onClick={handleEdit}>
                <FaEdit />
                <ActionButtonText>Edit</ActionButtonText>
              </ActionButton>
              <ActionButton theme={theme} $enrich onClick={handleEnrich}>
                <FaRocket />
                <ActionButtonText>Enrich</ActionButtonText>
              </ActionButton>
              <ActionButton theme={theme} $merge onClick={handleMerge}>
                <FaLayerGroup />
                <ActionButtonText>Merge</ActionButtonText>
              </ActionButton>
              <ActionButton theme={theme} $danger onClick={handleDelete}>
                <FaTrash />
                <ActionButtonText>Delete</ActionButtonText>
              </ActionButton>
            </ActionButtons>
          </HeaderMain>
        </CompanyHeader>

        {/* Main Navigation */}
        <RelatedSubMenu theme={theme}>
          {['Contacts', 'Files', 'Deals'].map(tab => (
            <RelatedSubTab
              key={tab}
              theme={theme}
              $active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </RelatedSubTab>
          ))}
        </RelatedSubMenu>

        {/* Main Content */}
        <MainContent>
          {/* Contacts */}
          {activeTab === 'Contacts' && (
            <RelatedSection>
              <RelatedSectionHeader>
                <SectionTitle theme={theme}>
                  🧑‍💼 Contacts
                </SectionTitle>
                <AddButton theme={theme} onClick={handleAddContacts}>
                  + Add Contacts
                </AddButton>
              </RelatedSectionHeader>

              {/* Contacts Sub Menu */}
              <ContactsSubMenu theme={theme}>
                <SubMenuButton
                  theme={theme}
                  $isActive={activeContactsSubTab === 'Associated'}
                  onClick={() => setActiveContactsSubTab('Associated')}
                >
                  Associated ({companyContacts.length})
                </SubMenuButton>
                {suggestedContacts.length > 0 && (
                  <SubMenuButton
                    theme={theme}
                    $isActive={activeContactsSubTab === 'Suggested'}
                    onClick={() => setActiveContactsSubTab('Suggested')}
                  >
                    Suggested ({suggestedContacts.length})
                  </SubMenuButton>
                )}
              </ContactsSubMenu>

              {/* Associated Contacts */}
              {activeContactsSubTab === 'Associated' && (
                <ContactsContainer>
                  {loadingRelatedData ? (
                    <LoadingContainer>
                      <LoadingSpinner theme={theme} />
                      <LoadingText theme={theme}>Loading contacts...</LoadingText>
                    </LoadingContainer>
                  ) : (
                    <ContactsListDRY
                      dataSource={{ type: 'search', preloadedData: companyContacts }}
                      refreshTrigger={companyContacts.length}
                      theme={theme}
                      emptyStateConfig={{
                        icon: '🧑‍💼',
                        title: 'No contacts associated',
                        text: 'No contacts are currently associated with this company.'
                      }}
                      onContactUpdate={() => {
                        fetchRelatedData();
                        fetchSuggestedContacts(); // Refresh suggestions when contacts change
                      }}
                      showActions={true}
                      badgeType="category"
                      onContactClick={(contact) => {
                        navigate(`/contact/${contact.contact_id}`, {
                          state: {
                            activeTab: 'Related',
                            activeRelatedTab: 'Companies',
                            previousCompanyId: companyId
                          }
                        });
                      }}
                    />
                  )}
                </ContactsContainer>
              )}

              {/* Suggested Contacts */}
              {activeContactsSubTab === 'Suggested' && suggestedContacts.length > 0 && (
                <ContactsContainer>
                  <ContactsListDRY
                    dataSource={{ type: 'search', preloadedData: suggestedContacts }}
                    theme={theme}
                    emptyStateConfig={{
                      icon: '💡',
                      title: 'No suggestions found',
                      text: 'No contacts found with matching email domains.'
                    }}
                    onContactUpdate={() => {
                      fetchRelatedData();
                      fetchSuggestedContacts();
                    }}
                    showActions={true}
                    badgeType="category"
                    onContactClick={(contact) => {
                      navigate(`/contact/${contact.contact_id}`, {
                        state: {
                          activeTab: 'Related',
                          activeRelatedTab: 'Companies',
                          previousCompanyId: companyId
                        }
                      });
                    }}
                  />
                </ContactsContainer>
              )}
            </RelatedSection>
          )}

          {/* Files */}
          {activeTab === 'Files' && (
            <RelatedSection>
              <CompanyFiles company={company} />
            </RelatedSection>
          )}

          {/* Deals - Coming Soon */}
          {activeTab === 'Deals' && (
                  <RelatedSection>
                    <ComingSoonContainer>
                      <ComingSoonIcon>🚧</ComingSoonIcon>
                      <ComingSoonTitle theme={theme}>Deals Coming Soon</ComingSoonTitle>
                      <ComingSoonText theme={theme}>
                        Deal relationships will be available in a future update
                      </ComingSoonText>
            </ComingSoonContainer>
          </RelatedSection>
          )}
        </MainContent>
      </CompanyDetailView>

      {/* Edit Company Modal */}
      <EditCompanyModal
        isOpen={isEditModalOpen}
        onRequestClose={handleEditModalClose}
        company={{
          ...company,
          tags: companyTags.map(tagRelation => ({
            tag_id: tagRelation.tags?.tag_id,
            id: tagRelation.tags?.tag_id,
            name: tagRelation.tags?.name
          })),
          cities: companyCities.map(cityRelation => ({
            city_id: cityRelation.cities?.city_id,
            id: cityRelation.cities?.city_id,
            name: cityRelation.cities?.name,
            country: cityRelation.cities?.country
          })),
          contacts: companyContacts
        }}
      />

      {/* Company Contacts Modal */}
      <CompanyContactsModal
        isOpen={isContactsModalOpen}
        onRequestClose={handleContactsModalClose}
        company={company}
      />

      {/* Company Duplicate Modal */}
      <CompanyDuplicateModal
        isOpen={isMergeModalOpen}
        onRequestClose={handleMergeModalClose}
        company={company}
      />

      {/* Company Enrichment Modal */}
      <CompanyEnrichmentModal
        isOpen={isEnrichmentModalOpen}
        onClose={handleEnrichmentModalClose}
        company={company}
        companyDomains={companyDomains}
        onEnrichComplete={handleEnrichmentModalClose}
        theme={theme}
      />
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const CompanyDetailView = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const CompanyHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 24px;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 8px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    border-color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }

  svg {
    font-size: 12px;
  }
`;

const HeaderMain = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
`;

const CompanyAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
`;

const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
`;

const LogoFallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 12px;
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  margin-top: 8px;
  margin-left: 2px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E40AF'};
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CompanyDetails = styled.div`
  flex: 1;
`;

const CompanyName = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const CompanyCategory = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border-radius: 16px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 12px;
  transition: all 0.2s ease;

  ${props => props.$clickable && `
    cursor: pointer;

    &:hover {
      background: ${props.theme === 'light' ? '#DBEAFE' : '#1E40AF'};
      transform: scale(1.02);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: scale(0.98);
    }
  `}
`;

const CompanyDescription = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 12px 0;
  max-width: 500px;
`;

const CompanyLinks = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const LinkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    border-color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }

  svg {
    font-size: 12px;
  }
`;

const DomainDropdownContainer = styled.div`
  position: relative;
  display: inline-block;

  &:hover {
    .domain-list {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }
`;

const DomainList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
  min-width: 200px;
  margin-top: 4px;
  overflow: hidden;

  &.domain-list {
    /* For easier hover targeting */
  }
`;

const DomainItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    color: ${props => props.theme === 'light' ? '#1F2937' : '#FFFFFF'};
  }
`;

const PrimaryBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#10B981' : '#059669'};
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  margin-left: 8px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => props.$primary && `
    background: ${props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    color: white;

    &:hover {
      background: ${props.theme === 'light' ? '#2563EB' : '#3B82F6'};
    }
  `}

  ${props => props.$danger && `
    background: ${props.theme === 'light' ? '#EF4444' : '#F87171'};
    color: white;

    &:hover {
      background: ${props.theme === 'light' ? '#DC2626' : '#EF4444'};
    }
  `}

  ${props => props.$enrich && `
    background: ${props.theme === 'light' ? '#8B5CF6' : '#A78BFA'};
    color: white;

    &:hover {
      background: ${props.theme === 'light' ? '#7C3AED' : '#8B5CF6'};
    }
  `}

  ${props => props.$merge && `
    background: ${props.theme === 'light' ? '#F59E0B' : '#FBBF24'};
    color: white;

    &:hover {
      background: ${props.theme === 'light' ? '#D97706' : '#F59E0B'};
    }
  `}

  ${props => !props.$primary && !props.$danger && !props.$enrich && !props.$merge && `
    background: ${props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props.theme === 'light' ? '#374151' : '#D1D5DB'};

    &:hover {
      background: ${props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
    }
  `}

  svg {
    font-size: 14px;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 20px 0;
`;

const SuggestionSubtitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: -15px 0 20px 0;
  font-style: italic;
`;

const ContactsSubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 90%;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    max-width: 95%;
    gap: 1px;
  }
`;

const SubMenuButton = styled.button`
  background: ${props => props.$isActive
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$isActive
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$isActive ? '600' : '500'};

  &:hover:not([disabled]) {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }

  @media (max-width: 768px) {
    padding: 4px 6px;
    font-size: 13px;
  }
`;

const RelatedSubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 600px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const RelatedSubTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover:not([disabled]) {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    box-shadow: ${props => props.theme === 'light'
      ? '0 1px 3px rgba(0, 0, 0, 0.15)'
      : '0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }
`;

const RelatedContent = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const RelatedSection = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const RelatedSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const AddButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const RelatedEmptyMessage = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;


const ComingSoonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
`;

const ComingSoonIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ComingSoonTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const ComingSoonText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin: 0;
`;

const ContactsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const ContactCardWrapper = styled.div`
  margin-bottom: 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  margin: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-top-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
`;

const ErrorText = styled.div`
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  font-size: 18px;
  font-weight: 500;
`;

// New Styled Components for updated features

const ActionButtonText = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

const ShowMoreButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 8px;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const CompanyMeta = styled.div`
  margin: 16px 0 12px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MetaSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const MetaLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#374151' : '#9CA3AF'};
  min-width: fit-content;
`;

const MetaItems = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const MetaTag = styled.span`
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  border: 1px solid ${props => props.theme === 'light' ? '#DBEAFE' : '#3B82F6'};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

export default CompanyDetailPage;