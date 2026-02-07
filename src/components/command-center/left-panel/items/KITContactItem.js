import {
  EmailItem,
  EmailSender,
  EmailSubject,
  EmailSnippet,
} from '../../../../pages/CommandCenterPage.styles';

const KITContactItem = ({ theme, contact, isSelected, onClick, daysColor, daysText }) => {
  return (
    <EmailItem
      key={contact.contact_id}
      theme={theme}
      $selected={isSelected}
      onClick={onClick}
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
        <EmailSubject theme={theme} style={{ fontWeight: 600, color: daysColor }}>
          {daysText}
        </EmailSubject>
        <EmailSnippet theme={theme}>
          {contact.frequency} {'\u2022'} Last: {contact.last_interaction_at ? new Date(contact.last_interaction_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Never'}
        </EmailSnippet>
      </div>
    </EmailItem>
  );
};

export default KITContactItem;
