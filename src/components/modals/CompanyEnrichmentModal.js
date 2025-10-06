import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiLink, FiCheck, FiEdit2, FiLoader, FiSave, FiExternalLink, FiSearch, FiRefreshCw, FiDatabase, FiUsers, FiCalendar, FiImage } from 'react-icons/fi';
import { FaBuilding, FaGlobe, FaLinkedin, FaTags, FaMapMarkerAlt, FaFileAlt, FaServer } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Styled components
const ModalHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  }
`;

const ModalContent = styled.div`
  padding: 20px 24px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  position: relative;
  box-sizing: border-box;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  max-height: 70vh;
  overflow-y: auto;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
    z-index: 0;
  }
`;

const Step = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
  flex: 1;
`;

const StepCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.active
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : props.completed
    ? (props.theme === 'light' ? '#10B981' : '#059669')
    : (props.theme === 'light' ? '#FFFFFF' : '#374151')
  };
  border: 2px solid ${props => props.active || props.completed
    ? 'transparent'
    : (props.theme === 'light' ? '#E5E7EB' : '#4B5563')
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.active || props.completed
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#9CA3AF' : '#6B7280')
  };
  font-weight: 600;
  font-size: 14px;
`;

const StepLabel = styled.div`
  font-size: 12px;
  color: ${props => props.active
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  font-weight: ${props => props.active ? '600' : '400'};
  text-align: center;
`;

const SectionCard = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#2D3748'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#4A5568'};
`;

const SectionTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: ${props => props.theme === 'light' ? '#374151' : '#E2E8F0'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InputGroup = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 12px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 1px ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 0 0 1px ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }
`;

const SuggestionBox = styled.div`
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  border: 1px solid ${props => props.theme === 'light' ? '#BFDBFE' : '#3B82F6'};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
`;

const SuggestionText = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#DBEAFE'};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ConfidenceBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.$confidence >= 80) {
      return props.theme === 'light' ? '#D1FAE5' : '#065F46';
    } else if (props.$confidence >= 50) {
      return props.theme === 'light' ? '#FEF3C7' : '#78350F';
    } else {
      return props.theme === 'light' ? '#FEE2E2' : '#7F1D1D';
    }
  }};
  color: ${props => {
    if (props.$confidence >= 80) {
      return props.theme === 'light' ? '#065F46' : '#D1FAE5';
    } else if (props.$confidence >= 50) {
      return props.theme === 'light' ? '#78350F' : '#FEF3C7';
    } else {
      return props.theme === 'light' ? '#991B1B' : '#FEE2E2';
    }
  }};
`;

const SuggestionUrlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const ActionButton = styled.button`
  flex: ${props => props.$fullWidth ? '1' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: ${props => props.$primary
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : props.$success
    ? (props.theme === 'light' ? '#10B981' : '#059669')
    : (props.theme === 'light' ? '#FFFFFF' : '#374151')
  };
  color: ${props => props.$primary || props.$success
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#374151' : '#F3F4F6')
  };
  border: 1px solid ${props => props.$primary || props.$success
    ? 'transparent'
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
  };
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.$primary
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : props.$success
      ? (props.theme === 'light' ? '#059669' : '#047857')
      : (props.theme === 'light' ? '#F9FAFB' : '#4B5563')
    };
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EnrichmentResult = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid ${props => props.$accepted
    ? (props.theme === 'light' ? '#10B981' : '#059669')
    : (props.theme === 'light' ? '#E5E7EB' : '#4B5563')
  };
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ResultLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ResultValue = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 4px;
`;

const AcceptRejectButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const LogoPreview = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: contain;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  padding: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
`;

const SmallButton = styled.button`
  background: ${props => props.$accept
    ? (props.theme === 'light' ? '#10B981' : '#059669')
    : 'transparent'
  };
  color: ${props => props.$accept
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#EF4444' : '#F87171')
  };
  border: 1px solid ${props => props.$accept
    ? 'transparent'
    : (props.theme === 'light' ? '#EF4444' : '#F87171')
  };
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const getModalStyles = (theme) => ({
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    background: theme === 'light' ? '#FFFFFF' : '#1F2937',
    border: theme === 'light' ? '1px solid #E5E7EB' : '1px solid #374151',
    borderRadius: '12px',
    padding: '0',
    width: '600px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1050
  }
});

