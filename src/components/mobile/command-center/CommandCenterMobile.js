import React, { useState } from 'react';
import styled from 'styled-components';
import { FaWhatsapp, FaCalendar, FaTasks, FaDollarSign, FaUserCheck, FaHandshake, FaStickyNote, FaList } from 'react-icons/fa';

import ScrollableTabBar from './ScrollableTabBar';
import BottomActionBar from './BottomActionBar';
import ActionSheet from './ActionSheet';
import MobileEmailList from './MobileEmailList';
import MobileEmailView from './MobileEmailView';
import MobileWhatsAppList from './MobileWhatsAppList';
import MobileWhatsAppView from './MobileWhatsAppView';
import MobileCalendarView from './MobileCalendarView';
import MobileTasksList from './MobileTasksList';
import MobileDealsView from './MobileDealsView';
import MobileKeepInTouchList from './MobileKeepInTouchList';
import MobileIntroductionsView from './MobileIntroductionsView';
import MobileNotesView from './MobileNotesView';
import MobileListsView from './MobileListsView';
import ContactSelector from '../../../components/command-center/ContactSelector';

/**
 * CommandCenterMobile - Mobile-first version of Command Center
 *
 * Layout:
 * ┌─────────────────────────────┐
 * │  [Email] [WA] [Cal] ...     │  ← ScrollableTabBar
 * ├─────────────────────────────┤
 * │                             │
 * │     Content Area            │
 * │     (tab-specific)          │
 * │                             │
 * ├─────────────────────────────┤
 * │  [←]     [+]     [⋮]        │  ← BottomActionBar
 * └─────────────────────────────┘
 *
 * + ActionSheet for right panel actions
 */
