import {
  EmailItem,
  EmailSender,
  EmailSnippet,
} from '../../../../pages/CommandCenterPage.styles';
import { FaCheckCircle } from 'react-icons/fa';

const DIMENSION_COLORS = {
  completeness: '#EF4444',
  photo: '#A855F7',
  note: '#EAB308',
  company: '#3B82F6',
  company_linked: '#3B82F6',
  company_complete: '#14B8A6',
};

const DIMENSION_LABELS = {
  completeness: 'Fields',
  photo: 'Photo',
  note: 'Note',
  company: 'Company',
  company_linked: 'Company',
  company_complete: 'Co. Data',
};

const DataQualityContactItem = ({ theme, contact, isSelected, onClick }) => {
  const initials = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  const dimensions = contact.missing_dimensions || [];

  return (
    <EmailItem
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
        overflow: 'hidden',
      }}>
        {contact.profile_image_url ? (
          <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <EmailSender theme={theme}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {contact.full_name}
          </span>
          {contact.category && contact.category !== 'Inbox' && (
            <span style={{
              marginLeft: '6px',
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              background: theme === 'dark' ? '#374151' : '#E5E7EB',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
            }}>
              {contact.category}
            </span>
          )}
        </EmailSender>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
          {dimensions.length === 0 ? (
            <FaCheckCircle style={{ color: '#10B981', fontSize: '14px' }} />
          ) : (
            dimensions.map(dim => (
              <span key={dim} style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: `${DIMENSION_COLORS[dim] || '#6B7280'}20`,
                color: DIMENSION_COLORS[dim] || '#6B7280',
                fontWeight: 600,
              }}>
                {DIMENSION_LABELS[dim] || dim}
              </span>
            ))
          )}
        </div>
        {contact.bucket === 'b' && contact.needs_input_details && (
          <EmailSnippet theme={theme} style={{ marginTop: '2px' }}>
            {contact.needs_input_details.length > 60
              ? contact.needs_input_details.slice(0, 60) + '...'
              : contact.needs_input_details}
          </EmailSnippet>
        )}
      </div>
    </EmailItem>
  );
};

export default DataQualityContactItem;
