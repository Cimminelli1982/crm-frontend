import React from 'react';
import { FaRobot, FaTimes, FaCheck, FaBuilding, FaDollarSign, FaHandshake } from 'react-icons/fa';

const AITab = ({
  theme,
  selectedThread,
  auditResult,
  setAuditResult,
  loadingAudit,
  auditActions,
  setAuditActions,
  selectedActions,
  setSelectedActions,
  executingActions,
  runContactAudit,
  toggleActionSelection,
  executeSelectedActions,
}) => {
  return (
    <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Audit Button */}
      {!auditResult && !loadingAudit && (
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={runContactAudit}
            disabled={!selectedThread || selectedThread.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              background: selectedThread ? '#3B82F6' : (theme === 'light' ? '#E5E7EB' : '#374151'),
              color: selectedThread ? 'white' : (theme === 'light' ? '#9CA3AF' : '#6B7280'),
              border: 'none',
              borderRadius: '8px',
              cursor: selectedThread ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FaRobot /> Run Contact Audit
          </button>
        </div>
      )}

      {/* Loading State */}
      {loadingAudit && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
          <FaRobot size={24} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>Running audit...</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Checking contact, duplicates, company...</div>
        </div>
      )}

      {/* Audit Results */}
      {auditResult && !loadingAudit && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Contact Header */}
          <div style={{
            padding: '12px',
            background: theme === 'light' ? '#F9FAFB' : '#111827',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                {auditResult.contact?.name || 'Unknown Contact'}
              </div>
              <button
                onClick={() => { setAuditResult(null); setAuditActions([]); setSelectedActions(new Set()); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'light' ? '#6B7280' : '#9CA3AF', padding: '4px' }}
              >
                <FaTimes size={14} />
              </button>
            </div>
            {/* Completeness Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>Completeness:</div>
              <div style={{ flex: 1, height: '8px', background: theme === 'light' ? '#E5E7EB' : '#374151', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${auditResult.contact?.completeness_score || 0}%`,
                  height: '100%',
                  background: (auditResult.contact?.completeness_score || 0) >= 70 ? '#10B981' : (auditResult.contact?.completeness_score || 0) >= 40 ? '#F59E0B' : '#EF4444',
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                {auditResult.contact?.completeness_score || 0}%
              </div>
            </div>
            {/* Missing Fields */}
            {auditResult.contact?.missing_fields?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {auditResult.contact.missing_fields.map((field, i) => (
                  <span key={i} style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: theme === 'light' ? '#FEE2E2' : '#7F1D1D',
                    color: theme === 'light' ? '#B91C1C' : '#FCA5A5',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    missing: {field}
                  </span>
                ))}
              </div>
            )}
            {auditResult.contact?.found === false && (
              <div style={{ marginTop: '8px', padding: '6px 10px', background: '#FEF3C7', borderRadius: '4px', fontSize: '12px', color: '#92400E' }}>
                ⚠️ Contact not found in CRM - will create new
              </div>
            )}
          </div>

          {/* Email Action */}
          {auditResult.email_action?.action !== 'none' && (
            <div style={{
              padding: '10px 12px',
              background: theme === 'light' ? '#DBEAFE' : '#1E3A5F',
              borderRadius: '8px',
              marginBottom: '8px',
              fontSize: '13px',
              color: theme === 'light' ? '#1E40AF' : '#93C5FD'
            }}>
              <strong>Email:</strong> {auditResult.email_action?.action === 'add' ? `Add ${auditResult.email_action?.email}` : auditResult.email_action?.reason}
            </div>
          )}

          {/* Duplicates */}
          {auditResult.contact_duplicates?.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                Duplicates ({auditResult.contact_duplicates.length})
              </div>
              {auditResult.contact_duplicates.map((dup, i) => (
                <div key={i} style={{
                  padding: '8px 10px',
                  background: theme === 'light' ? '#FEF2F2' : '#1C1917',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '12px',
                  border: `1px solid ${theme === 'light' ? '#FECACA' : '#7F1D1D'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: theme === 'light' ? '#111827' : '#F9FAFB', fontWeight: 500 }}>{dup.name}</span>
                    <span style={{ color: '#EF4444', fontSize: '11px', textTransform: 'uppercase' }}>{dup.action}</span>
                  </div>
                  <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginTop: '2px' }}>
                    {dup.reason} {dup.data_to_preserve?.length > 0 && `(preserve: ${dup.data_to_preserve.join(', ')})`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mobiles Section */}
          {auditResult.mobiles && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                Mobiles ({auditResult.mobiles.current?.length || 0}) {auditResult.mobiles.issues?.length > 0 && <span style={{ color: '#F59E0B' }}>• {auditResult.mobiles.issues.length} issue{auditResult.mobiles.issues.length > 1 ? 's' : ''}</span>}
              </div>
              {/* Current Mobiles */}
              {auditResult.mobiles.current?.map((mobile, i) => (
                <div key={i} style={{
                  padding: '6px 10px',
                  background: theme === 'light' ? '#F9FAFB' : '#111827',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>{mobile.number}</span>
                  <span style={{
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    background: theme === 'light' ? '#E5E7EB' : '#374151',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {mobile.type} {mobile.is_primary && '• PRIMARY'}
                  </span>
                </div>
              ))}
              {/* Mobile Issues */}
              {auditResult.mobiles.issues?.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {auditResult.mobiles.issues.map((issue, i) => (
                    <div key={i} style={{
                      padding: '8px 10px',
                      background: theme === 'light' ? '#FFFBEB' : '#1C1917',
                      borderRadius: '6px',
                      marginBottom: '4px',
                      fontSize: '12px',
                      border: `1px solid ${theme === 'light' ? '#FCD34D' : '#92400E'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: theme === 'light' ? '#111827' : '#F9FAFB', fontWeight: 500 }}>{issue.number}</span>
                        <span style={{ color: '#F59E0B', fontSize: '11px', textTransform: 'uppercase' }}>{issue.action}</span>
                      </div>
                      <div style={{ color: theme === 'light' ? '#92400E' : '#FCD34D', marginTop: '2px' }}>
                        {issue.reason}
                        {issue.suggested_type && (
                          <span style={{ fontWeight: 600 }}> → {issue.suggested_type}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Company */}
          {auditResult.company && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                Company {auditResult.company.issues?.length > 0 && <span style={{ color: '#F59E0B' }}>• {auditResult.company.issues.length} issue{auditResult.company.issues.length > 1 ? 's' : ''}</span>}
              </div>
              <div style={{
                padding: '10px 12px',
                background: auditResult.company.action === 'link'
                  ? (theme === 'light' ? '#DBEAFE' : '#1E3A5F')
                  : auditResult.company.action === 'skip'
                    ? (theme === 'light' ? '#F3F4F6' : '#1F2937')
                    : (theme === 'light' ? '#F0FDF4' : '#14532D'),
                borderRadius: '6px',
                fontSize: '12px',
                border: `1px solid ${auditResult.company.action === 'link'
                  ? '#3B82F6'
                  : auditResult.company.action === 'skip'
                    ? (theme === 'light' ? '#E5E7EB' : '#374151')
                    : (theme === 'light' ? '#86EFAC' : '#166534')}`
              }}>
                {auditResult.company.action === 'link' ? (
                  <div>
                    <div style={{ color: theme === 'light' ? '#1E40AF' : '#93C5FD', fontWeight: 600, marginBottom: '4px' }}>
                      <FaBuilding style={{ marginRight: '6px' }} />
                      Suggest Link: {auditResult.company.name}
                    </div>
                    <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '11px' }}>
                      Company found by email domain but not yet linked
                    </div>
                  </div>
                ) : auditResult.company.action === 'skip' ? (
                  <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    <FaBuilding style={{ marginRight: '6px', opacity: 0.5 }} />
                    {auditResult.company.reason || 'No company suggestion'}
                  </div>
                ) : auditResult.company.linked ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: theme === 'light' ? '#166534' : '#86EFAC', fontWeight: 600 }}>
                        <FaBuilding style={{ marginRight: '6px' }} />
                        {auditResult.company.name}
                      </span>
                      <span style={{ color: '#10B981', fontSize: '10px', textTransform: 'uppercase', background: theme === 'light' ? '#D1FAE5' : '#064E3B', padding: '2px 6px', borderRadius: '4px' }}>
                        ✓ Linked
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                    <FaBuilding style={{ marginRight: '6px', opacity: 0.5 }} />
                    No company linked
                  </div>
                )}
                {/* Company Issues */}
                {auditResult.company.issues?.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}` }}>
                    {auditResult.company.issues.map((issue, i) => (
                      <div key={i} style={{
                        color: '#F59E0B',
                        padding: '4px 8px',
                        background: theme === 'light' ? '#FFFBEB' : '#1C1917',
                        borderRadius: '4px',
                        marginTop: '4px',
                        fontSize: '11px'
                      }}>
                        ⚠️ {issue.field}: <code style={{ background: theme === 'light' ? '#FEF3C7' : '#78350F', padding: '1px 4px', borderRadius: '2px' }}>{issue.current}</code> → <code style={{ background: theme === 'light' ? '#D1FAE5' : '#064E3B', padding: '1px 4px', borderRadius: '2px' }}>{issue.fix}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Company Duplicates */}
          {auditResult.company_duplicates?.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                Company Duplicates
              </div>
              {auditResult.company_duplicates.map((dup, i) => (
                <div key={i} style={{
                  padding: '8px 10px',
                  background: theme === 'light' ? '#FEF2F2' : '#1C1917',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '12px'
                }}>
                  Merge "{dup.name}" into {dup.into}
                </div>
              ))}
            </div>
          )}

          {/* Deals */}
          {auditResult.deals?.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                <FaDollarSign style={{ marginRight: '4px' }} /> Deals ({auditResult.deals.length})
              </div>
              {auditResult.deals.map((deal, i) => (
                <div key={i} style={{
                  padding: '6px 10px',
                  background: theme === 'light' ? '#EDE9FE' : '#4C1D95',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: theme === 'light' ? '#5B21B6' : '#DDD6FE'
                }}>
                  {deal.name || 'Unnamed deal'}
                </div>
              ))}
            </div>
          )}

          {/* Introductions */}
          {auditResult.introductions?.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                <FaHandshake style={{ marginRight: '4px' }} /> Introductions ({auditResult.introductions.length})
              </div>
              {auditResult.introductions.map((intro, i) => (
                <div key={i} style={{
                  padding: '6px 10px',
                  background: theme === 'light' ? '#FEF3C7' : '#78350F',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: theme === 'light' ? '#92400E' : '#FDE68A'
                }}>
                  {intro.text || 'Introduction record'}
                </div>
              ))}
            </div>
          )}

          {/* Communication Analysis */}
          {auditResult.communication && (
            <div style={{
              padding: '10px 12px',
              background: theme === 'light' ? '#F3F4F6' : '#1F2937',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '12px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>
                Email Analysis
              </div>
              <div style={{ color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginRight: '8px',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  background: auditResult.communication.type === 'business'
                    ? (theme === 'light' ? '#DBEAFE' : '#1E3A5F')
                    : auditResult.communication.type === 'transactional'
                      ? (theme === 'light' ? '#F3F4F6' : '#374151')
                      : (theme === 'light' ? '#FCE7F3' : '#831843'),
                  color: auditResult.communication.type === 'business'
                    ? (theme === 'light' ? '#1E40AF' : '#93C5FD')
                    : auditResult.communication.type === 'transactional'
                      ? (theme === 'light' ? '#6B7280' : '#9CA3AF')
                      : (theme === 'light' ? '#9D174D' : '#F9A8D4')
                }}>
                  {auditResult.communication.type}
                </span>
                {auditResult.communication.involves_deal && (
                  <span style={{ padding: '2px 8px', borderRadius: '4px', marginRight: '8px', fontSize: '11px', background: '#10B981', color: 'white' }}>
                    💰 Deal
                  </span>
                )}
                {auditResult.communication.involves_intro && (
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#F59E0B', color: 'white' }}>
                    🤝 Intro
                  </span>
                )}
              </div>
              <div style={{ marginTop: '6px', color: theme === 'light' ? '#6B7280' : '#9CA3AF', fontSize: '11px' }}>
                {auditResult.communication.summary}
              </div>
            </div>
          )}

          {/* Actions List */}
          {auditActions.length > 0 && (
            <div style={{ marginTop: 'auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '8px', textTransform: 'uppercase' }}>
                Actions ({selectedActions.size}/{auditActions.length} selected)
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                {auditActions.map((action, i) => (
                  <div
                    key={i}
                    onClick={() => toggleActionSelection(i)}
                    style={{
                      padding: '8px 10px',
                      background: selectedActions.has(i)
                        ? (theme === 'light' ? '#DBEAFE' : '#1E3A5F')
                        : (theme === 'light' ? '#FFFFFF' : '#1F2937'),
                      border: `1px solid ${selectedActions.has(i) ? '#3B82F6' : (theme === 'light' ? '#E5E7EB' : '#374151')}`,
                      borderRadius: '6px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: `2px solid ${selectedActions.has(i) ? '#3B82F6' : (theme === 'light' ? '#D1D5DB' : '#4B5563')}`,
                      background: selectedActions.has(i) ? '#3B82F6' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedActions.has(i) && <FaCheck size={10} color="white" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: theme === 'light' ? '#111827' : '#F9FAFB' }}>
                        {action.description}
                      </div>
                      <div style={{ fontSize: '10px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase' }}>
                        {action.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Execute Button */}
              <button
                onClick={executeSelectedActions}
                disabled={executingActions || selectedActions.size === 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: selectedActions.size > 0 ? '#10B981' : (theme === 'light' ? '#E5E7EB' : '#374151'),
                  color: selectedActions.size > 0 ? 'white' : (theme === 'light' ? '#9CA3AF' : '#6B7280'),
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedActions.size > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {executingActions ? 'Executing...' : `Execute ${selectedActions.size} Action${selectedActions.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* No Actions */}
          {auditActions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
              <FaCheck size={20} style={{ marginBottom: '8px', color: '#10B981' }} />
              <div style={{ fontSize: '12px' }}>No actions needed</div>
            </div>
          )}
        </div>
      )}

      {/* No email selected */}
      {!selectedThread && !loadingAudit && !auditResult && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
          <FaRobot size={24} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <div style={{ fontSize: '12px' }}>Select an email to run audit</div>
        </div>
      )}
    </div>
  );
};

export default AITab;
