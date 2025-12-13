import React, { useState } from 'react';
import {
  FaChevronDown,
  FaUserSlash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClone,
  FaHandshake,
  FaBuilding,
  FaExternalLinkAlt,
  FaEnvelopeOpenText,
  FaExchangeAlt
} from 'react-icons/fa';

const DataIntegrityTab = ({
  theme,
  navigate,
  loadingDataIntegrity,
  // Data arrays
  notInCrmEmails,
  notInCrmDomains,
  notInCrmTab,
  setNotInCrmTab,
  holdContacts,
  holdCompanies,
  holdTab,
  setHoldTab,
  incompleteContacts,
  incompleteCompanies,
  completenessTab,
  setCompletenessTab,
  duplicateContacts,
  duplicateCompanies,
  duplicatesTab,
  setDuplicatesTab,
  missingCompanyLinks,
  contactsMissingCompany,
  // Expanded state
  expandedDataIntegrity,
  setExpandedDataIntegrity,
  // Handlers
  handleOpenCreateContact,
  handlePutOnHold,
  handleAddToSpam,
  handleAddCompanyFromDomain,
  handleDomainAction,
  handleAddFromHold,
  handleSpamFromHold,
  handleAddCompanyFromHold,
  handleDeleteCompanyFromHold,
  handleConfirmMergeDuplicate,
  handleDismissDuplicate,
  handleLinkContactToCompany,
  // Modal setters
  setDataIntegrityContactId,
  setDataIntegrityModalOpen,
  setCompanyDataIntegrityCompanyId,
  setCompanyDataIntegrityModalOpen,
  // Suggestions from current email
  suggestionsFromMessage = [],
}) => {
  // Track which duplicates have been swapped (by id)
  const [swappedDuplicates, setSwappedDuplicates] = useState(new Set());

  const toggleSwap = (itemId) => {
    setSwappedDuplicates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Helper to get the correct keep/remove based on swap state
  const getSwappedItem = (item) => {
    const isSwapped = swappedDuplicates.has(item.id);
    if (isSwapped) {
      return {
        ...item,
        source_id: item.duplicate_id,
        duplicate_id: item.source_id,
        source: item.duplicate,
        duplicate: item.source,
      };
    }
    return item;
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
      {loadingDataIntegrity ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: theme === 'light' ? '#6B7280' : '#9CA3AF'
        }}>
          <div className="animate-spin" style={{
            width: '24px',
            height: '24px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 12px'
          }} />
          <div style={{ fontSize: '12px' }}>Loading...</div>
        </div>
      ) : (
        <>
          {/* Suggestions From Message Section */}
          {suggestionsFromMessage.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div
              onClick={() => setExpandedDataIntegrity(prev => prev.suggestions ? {} : { suggestions: true })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: theme === 'light' ? '#EFF6FF' : '#1E3A5F',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: expandedDataIntegrity.suggestions ? '4px' : '0',
                border: `1px solid ${theme === 'light' ? '#BFDBFE' : '#1E40AF'}`
              }}
            >
              <FaChevronDown
                style={{
                  transform: expandedDataIntegrity.suggestions ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                  fontSize: '10px',
                  color: theme === 'light' ? '#3B82F6' : '#93C5FD'
                }}
              />
              <FaEnvelopeOpenText style={{ color: '#3B82F6', fontSize: '12px' }} />
              <span style={{
                fontWeight: 600,
                fontSize: '13px',
                color: theme === 'light' ? '#1D4ED8' : '#BFDBFE'
              }}>
                Suggestions From Message
              </span>
              <span style={{
                fontSize: '12px',
                color: theme === 'light' ? '#3B82F6' : '#93C5FD',
                marginLeft: 'auto'
              }}>
                {suggestionsFromMessage.length}
              </span>
            </div>
            {expandedDataIntegrity.suggestions && (
              <div style={{ paddingLeft: '8px' }}>
                {suggestionsFromMessage.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '8px 12px',
                    background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: theme === 'light' ? '#111827' : '#F9FAFB',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>{item.name || item.email}</div>
                      {item.name && (
                        <div style={{
                          fontSize: '11px',
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>{item.email}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleOpenCreateContact({
                          email: item.email,
                          name: item.name,
                          firstName: item.firstName,
                          lastName: item.lastName
                        })}
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
                      <button
                        onClick={() => handlePutOnHold({ email: item.email, name: item.name })}
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
                      <button
                        onClick={() => handleAddToSpam(item.email || item.mobile, item)}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Not in CRM Section */}
          {(notInCrmEmails.length > 0 || notInCrmDomains.length > 0) && (
          <div style={{ marginBottom: '8px' }}>
            <div
              onClick={() => setExpandedDataIntegrity(prev => prev.notInCrm ? {} : { notInCrm: true })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: theme === 'light' ? '#F3F4F6' : '#374151',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: expandedDataIntegrity.notInCrm ? '4px' : '0',
              }}
            >
              <FaChevronDown
                style={{
                  transform: expandedDataIntegrity.notInCrm ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                  fontSize: '10px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}
              />
              <FaUserSlash style={{ color: '#EF4444', fontSize: '12px' }} />
              <span style={{
                fontWeight: 600,
                fontSize: '13px',
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                Not in CRM
              </span>
              <span style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginLeft: 'auto'
              }}>
                {notInCrmEmails.length + notInCrmDomains.length}
              </span>
            </div>
            {expandedDataIntegrity.notInCrm && (
              <div style={{ paddingLeft: '8px' }}>
                {/* Tabs for Contacts / Companies */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '8px',
                  background: theme === 'light' ? '#E5E7EB' : '#1F2937',
                  borderRadius: '6px',
                  padding: '2px'
                }}>
                  <button
                    onClick={() => setNotInCrmTab('contacts')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: notInCrmTab === 'contacts'
                        ? (theme === 'light' ? '#FFFFFF' : '#374151')
                        : 'transparent',
                      color: notInCrmTab === 'contacts'
                        ? (theme === 'light' ? '#111827' : '#F9FAFB')
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      boxShadow: notInCrmTab === 'contacts' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Contacts ({notInCrmEmails.length})
                  </button>
                  <button
                    onClick={() => setNotInCrmTab('companies')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: notInCrmTab === 'companies'
                        ? (theme === 'light' ? '#FFFFFF' : '#374151')
                        : 'transparent',
                      color: notInCrmTab === 'companies'
                        ? (theme === 'light' ? '#111827' : '#F9FAFB')
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      boxShadow: notInCrmTab === 'companies' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Companies ({notInCrmDomains.length})
                  </button>
                </div>

                {/* Contacts Tab Content */}
                {notInCrmTab === 'contacts' && (
                  <>
                    {notInCrmEmails.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        fontSize: '12px'
                      }}>
                        All email contacts are in CRM
                      </div>
                    ) : (
                      notInCrmEmails.map((item, idx) => (
                        <div key={idx} style={{
                          padding: '8px 12px',
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          borderRadius: '6px',
                          marginBottom: '4px',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: theme === 'light' ? '#111827' : '#F9FAFB',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{item.name || item.email || item.mobile}</div>
                            {(item.name && (item.email || item.mobile)) && (
                              <div style={{
                                fontSize: '11px',
                                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>{item.email || item.mobile}</div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
                            <button
                              onClick={() => handleOpenCreateContact(item)}
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
                            <button
                              onClick={() => handlePutOnHold(item)}
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
                            <button
                              onClick={() => handleAddToSpam(item.email || item.mobile, item)}
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
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Companies Tab Content */}
                {notInCrmTab === 'companies' && (
                  <>
                    {notInCrmDomains.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        fontSize: '12px'
                      }}>
                        All domains are in CRM
                      </div>
                    ) : (
                      notInCrmDomains.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 12px',
                            background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                            borderRadius: '6px',
                            marginBottom: '4px',
                            border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: theme === 'light' ? '#111827' : '#F9FAFB'
                            }}>{item.domain}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddCompanyFromDomain(item);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: '#10B981',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                                title="Add as new company"
                              >
                                Add
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDomainAction(item, 'hold');
                                }}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: '#F59E0B',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                                title="Hold - ignore for now"
                              >
                                Hold
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDomainAction(item, 'spam');
                                }}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: '#EF4444',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                                title="Add domain to spam list"
                              >
                                Spam
                              </button>
                            </div>
                          </div>
                          {item.sampleEmails && item.sampleEmails.length > 0 && (
                            <div style={{
                              fontSize: '11px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                              marginTop: '4px'
                            }}>
                              {item.sampleEmails.slice(0, 2).join(', ')}
                              {item.sampleEmails.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          )}

          {/* Hold Section (Contacts & Companies) */}
          {(holdContacts.length > 0 || holdCompanies.length > 0) && (
          <div style={{ marginBottom: '8px' }}>
            <div
              onClick={() => setExpandedDataIntegrity(prev => prev.hold ? {} : { hold: true })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: theme === 'light' ? '#F3F4F6' : '#374151',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: expandedDataIntegrity.hold ? '4px' : '0',
              }}
            >
              <FaChevronDown
                style={{
                  transform: expandedDataIntegrity.hold ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                  fontSize: '10px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}
              />
              <FaExclamationTriangle style={{ color: '#F59E0B', fontSize: '12px' }} />
              <span style={{
                fontWeight: 600,
                fontSize: '13px',
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                Hold
              </span>
              <span style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginLeft: 'auto'
              }}>
                {holdContacts.length + holdCompanies.length}
              </span>
            </div>
            {expandedDataIntegrity.hold && (
              <div style={{ paddingLeft: '8px' }}>
                {/* Tabs for Contacts / Companies */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '8px',
                  background: theme === 'light' ? '#E5E7EB' : '#1F2937',
                  borderRadius: '6px',
                  padding: '2px'
                }}>
                  <button
                    onClick={() => setHoldTab('contacts')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: holdTab === 'contacts'
                        ? (theme === 'light' ? '#FFFFFF' : '#374151')
                        : 'transparent',
                      color: holdTab === 'contacts'
                        ? (theme === 'light' ? '#111827' : '#F9FAFB')
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      boxShadow: holdTab === 'contacts' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Contacts ({holdContacts.length})
                  </button>
                  <button
                    onClick={() => setHoldTab('companies')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: holdTab === 'companies'
                        ? (theme === 'light' ? '#FFFFFF' : '#374151')
                        : 'transparent',
                      color: holdTab === 'companies'
                        ? (theme === 'light' ? '#111827' : '#F9FAFB')
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      boxShadow: holdTab === 'companies' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Companies ({holdCompanies.length})
                  </button>
                </div>

                {/* Contacts Tab Content */}
                {holdTab === 'contacts' && (
                  <>
                    {holdContacts.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        fontSize: '12px'
                      }}>
                        No contacts on hold
                      </div>
                    ) : (
                      holdContacts.map((contact, idx) => (
                        <div key={idx} style={{
                          padding: '8px 12px',
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          borderRadius: '6px',
                          marginBottom: '4px',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: theme === 'light' ? '#111827' : '#F9FAFB',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{contact.full_name || contact.first_name || contact.email || contact.mobile}</div>
                            <div style={{
                              fontSize: '11px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{contact.mobile && (!contact.email || contact.email?.startsWith('whatsapp_')) ? contact.mobile : contact.email}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0, alignItems: 'center' }}>
                            <div style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              background: theme === 'light' ? '#FEF3C7' : '#78350F',
                              color: theme === 'light' ? '#92400E' : '#FCD34D',
                              borderRadius: '4px'
                            }}>
                              {contact.email_count || 1}x
                            </div>
                            <button
                              onClick={() => handleAddFromHold(contact)}
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
                            <button
                              onClick={() => handleSpamFromHold(contact)}
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
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Companies Tab Content */}
                {holdTab === 'companies' && (
                  <>
                    {holdCompanies.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        fontSize: '12px'
                      }}>
                        No companies on hold
                      </div>
                    ) : (
                      holdCompanies.map((company, idx) => (
                        <div key={idx} style={{
                          padding: '8px 12px',
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          borderRadius: '6px',
                          marginBottom: '4px',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: theme === 'light' ? '#111827' : '#F9FAFB',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{company.name || company.domain}</div>
                            <div style={{
                              fontSize: '11px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{company.domain}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0, alignItems: 'center' }}>
                            <button
                              onClick={() => handleAddCompanyFromHold(company)}
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
                            <button
                              onClick={() => handleDeleteCompanyFromHold(company)}
                              title="Remove from hold"
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
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          )}

          {/* Completeness Section */}
          {(incompleteContacts.length > 0 || incompleteCompanies.length > 0) && (
          <div style={{ marginBottom: '8px' }}>
            <div
              onClick={() => setExpandedDataIntegrity(prev => prev.completeness ? {} : { completeness: true })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: theme === 'light' ? '#F3F4F6' : '#374151',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: expandedDataIntegrity.completeness ? '4px' : '0',
              }}
            >
              <FaChevronDown
                style={{
                  transform: expandedDataIntegrity.completeness ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                  fontSize: '10px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}
              />
              <FaCheckCircle style={{ color: '#3B82F6', fontSize: '12px' }} />
              <span style={{
                fontWeight: 600,
                fontSize: '13px',
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                Incomplete
              </span>
              <span style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginLeft: 'auto'
              }}>
                {incompleteContacts.length + incompleteCompanies.length}
              </span>
            </div>
            {expandedDataIntegrity.completeness && (
              <div style={{ paddingLeft: '8px' }}>
                {/* Tabs for Contacts / Companies */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '8px',
                  background: theme === 'light' ? '#E5E7EB' : '#1F2937',
                  borderRadius: '6px',
                  padding: '2px'
                }}>
                  <button
                    onClick={() => setCompletenessTab('contacts')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: completenessTab === 'contacts'
                        ? (theme === 'light' ? '#FFFFFF' : '#374151')
                        : 'transparent',
                      color: completenessTab === 'contacts'
                        ? (theme === 'light' ? '#111827' : '#F9FAFB')
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      boxShadow: completenessTab === 'contacts' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Contacts ({incompleteContacts.length})
                  </button>
                  <button
                    onClick={() => setCompletenessTab('companies')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: completenessTab === 'companies'
                        ? (theme === 'light' ? '#FFFFFF' : '#374151')
                        : 'transparent',
                      color: completenessTab === 'companies'
                        ? (theme === 'light' ? '#111827' : '#F9FAFB')
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      boxShadow: completenessTab === 'companies' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Companies ({incompleteCompanies.length})
                  </button>
                </div>

                {/* Contacts Tab Content */}
                {completenessTab === 'contacts' && (
                  <>
                    {incompleteContacts.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        fontSize: '12px'
                      }}>
                        All contacts are complete
                      </div>
                    ) : (
                      incompleteContacts.map((contact, idx) => (
                        <div key={idx} style={{
                          padding: '8px 12px',
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          borderRadius: '6px',
                          marginBottom: '4px',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setDataIntegrityContactId(contact.contact_id);
                          setDataIntegrityModalOpen(true);
                        }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: theme === 'light' ? '#111827' : '#F9FAFB',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{contact.first_name} {contact.last_name}</div>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            background: contact.completeness_score >= 70
                              ? (theme === 'light' ? '#D1FAE5' : '#065F46')
                              : contact.completeness_score >= 40
                              ? (theme === 'light' ? '#FEF3C7' : '#78350F')
                              : (theme === 'light' ? '#FEE2E2' : '#7F1D1D'),
                            color: contact.completeness_score >= 70
                              ? (theme === 'light' ? '#065F46' : '#6EE7B7')
                              : contact.completeness_score >= 40
                              ? (theme === 'light' ? '#92400E' : '#FCD34D')
                              : (theme === 'light' ? '#991B1B' : '#FCA5A5'),
                            borderRadius: '4px',
                            fontWeight: 600
                          }}>
                            {contact.completeness_score}%
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* Companies Tab Content */}
                {completenessTab === 'companies' && (
                  <>
                    {incompleteCompanies.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        fontSize: '12px'
                      }}>
                        All companies are complete
                      </div>
                    ) : (
                      incompleteCompanies.map((company, idx) => (
                        <div key={idx} style={{
                          padding: '8px 12px',
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          borderRadius: '6px',
                          marginBottom: '4px',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setCompanyDataIntegrityCompanyId(company.company_id);
                          setCompanyDataIntegrityModalOpen(true);
                        }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: theme === 'light' ? '#111827' : '#F9FAFB',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>{company.name}</div>
                          </div>
                          <div style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            background: company.completeness_score >= 70
                              ? (theme === 'light' ? '#D1FAE5' : '#065F46')
                              : company.completeness_score >= 40
                              ? (theme === 'light' ? '#FEF3C7' : '#78350F')
                              : (theme === 'light' ? '#FEE2E2' : '#7F1D1D'),
                            color: company.completeness_score >= 70
                              ? (theme === 'light' ? '#065F46' : '#6EE7B7')
                              : company.completeness_score >= 40
                              ? (theme === 'light' ? '#92400E' : '#FCD34D')
                              : (theme === 'light' ? '#991B1B' : '#FCA5A5'),
                            borderRadius: '4px',
                            fontWeight: 600
                          }}>
                            {company.completeness_score}%
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          )}

          {/* Duplicates Section */}
          {(duplicateContacts.length > 0 || duplicateCompanies.length > 0) && (
          <div style={{ marginTop: '8px' }}>
            <div
              onClick={() => setExpandedDataIntegrity(prev => prev.duplicates ? {} : { duplicates: true })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                background: theme === 'light' ? '#F3F4F6' : '#374151',
                cursor: 'pointer',
                borderRadius: '6px',
                marginBottom: expandedDataIntegrity.duplicates ? '4px' : '0',
              }}
            >
              <FaChevronDown
                style={{
                  transform: expandedDataIntegrity.duplicates ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                  fontSize: '10px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                }}
              />
              <FaClone style={{ color: '#8B5CF6', fontSize: '12px' }} />
              <span style={{
                fontWeight: 600,
                fontSize: '13px',
                color: theme === 'light' ? '#111827' : '#F9FAFB'
              }}>
                Duplicates
              </span>
              <span style={{
                fontSize: '12px',
                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                marginLeft: 'auto'
              }}>
                {duplicateContacts.length + duplicateCompanies.length}
              </span>
            </div>
            {expandedDataIntegrity.duplicates && (
              <div style={{ paddingLeft: '8px' }}>
                {/* Tabs for Contacts / Companies */}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '8px',
                  background: theme === 'light' ? '#E5E7EB' : '#1F2937',
                  borderRadius: '6px',
                  padding: '2px'
                }}>
                  <button
                    onClick={() => setDuplicatesTab('contacts')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: duplicatesTab === 'contacts'
                        ? (theme === 'light' ? '#FFFFFF' : '#374151')
                        : 'transparent',
                      color: duplicatesTab === 'contacts'
                        ? (theme === 'light' ? '#111827' : '#F9FAFB')
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      boxShadow: duplicatesTab === 'contacts' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Contacts ({duplicateContacts.length})
                  </button>
                  <button
                    onClick={() => setDuplicatesTab('companies')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: duplicatesTab === 'companies'
                        ? (theme === 'light' ? '#FFFFFF' : '#374151')
                        : 'transparent',
                      color: duplicatesTab === 'companies'
                        ? (theme === 'light' ? '#111827' : '#F9FAFB')
                        : (theme === 'light' ? '#6B7280' : '#9CA3AF'),
                      boxShadow: duplicatesTab === 'companies' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Companies ({duplicateCompanies.length})
                  </button>
                </div>

                {/* Contacts Tab Content */}
                {duplicatesTab === 'contacts' && (
                  <>
                    {duplicateContacts.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        fontSize: '12px'
                      }}>
                        No duplicate contacts
                      </div>
                    ) : (
                      duplicateContacts.map((rawItem, idx) => {
                        const item = getSwappedItem(rawItem);
                        return (
                        <div key={rawItem.id || idx} style={{
                          padding: '10px 12px',
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          borderRadius: '6px',
                          marginBottom: '6px',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                        }}>
                          {/* Header with match type badge */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                            }}>
                              Duplicate Contact Pair
                            </div>
                            <div style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              background: rawItem.match_type === 'email' ? '#EF4444' : rawItem.match_type === 'domain' ? '#F59E0B' : '#8B5CF6',
                              color: 'white',
                              borderRadius: '4px',
                              fontWeight: 500,
                              textTransform: 'uppercase'
                            }}>
                              {rawItem.match_type}
                            </div>
                          </div>
                          {/* Source contact - will be KEPT */}
                          <div
                            onClick={() => window.open(`/new-crm/contact/${item.source_id}`, '_blank')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '4px',
                              padding: '6px 8px',
                              background: theme === 'light' ? '#ECFDF5' : '#064E3B',
                              borderRadius: '4px',
                              border: `1px solid ${theme === 'light' ? '#10B981' : '#059669'}`,
                              cursor: 'pointer'
                            }}
                            title="Click to view contact"
                          >
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#10B981',
                              textTransform: 'uppercase'
                            }}>Keep</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: theme === 'light' ? '#111827' : '#F9FAFB'
                            }}>
                              {item.source?.first_name} {item.source?.last_name}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                            }}>
                              ID: {item.source_id?.slice(0, 8)}...
                            </span>
                            <FaExternalLinkAlt size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                          </div>
                          {/* Swap button */}
                          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSwap(rawItem.id); }}
                              style={{
                                padding: '4px 12px',
                                fontSize: '10px',
                                background: theme === 'light' ? '#F3F4F6' : '#374151',
                                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Swap keep/remove"
                            >
                              <FaExchangeAlt size={10} />
                              Swap
                            </button>
                          </div>
                          {/* Duplicate contact - will be REMOVED */}
                          <div
                            onClick={() => window.open(`/new-crm/contact/${item.duplicate_id}`, '_blank')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px',
                              marginTop: '4px',
                              padding: '6px 8px',
                              background: theme === 'light' ? '#FEF2F2' : '#7F1D1D',
                              borderRadius: '4px',
                              border: `1px solid ${theme === 'light' ? '#EF4444' : '#DC2626'}`,
                              cursor: 'pointer'
                            }}
                            title="Click to view contact"
                          >
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#EF4444',
                              textTransform: 'uppercase'
                            }}>Remove</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: theme === 'light' ? '#111827' : '#F9FAFB'
                            }}>
                              {item.duplicate?.first_name} {item.duplicate?.last_name}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                            }}>
                              ID: {item.duplicate_id?.slice(0, 8)}...
                            </span>
                            <FaExternalLinkAlt size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                          </div>
                          {/* Match details if available */}
                          {rawItem.match_details && (
                            <div style={{
                              fontSize: '11px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                              marginBottom: '8px',
                              background: theme === 'light' ? '#F3F4F6' : '#111827',
                              padding: '6px 8px',
                              borderRadius: '4px'
                            }}>
                              {rawItem.match_details.source_email && <div>Email: {rawItem.match_details.source_email}</div>}
                              {rawItem.match_details.source_name && <div>Name match: "{rawItem.match_details.source_name}" vs "{rawItem.match_details.duplicate_name}"</div>}
                            </div>
                          )}
                          {/* Action buttons */}
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '8px'
                          }}>
                            <button
                              onClick={() => handleConfirmMergeDuplicate(item)}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Confirm Merge
                            </button>
                            <button
                              onClick={() => handleDismissDuplicate(rawItem)}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: theme === 'light' ? '#E5E7EB' : '#374151',
                                color: theme === 'light' ? '#374151' : '#D1D5DB',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )})
                    )}
                  </>
                )}

                {/* Companies Tab Content */}
                {duplicatesTab === 'companies' && (
                  <>
                    {duplicateCompanies.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '16px',
                        color: theme === 'light' ? '#9CA3AF' : '#6B7280',
                        fontSize: '12px'
                      }}>
                        No duplicate companies
                      </div>
                    ) : (
                      duplicateCompanies.map((rawItem, idx) => {
                        const item = getSwappedItem(rawItem);
                        return (
                        <div key={rawItem.id || idx} style={{
                          padding: '10px 12px',
                          background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                          borderRadius: '6px',
                          marginBottom: '6px',
                          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`
                        }}>
                          {/* Header with match type badge */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                            }}>
                              Duplicate Company Pair
                            </div>
                            <div style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              background: rawItem.match_type === 'domain' ? '#EF4444' : rawItem.match_type === 'email' ? '#F59E0B' : '#8B5CF6',
                              color: 'white',
                              borderRadius: '4px',
                              fontWeight: 500,
                              textTransform: 'uppercase'
                            }}>
                              {rawItem.match_type}
                            </div>
                          </div>
                          {/* Source company - will be KEPT */}
                          <div
                            onClick={() => window.open(`/new-crm/company/${item.source_id}`, '_blank')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '4px',
                              padding: '6px 8px',
                              background: theme === 'light' ? '#ECFDF5' : '#064E3B',
                              borderRadius: '4px',
                              border: `1px solid ${theme === 'light' ? '#10B981' : '#059669'}`,
                              cursor: 'pointer'
                            }}
                            title="Click to view company"
                          >
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#10B981',
                              textTransform: 'uppercase'
                            }}>Keep</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: theme === 'light' ? '#111827' : '#F9FAFB'
                            }}>
                              {item.source?.name || 'Unknown'}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                            }}>
                              {item.source?.category || 'No category'} • ID: {item.source_id?.slice(0, 8)}...
                            </span>
                            <FaExternalLinkAlt size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                          </div>
                          {/* Swap button */}
                          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSwap(rawItem.id); }}
                              style={{
                                padding: '4px 12px',
                                fontSize: '10px',
                                background: theme === 'light' ? '#F3F4F6' : '#374151',
                                color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Swap keep/remove"
                            >
                              <FaExchangeAlt size={10} />
                              Swap
                            </button>
                          </div>
                          {/* Duplicate company - will be REMOVED */}
                          <div
                            onClick={() => window.open(`/new-crm/company/${item.duplicate_id}`, '_blank')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px',
                              marginTop: '4px',
                              padding: '6px 8px',
                              background: theme === 'light' ? '#FEF2F2' : '#7F1D1D',
                              borderRadius: '4px',
                              border: `1px solid ${theme === 'light' ? '#EF4444' : '#DC2626'}`,
                              cursor: 'pointer'
                            }}
                            title="Click to view company"
                          >
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#EF4444',
                              textTransform: 'uppercase'
                            }}>Remove</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: theme === 'light' ? '#111827' : '#F9FAFB'
                            }}>
                              {item.duplicate?.name || 'Unknown'}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                            }}>
                              {item.duplicate?.category || 'No category'} • ID: {item.duplicate_id?.slice(0, 8)}...
                            </span>
                            <FaExternalLinkAlt size={10} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                          </div>
                          {/* Match details if available */}
                          {rawItem.match_details && (
                            <div style={{
                              fontSize: '11px',
                              color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                              marginBottom: '8px',
                              background: theme === 'light' ? '#F3F4F6' : '#111827',
                              padding: '6px 8px',
                              borderRadius: '4px'
                            }}>
                              {rawItem.match_details.domain && <div>Domain: {rawItem.match_details.domain}</div>}
                              {rawItem.match_details.matched_domain && <div>Domain: {rawItem.match_details.matched_domain}</div>}
                              {rawItem.match_details.source_name && <div>Name match: "{rawItem.match_details.source_name}" vs "{rawItem.match_details.duplicate_name}"</div>}
                            </div>
                          )}
                          {/* Action buttons */}
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '8px'
                          }}>
                            <button
                              onClick={() => handleConfirmMergeDuplicate(item)}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Confirm Merge
                            </button>
                            <button
                              onClick={() => handleDismissDuplicate(rawItem)}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: theme === 'light' ? '#E5E7EB' : '#374151',
                                color: theme === 'light' ? '#374151' : '#D1D5DB',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )})
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          )}

          {/* Missing Company Links Section */}
          {missingCompanyLinks.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div
                onClick={() => setExpandedDataIntegrity(prev => prev.missingCompanyLinks ? {} : { missingCompanyLinks: true })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: theme === 'light' ? '#F3F4F6' : '#374151',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  marginBottom: expandedDataIntegrity.missingCompanyLinks ? '4px' : '0',
                }}
              >
                <FaChevronDown
                  style={{
                    transform: expandedDataIntegrity.missingCompanyLinks ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                    fontSize: '10px',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                  }}
                />
                <FaHandshake style={{ color: '#F59E0B', fontSize: '12px' }} />
                <span style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  Missing Company Links
                </span>
                <span style={{
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                  marginLeft: 'auto'
                }}>
                  {missingCompanyLinks.length}
                </span>
              </div>
              {expandedDataIntegrity.missingCompanyLinks && (
                <div style={{ paddingLeft: '8px' }}>
                  {missingCompanyLinks.map((item, idx) => (
                    <div key={`${item.contact_id}-${item.company_id}`} style={{
                      padding: '8px 12px',
                      background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                      borderRadius: '6px',
                      marginBottom: '4px',
                      border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: theme === 'light' ? '#111827' : '#F9FAFB',
                            cursor: 'pointer'
                          }} onClick={() => navigate(`/contact/${item.contact_id}`)}>
                            {item.contact_name}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                            marginTop: '2px'
                          }}>
                            {item.email}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#3B82F6',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <FaBuilding size={10} />
                            <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/company/${item.company_id}`)}>
                              {item.company_name}
                            </span>
                            <span style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                              ({item.domain})
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleLinkContactToCompany(item)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 500,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: '#10B981',
                            color: 'white',
                            marginLeft: '8px',
                            flexShrink: 0
                          }}
                        >
                          Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contacts Missing Company Section */}
          {contactsMissingCompany.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div
                onClick={() => setExpandedDataIntegrity(prev => prev.contactsMissingCompany ? {} : { contactsMissingCompany: true })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: theme === 'light' ? '#F3F4F6' : '#374151',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  marginBottom: expandedDataIntegrity.contactsMissingCompany ? '4px' : '0',
                }}
              >
                <FaChevronDown
                  style={{
                    transform: expandedDataIntegrity.contactsMissingCompany ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                    fontSize: '10px',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                  }}
                />
                <FaBuilding style={{ color: '#8B5CF6', fontSize: '12px' }} />
                <span style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: theme === 'light' ? '#111827' : '#F9FAFB'
                }}>
                  Contacts Missing Company
                </span>
                <span style={{
                  fontSize: '12px',
                  color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                  marginLeft: 'auto'
                }}>
                  {contactsMissingCompany.length}
                </span>
              </div>
              {expandedDataIntegrity.contactsMissingCompany && (
                <div style={{ paddingLeft: '8px' }}>
                  {contactsMissingCompany.map((contact) => (
                    <div key={contact.contact_id} style={{
                      padding: '8px 12px',
                      background: theme === 'light' ? '#FFFFFF' : '#1F2937',
                      borderRadius: '6px',
                      marginBottom: '4px',
                      border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/contact/${contact.contact_id}`)}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: theme === 'light' ? '#111827' : '#F9FAFB',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                          marginTop: '2px'
                        }}>
                          {contact.emails?.[0] || 'No email'}
                          {contact.category && ` • ${contact.category}`}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDataIntegrityContactId(contact.contact_id);
                          setDataIntegrityModalOpen(true);
                        }}
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: 500,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: '#8B5CF6',
                          color: 'white',
                          marginLeft: '8px',
                          flexShrink: 0
                        }}
                      >
                        Add Company
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </>
      )}
    </div>
  );
};

export default DataIntegrityTab;