if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

const CompanyEnrichmentModal = ({
  isOpen,
  onClose,
  company,
  companyDomains,
  onEnrichComplete,
  theme = 'light'
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [searchingLinkedIn, setSearchingLinkedIn] = useState(false);
  const [linkedInSuggestion, setLinkedInSuggestion] = useState(null);
  const [suggestionConfidence, setSuggestionConfidence] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState({
    description: null,
    tags: [],
    cities: [],
    domains: [],
    website: null,
    linkedin: null,
    logo_url: null,
    company_size: null,
    founded_year: null,
    technologies: [],
    confidence: null
  });
  const [acceptedFields, setAcceptedFields] = useState({
    description: false,
    tags: false,
    cities: false,
    domains: false,
    website: false,
    linkedin: false,
    logo_url: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      setLinkedinUrl(company.linkedin || '');
      setLinkedInSuggestion(null);
      setSuggestionConfidence(null);
      setCurrentStep(1);
      setEnrichmentData({
        description: null,
        tags: [],
        cities: [],
        domains: [],
        website: null,
        linkedin: null,
        logo_url: null,
        company_size: null,
        founded_year: null,
        technologies: [],
        confidence: null
      });
      setAcceptedFields({
        description: false,
        tags: false,
        cities: false,
        domains: false,
        website: false,
        linkedin: false,
        logo_url: false
      });
    }
  }, [isOpen, company]);

  const searchLinkedInUrl = async () => {
    if (!company) return;

    setSearchingLinkedIn(true);
    try {
      // Use the primary domain or first domain for search
      const primaryDomain = companyDomains?.find(d => d.is_primary)?.domain ||
                           companyDomains?.[0]?.domain ||
                           company.website;

      if (!primaryDomain) {
        toast.error('No website available for LinkedIn search');
        return;
      }

      // Call the Supabase edge function for LinkedIn URL discovery
      const response = await supabase.functions.invoke('company-linkedin-finder', {
        body: {
          companyId: company.company_id,
          website: primaryDomain,
          companyName: company.name
        }
      });

      if (response.error) {
        console.error('Error from edge function:', response.error);
        // Fallback: suggest LinkedIn URL based on company name
        const suggestedUrl = `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
        setLinkedInSuggestion(suggestedUrl);
        setSuggestionConfidence(30); // Low confidence for name-based fallback
        toast.info('Generated LinkedIn URL suggestion based on company name');
        return;
      }

      const data = response.data;

      if (data?.linkedin) {
        setLinkedInSuggestion(data.linkedin);
        setSuggestionConfidence(data.confidence || 95); // High confidence for verified URL
        toast.success('LinkedIn URL found!');
      } else if (data?.data?.linkedin) {
        setLinkedInSuggestion(data.data.linkedin);
        setSuggestionConfidence(data.data.confidence || 95); // High confidence for verified URL
        toast.success('LinkedIn URL found!');
      } else if (data?.suggestion) {
        setLinkedInSuggestion(data.suggestion);
        setSuggestionConfidence(data.confidence || 70); // Medium confidence for API suggestion
        toast.info('Generated LinkedIn URL suggestion');
      } else {
        // Fallback suggestion
        const suggestedUrl = `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
        setLinkedInSuggestion(suggestedUrl);
        setSuggestionConfidence(30); // Low confidence for name-based fallback
        toast.info('Generated LinkedIn URL suggestion based on company name');
      }
    } catch (error) {
      console.error('Error searching LinkedIn URL:', error);
      // Fallback: suggest LinkedIn URL based on company name
      const suggestedUrl = `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
      setLinkedInSuggestion(suggestedUrl);
      setSuggestionConfidence(30); // Low confidence for error fallback
      toast.warning('Using fallback LinkedIn URL suggestion');
    } finally {
      setSearchingLinkedIn(false);
    }
  };

  const handleLinkedInSearch = () => {
    const searchQuery = company?.name || '';
    const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank');
  };

  const acceptLinkedInSuggestion = () => {
    if (linkedInSuggestion) {
      setLinkedinUrl(linkedInSuggestion);
      toast.success('LinkedIn URL accepted');
    }
  };

  const saveLinkedInUrl = async () => {
    if (!linkedinUrl || !company) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ linkedin: linkedinUrl })
        .eq('company_id', company.company_id);

      if (error) throw error;

      toast.success('LinkedIn URL saved');
      setCurrentStep(2);
    } catch (error) {
      console.error('Error saving LinkedIn URL:', error);
      toast.error('Failed to save LinkedIn URL');
    }
  };

  const enrichCompanyData = async () => {
    if (!company) return;

    setEnriching(true);
    try {
      const primaryDomain = companyDomains?.find(d => d.is_primary)?.domain ||
                           companyDomains?.[0]?.domain ||
                           company.website;

      // Call the new Supabase edge function
      const response = await supabase.functions.invoke('company-enrichment', {
        body: {
          companyId: company.company_id,
          website: primaryDomain,
          companyName: company.name
        }
      });

      if (response.error) {
        throw response.error;
      }

      const data = response.data;

      if (data.success && data.data) {
        const apolloData = data.data;

        // Process the enrichment data
        const enrichedData = {
          description: apolloData.description || null,
          tags: apolloData.tags || [],
          cities: apolloData.locations ? apolloData.locations.map(loc => ({
            name: loc.city,
            state: loc.state,
            country: loc.country
          })) : [],
          domains: apolloData.domains || [],
          website: apolloData.domains?.find(d => d.is_primary)?.domain || primaryDomain,
          linkedin: apolloData.linkedin || linkedinUrl || null,
          logo_url: apolloData.logo_url || null,
          company_size: apolloData.company_size || null,
          founded_year: apolloData.founded_year || null,
          technologies: apolloData.technologies || [],
          confidence: apolloData.confidence || null
        };

        setEnrichmentData(enrichedData);

        if (apolloData.confidence) {
          if (apolloData.confidence >= 80) {
            toast.success(`Company data enriched successfully! (${apolloData.confidence}% confidence)`);
          } else if (apolloData.confidence >= 50) {
            toast.info(`Company data enriched with moderate confidence (${apolloData.confidence}%)`);
          } else {
            toast.warning(`Limited enrichment data available (${apolloData.confidence}% confidence)`);
          }
        } else {
          toast.success('Company data enriched successfully!');
        }
      } else {
        toast.warning(data.message || 'Limited enrichment data available');
      }
    } catch (error) {
      console.error('Error enriching company:', error);
      toast.error('Failed to enrich company data');
    } finally {
      setEnriching(false);
    }
  };

  const toggleFieldAcceptance = (field) => {
    setAcceptedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const saveEnrichmentData = async () => {
    if (!company) return;

    setSaving(true);
    try {
      // Update company basic data
      const updateData = {};

      if (acceptedFields.description && enrichmentData.description) {
        updateData.description = enrichmentData.description;
      }

      if (acceptedFields.linkedin && enrichmentData.linkedin) {
        updateData.linkedin = enrichmentData.linkedin;
      }

      // Handle logo URL by creating an attachment and linking it
      if (acceptedFields.logo_url && enrichmentData.logo_url) {
        try {
          // First, remove any existing logo attachments
          const { data: existingLogos } = await supabase
            .from('company_attachments')
            .select('attachment_id')
            .eq('company_id', company.company_id)
            .eq('is_logo', true);

          if (existingLogos && existingLogos.length > 0) {
            // Delete existing logo attachments
            for (const logo of existingLogos) {
              await supabase
                .from('attachments')
                .delete()
                .eq('attachment_id', logo.attachment_id);

              await supabase
                .from('company_attachments')
                .delete()
                .eq('attachment_id', logo.attachment_id);
            }
          }

          // Create new attachment record for the logo URL
          const { data: newAttachment, error: attachmentError } = await supabase
            .from('attachments')
            .insert({
              file_name: `${company.name}_logo`,
              file_url: enrichmentData.logo_url,
              permanent_url: enrichmentData.logo_url,
              file_type: 'image',
              description: `Company logo for ${company.name}`,
              processed: true,
              processing_status: 'completed'
            })
            .select()
            .single();

          if (attachmentError) {
            console.error('Error creating logo attachment:', attachmentError);
          } else if (newAttachment) {
            // Link the attachment to the company as a logo
            const { error: linkError } = await supabase
              .from('company_attachments')
              .insert({
                company_id: company.company_id,
                attachment_id: newAttachment.attachment_id,
                is_logo: true
              });

            if (linkError) {
              console.error('Error linking logo to company:', linkError);
            }
          }
        } catch (error) {
          console.error('Error handling logo:', error);
        }
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('companies')
          .update(updateData)
          .eq('company_id', company.company_id);

        if (error) throw error;
      }

      // Handle domains
      if (acceptedFields.domains && enrichmentData.domains.length > 0) {
        // First, remove existing non-primary domains if we're updating
        await supabase
          .from('company_domains')
          .delete()
          .eq('company_id', company.company_id)
          .eq('is_primary', false);

        // Add new domains
        for (const domainData of enrichmentData.domains) {
          await supabase
            .from('company_domains')
            .upsert({
              company_id: company.company_id,
              domain: domainData.domain,
              is_primary: domainData.is_primary
            });
        }
      }

      // Handle tags
      if (acceptedFields.tags && enrichmentData.tags.length > 0) {
        for (const tagName of enrichmentData.tags) {
          // Check if tag exists
          let { data: tag, error: tagError } = await supabase
            .from('tags')
            .select('tag_id')
            .eq('name', tagName)
            .single();

          if (!tag) {
            // Create tag
            const { data: newTag, error: createError } = await supabase
              .from('tags')
              .insert({ name: tagName })
              .select('tag_id')
              .single();

            if (createError) continue;
            tag = newTag;
          }

          // Link to company
          await supabase
            .from('company_tags')
            .upsert({
              company_id: company.company_id,
              tag_id: tag.tag_id
            });
        }
      }

      // Handle cities
      if (acceptedFields.cities && enrichmentData.cities.length > 0) {
        for (const cityData of enrichmentData.cities) {
          // Check if city exists
          let { data: city, error: cityError } = await supabase
            .from('cities')
            .select('city_id')
            .eq('name', cityData.name)
            .single();

          if (!city) {
            // Create city
            const { data: newCity, error: createError } = await supabase
              .from('cities')
              .insert({
                name: cityData.name,
                country: cityData.country || 'Unknown'
              })
              .select('city_id')
              .single();

            if (createError) continue;
            city = newCity;
          }

          // Link to company
          await supabase
            .from('company_cities')
            .upsert({
              company_id: company.company_id,
              city_id: city.city_id
            });
        }
      }

      toast.success('Enrichment data saved successfully!');

      if (onEnrichComplete) {
        onEnrichComplete();
      }

      onClose();
    } catch (error) {
      console.error('Error saving enrichment data:', error);
      toast.error('Failed to save enrichment data');
    } finally {
      setSaving(false);
    }
  };

  if (!company) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={getModalStyles(theme)}
      contentLabel={`Enrich Company: ${company.name}`}
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>
          <FaBuilding /> Enrich Company: {company.name}
        </ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>

      <ModalContent theme={theme}>
        <StepIndicator theme={theme}>
          <Step>
            <StepCircle theme={theme} active={currentStep === 1} completed={currentStep > 1}>
              {currentStep > 1 ? <FiCheck /> : '1'}
            </StepCircle>
            <StepLabel theme={theme} active={currentStep === 1}>
              LinkedIn URL
            </StepLabel>
          </Step>
          <Step>
            <StepCircle theme={theme} active={currentStep === 2} completed={currentStep > 2}>
              {currentStep > 2 ? <FiCheck /> : '2'}
            </StepCircle>
            <StepLabel theme={theme} active={currentStep === 2}>
              Enrich Data
            </StepLabel>
          </Step>
        </StepIndicator>

        {currentStep === 1 && (
          <>
            <SectionCard theme={theme}>
              <SectionTitle theme={theme}>
                <FaLinkedin /> Find LinkedIn URL
              </SectionTitle>

              {linkedInSuggestion && (
                <SuggestionBox theme={theme}>
                  <SuggestionText theme={theme}>
                    <span>Suggested LinkedIn URL found:</span>
                    <ConfidenceBadge theme={theme} $confidence={suggestionConfidence}>
                      {suggestionConfidence}% Confidence
                    </ConfidenceBadge>
                  </SuggestionText>
                  <SuggestionUrlRow>
                    <Input
                      theme={theme}
                      type="text"
                      value={linkedInSuggestion}
                      readOnly
                      style={{ flex: 1 }}
                    />
                    <ActionButton
                      theme={theme}
                      onClick={() => window.open(linkedInSuggestion, '_blank')}
                      title="Preview LinkedIn page"
                    >
                      <FiExternalLink /> Preview
                    </ActionButton>
                  </SuggestionUrlRow>
                  <ButtonRow>
                    <ActionButton
                      theme={theme}
                      $success
                      $fullWidth
                      onClick={acceptLinkedInSuggestion}
                    >
                      <FiCheck /> Accept Suggestion
                    </ActionButton>
                  </ButtonRow>
                </SuggestionBox>
              )}

              <ButtonRow>
                <ActionButton
                  theme={theme}
                  $primary
                  $fullWidth
                  onClick={searchLinkedInUrl}
                  disabled={searchingLinkedIn}
                >
                  {searchingLinkedIn ? (
                    <>
                      <FiLoader className="animate-spin" /> Searching...
                    </>
                  ) : (
                    <>
                      <FiSearch /> Search via Apollo
                    </>
                  )}
                </ActionButton>
                <ActionButton
                  theme={theme}
                  onClick={handleLinkedInSearch}
                >
                  <FiExternalLink /> Search on LinkedIn
                </ActionButton>
              </ButtonRow>

              <InputGroup>
                <Label theme={theme}>LinkedIn Company URL</Label>
                <Input
                  theme={theme}
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/example"
                />
              </InputGroup>

              <ActionButton
                theme={theme}
                $success
                $fullWidth
                onClick={saveLinkedInUrl}
                disabled={!linkedinUrl}
              >
                <FiSave /> Save & Continue
              </ActionButton>
            </SectionCard>
          </>
        )}

        {currentStep === 2 && (
          <>
            <SectionCard theme={theme}>
              <SectionTitle theme={theme}>
                <FiDatabase /> Fetch Company Data
              </SectionTitle>

              {!enrichmentData.description && !enriching && (
                <ActionButton
                  theme={theme}
                  $primary
                  $fullWidth
                  onClick={enrichCompanyData}
                  disabled={enriching}
                >
                  {enriching ? (
                    <>
                      <FiLoader className="animate-spin" /> Enriching...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw /> Fetch Data from Apollo
                    </>
                  )}
                </ActionButton>
              )}

              {enrichmentData.confidence && (
                <SectionCard theme={theme} style={{ marginBottom: '16px' }}>
                  <SectionTitle theme={theme}>
                    Data Quality Score:
                    <ConfidenceBadge theme={theme} $confidence={enrichmentData.confidence}>
                      {enrichmentData.confidence}% Confidence
                    </ConfidenceBadge>
                  </SectionTitle>
                </SectionCard>
              )}

              {enrichmentData.description && (
                <>
                  {enrichmentData.logo_url && (
                    <EnrichmentResult theme={theme} $accepted={acceptedFields.logo_url}>
                      <ResultHeader>
                        <ResultLabel theme={theme}>
                          <FiImage /> Company Logo
                        </ResultLabel>
                        <AcceptRejectButtons>
                          <SmallButton
                            theme={theme}
                            $accept
                            onClick={() => toggleFieldAcceptance('logo_url')}
                          >
                            {acceptedFields.logo_url ? '✓ Accepted' : 'Accept'}
                          </SmallButton>
                        </AcceptRejectButtons>
                      </ResultHeader>
                      <LogoPreview theme={theme} src={enrichmentData.logo_url} alt="Company logo" />
                    </EnrichmentResult>
                  )}

                  <EnrichmentResult theme={theme} $accepted={acceptedFields.description}>
                    <ResultHeader>
                      <ResultLabel theme={theme}>
                        <FaFileAlt /> Description
                      </ResultLabel>
                      <AcceptRejectButtons>
                        <SmallButton
                          theme={theme}
                          $accept
                          onClick={() => toggleFieldAcceptance('description')}
                        >
                          {acceptedFields.description ? '✓ Accepted' : 'Accept'}
                        </SmallButton>
                      </AcceptRejectButtons>
                    </ResultHeader>
                    <ResultValue theme={theme}>
                      {enrichmentData.description}
                    </ResultValue>
                  </EnrichmentResult>

                  {enrichmentData.tags.length > 0 && (
                    <EnrichmentResult theme={theme} $accepted={acceptedFields.tags}>
                      <ResultHeader>
                        <ResultLabel theme={theme}>
                          <FaTags /> Tags/Industries
                        </ResultLabel>
                        <AcceptRejectButtons>
                          <SmallButton
                            theme={theme}
                            $accept
                            onClick={() => toggleFieldAcceptance('tags')}
                          >
                            {acceptedFields.tags ? '✓ Accepted' : 'Accept'}
                          </SmallButton>
                        </AcceptRejectButtons>
                      </ResultHeader>
                      <ResultValue theme={theme}>
                        {enrichmentData.tags.join(', ')}
                      </ResultValue>
                    </EnrichmentResult>
                  )}

                  {enrichmentData.cities.length > 0 && (
                    <EnrichmentResult theme={theme} $accepted={acceptedFields.cities}>
                      <ResultHeader>
                        <ResultLabel theme={theme}>
                          <FaMapMarkerAlt /> Locations
                        </ResultLabel>
                        <AcceptRejectButtons>
                          <SmallButton
                            theme={theme}
                            $accept
                            onClick={() => toggleFieldAcceptance('cities')}
                          >
                            {acceptedFields.cities ? '✓ Accepted' : 'Accept'}
                          </SmallButton>
                        </AcceptRejectButtons>
                      </ResultHeader>
                      <ResultValue theme={theme}>
                        {enrichmentData.cities.map(c =>
                          `${c.name}${c.country ? `, ${c.country}` : ''}`
                        ).join('; ')}
                      </ResultValue>
                    </EnrichmentResult>
                  )}

                  {enrichmentData.domains && enrichmentData.domains.length > 0 && (
                    <EnrichmentResult theme={theme} $accepted={acceptedFields.domains}>
                      <ResultHeader>
                        <ResultLabel theme={theme}>
                          <FaServer /> Domains
                        </ResultLabel>
                        <AcceptRejectButtons>
                          <SmallButton
                            theme={theme}
                            $accept
                            onClick={() => toggleFieldAcceptance('domains')}
                          >
                            {acceptedFields.domains ? '✓ Accepted' : 'Accept'}
                          </SmallButton>
                        </AcceptRejectButtons>
                      </ResultHeader>
                      <ResultValue theme={theme}>
                        {enrichmentData.domains.map((d, idx) => (
                          <div key={idx}>
                            {d.domain} {d.is_primary && <strong>(Primary)</strong>}
                          </div>
                        ))}
                      </ResultValue>
                    </EnrichmentResult>
                  )}

                  {(enrichmentData.company_size || enrichmentData.founded_year) && (
                    <EnrichmentResult theme={theme} $accepted={false}>
                      <ResultHeader>
                        <ResultLabel theme={theme}>
                          <FiUsers /> Company Info
                        </ResultLabel>
                      </ResultHeader>
                      <ResultValue theme={theme}>
                        {enrichmentData.company_size && (
                          <div>Employees: {enrichmentData.company_size.toLocaleString()}</div>
                        )}
                        {enrichmentData.founded_year && (
                          <div>Founded: {enrichmentData.founded_year}</div>
                        )}
                      </ResultValue>
                    </EnrichmentResult>
                  )}

                  {enrichmentData.technologies && enrichmentData.technologies.length > 0 && (
                    <EnrichmentResult theme={theme} $accepted={false}>
                      <ResultHeader>
                        <ResultLabel theme={theme}>
                          <FaServer /> Technologies
                        </ResultLabel>
                      </ResultHeader>
                      <ResultValue theme={theme}>
                        {enrichmentData.technologies.join(', ')}
                      </ResultValue>
                    </EnrichmentResult>
                  )}
                </>
              )}
            </SectionCard>
          </>
        )}
      </ModalContent>

      <FooterButtons theme={theme}>
        <ActionButton theme={theme} onClick={onClose}>
          Cancel
        </ActionButton>
        {currentStep === 2 && enrichmentData.description && (
          <ActionButton
            theme={theme}
            $success
            onClick={saveEnrichmentData}
            disabled={saving || !Object.values(acceptedFields).some(v => v)}
          >
            {saving ? (
              <>
                <FiLoader className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FiSave /> Save Accepted Data
              </>
            )}
          </ActionButton>
        )}
      </FooterButtons>
    </Modal>
  );
};

export default CompanyEnrichmentModal;