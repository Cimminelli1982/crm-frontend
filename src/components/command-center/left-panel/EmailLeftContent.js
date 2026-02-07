import {
  EmailList,
  EmailItem,
  EmailSender,
  EmailUnreadDot,
  EmailSubject,
  EmailSnippet,
  SearchResultsHeader,
  SearchResultDate,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaSpinner } from 'react-icons/fa';
import { WhatsAppChatList } from '../WhatsAppTab';
import CollapsibleSection from './CollapsibleSection';

const EmailLeftContent = ({
  theme,
  activeTab,
  // Email data
  threads,
  emails,
  selectedThread,
  threadsLoading,
  handleSelectThread,
  getRelevantPerson,
  // Email search
  isSearchingEmails,
  emailSearchLoading,
  emailSearchResults,
  emailSearchQuery,
  handleSelectSearchResult,
  // WhatsApp data
  whatsappChats,
  whatsappMessages,
  selectedWhatsappChat,
  setSelectedWhatsappChat,
  whatsappLoading,
  // WhatsApp search
  isSearchingWhatsapp,
  whatsappSearchLoading,
  whatsappSearchResults,
  whatsappSearchQuery,
  handleSelectWhatsappSearchResult,
  // Shared
  emailContacts,
  statusSections,
  toggleStatusSection,
  filterByStatus,
}) => {
  const isEmail = activeTab === 'email';

  const renderEmailThread = (thread, archiving = false) => (
    <EmailItem
      key={thread.threadId}
      theme={theme}
      $selected={selectedThread?.[0]?.thread_id === thread.threadId || selectedThread?.[0]?.id === thread.threadId}
      onClick={() => handleSelectThread(thread.emails)}
      style={archiving ? { opacity: 0.6 } : undefined}
    >
      <EmailSender theme={theme}>
        {archiving && <FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: '4px' }} />}
        {!archiving && thread.emails.some(e => e.is_read === false) && <EmailUnreadDot />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {getRelevantPerson(thread.latestEmail)}
        </span>
        {thread.count > 1 && <span style={{ opacity: 0.6, flexShrink: 0 }}>({thread.count})</span>}
      </EmailSender>
      <EmailSubject theme={theme}>{thread.latestEmail.subject}</EmailSubject>
      <EmailSnippet theme={theme}>{thread.latestEmail.snippet}</EmailSnippet>
    </EmailItem>
  );

  const renderSection = (sectionKey, title, variant = 'default', titleColor) => {
    const items = isEmail ? filterByStatus(threads, sectionKey) : filterByStatus(whatsappChats, sectionKey);

    // Archiving section only shows when there are items
    if (sectionKey === 'archiving' && items.length === 0) return null;

    return (
      <CollapsibleSection
        theme={theme}
        title={title}
        count={items.length}
        isOpen={statusSections[sectionKey]}
        onToggle={() => toggleStatusSection(sectionKey)}
        variant={variant}
        titleColor={titleColor}
      >
        {isEmail ? (
          items.map(thread => renderEmailThread(thread, sectionKey === 'archiving'))
        ) : (
          <WhatsAppChatList
            theme={theme}
            chats={items}
            selectedChat={selectedWhatsappChat}
            onSelectChat={setSelectedWhatsappChat}
            loading={false}
            contacts={emailContacts}
            archiving={sectionKey === 'archiving'}
          />
        )}
      </CollapsibleSection>
    );
  };

  return (
    <EmailList style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {threadsLoading || whatsappLoading ? (
        <EmptyState theme={theme}>Loading...</EmptyState>
      ) : isSearchingEmails && isEmail ? (
        <>
          <SearchResultsHeader theme={theme}>
            {emailSearchLoading ? 'Searching...' : `${emailSearchResults.length} threads found`}
          </SearchResultsHeader>
          {emailSearchResults.map(result => (
            <EmailItem
              key={result.email_thread_id}
              theme={theme}
              $selected={selectedThread?.[0]?._email_thread_id === result.email_thread_id}
              onClick={() => handleSelectSearchResult(result)}
            >
              <EmailSender theme={theme}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {result.latestEmail?.from_name || result.latestEmail?.from_email || 'Unknown'}
                </span>
                {result.emails?.length > 1 && (
                  <span style={{ opacity: 0.6, flexShrink: 0 }}>({result.emails.length})</span>
                )}
              </EmailSender>
              <EmailSubject theme={theme}>{result.subject || 'No Subject'}</EmailSubject>
              <EmailSnippet theme={theme}>
                {result.latestEmail?.body_plain?.substring(0, 100) || ''}
              </EmailSnippet>
              <SearchResultDate theme={theme}>
                {result.last_message_timestamp ? new Date(result.last_message_timestamp).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : ''}
              </SearchResultDate>
            </EmailItem>
          ))}
          {!emailSearchLoading && emailSearchResults.length === 0 && (
            <EmptyState theme={theme}>No emails found matching "{emailSearchQuery}"</EmptyState>
          )}
        </>
      ) : isSearchingWhatsapp && !isEmail ? (
        <>
          <SearchResultsHeader theme={theme}>
            {whatsappSearchLoading ? 'Searching...' : `${whatsappSearchResults.length} chats found`}
          </SearchResultsHeader>
          {whatsappSearchResults.map(result => {
            const matchBadge = {
              chat_name: { label: 'Name', color: '#10B981', bg: '#D1FAE5' },
              contact: { label: 'Contact', color: '#3B82F6', bg: '#DBEAFE' },
              phone: { label: 'Phone', color: '#8B5CF6', bg: '#EDE9FE' },
              content: { label: 'Message', color: '#F59E0B', bg: '#FEF3C7' }
            }[result.match_source] || { label: 'Match', color: '#6B7280', bg: '#F3F4F6' };

            return (
              <EmailItem
                key={result.result_chat_id}
                theme={theme}
                $selected={selectedWhatsappChat?.chat_id === result.result_chat_id}
                onClick={() => handleSelectWhatsappSearchResult(result)}
              >
                <EmailSender theme={theme}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {result.contact_name?.trim() || result.result_chat_name || 'Unknown'}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: theme === 'light' ? matchBadge.bg : `${matchBadge.color}20`,
                    color: matchBadge.color,
                    fontWeight: 500,
                    flexShrink: 0
                  }}>
                    {matchBadge.label}
                  </span>
                </EmailSender>
                <EmailSubject theme={theme}>{result.result_chat_name || 'Unknown Chat'}</EmailSubject>
                <EmailSnippet theme={theme}>
                  {result.latest_message_preview?.substring(0, 100) || ''}
                </EmailSnippet>
                <SearchResultDate theme={theme}>
                  {result.last_message_timestamp ? new Date(result.last_message_timestamp).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }) : ''}
                </SearchResultDate>
              </EmailItem>
            );
          })}
          {!whatsappSearchLoading && whatsappSearchResults.length === 0 && (
            <EmptyState theme={theme}>No chats found matching "{whatsappSearchQuery}"</EmptyState>
          )}
        </>
      ) : (
        <>
          {renderSection('inbox', 'Inbox')}
          {renderSection('need_actions', 'Need Actions')}
          {renderSection('waiting_input', 'Waiting Input')}
          {renderSection('archiving', 'Archiving', 'success', '#10b981')}
        </>
      )}
    </EmailList>
  );
};

export default EmailLeftContent;
