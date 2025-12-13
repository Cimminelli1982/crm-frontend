import React from 'react';
import { FaUser, FaBuilding, FaCrown, FaPlus } from 'react-icons/fa';
import { ActionCard, ActionCardHeader, ActionCardContent } from '../../pages/CommandCenterPage.styles';

const CRMTab = ({
  theme,
  navigate,
  crmSubTab,
  setCrmSubTab,
  emailContacts,
  emailCompanies,
  holdContacts,
  profileImageModal,
  setDataIntegrityContactId,
  setDataIntegrityModalOpen,
  handleOpenCreateContact,
  handleAddContactFromNotInCrm,
  handlePutOnHold,
  handleAddToSpam,
  setCompanyDataIntegrityCompanyId,
  setCompanyDataIntegrityModalOpen,
  onAddNewContact,
  onAddNewCompany,
}) => {
  return (
    <>
      {/* Add New Contact/Company Buttons */}
      <div style={{ display: 'flex', gap: '8px', margin: '8px' }}>
        <ActionCard
          theme={theme}
          style={{ cursor: 'pointer', flex: 1, margin: 0 }}
          onClick={onAddNewContact}
        >
          <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}>
            <FaUser style={{ color: '#10B981' }} size={12} />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Add Contact</span>
          </ActionCardContent>
        </ActionCard>
        <ActionCard
          theme={theme}
          style={{ cursor: 'pointer', flex: 1, margin: 0 }}
          onClick={onAddNewCompany}
        >
          <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px' }}>
            <FaBuilding style={{ color: '#3B82F6' }} size={12} />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Add Company</span>
          </ActionCardContent>
        </ActionCard>
      </div>

      {/* Sub-menu tabs for Contacts / Companies */}
      <div style={{
        display: 'flex',
        gap: '4px',
        margin: '8px',
        background: theme === 'light' ? '#E5E7EB' : '#1F2937',
        borderRadius: '6px',
        padding: '2px'
      }}>
        <button
          onClick={() => setCrmSubTab('contacts')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: crmSubTab === 'contacts'
              ? (theme === 'light' ? '#FFFFFF' : '#374151')
              : 'transparent',
            color: crmSubTab === 'contacts'
              ? (theme === 'light' ? '#111827' : '#F9FAFB')
              : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
            boxShadow: crmSubTab === 'contacts' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <FaUser size={12} /> Contacts ({emailContacts.length})
        </button>
        <button
          onClick={() => setCrmSubTab('companies')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: crmSubTab === 'companies'
              ? (theme === 'light' ? '#FFFFFF' : '#374151')
              : 'transparent',
            color: crmSubTab === 'companies'
              ? (theme === 'light' ? '#111827' : '#F9FAFB')
              : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
            boxShadow: crmSubTab === 'companies' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <FaBuilding size={12} /> Companies ({emailCompanies.length})
        </button>
      </div>

      {/* Contacts Sub-Tab Content */}
      {crmSubTab === 'contacts' && (
        <>
          {emailContacts.length > 0 ? (
            <>
              {/* All contacts in single list with role inline */}
              {emailContacts.map((participant, idx) => {
                const score = participant.contact?.completeness_score || 0;
                const isMarkedComplete = participant.contact?.show_missing === false;
                const circumference = 2 * Math.PI * 16;
                const strokeDashoffset = isMarkedComplete ? 0 : circumference - (score / 100) * circumference;
                const scoreColor = isMarkedComplete ? '#F59E0B' : (score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444');
                // Get the primary role to display (from > to > cc)
                const primaryRole = participant.roles?.includes('from') ? 'From' : participant.roles?.includes('to') ? 'To' : participant.roles?.includes('cc') ? 'CC' : '';
                // Check if contact is on hold
                const isOnHold = holdContacts.some(h => h.email?.toLowerCase() === participant.email?.toLowerCase());
                return (
                <ActionCard key={participant.contact?.contact_id || participant.email || participant.phone || idx} theme={theme} style={isOnHold ? { borderLeft: '3px solid #F59E0B' } : {}}>
                  <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{ cursor: participant.contact ? 'pointer' : 'default' }}
                      onClick={() => participant.contact && profileImageModal.openModal(participant.contact)}
                      title={participant.contact ? 'Edit profile image' : ''}
                    >
                      {participant.contact?.profile_image_url ? (
                        <img src={participant.contact.profile_image_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme === 'light' ? '#E5E7EB' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                          {participant.contact ? `${participant.contact.first_name?.[0] || ''}${participant.contact.last_name?.[0] || ''}` : participant.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div
                      style={{ flex: 1, cursor: participant.contact ? 'pointer' : 'default' }}
                      onClick={() => participant.contact && navigate(`/contact/${participant.contact.contact_id}`)}
                    >
                      <div style={{ fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {participant.contact ? `${participant.contact.first_name} ${participant.contact.last_name}` : participant.name}
                        {isOnHold && (
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E', fontWeight: 600, textTransform: 'uppercase' }}>Hold</span>
                        )}
                      </div>
                      {(participant.contact?.job_role || participant.contact?.company_name) && (
                        <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
                          {participant.contact.job_role}{participant.contact.job_role && participant.contact.company_name && ' @ '}{participant.contact.company_name}
                        </div>
                      )}
                    </div>
                    {participant.contact && (
                      <div style={{ position: 'relative', width: 40, height: 40, cursor: 'pointer' }} title={isMarkedComplete ? 'Marked complete' : `${score}% complete`} onClick={() => { setDataIntegrityContactId(participant.contact.contact_id); setDataIntegrityModalOpen(true); }}>
                        <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="20" cy="20" r="16" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="4" />
                          <circle cx="20" cy="20" r="16" fill="none" stroke={scoreColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                          {(isMarkedComplete || score === 100) ? <FaCrown size={14} color="#F59E0B" /> : `${score}%`}
                        </div>
                      </div>
                    )}
                  </ActionCardHeader>
                  <ActionCardContent theme={theme}>
                    <div style={{ fontSize: '13px', marginBottom: '8px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                      <span style={{ fontWeight: 700 }}>{primaryRole}:</span> <span style={{ fontWeight: 400 }}>{participant.email}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {participant.contact?.category && (
                        <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#E5E7EB' : '#374151', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{participant.contact.category}</span>
                      )}
                      {!participant.hasContact && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (handleAddContactFromNotInCrm) {
                                handleAddContactFromNotInCrm({ email: participant.email, mobile: participant.phone, name: participant.name });
                              } else {
                                handleOpenCreateContact({ email: participant.email, mobile: participant.phone, name: participant.name });
                              }
                            }}
                            title="Add to CRM"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 500,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              background: '#10B981',
                              color: 'white'
                            }}
                          >
                            Add
                          </button>
                          {!isOnHold && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePutOnHold({ email: participant.email, mobile: participant.phone, name: participant.name }); }}
                              title="Put on Hold"
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 500,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: '#F59E0B',
                                color: 'white'
                              }}
                            >
                              Hold
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAddToSpam(participant.email || participant.phone, { email: participant.email, mobile: participant.phone, name: participant.name }); }}
                            title="Mark as Spam"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 500,
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              background: '#EF4444',
                              color: 'white'
                            }}
                          >
                            Spam
                          </button>
                        </>
                      )}
                    </div>
                  </ActionCardContent>
                </ActionCard>
              )})}
            </>
          ) : (
            <ActionCard theme={theme}>
              <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6 }}>
                Select a thread to see participants
              </ActionCardContent>
            </ActionCard>
          )}
        </>
      )}

      {/* Companies Sub-Tab Content */}
      {crmSubTab === 'companies' && (
        <>
          {emailCompanies.length > 0 ? (
            <>
              {emailCompanies.map((item, idx) => {
                const companyScore = item.completeness_score || 0;
                const companyCircumference = 2 * Math.PI * 16;
                const companyStrokeDashoffset = companyCircumference - (companyScore / 100) * companyCircumference;
                const companyScoreColor = companyScore >= 70 ? '#10B981' : companyScore >= 40 ? '#F59E0B' : '#EF4444';
                return (
              <ActionCard
                key={item.domain + idx}
                theme={theme}
                style={{ cursor: item.company?.company_id ? 'pointer' : 'default' }}
                onClick={() => item.company?.company_id && navigate(`/company/${item.company.company_id}`)}
              >
                <ActionCardHeader theme={theme} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme === 'light' ? '#E5E7EB' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', overflow: 'hidden' }}>
                    {item.logo_url ? (
                      <img src={item.logo_url} alt={item.company?.name || 'Company'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      item.company?.name ? item.company.name.substring(0, 2).toUpperCase() : item.domain?.substring(0, 2).toUpperCase() || '?'
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>
                      {item.company?.name || item.domain}
                    </div>
                    {item.contacts?.length > 0 && (
                      <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>
                        {item.contacts.map(c => c.name).join(', ')}
                      </div>
                    )}
                  </div>
                  {item.hasCompany && (
                    <div
                      style={{ position: 'relative', width: 40, height: 40, cursor: 'pointer' }}
                      title={`${companyScore}% complete - Click to edit`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCompanyDataIntegrityCompanyId(item.company.company_id);
                        setCompanyDataIntegrityModalOpen(true);
                      }}
                    >
                      <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="20" cy="20" r="16" fill="none" stroke={theme === 'light' ? '#E5E7EB' : '#374151'} strokeWidth="4" />
                        <circle cx="20" cy="20" r="16" fill="none" stroke={companyScoreColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={companyCircumference} strokeDashoffset={companyStrokeDashoffset} />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#374151' : '#D1D5DB' }}>
                        {companyScore === 100 ? <FaCrown size={14} color="#F59E0B" /> : `${companyScore}%`}
                      </div>
                    </div>
                  )}
                </ActionCardHeader>
                <ActionCardContent theme={theme}>
                  <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>
                    {item.domains?.length > 0 ? item.domains.join(', ') : item.domain || 'No domain'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {item.company?.category && (
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#E5E7EB' : '#374151', color: theme === 'light' ? '#374151' : '#D1D5DB' }}>{item.company.category}</span>
                    )}
                    {!item.hasCompany && (
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px', background: theme === 'light' ? '#FEF3C7' : '#78350F', color: theme === 'light' ? '#92400E' : '#FDE68A', cursor: 'pointer' }}>+ Add</span>
                    )}
                  </div>
                </ActionCardContent>
              </ActionCard>
              )})}
            </>
          ) : (
            <ActionCard theme={theme}>
              <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6 }}>
                Select a thread to see companies
              </ActionCardContent>
            </ActionCard>
          )}
        </>
      )}
    </>
  );
};

export default CRMTab;
