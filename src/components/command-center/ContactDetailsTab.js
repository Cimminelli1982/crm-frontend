import React from 'react';
import {
  FaRocket, FaEnvelope, FaWhatsapp, FaBuilding, FaTag,
  FaLinkedin, FaSearch, FaEdit, FaMapMarkerAlt
} from 'react-icons/fa';

// Contact category options
const CONTACT_CATEGORIES = [
  'Not Set', 'Inbox', 'Skip', 'Professional Investor', 'Team', 'Advisor',
  'Supplier', 'Founder', 'Manager', 'Friend and Family', 'Other', 'Student',
  'Media', 'Institution', 'WhatsApp Group Contact', 'Hold', 'System'
];

/**
 * ContactDetailsTab - Reusable component for displaying/editing contact details
 *
 * @param {Object} props
 * @param {string} props.theme - 'dark' or 'light'
 * @param {Object} props.contact - Contact object with all details
 * @param {Array} props.emails - Array of email objects
 * @param {Array} props.mobiles - Array of mobile objects
 * @param {Array} props.companies - Array of contact_companies with company info
 * @param {Array} props.tags - Array of contact_tags with tag info
 * @param {Array} props.cities - Array of contact_cities with city info (optional)
 * @param {boolean} props.editable - If true, shows form inputs; if false, shows readonly
 * @param {Function} props.onUpdateField - Callback(field, value) for updating contact fields
 * @param {Function} props.onEnrich - Callback for Apollo enrichment
 * @param {Function} props.onManageEmails - Callback to open email management modal
 * @param {Function} props.onManageMobiles - Callback to open mobile management modal
 * @param {Function} props.onManageCompanies - Callback to open company management modal
 * @param {Function} props.onManageTags - Callback to open tags management modal
 * @param {Function} props.onManageCities - Callback to open cities management modal
 * @param {Function} props.onCompanyClick - Callback(companyId) when clicking a company
 * @param {boolean} props.loading - Show loading state
 * @param {number} props.completenessScore - Optional completeness score (shows dot if < 100)
 */
