import { FaUserPlus, FaBan, FaPause, FaNewspaper, FaSyncAlt, FaEnvelope, FaWhatsapp, FaExternalLinkAlt, FaGlobe } from 'react-icons/fa';

const UnmatchedCenterContent = ({
  theme,
  contact,
  onAddToCrm,
  onMarkSpam,
  onMarkNews,
  onPutOnHold,
  onUndo,
  onRefresh,
  domainContacts,
}) => {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e0e0e0' : '#333';
  const mutedColor = isDark ? '#888' : '#999';
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const cardBg = isDark ? '#1e1e1e' : '#fff';
  const surfaceBg = isDark ? '#252525' : '#f8f8f8';

  if (!contact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: mutedColor,
        fontSize: 14,
      }}>
        Select a contact from the list
      </div>
    );
  }

  const isWhatsApp = contact.source_type === 'whatsapp';
  const isActioned = ['spam', 'hold', 'dismissed', 'matched'].includes(contact.status);
  const displayName = (contact.name && contact.name !== 'undefined') ? contact.name : (contact.email || contact.mobile || 'Unknown');
  const firstInitial = (contact.first_name || contact.name || contact.email || '?')[0]?.toUpperCase() || '?';
  const lastInitial = contact.last_name ? contact.last_name[0]?.toUpperCase() : '';
  const initials = firstInitial + lastInitial;

  const statusColors = {
    unmatched: '#EF4444',
    hold: '#F59E0B',
    spam: '#6B7280',
    dismissed: '#6B7280',
    matched: '#10B981',
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
      }}>
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh list"
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: mutedColor, padding: 4,
            }}
          >
            <FaSyncAlt size={13} />
          </button>
        )}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: isDark ? '#333' : '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 700,
          color: mutedColor,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: textColor }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {isWhatsApp ? <FaWhatsapp size={12} color="#25D366" /> : <FaEnvelope size={12} color={mutedColor} />}
            <span style={{ fontSize: 13, color: mutedColor }}>
              {contact.email || contact.mobile}
            </span>
          </div>
          {contact.status !== 'unmatched' && (
            <span style={{
              display: 'inline-block',
              marginTop: 4,
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 600,
              background: statusColors[contact.status] || '#6B7280',
              color: '#fff',
            }}>
              {contact.status}
            </span>
          )}
        </div>
      </div>

      {/* Info card */}
      <div style={{
        background: surfaceBg,
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        border: `1px solid ${borderColor}`,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {contact.domain && (
            <InfoField label="Domain" value={contact.domain} icon={<FaGlobe size={11} />} isDark={isDark} />
          )}
          <InfoField label="Source" value={contact.source_type} isDark={isDark} />
          <InfoField label="Interactions" value={`${contact.interaction_count}x`} isDark={isDark} />
          <InfoField
            label="First seen"
            value={contact.first_seen_at ? new Date(contact.first_seen_at).toLocaleDateString() : '—'}
            isDark={isDark}
          />
          <InfoField
            label="Last seen"
            value={contact.last_seen_at ? new Date(contact.last_seen_at).toLocaleDateString() : '—'}
            isDark={isDark}
          />
        </div>
        {contact.last_subject && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${borderColor}` }}>
            <span style={{ fontSize: 11, color: mutedColor }}>Last subject</span>
            <div style={{ fontSize: 13, color: textColor, marginTop: 2 }}>{contact.last_subject}</div>
          </div>
        )}
      </div>

      {/* Matched contact link */}
      {contact.status === 'matched' && contact.matched_contact_id && (
        <div style={{
          background: isDark ? '#1a2a1a' : '#E8F5E9',
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#10B981',
          fontSize: 13,
        }}>
          <FaUserPlus size={14} />
          Added to CRM
          <FaExternalLinkAlt size={10} style={{ marginLeft: 'auto', opacity: 0.6 }} />
        </div>
      )}

      {/* Others from this domain */}
      {domainContacts && domainContacts.length > 1 && (
        <div style={{
          background: surfaceBg,
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
          border: `1px solid ${borderColor}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: mutedColor, marginBottom: 8 }}>
            Others from {contact.domain}
          </div>
          {domainContacts.filter(c => c.id !== contact.id).slice(0, 5).map(c => (
            <div key={c.id} style={{
              fontSize: 12,
              color: textColor,
              padding: '3px 0',
            }}>
              {c.name || c.email} — {c.interaction_count}x
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {contact.status === 'unmatched' ? (
          <>
            <ActionButton
              onClick={() => onAddToCrm(contact)}
              icon={<FaUserPlus size={13} />}
              label="Add to CRM"
              bg="#10B981"
              isDark={isDark}
            />
            <ActionButton
              onClick={() => onPutOnHold(contact)}
              icon={<FaPause size={12} />}
              label="Hold"
              bg="#F59E0B"
              isDark={isDark}
            />
            <ActionButton
              onClick={() => onMarkNews(contact)}
              icon={<FaNewspaper size={12} />}
              label="News"
              bg="#3B82F6"
              isDark={isDark}
            />
            <ActionButton
              onClick={() => onMarkSpam(contact)}
              icon={<FaBan size={12} />}
              label="Spam"
              bg="#EF4444"
              isDark={isDark}
            />
          </>
        ) : contact.status !== 'matched' ? (
          <>
            <ActionButton
              onClick={() => onAddToCrm(contact)}
              icon={<FaUserPlus size={13} />}
              label="Add to CRM"
              bg="#10B981"
              isDark={isDark}
            />
            <ActionButton
              onClick={() => onPutOnHold(contact)}
              icon={<FaPause size={12} />}
              label="Hold"
              bg="#F59E0B"
              isDark={isDark}
            />
            {contact.status === 'spam' && (
              <ActionButton
                onClick={() => onMarkNews(contact)}
                icon={<FaNewspaper size={12} />}
                label="News"
                bg="#3B82F6"
                isDark={isDark}
              />
            )}
          </>
        ) : null}
      </div>

      {/* Action descriptions */}
      {contact.status === 'unmatched' && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: surfaceBg,
          borderRadius: 10,
          border: `1px solid ${borderColor}`,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: mutedColor, marginBottom: 10 }}>
            What do these actions do?
          </div>
          <div style={{ fontSize: 12, color: mutedColor, lineHeight: 1.8 }}>
            <strong style={{ color: '#10B981' }}>Add to CRM</strong> — Create a new contact record for this person<br />
            <strong style={{ color: '#F59E0B' }}>Hold</strong> — Not now, but not spam either. Come back to it later<br />
            <strong style={{ color: '#3B82F6' }}>News</strong> — Newsletter or news source. Keep receiving, just not a contact<br />
            <strong style={{ color: '#EF4444' }}>Spam</strong> — Block all future emails from this sender
          </div>
        </div>
      )}
    </div>
  );
};

const InfoField = ({ label, value, icon, isDark }) => (
  <div>
    <div style={{ fontSize: 11, color: isDark ? '#666' : '#aaa', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: 13, color: isDark ? '#ccc' : '#444' }}>{value}</div>
  </div>
);

const ActionButton = ({ onClick, icon, label, bg, isDark }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 14px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      background: isDark ? `${bg}33` : `${bg}15`,
      color: bg,
      fontSize: 13,
      fontWeight: 500,
      transition: 'transform 0.1s',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
  >
    {icon} {label}
  </button>
);

export default UnmatchedCenterContent;