const CommandCenterMobile = ({
  theme = 'dark',
  // Tab data (passed from coordinator)
  tabs,
  activeTab,
  onTabChange,
  // Email data
  emailThreads,
  selectedThread,
  onSelectThread,
  // WhatsApp data
  whatsappChats,
  selectedChat,
  onSelectChat,
  // Tasks data
  tasks,
  // Calendar data
  calendarEvents,
  selectedEvent,
  onSelectEvent,
  // Keep in Touch
  keepInTouchContacts,
  // Deals
  deals,
  // Context data (contacts/companies from current email/whatsapp)
  emailContacts = [],
  emailCompanies = [],
  // Contact selector (same as web right panel)
  availableContacts = [],
  selectedContactId,
  onSelectContact,
  // Data integrity
  dataIntegrityCount = 0,
  // Contact/Company view actions
  onViewContact,
  onViewCompany,
  onViewDeals,
  onViewIntroductions,
  onViewFiles,
  // Email actions
  onComposeEmail,
  onArchiveEmail,
  onReplyEmail,
  onRefreshEmails,
  // WhatsApp actions
  onSendWhatsApp,
  // Task actions
  onCreateTask,
  onCompleteTask,
  // Note actions
  onCreateNote,
  // Deal actions
  onCreateDeal,
}) => {
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [localSelectedThread, setLocalSelectedThread] = useState(null);

  // Handle email selection - show detail view
  const handleSelectThread = (thread) => {
    setLocalSelectedThread(thread);
    setViewMode('detail');
    // Pass emails array to parent (selectedThread expects array of emails, not thread object)
    const emails = thread.emails || [thread.latestEmail || thread];
    onSelectThread?.(emails);
  };

  // Handle primary action based on active tab
  const handlePrimaryAction = () => {
    switch (activeTab) {
      case 'email':
        if (viewMode === 'detail' && localSelectedThread) {
          // Reply to current email
          onReplyEmail?.(localSelectedThread);
        } else {
          onComposeEmail?.();
        }
        break;
      case 'whatsapp':
        onSendWhatsApp?.();
        break;
      case 'tasks':
        onCreateTask?.();
        break;
      case 'deals':
        onCreateDeal?.();
        break;
      case 'notes':
        onCreateNote?.();
        break;
      case 'keepintouch':
        // No primary action for KIT - select contact first
        break;
      default:
        break;
    }
  };

  // Handle back from detail view
  const handleBack = () => {
    setViewMode('list');
    setLocalSelectedThread(null);
    setLocalSelectedChat(null);
  };

  // Local state for different tabs
  const [localSelectedChat, setLocalSelectedChat] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedList, setSelectedList] = useState(null);

  // Handle WhatsApp chat selection
  const handleSelectChat = (chat) => {
    setLocalSelectedChat(chat);
    setViewMode('detail');
    onSelectChat?.(chat);
  };

  // Get selected contact from availableContacts (uses ContactSelector selection)
  const getSelectedContact = () => {
    if (selectedContactId && availableContacts.length > 0) {
      return availableContacts.find(c => c.contact_id === selectedContactId) || availableContacts[0];
    }
    if (availableContacts.length > 0) {
      return availableContacts[0];
    }
    // Fallback to emailContacts
    if (emailContacts.length > 0) {
      return emailContacts[0]?.contact || null;
    }
    return null;
  };

  // Get company associated with selected contact
  const getSelectedCompany = () => {
    if (emailCompanies.length > 0) {
      return emailCompanies[0] || null;
    }
    return null;
  };

  // Render content based on active tab and view mode
  const renderContent = () => {
    // Email tab
    if (activeTab === 'email') {
      if (viewMode === 'detail' && localSelectedThread) {
        // Get contact/company from selected contact
        const threadContact = getSelectedContact();
        const threadCompany = getSelectedCompany();
        
        return (
          <>
            {/* Data Integrity Warning Bar - same as web */}
            {dataIntegrityCount > 0 && (
              <DataIntegrityBar theme={theme}>
                <DataIntegrityIcon>⚠️</DataIntegrityIcon>
                <DataIntegrityText theme={theme}>
                  {dataIntegrityCount} data {dataIntegrityCount === 1 ? 'issue' : 'issues'} found
                </DataIntegrityText>
                <DataIntegrityBadge>{dataIntegrityCount}</DataIntegrityBadge>
              </DataIntegrityBar>
            )}
            {/* Contact Selector - same as web right panel */}
            {availableContacts.length > 0 && (
              <ContactSelectorWrapper theme={theme}>
                <ContactSelector
                  contacts={availableContacts}
                  selectedContactId={selectedContactId}
                  onSelect={onSelectContact}
                  onAddNew={() => {/* TODO: open add contact modal */}}
                  theme={theme}
                />
              </ContactSelectorWrapper>
            )}
            <MobileEmailView
            thread={localSelectedThread}
            onBack={handleBack}
            onReply={() => onReplyEmail?.(localSelectedThread)}
            onArchive={() => onArchiveEmail?.(localSelectedThread)}
            onMoreActions={() => setActionSheetOpen(true)}
            theme={theme}
            // Context panel props - use real data from emailContacts
            contact={threadContact}
            company={threadCompany}
            tasks={tasks || []}
            deals={deals || []}
            notes={[]}
            introductions={[]}
            files={[]}
            onSendEmail={() => {
              const contact = getSelectedContact();
              onComposeEmail?.(contact);
            }}
            onSendWhatsApp={() => {
              const contact = getSelectedContact();
              onSendWhatsApp?.(contact);
            }}
            onCreateTask={() => {
              const contact = getSelectedContact();
              onCreateTask?.(contact?.contact_id);
            }}
            onCreateNote={() => {
              const contact = getSelectedContact();
              onCreateNote?.(contact?.contact_id);
            }}
            onViewContact={() => {
              const contact = getSelectedContact();
              if (contact?.contact_id) {
                onViewContact?.(contact.contact_id);
              }
            }}
            onViewCompany={() => {
              const company = getSelectedCompany();
              if (company?.company_id) {
                onViewCompany?.(company.company_id);
              }
            }}
            onViewDeals={() => onViewDeals?.()}
            onViewIntroductions={() => onViewIntroductions?.()}
            onViewFiles={() => onViewFiles?.()}
          />
          </>
        );
      }
      return (
        <MobileEmailList
          threads={emailThreads || []}
          selectedThread={localSelectedThread}
          onSelectThread={handleSelectThread}
          onArchive={(thread) => onArchiveEmail?.(thread)}
          onReply={(thread) => {
            setLocalSelectedThread(thread);
            setViewMode('detail');
            onReplyEmail?.(thread);
          }}
          onRefresh={onRefreshEmails}
          theme={theme}
        />
      );
    }

    // WhatsApp tab
    if (activeTab === 'whatsapp') {
      if (viewMode === 'detail' && localSelectedChat) {
        // Get contact/company from selected contact
        const chatContact = getSelectedContact();
        const chatCompany = getSelectedCompany();
        
        return (
          <>
            {/* Data Integrity Warning Bar - same as web */}
            {dataIntegrityCount > 0 && (
              <DataIntegrityBar theme={theme}>
                <DataIntegrityIcon>⚠️</DataIntegrityIcon>
                <DataIntegrityText theme={theme}>
                  {dataIntegrityCount} data {dataIntegrityCount === 1 ? 'issue' : 'issues'} found
                </DataIntegrityText>
                <DataIntegrityBadge>{dataIntegrityCount}</DataIntegrityBadge>
              </DataIntegrityBar>
            )}
            {/* Contact Selector - same as web right panel */}
            {availableContacts.length > 0 && (
              <ContactSelectorWrapper theme={theme}>
                <ContactSelector
                  contacts={availableContacts}
                  selectedContactId={selectedContactId}
                  onSelect={onSelectContact}
                  onAddNew={() => {/* TODO: open add contact modal */}}
                  theme={theme}
                />
              </ContactSelectorWrapper>
            )}
            <MobileWhatsAppView
            chat={localSelectedChat}
            onBack={handleBack}
            onDone={() => {
              // TODO: implement mark done for whatsapp
              handleBack();
            }}
            onMoreActions={() => setActionSheetOpen(true)}
            onSendMessage={(text) => {
              // TODO: implement send whatsapp message
            }}
            theme={theme}
            // Context panel props
            contact={chatContact}
            company={chatCompany}
            tasks={tasks || []}
            deals={deals || []}
            notes={[]}
            introductions={[]}
            files={[]}
            onSendEmail={() => {
              const contact = getSelectedContact();
              onComposeEmail?.(contact);
            }}
            onCreateTask={() => {
              const contact = getSelectedContact();
              onCreateTask?.(contact?.contact_id);
            }}
            onCreateNote={() => {
              const contact = getSelectedContact();
              onCreateNote?.(contact?.contact_id);
            }}
            onViewContact={() => {
              const contact = getSelectedContact();
              if (contact?.contact_id) {
                onViewContact?.(contact.contact_id);
              }
            }}
            onViewCompany={() => {
              const company = getSelectedCompany();
              if (company?.company_id) {
                onViewCompany?.(company.company_id);
              }
            }}
            onViewDeals={() => onViewDeals?.()}
            onViewIntroductions={() => onViewIntroductions?.()}
            onViewFiles={() => onViewFiles?.()}
          />
          </>
        );
      }
      return (
        <MobileWhatsAppList
          chats={whatsappChats || []}
          selectedChat={localSelectedChat}
          onSelectChat={handleSelectChat}
          theme={theme}
        />
      );
    }

    // Calendar tab
    if (activeTab === 'calendar') {
      return (
        <MobileCalendarView
          events={calendarEvents || []}
          selectedDate={selectedCalendarDate}
          onDateChange={setSelectedCalendarDate}
          onEventSelect={(event) => {
            onSelectEvent?.(event);
            setActionSheetOpen(true);
          }}
          theme={theme}
        />
      );
    }

    // Tasks tab
    if (activeTab === 'tasks') {
      return (
        <MobileTasksList
          tasks={tasks || []}
          onTaskComplete={(taskId, todoistId) => onCompleteTask?.(taskId, todoistId)}
          onTaskSelect={(task) => {
            setActionSheetOpen(true);
          }}
          onRefresh={() => {/* Tasks auto-refresh via hook */}}
          onCreateTask={() => onCreateTask?.()}
          theme={theme}
        />
      );
    }

    // Deals tab
    if (activeTab === 'deals') {
      return (
        <MobileDealsView
          deals={deals || []}
          onDealSelect={(deal) => {
            setActionSheetOpen(true);
          }}
          onCreateDeal={() => onCreateDeal?.()}
          onUpdateStage={(dealId, stage) => {
            // TODO: wire up deal stage update
          }}
          theme={theme}
        />
      );
    }

    // Keep in Touch tab
    if (activeTab === 'keepintouch') {
      return (
        <MobileKeepInTouchList
          contacts={keepInTouchContacts || []}
          onContactSelect={(contact) => {
            if (contact?.contact_id) {
              onViewContact?.(contact.contact_id);
            }
          }}
          onEmailContact={(contact) => onComposeEmail?.(contact)}
          onWhatsAppContact={(contact) => onSendWhatsApp?.(contact)}
          theme={theme}
        />
      );
    }

    // Introductions tab
    if (activeTab === 'introductions') {
      return (
        <MobileIntroductionsView
          introductions={[]} // TODO: Pass introductions from props
          onIntroductionSelect={(intro) => {
            setActionSheetOpen(true);
          }}
          onCreateIntroduction={() => {
            // TODO: wire up introduction creation
          }}
          theme={theme}
        />
      );
    }

    // Notes tab
    if (activeTab === 'notes') {
      return (
        <MobileNotesView
          notes={[]} // TODO: Pass notes from props
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onCreateNote={() => onCreateNote?.()}
          theme={theme}
        />
      );
    }

    // Lists tab
    if (activeTab === 'lists') {
      return (
        <MobileListsView
          lists={[]} // TODO: Pass lists from props
          selectedList={selectedList}
          members={[]}
          onSelectList={setSelectedList}
          onSelectMember={(member) => {
            if (member?.contact_id) {
              onViewContact?.(member.contact_id);
            }
          }}
          onCreateList={() => {
            // TODO: wire up list creation
          }}
          theme={theme}
        />
      );
    }

    // Fallback placeholder for any unknown tabs
    const tabIcons = {
      whatsapp: <FaWhatsapp size={48} />,
      calendar: <FaCalendar size={48} />,
      tasks: <FaTasks size={48} />,
      deals: <FaDollarSign size={48} />,
      keepintouch: <FaUserCheck size={48} />,
      introductions: <FaHandshake size={48} />,
      notes: <FaStickyNote size={48} />,
      lists: <FaList size={48} />,
    };

    return (
      <PlaceholderContent theme={theme}>
        <PlaceholderIcon>
          {tabIcons[activeTab] || <span style={{ fontSize: 48 }}>📱</span>}
        </PlaceholderIcon>
        <PlaceholderTitle theme={theme}>
          Mobile {activeTab?.charAt(0).toUpperCase() + activeTab?.slice(1)}
        </PlaceholderTitle>
        <PlaceholderText theme={theme}>
          Coming soon! This tab will show your {activeTab} content.
        </PlaceholderText>
      </PlaceholderContent>
    );
  };

  return (
    <Container theme={theme}>
      {/* Top: Scrollable Tab Bar */}
      <ScrollableTabBar
        tabs={tabs || []}
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab);
          setViewMode('list');
          setLocalSelectedThread(null);
          setLocalSelectedChat(null);
          setSelectedNote(null);
          setSelectedList(null);
        }}
        theme={theme}
      />

      {/* Main Content Area */}
      <ContentArea>
        {renderContent()}
      </ContentArea>

      {/* Bottom: Action Bar */}
      <BottomActionBar
        activeTab={activeTab}
        showBack={viewMode === 'detail'}
        onBack={handleBack}
        onPrimaryAction={handlePrimaryAction}
        onMoreActions={() => setActionSheetOpen(true)}
        theme={theme}
        hasSelection={viewMode === 'detail'}
      />

      {/* Action Sheet (replaces right panel) */}
      <ActionSheet
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        title="Actions"
        theme={theme}
        height="50%"
      >
        <ActionList theme={theme}>
          <ActionItem theme={theme} onClick={() => {
            const contact = getSelectedContact();
            if (contact?.contact_id) {
              onViewContact?.(contact.contact_id);
              setActionSheetOpen(false);
            }
          }}>
            <span>👤</span>
            <span>Contact Details</span>
          </ActionItem>
          <ActionItem theme={theme} onClick={() => {
            const company = getSelectedCompany();
            if (company?.company_id) {
              onViewCompany?.(company.company_id);
              setActionSheetOpen(false);
            }
          }}>
            <span>🏢</span>
            <span>Company Details</span>
          </ActionItem>
          <ActionItem theme={theme} onClick={() => {
            const contact = getSelectedContact();
            onComposeEmail?.(contact);
            setActionSheetOpen(false);
          }}>
            <span>✉️</span>
            <span>Send Email</span>
          </ActionItem>
          <ActionItem theme={theme} onClick={() => {
            const contact = getSelectedContact();
            onSendWhatsApp?.(contact);
            setActionSheetOpen(false);
          }}>
            <span>💬</span>
            <span>Send WhatsApp</span>
          </ActionItem>
          <ActionItem theme={theme} onClick={() => {
            onCreateTask?.();
            setActionSheetOpen(false);
          }}>
            <span>📋</span>
            <span>Create Task</span>
          </ActionItem>
          <ActionItem theme={theme} onClick={() => {
            onCreateNote?.();
            setActionSheetOpen(false);
          }}>
            <span>📝</span>
            <span>Create Note</span>
          </ActionItem>
          <ActionItem theme={theme} onClick={() => {
            onCreateDeal?.();
            setActionSheetOpen(false);
          }}>
            <span>💰</span>
            <span>Create Deal</span>
          </ActionItem>
        </ActionList>
      </ActionSheet>
    </Container>
  );
};

// Styled Components
// Data Integrity Warning Bar for mobile
const DataIntegrityBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin: 8px 12px;
  background: ${props => props.theme === 'light' ? '#EFF6FF' : '#1e3a5f'};
  border: 1px solid ${props => props.theme === 'light' ? '#BFDBFE' : '#1E40AF'};
  border-radius: 8px;
`;

const DataIntegrityIcon = styled.span`
  font-size: 14px;
`;

const DataIntegrityText = styled.span`
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
`;

const DataIntegrityBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  background: #3B82F6;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
`;

// ContactSelector wrapper for mobile
const ContactSelectorWrapper = styled.div`
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile browsers */
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 140px; /* Space for action bar (56px) + app nav (70px) + margin */
`;

const PlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  padding: 24px;
  text-align: center;
`;

const PlaceholderIcon = styled.div`
  color: #6B7280;
  margin-bottom: 16px;
`;

const PlaceholderTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const PlaceholderText = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
`;

const ActionList = styled.div`
  padding: 8px 0;
`;

const ActionItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 16px;
  text-align: left;
  cursor: pointer;
  min-height: 56px;

  &:active {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }

  span:first-child {
    font-size: 20px;
  }
`;

export default CommandCenterMobile;
