import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ContactsList from '../components/ContactsList';

const InteractionsPage = ({ theme }) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [timeFilter, setTimeFilter] = useState('Today'); // Today, This Week, This Month
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      // Get contacts excluding Skip, WhatsApp Group, System, Not Set, Inbox categories
      // Filter based on timeFilter selection
      let startDate = new Date();
      let endDate = null;

      if (timeFilter === 'Today') {
        startDate.setHours(0, 0, 0, 0); // Start of today
      } else if (timeFilter === 'This Week') {
        // Show last 7 days, but not today (days 1-7 ago)
        endDate = new Date();
        endDate.setDate(endDate.getDate() - 1); // Yesterday
        endDate.setHours(23, 59, 59, 999); // End of yesterday

        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // 7 days ago
        startDate.setHours(0, 0, 0, 0); // Start of that day
      } else if (timeFilter === 'This Month') {
        // Show last 30 days, but not the last 7 days (days 8-30 ago)
        endDate = new Date();
        endDate.setDate(endDate.getDate() - 8); // 8 days ago
        endDate.setHours(23, 59, 59, 999); // End of that day

        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // 30 days ago
        startDate.setHours(0, 0, 0, 0); // Start of that day
      }

      const formattedStartDate = startDate.toISOString();
      let query = supabase
        .from('contacts')
        .select('*')
        .not('category', 'in', '("Skip","WhatsApp Group Contact","System","Not Set","Inbox")')
        .not('last_interaction_at', 'is', null); // Always filter out contacts without interactions

      // Add category filter based on selected tab
      if (filterCategory !== 'All') {
        if (filterCategory === 'Founders') {
          query = query.eq('category', 'Founder');
        } else if (filterCategory === 'Investors') {
          query = query.eq('category', 'Professional Investor');
        } else if (filterCategory === 'Family and Friends') {
          query = query.eq('category', 'Friend and Family');
        }
      } else {
        // Apply additional date filtering for "All" category
        query = query.gte('last_interaction_at', formattedStartDate);

        // Add end date filter for This Week and This Month
        if (endDate) {
          const formattedEndDate = endDate.toISOString();
          query = query.lte('last_interaction_at', formattedEndDate);
        }
      }

      // Always apply sorting and limit
      const { data, error } = await query
        .order('last_interaction_at', { ascending: false, nullsLast: true })
        .limit(100);

      if (error) throw error;

      console.log(`Found ${data?.length || 0} contacts with interactions in ${timeFilter.toLowerCase()}`);
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      toast.error('Failed to load interactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [timeFilter, filterCategory]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchInteractions();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const interactionCategories = ['All', 'Founders', 'Investors', 'Family and Friends'];

  return (
    <PageContainer theme={theme}>
      <InteractionsView>
        <InteractionsHeader theme={theme}>
          <HeaderContent>
            <HeaderText>
              <PageTitle theme={theme}>Interactions</PageTitle>
              <PageSubtitle theme={theme}>
                View and manage all contact interactions
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
          </HeaderContent>

          <FilterTabs theme={theme}>
            {interactionCategories.map(category => (
              <FilterTab
                key={category}
                theme={theme}
                $active={filterCategory === category}
                onClick={() => setFilterCategory(category)}
              >
                {category}
              </FilterTab>
            ))}
          </FilterTabs>
        </InteractionsHeader>

        {/* Time Filter Submenu - in gray area below header */}
        {filterCategory === 'All' && (
          <TimeSubMenu theme={theme}>
            <TimeSubTab
              theme={theme}
              $active={timeFilter === 'Today'}
              onClick={() => setTimeFilter('Today')}
            >
              Today
            </TimeSubTab>
            <TimeSubTab
              theme={theme}
              $active={timeFilter === 'This Week'}
              onClick={() => setTimeFilter('This Week')}
            >
              This Week
            </TimeSubTab>
            <TimeSubTab
              theme={theme}
              $active={timeFilter === 'This Month'}
              onClick={() => setTimeFilter('This Month')}
            >
              This Month
            </TimeSubTab>
          </TimeSubMenu>
        )}

        <ContentArea>
          <ContactsList
            contacts={contacts}
            loading={loading}
            theme={theme}
            emptyStateConfig={{
              icon: '🔄',
              title: 'No recent interactions',
              text: 'No contacts have had interactions in the last 30 days.'
            }}
            onContactUpdate={fetchInteractions}
            showActions={true}
            badgeType="category"
          />
        </ContentArea>
      </InteractionsView>
    </PageContainer>
  );
};

// Styled Components (same as Sort page pattern)
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const InteractionsView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const InteractionsHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 24px 20px 24px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto 20px auto;
`;

const HeaderText = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const PageSubtitle = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
  font-size: 16px;
`;

const RefreshButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$isRefreshing && `
    svg {
      animation: spin 1s linear infinite;
    }
  `}

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  &:hover {
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 1200px;
  margin: 20px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 12px;
  padding: 6px;
  width: fit-content;
  box-shadow: ${props => props.theme === 'light'
    ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
    : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
  };
`;

const FilterTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  font-size: 15px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: fit-content;
  white-space: nowrap;
  position: relative;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)'
        : '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    transform: translateY(-1px);
    box-shadow: ${props => props.theme === 'light'
      ? '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
      : '0 2px 8px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active {
    transform: translateY(0);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const TimeSubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 500px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const TimeSubTab = styled.button`
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

  &:hover {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    box-shadow: ${props => props.theme === 'light'
      ? '0 1px 3px rgba(0, 0, 0, 0.12)'
      : '0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default InteractionsPage;