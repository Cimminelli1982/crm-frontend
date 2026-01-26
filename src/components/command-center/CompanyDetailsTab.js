import React, { useState } from 'react';
import {
  FaRocket, FaBuilding, FaLinkedin, FaGlobe, FaTag,
  FaMapMarkerAlt, FaUsers, FaChevronDown, FaChevronUp, FaEdit, FaPlus, FaClone, FaSyncAlt, FaUnlink, FaCheck
} from 'react-icons/fa';
import { getCountryFlag } from '../../utils/countryFlags';

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
 * @param {Function} props.onEdit - Callback for editing company (opens completeness modal)
 * @param {Function} props.onAssociateCompany - Callback to open associate company modal
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
  loading = false,
  onEdit,
  onAssociateCompany,
  onDuplicates,
  onRefresh,
  onRemoveAssociation,
  onMarkComplete,
  onManageTags,
  onManageCities
}) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
        <div style={{ fontSize: '12px', marginTop: '4px', marginBottom: '16px' }}>Link a company to this contact</div>
        {onAssociateCompany && (
          <button
            onClick={onAssociateCompany}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#8B5CF6',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FaPlus size={10} />
            Associate Company
          </button>
        )}
      </div>
    );
  }

  // Read-only mode with just company cards (for Lists tab)
  if (!editable && !companyDetails) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {companies.map((cc, idx) => {
          // Handle both flattened and nested data structures
          const companyName = cc.name || cc.company?.name || cc.companies?.name;
          const companyId = cc.company_id || cc.company?.company_id || cc.companies?.company_id;
          const companyCategory = cc.category || cc.company?.category || cc.companies?.category;
          if (!companyName && !companyId) return null;

          return (
            <div
              key={cc.contact_companies_id || idx}
              onClick={() => onCompanyNavigate && companyId && onCompanyNavigate(companyId)}
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
                    {companyName}
                  </div>
                  {companyCategory && companyCategory !== 'Not Set' && (
                    <div style={{
                      fontSize: '12px',
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                    }}>
                      {companyCategory}
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
      {/* Company Selector - always visible */}
      <div style={{ marginBottom: '12px' }}>
        <select
          value={selectedCompanyId || ''}
          onChange={(e) => {
            if (e.target.value === '__associate__') {
              onAssociateCompany?.();
            } else {
              onSelectCompany?.(e.target.value);
            }
          }}
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
            // Handle both flattened (from useContactDetails) and nested data structures
            const companyName = cc.name || cc.company?.name || cc.companies?.name || 'Unknown Company';
            const companyId = cc.company_id || cc.company?.company_id || cc.companies?.company_id;
            return (
              <option key={companyId} value={companyId}>
                {companyName} {cc.is_primary ? '(Primary)' : ''}
              </option>
            );
          })}
          {onAssociateCompany && (
            <option value="__associate__" style={{ fontWeight: 600, color: '#8B5CF6' }}>
              + Associate Company...
            </option>
          )}
        </select>
      </div>

      {/* Enrich with Apollo Button (full width in editable mode) */}
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

      {/* Read-only mode: Action buttons */}
      {!editable && (onEnrich || onEdit || onDuplicates || onRefresh) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          {onEnrich && (
            <button
              onClick={onEnrich}
              title="Enrich with Apollo"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaRocket size={9} />
              Enrich
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              title="Edit company"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaEdit size={9} />
              Edit
            </button>
          )}
          {onMarkComplete && (
            <button
              onClick={onMarkComplete}
              title="Mark company as complete"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: 'none',
                background: theme === 'dark' ? '#059669' : '#10B981',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaCheck size={9} />
              Complete!
            </button>
          )}
          {onRemoveAssociation && (
            <button
              onClick={onRemoveAssociation}
              title="Remove association with this company"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                color: theme === 'dark' ? '#EF4444' : '#DC2626',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaUnlink size={9} />
              Remove
            </button>
          )}
          {onDuplicates && (
            <button
              onClick={onDuplicates}
              title="Merge with duplicate company"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaClone size={9} />
              Duplicates
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh"
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                fontSize: '10px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaSyncAlt size={9} />
            </button>
          )}
        </div>
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
              {/* Category badge */}
              {companyDetails.category && companyDetails.category !== 'Not Set' && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  background: theme === 'dark' ? '#374151' : '#E5E7EB',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151'
                }}>
                  {companyDetails.category}
                </span>
              )}
              {/* LinkedIn link */}
              {companyDetails.linkedin && (
                <a
                  href={companyDetails.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#3B82F6',
                    marginTop: '4px',
                    textDecoration: 'none'
                  }}
                >
                  <FaLinkedin size={11} />
                  LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Description - Expandable */}
          <div style={sectionStyle}>
            <div
              onClick={() => !editable && setDescriptionExpanded(!descriptionExpanded)}
              style={{
                ...sectionTitleStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: editable ? 'default' : 'pointer',
                marginBottom: '8px'
              }}
            >
              Description
              {!editable && companyDetails?.description && (
                descriptionExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />
              )}
            </div>
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
                <div
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  style={{
                    fontSize: '12px',
                    color: theme === 'dark' ? '#D1D5DB' : '#374151',
                    lineHeight: 1.5,
                    cursor: 'pointer',
                    ...(!descriptionExpanded && {
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    })
                  }}
                >
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
                  <a
                    key={d.id}
                    href={d.domain.startsWith('http') ? d.domain : `https://${d.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      ...tagStyle,
                      background: theme === 'dark' ? '#374151' : '#E5E7EB',
                      color: theme === 'dark' ? '#93C5FD' : '#2563EB',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <FaGlobe size={10} />
                    {d.domain}
                    {d.is_primary && <span style={{ fontSize: '10px', opacity: 0.7 }}>(primary)</span>}
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Tags */}
          <div style={sectionStyle}>
            <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <FaTag style={{ marginRight: '6px' }} />
                Tags ({companyTags.length})
              </span>
              {onManageTags && (
                <FaPlus
                  size={11}
                  style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                  onClick={onManageTags}
                  title="Add tag"
                />
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {companyTags.length === 0 ? (
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                  No tags
                </span>
              ) : (
                companyTags.map((t, idx) => (
                  <span
                    key={t.tag_id || idx}
                    style={{
                      ...tagStyle,
                      background: theme === 'dark' ? '#4B5563' : '#DBEAFE',
                      color: theme === 'dark' ? '#93C5FD' : '#1D4ED8'
                    }}
                  >
                    {t.name || t.tags?.name || 'Unknown'}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Cities */}
          <div style={sectionStyle}>
            <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <FaMapMarkerAlt style={{ marginRight: '6px' }} />
                Cities ({companyCities.length})
              </span>
              {onManageCities && (
                <FaPlus
                  size={11}
                  style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                  onClick={onManageCities}
                  title="Add city"
                />
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {companyCities.length === 0 ? (
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                  No cities
                </span>
              ) : (
                companyCities.map((c, idx) => (
                  <span
                    key={c.city_id || idx}
                    style={{
                      ...tagStyle,
                      background: theme === 'dark' ? '#374151' : '#FEF3C7',
                      color: theme === 'dark' ? '#FCD34D' : '#92400E'
                    }}
                  >
                    {getCountryFlag(c.country || c.cities?.country)} {c.name || c.cities?.name || 'Unknown'}
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
                companyContacts.map((cc, idx) => {
                  // Handle both flattened (from transformation) and nested (cc.contacts) data
                  const firstName = cc.first_name || cc.contacts?.first_name;
                  const lastName = cc.last_name || cc.contacts?.last_name;
                  const jobRole = cc.job_role || cc.contacts?.job_role;
                  const profileImage = cc.profile_image_url || cc.contacts?.profile_image_url;
                  const contactId = cc.contact_id || cc.contacts?.contact_id;

                  return (
                    <div
                      key={contactId || idx}
                      onClick={() => onContactClick && onContactClick(contactId)}
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
                      {profileImage ? (
                        <img
                          src={profileImage}
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
                          {(firstName?.[0] || '') + (lastName?.[0] || '')}
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
                          {firstName} {lastName}
                        </div>
                        {jobRole && (
                          <div style={{
                            fontSize: '11px',
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {jobRole}
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
