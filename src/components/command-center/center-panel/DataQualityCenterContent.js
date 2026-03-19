import React, { useState, useEffect } from 'react';
import {
  EmailContentPanel,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import {
  FaCheckCircle, FaTimesCircle, FaChevronDown, FaChevronUp,
  FaArrowRight, FaSyncAlt, FaMagic,
} from 'react-icons/fa';

const CATEGORY_OPTIONS = [
  'Professional Investor', 'Founder', 'Manager', 'Advisor', 'Friend and Family',
  'Team', 'Supplier', 'Media', 'Student', 'Institution', 'Other'
];

const KIT_OPTIONS = [
  'Not Set', 'Weekly', 'Monthly', 'Quarterly', 'Twice per Year', 'Once per Year', 'Do not keep in touch'
];

const WISHES_OPTIONS = [
  'no wishes set', 'whatsapp standard', 'email standard', 'email custom',
  'whatsapp custom', 'call', 'present', 'no wishes'
];

const BUCKET_CONFIG = {
  b: { label: 'Needs Input', color: '#F59E0B', bg: '#F59E0B20' },
  c: { label: 'Fixable', color: '#3B82F6', bg: '#3B82F620' },
  a: { label: 'Review', color: '#10B981', bg: '#10B98120' },
};

// --- Styles ---

const sectionBox = (theme) => ({
  borderRadius: '10px',
  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
  background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
  marginBottom: '8px',
  overflow: 'hidden',
});

const sectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 14px',
  cursor: 'pointer',
  userSelect: 'none',
};

const fieldRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '8px',
};

const fieldLabel = (theme) => ({
  fontSize: '12px',
  fontWeight: 600,
  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
  width: '80px',
  flexShrink: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
});

const selectInput = (theme) => ({
  flex: 1,
  padding: '6px 10px',
  borderRadius: '6px',
  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
  background: theme === 'dark' ? '#111827' : '#F9FAFB',
  color: theme === 'dark' ? '#F9FAFB' : '#111827',
  fontSize: '13px',
  outline: 'none',
});

const dateInput = (theme) => ({
  ...selectInput(theme),
  boxSizing: 'border-box',
});

