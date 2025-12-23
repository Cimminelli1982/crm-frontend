import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FiX, FiLink, FiPlus, FiSearch, FiCheck } from 'react-icons/fi';
import { FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const Title = styled.h2`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: transparent;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const DomainInfo = styled.div`
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1E3A5F'};
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  border-left: 3px solid #3B82F6;
`;

const DomainName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#93C5FD'};
`;

const SampleEmails = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const Section = styled.div`
  margin-bottom: 12px;
`;

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SuggestedCompanies = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 6px;
  overflow: hidden;
`;

const CompanyItem = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: ${props => props.$selected
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
    : (props.theme === 'light' ? '#FFFFFF' : '#1F2937')};

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
      : (props.theme === 'light' ? '#F9FAFB' : '#374151')};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CompanyInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CompanyName = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CompanyDetail = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 1px;
`;

const SelectButton = styled.button`
  background: ${props => props.$selected ? '#10B981' : 'transparent'};
  color: ${props => props.$selected ? 'white' : '#3B82F6'};
  border: 1px solid ${props => props.$selected ? '#10B981' : '#3B82F6'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;

  &:hover {
    background: ${props => props.$selected ? '#059669' : '#3B82F6'};
    color: white;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 10px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 10px 8px 32px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const EmptyState = styled.div`
  padding: 16px;
  text-align: center;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background: #3B82F6;
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background: #2563EB;
    }

    &:disabled {
      background: #9CA3AF;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: transparent;
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
    border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};

    &:hover {
      background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    }
  }

  &.create {
    background: transparent;
    color: #10B981;
    border: 1px solid #10B981;

    &:hover {
      background: #059669;
    }
  }
