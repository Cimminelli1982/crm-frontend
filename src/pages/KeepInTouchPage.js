import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ContactsList from '../components/ContactsList';

const KeepInTouchPage = ({ theme, onKeepInTouchCountChange }) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Touch Base');
  const [subCategory, setSubCategory] = useState('Over Due');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('v_keep_in_touch')
        .select('*');

      // Apply category-specific filters
      if (filterCategory === 'Touch Base') {
        // Apply mutually exclusive subcategory filters
        if (subCategory === 'Over Due') {
          // Very long overdue (more than 30 days overdue)
          query = query.lt('days_until_next', -30);
        } else if (subCategory === 'Due') {
          // Small delay (overdue but within 30 days)
          query = query.gte('days_until_next', -30).lt('days_until_next', 0);
        } else if (subCategory === 'Soon') {
          // Due in the future but soon (0-7 days)
          query = query.gte('days_until_next', 0).lte('days_until_next', 7);
        } else if (subCategory === 'Relax') {
          // Due in a very long time (more than 7 days)
          query = query.gt('days_until_next', 7);
        }
      } else if (filterCategory === 'Birthday') {
        // Birthday filtering - get contacts from regular contacts table with birthday info
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // Get contacts with upcoming birthdays instead of keep-in-touch data
        const { data: birthdayContacts, error: birthdayError } = await supabase
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
            contact_cities (
              cities (name, country)
            )
          `)
          .not('birthday', 'is', null)
          .order('birthday', { ascending: true })
          .limit(100);

        if (birthdayError) throw birthdayError;

        // Process birthday contacts
        const processedBirthdayContacts = (birthdayContacts || []).map(contact => ({
          ...contact,
          emails: contact.contact_emails || [],
          mobiles: contact.contact_mobiles || [],
          companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
          tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
          cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
        }));

        setContacts(processedBirthdayContacts);
        if (onKeepInTouchCountChange) {
          onKeepInTouchCountChange(processedBirthdayContacts.length);
        }
        setLoading(false);
        return;
      } else {
        // Other main categories will be implemented later
        setContacts([]);
        if (onKeepInTouchCountChange) {
          onKeepInTouchCountChange(0);
        }
        setLoading(false);
        return;
      }

      // Order by priority: overdue first (most negative), then by days until next
      const { data: keepInTouchData, error: keepInTouchError } = await query
        .order('days_until_next', { ascending: true })
        .limit(100);

      if (keepInTouchError) throw keepInTouchError;

      // Get full contact details for each keep-in-touch contact
      const contactIds = (keepInTouchData || []).map(kit => kit.contact_id);

      let processedContacts = [];

      if (contactIds.length > 0) {
        const { data: contactsData, error: contactsError } = await supabase
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
            contact_cities (
              cities (name, country)
            )
          `)
          .in('contact_id', contactIds);

        if (contactsError) throw contactsError;

        // Merge keep-in-touch data with contact data
        processedContacts = (keepInTouchData || []).map(kitData => {
          const contact = (contactsData || []).find(c => c.contact_id === kitData.contact_id);
          if (!contact) return null;

          return {
            ...contact,
            // Add keep-in-touch specific fields
            keep_in_touch_frequency: kitData.frequency,
            days_until_next: kitData.days_until_next,
            next_interaction_date: kitData.next_interaction_date,
            why_keeping_in_touch: kitData.why_keeping_in_touch,
            next_follow_up_notes: kitData.next_follow_up_notes,
            // Process related data
            emails: contact.contact_emails || [],
            mobiles: contact.contact_mobiles || [],
            companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
            tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
            cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
          };
        }).filter(Boolean);
      }

      setContacts(processedContacts);

      // Update keep in touch count if we have a callback
      if (onKeepInTouchCountChange) {
        onKeepInTouchCountChange(processedContacts.length);
      }
    } catch (error) {
      console.error(`Error fetching ${filterCategory} keep-in-touch contacts:`, error);
      toast.error(`Failed to load ${filterCategory} keep-in-touch contacts`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filterCategory, subCategory]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchContacts();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const keepInTouchCategories = ['Touch Base', 'Birthday'];
  const touchBaseSubCategories = ['Over Due', 'Due', 'Soon', 'Relax'];

  return (
    <PageContainer theme={theme}>
      <KeepInTouchView>
        <KeepInTouchHeader theme={theme}>
          <HeaderContent>
            <HeaderText>
              <PageTitle theme={theme}>Keep in Touch</PageTitle>
              <PageSubtitle theme={theme}>
                Follow-up reminders
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
            {keepInTouchCategories.map(category => (
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

        </KeepInTouchHeader>

        {/* Touch Base Submenu - in gray area below header */}
        {filterCategory === 'Touch Base' && (
          <TouchBaseSubMenu theme={theme}>
            {touchBaseSubCategories.map(subCat => (
              <TouchBaseSubTab
                key={subCat}
                theme={theme}
                $active={subCategory === subCat}
                onClick={() => setSubCategory(subCat)}
              >
                {subCat}
              </TouchBaseSubTab>
            ))}
          </TouchBaseSubMenu>
        )}

        <ContentArea>
          <ContactsList
            contacts={contacts}
            loading={loading}
            theme={theme}
            emptyStateConfig={{
              icon: '📞',
              title: 'No keep-in-touch contacts!',
              text: 'All contacts are up to date with follow-ups.'
            }}
            onContactUpdate={fetchContacts}
            showActions={true}
            pageContext="keepInTouch"
            keepInTouchData={{
              showDaysCounter: true,
              showFrequencyBadge: true
            }}
          />
        </ContentArea>
      </KeepInTouchView>
    </PageContainer>
  );
};

// Styled Components (based on SortPage)
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const KeepInTouchView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const KeepInTouchHeader = styled.div`
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

const ComingSoonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
`;

const ComingSoonIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
`;

const ComingSoonTitle = styled.h2`
  font-size: 32px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 16px 0;
`;

const ComingSoonText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 18px;
  line-height: 1.6;
  margin: 0;
`;

// Touch Base submenu styled components
const TouchBaseSubMenu = styled.div`
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

const TouchBaseSubTab = styled.button`
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
        : '0 1px 2px rgba(0, 0, 0, 0.2)')
    : 'none'
  };

  &:hover:not([disabled]) {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    box-shadow: ${props => props.theme === 'light'
      ? '0 1px 3px rgba(0, 0, 0, 0.15)'
      : '0 1px 3px rgba(0, 0, 0, 0.3)'
    };
  }
`;

export default KeepInTouchPage;