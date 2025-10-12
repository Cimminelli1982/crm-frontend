import React from 'react';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaEdit, FaClock, FaTimes, FaCalendarAlt, FaHeart, FaCog, FaInfoCircle, FaStar, FaPlus, FaBriefcase, FaLink, FaHandshake, FaBolt, FaTrash, FaMapMarkerAlt, FaTag, FaExternalLinkAlt, FaSkull } from 'react-icons/fa';
import { FiSkipForward, FiAlertTriangle, FiX, FiMessageCircle, FiSearch } from 'react-icons/fi';

const ContactCard = ({
  contact,
  theme,
  showActions,
  pageContext,
  keepInTouchConfig,
  filterCategory,
  companySuggestions,
  onContactClick,
  onOpenQuickEditContactModal,
  onOpenCommunicationModal,
  onOpenMissingFieldsModal,
  onOpenPowerupsMenu,
  onOpenFrequencyModal,
  onOpenBirthdayModal,
  onRemoveFromKeepInTouch,
  onRemoveBirthday,
  onCompanyClick,
  onAcceptSuggestion,
  onRejectSuggestion,
  onAddCompanyClick,
  onOpenProfileImageModal,
  getContactPriorityScore,
  getContactPriorityLabel,
  getContactCompleteness,
  getCompletenessDisplay,
  formatFrequency,
  formatDaysUntilNext,
  getUrgencyColor,
  renderScoreStars
}) => {
  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick(contact);
    }
  };

  const handleCompanyClick = (companyId, e) => {
    e.stopPropagation();
    if (onCompanyClick) {
      onCompanyClick(companyId, e);
    }
  };

  const handleAcceptSuggestion = (contact, suggestion, e) => {
    e.stopPropagation();
    if (onAcceptSuggestion) {
      onAcceptSuggestion(contact, suggestion, e);
    }
  };

  const handleRejectSuggestion = (contact, e) => {
    e.stopPropagation();
    if (onRejectSuggestion) {
      onRejectSuggestion(contact, e);
    }
  };

  const handleAddCompanyClick = (contact, e) => {
    e.stopPropagation();
    if (onAddCompanyClick) {
      onAddCompanyClick(contact, e);
    }
  };

  return (
    <StyledContactCard theme={theme} $isCompany={contact.isCompanyRecord}>
      <ContactCardContent onClick={handleContactClick}>
        <ContactCardHeader>
          <ContactAvatar
            $isCompany={contact.isCompanyRecord}
            onClick={(e) => {
              if (!contact.isCompanyRecord && onOpenProfileImageModal) {
                e.stopPropagation();
                onOpenProfileImageModal(contact);
              }
            }}
            style={{ cursor: !contact.isCompanyRecord ? 'pointer' : 'default' }}
            title={!contact.isCompanyRecord ? 'Click to manage profile image' : ''}
          >
            {contact.isCompanyRecord ? (
              <FaBuilding style={{ color: '#3B82F6', fontSize: '20px' }} />
            ) : contact.profile_image_url ? (
              <img src={contact.profile_image_url} alt="Profile" />
            ) : (
              <InfoIconButton
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenProfileImageModal) {
                    onOpenProfileImageModal(contact);
                  }
                }}
                theme={theme}
                title="Click to add profile image"
              >
                <FaInfoCircle />
              </InfoIconButton>
            )}
          </ContactAvatar>
          <ContactInfo>
            <ContactName theme={theme}>
              {contact.first_name} {contact.last_name}
              {pageContext === 'keepInTouch' && keepInTouchConfig?.showFrequencyBadge && (
                <KeepInTouchFrequencyBadge theme={theme}>
                  {filterCategory === 'Birthday' && contact.birthday
                    ? (() => {
                        const birthDate = new Date(contact.birthday);
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const month = monthNames[birthDate.getMonth()];
                        const day = birthDate.getDate();
                        return `${month} ${day}`;
                      })()
                    : contact.keep_in_touch_frequency
                      ? formatFrequency(contact.keep_in_touch_frequency)
                      : null
                  }
                </KeepInTouchFrequencyBadge>
              )}
              {pageContext !== 'keepInTouch' && (
                <PriorityIndicator $score={getContactPriorityScore(contact)}>
                  {getContactPriorityLabel(contact)}
                </PriorityIndicator>
              )}
            </ContactName>
            {pageContext === 'keepInTouch' && keepInTouchConfig?.showDaysCounter && (
              <KeepInTouchStatus
                theme={theme}
                $urgencyColor={getUrgencyColor(contact.days_until_next, theme, contact)}
              >
                {formatDaysUntilNext(contact.days_until_next, contact)}
              </KeepInTouchStatus>
            )}
            {(contact.job_role || (contact.score && contact.score > 0)) && (
              <ContactRoleContainer>
                {contact.job_role && (
                  <ContactRole theme={theme}>{contact.job_role}</ContactRole>
                )}
                {contact.score && contact.score > 0 && (
                  <ContactScoreStars>
                    {renderScoreStars(contact.score, 'small')}
                  </ContactScoreStars>
                )}
              </ContactRoleContainer>
            )}
            {contact.companies?.[0] ? (
              <ContactCompany
                theme={theme}
                onClick={(e) => handleCompanyClick(contact.companies[0].company_id, e)}
                $clickable={true}
              >
                <FaBuilding style={{ marginRight: '6px' }} />
                {contact.companies[0].name}
              </ContactCompany>
            ) : companySuggestions && companySuggestions[contact.contact_id] ? (
              <SmartSuggestion
                theme={theme}
                $suggestionType={companySuggestions[contact.contact_id].suggestionType}
              >
                {companySuggestions[contact.contact_id].suggestionType === 'create' ? (
                  <>
                    <FaPlus style={{ marginRight: '6px', color: 'currentColor' }} />
                    <SuggestionText>
                      Create {companySuggestions[contact.contact_id].name} company?
                    </SuggestionText>
                  </>
                ) : (
                  <>
                    <FaBuilding style={{ marginRight: '6px', color: 'currentColor' }} />
                    <SuggestionText>
                      Associate with {companySuggestions[contact.contact_id].name}?
                    </SuggestionText>
                  </>
                )}
                <SuggestionActions>
                  {companySuggestions[contact.contact_id].suggestionType === 'create' ? (
                    <SuggestionButton
                      variant="link"
                      theme={theme}
                      onClick={(e) => handleRejectSuggestion(contact, e)}
                      title="Open company association modal"
                    >
                      <FaExternalLinkAlt />
                    </SuggestionButton>
                  ) : (
                    <>
                      <SuggestionButton
                        variant="accept"
                        theme={theme}
                        onClick={(e) => handleAcceptSuggestion(contact, companySuggestions[contact.contact_id], e)}
                        title="Accept suggestion"
                      >
                        ✓
                      </SuggestionButton>
                      <SuggestionButton
                        variant="reject"
                        theme={theme}
                        onClick={(e) => handleRejectSuggestion(contact, e)}
                        title="Choose different company"
                      >
                        ✕
                      </SuggestionButton>
                    </>
                  )}
                </SuggestionActions>
              </SmartSuggestion>
            ) : (
              <AddCompanyButton
                theme={theme}
                onClick={(e) => handleAddCompanyClick(contact, e)}
                title="Add company association"
              >
                <FaBuilding style={{ marginRight: '6px' }} />
                + Add Related Company
              </AddCompanyButton>
            )}
          </ContactInfo>
        </ContactCardHeader>

        <ContactCardDetails>
          {pageContext !== 'keepInTouch' && contact.emails?.length > 0 && contact.emails[0]?.email && (
            <ContactDetail theme={theme}>
              <FaEnvelope />
              <span>{contact.emails[0].email}</span>
            </ContactDetail>
          )}
          {pageContext !== 'keepInTouch' && contact.mobiles?.length > 0 && contact.mobiles[0]?.mobile && (
            <ContactDetail theme={theme}>
              <FaPhone />
              <span>{contact.mobiles[0].mobile}</span>
            </ContactDetail>
          )}
        </ContactCardDetails>
      </ContactCardContent>

      {showActions && (
        <ContactCardActions>
          {pageContext === 'keepInTouch' ? (
            <>
              {filterCategory === 'Birthday' ? (
                <>
                  <CardActionButton
                    theme={theme}
                    onClick={(e) => onOpenCommunicationModal(contact, e)}
                    $communication
                    title="Contact via WhatsApp, Email, or LinkedIn"
                  >
                    <FiMessageCircle />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => onOpenBirthdayModal(contact, e)}
                    $frequency
                    title="Edit birthday date"
                  >
                    <FaCalendarAlt />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => onRemoveBirthday(contact, e)}
                    $removeKeepInTouch
                    title="Remove birthday"
                  >
                    <FaTimes />
                  </CardActionButton>
                </>
              ) : (
                <>
                  <CardActionButton
                    theme={theme}
                    onClick={(e) => onOpenCommunicationModal(contact, e)}
                    $communication
                    title="Contact via WhatsApp, Email, or LinkedIn"
                  >
                    <FiMessageCircle />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => onOpenFrequencyModal(contact, e)}
                    $frequency
                    title="Change keep in touch frequency"
                  >
                    <FaClock />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={(e) => onRemoveFromKeepInTouch(contact, e)}
                    $removeKeepInTouch
                    title="Don't keep in touch"
                  >
                    <FaTimes />
                  </CardActionButton>
                </>
              )}
            </>
          ) : (
            <>
              <CardActionButton
                theme={theme}
                onClick={(e) => onOpenCommunicationModal(contact, e)}
                $communication
                title="Contact via WhatsApp, Email, or LinkedIn"
              >
                <FiMessageCircle />
              </CardActionButton>

              <CardActionButton
                theme={theme}
                onClick={(e) => onOpenMissingFieldsModal(contact, e)}
                title={getCompletenessDisplay(getContactCompleteness(contact)).title}
                style={{
                  backgroundColor: getCompletenessDisplay(getContactCompleteness(contact)).backgroundColor,
                  color: 'white'
                }}
              >
                {getCompletenessDisplay(getContactCompleteness(contact)).icon}
              </CardActionButton>

              <CardActionButton
                theme={theme}
                onClick={(e) => onOpenPowerupsMenu(contact, e)}
                $powerups
                title="Contact Power-ups"
              >
                <FaBolt />
              </CardActionButton>
            </>
          )}
        </ContactCardActions>
      )}
    </StyledContactCard>
  );
};