`;

const DomainLinkModal = ({
  isOpen,
  onRequestClose,
  domain,
  sampleEmails = [],
  theme = 'light',
  onDomainLinked = () => {},
  onCreateCompany = () => {}
}) => {
  const [matches, setMatches] = useState({ byName: [], byDomain: [], byContact: [] });
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  // Find suggested companies based on 3 categories
  useEffect(() => {
    if (isOpen && domain) {
      findAllMatches();
      setSelectedCompany(null);
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [isOpen, domain]);

  const findAllMatches = async () => {
    setLoading(true);
    try {
      const baseDomain = domain.replace(/\.(com|it|net|org|co|io|uk|de|fr|es|eu)$/i, '');
      const base = baseDomain.toLowerCase();

      // 1. MATCH BY NAME - company name contains domain parts OR domain contains company name
      const searchTerms = [baseDomain];
      const knownWords = ['torino', 'milano', 'roma', 'palestre', 'fitness', 'sport', 'tech', 'group', 'studio', 'lab', 'media', 'digital'];
      knownWords.forEach(word => {
        if (base.includes(word) && !searchTerms.includes(word)) {
          searchTerms.push(word);
        }
      });

      let nameResults = [];

      // Search for companies where name contains domain parts
      for (const term of searchTerms) {
        const { data } = await supabase
          .from('companies')
          .select('company_id, name, website, category')
          .ilike('name', `%${term}%`)
          .not('category', 'eq', 'Skip')
          .not('name', 'ilike', '%[SPLIT]%')
          .limit(5);
        if (data) nameResults = [...nameResults, ...data];
      }

      // REVERSE SEARCH: Find companies whose name is contained IN the domain
      // e.g., domain "gopillar" should match company "Pillar"
      // Generate substrings of the domain (min 3 chars) and search for exact company names
      if (base.length >= 4) {
        const substrings = [];
        for (let start = 0; start < base.length - 2; start++) {
          for (let len = 3; len <= base.length - start; len++) {
            const sub = base.substring(start, start + len);
            if (sub.length >= 3 && sub.length <= 20) {
              substrings.push(sub);
            }
          }
        }
        // Remove duplicates, prioritize longer substrings (more likely to be company names)
        const uniqueSubstrings = [...new Set(substrings)]
          .filter(s => s !== base && s.length >= 3)
          .sort((a, b) => b.length - a.length) // Longer first
          .slice(0, 15); // Limit to avoid too many queries

        // Search for companies with exact name match on substrings
        for (const sub of uniqueSubstrings) {
          const { data: subMatches } = await supabase
            .from('companies')
            .select('company_id, name, website, category')
            .ilike('name', sub)
            .not('category', 'eq', 'Skip')
            .limit(3);
          if (subMatches) nameResults = [...nameResults, ...subMatches];
        }
      }

      // Dedupe and sort by match quality
      const byName = nameResults
        .filter((c, i, self) => i === self.findIndex(x => x.company_id === c.company_id))
        .sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          // Exact match in domain gets highest priority
          const aInDomain = base.includes(aName.replace(/[^a-z0-9]/g, ''));
          const bInDomain = base.includes(bName.replace(/[^a-z0-9]/g, ''));
          if (aInDomain && !bInDomain) return -1;
          if (bInDomain && !aInDomain) return 1;
          // Then sort by match count
          const aMatches = searchTerms.filter(t => aName.includes(t.toLowerCase())).length;
          const bMatches = searchTerms.filter(t => bName.includes(t.toLowerCase())).length;
          return bMatches - aMatches;
        })
        .slice(0, 5);

      // 2. MATCH BY DOMAIN - similar domains in company_domains table
      const { data: domainMatches } = await supabase
        .from('company_domains')
        .select('domain, company_id, companies(company_id, name, website, category)')
        .ilike('domain', `%${base.substring(0, 6)}%`)
        .limit(3);

      const byDomain = (domainMatches || [])
        .filter(d => d.companies && d.companies.category !== 'Skip')
        .map(d => ({ ...d.companies, matchedDomain: d.domain }))
        .slice(0, 2);

      // 3. MATCH BY CONTACT - companies associated with contacts using this domain
      let byContact = [];
      if (sampleEmails.length > 0) {
        const email = sampleEmails[0];
        const { data: contactData } = await supabase
          .from('contact_emails')
          .select('contact_id')
          .eq('email', email)
          .limit(1);

        if (contactData && contactData[0]) {
          const { data: contactCompanies } = await supabase
            .from('contact_companies')
            .select('companies(company_id, name, website, category)')
            .eq('contact_id', contactData[0].contact_id)
            .limit(3);

          byContact = (contactCompanies || [])
            .filter(cc => cc.companies && cc.companies.category !== 'Skip')
            .map(cc => cc.companies)
            .slice(0, 2);
        }
      }

      setMatches({ byName, byDomain, byContact });
    } catch (error) {
      console.error('Error finding matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name, website, category')
        .ilike('name', `%${term}%`)
        .not('category', 'eq', 'Skip')
        .limit(15);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching companies:', error);
    }
  };

  const handleSelectCompany = (company) => {
    setSelectedCompany(selectedCompany?.company_id === company.company_id ? null : company);
  };

  const handleLinkDomain = async () => {
    if (!selectedCompany || !domain) return;

    setLinking(true);
    try {
      // Check if domain already exists
      const { data: existing } = await supabase
        .from('company_domains')
        .select('id, company_id')
        .eq('domain', domain.toLowerCase())
        .maybeSingle();

      if (existing) {
        // Domain already exists - check if it's for the same company
        if (existing.company_id === selectedCompany.company_id) {
          // Same company - just proceed with linking (useful for Keep in Touch contact linking)
          onDomainLinked({ company: selectedCompany, domain });
          onRequestClose();
          return;
        } else {
          // Different company - show error
          toast.error('This domain is already linked to a different company');
          return;
        }
      }

      // Insert domain
      const { error } = await supabase
        .from('company_domains')
        .insert({
          company_id: selectedCompany.company_id,
          domain: domain.toLowerCase(),
          is_primary: false
        });

      if (error) throw error;

      toast.success(`Domain linked to ${selectedCompany.name}`);
      onDomainLinked({ company: selectedCompany, domain });
      onRequestClose();
    } catch (error) {
      console.error('Error linking domain:', error);
      toast.error('Failed to link domain');
    } finally {
      setLinking(false);
    }
  };

  const handleCreateNew = () => {
    onCreateCompany({ domain, sampleEmails });
    onRequestClose();
  };

  const hasMatches = matches.byName.length > 0 || matches.byDomain.length > 0 || matches.byContact.length > 0;

  const renderCompanyItem = (company, badge) => (
    <CompanyItem
      key={company.company_id}
      theme={theme}
      $selected={selectedCompany?.company_id === company.company_id}
      onClick={() => handleSelectCompany(company)}
    >
      <CompanyInfo>
        <CompanyName theme={theme}>
          {company.name}
          {badge && <span style={{ fontSize: '10px', marginLeft: '6px', padding: '2px 6px', background: '#3B82F6', color: 'white', borderRadius: '4px' }}>{badge}</span>}
        </CompanyName>
        <CompanyDetail theme={theme}>
          {company.category || 'No category'}
          {company.matchedDomain && ` • ${company.matchedDomain}`}
        </CompanyDetail>
      </CompanyInfo>
      <SelectButton
        $selected={selectedCompany?.company_id === company.company_id}
        onClick={(e) => { e.stopPropagation(); handleSelectCompany(company); }}
      >
        {selectedCompany?.company_id === company.company_id ? <><FiCheck size={14} /> Selected</> : <><FiLink size={14} /> Select</>}
      </SelectButton>
    </CompanyItem>
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          border: 'none',
          borderRadius: '12px',
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1001
        }
      }}
    >
      <Header theme={theme}>
        <Title theme={theme}>
          <FaBuilding /> Link Domain to Company
        </Title>
        <CloseButton theme={theme} onClick={onRequestClose}>
          <FiX size={20} />
        </CloseButton>
      </Header>

      <DomainInfo theme={theme}>
        <DomainName theme={theme}>{domain}</DomainName>
        {sampleEmails.length > 0 && (
          <SampleEmails theme={theme}>
            Emails: {sampleEmails.slice(0, 3).join(', ')}
            {sampleEmails.length > 3 && ` +${sampleEmails.length - 3} more`}
          </SampleEmails>
        )}
      </DomainInfo>

      <Section>
        <SearchContainer>
          <SearchIcon theme={theme}>
            <FiSearch size={16} />
          </SearchIcon>
          <SearchInput
            theme={theme}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search companies..."
          />
        </SearchContainer>

        {loading ? (
          <EmptyState theme={theme}>Searching...</EmptyState>
        ) : searchTerm.length >= 2 ? (
          searchResults.length > 0 ? (
            <SuggestedCompanies theme={theme}>
              {searchResults.map(c => renderCompanyItem(c))}
            </SuggestedCompanies>
          ) : (
            <EmptyState theme={theme}>No results for "{searchTerm}"</EmptyState>
          )
        ) : (
          <>
            {matches.byName.length > 0 && (
              <>
                <SectionTitle theme={theme} style={{ fontSize: '12px', marginTop: '8px' }}>
                  <FaBuilding size={12} /> Name Match
                </SectionTitle>
                <SuggestedCompanies theme={theme}>
                  {matches.byName.map(c => renderCompanyItem(c))}
                </SuggestedCompanies>
              </>
            )}
            {matches.byDomain.length > 0 && (
              <>
                <SectionTitle theme={theme} style={{ fontSize: '12px', marginTop: '12px' }}>
                  <FiLink size={12} /> Similar Domain
                </SectionTitle>
                <SuggestedCompanies theme={theme}>
                  {matches.byDomain.map(c => renderCompanyItem(c, c.matchedDomain))}
                </SuggestedCompanies>
              </>
            )}
            {matches.byContact.length > 0 && (
              <>
                <SectionTitle theme={theme} style={{ fontSize: '12px', marginTop: '12px' }}>
                  <FiCheck size={12} /> Contact's Companies
                </SectionTitle>
                <SuggestedCompanies theme={theme}>
                  {matches.byContact.map(c => renderCompanyItem(c))}
                </SuggestedCompanies>
              </>
            )}
            {!hasMatches && (
              <EmptyState theme={theme}>No matches found. Search or create new.</EmptyState>
            )}
          </>
        )}
      </Section>

      <ButtonGroup theme={theme}>
        <Button className="create" theme={theme} onClick={handleCreateNew}>
          <FiPlus size={16} /> Create New Company
        </Button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button className="secondary" theme={theme} onClick={onRequestClose}>
            Cancel
          </Button>
          <Button
            className="primary"
            theme={theme}
            onClick={handleLinkDomain}
            disabled={!selectedCompany || linking}
          >
            <FiLink size={16} />
            {linking ? 'Linking...' : 'Link Domain'}
          </Button>
        </div>
      </ButtonGroup>
    </Modal>
  );
};

export default DomainLinkModal;
