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
            <ActionCard key={intro.introduction_id} theme={theme}>
              <ActionCardHeader theme={theme}>
                <FaHandshake style={{ color: '#F59E0B' }} />
                {person1} ↔ {person2}
              </ActionCardHeader>
              <ActionCardContent theme={theme}>
                <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>
                  {intro.status || 'No status'} {intro.introduction_tool ? `• ${intro.introduction_tool}` : ''}
                </div>
                {intro.introduction_date && (
                  <div style={{ fontSize: '12px', color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                    {new Date(intro.introduction_date).toLocaleDateString()}
                  </div>
                )}
                {intro.text && (
                  <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '4px', fontStyle: 'italic' }}>
                    "{intro.text.substring(0, 80)}{intro.text.length > 80 ? '...' : ''}"
                  </div>
                )}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onEditIntroduction(intro)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: theme === 'light' ? '#E5E7EB' : '#374151',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FaEdit size={10} /> Edit
                  </button>
                  <button
                    onClick={() => onDeleteIntroduction(intro.introduction_id)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                      color: theme === 'light' ? '#DC2626' : '#FCA5A5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FaTrash size={10} /> Delete
                  </button>
                </div>
              </ActionCardContent>
            </ActionCard>
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
