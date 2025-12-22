import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiCheck, FiLoader, FiSave, FiExternalLink, FiSearch } from 'react-icons/fi';
import { FaUser, FaLinkedin, FaBriefcase, FaBuilding, FaPhone, FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const RAILWAY_API_URL = 'https://crm-agent-api-production.up.railway.app';

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

const ResultCard = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const ResultRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ResultIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  flex-shrink: 0;
`;

const ResultContent = styled.div`
  flex: 1;
`;

const ResultLabel = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  text-transform: uppercase;
  margin-bottom: 2px;
`;

const ResultValue = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const PhotoPreview = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border: 2px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
`;

const CompanyCard = styled.div`
  background: ${props => props.theme === 'light' ? '#F0FDF4' : '#064E3B'};
  border: 1px solid ${props => props.theme === 'light' ? '#BBF7D0' : '#10B981'};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CompanyLogo = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
  background: white;
  padding: 4px;
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

const ContactEnrichmentModal = ({
  isOpen,
  onClose,
  contact,
  contactEmails = [],
  onEnrichComplete,
  theme = 'light'
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [searchingLinkedIn, setSearchingLinkedIn] = useState(false);
  const [linkedInSuggestion, setLinkedInSuggestion] = useState(null);
  const [suggestionConfidence, setSuggestionConfidence] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentData, setEnrichmentData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Get primary email from contact
  const primaryEmail = contactEmails.find(e => e.is_primary)?.email || contactEmails[0]?.email || '';

  // Auto-search LinkedIn when modal opens
  const doAutoLinkedInSearch = async () => {
    if (!contact) return;

    setSearchingLinkedIn(true);
    try {
      const response = await fetch(`${RAILWAY_API_URL}/contact/find-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: primaryEmail,
          company: contact.company_name || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.linkedin_url) {
          setLinkedInSuggestion(data.linkedin_url);
          setSuggestionConfidence(data.confidence_score || 50);

          // If high confidence and from Apollo, show extra data in suggestion
          if (data.extra?.title || data.extra?.organization_name) {
            // Store extra data for display
          }
        }
      }
    } catch (error) {
      console.error('LinkedIn search error:', error);
    } finally {
      setSearchingLinkedIn(false);
    }
  };

  // Auto-enrich with LinkedIn URL
  const doAutoEnrichment = async (linkedIn) => {
    setEnriching(true);
    try {
      const response = await fetch(`${RAILWAY_API_URL}/contact/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedin_url: linkedIn,
          first_name: contact?.first_name || '',
          last_name: contact?.last_name || '',
          email: primaryEmail
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setEnrichmentData(data.data);
          toast.success('Contact data enriched!');
        } else {
          toast.error(data.error || 'No enrichment data found');
        }
      } else {
        toast.error('Enrichment service unavailable');
      }
    } catch (error) {
      console.error('Enrichment error:', error);
      toast.error('Enrichment failed');
    } finally {
      setEnriching(false);
    }
  };

  useEffect(() => {
    if (isOpen && contact) {
      // Reset state
      setLinkedinUrl(contact.linkedin || '');
      setLinkedInSuggestion(null);
      setSuggestionConfidence(null);
      setSearchingLinkedIn(false);
      setEnriching(false);
      setEnrichmentData(null);

      // If contact already has LinkedIn URL, skip to step 2 and auto-enrich
      if (contact.linkedin) {
        setCurrentStep(2);
        setTimeout(() => {
          doAutoEnrichment(contact.linkedin);
        }, 500);
      } else {
        setCurrentStep(1);
        // Auto-start LinkedIn search
        setTimeout(() => {
          doAutoLinkedInSearch();
        }, 500);
      }
    }
  }, [isOpen, contact]);

  const searchLinkedInUrl = async () => {
    setSearchingLinkedIn(true);
    try {
      const response = await fetch(`${RAILWAY_API_URL}/contact/find-linkedin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: contact?.first_name || '',
          last_name: contact?.last_name || '',
          email: primaryEmail,
          company: contact?.company_name || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.linkedin_url) {
          setLinkedInSuggestion(data.linkedin_url);
          setSuggestionConfidence(data.confidence_score || 50);
          toast.success(data.source === 'apollo' ? 'LinkedIn URL found via Apollo!' : 'Generated LinkedIn suggestion');
        }
      }
    } catch (error) {
      console.error('LinkedIn search error:', error);
      toast.error('LinkedIn search failed');
    } finally {
      setSearchingLinkedIn(false);
    }
  };

  const handleLinkedInSearch = () => {
    const searchQuery = `${contact?.first_name || ''} ${contact?.last_name || ''} ${contact?.company_name || ''}`.trim();
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank');
  };

  const acceptLinkedInSuggestion = async () => {
    if (linkedInSuggestion && contact) {
      setLinkedinUrl(linkedInSuggestion);

      // Save LinkedIn URL to contact
      try {
        const { error } = await supabase
          .from('contacts')
          .update({ linkedin: linkedInSuggestion })
          .eq('contact_id', contact.contact_id);

        if (error) throw error;

        toast.success('LinkedIn URL saved');
        setCurrentStep(2);

        // Auto-start enrichment
        setTimeout(() => {
          doAutoEnrichment(linkedInSuggestion);
        }, 300);
      } catch (error) {
        console.error('Error saving LinkedIn URL:', error);
        toast.error('Failed to save LinkedIn URL');
      }
    }
  };

  const saveLinkedInUrl = async () => {
    if (!linkedinUrl || !contact) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ linkedin: linkedinUrl })
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      toast.success('LinkedIn URL saved');
      setCurrentStep(2);

      // Auto-start enrichment
      setTimeout(() => {
        doAutoEnrichment(linkedinUrl);
      }, 300);
    } catch (error) {
      console.error('Error saving LinkedIn URL:', error);
      toast.error('Failed to save LinkedIn URL');
    }
  };

  const saveEnrichmentData = async () => {
    if (!contact || !enrichmentData) return;

    setSaving(true);
    try {
      // Update contact fields
      const updateData = {};

      if (enrichmentData.job_title && !contact.job_role) {
        updateData.job_role = enrichmentData.job_title;
      }

      // Save profile photo URL
      if (enrichmentData.photo_url && !contact.profile_image_url) {
        updateData.profile_image_url = enrichmentData.photo_url;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('contact_id', contact.contact_id);

        if (error) throw error;
      }

      // Handle phones
      if (enrichmentData.phones && enrichmentData.phones.length > 0) {
        for (const phone of enrichmentData.phones) {
          if (phone.number) {
            // Check if phone already exists
            const { data: existing } = await supabase
              .from('contact_mobiles')
              .select('id')
              .eq('contact_id', contact.contact_id)
              .eq('number', phone.number)
              .maybeSingle();

            if (!existing) {
              await supabase.from('contact_mobiles').insert({
                contact_id: contact.contact_id,
                number: phone.number,
                is_primary: false
              });
            }
          }
        }
      }

      // Handle city
      if (enrichmentData.city) {
        // First check if contact already has this city linked (by name, case-insensitive)
        const { data: existingContactCities } = await supabase
          .from('contact_cities')
          .select('entry_id, cities(city_id, name)')
          .eq('contact_id', contact.contact_id);

        const alreadyHasCity = existingContactCities?.some(cc =>
          cc.cities?.name?.toLowerCase() === enrichmentData.city.toLowerCase()
        );

        if (!alreadyHasCity) {
          // Search for existing city in cities table
          const { data: existingCities } = await supabase
            .from('cities')
            .select('city_id')
            .ilike('name', enrichmentData.city)
            .limit(1);

          let cityId;
          if (existingCities && existingCities.length > 0) {
            cityId = existingCities[0].city_id;
          } else {
            // Create new city
            const { data: newCity } = await supabase
              .from('cities')
              .insert({ name: enrichmentData.city, country: enrichmentData.country || 'Unknown' })
              .select()
              .single();
            cityId = newCity?.city_id;
          }

          if (cityId) {
            await supabase.from('contact_cities').insert({
              contact_id: contact.contact_id,
              city_id: cityId
            });
          }
        }
      }

      // Handle company - use domain to match/create
      if (enrichmentData.organization?.name) {
        let companyId = null;

        // Extract domain from organization data (Apollo provides website_url or website)
        const websiteUrl = enrichmentData.organization.primary_domain ||
          enrichmentData.organization.website_url ||
          enrichmentData.organization.website;
        const companyDomain = websiteUrl?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

        if (companyDomain) {
          // Check if domain exists in company_domains table
          const { data: existingDomain } = await supabase
            .from('company_domains')
            .select('company_id')
            .eq('domain', companyDomain)
            .maybeSingle();

          if (existingDomain) {
            // Domain exists, use that company
            companyId = existingDomain.company_id;
          } else if (enrichmentData.company_match?.exists_in_db) {
            // Domain doesn't exist but company already exists in CRM - use existing company and add domain
            companyId = enrichmentData.company_match.company_id;
            // Add the domain to the existing company
            await supabase.from('company_domains').insert({
              company_id: companyId,
              domain: companyDomain,
              is_primary: false
            });
          } else {
            // Domain doesn't exist and no company match - create new company, then link domain
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: enrichmentData.organization.name,
                website: websiteUrl || null,
                linkedin: enrichmentData.organization.linkedin_url || null,
                description: enrichmentData.organization.industry || null
              })
              .select()
              .single();

            if (!companyError && newCompany) {
              companyId = newCompany.company_id;

              // Create domain link
              await supabase.from('company_domains').insert({
                company_id: companyId,
                domain: companyDomain,
                is_primary: true
              });
            }
          }
        } else if (enrichmentData.company_match?.exists_in_db) {
          // No domain but we have a match from Apollo
          companyId = enrichmentData.company_match.company_id;
        }

        if (companyId) {
          // Check if already linked to contact
          const { data: existingCompanyLink } = await supabase
            .from('contact_companies')
            .select('id')
            .eq('contact_id', contact.contact_id)
            .eq('company_id', companyId)
            .maybeSingle();

          if (!existingCompanyLink) {
            await supabase.from('contact_companies').insert({
              contact_id: contact.contact_id,
              company_id: companyId,
              is_primary: true
            });
          }
        }
      }

      toast.success('Enrichment data saved!');

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

  if (!contact) return null;

  const contactName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={getModalStyles(theme)}
      contentLabel={`Enrich Contact: ${contactName}`}
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>
          <FaUser /> Enrich Contact: {contactName}
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
          <SectionCard theme={theme}>
            <SectionTitle theme={theme}>
              <FaLinkedin /> Find LinkedIn URL
            </SectionTitle>

            {linkedInSuggestion && (
              <SuggestionBox theme={theme}>
                <SuggestionText theme={theme}>
                  <span>LinkedIn URL found:</span>
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
                    <FiCheck /> Accept & Continue
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
                    <FiLoader className="animate-spin" /> Searching Apollo...
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
              <Label theme={theme}>LinkedIn Profile URL</Label>
              <Input
                theme={theme}
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
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
        )}

        {currentStep === 2 && (
          <SectionCard theme={theme}>
            {/* Loading state */}
            {enriching && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <FiLoader className="animate-spin" style={{ fontSize: 32, marginBottom: 12 }} />
                <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                  Fetching contact data from Apollo...
                </div>
              </div>
            )}

            {/* Results */}
            {enrichmentData && !enriching && (
              <>
                <ResultCard theme={theme}>
                  {/* Photo */}
                  {enrichmentData.photo_url && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <PhotoPreview theme={theme} src={enrichmentData.photo_url} alt="Profile photo" />
                    </div>
                  )}

                  {/* Job Title */}
                  {enrichmentData.job_title && (
                    <ResultRow>
                      <ResultIcon theme={theme}><FaBriefcase size={14} /></ResultIcon>
                      <ResultContent>
                        <ResultLabel theme={theme}>Job Title</ResultLabel>
                        <ResultValue theme={theme}>{enrichmentData.job_title}</ResultValue>
                      </ResultContent>
                    </ResultRow>
                  )}

                  {/* City */}
                  {enrichmentData.city && (
                    <ResultRow>
                      <ResultIcon theme={theme}><FaMapMarkerAlt size={14} /></ResultIcon>
                      <ResultContent>
                        <ResultLabel theme={theme}>Location</ResultLabel>
                        <ResultValue theme={theme}>
                          {enrichmentData.city}
                          {enrichmentData.state && `, ${enrichmentData.state}`}
                          {enrichmentData.country && ` (${enrichmentData.country})`}
                        </ResultValue>
                      </ResultContent>
                    </ResultRow>
                  )}

                  {/* Phones */}
                  {enrichmentData.phones && enrichmentData.phones.length > 0 && (
                    <ResultRow>
                      <ResultIcon theme={theme}><FaPhone size={14} /></ResultIcon>
                      <ResultContent>
                        <ResultLabel theme={theme}>Phone Numbers</ResultLabel>
                        {enrichmentData.phones.map((phone, idx) => (
                          <ResultValue key={idx} theme={theme}>{phone.number} ({phone.type})</ResultValue>
                        ))}
                      </ResultContent>
                    </ResultRow>
                  )}
                </ResultCard>

                {/* Company */}
                {enrichmentData.organization?.name && (
                  <CompanyCard theme={theme}>
                    {enrichmentData.organization.logo_url && (
                      <CompanyLogo src={enrichmentData.organization.logo_url} alt="" />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: theme === 'light' ? '#065F46' : '#6EE7B7' }}>
                        {enrichmentData.organization.name}
                      </div>
                      <div style={{ fontSize: 12, color: theme === 'light' ? '#047857' : '#A7F3D0' }}>
                        {enrichmentData.organization.industry}
                        {enrichmentData.organization.employee_count && ` • ${enrichmentData.organization.employee_count.toLocaleString()} employees`}
                      </div>
                      {enrichmentData.company_match?.exists_in_db && (
                        <div style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>
                          ✓ Already in your CRM
                        </div>
                      )}
                    </div>
                  </CompanyCard>
                )}

                {/* Summary */}
                <div style={{
                  padding: 12,
                  marginTop: 12,
                  background: theme === 'light' ? '#F0FDF4' : '#064E3B',
                  borderRadius: 8,
                  fontSize: 12,
                  color: theme === 'light' ? '#166534' : '#86EFAC'
                }}>
                  <strong>Will save:</strong>{' '}
                  {[
                    enrichmentData.photo_url && !contact.profile_image_url && 'Profile Photo',
                    enrichmentData.job_title && !contact.job_role && 'Job Title',
                    enrichmentData.phones?.length > 0 && 'Phone Numbers',
                    enrichmentData.city && 'City',
                    enrichmentData.organization?.name && 'Company Link'
                  ].filter(Boolean).join(', ')}
                </div>
              </>
            )}

            {/* No data state */}
            {!enrichmentData && !enriching && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                No enrichment data available
              </div>
            )}
          </SectionCard>
        )}
      </ModalContent>

      <FooterButtons theme={theme}>
        <ActionButton theme={theme} onClick={onClose}>
          Cancel
        </ActionButton>
        {currentStep === 2 && enrichmentData && (
          <ActionButton
            theme={theme}
            $success
            onClick={saveEnrichmentData}
            disabled={saving}
          >
            {saving ? (
              <>
                <FiLoader className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FiSave /> Save
              </>
            )}
          </ActionButton>
        )}
      </FooterButtons>
    </Modal>
  );
};

export default ContactEnrichmentModal;
