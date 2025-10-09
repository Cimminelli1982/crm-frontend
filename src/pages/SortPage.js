import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaSync } from 'react-icons/fa';
import { FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiMail, FiUser, FiCalendar, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ContactsListDRY from '../components/ContactsListDRY';
import { MailFilterEmailList, EmailModal } from '../components/MailFilterComponents';
import {
  PageContainer,
  PageView,
  PageHeader,
  HeaderContent,
  HeaderText,
  PageTitle,
  PageSubtitle,
  RefreshButton,
  FilterTabs,
  FilterTab,
  ContentArea,
  SubMenu,
  SubTab
} from '../components/shared/PageLayout';

const SortPage = ({ theme, onInboxCountChange }) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Inbox');
  const [inboxTimeFilter, setInboxTimeFilter] = useState('Today'); // Time filter for Inbox
  const [spamSubCategory, setSpamSubCategory] = useState('Email');
  const [missingSubCategory, setMissingSubCategory] = useState('Basics');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [confirmSpam, setConfirmSpam] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mailFilterContacts, setMailFilterContacts] = useState([]);
  const [mailFilterLoading, setMailFilterLoading] = useState(false);
  const [inboxTimeCounts, setInboxTimeCounts] = useState({
    'Today': 0,
    'This Week': 0,
    'This Month': 0
  });
  const [currentInboxCount, setCurrentInboxCount] = useState(0);

  const getDataSource = () => {
    if (filterCategory === 'Spam') {
      return {
        type: 'spam',
        subCategory: spamSubCategory
      };
    } else if (filterCategory === 'Missing') {
      return {
        type: 'missing',
        subCategory: missingSubCategory
      };
    } else if (filterCategory === 'Mail Filter') {
      return {
        type: 'mail_filter'
      };
    } else if (filterCategory === 'Inbox') {
      return {
        type: 'inbox',
        category: 'Inbox',
        timeFilter: inboxTimeFilter
      };
    } else {
      return {
        type: 'contacts',
        category: filterCategory
      };
    }
  };

  const handleDataLoad = (data) => {
    if (filterCategory === 'Inbox') {
      setCurrentInboxCount(data.length);
      if (onInboxCountChange) {
        onInboxCountChange(data.length);
      }
    }
  };

  // Handle contact click in Spam → Email view
  const handleSpamContactClick = (contact) => {
    if (filterCategory === 'Spam' && spamSubCategory === 'Email') {
      // Set the contact as confirmSpam to show the modal
      setConfirmSpam(contact);
    }
  };

  // Fetch inbox counts for all time periods
  const fetchInboxCounts = async () => {
    try {
      const { supabase } = await import('../lib/supabaseClient');

      // Today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // This Week (7 days ago to yesterday)
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - 1);
      weekEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      // This Month (30 days ago to 8 days ago)
      const monthEnd = new Date();
      monthEnd.setDate(monthEnd.getDate() - 8);
      monthEnd.setHours(23, 59, 59, 999);
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 30);
      monthStart.setHours(0, 0, 0, 0);

      // Fetch counts
      const [todayResult, weekResult, monthResult] = await Promise.all([
        supabase
          .from('inbox_contacts_with_interactions')
          .select('contact_id', { count: 'exact', head: true })
          .gte('computed_last_interaction', todayStart.toISOString())
          .lte('computed_last_interaction', todayEnd.toISOString()),
        supabase
          .from('inbox_contacts_with_interactions')
          .select('contact_id', { count: 'exact', head: true })
          .gte('computed_last_interaction', weekStart.toISOString())
          .lte('computed_last_interaction', weekEnd.toISOString()),
        supabase
          .from('inbox_contacts_with_interactions')
          .select('contact_id', { count: 'exact', head: true })
          .gte('computed_last_interaction', monthStart.toISOString())
          .lte('computed_last_interaction', monthEnd.toISOString())
      ]);

      setInboxTimeCounts({
        'Today': todayResult.count || 0,
        'This Week': weekResult.count || 0,
        'This Month': monthResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching inbox counts:', error);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    if (filterCategory === 'Mail Filter') {
      fetchMailFilterEmails();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Fetch Mail Filter emails
  const fetchMailFilterEmails = async () => {
    setMailFilterLoading(true);
    try {
      // Get emails from email_inbox with special_case = 'pending_approval'
      const { data: pendingEmails, error } = await supabase
        .from('email_inbox')
        .select('id, from_name, from_email, to_name, to_email, subject, message_text, message_timestamp, direction, special_case')
        .eq('special_case', 'pending_approval')
        .order('message_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform emails to contact format for consistency
      const transformedContacts = (pendingEmails || []).map(email => {
        const isSent = email.direction?.toLowerCase() === 'sent';
        const contactEmail = isSent ? email.to_email : email.from_email;
        const contactName = isSent ? email.to_name : email.from_name;

        return {
          id: `email-${email.id}`,
          contact_id: `email-${email.id}`,
          first_name: contactName || contactEmail?.split('@')[0] || 'Unknown',
          last_name: contactEmail ? `(@${contactEmail.split('@')[1]})` : '',
          email: contactEmail || '',
          mobile: email.subject || '(No Subject)',
          last_interaction_at: email.message_timestamp,
          created_at: email.message_timestamp,
          category: 'Mail Filter',
          direction: email.direction,
          email_data: email
        };
      });

      setMailFilterContacts(transformedContacts);
    } catch (error) {
      console.error('Error fetching mail filter emails:', error);
      toast.error('Failed to load mail filter emails');
    } finally {
      setMailFilterLoading(false);
    }
  };

  // Handle view email
  const handleViewEmail = (emailData) => {
    setSelectedEmail(emailData.email_data);
  };

  // Handle spam button click
  const handleSpamClick = (emailData) => {
    console.log('Spam button clicked:', emailData);
    setConfirmSpam(emailData);
  };

  // Handle marking an email as spam (individual email only)
  const handleConfirmSpam = async () => {
    if (!confirmSpam) return;

    const emailData = confirmSpam;
    try {
      // Update the email record to mark it as reject (individual email)
      const { error } = await supabase
        .from('email_inbox')
        .update({
          special_case: 'reject',
          last_processed_at: new Date().toISOString()
        })
        .eq('id', emailData.email_data.id);

      if (error) throw error;

      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);

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

  // Handle marking entire domain as spam
  const handleConfirmDomainSpam = async () => {
    if (!confirmSpam) return;

    const emailData = confirmSpam;
    const fromEmail = emailData.email_data?.from_email || '';
    const domain = fromEmail.includes('@') ? fromEmail.split('@')[1] : '';

    if (!domain) {
      toast.error('Could not extract domain from email address');
      return;
    }

    try {
      // Update the email record to mark it as reject_domain
      const { error } = await supabase
        .from('email_inbox')
        .update({
          special_case: 'reject_domain',
          last_processed_at: new Date().toISOString()
        })
        .eq('id', emailData.email_data.id);

      if (error) throw error;

      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);

      // Trigger count refresh
      window.dispatchEvent(new CustomEvent('refreshInboxCounts'));

      // Close the confirmation dialog
      setConfirmSpam(null);

      toast.success(`All emails from @${domain} will be blocked`);
      console.log('Domain marked as spam:', domain);
    } catch (err) {
      console.error('Error marking domain as spam:', err);
      toast.error('Failed to mark domain as spam');
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

      // Trigger refresh
      setRefreshTrigger(prev => prev + 1);

      // Trigger count refresh
      window.dispatchEvent(new CustomEvent('refreshInboxCounts'));

      toast.success('Email added to CRM');
      console.log('Email marked for CRM processing:', emailData.email_data.id);
    } catch (err) {
      console.error('Error processing email for CRM:', err);
      toast.error('Failed to add email to CRM');
    }
  };


  // Fetch Mail Filter emails when the tab is selected
  useEffect(() => {
    if (filterCategory === 'Mail Filter') {
      fetchMailFilterEmails();
    }
  }, [filterCategory, refreshTrigger]);

  // Fetch inbox counts when Inbox is selected
  useEffect(() => {
    if (filterCategory === 'Inbox') {
      fetchInboxCounts();
    }
  }, [filterCategory, refreshTrigger]);

  const sortCategories = ['Inbox', 'Mail Filter', 'Missing']; // 'Spam' tab hidden for now

  return (
    <PageContainer theme={theme}>
      <PageView>
        <PageHeader theme={theme}>
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
        </PageHeader>

        {/* Inbox Time Filter Submenu */}
        {filterCategory === 'Inbox' && (
          <SubMenu theme={theme}>
            <SubTab
              theme={theme}
              $active={inboxTimeFilter === 'Today'}
              onClick={() => setInboxTimeFilter('Today')}
              style={{ position: 'relative' }}
            >
              Today
              {inboxTimeFilter === 'Today' && currentInboxCount > 0 && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                  fontWeight: '500'
                }}>
                  ({currentInboxCount})
                </span>
              )}
              {inboxTimeFilter !== 'Today' && inboxTimeCounts['Today'] > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '50%'
                }} />
              )}
            </SubTab>
            <SubTab
              theme={theme}
              $active={inboxTimeFilter === 'This Week'}
              onClick={() => setInboxTimeFilter('This Week')}
              style={{ position: 'relative' }}
            >
              This Week
              {inboxTimeFilter === 'This Week' && currentInboxCount > 0 && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                  fontWeight: '500'
                }}>
                  ({currentInboxCount})
                </span>
              )}
              {inboxTimeFilter !== 'This Week' && inboxTimeCounts['This Week'] > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '50%'
                }} />
              )}
            </SubTab>
            <SubTab
              theme={theme}
              $active={inboxTimeFilter === 'This Month'}
              onClick={() => setInboxTimeFilter('This Month')}
              style={{ position: 'relative' }}
            >
              This Month
              {inboxTimeFilter === 'This Month' && currentInboxCount > 0 && (
                <span style={{
                  marginLeft: '6px',
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                  fontWeight: '500'
                }}>
                  ({currentInboxCount})
                </span>
              )}
              {inboxTimeFilter !== 'This Month' && inboxTimeCounts['This Month'] > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '50%'
                }} />
              )}
            </SubTab>
          </SubMenu>
        )}

        {/* Missing Submenu */}
        {filterCategory === 'Missing' && (
          <SubMenu theme={theme}>
            <SubTab
              theme={theme}
              $active={missingSubCategory === 'Basics'}
              onClick={() => setMissingSubCategory('Basics')}
            >
              Basics
            </SubTab>
            <SubTab
              theme={theme}
              $active={missingSubCategory === 'Company'}
              onClick={() => setMissingSubCategory('Company')}
            >
              Company
            </SubTab>
            <SubTab
              theme={theme}
              $active={missingSubCategory === 'Tags'}
              onClick={() => setMissingSubCategory('Tags')}
            >
              Tags
            </SubTab>
            <SubTab
              theme={theme}
              $active={missingSubCategory === 'Cities'}
              onClick={() => setMissingSubCategory('Cities')}
            >
              Cities
            </SubTab>
            <SubTab
              theme={theme}
              $active={missingSubCategory === 'Score'}
              onClick={() => setMissingSubCategory('Score')}
            >
              Score
            </SubTab>
            <SubTab
              theme={theme}
              $active={missingSubCategory === 'Keep in touch'}
              onClick={() => setMissingSubCategory('Keep in touch')}
            >
              Keep in touch
            </SubTab>
            <SubTab
              theme={theme}
              $active={missingSubCategory === 'Birthday'}
              onClick={() => setMissingSubCategory('Birthday')}
            >
              Birthday
            </SubTab>
          </SubMenu>
        )}

        {/* Spam Submenu - in gray area below header */}
        {filterCategory === 'Spam' && (
          <SubMenu theme={theme}>
            <SubTab
              theme={theme}
              $active={spamSubCategory === 'Email'}
              onClick={() => setSpamSubCategory('Email')}
            >
              Email
            </SubTab>
            {/* WhatsApp spam tab hidden for now
            <SubTab
              theme={theme}
              $active={spamSubCategory === 'WhatsApp'}
              onClick={() => setSpamSubCategory('WhatsApp')}
            >
              WhatsApp
            </SubTab>
            */}
          </SubMenu>
        )}

        <ContentArea>
          {filterCategory === 'Mail Filter' ? (
            <MailFilterEmailList
              contacts={mailFilterContacts}
              loading={mailFilterLoading}
              theme={theme}
              onSpamClick={handleSpamClick}
              onAddToCRM={handleAddToCRM}
              onViewEmail={handleViewEmail}
            />
          ) : (
            <ContactsListDRY
              key={`${filterCategory}-${inboxTimeFilter}-${spamSubCategory}-${missingSubCategory}-${refreshTrigger}`}
              dataSource={getDataSource()}
              refreshTrigger={refreshTrigger}
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
              onDataLoad={handleDataLoad}
              onContactUpdate={() => setRefreshTrigger(prev => prev + 1)}
              showActions={true}
              badgeType="category"
              pageContext="sort"
              onContactClick={filterCategory === 'Spam' && spamSubCategory === 'Email' ? handleSpamContactClick : undefined}
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
              style={{ maxWidth: '500px', padding: '20px' }}
            >
              <ModalHeader theme={theme}>
                <ModalTitle theme={theme}>
                  <FiXCircle style={{ marginRight: '10px', color: '#ff5555' }} /> Block Spam Email
                </ModalTitle>
                <ModalCloseButton onClick={() => setConfirmSpam(null)} theme={theme}>×</ModalCloseButton>
              </ModalHeader>

              <ModalBody theme={theme}>
                <p style={{ marginBottom: '20px', fontSize: '16px', fontWeight: '500' }}>
                  How would you like to block emails from this sender?
                </p>
                <div style={{
                  backgroundColor: theme === 'light' ? '#F3F4F6' : '#1a1a1a',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>From:</strong> {confirmSpam.email_data?.from_email || 'Unknown'}
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>Name:</strong> {confirmSpam.first_name} {confirmSpam.last_name}
                  </p>
                  <p>
                    <strong>Subject:</strong> {confirmSpam.email_data?.subject || '(No Subject)'}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '20px'
                }}>
                  <div style={{
                    padding: '12px',
                    border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
                    borderRadius: '8px',
                    backgroundColor: theme === 'light' ? '#fff' : '#1f2937'
                  }}>
                    <p style={{
                      fontWeight: '500',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ marginRight: '8px' }}>📧</span>
                      Block this email only
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: theme === 'light' ? '#6b7280' : '#9ca3af',
                      marginLeft: '28px'
                    }}>
                      Block: {confirmSpam.email_data?.from_email || 'this sender'}
                    </p>
                  </div>

                  <div style={{
                    padding: '12px',
                    border: `1px solid ${theme === 'light' ? '#fee2e2' : '#7f1d1d'}`,
                    borderRadius: '8px',
                    backgroundColor: theme === 'light' ? '#fef2f2' : '#2a1a1a'
                  }}>
                    <p style={{
                      fontWeight: '500',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#ef4444'
                    }}>
                      <span style={{ marginRight: '8px' }}>🚫</span>
                      Block entire domain
                    </p>
                    <p style={{
                      fontSize: '14px',
                      color: theme === 'light' ? '#6b7280' : '#9ca3af',
                      marginLeft: '28px'
                    }}>
                      Block all emails from: @{confirmSpam.email_data?.from_email?.split('@')[1] || 'domain'}
                    </p>
                  </div>
                </div>
              </ModalBody>

              <ModalFooter theme={theme} style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '10px',
                marginTop: '20px'
              }}>
                <ActionButton
                  onClick={() => setConfirmSpam(null)}
                  theme={theme}
                  $variant="secondary"
                  style={{ flex: '1' }}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  onClick={handleConfirmSpam}
                  theme={theme}
                  $variant="warning"
                  style={{ flex: '1' }}
                >
                  <FiUser style={{ marginRight: '6px' }} />
                  Block Email
                </ActionButton>
                <ActionButton
                  onClick={handleConfirmDomainSpam}
                  theme={theme}
                  $variant="danger"
                  style={{ flex: '1' }}
                >
                  <FiXCircle style={{ marginRight: '6px' }} />
                  Block Domain
                </ActionButton>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageView>
    </PageContainer>
  );
};


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



export default SortPage;