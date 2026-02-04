import React, { useState } from 'react';
import styled from 'styled-components';
import { FaHandshake, FaChevronDown, FaChevronRight, FaPlus, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import { format } from 'date-fns';

// Status colors
const STATUS_COLORS = {
  'Requested': { bg: '#FEE2E2', color: '#DC2626' },
  'Promised': { bg: '#FEF3C7', color: '#D97706' },
  'Done & Dust': { bg: '#D1FAE5', color: '#059669' },
  'Done, but need to monitor': { bg: '#FED7AA', color: '#C2410C' },
  'Aborted': { bg: '#E5E7EB', color: '#6B7280' },
};

// Tool icons
const TOOL_ICONS = {
  'email': FaEnvelope,
  'whatsapp': FaWhatsapp,
  'in person': FaHandshake,
};

/**
 * MobileIntroductionsView - Introductions list optimized for mobile
 * Shows introductions grouped by status with badges
 */
const MobileIntroductionsView = ({
  introductions = [],
  onIntroductionSelect,
  onCreateIntroduction,
  theme = 'dark',
}) => {
  // Group by status
  const [expandedSections, setExpandedSections] = useState({
    promised: true,
    monitor: true,
    done: false,
    aborted: false,
  });

  // Group introductions by status
  const groupByStatus = () => {
    const promised = []; // Requested + Promised
    const monitor = [];  // Done, but need to monitor
    const done = [];     // Done & Dust
    const aborted = [];  // Aborted

    introductions.forEach(intro => {
      const status = intro.status || 'Requested';
      if (status === 'Promised' || status === 'Requested') {
        promised.push(intro);
      } else if (status === 'Done, but need to monitor') {
        monitor.push(intro);
      } else if (status === 'Done & Dust') {
        done.push(intro);
      } else if (status === 'Aborted') {
        aborted.push(intro);
      } else {
        promised.push(intro);
      }
    });

    return { promised, monitor, done, aborted };
  };

  const groups = groupByStatus();

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return '';
    }
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || { bg: '#F3F4F6', color: '#6B7280' };
  };

  const getToolIcon = (tool) => {
    return TOOL_ICONS[tool?.toLowerCase()] || FaHandshake;
  };

  const getIntroduceeNames = (intro) => {
    if (intro.contacts && intro.contacts.length > 0) {
      const introducees = intro.contacts.filter(c => c.role === 'introducee');
      if (introducees.length > 0) {
        return introducees.map(c => c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()).join(' ↔ ');
      }
      return intro.contacts.map(c => c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()).join(' ↔ ');
    }
    return 'Unknown contacts';
  };

  const renderIntroductionItem = (intro) => {
    const statusColor = getStatusColor(intro.status);
    const ToolIcon = getToolIcon(intro.introduction_tool);

    return (
      <IntroItem
        key={intro.introduction_id}
        theme={theme}
        onClick={() => onIntroductionSelect?.(intro)}
      >
        <IntroIcon theme={theme}>
          <FaHandshake size={16} />
        </IntroIcon>

        <IntroContent>
          <IntroHeader>
            <IntroNames theme={theme}>
              {getIntroduceeNames(intro)}
            </IntroNames>
            <StatusBadge $bg={statusColor.bg} $color={statusColor.color}>
              {intro.status || 'Requested'}
            </StatusBadge>
          </IntroHeader>

          <IntroMeta theme={theme}>
            <ToolIcon size={11} />
            <span>{intro.introduction_tool || 'Not specified'}</span>
            {intro.introduction_date && (
              <>
                <span>•</span>
                <span>{formatDate(intro.introduction_date)}</span>
              </>
            )}
          </IntroMeta>

          {intro.category && (
            <CategoryBadge theme={theme}>{intro.category}</CategoryBadge>
          )}

          {intro.text && (
            <IntroNotes theme={theme}>
              "{intro.text.length > 60 ? intro.text.substring(0, 60) + '...' : intro.text}"
            </IntroNotes>
          )}
        </IntroContent>
      </IntroItem>
    );
  };

  const renderSection = (title, intros, sectionKey, color) => {
    if (intros.length === 0) return null;

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
            <SectionCount theme={theme}>{intros.length}</SectionCount>
          </SectionLeft>
          <ChevronIcon theme={theme}>
            {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
          </ChevronIcon>
        </SectionHeader>
        {isExpanded && (
          <SectionContent>
            {intros.map(renderIntroductionItem)}
          </SectionContent>
        )}
      </Section>
    );
  };

  if (introductions.length === 0) {
    return (
      <EmptyContainer>
        {onCreateIntroduction && (
          <HeaderActions theme={theme}>
            <ActionButton theme={theme} $primary onClick={onCreateIntroduction}>
              <FaPlus size={14} />
              <span>New Introduction</span>
            </ActionButton>
          </HeaderActions>
        )}
        <EmptyState theme={theme}>
          <FaHandshake size={48} style={{ opacity: 0.3, color: '#F59E0B' }} />
          <EmptyTitle theme={theme}>No introductions</EmptyTitle>
          <EmptyText theme={theme}>Start connecting people!</EmptyText>
        </EmptyState>
      </EmptyContainer>
    );
  }

  return (
    <Container>
      {/* Header Actions */}
      {onCreateIntroduction && (
        <HeaderActions theme={theme}>
          <ActionButton theme={theme} $primary onClick={onCreateIntroduction}>
            <FaPlus size={14} />
            <span>New Introduction</span>
          </ActionButton>
        </HeaderActions>
      )}

      <IntrosList>
        {renderSection('Promised', groups.promised, 'promised', '#F59E0B')}
        {renderSection('Monitor', groups.monitor, 'monitor', '#F97316')}
        {renderSection('Done & Dust', groups.done, 'done', '#10B981')}
        {renderSection('Aborted', groups.aborted, 'aborted', '#6B7280')}
      </IntrosList>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  background: ${props => props.$primary ? '#F59E0B' : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  color: ${props => props.$primary ? '#FFFFFF' : (props.theme === 'light' ? '#374151' : '#D1D5DB')};

  &:active {
    opacity: 0.9;
  }
`;

const IntrosList = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const Section = styled.div`
  margin-bottom: 4px;
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

const IntroItem = styled.div`
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

const IntroIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#78350F'};
  color: #F59E0B;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const IntroContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const IntroHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
`;

const IntroNames = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  flex: 1;
`;

const StatusBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  background: ${props => props.$bg};
  color: ${props => props.$color};
  white-space: nowrap;
`;

const IntroMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 4px;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  margin-bottom: 4px;
`;

const IntroNotes = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  font-style: italic;
  margin-top: 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex: 1;
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

export default MobileIntroductionsView;