// Styled Components
const StyledContactCard = styled.div`
  background: ${props => {
    if (props.$isCompany) {
      return props.theme === 'light' ? '#F8FAFC' : '#1E293B';
    }
    return props.theme === 'light' ? '#FFFFFF' : '#1F2937';
  }};
  border: 1px solid ${props => {
    if (props.$isCompany) {
      return props.theme === 'light' ? '#CBD5E1' : '#475569';
    }
    return props.theme === 'light' ? '#E5E7EB' : '#374151';
  }};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  align-items: center;

  &:hover {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ContactCardContent = styled.div`
  flex: 1;
  cursor: pointer;
  min-width: 0;
`;

const ContactCardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const ContactAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.$isCompany ?
    (props.theme === 'light' ? '#EBF4FF' : '#1E3A8A') :
    '#F3F4F6'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  border: 2px solid ${props => props.$isCompany ?
    (props.theme === 'light' ? '#BFDBFE' : '#3B82F6') :
    '#E5E7EB'
  };

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: #9CA3AF;
    font-size: 20px;
  }
`;

const InfoIconButton = styled.button`
  background: transparent;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: color 0.2s ease;

  &:hover {
    color: #3B82F6;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 18px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PriorityIndicator = styled.div`
  background: ${props => {
    const label = props.children;

    // Spam counter badges
    if (label && label.toString().includes('x')) {
      return '#EF4444';
    }

    // Category badges
    if (label === 'Founder') return '#7C3AED';
    if (label === 'Professional Investor') return '#059669';
    if (label === 'Team') return '#0284C7';
    if (label === 'Advisor') return '#DC2626';
    if (label === 'Supplier') return '#EA580C';
    if (label === 'Manager') return '#7C2D12';
    if (label === 'Institution') return '#1F2937';
    if (label === 'Media') return '#BE185D';
    if (label === 'Friend and Family') return '#16A34A';
    if (label === 'No Category' || label === 'Not Set') return '#6B7280';

    // Time-based badges
    if (label === 'today') return '#10B981';
    if (label === 'yesterday') return '#34D399';
    if (label === 'this week') return '#F59E0B';
    if (label === 'this month') return '#F97316';
    if (label === 'this quarter') return '#EF4444';
    if (label === 'this year') return '#DC2626';
    if (label === 'ages ago') return '#7F1D1D';

    return '#6B7280';
  }};
  color: white;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 6px;
  min-width: fit-content;
  text-align: center;
  white-space: nowrap;
