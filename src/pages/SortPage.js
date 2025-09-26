import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSync, FaBirthdayCake } from 'react-icons/fa';
import { FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiMail, FiUser, FiCalendar, FiMessageSquare, FiExternalLink, FiBuilding, FiTag, FiMapPin, FiStar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ContactsList from '../components/ContactsList';

const SortPage = ({ theme, onInboxCountChange }) => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Inbox');
  const [spamSubCategory, setSpamSubCategory] = useState('Email'); // Email or WhatsApp
  const [missingSubCategory, setMissingSubCategory] = useState('Basics'); // Basics, Company, Tags, Cities, Score, Keep in touch, Birthday
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [confirmSpam, setConfirmSpam] = useState(null);

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

      } else if (filterCategory === 'Missing') {
        // Handle Missing submenu categories
        console.log(`Loading Missing > ${missingSubCategory}`);

        if (missingSubCategory === 'Company') {
          console.log('🔍 Loading contacts without companies using database view...');

          // Use the optimized database view that does all the heavy lifting
          const { data: contactsData, error: contactsError } = await supabase
            .from('contacts_without_companies')
            .select('*');

          if (contactsError) {
            console.error('❌ Error fetching contacts without companies:', contactsError);
            throw contactsError;
          }

          console.log(`✅ Fetched ${contactsData?.length || 0} contacts without companies from database view`);
          contactsData?.slice(0, 5).forEach((c, i) => {
            console.log(`📅 Contact ${i + 1}: ${c.first_name} ${c.last_name} - ${c.last_interaction_at || 'NO DATE'}`);
          });

          // Transform data to match ContactsList component expectations
          data = (contactsData || []).map(contact => ({
            ...contact,
            emails: [], // Will be empty for now (can be loaded separately if needed)
            mobiles: [], // Will be empty for now (can be loaded separately if needed)
            companies: [] // Explicitly empty since these are contacts without companies
          }));

          console.log('✅ Data transformation complete. Final data:', data.slice(0, 3));
        } else {
          // For other Missing subcategories, keep "Coming Soon" behavior
          data = [];
        }

        error = null;

      } else if (filterCategory === 'Mail Filter') {
        // Get emails from email_inbox with special_case = 'pending_approval' (same as EmailInbox component)
        const { data: pendingEmails, error: mailError } = await supabase
          .from('email_inbox')
          .select('id, from_name, from_email, to_name, to_email, subject, message_text, message_timestamp, direction, special_case')
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

        let categoryFilter = 'Inbox';

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
        companies: contact.contact_companies?.map(cc => ({
          ...cc.companies,
          company_id: cc.company_id // Preserve company_id from the join table
        })).filter(Boolean) || [],
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
  }, [filterCategory, spamSubCategory, missingSubCategory]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchContacts();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Handle spam button click
  const handleSpamClick = (emailData) => {
    console.log('Spam button clicked:', emailData);
    setConfirmSpam(emailData);
  };

  // Handle marking an email as spam after confirmation
  const handleConfirmSpam = async () => {
    if (!confirmSpam) return;

    const emailData = confirmSpam;
    try {
      // Update the email record to mark it as reject
      const { error } = await supabase
        .from('email_inbox')
        .update({
          special_case: 'reject',
          last_processed_at: new Date().toISOString()
        })
        .eq('id', emailData.email_data.id);

      if (error) throw error;

      // Remove the email from the displayed list
      setContacts(contacts.filter(contact => contact.id !== emailData.id));

      // Trigger count refresh
      window.dispatchEvent(new CustomEvent('refreshInboxCounts'));

      // Close the confirmation dialog
      setConfirmSpam(null);

      toast.success('Email marked as spam');
      console.log('Email marked as spam:', emailData.email_data.id);
    } catch (err) {
      console.error('Error marking email as spam:', err);
      toast.error('Failed to mark email as spam');
    }
  };

  // Handle adding email sender to CRM
  const handleAddToCRM = async (emailData) => {
    console.log('Add to CRM clicked:', emailData);
    try {
      // Update the email record to mark it with null special_case
      const { error } = await supabase
        .from('email_inbox')
        .update({
          special_case: null,
          last_processed_at: new Date().toISOString()
        })
        .eq('id', emailData.email_data.id);

      if (error) throw error;

      // Re-fetch emails to check if there are more to process
      await fetchContacts();

      // Trigger count refresh
      window.dispatchEvent(new CustomEvent('refreshInboxCounts'));

      toast.success('Email added to CRM');
      console.log('Email marked for CRM processing:', emailData.email_data.id);
    } catch (err) {
      console.error('Error processing email for CRM:', err);
      toast.error('Failed to add email to CRM');
    }
  };

  // Handle view email click
  const handleViewEmail = (emailData) => {
    setSelectedEmail(emailData.email_data);
  };


  const sortCategories = ['Inbox', 'Mail Filter', 'Missing', 'Spam'];

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

        {/* Missing Submenu */}
        {filterCategory === 'Missing' && (
          <SpamSubMenu theme={theme}>
            <SpamSubTab
              theme={theme}
              $active={missingSubCategory === 'Basics'}
              onClick={() => setMissingSubCategory('Basics')}
            >
              Basics
            </SpamSubTab>
            <SpamSubTab
              theme={theme}
              $active={missingSubCategory === 'Company'}
              onClick={() => setMissingSubCategory('Company')}
            >
              Company
            </SpamSubTab>
            <SpamSubTab
              theme={theme}
              $active={missingSubCategory === 'Tags'}
              onClick={() => setMissingSubCategory('Tags')}
            >
              Tags
            </SpamSubTab>
            <SpamSubTab
              theme={theme}
              $active={missingSubCategory === 'Cities'}
              onClick={() => setMissingSubCategory('Cities')}
            >
              Cities
            </SpamSubTab>
            <SpamSubTab
              theme={theme}
              $active={missingSubCategory === 'Score'}
              onClick={() => setMissingSubCategory('Score')}
            >
              Score
            </SpamSubTab>
            <SpamSubTab
              theme={theme}
              $active={missingSubCategory === 'Keep in touch'}
              onClick={() => setMissingSubCategory('Keep in touch')}
            >
              Keep in touch
            </SpamSubTab>
            <SpamSubTab
              theme={theme}
              $active={missingSubCategory === 'Birthday'}
              onClick={() => setMissingSubCategory('Birthday')}
            >
              Birthday
            </SpamSubTab>
          </SpamSubMenu>
        )}

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
          {filterCategory === 'Mail Filter' ? (
            <MailFilterEmailList
              contacts={contacts}
              loading={loading}
              theme={theme}
              onSpamClick={handleSpamClick}
              onAddToCRM={handleAddToCRM}
              onViewEmail={handleViewEmail}
            />
          ) : (
            <ContactsList
              contacts={contacts}
              loading={loading}
              theme={theme}
              emptyStateConfig={{
                icon: filterCategory === 'Inbox' ? '📥' :
                      filterCategory === 'Missing' ? (missingSubCategory === 'Company' ? '🏢' : '🚧') :
                      filterCategory === 'Spam' ? '🚫' :
                      '📧',
                title: filterCategory === 'Inbox' ? 'Inbox is empty!' :
                        filterCategory === 'Missing' ? (missingSubCategory === 'Company' ? 'All contacts have companies!' : 'Coming Soon!') :
                        filterCategory === 'Spam' ? 'No spam contacts!' :
                        'No mail filter contacts!',
                text: filterCategory === 'Inbox' ? 'All contacts have been categorized. Great work!' :
                      filterCategory === 'Missing' ? (missingSubCategory === 'Company' ? 'Every contact is associated with a company. Great organization!' : `The ${missingSubCategory} feature is coming soon. Stay tuned!`) :
                      filterCategory === 'Spam' ? 'No contacts have been marked as spam.' :
                      'No contacts from email filtering.'
              }}
              onContactUpdate={fetchContacts}
              showActions={true}
              badgeType="category"
              pageContext="sort"
            />
          )}
        </ContentArea>

        {/* Email details modal */}
        {selectedEmail && (
          <EmailModal
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
            onSpam={handleSpamClick}
            onAddToCRM={handleAddToCRM}
            theme={theme}
          />
        )}

        {/* Spam confirmation modal */}
        {confirmSpam && (
          <ModalOverlay onClick={() => setConfirmSpam(null)}>
            <ModalContent
              onClick={(e) => e.stopPropagation()}
              theme={theme}
              style={{ maxWidth: '400px', padding: '20px' }}
            >
              <ModalHeader theme={theme}>
                <ModalTitle theme={theme}>
                  <FiXCircle style={{ marginRight: '10px', color: '#ff5555' }} /> Confirm Spam
                </ModalTitle>
                <ModalCloseButton onClick={() => setConfirmSpam(null)} theme={theme}>×</ModalCloseButton>
              </ModalHeader>

              <ModalBody theme={theme}>
                <p style={{ marginBottom: '20px' }}>
                  Are you sure you want to mark this email as spam?
                </p>
                <div style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#1a1a1a',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '20px'
                }}>
                  <p><strong>From:</strong> {confirmSpam.first_name} {confirmSpam.last_name}</p>
                  <p><strong>Subject:</strong> {confirmSpam.email_data?.subject || '(No Subject)'}</p>
                </div>
              </ModalBody>

              <ModalFooter theme={theme}>
                <ActionButton
                  onClick={() => setConfirmSpam(null)}
                  theme={theme}
                  $variant="secondary"
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  onClick={handleConfirmSpam}
                  theme={theme}
                  $variant="danger"
                >
                  <FiXCircle /> Mark as Spam
                </ActionButton>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
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

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    max-width: 100%;
  }
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
  padding: 6px 10px;
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

