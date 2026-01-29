import React, { useState } from 'react';
import styled from 'styled-components';
import { FaWhatsapp, FaCalendar, FaTasks, FaDollarSign, FaUserCheck, FaHandshake, FaStickyNote, FaList } from 'react-icons/fa';

import ScrollableTabBar from './ScrollableTabBar';
import BottomActionBar from './BottomActionBar';
import ActionSheet from './ActionSheet';
import MobileEmailList from './MobileEmailList';
import MobileEmailView from './MobileEmailView';

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
  // Actions
  onComposeEmail,
  onSendWhatsApp,
  onCreateTask,
  onArchiveEmail,
  onReplyEmail,
  onRefreshEmails,
  // ... more props will be added as we build out
}) => {
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [localSelectedThread, setLocalSelectedThread] = useState(null);

  // Handle email selection - show detail view
  const handleSelectThread = (thread) => {
    setLocalSelectedThread(thread);
    setViewMode('detail');
    onSelectThread?.(thread);
  };

  // Handle primary action based on active tab
  const handlePrimaryAction = () => {
    switch (activeTab) {
      case 'email':
        if (viewMode === 'detail' && localSelectedThread) {
          // Reply to current email
          console.log('Reply to email');
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
      default:
        console.log('Primary action for', activeTab);
    }
  };

  // Handle back from detail view
  const handleBack = () => {
    setViewMode('list');
    setLocalSelectedThread(null);
  };

  // Render content based on active tab and view mode
  const renderContent = () => {
    // Email tab
    if (activeTab === 'email') {
      if (viewMode === 'detail' && localSelectedThread) {
        return (
          <MobileEmailView
            thread={localSelectedThread}
            onBack={handleBack}
            onReply={() => console.log('Reply')}
            onArchive={() => console.log('Archive')}
            onMoreActions={() => setActionSheetOpen(true)}
            theme={theme}
          />
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

    // Placeholder for other tabs
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
          <ActionItem theme={theme}>
            <span>👤</span>
            <span>Contact Details</span>
          </ActionItem>
          <ActionItem theme={theme}>
            <span>🏢</span>
            <span>Company Details</span>
          </ActionItem>
          <ActionItem theme={theme}>
            <span>✉️</span>
            <span>Send Email</span>
          </ActionItem>
          <ActionItem theme={theme}>
            <span>💬</span>
            <span>Send WhatsApp</span>
          </ActionItem>
          <ActionItem theme={theme}>
            <span>🤖</span>
            <span>Chat with Claude</span>
          </ActionItem>
          <ActionItem theme={theme}>
            <span>📎</span>
            <span>Files</span>
          </ActionItem>
        </ActionList>
      </ActionSheet>
    </Container>
  );
};

// Styled Components
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
