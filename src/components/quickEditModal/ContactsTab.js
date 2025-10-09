import React from 'react';
import { FaEnvelope, FaPhone, FaPlus, FaTrash } from 'react-icons/fa';
import {
  Section,
  SectionHeader,
  SectionLabel,
  AddItemRow,
  AddButton,
  Input,
  Select,
  ListContainer,
  ListItem,
  ItemText,
  PrimaryBadge,
  SetPrimaryButton,
  DeleteButton,
  EmptyState
} from './StyledComponents';

const ContactsTab = ({
  emails,
  mobiles,
  newEmailText,
  setNewEmailText,
  newEmailType,
  setNewEmailType,
  newMobileText,
  setNewMobileText,
  newMobileType,
  setNewMobileType,
  handleAddEmail,
  handleRemoveEmail,
  handleUpdateEmailType,
  handleSetEmailPrimary,
  handleAddMobile,
  handleRemoveMobile,
  handleUpdateMobileType,
  handleSetMobilePrimary,
  theme,
  shouldShowField
}) => {
  return (
    <>
      {/* Emails Section */}
      {shouldShowField('email') && (
        <Section>
          <SectionHeader>
            <SectionLabel theme={theme}>
              <FaEnvelope style={{ fontSize: '14px', color: '#3B82F6' }} />
              Email Addresses
            </SectionLabel>
          </SectionHeader>

          {/* Add New Email */}
          <AddItemRow>
            <Input
              type="email"
              value={newEmailText}
              onChange={(e) => setNewEmailText(e.target.value)}
              placeholder="Add email address..."
              theme={theme}
              style={{ flex: 1 }}
            />
            <Select
              value={newEmailType}
              onChange={(e) => setNewEmailType(e.target.value)}
              theme={theme}
              style={{ width: 'auto' }}
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </Select>
            <AddButton
              onClick={() => {
                if (newEmailText.trim()) {
                  handleAddEmail(newEmailText, newEmailType);
                  setNewEmailText('');
                }
              }}
            >
              <FaPlus style={{ fontSize: '12px' }} />
              Add
            </AddButton>
          </AddItemRow>

          {/* Email List */}
          <ListContainer theme={theme}>
            {emails?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {emails.map((emailData, index) => (
                  <ListItem
                    key={emailData.email_id}
                    theme={theme}
                    $first={index === 0}
                    $last={index === emails.length - 1}
                  >
                    <FaEnvelope style={{ fontSize: '14px', color: '#3B82F6' }} />
                    <div style={{ flex: 1 }}>
                      <ItemText theme={theme}>
                        {emailData.email}
                        {emailData.is_primary && (
                          <PrimaryBadge>PRIMARY</PrimaryBadge>
                        )}
                      </ItemText>
                    </div>
                    <Select
                      value={emailData.type}
                      onChange={(e) => handleUpdateEmailType(emailData.email_id, e.target.value)}
                      theme={theme}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </Select>
                    <input
                      type="radio"
                      name="primaryEmail"
                      checked={emailData.is_primary}
                      onChange={() => handleSetEmailPrimary(emailData.email_id)}
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                        accentColor: '#10B981'
                      }}
                      title="Set as primary"
                    />
                    <DeleteButton
                      onClick={() => handleRemoveEmail(emailData.email_id)}
                    >
                      <FaTrash />
                    </DeleteButton>
                  </ListItem>
                ))}
              </div>
            ) : (
              <EmptyState theme={theme}>
                <FaEnvelope style={{ fontSize: '24px', opacity: 0.5 }} />
                <span>No email addresses</span>
              </EmptyState>
            )}
          </ListContainer>
        </Section>
      )}

      {/* Mobile Numbers Section */}
      {shouldShowField('mobile') && (
        <Section>
          <SectionHeader>
            <SectionLabel theme={theme}>
              <FaPhone style={{ fontSize: '14px', color: '#3B82F6' }} />
              Mobile Numbers
            </SectionLabel>
          </SectionHeader>

          {/* Add New Mobile */}
          <AddItemRow>
            <Input
              type="tel"
              value={newMobileText}
              onChange={(e) => setNewMobileText(e.target.value)}
              placeholder="Add mobile number..."
              theme={theme}
              style={{ flex: 1 }}
            />
            <Select
              value={newMobileType}
              onChange={(e) => setNewMobileType(e.target.value)}
              theme={theme}
              style={{ width: 'auto' }}
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </Select>
            <AddButton
              onClick={() => {
                if (newMobileText.trim()) {
                  handleAddMobile(newMobileText, newMobileType);
                  setNewMobileText('');
                }
              }}
            >
              <FaPlus style={{ fontSize: '12px' }} />
              Add
            </AddButton>
          </AddItemRow>

          {/* Mobile List */}
          <ListContainer theme={theme}>
            {mobiles?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {mobiles.map((mobileData, index) => (
                  <ListItem
                    key={mobileData.mobile_id}
                    theme={theme}
                    $first={index === 0}
                    $last={index === mobiles.length - 1}
                  >
                    <FaPhone style={{ fontSize: '14px', color: '#3B82F6' }} />
                    <div style={{ flex: 1 }}>
                      <ItemText theme={theme}>
                        {mobileData.mobile}
                        {mobileData.is_primary && (
                          <PrimaryBadge>PRIMARY</PrimaryBadge>
                        )}
                      </ItemText>
                    </div>
                    <Select
                      value={mobileData.type}
                      onChange={(e) => handleUpdateMobileType(mobileData.mobile_id, e.target.value)}
                      theme={theme}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </Select>
                    <input
                      type="radio"
                      name="primaryMobile"
                      checked={mobileData.is_primary}
                      onChange={() => handleSetMobilePrimary(mobileData.mobile_id)}
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                        accentColor: '#10B981'
                      }}
                      title="Set as primary"
                    />
                    <DeleteButton
                      onClick={() => handleRemoveMobile(mobileData.mobile_id)}
                    >
                      <FaTrash />
                    </DeleteButton>
                  </ListItem>
                ))}
              </div>
            ) : (
              <EmptyState theme={theme}>
                <FaPhone style={{ fontSize: '24px', opacity: 0.5 }} />
                <span>No mobile numbers</span>
              </EmptyState>
            )}
          </ListContainer>
        </Section>
      )}
    </>
  );
};

export default ContactsTab;