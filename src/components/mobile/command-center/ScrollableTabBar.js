import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaEnvelope,
  FaWhatsapp,
  FaCalendar,
  FaTasks,
  FaDollarSign,
  FaUserCheck,
  FaHandshake,
  FaStickyNote,
  FaList,
} from 'react-icons/fa';

/**
 * Tab definitions with icons
 */
const TAB_ICONS = {
  email: FaEnvelope,
  whatsapp: FaWhatsapp,
  calendar: FaCalendar,
  tasks: FaTasks,
  deals: FaDollarSign,
  keepintouch: FaUserCheck,
  introductions: FaHandshake,
  notes: FaStickyNote,
  lists: FaList,
};

/**
 * ScrollableTabBar - Horizontal scrollable tab bar for mobile
 * Shows all 9 tabs with horizontal scroll (like Twitter/X)
 *
 * @param {Object} props
 * @param {Array} props.tabs - Array of tab objects { id, label, count, hasUnread }
 * @param {string} props.activeTab - Currently active tab id
 * @param {function} props.onTabChange - Callback when tab changes
 * @param {string} props.theme - 'light' or 'dark'
 */
const ScrollableTabBar = ({ tabs, activeTab, onTabChange, theme = 'dark' }) => {
  const scrollRef = useRef(null);
  const activeTabRef = useRef(null);

  // Scroll to center the active tab
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeElement = activeTabRef.current;

      const containerWidth = container.offsetWidth;
      const elementLeft = activeElement.offsetLeft;
      const elementWidth = activeElement.offsetWidth;

      // Center the active tab
      const scrollTo = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      container.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <Container theme={theme}>
      <ScrollContainer ref={scrollRef}>
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.id] || FaTasks;
          const isActive = activeTab === tab.id;

          return (
            <TabButton
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              theme={theme}
              $active={isActive}
              onClick={() => onTabChange(tab.id)}
            >
              <IconWrapper>
                <Icon size={18} />
                {tab.count > 0 && (
                  <CountBadge theme={theme} $active={isActive}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </CountBadge>
                )}
                {tab.hasUnread && !tab.count && (
                  <UnreadDot $active={isActive} />
                )}
              </IconWrapper>
              <TabLabel>{tab.label}</TabLabel>
            </TabButton>
          );
        })}
      </ScrollContainer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 8px 12px;
  gap: 4px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  min-width: fit-content;
  min-height: 60px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  background: ${props => props.$active
    ? (props.theme === 'light' ? '#3B82F6' : '#3B82F6')
    : 'transparent'
  };

  color: ${props => props.$active
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };

  &:active {
    transform: scale(0.95);
  }
`;

const IconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CountBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -10px;
  background: ${props => props.$active ? '#FFFFFF' : '#EF4444'};
  color: ${props => props.$active ? '#3B82F6' : '#FFFFFF'};
  font-size: 10px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
`;

const UnreadDot = styled.span`
  position: absolute;
  top: -2px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#FFFFFF' : '#3B82F6'};
`;

const TabLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
`;

export default ScrollableTabBar;
