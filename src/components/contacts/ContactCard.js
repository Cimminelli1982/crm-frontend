import React from 'react';
import styled from 'styled-components';
import {
  FaBuilding, FaEnvelope, FaPhone, FaInfoCircle, FaBolt,
  FiMessageCircle, FaCalendarAlt, FaTimes, FiEdit2, FiX
} from 'react-icons/fa';

const ContactCard = ({
  contact,
  theme,
  pageContext,
  filterCategory,
  keepInTouchConfig,
  showActions = true,
  onContactClick,
  onQuickEdit,
  onCommunication,
  onBirthday,
  onRemoveBirthday,
  onFrequency,
  onRemoveKeepInTouch,
  onEditContact,
  onSkipContact,
  onDeleteContact,
  onPowerupsMenu,
  onAddCompany
}) => {
  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick(contact);
    }
  };

  const handleQuickEdit = (e) => {
    e.stopPropagation();
    if (onQuickEdit) {
      onQuickEdit(contact, e);
    }
  };

  const handleCommunication = (e) => {
    e.stopPropagation();
    if (onCommunication) {
      onCommunication(contact, e);
    }
  };

  const handleBirthday = (e) => {
    e.stopPropagation();
    if (onBirthday) {
      onBirthday(contact, e);
    }
  };

  const handleRemoveBirthday = (e) => {
    e.stopPropagation();
    if (onRemoveBirthday) {
      onRemoveBirthday(contact, e);
    }
  };

  const handleFrequency = (e) => {
    e.stopPropagation();
    if (onFrequency) {
      onFrequency(contact, e);
    }
  };

  const handleRemoveKeepInTouch = (e) => {
    e.stopPropagation();
    if (onRemoveKeepInTouch) {
      onRemoveKeepInTouch(contact, e);
    }
  };

  const handleEditContact = (e) => {
    e.stopPropagation();
    if (onEditContact) {
      onEditContact(contact, e);
    }
  };

  const handleSkipContact = (e) => {
    e.stopPropagation();
    if (onSkipContact) {
      onSkipContact(contact, e);
    }
  };

  const handleDeleteContact = (e) => {
    e.stopPropagation();
    if (onDeleteContact) {
      onDeleteContact(contact, e);
    }
  };

  const handlePowerupsMenu = (e) => {
    e.stopPropagation();
    if (onPowerupsMenu) {
      onPowerupsMenu(contact, e);
    }
  };

  const handleAddCompany = (e) => {
    e.stopPropagation();
    if (onAddCompany) {
      onAddCompany(contact, e);
    }
  };

  return (
    <ContactCardContainer key={contact.contact_id} theme={theme} $isCompany={contact.isCompanyRecord}>
      <ContactCardContent onClick={handleContactClick}>
        <ContactCardHeader>
          <ContactAvatar $isCompany={contact.isCompanyRecord} theme={theme}>
            {contact.isCompanyRecord ? (
              <FaBuilding style={{ color: '#3B82F6', fontSize: '20px' }} />
            ) : contact.profile_image_url ? (
              <img src={contact.profile_image_url} alt="Profile" />
            ) : (
              <InfoIconButton
                onClick={handleQuickEdit}
                theme={theme}
                title="Quick Edit Contact Details"
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
                  }
                </KeepInTouchFrequencyBadge>
              )}
            </ContactName>
            {contact.job_role && (
              <ContactRole theme={theme}>{contact.job_role}</ContactRole>
            )}
            {contact.companies && contact.companies.length > 0 && (
              <CompanyList>
                {contact.companies.map((company, index) => (
                  <CompanyTag
                    key={company.company_id}
                    theme={theme}
                    $isPrimary={company.is_primary}
                  >
                    {company.is_primary && (
                      <PrimaryBadge>PRIMARY</PrimaryBadge>
                    )}
                    {company.companies?.name || 'Unknown Company'}
                  </CompanyTag>
                ))}
              </CompanyList>
            )}
            {!contact.companies?.length && !contact.isCompanyRecord && onAddCompany && (
              <AddCompanyButton
                onClick={handleAddCompany}
                theme={theme}
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
                    onClick={handleCommunication}
                    $communication
                    title="Contact via WhatsApp, Email, or LinkedIn"
                  >
                    <FiMessageCircle />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={handleBirthday}
                    $frequency
                    title="Edit birthday date"
                  >
                    <FaCalendarAlt />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={handleRemoveBirthday}
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
                    onClick={handleCommunication}
                    $communication
                    title="Contact via WhatsApp, Email, or LinkedIn"
                  >
                    <FiMessageCircle />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={handleFrequency}
                    $frequency
                    title="Set Keep in Touch Frequency"
                  >
                    <FaCalendarAlt />
                  </CardActionButton>

                  <CardActionButton
                    theme={theme}
                    onClick={handleRemoveKeepInTouch}
                    $removeKeepInTouch
                    title="Remove Keep in Touch"
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
                onClick={handleEditContact}
                $edit
                title="Edit Contact"
              >
                <FiEdit2 />
              </CardActionButton>
              <CardActionButton
                theme={theme}
                onClick={handleSkipContact}
                $skip
                title="Skip Contact"
              >
                <FiX />
              </CardActionButton>
              <CardActionButton
                theme={theme}
                onClick={handleDeleteContact}
                $delete
                title="Delete Contact"
              >
                <FiX />
              </CardActionButton>
              <CardActionButton
                theme={theme}
                onClick={handlePowerupsMenu}
                $powerups
                title="Powerups Menu"
              >
                <FaBolt />
              </CardActionButton>
            </>
          )}
        </ContactCardActions>
      )}
    </ContactCardContainer>
  );
};

// Styled Components
const ContactCardContainer = styled.div`
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

  button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
`;

const InfoIconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-size: 24px;
  transition: all 0.2s;

  &:hover {
    color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
    transform: scale(1.1);
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ContactRole = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 4px 0;
`;

const CompanyList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const CompanyTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${props => props.$isPrimary
    ? (props.theme === 'light' ? '#EBF4FF' : '#1E3A8A')
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')
  };
  color: ${props => props.$isPrimary
    ? (props.theme === 'light' ? '#3B82F6' : '#93C5FD')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border-radius: 12px;
  font-size: 13px;
  font-weight: ${props => props.$isPrimary ? '600' : '500'};
  border: 1px solid ${props => props.$isPrimary
    ? (props.theme === 'light' ? '#BFDBFE' : '#3B82F6')
    : (props.theme === 'light' ? '#E5E7EB' : '#4B5563')
  };
`;

const PrimaryBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background: #10B981;
  color: white;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

const AddCompanyButton = styled.button`
  margin-top: 8px;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#EBF4FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#93C5FD'};
  border: 1px solid ${props => props.theme === 'light' ? '#BFDBFE' : '#3B82F6'};
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;

  &:hover {
    background: ${props => props.theme === 'light' ? '#DBEAFE' : '#2563EB'};
    transform: translateY(-1px);
  }
`;

const KeepInTouchFrequencyBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#78350F'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#FCD34D'};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
  white-space: nowrap;

  svg {
    display: none;
  }

  @media (max-width: 768px) {
    padding: 2px 6px;
    font-size: 11px;
    margin-left: 6px;
    border-radius: 10px;
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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default ContactCard;