const scoreBtn = (theme, active) => ({
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  border: `1px solid ${active ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
  background: active ? '#3B82F6' : 'transparent',
  color: active ? '#fff' : (theme === 'dark' ? '#D1D5DB' : '#374151'),
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const chipTag = (theme) => ({
  fontSize: '11px',
  padding: '2px 8px',
  borderRadius: '4px',
  background: theme === 'dark' ? '#374151' : '#F3F4F6',
  color: theme === 'dark' ? '#D1D5DB' : '#374151',
});

const aiFxBtn = {
  padding: '4px 12px',
  borderRadius: '6px',
  border: 'none',
  background: '#8B5CF6',
  color: 'white',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  whiteSpace: 'nowrap',
};

const scoreChip = (score) => ({
  fontSize: '11px',
  padding: '2px 8px',
  borderRadius: '6px',
  fontWeight: 600,
  background: score >= 80 ? '#10B98120' : score >= 50 ? '#F59E0B20' : '#EF444420',
  color: score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444',
});

// --- Helpers ---

const isMissing = (contact) => ({
  category: !contact.category || contact.category === 'Inbox' || contact.category === 'Not Set',
  score: contact.score == null,
  birthday: !contact.birthday,
  kit_frequency: !contact.kit_frequency || contact.kit_frequency === 'Not Set',
  christmas: !contact.christmas || contact.christmas === 'no wishes set',
  easter: !contact.easter || contact.easter === 'no wishes set',
});

// --- Sub-components ---

const DimSection = ({ theme, title, titleColor, isComplete, score, isExpanded, onToggle, onFix, children }) => (
  <div style={{ ...sectionBox(theme), opacity: isComplete && !isExpanded ? 0.6 : 1 }}>
    <div style={sectionHeader} onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
        {isComplete
          ? <FaCheckCircle color="#10B981" size={14} />
          : <FaTimesCircle color={titleColor || '#EF4444'} size={14} />
        }
        <span style={{ color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>{title}</span>
        {score != null && <span style={scoreChip(score)}>{score}%</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isComplete && onFix && (
          <button onClick={e => { e.stopPropagation(); onFix(); }} style={aiFxBtn}>
            <FaMagic size={10} /> AI Fix
          </button>
        )}
        {isExpanded
          ? <FaChevronUp size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          : <FaChevronDown size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        }
      </div>
    </div>
    {isExpanded && <div style={{ padding: '4px 14px 14px' }}>{children}</div>}
  </div>
);


const DataQualityCenterContent = ({ theme, dataQualityHook }) => {
  const {
    selectedDqContact, handleResolve, handleRefresh, handleFixAll, handleFixDimension,
    handleUpdateContactField, handleUpdateKIT, dqContacts,
  } = dataQualityHook;

  const [expandedDims, setExpandedDims] = useState({});

  useEffect(() => {
    if (selectedDqContact) {
      const dims = selectedDqContact.missing_dimensions || [];
      setExpandedDims({
        completeness: dims.includes('completeness'),
        photo: dims.includes('photo'),
        note: dims.includes('note'),
        company: dims.includes('company') || dims.includes('company_linked'),
        company_complete: dims.includes('company_complete'),
      });
    }
  }, [selectedDqContact?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedDqContact) {
    return (
      <EmailContentPanel theme={theme}>
        <EmptyState theme={theme}>Select a contact to review data quality</EmptyState>
      </EmailContentPanel>
    );
  }

  const contact = selectedDqContact;
  const bucket = BUCKET_CONFIG[contact.bucket] || BUCKET_CONFIG.c;
  const dims = contact.missing_dimensions || [];
  const details = contact.missing_details || {};
  const dimComplete = (dim) => !dims.includes(dim);
  const toggleDim = (dim) => setExpandedDims(prev => ({ ...prev, [dim]: !prev[dim] }));

  // Determine which human fields are actually missing from live data
  const missing = isMissing(contact);
  const missingInputFields = Object.entries(missing).filter(([, v]) => v).map(([k]) => k);
  const hasMissingInput = missingInputFields.length > 0;

  // AI-fixable fields from completeness (exclude human fields)
  const completenessDetails = details.completeness || {};
  const allMissingFields = completenessDetails.missing_fields || [];
  const humanFieldKeys = ['category', 'score', 'birthday', 'keep_in_touch'];
  const missingAiFields = allMissingFields.filter(f => !humanFieldKeys.includes(f));

  // Has any AI-fixable dimension?
  const aiFixableDims = dims.filter(d => d !== 'completeness' || missingAiFields.length > 0);
  const hasAiFixable = aiFixableDims.length > 0;

  return (
    <EmailContentPanel theme={theme}>
      <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>

        {/* === HEADER === */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              backgroundColor: contact.profile_image_url ? 'transparent' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: 600, color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {contact.profile_image_url
                ? <img src={contact.profile_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : [contact.first_name, contact.last_name].filter(Boolean).map(n => n[0]).join('').toUpperCase() || '?'
              }
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 600, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                {contact.full_name}
              </div>
              {contact.job_role && (
                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginTop: '2px' }}>
                  {contact.job_role}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleRefresh} style={{
            padding: '6px 10px', borderRadius: '6px',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#D1D5DB'}`,
            background: 'transparent', color: theme === 'dark' ? '#D1D5DB' : '#374151',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
          }}>
            <FaSyncAlt size={12} />
          </button>
        </div>

        {/* === BUCKET BADGE === */}
        <div style={{
          padding: '8px 14px', borderRadius: '8px',
          background: bucket.bg, border: `1px solid ${bucket.color}30`,
          marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <span style={{
            fontSize: '11px', fontWeight: 700, padding: '2px 8px',
            borderRadius: '4px', background: bucket.color, color: 'white', textTransform: 'uppercase',
          }}>{contact.bucket?.toUpperCase()}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: bucket.color }}>{bucket.label}</span>
          <span style={{ fontSize: '12px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', marginLeft: '4px' }}>
            {dims.length} dimension{dims.length !== 1 ? 's' : ''} to fix
          </span>
        </div>

        {/* === YOUR INPUT — only if there are missing human fields === */}
        {hasMissingInput && (
          <div style={{
            ...sectionBox(theme),
            border: `1px solid ${theme === 'dark' ? '#F59E0B40' : '#F59E0B40'}`,
          }}>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Your input
              </div>

              {missing.category && (
                <div style={fieldRow}>
                  <span style={fieldLabel(theme)}>Category</span>
                  <select
                    style={selectInput(theme)}
                    value={contact.category || ''}
                    onChange={e => handleUpdateContactField(contact.contact_id, 'category', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {missing.score && (
                <div style={fieldRow}>
                  <span style={fieldLabel(theme)}>Score</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        style={scoreBtn(theme, contact.score === s)}
                        onClick={() => handleUpdateContactField(contact.contact_id, 'score', s)}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {missing.birthday && (
                <div style={fieldRow}>
                  <span style={fieldLabel(theme)}>Birthday</span>
                  <input
                    type="date"
                    style={dateInput(theme)}
                    value={contact.birthday || ''}
                    onChange={e => handleUpdateContactField(contact.contact_id, 'birthday', e.target.value || null)}
                  />
                </div>
              )}

              {missing.kit_frequency && (
                <div style={fieldRow}>
                  <span style={fieldLabel(theme)}>KIT</span>
                  <select
                    style={selectInput(theme)}
                    value={contact.kit_frequency || 'Not Set'}
                    onChange={e => handleUpdateKIT(contact.contact_id, 'kit_frequency', e.target.value)}
                  >
                    {KIT_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              )}

              {missing.christmas && (
                <div style={fieldRow}>
                  <span style={fieldLabel(theme)}>Christmas</span>
                  <select
                    style={selectInput(theme)}
                    value={contact.christmas || 'no wishes set'}
                    onChange={e => handleUpdateKIT(contact.contact_id, 'christmas', e.target.value)}
                  >
                    {WISHES_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              )}

              {missing.easter && (
                <div style={{ ...fieldRow, marginBottom: 0 }}>
                  <span style={fieldLabel(theme)}>Easter</span>
                  <select
                    style={selectInput(theme)}
                    value={contact.easter || 'no wishes set'}
                    onChange={e => handleUpdateKIT(contact.contact_id, 'easter', e.target.value)}
                  >
                    {WISHES_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* === 5 DIMENSION SECTIONS === */}

        {/* 1. COMPLETENESS */}
        <DimSection
          theme={theme}
          title="Completeness"
          titleColor="#EF4444"
          isComplete={dimComplete('completeness')}
          score={completenessDetails.score}
          isExpanded={expandedDims.completeness}
          onToggle={() => toggleDim('completeness')}
          onFix={missingAiFields.length > 0 ? () => handleFixDimension(contact, 'completeness') : null}
        >
          {missingAiFields.length > 0 ? (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {missingAiFields.map(f => <span key={f} style={chipTag(theme)}>{f}</span>)}
            </div>
          ) : dimComplete('completeness') ? (
            <div style={{ fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaCheckCircle size={12} /> All fields complete
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
              Only human-input fields remain — fill them above
            </div>
          )}
        </DimSection>

        {/* 2. PHOTO */}
        <DimSection
          theme={theme}
          title="Photo"
          titleColor="#A855F7"
          isComplete={dimComplete('photo')}
          isExpanded={expandedDims.photo}
          onToggle={() => toggleDim('photo')}
          onFix={!dimComplete('photo') ? () => handleFixDimension(contact, 'photo') : null}
        >
          {dimComplete('photo') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {contact.profile_image_url && (
                <img src={contact.profile_image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <span style={{ fontSize: '13px', color: '#10B981' }}>Photo set</span>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}>
              AI will search Apollo &amp; Gravatar
            </div>
          )}
        </DimSection>

        {/* 3. NOTE */}
        <DimSection
          theme={theme}
          title="Note"
          titleColor="#EAB308"
          isComplete={dimComplete('note')}
          isExpanded={expandedDims.note}
          onToggle={() => toggleDim('note')}
          onFix={!dimComplete('note') ? () => handleFixDimension(contact, 'note') : null}
        >
          {dimComplete('note') ? (
            <div style={{ fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaCheckCircle size={12} /> Note linked
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}>
              AI will generate from email &amp; WhatsApp history (min 500 chars)
            </div>
          )}
        </DimSection>

        {/* 4. COMPANY */}
        <DimSection
          theme={theme}
          title="Company"
          titleColor="#3B82F6"
          isComplete={dimComplete('company') && dimComplete('company_linked')}
          isExpanded={expandedDims.company}
          onToggle={() => toggleDim('company')}
          onFix={(!dimComplete('company') || !dimComplete('company_linked')) ? () => handleFixDimension(contact, 'company') : null}
        >
          {dimComplete('company') && dimComplete('company_linked') ? (
            <div style={{ fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaCheckCircle size={12} /> Company linked
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}>
              AI will find from email domain
            </div>
          )}
        </DimSection>

        {/* 5. COMPANY DATA */}
        <DimSection
          theme={theme}
          title="Company Data"
          titleColor="#14B8A6"
          isComplete={dimComplete('company_complete')}
          score={details.company_complete?.score}
          isExpanded={expandedDims.company_complete}
          onToggle={() => toggleDim('company_complete')}
          onFix={!dimComplete('company_complete') ? () => handleFixDimension(contact, 'company_complete') : null}
        >
          {dimComplete('company_complete') ? (
            <div style={{ fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaCheckCircle size={12} /> Company data complete
            </div>
          ) : (
            <div>
              {details.company_complete?.company_name && (
                <div style={{ fontSize: '13px', fontWeight: 500, color: theme === 'dark' ? '#D1D5DB' : '#374151', marginBottom: '6px' }}>
                  {details.company_complete.company_name}
                </div>
              )}
              {details.company_complete?.missing_fields?.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {details.company_complete.missing_fields.map(f => <span key={f} style={chipTag(theme)}>{f}</span>)}
                </div>
              )}
              {!details.company_complete?.missing_fields?.length && (
                <div style={{ fontSize: '13px', color: theme === 'dark' ? '#D1D5DB' : '#374151' }}>
                  Company data incomplete
                </div>
              )}
            </div>
          )}
        </DimSection>

        {/* === FOOTER === */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
            {dqContacts.length} remaining
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {hasAiFixable && (
              <button
                onClick={() => handleFixAll(contact)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: '#8B5CF6', color: 'white', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <FaMagic size={12} /> AI Fix All
              </button>
            )}
            <button
              onClick={() => handleResolve(contact.id)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: '#10B981', color: 'white', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              Resolve &amp; Next <FaArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>
    </EmailContentPanel>
  );
};

export default DataQualityCenterContent;