const ContactDetailsTab = ({
  theme,
  contact,
  emails = [],
  mobiles = [],
  companies = [],
  tags = [],
  cities = [],
  editable = false,
  onUpdateField,
  onEnrich,
  onManageEmails,
  onManageMobiles,
  onManageCompanies,
  onManageTags,
  onManageCities,
  onCompanyClick,
  loading = false,
  completenessScore
}) => {
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

  if (!contact) {
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
        No contact selected
      </div>
    );
  }

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

  const badgeStyle = {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    background: theme === 'dark' ? '#374151' : '#F3F4F6',
    color: theme === 'dark' ? '#D1D5DB' : '#374151'
  };

  const itemRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    background: theme === 'dark' ? '#374151' : '#E5E7EB',
    borderRadius: '4px',
    marginBottom: '4px',
    fontSize: '12px'
  };

  const handleLinkedInClick = () => {
    if (contact.linkedin) {
      const url = contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`;
      window.open(url, '_blank');
    } else {
      const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;
      window.open(searchUrl, '_blank');
    }
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
      {/* Enrich with Apollo Button (only in editable mode) */}
      {editable && onEnrich && (
        <button
          onClick={onEnrich}
          title="Enrich contact data with Apollo"
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

      {/* Read-only mode: Category & Score badges */}
      {!editable && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={badgeStyle}>
            {contact.category || 'No category'}
          </span>
          {contact.score && (
            <span style={{
              ...badgeStyle,
              background: theme === 'dark' ? '#7C3AED' : '#EDE9FE',
              color: theme === 'dark' ? '#F3E8FF' : '#6D28D9'
            }}>
              ⭐ {contact.score}
            </span>
          )}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Basic Info</div>

        {editable ? (
          <>
            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  type="text"
                  value={contact.first_name || ''}
                  onChange={(e) => onUpdateField?.('first_name', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  type="text"
                  value={contact.last_name || ''}
                  onChange={(e) => onUpdateField?.('last_name', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Job Role */}
            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>Job Role</label>
              <input
                type="text"
                value={contact.job_role || ''}
                onChange={(e) => onUpdateField?.('job_role', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Category & Score */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={contact.category || 'Not Set'}
                  onChange={(e) => onUpdateField?.('category', e.target.value)}
                  style={selectStyle}
                >
                  {CONTACT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={contact.score || ''}
                  onChange={(e) => onUpdateField?.('score', parseInt(e.target.value) || null)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Birthday & LinkedIn */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={labelStyle}>Birthday</label>
                <input
                  type="date"
                  value={contact.birthday || ''}
                  onChange={(e) => onUpdateField?.('birthday', e.target.value || null)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>LinkedIn</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    type="text"
                    value={contact.linkedin || ''}
                    onChange={(e) => onUpdateField?.('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    onClick={handleLinkedInClick}
                    title={contact.linkedin ? 'Open LinkedIn profile' : 'Search on LinkedIn'}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: contact.linkedin ? '#0A66C2' : (theme === 'dark' ? '#374151' : '#FFFFFF'),
                      color: contact.linkedin ? '#FFFFFF' : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {contact.linkedin ? <FaLinkedin size={14} /> : <FaSearch size={12} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Read-only: Job Role */}
            {contact.job_role && (
              <div style={{ marginBottom: '8px' }}>
                <div style={labelStyle}>Role</div>
                <div style={{ fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                  {contact.job_role}
                </div>
              </div>
            )}

            {/* Read-only: LinkedIn */}
            {contact.linkedin && (
              <div>
                <div style={labelStyle}>LinkedIn</div>
                <a
                  href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
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
                  View Profile
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Section 2: Contact Details (Emails, Mobiles, Companies) */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Contact Details</div>

        {/* Emails */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FaEnvelope size={12} style={{ color: '#3B82F6' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>
              Emails
            </span>
            {editable && onManageEmails && (
              <FaEdit
                size={11}
                style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                onClick={onManageEmails}
                title="Manage emails"
              />
            )}
          </div>
          {emails.length > 0 ? (
            emails.map((e, idx) => (
              <div key={e.email_id || idx} style={itemRowStyle}>
                <span style={{ flex: 1, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>{e.email}</span>
                {e.is_primary && (
                  <span style={{ fontSize: '10px', padding: '1px 4px', background: '#10B981', color: 'white', borderRadius: '3px' }}>
                    Primary
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
              No emails
            </div>
          )}
        </div>

        {/* Mobiles */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FaWhatsapp size={12} style={{ color: '#22C55E' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>
              Phone Numbers
            </span>
            {editable && onManageMobiles && (
              <FaEdit
                size={11}
                style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                onClick={onManageMobiles}
                title="Manage phone numbers"
              />
            )}
          </div>
          {mobiles.length > 0 ? (
            mobiles.map((m, idx) => (
              <div key={m.mobile_id || idx} style={itemRowStyle}>
                <span style={{ flex: 1, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>{m.mobile}</span>
                {m.is_primary && (
                  <span style={{ fontSize: '10px', padding: '1px 4px', background: '#10B981', color: 'white', borderRadius: '3px' }}>
                    Primary
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
              No phone numbers
            </div>
          )}
        </div>

        {/* Companies */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FaBuilding size={12} style={{ color: '#8B5CF6' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>
              Companies
            </span>
            {editable && onManageCompanies && (
              <FaEdit
                size={11}
                style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                onClick={onManageCompanies}
                title="Add company"
              />
            )}
          </div>
          {companies.length > 0 ? (
            companies.map((cc, idx) => (
              <div
                key={cc.contact_companies_id || idx}
                style={{
                  ...itemRowStyle,
                  cursor: onCompanyClick && cc.company?.company_id ? 'pointer' : 'default'
                }}
                onClick={() => onCompanyClick && cc.company?.company_id && onCompanyClick(cc.company.company_id)}
              >
                <span style={{ flex: 1, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                  {cc.company?.name || cc.companies?.name || 'Unknown'}
                </span>
                {cc.is_primary && (
                  <span style={{ fontSize: '10px', padding: '1px 4px', background: '#8B5CF6', color: 'white', borderRadius: '3px' }}>
                    Primary
                  </span>
                )}
                {cc.relationship && cc.relationship !== 'not_set' && (
                  <span style={{ fontSize: '10px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                    {cc.relationship}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
              No companies linked
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Tags & Cities */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>Tags & Locations</div>

        {/* Tags */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FaTag size={11} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>
              Tags
            </span>
            {editable && onManageTags && (
              <FaEdit
                size={11}
                style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                onClick={onManageTags}
                title="Manage tags"
              />
            )}
          </div>
          {tags.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {tags.map((t, idx) => (
                <span
                  key={t.entry_id || idx}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: theme === 'dark' ? '#374151' : '#E5E7EB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827'
                  }}
                >
                  {t.tags?.name || 'Unknown'}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
              No tags
            </div>
          )}
        </div>

        {/* Cities (only if provided) */}
        {cities && cities.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <FaMapMarkerAlt size={11} style={{ color: '#EC4899' }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>
                Cities
              </span>
              {editable && onManageCities && (
                <FaEdit
                  size={11}
                  style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                  onClick={onManageCities}
                  title="Manage cities"
                />
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {cities.map((c, idx) => (
                <span
                  key={c.entry_id || idx}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: theme === 'dark' ? '#374151' : '#E5E7EB',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827'
                  }}
                >
                  {c.cities?.name}{c.cities?.country ? `, ${c.cities.country}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        {editable && (!cities || cities.length === 0) && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <FaMapMarkerAlt size={11} style={{ color: '#EC4899' }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', flex: 1 }}>
                Cities
              </span>
              {onManageCities && (
                <FaEdit
                  size={11}
                  style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
                  onClick={onManageCities}
                  title="Manage cities"
                />
              )}
            </div>
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
              No cities
            </div>
          </div>
        )}
      </div>

      {/* Description Section */}
      <div style={{
        ...sectionStyle,
        marginBottom: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={sectionTitleStyle}>Description</div>
        {editable ? (
          <textarea
            value={contact.description || ''}
            onChange={(e) => onUpdateField?.('description', e.target.value)}
            placeholder="Add notes about this contact..."
            style={{
              flex: 1,
              minHeight: '120px',
              padding: '10px',
              fontSize: '13px',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#D1D5DB'}`,
              borderRadius: '6px',
              background: theme === 'dark' ? '#111827' : '#FFFFFF',
              color: theme === 'dark' ? '#F9FAFB' : '#111827',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
          />
        ) : (
          contact.description ? (
            <div style={{
              fontSize: '12px',
              color: theme === 'dark' ? '#D1D5DB' : '#374151',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}>
              {contact.description}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
              No description
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ContactDetailsTab;
