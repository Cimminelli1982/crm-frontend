import {
  EmailList,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaUserSlash, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import LeftPanelSearch from './LeftPanelSearch';

const STATUS_FILTERS = [
  { key: 'unmatched', label: 'Not in CRM', color: '#EF4444' },
  { key: 'hold', label: 'Hold', color: '#F59E0B' },
  { key: 'news', label: 'News', color: '#3B82F6' },
  { key: 'spam', label: 'Spam', color: '#6B7280' },
];

const UnmatchedLeftContent = ({
  theme,
  contacts,
  loading,
  selectedContact,
  onSelectContact,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  stats,
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const mutedColor = isDark ? '#888' : '#999';
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const hoverBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const selectedBg = isDark ? '#1a2a3a' : '#EBF5FB';

  return (
    <>
      <LeftPanelSearch
        theme={theme}
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search contacts..."
      />

      {/* Status filter pills */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '4px 8px 8px',
        flexWrap: 'wrap',
      }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              border: `1px solid ${statusFilter === f.key ? f.color : borderColor}`,
              background: statusFilter === f.key ? f.color : 'transparent',
              color: statusFilter === f.key ? '#fff' : mutedColor,
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: statusFilter === f.key ? 600 : 400,
            }}
          >
            {f.label} {stats[f.key] > 0 ? `(${stats[f.key]})` : ''}
          </button>
        ))}
      </div>

      <EmailList>
        {loading ? (
          <EmptyState theme={theme}>Loading...</EmptyState>
        ) : contacts.length === 0 ? (
          <EmptyState theme={theme}>
            <FaUserSlash size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <span>No contacts</span>
          </EmptyState>
        ) : (
          contacts.map(contact => {
            const isSelected = selectedContact?.id === contact.id;
            const displayName = (contact.name && contact.name !== 'undefined') ? contact.name : (contact.email || contact.mobile || 'Unknown');
            const isWhatsApp = contact.source_type === 'whatsapp';

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                style={{
                  padding: '10px 12px',
                  borderBottom: `1px solid ${borderColor}`,
                  background: isSelected ? selectedBg : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isDark ? '#333' : '#e8e8e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: mutedColor,
                    flexShrink: 0,
                  }}>
                    {(contact.first_name || contact.name || contact.email || '?')[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: textColor,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {displayName}
                      </span>
                      {contact.interaction_count > 1 && (
                        <span style={{
                          fontSize: 10,
                          background: isDark ? '#333' : '#e8e8e8',
                          color: mutedColor,
                          padding: '1px 5px',
                          borderRadius: 8,
                          fontWeight: 600,
                        }}>
                          {contact.interaction_count}x
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: mutedColor,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {isWhatsApp ? <FaWhatsapp size={10} color="#25D366" /> : <FaEnvelope size={10} />}
                      {contact.email || contact.mobile}
                    </div>
                  </div>

                  {/* Relative time */}
                  <span style={{ fontSize: 10, color: mutedColor, flexShrink: 0 }}>
                    {contact.last_seen_at ? formatRelative(contact.last_seen_at) : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </EmailList>
    </>
  );
};

function formatRelative(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 2592000)}mo`;
}

export default UnmatchedLeftContent;
