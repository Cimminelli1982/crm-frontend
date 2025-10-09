import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
`;

export const LoadingText = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

export const ContactsListContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

export const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

export const EmptyTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

export const EmptyText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  margin: 0;
`;

// Modal Components
export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ModalContent = styled.div`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  line-height: 1.5;
`;

export const ContactSummary = styled.div`
  background: ${props => props.theme === 'light' ? '#F8FAFC' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#E2E8F0' : '#E2E8F0'};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;

  div {
    margin: 4px 0;
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#1F2937' : '#1F2937'};
  }
`;

export const WarningText = styled.div`
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#F59E0B'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#F59E0B' : '#D97706'};
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
`;

export const CheckboxContainer = styled.div`
  margin: 20px 0;
`;

export const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CheckboxItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#FFFFFF'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#E5E7EB'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#F3F4F6'};
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#D1D5DB'};
  }

  label {
    font-size: 14px;
    color: ${props => props.theme === 'light' ? '#374151' : '#374151'};
    cursor: pointer;
    flex: 1;
  }
`;

export const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

export const CancelButton = styled.button`
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const DeleteButton = styled.button`
  background: #EF4444;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #DC2626;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Keep in Touch specific styled components for actions and modal
export const FrequencyModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
`;

export const FrequencyModalHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    font-size: 18px;
    font-weight: 600;
  }
`;

export const FrequencyModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  }
`;

export const FrequencyModalBody = styled.div`
  padding: 20px;
`;

export const ContactNameDisplay = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
`;

export const FrequencyOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
`;

export const FrequencyOption = styled.button`
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#F9FAFB' : '#374151')
  };
  color: ${props => props.$selected
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#111827' : '#F9FAFB')
  };
  border: 1px solid ${props => props.$selected
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
  };
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  text-align: left;

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : (props.theme === 'light' ? '#F3F4F6' : '#4B5563')
    };
  }
`;

export const UpdateFrequencyButton = styled.button`
  background: #10B981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const BirthdayInputContainer = styled.div`
  margin-bottom: 20px;
`;

export const BirthdayLabel = styled.label`
  display: block;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`;

export const BirthdayInput = styled.input`
  width: 100%;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    ring: 2px solid ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  &::-webkit-calendar-picker-indicator {
    filter: ${props => props.theme === 'light' ? 'none' : 'invert(1)'};
  }
`;

export const InfoIconButton = styled.button`
  width: 100%;
  height: 100%;
  background: #F3F4F6;
  border: none;
  border-radius: 50%;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: #E5E7EB;
    color: #374151;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Quick Edit Associate Company Modal Component
