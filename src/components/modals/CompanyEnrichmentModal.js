import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiCheck, FiLoader, FiSave, FiExternalLink, FiSearch } from 'react-icons/fi';
import { FaBuilding, FaLinkedin, FaTags, FaFileAlt } from 'react-icons/fa';
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

const LogoPreview = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: contain;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  padding: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
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
  const [selectedTags, setSelectedTags] = useState([]); // Tags user selected from suggestions
  const [matchedTags, setMatchedTags] = useState([]); // Tags from Supabase that match Apollo data
  const [saving, setSaving] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagSearchResults, setTagSearchResults] = useState([]);
  const [searchingTags, setSearchingTags] = useState(false);

  // Helper function for auto LinkedIn search
  const doAutoLinkedInSearch = async (companyData, domains) => {
    setSearchingLinkedIn(true);
    try {
      const primaryDomain = domains?.find(d => d.is_primary)?.domain ||
                           domains?.[0]?.domain ||
                           companyData.website;

      const response = await supabase.functions.invoke('company-linkedin-finder', {
        body: {
          companyId: companyData.company_id,
          website: primaryDomain,
          companyName: companyData.name
        }
      });

      if (response.error) {
        const suggestedUrl = `https://linkedin.com/company/${companyData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
        setLinkedInSuggestion(suggestedUrl);
        setSuggestionConfidence(30);
      } else {
        const data = response.data;
        if (data?.linkedin) {
          setLinkedInSuggestion(data.linkedin);
          setSuggestionConfidence(data.confidence || 95);
        } else if (data?.data?.linkedin) {
          setLinkedInSuggestion(data.data.linkedin);
          setSuggestionConfidence(data.data.confidence || 95);
        } else if (data?.suggestion) {
          setLinkedInSuggestion(data.suggestion);
          setSuggestionConfidence(data.confidence || 70);
        } else {
          const suggestedUrl = `https://linkedin.com/company/${companyData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
          setLinkedInSuggestion(suggestedUrl);
          setSuggestionConfidence(30);
        }
      }
    } catch (error) {
      console.error('Error in auto-search:', error);
      const suggestedUrl = `https://linkedin.com/company/${companyData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
      setLinkedInSuggestion(suggestedUrl);
      setSuggestionConfidence(30);
    } finally {
      setSearchingLinkedIn(false);
    }
  };

  // Helper function for auto enrichment
  const doAutoEnrichment = async (companyData, domains, linkedIn) => {
    setEnriching(true);
    try {
      const primaryDomain = domains?.find(d => d.is_primary)?.domain ||
                           domains?.[0]?.domain ||
                           companyData?.website;

      if (!primaryDomain && !companyData?.name) {
        toast.error('No website or company name available for enrichment');
        setEnriching(false);
        return;
      }

      const response = await supabase.functions.invoke('company-enrichment', {
        body: {
          companyId: companyData.company_id,
          website: primaryDomain || undefined,
          companyName: companyData.name,
          linkedinUrl: linkedIn || companyData?.linkedin || undefined
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (data.success && data.data) {
        const apolloData = data.data;
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
          linkedin: apolloData.linkedin || linkedIn || null,
          logo_url: apolloData.logo_url || null,
          company_size: apolloData.company_size || null,
          founded_year: apolloData.founded_year || null,
          technologies: apolloData.technologies || [],
          confidence: apolloData.confidence || null
        };
        setEnrichmentData(enrichedData);

        // Fetch matching tags from Supabase based on Apollo tags/industries
        if (apolloData.tags && apolloData.tags.length > 0) {
          await fetchMatchingTags(apolloData.tags);
        }

        // Always show success - user will review data themselves
        toast.success('Company data enriched!');
      } else {
        toast(data.message || 'Limited enrichment data available', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Error enriching company:', error);
      toast.error('Failed to enrich company data');
    } finally {
      setEnriching(false);
    }
  };

  // Fetch matching tags from Supabase based on Apollo tags
  const fetchMatchingTags = async (apolloTags) => {
    try {
      // Get all tags from Supabase
      const { data: allTags, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .order('name');

      if (error) throw error;

      // Score and match tags
      const apolloTagsLower = apolloTags.map(t => t.toLowerCase());
      const scoredTags = allTags.map(tag => {
        const tagNameLower = tag.name.toLowerCase();
        let score = 0;

        // Exact match
        if (apolloTagsLower.includes(tagNameLower)) {
          score += 100;
        }

        // Partial match - Apollo tag contains Supabase tag or vice versa
        for (const apolloTag of apolloTagsLower) {
          if (apolloTag.includes(tagNameLower) || tagNameLower.includes(apolloTag)) {
            score += 50;
          }
          // Word-level matching
          const apolloWords = apolloTag.split(/[\s,&-]+/).filter(w => w.length > 2);
          const tagWords = tagNameLower.split(/[\s,&-]+/).filter(w => w.length > 2);
          for (const word of tagWords) {
            if (apolloWords.some(aw => aw.includes(word) || word.includes(aw))) {
              score += 20;
            }
          }
        }

        return { ...tag, score };
      })
        .filter(tag => tag.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15); // Top 15 matches

      setMatchedTags(scoredTags);
    } catch (error) {
      console.error('Error fetching matching tags:', error);
    }
  };

  // Search tags by query
  const searchTags = async (query) => {
    if (!query || query.length < 2) {
      setTagSearchResults([]);
      return;
    }

    setSearchingTags(true);
    try {
      const { data: tags, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);

      if (error) throw error;

      // Filter out already selected tags
      const filteredTags = tags.filter(
        tag => !selectedTags.some(t => t.tag_id === tag.tag_id)
      );
      setTagSearchResults(filteredTags);
    } catch (error) {
      console.error('Error searching tags:', error);
    } finally {
      setSearchingTags(false);
    }
  };

  // Debounced tag search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTags(tagSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [tagSearchQuery, selectedTags]);

  useEffect(() => {
    if (isOpen && company) {
      // Reset all state
      setLinkedinUrl(company.linkedin || '');
      setLinkedInSuggestion(null);
      setSuggestionConfidence(null);
      setSearchingLinkedIn(false);
      setEnriching(false);
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
      setSelectedTags([]);
      setMatchedTags([]);
      setTagSearchQuery('');
      setTagSearchResults([]);

      // If company already has LinkedIn URL, skip to step 2 and auto-enrich
      if (company.linkedin) {
        setCurrentStep(2);
        // Auto-start enrichment after a small delay
        setTimeout(() => {
          doAutoEnrichment(company, companyDomains, company.linkedin);
        }, 500);
      } else {
        setCurrentStep(1);
        // Auto-start LinkedIn search after a small delay
        setTimeout(() => {
          doAutoLinkedInSearch(company, companyDomains);
        }, 500);
      }
    }
  }, [isOpen, company, companyDomains]);

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
      toast('Using fallback LinkedIn URL suggestion', { icon: '⚠️' });
    } finally {
      setSearchingLinkedIn(false);
    }
  };

  const handleLinkedInSearch = () => {
    const searchQuery = company?.name || '';
    const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank');
  };

  const acceptLinkedInSuggestion = async () => {
    if (linkedInSuggestion && company) {
      setLinkedinUrl(linkedInSuggestion);

      // Auto-save and continue to step 2
      try {
        const { error } = await supabase
          .from('companies')
          .update({ linkedin: linkedInSuggestion })
          .eq('company_id', company.company_id);

        if (error) throw error;

        toast.success('LinkedIn URL saved');
        setCurrentStep(2);

        // Auto-start enrichment after moving to step 2
        setTimeout(() => {
          doAutoEnrichment(company, companyDomains, linkedInSuggestion);
        }, 300);
      } catch (error) {
        console.error('Error saving LinkedIn URL:', error);
        toast.error('Failed to save LinkedIn URL');
      }
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

      // Auto-start enrichment after moving to step 2
      setTimeout(() => {
        doAutoEnrichment(company, companyDomains, linkedinUrl);
      }, 300);
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

      // If no domain is available, try to extract from LinkedIn URL
      let websiteToUse = primaryDomain;
      if (!websiteToUse && linkedinUrl) {
        // Try to extract company slug from LinkedIn URL for domain hint
        const linkedinMatch = linkedinUrl.match(/linkedin\.com\/company\/([^\/]+)/);
        if (linkedinMatch) {
          // Use company name as primary search method when no domain
          console.log('No domain found, will search by company name:', company.name);
        }
      }

      if (!websiteToUse && !company.name) {
        toast.error('No website or company name available for enrichment');
        setEnriching(false);
        return;
      }

      // Call the new Supabase edge function
      const response = await supabase.functions.invoke('company-enrichment', {
        body: {
          companyId: company.company_id,
          website: websiteToUse || undefined,  // Pass undefined instead of null
          companyName: company.name,
          linkedinUrl: linkedinUrl || company.linkedin || undefined  // Pass the LinkedIn URL from state or company data!
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

        // Always show success - user will review data themselves
        toast.success('Company data enriched!');
      } else {
        toast(data.message || 'Limited enrichment data available', { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Error enriching company:', error);
      toast.error('Failed to enrich company data');
    } finally {
      setEnriching(false);
    }
  };

  const saveEnrichmentData = async () => {
    if (!company) return;

    setSaving(true);
    try {
      // Update company description
      const updateData = {};
      if (enrichmentData.description) {
        updateData.description = enrichmentData.description;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('companies')
          .update(updateData)
          .eq('company_id', company.company_id);

        if (error) throw error;
      }

      // Handle logo URL by creating an attachment and linking it
      if (enrichmentData.logo_url) {
        try {
          // First, remove any existing logo attachments
          const { data: existingLogos } = await supabase
            .from('company_attachments')
            .select('attachment_id')
            .eq('company_id', company.company_id)
            .eq('is_logo', true);

          if (existingLogos && existingLogos.length > 0) {
            for (const logo of existingLogos) {
              await supabase.from('attachments').delete().eq('attachment_id', logo.attachment_id);
              await supabase.from('company_attachments').delete().eq('attachment_id', logo.attachment_id);
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

          if (!attachmentError && newAttachment) {
            await supabase
              .from('company_attachments')
              .insert({
                company_id: company.company_id,
                attachment_id: newAttachment.attachment_id,
                is_logo: true
              });
          }
        } catch (error) {
          console.error('Error handling logo:', error);
        }
      }

      // Handle domains (save silently)
      if (enrichmentData.domains && enrichmentData.domains.length > 0) {
        for (const domainData of enrichmentData.domains) {
          // Check if domain already exists
          const { data: existing } = await supabase
            .from('company_domains')
            .select('id')
            .eq('company_id', company.company_id)
            .eq('domain', domainData.domain)
            .single();

          if (!existing) {
            await supabase
              .from('company_domains')
              .insert({
                company_id: company.company_id,
                domain: domainData.domain,
                is_primary: domainData.is_primary
              });
          }
        }
      }

      // Handle selected tags
      if (selectedTags.length > 0) {
        for (const tag of selectedTags) {
          // Check if already linked
          const { data: existing } = await supabase
            .from('company_tags')
            .select('entry_id')
            .eq('company_id', company.company_id)
            .eq('tag_id', tag.tag_id)
            .single();

          if (!existing) {
            await supabase
              .from('company_tags')
              .insert({
                company_id: company.company_id,
                tag_id: tag.tag_id
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
              {/* Loading state */}
              {enriching && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <FiLoader className="animate-spin" style={{ fontSize: 32, marginBottom: 12 }} />
                  <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    Fetching company data from Apollo...
                  </div>
                </div>
              )}

              {/* Results */}
              {enrichmentData.description && !enriching && (
                <>
                  {/* Logo and Description side by side */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                    {enrichmentData.logo_url && (
                      <LogoPreview theme={theme} src={enrichmentData.logo_url} alt="Company logo" />
                    )}
                    <div style={{ flex: 1 }}>
                      <ResultLabel theme={theme} style={{ marginBottom: 8 }}>
                        <FaFileAlt /> Description
                      </ResultLabel>
                      <ResultValue theme={theme} style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        maxHeight: 100,
                        overflow: 'auto'
                      }}>
                        {enrichmentData.description}
                      </ResultValue>
                    </div>
                  </div>

                  {/* Selectable Tags */}
                  {matchedTags.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <ResultLabel theme={theme} style={{ marginBottom: 10 }}>
                        <FaTags /> Select Tags (click to select)
                      </ResultLabel>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {matchedTags.map(tag => {
                          const isSelected = selectedTags.some(t => t.tag_id === tag.tag_id);
                          return (
                            <button
                              key={tag.tag_id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTags(prev => prev.filter(t => t.tag_id !== tag.tag_id));
                                } else {
                                  setSelectedTags(prev => [...prev, tag]);
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 16,
                                border: isSelected
                                  ? `2px solid ${theme === 'light' ? '#10B981' : '#059669'}`
                                  : `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                                background: isSelected
                                  ? (theme === 'light' ? '#D1FAE5' : '#064E3B')
                                  : (theme === 'light' ? '#F9FAFB' : '#374151'),
                                color: isSelected
                                  ? (theme === 'light' ? '#065F46' : '#6EE7B7')
                                  : (theme === 'light' ? '#374151' : '#D1D5DB'),
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontWeight: isSelected ? 600 : 400
                              }}
                            >
                              {isSelected && '✓ '}{tag.name}
                            </button>
                          );
                        })}
                      </div>
                      {selectedTags.length > 0 && (
                        <div style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: theme === 'light' ? '#059669' : '#6EE7B7'
                        }}>
                          {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline Tag Search */}
                  <div style={{ marginBottom: 16, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiSearch style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }} />
                      <input
                        type="text"
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        placeholder="Search and add more tags..."
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                          borderRadius: 6,
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          fontSize: 13,
                          outline: 'none'
                        }}
                      />
                    </div>
                    {/* Search Results Dropdown */}
                    {tagSearchResults.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 24,
                        right: 0,
                        marginTop: 4,
                        background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        borderRadius: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 10,
                        maxHeight: 200,
                        overflow: 'auto'
                      }}>
                        {tagSearchResults.map(tag => (
                          <button
                            key={tag.tag_id}
                            onClick={() => {
                              setSelectedTags(prev => [...prev, tag]);
                              setTagSearchQuery('');
                              setTagSearchResults([]);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: 'none',
                              background: 'transparent',
                              color: theme === 'light' ? '#374151' : '#D1D5DB',
                              fontSize: 13,
                              textAlign: 'left',
                              cursor: 'pointer',
                              borderBottom: `1px solid ${theme === 'light' ? '#F3F4F6' : '#374151'}`
                            }}
                            onMouseEnter={(e) => e.target.style.background = theme === 'light' ? '#F3F4F6' : '#374151'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            + {tag.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchingTags && tagSearchQuery.length >= 2 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 24,
                        right: 0,
                        marginTop: 4,
                        padding: '10px 12px',
                        background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                        border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                        borderRadius: 6,
                        fontSize: 13,
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                      }}>
                        Searching...
                      </div>
                    )}
                  </div>

                  {/* Info about what will be saved */}
                  <div style={{
                    padding: 12,
                    background: theme === 'light' ? '#F0FDF4' : '#064E3B',
                    borderRadius: 8,
                    fontSize: 12,
                    color: theme === 'light' ? '#166534' : '#86EFAC'
                  }}>
                    <strong>Will save:</strong> Logo, Description
                    {selectedTags.length > 0 && `, ${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''}`}
                    {enrichmentData.domains?.length > 0 && `, ${enrichmentData.domains.length} domain${enrichmentData.domains.length !== 1 ? 's' : ''}`}
                  </div>
                </>
              )}

              {/* No data state */}
              {!enrichmentData.description && !enriching && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                  No enrichment data available
                </div>
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

export default CompanyEnrichmentModal;