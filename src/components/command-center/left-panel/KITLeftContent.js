import {
  EmailList,
  EmailItem,
  EmailSender,
  EmailSubject,
  EmailSnippet,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaSearch, FaUserCheck } from 'react-icons/fa';
import CollapsibleSection from './CollapsibleSection';
import KITContactItem from './items/KITContactItem';
import LeftPanelSearch from './LeftPanelSearch';

const KITLeftContent = ({
  theme,
  keepInTouchContacts,
  keepInTouchLoading,
  selectedKeepInTouchContact,
  setSelectedKeepInTouchContact,
  keepInTouchSections,
  setKeepInTouchSections,
  keepInTouchSearchQuery,
  setKeepInTouchSearchQuery,
  keepInTouchSearchResults,
  setKeepInTouchSearchResults,
  keepInTouchSearchLoading,
  isSearchingKeepInTouch,
  setIsSearchingKeepInTouch,
  filterKeepInTouchByStatus,
}) => {
  const renderSearchResults = () => {
    if (keepInTouchSearchLoading) {
      return <EmptyState theme={theme}>Searching...</EmptyState>;
    }
    if (keepInTouchSearchResults.length === 0) {
      return (
        <EmptyState theme={theme}>
          <FaSearch size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <span>No results found</span>
        </EmptyState>
      );
    }
    return keepInTouchSearchResults.map(contact => {
      const matchBadge = {
        name: { label: 'Name', color: '#10B981', bg: '#D1FAE5' },
        email: { label: 'Email', color: '#3B82F6', bg: '#DBEAFE' },
        company: { label: 'Company', color: '#8B5CF6', bg: '#EDE9FE' }
      }[contact.match_source] || { label: 'Match', color: '#6B7280', bg: '#F3F4F6' };

      return (
        <EmailItem
          key={contact.contact_id}
          theme={theme}
          $selected={selectedKeepInTouchContact?.contact_id === contact.contact_id}
          onClick={() => setSelectedKeepInTouchContact(contact)}
          style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: contact.profile_image_url ? 'transparent' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 600,
            color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {contact.profile_image_url ? (
              <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              contact.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <EmailSender theme={theme}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {contact.full_name}
              </span>
            </EmailSender>
            <EmailSubject theme={theme} style={{
              fontWeight: 600,
              color: contact.days_until_next < 0 ? '#ef4444' : contact.days_until_next <= 14 ? '#f59e0b' : (theme === 'dark' ? '#D1D5DB' : '#374151')
            }}>
              {contact.days_until_next < 0 ? `${Math.abs(contact.days_until_next)} days overdue` : `${contact.days_until_next} days left`}
            </EmailSubject>
            <EmailSnippet theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {contact.frequency}
              <span style={{
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: matchBadge.bg,
                color: matchBadge.color
              }}>
                {matchBadge.label}: {contact.match_value?.length > 30 ? contact.match_value.slice(0, 30) + '...' : contact.match_value}
              </span>
            </EmailSnippet>
          </div>
        </EmailItem>
      );
    });
  };

  const sectionConfigs = [
    { key: 'due', title: 'Due', variant: 'danger', daysColor: '#ef4444', daysText: (c) => `${Math.abs(parseInt(c.days_until_next))} days overdue` },
    { key: 'dueSoon', title: 'Due Soon', variant: 'warning', daysColor: '#f59e0b', daysText: (c) => `${c.days_until_next} days left` },
    { key: 'notDue', title: 'Not Due', variant: 'default', daysColor: undefined, daysText: (c) => `${c.days_until_next} days left` },
  ];

  return (
    <EmailList>
      <LeftPanelSearch
        theme={theme}
        placeholder="Search contacts..."
        value={keepInTouchSearchQuery}
        onChange={setKeepInTouchSearchQuery}
        onClear={() => {
          setKeepInTouchSearchQuery('');
          setKeepInTouchSearchResults([]);
          setIsSearchingKeepInTouch(false);
        }}
      />

      {keepInTouchLoading ? (
        <EmptyState theme={theme}>Loading...</EmptyState>
      ) : isSearchingKeepInTouch ? (
        renderSearchResults()
      ) : keepInTouchContacts.length === 0 ? (
        <EmptyState theme={theme}>
          <FaUserCheck size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <span>No contacts to keep in touch with</span>
        </EmptyState>
      ) : (
        sectionConfigs.map(({ key, title, variant, daysColor, daysText }) => (
          <CollapsibleSection
            key={key}
            theme={theme}
            title={title}
            count={filterKeepInTouchByStatus(keepInTouchContacts, key).length}
            isOpen={keepInTouchSections[key]}
            onToggle={() => setKeepInTouchSections(prev => ({ ...prev, [key]: !prev[key] }))}
            variant={variant}
          >
            {filterKeepInTouchByStatus(keepInTouchContacts, key).map(contact => (
              <KITContactItem
                key={contact.contact_id}
                theme={theme}
                contact={contact}
                isSelected={selectedKeepInTouchContact?.contact_id === contact.contact_id}
                onClick={() => setSelectedKeepInTouchContact(contact)}
                daysColor={daysColor}
                daysText={daysText(contact)}
              />
            ))}
          </CollapsibleSection>
        ))
      )}
    </EmailList>
  );
};

export default KITLeftContent;