export const QuickEditAssociateCompanyModal = ({ theme, contact, contactCompanies, onCompanyAdded, onCompanyRemoved, onClose, onCreateCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [removingCompany, setRemovingCompany] = useState(null);
  const [emailDomains, setEmailDomains] = useState([]);
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const [apolloCompanySuggestion, setApolloCompanySuggestion] = useState(null);
  const [loadingApolloSuggestion, setLoadingApolloSuggestion] = useState(false);

  // Calculate similarity percentage between two strings using Levenshtein distance
  const calculateSimilarity = (str1, str2) => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    const distance = matrix[len1][len2];
    return ((maxLen - distance) / maxLen) * 100;
  };

  // Fetch similar companies based on domain suggestions
  const fetchSimilarCompanies = async (domainSuggestions) => {
    if (!domainSuggestions || domainSuggestions.length === 0) {
      setSimilarCompanies([]);
      return;
    }

    try {
      // Get all companies from database
      const { data: allCompanies, error } = await supabase
        .from('companies')
        .select('company_id, name, category')
        .limit(500); // Limit to prevent performance issues

      if (error) throw error;

      const similarMatches = [];

      for (const domainSuggestion of domainSuggestions) {
        for (const company of allCompanies || []) {
          const domainLower = domainSuggestion.toLowerCase();
          const companyLower = company.name.toLowerCase();

          // Debug specific case
          if (companyLower.includes('exceptional')) {
            console.log(`🔍 Processing company: "${company.name}" for domain: "${domainSuggestion}"`);
          }

          // Calculate similarity in multiple ways to catch edge cases
          const directSimilarity = calculateSimilarity(domainLower, companyLower);

          // Also try without spaces/punctuation for better matching
          const domainClean = domainLower.replace(/[^a-z0-9]/g, '');
          const companyClean = companyLower.replace(/[^a-z0-9]/g, '');
          const cleanSimilarity = calculateSimilarity(domainClean, companyClean);

          // Try language-aware matching (arte = art, etc.)
          const domainNormalized = domainClean.replace(/arte$/, 'art').replace(/art$/, 'art');
          const companyNormalized = companyClean.replace(/arte$/, 'art').replace(/art$/, 'art');
          const normalizedSimilarity = calculateSimilarity(domainNormalized, companyNormalized);

          // Check if domain is a prefix/substring of company name (high priority match)
          let substringScore = 0;
          if (companyClean.startsWith(domainClean) || domainClean.startsWith(companyClean)) {
            // Perfect prefix match gets 95% score
            substringScore = 95;
            if (companyLower.includes('exceptional')) {
              console.log(`🎯 PREFIX MATCH: "${domainClean}" and "${companyClean}" - score: 95`);
            }
          } else if (companyClean.includes(domainClean) || domainClean.includes(companyClean)) {
            // Substring match gets 85% score
            substringScore = 85;
            if (companyLower.includes('exceptional')) {
              console.log(`🎯 SUBSTRING MATCH: "${domainClean}" and "${companyClean}" - score: 85`);
            }
          }

          // Use the highest similarity score from all methods
          const similarity = Math.max(directSimilarity, cleanSimilarity, normalizedSimilarity, substringScore);

          // Debug logging only for matches above threshold
          if (similarity >= 70 && (domainLower.includes('exceptional') || companyLower.includes('exceptional'))) {
            console.log(`✅ MATCH: "${domainLower}" vs "${companyLower}":`, {
              direct: directSimilarity,
              clean: cleanSimilarity,
              normalized: normalizedSimilarity,
              substring: substringScore,
              final: similarity
            });
          }

          if (similarity >= 70) {
            // Check if company is already in the contact's associations
            const isAlreadyAssociated = contactCompanies.some(
              relation => relation.companies?.company_id === company.company_id
            );

            if (!isAlreadyAssociated) {
              similarMatches.push({
                ...company,
                similarity: Math.round(similarity),
                originalDomain: domainSuggestion
              });
            }
          }
        }
      }

      // Sort by similarity percentage (highest first) and remove duplicates
      const uniqueMatches = similarMatches
        .filter((company, index, self) =>
          self.findIndex(c => c.company_id === company.company_id) === index
        )
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5); // Limit to top 5 matches

      setSimilarCompanies(uniqueMatches);
      console.log(`🔍 Fuzzy matching results for domains [${domainSuggestions}]:`, uniqueMatches);
    } catch (err) {
      console.error('Error fetching similar companies:', err);
      setSimilarCompanies([]);
    }
  };

  // Fetch email domains from contact emails
  const fetchEmailDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_emails')
        .select('email')
        .eq('contact_id', contact.contact_id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setEmailDomains([]);
        return;
      }

      // Extract domains from emails and remove duplicates
      const domains = data
        .map(item => {
          const email = item.email;
          if (!email || !email.includes('@')) return null;
          const domain = email.substring(email.indexOf('@') + 1);
          // Convert domain to potential company name (capitalize first letter)
          const companyName = domain.split('.')[0];
          return companyName.charAt(0).toUpperCase() + companyName.slice(1);
        })
        .filter(domain => domain && domain.length > 1) // Filter out null and single character domains
        .filter((domain, index, self) => self.indexOf(domain) === index); // Remove duplicates

      setEmailDomains(domains);

      // Fetch similar companies based on domain suggestions
      await fetchSimilarCompanies(domains);
    } catch (err) {
      console.error('Error fetching email domains:', err);
      setEmailDomains([]);
      setSimilarCompanies([]);
    }
  };

  // Fetch company suggestions
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 3) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out companies that are already associated
      const filteredSuggestions = data.filter(company => {
        const companyId = company.company_id || company.id;
        return !contactCompanies.some(relation => {
          const relationCompanyId = relation.companies?.company_id || relation.companies?.id;
          return relationCompanyId === companyId;
        });
      });

      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error fetching company suggestions:', err);
    }
  };

  // Fetch Apollo company suggestions
  const fetchApolloCompanySuggestion = async () => {
    if (!contact) return;

    setLoadingApolloSuggestion(true);
    try {
      // For now, simulate Apollo response with edge function
      // In production, this would call the actual Apollo API
      const response = await supabase.functions.invoke('company-finder', {
        body: {
          contactId: contact.contact_id,
          linkedin: contact.linkedin,
          firstName: contact.first_name,
          lastName: contact.last_name
        }
      });

      if (response.error) {
        console.error('Company finder error:', response.error);
        // Fallback to email domain suggestions if available
        if (emailDomains.length > 0) {
          setApolloCompanySuggestion({
            name: emailDomains[0],
            domain: `${emailDomains[0].toLowerCase()}.com`,
            confidence: 75,
            source: 'email_domain'
          });
        } else {
          setApolloCompanySuggestion(null);
        }
        return;
      }

      const data = response.data;

      if (data.success && data.company) {
        setApolloCompanySuggestion({
          name: data.company.name,
          domain: data.company.domain,
          industry: data.company.industry,
          size: data.company.employee_count,
          description: data.company.description,
          confidence: data.confidence || 90
        });
      } else if (emailDomains.length > 0) {
        // Fallback to email domain
        setApolloCompanySuggestion({
          name: emailDomains[0],
          domain: `${emailDomains[0].toLowerCase()}.com`,
          confidence: 75,
          source: 'email_domain'
        });
      } else {
        setApolloCompanySuggestion(null);
      }
    } catch (error) {
      console.error('Error loading Apollo company suggestion:', error);
      // Fallback to email domain suggestions
      if (emailDomains.length > 0) {
        setApolloCompanySuggestion({
          name: emailDomains[0],
          domain: `${emailDomains[0].toLowerCase()}.com`,
          confidence: 75,
          source: 'email_domain'
        });
      } else {
        setApolloCompanySuggestion(null);
      }
    } finally {
      setLoadingApolloSuggestion(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 3) {
      fetchCompanySuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, contactCompanies]);

  // Fetch email domains and Apollo suggestions when modal opens
  useEffect(() => {
    if (contact) {
      fetchEmailDomains();
      // Fetch Apollo suggestions (will use LinkedIn if available, fallback to email)
      fetchApolloCompanySuggestion();
    }
  }, [contact]);

  const handleAddCompany = async (company) => {
    try {
      setLoading(true);

      // Add relationship in contact_companies table
      const { error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.contact_id,
          company_id: company.company_id || company.id
        });

      if (error) throw error;

      onCompanyAdded();
      setSearchTerm('');
      setShowSuggestions(false);
      toast.success('Company association added successfully');
    } catch (err) {
      console.error('Error adding company:', err);
      toast.error('Failed to add company association');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompany = async (companyRelation) => {
    try {
      setRemovingCompany(companyRelation.contact_companies_id);

      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('contact_companies_id', companyRelation.contact_companies_id);

      if (error) throw error;

      onCompanyRemoved();
      toast.success('Company association removed successfully');
    } catch (err) {
      console.error('Error removing company:', err);
      toast.error('Failed to remove company association');
    } finally {
      setRemovingCompany(null);
    }
  };

  return (
    <QuickEditCompanyModalContainer theme={theme}>
      <QuickEditCompanyModalHeader theme={theme}>
        <QuickEditCompanyModalTitle theme={theme}>Manage Company Associations</QuickEditCompanyModalTitle>
        <QuickEditCompanyModalCloseButton theme={theme} onClick={onClose}>
          ×
        </QuickEditCompanyModalCloseButton>
      </QuickEditCompanyModalHeader>

      <QuickEditCompanyModalContent theme={theme}>
        {/* Associated Companies Section */}
        <QuickEditCompanyModalSection>
          <QuickEditCompanyModalSectionTitle theme={theme}>Current Associations</QuickEditCompanyModalSectionTitle>
          {contactCompanies.length === 0 ? (
            <QuickEditCompanyEmptyMessage theme={theme}>
              No companies associated with this contact
            </QuickEditCompanyEmptyMessage>
          ) : (
            <QuickEditCompanyList>
              {contactCompanies.map((companyRelation) => (
                <QuickEditCompanyTag key={companyRelation.contact_companies_id} theme={theme}>
                  <QuickEditCompanyTagContent>
                    <QuickEditCompanyTagName theme={theme}>
                      {companyRelation.companies?.name || 'Unknown Company'}
                      {companyRelation.is_primary && (
                        <QuickEditPrimaryBadge theme={theme}>Primary</QuickEditPrimaryBadge>
                      )}
                    </QuickEditCompanyTagName>

                    {/* Relationship Type */}
                    <QuickEditCompanyTagDetails theme={theme}>
                      Relationship: {companyRelation.relationship ?
                        companyRelation.relationship.charAt(0).toUpperCase() + companyRelation.relationship.slice(1).replace('_', ' ')
                        : 'Not Set'}
                    </QuickEditCompanyTagDetails>

                    {companyRelation.companies?.category && (
                      <QuickEditCompanyTagDetails theme={theme}>
                        Category: {companyRelation.companies.category}
                      </QuickEditCompanyTagDetails>
                    )}
                  </QuickEditCompanyTagContent>
                  <QuickEditCompanyRemoveButton
                    theme={theme}
                    onClick={() => handleRemoveCompany(companyRelation)}
                    disabled={removingCompany === companyRelation.contact_companies_id}
                  >
                    {removingCompany === companyRelation.contact_companies_id ? '...' : '×'}
                  </QuickEditCompanyRemoveButton>
                </QuickEditCompanyTag>
              ))}
            </QuickEditCompanyList>
          )}
        </QuickEditCompanyModalSection>

        {/* Add Companies Section */}
        <QuickEditCompanyModalSection>
          <QuickEditCompanyModalSectionTitle theme={theme}>Add Company</QuickEditCompanyModalSectionTitle>

          {/* Apollo Company Suggestion */}
          {(loadingApolloSuggestion || apolloCompanySuggestion) && searchTerm.length < 3 && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              background: theme === 'light' ? '#EBF5FF' : '#1E3A8A',
              border: `1px solid ${theme === 'light' ? '#3B82F6' : '#60A5FA'}`,
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: theme === 'light' ? '#1E40AF' : '#93C5FD',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🎯 Apollo Suggestion
              </div>

              {loadingApolloSuggestion ? (
                <div style={{
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}>
                  Loading Apollo suggestion...
                </div>
              ) : apolloCompanySuggestion ? (
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        marginBottom: '4px'
                      }}>
                        {apolloCompanySuggestion.name}
                      </div>
                      {apolloCompanySuggestion.industry && (
                        <div style={{
                          fontSize: '11px',
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                        }}>
                          {apolloCompanySuggestion.industry}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme === 'light' ? '#10B981' : '#34D399',
                      fontWeight: '600'
                    }}>
                      {apolloCompanySuggestion.confidence}% match
                    </div>
                  </div>

                  <button
                    onClick={() => setSearchTerm(apolloCompanySuggestion.name)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: 'white',
                      backgroundColor: '#3B82F6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#2563EB';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#3B82F6';
                    }}
                  >
                    Use This Company
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <QuickEditCompanySearchContainer>
            <QuickEditCompanySearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a company by name..."
            />
          </QuickEditCompanySearchContainer>

          {/* Email Domain Suggestions */}
          {emailDomains.length > 0 && searchTerm.length < 3 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Suggestions from contact's email:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {emailDomains.map((domain, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(domain)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: `1px solid ${theme === 'light' ? '#D1D5DB' : '#4B5563'}`,
                      borderRadius: '4px',
                      backgroundColor: theme === 'light' ? '#F9FAFB' : '#374151',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = theme === 'light' ? '#EEF2FF' : '#4B5563';
                      e.target.style.borderColor = '#3B82F6';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = theme === 'light' ? '#F9FAFB' : '#374151';
                      e.target.style.borderColor = theme === 'light' ? '#D1D5DB' : '#4B5563';
                    }}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Similar Companies Based on Domain Matching */}
          {similarCompanies.length > 0 && searchTerm.length < 3 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                Similar companies (70%+ match):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {similarCompanies.map((company, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddCompany(company)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#4B5563'}`,
                      borderRadius: '6px',
                      backgroundColor: theme === 'light' ? '#FFFFFF' : '#374151',
                      color: theme === 'light' ? '#111827' : '#F9FAFB',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = theme === 'light' ? '#F3F4F6' : '#4B5563';
                      e.target.style.borderColor = theme === 'light' ? '#D1D5DB' : '#6B7280';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = theme === 'light' ? '#FFFFFF' : '#374151';
                      e.target.style.borderColor = theme === 'light' ? '#E5E7EB' : '#4B5563';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{company.name}</div>
                      <div style={{
                        fontSize: '11px',
                        color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                        marginTop: '2px'
                      }}>
                        {company.similarity}% match with "{company.originalDomain}"
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme === 'light' ? '#059669' : '#10B981',
                      fontWeight: '600'
                    }}>
                      {company.similarity}%
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </QuickEditCompanyModalSection>

        {showSuggestions && (
          <QuickEditCompanySuggestionsContainer theme={theme}>
            {suggestions.length > 0
              ? suggestions.map((suggestion, index) => (
                  <QuickEditCompanySuggestionItem
                    key={suggestion.id || suggestion.company_id || `suggestion-${index}`}
                    theme={theme}
                    onClick={() => handleAddCompany(suggestion)}
                    disabled={loading}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>{suggestion.name}</div>
                      {suggestion.category && (
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {suggestion.category}
                        </div>
                      )}
                    </div>
                  </QuickEditCompanySuggestionItem>
                ))
              : <div>
                  <QuickEditCompanyEmptyMessage theme={theme}>
                    No companies found matching "{searchTerm}"
                  </QuickEditCompanyEmptyMessage>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '16px',
                    paddingBottom: '16px'
                  }}>
                    <button
                      onClick={() => {
                        if (onCreateCompany) {
                          onCreateCompany(searchTerm);
                        }
                        onClose(); // Close the current modal
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: theme === 'light' ? '#3B82F6' : '#60A5FA',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = theme === 'light' ? '#2563EB' : '#3B82F6';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = theme === 'light' ? '#3B82F6' : '#60A5FA';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <FaPlus size={12} />
                      Create "{searchTerm}" as new company
                    </button>
                  </div>
                </div>
            }
          </QuickEditCompanySuggestionsContainer>
        )}
      </QuickEditCompanyModalContent>

    </QuickEditCompanyModalContainer>
  );
};

export const QuickEditTabMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 90%;
  margin: 0 auto 20px auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    max-width: 95%;
    gap: 1px;
    padding: 3px;
  }

  @media (max-width: 600px) {
    max-width: fit-content;
    margin: 0 auto 20px auto;
  }

  @media (max-width: 480px) {
    flex-direction: row;
    width: fit-content;
    max-width: fit-content;
    gap: 2px;
    justify-content: center;
    margin: 0 auto 20px auto;
  }
`;

export const QuickEditTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  min-width: fit-content;

  &:hover {
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
      : (props.theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)')
    };
  }

  .tab-text {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 13px;
  }

  @media (max-width: 600px) {
    padding: 8px;
    gap: 0;

    .tab-text {
      display: none;
    }
  }

  @media (max-width: 480px) {
    width: auto;
    justify-content: center;
    padding: 8px;
    min-width: 44px; /* Ensure minimum touch target */
  }
`;

// Quick Edit Company Modal Styled Components
export const QuickEditCompanyModalContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

export const QuickEditCompanyModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

export const QuickEditCompanyModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

export const QuickEditCompanyModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

export const QuickEditCompanyModalContent = styled.div`
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
`;

export const QuickEditCompanyModalSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const QuickEditCompanyModalSectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

export const QuickEditCompanyEmptyMessage = styled.div`
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  padding: 20px;
`;

export const QuickEditCompanyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const QuickEditCompanyTag = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 6px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
`;

export const QuickEditCompanyTagContent = styled.div`
  flex: 1;
`;

export const QuickEditCompanyTagName = styled.div`
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const QuickEditPrimaryBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background: #10B981;
  color: white;
  border-radius: 10px;
  font-weight: 600;
`;

export const QuickEditCompanyTagDetails = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 4px;
`;

export const QuickEditCompanyRemoveButton = styled.button`
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background: #DC2626;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const QuickEditCompanySearchContainer = styled.div`
  position: relative;
`;

export const QuickEditCompanySearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

export const QuickEditCompanySuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  max-height: 200px;
  overflow-y: auto;
`;

export const QuickEditCompanySuggestionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Powerups Menu Styled Components
export const PowerupsMenuContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
`;

export const PowerupsMenuHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

export const PowerupsMenuTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PowerupsMenuCloseButton = styled.button`
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
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }
`;

export const PowerupsMenuContent = styled.div`
  padding: 16px;
`;

export const PowerupsMenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const PowerupsMenuIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  color: white;
  font-size: 16px;
`;

export const PowerupsMenuText = styled.div`
  flex: 1;
`;

export const PowerupsMenuItemTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 4px;
`;

export const PowerupsMenuItemSubtitle = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

