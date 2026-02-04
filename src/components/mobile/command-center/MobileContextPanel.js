import React, { useState } from 'react';
import styled from 'styled-components';
import {
  FaUser, FaBuilding, FaEnvelope, FaWhatsapp, FaTasks, FaStickyNote,
  FaPaperclip, FaChevronDown, FaChevronUp, FaPhone, FaLinkedin,
  FaMapMarkerAlt, FaBriefcase, FaPlus, FaExternalLinkAlt, FaClock,
  FaDollarSign, FaHandshake, FaTag
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

/**
 * MobileContextPanel - Contextual actions panel embedded in detail views
 * 
 * Replaces the desktop's right panel with an integrated mobile-friendly layout.
 * Shows contact info, company info, and quick actions in collapsible sections.
 */
const MobileContextPanel = ({
  theme = 'dark',
  // Contact data
  contact,
  // Company data
  company,
  // Related data
  tasks = [],
  deals = [],
  notes = [],
  introductions = [],
  files = [],
  // Callbacks
  onSendEmail,
  onSendWhatsApp,
  onCreateTask,
  onCreateNote,
  onViewFiles,
  onViewContact,
  onViewCompany,
  onViewDeals,
  onViewIntroductions,
  // UI options
  showContact = true,
  showCompany = true,
  showQuickActions = true,
  showRelatedItems = true,
  defaultExpanded = ['quickActions'],
}) => {
  const [expandedSections, setExpandedSections] = useState(
    defaultExpanded.reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <Container theme={theme}>
      <PanelHeader theme={theme}>
        <PanelTitle theme={theme}>Context & Actions</PanelTitle>
      </PanelHeader>

      {/* Contact Section */}
      {showContact && contact && (
        <Section>
          <SectionHeader
            theme={theme}
            onClick={() => toggleSection('contact')}
          >
            <SectionLeft>
              <SectionIcon $color="#3B82F6">
                <FaUser size={12} />
              </SectionIcon>
              <SectionTitle theme={theme}>Contact</SectionTitle>
            </SectionLeft>
            <ChevronIcon theme={theme}>
              {expandedSections.contact ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </ChevronIcon>
          </SectionHeader>

          {expandedSections.contact && (
            <SectionContent theme={theme}>
              <ContactCard theme={theme} onClick={onViewContact}>
                <ContactAvatar theme={theme}>
                  {contact.profile_image_url ? (
                    <AvatarImage src={contact.profile_image_url} alt="" />
                  ) : (
                    getInitials(contact.first_name, contact.last_name)
                  )}
                </ContactAvatar>
                <ContactInfo>
                  <ContactName theme={theme}>
                    {contact.first_name} {contact.last_name}
                  </ContactName>
                  {contact.job_role && (
                    <ContactRole theme={theme}>
                      <FaBriefcase size={10} />
                      {contact.job_role}
                    </ContactRole>
                  )}
                  {contact.category && contact.category !== 'Inbox' && (
                    <CategoryBadge theme={theme}>{contact.category}</CategoryBadge>
                  )}
                </ContactInfo>
                <FaChevronDown size={12} style={{ opacity: 0.5 }} />
              </ContactCard>

              {/* Contact Details */}
              <ContactDetails theme={theme}>
                {contact.email && (
                  <DetailRow theme={theme}>
                    <FaEnvelope size={12} />
                    <DetailText theme={theme}>{contact.email}</DetailText>
                  </DetailRow>
                )}
                {contact.phone && (
                  <DetailRow theme={theme}>
                    <FaPhone size={12} />
                    <DetailText theme={theme}>{contact.phone}</DetailText>
                  </DetailRow>
                )}
                {contact.linkedin && (
                  <DetailRow theme={theme}>
                    <FaLinkedin size={12} />
                    <DetailLink 
                      href={contact.linkedin} 
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      LinkedIn Profile
                    </DetailLink>
                  </DetailRow>
                )}
                {contact.city && (
                  <DetailRow theme={theme}>
                    <FaMapMarkerAlt size={12} />
                    <DetailText theme={theme}>{contact.city}</DetailText>
                  </DetailRow>
                )}
                {contact.last_interaction_at && (
                  <DetailRow theme={theme}>
                    <FaClock size={12} />
                    <DetailText theme={theme}>
                      Last interaction: {formatDate(contact.last_interaction_at)}
                    </DetailText>
                  </DetailRow>
                )}
              </ContactDetails>

              {/* Contact Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <TagsContainer>
                  {contact.tags.slice(0, 5).map((tag, idx) => (
                    <Tag key={idx} theme={theme}>
                      <FaTag size={8} />
                      {tag.name || tag}
                    </Tag>
                  ))}
                  {contact.tags.length > 5 && (
                    <Tag theme={theme}>+{contact.tags.length - 5}</Tag>
                  )}
                </TagsContainer>
              )}
            </SectionContent>
          )}
        </Section>
      )}

      {/* Company Section */}
      {showCompany && company && (
        <Section>
          <SectionHeader
            theme={theme}
            onClick={() => toggleSection('company')}
          >
            <SectionLeft>
              <SectionIcon $color="#8B5CF6">
                <FaBuilding size={12} />
              </SectionIcon>
              <SectionTitle theme={theme}>Company</SectionTitle>
            </SectionLeft>
            <ChevronIcon theme={theme}>
              {expandedSections.company ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </ChevronIcon>
          </SectionHeader>

          {expandedSections.company && (
            <SectionContent theme={theme}>
              <CompanyCard theme={theme} onClick={onViewCompany}>
                <CompanyIcon theme={theme}>
                  <FaBuilding size={16} />
                </CompanyIcon>
                <CompanyInfo>
                  <CompanyName theme={theme}>{company.name}</CompanyName>
                  {company.category && company.category !== 'Inbox' && (
                    <CompanyCategory theme={theme}>{company.category}</CompanyCategory>
                  )}
                </CompanyInfo>
                <FaChevronDown size={12} style={{ opacity: 0.5 }} />
              </CompanyCard>

              {company.website && (
                <DetailRow theme={theme}>
                  <FaExternalLinkAlt size={12} />
                  <DetailLink 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {company.website}
                  </DetailLink>
                </DetailRow>
              )}
              {company.linkedin && (
                <DetailRow theme={theme}>
                  <FaLinkedin size={12} />
                  <DetailLink 
                    href={company.linkedin} 
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    LinkedIn
                  </DetailLink>
                </DetailRow>
              )}
              {company.description && (
                <CompanyDescription theme={theme}>
                  {company.description.length > 150 
                    ? company.description.substring(0, 150) + '...' 
                    : company.description}
                </CompanyDescription>
              )}
            </SectionContent>
          )}
        </Section>
      )}

      {/* Quick Actions Section */}
      {showQuickActions && (
        <Section>
          <SectionHeader
            theme={theme}
            onClick={() => toggleSection('quickActions')}
          >
            <SectionLeft>
              <SectionIcon $color="#10B981">
                <FaPlus size={12} />
              </SectionIcon>
              <SectionTitle theme={theme}>Quick Actions</SectionTitle>
            </SectionLeft>
            <ChevronIcon theme={theme}>
              {expandedSections.quickActions ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </ChevronIcon>
          </SectionHeader>

          {expandedSections.quickActions && (
            <SectionContent theme={theme}>
              <ActionsGrid>
                {onSendEmail && (
                  <ActionButton theme={theme} onClick={onSendEmail}>
                    <ActionIcon $color="#3B82F6">
                      <FaEnvelope size={16} />
                    </ActionIcon>
                    <ActionLabel theme={theme}>Send Email</ActionLabel>
                  </ActionButton>
                )}
                {onSendWhatsApp && (
                  <ActionButton theme={theme} onClick={onSendWhatsApp}>
                    <ActionIcon $color="#25D366">
                      <FaWhatsapp size={16} />
                    </ActionIcon>
                    <ActionLabel theme={theme}>WhatsApp</ActionLabel>
                  </ActionButton>
                )}
                {onCreateTask && (
                  <ActionButton theme={theme} onClick={onCreateTask}>
                    <ActionIcon $color="#F59E0B">
                      <FaTasks size={16} />
                    </ActionIcon>
                    <ActionLabel theme={theme}>Add Task</ActionLabel>
                  </ActionButton>
                )}
                {onCreateNote && (
                  <ActionButton theme={theme} onClick={onCreateNote}>
                    <ActionIcon $color="#8B5CF6">
                      <FaStickyNote size={16} />
                    </ActionIcon>
                    <ActionLabel theme={theme}>Add Note</ActionLabel>
                  </ActionButton>
                )}
                {onViewFiles && files.length > 0 && (
                  <ActionButton theme={theme} onClick={onViewFiles}>
                    <ActionIcon $color="#EC4899">
                      <FaPaperclip size={16} />
                    </ActionIcon>
                    <ActionLabel theme={theme}>
                      Files ({files.length})
                    </ActionLabel>
                  </ActionButton>
                )}
              </ActionsGrid>
            </SectionContent>
          )}
        </Section>
      )}

      {/* Related Items Section */}
      {showRelatedItems && (tasks.length > 0 || deals.length > 0 || introductions.length > 0 || notes.length > 0) && (
        <Section>
          <SectionHeader
            theme={theme}
            onClick={() => toggleSection('related')}
          >
            <SectionLeft>
              <SectionIcon $color="#F59E0B">
                <FaTag size={12} />
              </SectionIcon>
              <SectionTitle theme={theme}>Related</SectionTitle>
            </SectionLeft>
            <ChevronIcon theme={theme}>
              {expandedSections.related ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </ChevronIcon>
          </SectionHeader>

          {expandedSections.related && (
            <SectionContent theme={theme}>
              <RelatedItems>
                {/* Tasks Preview */}
                {tasks.length > 0 && (
                  <RelatedItem theme={theme}>
                    <RelatedIcon $color="#F59E0B">
                      <FaTasks size={12} />
                    </RelatedIcon>
                    <RelatedInfo>
                      <RelatedCount theme={theme}>{tasks.length} Tasks</RelatedCount>
                      <RelatedPreview theme={theme}>
                        {tasks[0]?.content?.substring(0, 30)}...
                      </RelatedPreview>
                    </RelatedInfo>
                  </RelatedItem>
                )}

                {/* Deals Preview */}
                {deals.length > 0 && (
                  <RelatedItem theme={theme} onClick={onViewDeals}>
                    <RelatedIcon $color="#10B981">
                      <FaDollarSign size={12} />
                    </RelatedIcon>
                    <RelatedInfo>
                      <RelatedCount theme={theme}>{deals.length} Deals</RelatedCount>
                      <RelatedPreview theme={theme}>
                        {deals[0]?.opportunity?.substring(0, 30)}...
                      </RelatedPreview>
                    </RelatedInfo>
                  </RelatedItem>
                )}

                {/* Introductions Preview */}
                {introductions.length > 0 && (
                  <RelatedItem theme={theme} onClick={onViewIntroductions}>
                    <RelatedIcon $color="#EC4899">
                      <FaHandshake size={12} />
                    </RelatedIcon>
                    <RelatedInfo>
                      <RelatedCount theme={theme}>{introductions.length} Introductions</RelatedCount>
                      <RelatedPreview theme={theme}>
                        {introductions[0]?.status}
                      </RelatedPreview>
                    </RelatedInfo>
                  </RelatedItem>
                )}

                {/* Notes Preview */}
                {notes.length > 0 && (
                  <RelatedItem theme={theme}>
                    <RelatedIcon $color="#8B5CF6">
                      <FaStickyNote size={12} />
                    </RelatedIcon>
                    <RelatedInfo>
                      <RelatedCount theme={theme}>{notes.length} Notes</RelatedCount>
                      <RelatedPreview theme={theme}>
                        {notes[0]?.title?.substring(0, 30)}...
                      </RelatedPreview>
                    </RelatedInfo>
                  </RelatedItem>
                )}
              </RelatedItems>
            </SectionContent>
          )}
        </Section>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#0F172A'};
  border-top: 4px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
`;

const PanelHeader = styled.div`
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const PanelTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Section = styled.div`
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
`;

const SectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: none;
  cursor: pointer;
  min-height: 48px;
`;

const SectionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ChevronIcon = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SectionContent = styled.div`
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
`;

// Contact Styles
const ContactCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 12px;

  &:active {
    opacity: 0.9;
  }
`;

const ContactAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A5F'};
  color: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  flex-shrink: 0;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ContactRole = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A5F'};
  color: #3B82F6;
  margin-top: 4px;
`;

const ContactDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const DetailText = styled.span`
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const DetailLink = styled.a`
  color: #3B82F6;
  text-decoration: none;

  &:active {
    opacity: 0.8;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

// Company Styles
const CompanyCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 12px;

  &:active {
    opacity: 0.9;
  }
`;

const CompanyIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.theme === 'light' ? '#EDE9FE' : '#2E1065'};
  color: #8B5CF6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const CompanyInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CompanyName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const CompanyCategory = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const CompanyDescription = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  line-height: 1.5;
  margin-top: 8px;
`;

// Quick Actions Styles
const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 12px;
  border: none;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  cursor: pointer;
  min-height: 80px;

  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
`;

const ActionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  text-align: center;
`;

// Related Items Styles
const RelatedItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RelatedItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  border-radius: 10px;
  cursor: pointer;

  &:active {
    opacity: 0.9;
  }
`;

const RelatedIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const RelatedInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RelatedCount = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const RelatedPreview = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default MobileContextPanel;