`;

const KeepInTouchFrequencyBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#EBF4FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 8px;
  text-transform: uppercase;
`;

const KeepInTouchStatus = styled.div`
  color: ${props => props.$urgencyColor};
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
  display: flex;
  align-items: center;
`;

const ContactRole = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
`;

const ContactRoleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const ContactScoreStars = styled.div`
  display: flex;
  align-items: center;
`;

const ContactCompany = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;

  ${props => props.$clickable && `
    &:hover {
      color: ${props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
      transform: translateX(2px);
    }
  `}

  svg {
    font-size: 12px;
  }
`;

const AddCompanyButton = styled.div`
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    transform: translateX(2px);
  }

  svg {
    font-size: 12px;
    color: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  }
`;

const SmartSuggestion = styled.div`
  color: ${props => {
    if (props.$suggestionType === 'create') {
      return props.theme === 'light' ? '#7C3AED' : '#A78BFA';
    }
    return props.theme === 'light' ? '#059669' : '#10B981';
  }};
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${props => {
    if (props.$suggestionType === 'create') {
      return props.theme === 'light' ? '#FAF5FF' : '#1E1B23';
    }
    return props.theme === 'light' ? '#F9FAFB' : '#1F2937';
  }};
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid ${props => {
    if (props.$suggestionType === 'create') {
      return props.theme === 'light' ? '#E9D5FF' : '#4C1D95';
    }
    return props.theme === 'light' ? '#E5E7EB' : '#374151';
  }};
  max-width: fit-content;

  @media (max-width: 768px) {
    font-size: 11px;
    padding: 3px 5px;
    gap: 3px;
  }
`;

const SuggestionText = styled.div`
  flex: 1;
  font-weight: 400;

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

const SuggestionActions = styled.div`
  display: flex;
  gap: 3px;

  @media (max-width: 768px) {
    gap: 2px;
  }
`;

const SuggestionButton = styled.button`
  padding: 3px 6px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 20px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => {
    if (props.variant === 'accept') {
      return `
        background: ${props.theme === 'light' ? '#10B981' : '#059669'};
        color: white;
        &:hover {
          background: ${props.theme === 'light' ? '#059669' : '#047857'};
        }
      `;
    } else if (props.variant === 'link') {
      return `
        background: ${props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
        color: white;
        &:hover {
          background: ${props.theme === 'light' ? '#2563EB' : '#3B82F6'};
        }
      `;
    } else {
      return `
        background: ${props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
        color: white;
        &:hover {
          background: ${props.theme === 'light' ? '#6B7280' : '#4B5563'};
        }
      `;
    }
  }}

  @media (max-width: 768px) {
    padding: 2px 4px;
    font-size: 10px;
    min-width: 18px;
    height: 20px;
  }
`;

const ContactCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ContactDetail = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    font-size: 12px;
    flex-shrink: 0;
  }

  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ContactCardActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
`;

const CardActionButton = styled.button`
  background: ${props =>
    props.$edit ? '#10B981' :
    props.$skip ? '#F59E0B' :
    props.$delete ? '#EF4444' :
    props.$frequency ? '#3B82F6' :
    props.$removeKeepInTouch ? '#EF4444' :
    props.$communication ? '#10B981' :
    props.$keepInTouch ? '#EF4444' :
    props.$settings ? '#6B7280' :
    props.$powerups ? '#F59E0B' :
    '#6B7280'
  };
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;

  &:hover {
    transform: scale(1.1);
    background: ${props =>
      props.$edit ? '#059669' :
      props.$skip ? '#D97706' :
      props.$delete ? '#DC2626' :
      props.$frequency ? '#2563EB' :
      props.$removeKeepInTouch ? '#DC2626' :
      '#4B5563'
    };
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default ContactCard;