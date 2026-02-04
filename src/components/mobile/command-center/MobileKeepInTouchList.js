import React, { useState } from 'react';
import styled from 'styled-components';
import { FaUserCheck, FaChevronDown, FaChevronRight, FaClock, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

// Urgency colors based on days overdue
const getUrgencyColor = (daysOverdue) => {
  if (daysOverdue <= 0) return { bg: '#D1FAE5', color: '#059669' }; // On time
  if (daysOverdue <= 7) return { bg: '#FEF3C7', color: '#D97706' }; // Slightly overdue
  if (daysOverdue <= 30) return { bg: '#FED7AA', color: '#C2410C' }; // Moderately overdue
  return { bg: '#FEE2E2', color: '#DC2626' }; // Very overdue
};

/**
 * MobileKeepInTouchList - Keep in Touch contacts optimized for mobile
 * Shows contacts overdue for follow-up with last interaction date
 */
const MobileKeepInTouchList = ({
  contacts = [],
  onContactSelect,
  onEmailContact,
  onWhatsAppContact,
  theme = 'dark',
}) => {
  // Group by urgency
  const [expandedSections, setExpandedSections] = useState({
    overdue: true,
    thisWeek: true,
    upcoming: false,
  });

  // Calculate days until next follow-up
  const calculateDaysUntil = (contact) => {
    if (!contact.last_interaction_at || !contact.keep_in_touch?.frequency) {
      return null;
    }

    const lastInteraction = new Date(contact.last_interaction_at);
    const today = new Date();
    const daysSince = differenceInDays(today, lastInteraction);

    // Convert frequency to days
    const frequencyDays = {
      'Weekly': 7,
      'Monthly': 30,
      'Quarterly': 90,
      'Twice per Year': 180,
      'Once per Year': 365,
    };

    const targetDays = frequencyDays[contact.keep_in_touch.frequency];
    if (!targetDays) return null;

    // Account for snooze
    const snoozeDays = contact.keep_in_touch.snooze_days || 0;
    const adjustedTargetDays = targetDays + snoozeDays;

    return adjustedTargetDays - daysSince;
  };

  // Categorize contacts
  const overdueContacts = [];
  const thisWeekContacts = [];
  const upcomingContacts = [];

  contacts.forEach(contact => {
    const daysUntil = calculateDaysUntil(contact);
    if (daysUntil === null) return;
    
    if (daysUntil < 0) {
      overdueContacts.push({ ...contact, daysUntil });
    } else if (daysUntil <= 7) {
      thisWeekContacts.push({ ...contact, daysUntil });
    } else {
      upcomingContacts.push({ ...contact, daysUntil });
    }
  });

  // Sort by urgency (most overdue first)
  overdueContacts.sort((a, b) => a.daysUntil - b.daysUntil);
  thisWeekContacts.sort((a, b) => a.daysUntil - b.daysUntil);
  upcomingContacts.sort((a, b) => a.daysUntil - b.daysUntil);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatLastInteraction = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getInitials = (contact) => {
    const first = contact.first_name?.charAt(0) || '';
    const last = contact.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const renderContactItem = (contact) => {
    const urgency = getUrgencyColor(Math.abs(contact.daysUntil || 0));

    return (
      <ContactItem
        key={contact.contact_id}
        theme={theme}
        onClick={() => onContactSelect?.(contact)}
      >
        <ContactAvatar theme={theme} $urgency={urgency}>
          {contact.profile_image_url ? (
            <AvatarImage src={contact.profile_image_url} alt="" />
          ) : (
            getInitials(contact)
          )}
        </ContactAvatar>

        <ContactContent>
          <ContactName theme={theme}>
            {contact.first_name} {contact.last_name}
          </ContactName>
          <ContactMeta theme={theme}>
            <FaClock size={10} />
            Last: {formatLastInteraction(contact.last_interaction_at)}
          </ContactMeta>
          <ContactFrequency theme={theme}>
            {contact.keep_in_touch?.frequency || 'No frequency set'}
            {contact.daysUntil !== null && (
              <DaysIndicator $overdue={contact.daysUntil < 0}>
                {contact.daysUntil < 0 
                  ? `${Math.abs(contact.daysUntil)} days overdue`
                  : contact.daysUntil === 0
                    ? 'Due today'
                    : `${contact.daysUntil} days left`
                }
              </DaysIndicator>
            )}
          </ContactFrequency>
          {contact.keep_in_touch?.why_keeping_in_touch && (
            <WhyText theme={theme}>
              {contact.keep_in_touch.why_keeping_in_touch.length > 50
                ? contact.keep_in_touch.why_keeping_in_touch.substring(0, 50) + '...'
                : contact.keep_in_touch.why_keeping_in_touch}
            </WhyText>
          )}
        </ContactContent>

        <QuickActionsColumn>
          {onEmailContact && (
            <QuickActionBtn
              theme={theme}
              onClick={(e) => {
                e.stopPropagation();
                onEmailContact(contact);
              }}
            >
              <FaEnvelope size={14} />
            </QuickActionBtn>
          )}
          {onWhatsAppContact && (
            <QuickActionBtn
              theme={theme}
              $whatsapp
              onClick={(e) => {
                e.stopPropagation();
                onWhatsAppContact(contact);
              }}
            >
              <FaWhatsapp size={14} />
            </QuickActionBtn>
          )}
        </QuickActionsColumn>
      </ContactItem>
    );
  };

  const renderSection = (title, contacts, sectionKey, color) => {
    if (contacts.length === 0) return null;

    const isExpanded = expandedSections[sectionKey];

    return (
      <Section key={sectionKey}>
        <SectionHeader
          theme={theme}
          onClick={() => toggleSection(sectionKey)}
        >
          <SectionLeft>
            <SectionIndicator $color={color} />
            <SectionTitle theme={theme}>{title}</SectionTitle>
            <SectionCount theme={theme}>{contacts.length}</SectionCount>
          </SectionLeft>
          <ChevronIcon theme={theme}>
            {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
          </ChevronIcon>
        </SectionHeader>
        {isExpanded && (
          <SectionContent>
            {contacts.map(renderContactItem)}
          </SectionContent>
        )}
      </Section>
    );
  };

  if (contacts.length === 0) {
    return (
      <EmptyState theme={theme}>
        <FaUserCheck size={48} style={{ opacity: 0.3 }} />
        <EmptyTitle theme={theme}>No contacts to follow up</EmptyTitle>
        <EmptyText theme={theme}>All caught up with your network!</EmptyText>
      </EmptyState>
    );
  }

  return (
    <Container>
      {renderSection('Overdue', overdueContacts, 'overdue', '#EF4444')}
      {renderSection('This Week', thisWeekContacts, 'thisWeek', '#F59E0B')}
      {renderSection('Upcoming', upcomingContacts, 'upcoming', '#10B981')}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 8px 0;
`;

const Section = styled.div`
  margin-bottom: 8px;
`;

const SectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border: none;
  cursor: pointer;
`;

const SectionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color};
`;

const SectionTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const SectionCount = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 2px 8px;
  border-radius: 10px;
`;

const ChevronIcon = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SectionContent = styled.div``;

const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  cursor: pointer;

  &:active {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  }
`;

const ContactAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: ${props => props.$urgency?.bg || '#E5E7EB'};
  color: ${props => props.$urgency?.color || '#6B7280'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ContactContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 4px;
`;

const ContactMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 4px;
`;

const ContactFrequency = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const DaysIndicator = styled.span`
  font-weight: 600;
  color: ${props => props.$overdue ? '#EF4444' : '#10B981'};
`;

const WhyText = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-style: italic;
  margin-top: 4px;
`;

const QuickActionsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const QuickActionBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: ${props => props.$whatsapp
    ? (props.theme === 'light' ? '#D1FAE5' : '#064E3B')
    : (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')};
  color: ${props => props.$whatsapp ? '#25D366' : '#3B82F6'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    opacity: 0.8;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  height: 100%;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 16px 0 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
`;

export default MobileKeepInTouchList;
