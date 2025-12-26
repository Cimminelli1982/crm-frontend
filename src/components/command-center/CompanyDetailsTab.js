import React from 'react';
import {
  FaRocket, FaBuilding, FaLinkedin, FaGlobe, FaTag,
  FaMapMarkerAlt, FaUsers
} from 'react-icons/fa';

// Company category options
const COMPANY_CATEGORIES = [
  'Not Set', 'Professional Investor', 'Skip', 'Inbox', 'Advisory',
  'Corporation', 'SME', 'Startup', 'Corporate', 'Institution', 'Media', 'Hold'
];

/**
 * CompanyDetailsTab - Reusable component for displaying/editing company details
 *
 * @param {Object} props
 * @param {string} props.theme - 'dark' or 'light'
 * @param {Array} props.companies - Array of contact_companies with company info (linked companies)
 * @param {string} props.selectedCompanyId - Currently selected company ID (for multi-company)
 * @param {Function} props.onSelectCompany - Callback(companyId) when selecting a company
 * @param {Object} props.companyDetails - Full company details object
 * @param {string} props.companyLogo - URL of company logo
 * @param {Array} props.companyDomains - Array of company domains
 * @param {Array} props.companyTags - Array of company_tags with tag info
 * @param {Array} props.companyCities - Array of company_cities with city info
 * @param {Array} props.companyContacts - Array of contacts working at this company
 * @param {boolean} props.editable - If true, shows form inputs; if false, shows readonly
 * @param {Function} props.onUpdateField - Callback(field, value) for updating company fields
 * @param {Function} props.onEnrich - Callback for Apollo enrichment
 * @param {Function} props.onContactClick - Callback(contactId) when clicking a contact
 * @param {Function} props.onCompanyNavigate - Callback(companyId) when clicking to navigate to company page
 * @param {boolean} props.loading - Show loading state
 */