// Modal components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ModalFooter = styled.div`
  padding: 15px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
`;

const ActionButton = styled.button`
  background-color: ${props => {
    if (props.$variant === 'danger') return '#DC2626';
    if (props.$variant === 'secondary') return 'transparent';
    return '#3B82F6';
  }};
  color: ${props => {
    if (props.$variant === 'secondary') return props.theme === 'light' ? '#6B7280' : '#9CA3AF';
    return 'white';
  }};
  border: 1px solid ${props => {
    if (props.$variant === 'danger') return '#DC2626';
    if (props.$variant === 'secondary') return props.theme === 'light' ? '#D1D5DB' : '#4B5563';
    return '#3B82F6';
  }};
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

// Email List Component for Mail Filter
const MailFilterEmailList = ({ contacts, loading, theme, onSpamClick, onAddToCRM, onViewEmail }) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
      }}>
        Loading emails...
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '300px',
        color: theme === 'light' ? '#6B7280' : '#9CA3AF'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          No mail filter emails!
        </div>
        <div>No emails pending approval.</div>
      </div>
    );
  }

  return (
    <EmailListContainer theme={theme}>
      {contacts.map(contact => (
        <EmailItem key={contact.id} theme={theme} onClick={() => onViewEmail(contact)}>
          <EmailInfo>
            <EmailDirection theme={theme}>
              {contact.direction?.toLowerCase() === 'sent' ? (
                <FiArrowLeft key={`arrow-${contact.id}`} color="#60A5FA" size={16} />
              ) : (
                <FiArrowRight key={`arrow-${contact.id}`} color="#10B981" size={16} />
              )}
            </EmailDirection>
            <EmailContact theme={theme}>
              {contact.first_name} {contact.last_name}
            </EmailContact>
            <EmailSubject theme={theme}>
              {contact.mobile || '(No Subject)'}
            </EmailSubject>
          </EmailInfo>
          <EmailActions>
            <EmailActionButton
              key={`spam-${contact.id}`}
              onClick={(e) => { e.stopPropagation(); onSpamClick(contact); }}
              theme={theme}
              $variant="danger"
            >
              <FiXCircle key={`spam-icon-${contact.id}`} /> <span>Spam</span>
            </EmailActionButton>
            <EmailActionButton
              key={`crm-${contact.id}`}
              onClick={(e) => { e.stopPropagation(); onAddToCRM(contact); }}
              theme={theme}
              $variant="success"
            >
              <FiCheckCircle key={`crm-icon-${contact.id}`} /> <span>Add to CRM</span>
            </EmailActionButton>
          </EmailActions>
        </EmailItem>
      ))}
    </EmailListContainer>
  );
};

const EmailListContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
`;

const EmailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 8px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    box-shadow: 0 2px 8px ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
    gap: 12px;
  }
`;

const EmailInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    width: 100%;
    gap: 8px;
  }
`;

const EmailDirection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
`;

const EmailContact = styled.div`
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  min-width: 120px;

  @media (max-width: 768px) {
    min-width: auto;
    font-size: 14px;
  }
`;

const EmailSubject = styled.div`
  flex: 1;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: 200px;
    font-size: 13px;
  }
`;

const EmailDate = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  min-width: 80px;

  @media (max-width: 768px) {
    min-width: auto;
    font-size: 0.75rem;
  }
`;

const EmailActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
  }
`;

const EmailActionButton = styled.button`
  background-color: ${props => {
    if (props.$variant === 'danger') return '#DC2626';
    if (props.$variant === 'success') return '#059669';
    return '#3B82F6';
  }};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;

  &:hover {
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 11px;
    flex: 0 0 auto;

    span {
      display: none;
    }
  }

  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 10px;
    min-width: 60px;
  }
`;

// Email Modal Component
const EmailModal = ({ email, onClose, onSpam, onAddToCRM, theme }) => {
  if (!email) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSent = email.direction?.toLowerCase() === 'sent';
  const contactName = isSent ? email.to_name : email.from_name;
  const contactEmail = isSent ? email.to_email : email.from_email;
  const myEmail = 'simone@cimminelli.com';

  const searchEmail = encodeURIComponent(contactEmail);
  const superhuman_url = `https://mail.superhuman.com/search/${searchEmail}`;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} theme={theme}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>
            <FiMail style={{ marginRight: '10px' }} /> Email Details
          </ModalTitle>

          <OriginalEmailLink href={superhuman_url} target="_blank" rel="noopener noreferrer" theme={theme}>
            <FiExternalLink /> Original
          </OriginalEmailLink>

          <ModalCloseButton onClick={onClose} theme={theme} style={{ marginLeft: '15px' }}>×</ModalCloseButton>
        </ModalHeader>

        <ModalBody theme={theme}>
          <EmailDetails theme={theme}>
            <EmailInfoItem theme={theme}>
              <EmailInfoLabel theme={theme}>
                <FiUser /> {isSent ? 'To:' : 'From:'}
              </EmailInfoLabel>
              <EmailInfoValue theme={theme}>
                {contactName} &lt;{contactEmail}&gt;
              </EmailInfoValue>
            </EmailInfoItem>

            <EmailInfoItem theme={theme}>
              <EmailInfoLabel theme={theme}>
                <FiUser /> {isSent ? 'From:' : 'To:'}
              </EmailInfoLabel>
              <EmailInfoValue theme={theme}>
                Simone Cimminelli &lt;{myEmail}&gt;
              </EmailInfoValue>
            </EmailInfoItem>

            <EmailInfoItem theme={theme}>
              <EmailInfoLabel theme={theme}>
                <FiCalendar /> Date:
              </EmailInfoLabel>
              <EmailInfoValue theme={theme}>
                {formatDate(email.message_timestamp)}
              </EmailInfoValue>
            </EmailInfoItem>
          </EmailDetails>

          <EmailSubjectModal theme={theme}>
            {email.subject || '(No Subject)'}
          </EmailSubjectModal>

          <EmailMessageContainer theme={theme}>
            <FiMessageSquare style={{ marginRight: '10px', opacity: 0.6 }} />
            {email.message_text || '(No message content)'}
          </EmailMessageContainer>
        </ModalBody>

        <ModalFooter theme={theme}>
          <ActionButton
            onClick={() => {
              // Convert back to the format expected by handlers
              const emailData = {
                id: `email-${email.id}`,
                first_name: contactName || contactEmail?.split('@')[0] || 'Unknown',
                last_name: contactEmail ? `(@${contactEmail.split('@')[1]})` : '',
                email_data: email
              };
              onSpam(emailData);
              onClose();
            }}
            theme={theme}
            $variant="danger"
          >
            <FiXCircle /> Spam
          </ActionButton>
          <ActionButton
            onClick={() => {
              // Convert back to the format expected by handlers
              const emailData = {
                id: `email-${email.id}`,
                first_name: contactName || contactEmail?.split('@')[0] || 'Unknown',
                last_name: contactEmail ? `(@${contactEmail.split('@')[1]})` : '',
                email_data: email
              };
              onAddToCRM(emailData);
              onClose();
            }}
            theme={theme}
          >
            <FiCheckCircle /> Add to CRM
          </ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

const OriginalEmailLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  text-decoration: none;
  margin-left: auto;
  font-size: 0.9rem;
  gap: 5px;
  border: 1px solid ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  border-radius: 4px;
  padding: 6px 10px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)'};
    text-decoration: none;
  }
`;

const EmailDetails = styled.div`
  margin-bottom: 20px;
`;

const EmailInfoItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const EmailInfoLabel = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmailInfoValue = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  flex: 1;
`;

const EmailMessageContainer = styled.div`
  background-color: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 4px;
  padding: 20px;
  margin-top: 20px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  max-height: 400px;
  overflow-y: auto;
`;

const EmailSubjectModal = styled.div`
  font-size: 1.1rem;
  font-weight: bold;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  margin-bottom: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding-bottom: 10px;
`;

export default SortPage;