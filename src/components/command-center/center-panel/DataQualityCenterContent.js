import React from 'react';
import {
  EmailContentPanel,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaCheckCircle, FaArrowRight, FaSyncAlt } from 'react-icons/fa';

const BUCKET_CONFIG = {
  b: { label: 'Needs Input', color: '#F59E0B', bg: '#F59E0B20' },
  c: { label: 'Fixable', color: '#3B82F6', bg: '#3B82F620' },
  a: { label: 'Review', color: '#10B981', bg: '#10B98120' },
};

const DIMENSION_CONFIG = {
  completeness: { label: 'Completeness', color: '#EF4444', icon: 'Fields' },
  photo: { label: 'Photo', color: '#A855F7', icon: 'Photo' },
  note: { label: 'Note', color: '#EAB308', icon: 'Note' },
  company: { label: 'Company Linked', color: '#3B82F6', icon: 'Company' },
  company_linked: { label: 'Company Linked', color: '#3B82F6', icon: 'Company' },
  company_complete: { label: 'Company Data', color: '#14B8A6', icon: 'Company Data' },
};

const DataQualityCenterContent = ({ theme, dataQualityHook }) => {
  const { selectedDqContact, handleResolve, handleRefresh, dqContacts } = dataQualityHook;

  if (!selectedDqContact) {
    return (
      <EmailContentPanel theme={theme}>
        <EmptyState theme={theme}>
          Select a contact to review data quality
        </EmptyState>
      </EmailContentPanel>
    );
  }

  const contact = selectedDqContact;
  const bucket = BUCKET_CONFIG[contact.bucket] || BUCKET_CONFIG.c;
  const dimensions = contact.missing_dimensions || [];
  const details = contact.missing_details || {};
  const allComplete = dimensions.length === 0;

  const cardStyle = {
    padding: '16px',
    borderRadius: '10px',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    marginBottom: '6px',
  };

  const renderCompletenessCard = () => {
    const info = details.completeness;
    if (!info) return null;
    const missingFields = info.missing_fields || [];
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, color: '#EF4444', fontSize: '14px' }}>Completeness</span>
          <span style={{
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '6px',
            background: info.score >= 80 ? '#10B98120' : info.score >= 50 ? '#F59E0B20' : '#EF444420',
            color: info.score >= 80 ? '#10B981' : info.score >= 50 ? '#F59E0B' : '#EF4444',
            fontWeight: 600,
          }}>
            Score: {info.score}%
          </span>
        </div>
        <div style={labelStyle}>Missing fields</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {missingFields.map(f => (
            <span key={f} style={{
              fontSize: '12px',
              padding: '3px 8px',
              borderRadius: '5px',
              background: theme === 'dark' ? '#374151' : '#F3F4F6',
              color: theme === 'dark' ? '#D1D5DB' : '#374151',
            }}>
              {f}
            </span>
          ))}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
          Edit in the right panel &rarr; Info / Work tabs
        </div>
      </div>
    );
  };

  const renderPhotoCard = () => (
    <div style={cardStyle}>
      <span style={{ fontWeight: 600, color: '#A855F7', fontSize: '14px' }}>Photo</span>
      <div style={{ marginTop: '6px', fontSize: '13px', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}>
        No profile photo set
      </div>
      <div style={{ marginTop: '4px', fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
        Upload via the right panel profile image
      </div>
    </div>
  );

  const renderNoteCard = () => (
    <div style={cardStyle}>
      <span style={{ fontWeight: 600, color: '#EAB308', fontSize: '14px' }}>Note</span>
      <div style={{ marginTop: '6px', fontSize: '13px', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}>
        No note linked to this contact
      </div>
      <div style={{ marginTop: '4px', fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
        Create a note from the right panel Notes tab
      </div>
    </div>
  );

  const renderCompanyCard = () => (
    <div style={cardStyle}>
      <span style={{ fontWeight: 600, color: '#3B82F6', fontSize: '14px' }}>Company</span>
      <div style={{ marginTop: '6px', fontSize: '13px', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}>
        No company linked
      </div>
      <div style={{ marginTop: '4px', fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
        Link a company via the right panel Work tab
      </div>
    </div>
  );

  const renderCompanyCompleteCard = () => {
    const info = details.company_complete;
    if (!info || info === true) {
      return (
        <div style={cardStyle}>
          <span style={{ fontWeight: 600, color: '#14B8A6', fontSize: '14px' }}>Company Data</span>
          <div style={{ marginTop: '6px', fontSize: '13px', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}>
            Linked company has incomplete data
          </div>
        </div>
      );
    }
    const missingFields = info.missing_fields || [];
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, color: '#14B8A6', fontSize: '14px' }}>Company Data</span>
          {info.score != null && (
            <span style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#14B8A620',
              color: '#14B8A6',
              fontWeight: 600,
            }}>
              Score: {info.score}%
            </span>
          )}
        </div>
        {info.company_name && (
          <div style={{ fontSize: '13px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', marginBottom: '8px' }}>
            {info.company_name}
          </div>
        )}
        {missingFields.length > 0 && (
          <>
            <div style={labelStyle}>Missing fields</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {missingFields.map(f => (
                <span key={f} style={{
                  fontSize: '12px',
                  padding: '3px 8px',
                  borderRadius: '5px',
                  background: theme === 'dark' ? '#374151' : '#F3F4F6',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                }}>
                  {f}
                </span>
              ))}
            </div>
          </>
        )}
        <div style={{ marginTop: '8px', fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
          Edit company via the right panel
        </div>
      </div>
    );
  };

  const dimensionRenderers = {
    completeness: renderCompletenessCard,
    photo: renderPhotoCard,
    note: renderNoteCard,
    company: renderCompanyCard,
    company_linked: renderCompanyCard,
    company_complete: renderCompanyCompleteCard,
  };

  return (
    <EmailContentPanel theme={theme}>
      <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: contact.profile_image_url ? 'transparent' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 600,
              color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {contact.profile_image_url ? (
                <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                [contact.first_name, contact.last_name].filter(Boolean).map(n => n[0]).join('').toUpperCase() || '?'
              )}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                {contact.full_name}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                {contact.category && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: theme === 'dark' ? '#374151' : '#E5E7EB',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  }}>
                    {contact.category}
                  </span>
                )}
                {contact.job_role && (
                  <span style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                    {contact.job_role}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRefresh}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#D1D5DB'}`,
                background: 'transparent',
                color: theme === 'dark' ? '#D1D5DB' : '#374151',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FaSyncAlt size={12} />
            </button>
            <button
              onClick={() => handleResolve(contact.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#10B981',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Resolve & Next <FaArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Bucket status */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: bucket.bg,
          border: `1px solid ${bucket.color}30`,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: '6px',
            background: bucket.color,
            color: 'white',
            textTransform: 'uppercase',
          }}>
            {contact.bucket.toUpperCase()}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: bucket.color }}>
            {bucket.label}
          </span>
          {contact.needs_input_details && (
            <span style={{ fontSize: '12px', color: theme === 'dark' ? '#D1D5DB' : '#374151', marginLeft: '8px' }}>
              &mdash; {contact.needs_input_details}
            </span>
          )}
        </div>

        {/* Dimension cards */}
        {allComplete ? (
          <div style={{
            ...cardStyleBase(theme),
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '20px',
          }}>
            <FaCheckCircle style={{ color: '#10B981', fontSize: '20px' }} />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#10B981' }}>
              All dimensions complete
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dimensions.map(dim => {
              const renderer = dimensionRenderers[dim];
              return renderer ? <React.Fragment key={dim}>{renderer()}</React.Fragment> : null;
            })}
          </div>
        )}

        {/* Position indicator */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
        }}>
          {dqContacts.length} contact{dqContacts.length !== 1 ? 's' : ''} remaining
        </div>
      </div>
    </EmailContentPanel>
  );
};

const cardStyleBase = (theme) => ({
  padding: '16px',
  borderRadius: '10px',
  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
  background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
});

export default DataQualityCenterContent;
