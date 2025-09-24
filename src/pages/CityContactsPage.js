import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSync, FaArrowLeft, FaStar } from 'react-icons/fa';
import { FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ContactsList from '../components/ContactsList';

const CityContactsPage = ({ theme }) => {
  const navigate = useNavigate();
  const { cityId } = useParams();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('last_interaction'); // 'last_interaction' or 'rating'
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityInfo, setCityInfo] = useState(null);

  // Get city name from location state (passed from ContactDetail) or fetch it
  const cityName = location.state?.cityName || 'Unknown City';
  const previousContactId = location.state?.contactId;

  const fetchCityInfo = async () => {
    if (!cityId) return;

    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('city_id', cityId)
        .single();

      if (error) throw error;
      setCityInfo(data);
    } catch (error) {
      console.error('Error fetching city info:', error);
    }
  };

  const fetchCityContacts = async () => {
    if (!cityId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('contacts')
        .select(`
          *,
          contact_emails (email, type, is_primary),
          contact_mobiles (mobile, type, is_primary),
          contact_companies (
            company_id,
            relationship,
            is_primary,
            companies (name, website, category)
          ),
          contact_tags (
            tags (name)
          ),
          contact_cities!inner (
            cities!inner (city_id, name, country)
          )
        `)
        .eq('contact_cities.cities.city_id', cityId)
        .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set","Inbox")')
        .not('last_interaction_at', 'is', null); // Only show contacts with interactions

      // Apply sorting
      if (sortBy === 'last_interaction') {
        query = query.order('last_interaction_at', { ascending: false, nullsLast: true });
      } else if (sortBy === 'rating') {
        // For rating sort, we'll sort manually after fetching to handle score 0 properly
        query = query.order('score', { ascending: false, nullsLast: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      let sortedData = data || [];

      // Custom sort for rating to ensure proper order: 5,4,3,2,1,0,null
      if (sortBy === 'rating') {
        sortedData = sortedData.sort((a, b) => {
          const scoreA = a.score;
          const scoreB = b.score;

          // Handle null values - they go last
          if (scoreA === null && scoreB === null) return 0;
          if (scoreA === null) return 1;
          if (scoreB === null) return -1;

          // Handle zero values - they go after all positive scores but before null
          if (scoreA === 0 && scoreB === 0) return 0;
          if (scoreA === 0 && scoreB > 0) return 1;
          if (scoreB === 0 && scoreA > 0) return -1;

          // Normal numeric sort for positive values (descending)
          return scoreB - scoreA;
        });
      }

      console.log(`Found ${sortedData?.length || 0} contacts in city ${cityName}`);
      setContacts(sortedData);
    } catch (error) {
      console.error('Error fetching city contacts:', error);
      toast.error('Failed to load city contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCityInfo();
    fetchCityContacts();
  }, [cityId, sortBy]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchCityContacts();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleBack = () => {
    if (previousContactId) {
      // Navigate back to the specific contact detail page
      navigate(`/contact/${previousContactId}`, {
        state: { activeTab: 'Related', activeRelatedTab: 'Contacts' }
      });
    } else {
      // Fallback: go back in history
      navigate(-1);
    }
  };

  const sortOptions = [
    { key: 'last_interaction', label: 'Last Interaction', icon: <FiClock /> },
    { key: 'rating', label: 'Star Rating', icon: <FaStar /> }
  ];

  const displayCityName = cityInfo?.name || cityName;
  const displayCountry = cityInfo?.country;

  return (
    <PageContainer theme={theme}>
      <CityContactsView>
        <CityContactsHeader theme={theme}>
          <HeaderContent>
            <BackButtonContainer>
              <BackButton theme={theme} onClick={handleBack}>
                <FaArrowLeft />
                <span>Back</span>
              </BackButton>
            </BackButtonContainer>

            <HeaderTextContainer>
              <HeaderText>
                <PageTitle theme={theme}>
                  📍 {displayCityName}
                  {displayCountry && displayCountry !== 'Unknown' && (
                    <CountryText theme={theme}>, {displayCountry}</CountryText>
                  )}
                </PageTitle>
                <PageSubtitle theme={theme}>
                  {contacts.length} contacts in this city
                </PageSubtitle>
              </HeaderText>
              <RefreshButton
                theme={theme}
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                $isRefreshing={isRefreshing}
              >
                <FaSync />
              </RefreshButton>
            </HeaderTextContainer>
          </HeaderContent>

          <FilterTabs theme={theme}>
            {sortOptions.map(option => (
              <FilterTab
                key={option.key}
                theme={theme}
                $active={sortBy === option.key}
                onClick={() => setSortBy(option.key)}
              >
                {option.icon}
                <span>{option.label}</span>
              </FilterTab>
            ))}
          </FilterTabs>
        </CityContactsHeader>

        <ContentArea>
          <ContactsList
            contacts={contacts}
            loading={loading}
            theme={theme}
            emptyStateConfig={{
              icon: '📍',
              title: `No contacts in ${displayCityName}`,
              text: 'No contacts found for this city.'
            }}
            onContactUpdate={fetchCityContacts}
            showActions={true}
            badgeType={sortBy === 'rating' ? 'category' : 'time'}
          />
        </ContentArea>
      </CityContactsView>
    </PageContainer>
  );
};

// Styled Components (following InteractionsPage pattern)
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const CityContactsView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CityContactsHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 24px;
  transition: all 0.3s ease;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const BackButtonContainer = styled.div`
  display: flex;
  align-items: center;
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

const HeaderTextContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const HeaderText = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 1.5rem;
  }
`;

const CountryText = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-weight: 500;
`;

const PageSubtitle = styled.p`
  font-size: 1rem;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 8px 0 0 0;
  font-weight: 400;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  ${props => props.$isRefreshing && `
    animation: spin 1s linear infinite;
  `}

  &:hover:not(:disabled) {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    border-color: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F3F4F6'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterTab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  white-space: nowrap;

  ${props => props.$active ? `
    background: ${props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
    color: ${props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
  ` : `
    background: ${props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props.theme === 'light' ? '#6B7280' : '#9CA3AF'};

    &:hover {
      background: ${props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
      color: ${props.theme === 'light' ? '#374151' : '#F3F4F6'};
    }
  `}

  svg {
    font-size: 12px;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

export default CityContactsPage;