const CompanyDetailsTab = ({
  theme,
  companies = [],
  selectedCompanyId,
  onSelectCompany,
  companyDetails,
  companyLogo,
  companyDomains = [],
  companyTags = [],
  companyCities = [],
  companyContacts = [],
  editable = false,
  onUpdateField,
  onEnrich,
  onContactClick,
  onCompanyNavigate,
  loading = false
}) => {
  // Styles
  const sectionStyle = {
    background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
  };

  const sectionTitleStyle = {
    fontSize: '11px',
    fontWeight: 600,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const labelStyle = {
    fontSize: '11px',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    display: 'block',
    marginBottom: '4px'
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    borderRadius: '4px',
    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
    background: theme === 'dark' ? '#374151' : '#FFFFFF',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '13px'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const tagStyle = {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  if (loading) {
    return (
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
      }}>
        Loading...
      </div>
    );
  }

  // No companies linked
  if (companies.length === 0) {
    return (
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
        textAlign: 'center'
      }}>
        <FaBuilding size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
        <div style={{ fontSize: '14px', fontWeight: 500 }}>No company linked</div>
        <div style={{ fontSize: '12px', marginTop: '4px' }}>Link a company from the Contact tab</div>
      </div>
    );
  }

  // Read-only mode with just company cards (for Lists tab)
  if (!editable && !companyDetails) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {companies.map((cc, idx) => {
          const company = cc.company || cc.companies;
          if (!company) return null;

          return (
            <div
              key={cc.contact_companies_id || idx}
              onClick={() => onCompanyNavigate && onCompanyNavigate(company.company_id)}
              style={{
                padding: '12px',
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                borderRadius: '8px',
                marginBottom: '8px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                cursor: onCompanyNavigate ? 'pointer' : 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: theme === 'dark' ? '#374151' : '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaBuilding size={18} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#F9FAFB' : '#111827'
                  }}>
                    {company.name}
                  </div>
                  {company.category && company.category !== 'Not Set' && (
                    <div style={{
                      fontSize: '12px',
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                    }}>
                      {company.category}
                    </div>
                  )}
                </div>
                {cc.is_primary && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    background: '#8B5CF6',
                    color: 'white',
                    borderRadius: '4px'
                  }}>
                    Primary
                  </span>
                )}
              </div>
              {cc.relationship && cc.relationship !== 'not_set' && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                }}>
                  Role: {cc.relationship}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full editable/detailed view
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
      {/* Company Selector (if multiple companies) */}
      {companies.length > 1 && (
        <div style={{ marginBottom: '12px' }}>
          <select
            value={selectedCompanyId || ''}
            onChange={(e) => onSelectCompany?.(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
              background: theme === 'dark' ? '#374151' : '#FFFFFF',
              color: theme === 'dark' ? '#F9FAFB' : '#111827',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {companies.map(cc => {
              const company = cc.company || cc.companies;
              return (
                <option key={cc.company_id || company?.company_id} value={cc.company_id || company?.company_id}>
                  {company?.name || 'Unknown Company'} {cc.is_primary ? '(Primary)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Enrich with Apollo Button (only in editable mode) */}
      {editable && onEnrich && (
        <button
          onClick={onEnrich}
          title="Enrich company data with Apollo"
          style={{
            width: '100%',
            padding: '10px 16px',
            marginBottom: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <FaRocket size={14} />
          Enrich with Apollo
        </button>
      )}

      {companyDetails && (
        <>
          {/* Company Header with Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '12px',
            background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
            borderRadius: '8px',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`
          }}>
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyDetails.name}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  background: '#FFFFFF',
                  padding: '4px'
                }}
              />
            ) : (
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#374151' : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaBuilding size={24} color={theme === 'dark' ? '#6B7280' : '#9CA3AF'} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: theme === 'dark' ? '#F9FAFB' : '#111827'
              }}>
                {companyDetails.name}
              </div>
              {companyDetails.category && companyDetails.category !== 'Not Set' && (
                <div style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  marginTop: '2px'
                }}>
                  {companyDetails.category}
                </div>
              )}
              {companyDomains.length > 0 && (
                <div style={{
                  fontSize: '11px',
                  color: '#3B82F6',
                  marginTop: '2px'
                }}>
                  {companyDomains[0].domain}
                </div>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Basic Info</div>

            {editable ? (
              <>
                {/* Name */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={labelStyle}>Company Name</label>
                  <input
                    type="text"
                    value={companyDetails.name || ''}
                    onChange={(e) => onUpdateField?.('name', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Category */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={companyDetails.category || 'Not Set'}
                    onChange={(e) => onUpdateField?.('category', e.target.value)}
                    style={selectStyle}
                  >
                    {COMPANY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* LinkedIn */}
                <div>
                  <label style={labelStyle}>LinkedIn</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={companyDetails.linkedin || ''}
                      onChange={(e) => onUpdateField?.('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/..."
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    {companyDetails.linkedin && (
                      <a
                        href={companyDetails.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: '#0A66C2',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <FaLinkedin size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {companyDetails.category && companyDetails.category !== 'Not Set' && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{
                      ...tagStyle,
                      background: theme === 'dark' ? '#374151' : '#E5E7EB',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151'
                    }}>
                      {companyDetails.category}
                    </span>
                  </div>
                )}
                {companyDetails.linkedin && (
                  <a
                    href={companyDetails.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '12px',
                      color: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FaLinkedin size={12} />
                    View on LinkedIn
                  </a>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Description</div>
            {editable ? (
              <textarea
                value={companyDetails.description || ''}
                onChange={(e) => onUpdateField?.('description', e.target.value)}
                placeholder="Company description..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: theme === 'dark' ? '#374151' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            ) : (
              companyDetails.description ? (
                <div style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {companyDetails.description}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                  No description
                </div>
              )
            )}
          </div>

          {/* Domains */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <FaGlobe style={{ marginRight: '6px' }} />
              Domains ({companyDomains.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {companyDomains.length === 0 ? (
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                  No domains
                </span>
              ) : (
                companyDomains.map(d => (
                  <span
                    key={d.id}
                    style={{
                      ...tagStyle,
                      background: theme === 'dark' ? '#374151' : '#E5E7EB',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151'
                    }}
                  >
                    <FaGlobe size={10} />
                    {d.domain}
                    {d.is_primary && <span style={{ fontSize: '10px', opacity: 0.7 }}>(primary)</span>}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Tags */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <FaTag style={{ marginRight: '6px' }} />
              Tags ({companyTags.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {companyTags.length === 0 ? (
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                  No tags
                </span>
              ) : (
                companyTags.map(t => (
                  <span
                    key={t.entry_id}
                    style={{
                      ...tagStyle,
                      background: theme === 'dark' ? '#4B5563' : '#DBEAFE',
                      color: theme === 'dark' ? '#93C5FD' : '#1D4ED8'
                    }}
                  >
                    {t.tags?.name || 'Unknown'}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Cities */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>
              <FaMapMarkerAlt style={{ marginRight: '6px' }} />
              Cities ({companyCities.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {companyCities.length === 0 ? (
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                  No cities
                </span>
              ) : (
                companyCities.map(c => (
                  <span
                    key={c.entry_id}
                    style={{
                      ...tagStyle,
                      background: theme === 'dark' ? '#374151' : '#FEF3C7',
                      color: theme === 'dark' ? '#FCD34D' : '#92400E'
                    }}
                  >
                    {c.cities?.name || 'Unknown'}{c.cities?.country ? `, ${c.cities.country}` : ''}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Working Here */}
          <div style={{ ...sectionStyle, marginBottom: 0 }}>
            <div style={sectionTitleStyle}>
              <FaUsers style={{ marginRight: '6px' }} />
              Working Here ({companyContacts.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {companyContacts.length === 0 ? (
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                  No contacts linked
                </span>
              ) : (
                companyContacts.map(cc => {
                  const contact = cc.contact || cc.contacts;
                  return (
                    <div
                      key={cc.contact_id || contact?.contact_id}
                      onClick={() => onContactClick && onContactClick(cc.contact_id || contact?.contact_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        borderRadius: '6px',
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        cursor: onContactClick ? 'pointer' : 'default',
                        transition: 'background 0.15s ease',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`
                      }}
                    >
                      {contact?.profile_image_url ? (
                        <img
                          src={contact.profile_image_url}
                          alt=""
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        }}>
                          {(contact?.first_name?.[0] || '') + (contact?.last_name?.[0] || '')}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {contact?.first_name} {contact?.last_name}
                        </div>
                        {contact?.job_role && (
                          <div style={{
                            fontSize: '11px',
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {contact.job_role}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanyDetailsTab;
