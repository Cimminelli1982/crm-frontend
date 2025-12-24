import React from 'react';
import { FaHandshake, FaEdit, FaTrash } from 'react-icons/fa';
import { ActionCard, ActionCardHeader, ActionCardContent } from '../../pages/CommandCenterPage.styles';

const IntroductionsTab = ({
  theme,
  selectedThread,
  contactIntroductions,
  setIntroductionModalOpen,
  onEditIntroduction,
  onDeleteIntroduction,
}) => {
  return (
    <>
      {/* Add New Introduction Button - Always visible */}
      <ActionCard theme={theme} style={{ cursor: 'pointer' }} onClick={() => setIntroductionModalOpen(true)}>
        <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
          <FaHandshake style={{ color: '#F59E0B' }} />
          <span style={{ fontWeight: 600 }}>Add New Introduction</span>
        </ActionCardContent>
      </ActionCard>

      {/* Related Introductions Section */}
      {contactIntroductions.length > 0 && (
        <>
          <div style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 600,
            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Related
          </div>
          {contactIntroductions.map(intro => {
            const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
            const person1 = introducees[0]?.name || 'Unknown';
            const person2 = introducees[1]?.name || 'Unknown';
            return (
            <div
              key={intro.introduction_id}
              style={{
                padding: '8px 12px',
                borderBottom: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                background: theme === 'light' ? '#fff' : '#1F2937',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <FaHandshake style={{ color: '#F59E0B', flexShrink: 0 }} size={12} />
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: theme === 'light' ? '#111827' : '#F9FAFB',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {person1} ↔ {person2}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => onEditIntroduction(intro)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      background: theme === 'light' ? '#E5E7EB' : '#374151',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <FaEdit size={8} /> Edit
                  </button>
                  <button
                    onClick={() => onDeleteIntroduction(intro.introduction_id)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                      color: theme === 'light' ? '#DC2626' : '#FCA5A5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <FaTrash size={8} />
                  </button>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginTop: '4px',
                marginLeft: '18px'
              }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 500,
                  ...({
                    'Requested': { background: '#FEE2E2', color: '#DC2626' },
                    'Promised': { background: '#FEE2E2', color: '#DC2626' },
                    'Done & Dust': { background: '#D1FAE5', color: '#065F46' },
                    'Done, but need to monitor': { background: '#FEF3C7', color: '#92400E' },
                    'Aborted': { background: '#7F1D1D', color: '#FCA5A5' },
                  }[intro.status] || { background: '#F3F4F6', color: '#6B7280' })
                }}>
                  {intro.status || 'No status'}
                </span>
                <span>{intro.introduction_tool || ''}</span>
                {intro.introduction_date && <span>{new Date(intro.introduction_date).toLocaleDateString()}</span>}
              </div>
              {intro.text && (
                <div style={{
                  fontSize: '11px',
                  color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                  marginTop: '2px',
                  marginLeft: '18px',
                  fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  "{intro.text.substring(0, 50)}{intro.text.length > 50 ? '...' : ''}"
                </div>
              )}
            </div>
          );
          })}
        </>
      )}

      {/* Empty State - only show when no introductions at all */}
      {contactIntroductions.length === 0 && selectedThread && (
        <ActionCard theme={theme}>
          <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6, fontSize: '13px' }}>
            No introductions linked to these contacts
          </ActionCardContent>
        </ActionCard>
      )}
    </>
  );
};

export default IntroductionsTab;
