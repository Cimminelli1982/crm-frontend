import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import ContactsList from '../components/ContactsList';

const SortPage = ({ theme, onInboxCountChange }) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Inbox');
  const [spamSubCategory, setSpamSubCategory] = useState('Email'); // Email or WhatsApp

  const fetchContacts = async () => {
    setLoading(true);
    try {
      let data = [];
      let error = null;

      if (filterCategory === 'Spam') {
        if (spamSubCategory === 'Email') {
          // Get spam emails directly from emails_spam table
          const { data: spamEmails, error: spamError } = await supabase
            .from('emails_spam')
            .select('email, counter, last_modified_at')
            .order('last_modified_at', { ascending: false });

          if (spamError) throw spamError;

          console.log(`Found ${spamEmails?.length || 0} spam emails`);

          // Transform spam emails to look like contacts for the ContactsList component
          data = (spamEmails || []).map(spam => ({
            id: `spam-email-${spam.email}`,
            first_name: spam.email.split('@')[0] || 'Spam',
            last_name: `(@${spam.email.split('@')[1] || 'unknown'})`,
            email: spam.email,
            mobile: '',
            last_interaction_at: spam.last_modified_at,
            created_at: spam.last_modified_at,
            category: 'Spam Email',
            spam_counter: spam.counter
          }));

        } else if (spamSubCategory === 'WhatsApp') {
          // Get WhatsApp spam from whatsapp_spam table
          const { data: spamNumbers, error: spamError } = await supabase
            .from('whatsapp_spam')
            .select('mobile_number, counter, last_modified_at')
            .order('last_modified_at', { ascending: false });

          if (spamError) throw spamError;

          console.log(`Found ${spamNumbers?.length || 0} spam numbers`);

          // Transform spam numbers to look like contacts
          data = (spamNumbers || []).map(spam => ({
            id: `spam-whatsapp-${spam.mobile_number}`,
            first_name: spam.mobile_number || 'WhatsApp Spam',
            last_name: '',
            email: '',
            mobile: spam.mobile_number,
            last_interaction_at: spam.last_modified_at,
            created_at: spam.last_modified_at,
            category: 'WhatsApp Spam',
            spam_counter: spam.counter
          }));
        }

        error = null;

      } else if (filterCategory === 'Mail Filter') {
        // Get emails from email_inbox with special_case = 'pending_approval' (same as EmailInbox component)
        const { data: pendingEmails, error: mailError } = await supabase
          .from('email_inbox')
          .select('id, from_name, from_email, to_name, to_email, subject, message_timestamp, direction, special_case')
          .eq('special_case', 'pending_approval')
          .order('message_timestamp', { ascending: false });

        if (mailError) throw mailError;

        console.log(`Found ${pendingEmails?.length || 0} pending approval emails`);

        // Transform emails to look like contacts for the ContactsList component
        data = (pendingEmails || []).map(email => {
          const isSent = email.direction?.toLowerCase() === 'sent';
          const contactName = isSent ? email.to_name : email.from_name;
          const contactEmail = isSent ? email.to_email : email.from_email;

          return {
            id: `email-${email.id}`,
            first_name: contactName || contactEmail?.split('@')[0] || 'Unknown',
            last_name: contactEmail ? `(@${contactEmail.split('@')[1]})` : '',
            email: contactEmail || '',
            mobile: email.subject || '(No Subject)',
            last_interaction_at: email.message_timestamp,
            created_at: email.message_timestamp,
            category: 'Mail Filter',
            direction: email.direction,
            email_data: email // Store full email data for potential future use
          };
        });

        error = null;

      } else {
        // Standard category filtering for Inbox, Skip
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
            contact_cities (
              cities (name, country)
            )
          `);

        let categoryFilter = filterCategory === 'Skip' ? 'Skip' : 'Inbox';

        if (filterCategory === 'Inbox') {
          // For Inbox, also filter by recent interactions (last 100 days)
          const oneHundredDaysAgo = new Date();
          oneHundredDaysAgo.setDate(oneHundredDaysAgo.getDate() - 100);
          const formattedDate = oneHundredDaysAgo.toISOString();
          query = query.gte('last_interaction_at', formattedDate);
        }

        const result = await query
          .eq('category', categoryFilter)
          .order('last_interaction_at', { ascending: false, nullsLast: true })
          .order('created_at', { ascending: false });

        data = result.data || [];
        error = result.error;
      }

      if (error) throw error;

      const processedContacts = data.map(contact => ({
        ...contact,
        emails: contact.contact_emails || [],
        mobiles: contact.contact_mobiles || [],
        companies: contact.contact_companies?.map(cc => cc.companies).filter(Boolean) || [],
        tags: contact.contact_tags?.map(ct => ct.tags?.name).filter(Boolean) || [],
        cities: contact.contact_cities?.map(cc => cc.cities).filter(Boolean) || []
      }));

      setContacts(processedContacts);

      // Update inbox count if this is the inbox category and we have a callback
      if (filterCategory === 'Inbox' && onInboxCountChange) {
        onInboxCountChange(processedContacts.length);
      }
    } catch (error) {
      console.error(`Error fetching ${filterCategory} contacts:`, error);
      toast.error(`Failed to load ${filterCategory} contacts`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [filterCategory, spamSubCategory]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchContacts();
    setTimeout(() => setIsRefreshing(false), 1000);
  };


  const sortCategories = ['Inbox', 'Skip', 'Spam', 'Mail Filter'];

  return (
    <PageContainer theme={theme}>
      <SortView>
        <SortHeader theme={theme}>
          <HeaderContent>
            <HeaderText>
              <PageTitle theme={theme}>Sort</PageTitle>
              <PageSubtitle theme={theme}>
                Manage and organize your contacts
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
            {sortCategories.map(category => (
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
        </SortHeader>

        {/* Spam Submenu - in gray area below header */}
        {filterCategory === 'Spam' && (
          <SpamSubMenu theme={theme}>
            <SpamSubTab
              theme={theme}
              $active={spamSubCategory === 'Email'}
              onClick={() => setSpamSubCategory('Email')}
            >
              Email
            </SpamSubTab>
            <SpamSubTab
              theme={theme}
              $active={spamSubCategory === 'WhatsApp'}
              onClick={() => setSpamSubCategory('WhatsApp')}
            >
              WhatsApp
            </SpamSubTab>
          </SpamSubMenu>
        )}

        <ContentArea>
          <ContactsList
            contacts={contacts}
            loading={loading}
            theme={theme}
            emptyStateConfig={{
              icon: filterCategory === 'Inbox' ? '📥' :
                    filterCategory === 'Skip' ? '⏭️' :
                    filterCategory === 'Spam' ? '🚫' :
                    '📧',
              title: filterCategory === 'Inbox' ? 'Inbox is empty!' :
                     filterCategory === 'Skip' ? 'No skipped contacts!' :
                     filterCategory === 'Spam' ? 'No spam contacts!' :
                     'No mail filter contacts!',
              text: filterCategory === 'Inbox' ? 'All contacts have been categorized. Great work!' :
                    filterCategory === 'Skip' ? 'No contacts have been skipped yet.' :
                    filterCategory === 'Spam' ? 'No contacts have been marked as spam.' :
                    'No contacts from email filtering.'
            }}
            onContactUpdate={fetchContacts}
            showActions={true}
          />
        </ContentArea>
      </SortView>
    </PageContainer>
  );
};

// Styled Components (copied from TrashPage pattern)
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const SortView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const SortHeader = styled.div`
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

const SpamSubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 400px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

const SpamSubTab = styled.button`
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


export default SortPage;