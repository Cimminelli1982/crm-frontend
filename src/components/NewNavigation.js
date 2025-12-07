import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FiLayers,
  FiClock,
  FiSearch,
  FiBell,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCommand
} from 'react-icons/fi';
import Logo from './Logo';

const NewNavigation = ({
  currentPage = 'sort',
  onNavigate,
  theme = 'light',
  onThemeToggle,
  onCollapseChange,
  initialCollapsed = false,
  inboxCount = 0,
  keepInTouchCount = 0
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'command-center',
      label: 'Command Center',
      icon: FiCommand,
      path: '/command-center',
      description: 'Email, WhatsApp & Calendar hub'
    },
    {
      id: 'sort',
      label: 'Sort',
      icon: FiLayers,
      path: '/sort',
      description: 'Manage and organize your contacts',
      count: inboxCount,
      isInbox: true
    },
    {
      id: 'interactions',
      label: 'Interactions',
      icon: FiClock,
      path: '/interactions',
      description: 'Recent contact activity'
    },
    {
      id: 'search',
      label: 'Search',
      icon: FiSearch,
      path: '/search',
      description: 'Find contacts by name, company, or details'
    },
    {
      id: 'keep-in-touch',
      label: 'Keep in Touch',
      icon: FiBell,
      path: '/keep-in-touch',
      description: 'Follow-up reminders',
      count: keepInTouchCount
    }
  ];

  const handleNavigation = (item) => {
    if (onNavigate) {
      onNavigate(item.id, item.path);
    }
    // Close mobile menu after navigation
    setIsMobileMenuOpen(false);
  };

  const handleCollapseToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);

    // Notify parent component
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    }

    // Dispatch event for backward compatibility
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('navCollapseChange', {
        detail: { collapsed: newCollapsed }
      }));
    }
  };

  // Sync with initial collapsed state
  useEffect(() => {
    setIsCollapsed(initialCollapsed);
  }, [initialCollapsed]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-nav-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavContainer theme={theme} className="mobile-nav-container">
        <MobileNavOverlay
          $isOpen={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <MobileNavBar theme={theme}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <MobileNavItem
                key={item.id}
                theme={theme}
                $isActive={isActive}
                onClick={() => handleNavigation(item)}
              >
                <MobileNavIconContainer>
                  <MobileNavIcon theme={theme} $isActive={isActive}>
                    <Icon size={20} />
                  </MobileNavIcon>
                  {item.count > 0 && (
                    <CountBadge theme={theme} $isActive={isActive} $isInbox={item.isInbox}>
                      {item.count}
                    </CountBadge>
                  )}
                </MobileNavIconContainer>
                <MobileNavLabel theme={theme} $isActive={isActive}>
                  {item.label}
                </MobileNavLabel>
              </MobileNavItem>
            );
          })}
        </MobileNavBar>
      </MobileNavContainer>

      {/* Tablet Navigation */}
      <TabletNavContainer theme={theme}>
        <TabletNavHeader theme={theme}>
          <Logo
            isCollapsed={false}
            size="60px"
          />
          <CollapseButton
            theme={theme}
            onClick={handleCollapseToggle}
          >
            {isCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </CollapseButton>
        </TabletNavHeader>

        <TabletNavContent>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <TabletNavItem
                key={item.id}
                theme={theme}
                $isActive={isActive}
                $isCollapsed={isCollapsed}
                onClick={() => handleNavigation(item)}
                title={isCollapsed ? item.description : ''}
              >
                <TabletNavIconContainer>
                  <TabletNavIcon theme={theme} $isActive={isActive}>
                    <Icon size={22} />
                  </TabletNavIcon>
                  {item.count > 0 && (
                    <CountBadge theme={theme} $isActive={isActive} $isInbox={item.isInbox}>
                      {item.count}
                    </CountBadge>
                  )}
                </TabletNavIconContainer>
                {!isCollapsed && (
                  <TabletNavText>
                    <TabletNavLabel theme={theme} $isActive={isActive}>
                      {item.label}
                    </TabletNavLabel>
                    <TabletNavDescription theme={theme}>
                      {item.description}
                    </TabletNavDescription>
                  </TabletNavText>
                )}
              </TabletNavItem>
            );
          })}
        </TabletNavContent>
      </TabletNavContainer>

      {/* Desktop Navigation */}
      <DesktopNavContainer theme={theme} $isCollapsed={isCollapsed}>
        <DesktopNavHeader theme={theme} $isCollapsed={isCollapsed}>
          <Logo
            isCollapsed={isCollapsed}
            size={isCollapsed ? "24px" : "80px"}
          />
          <CollapseButton
            theme={theme}
            onClick={handleCollapseToggle}
            $isCollapsed={isCollapsed}
          >
            {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </CollapseButton>
        </DesktopNavHeader>

        <DesktopNavContent>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <DesktopNavItem
                key={item.id}
                theme={theme}
                $isActive={isActive}
                $isCollapsed={isCollapsed}
                onClick={() => handleNavigation(item)}
                title={isCollapsed ? `${item.label} - ${item.description}` : ''}
              >
                <DesktopNavIconContainer>
                  <DesktopNavIcon theme={theme} $isActive={isActive}>
                    <Icon size={20} />
                  </DesktopNavIcon>
                  {item.count > 0 && isCollapsed && (
                    <CountBadge theme={theme} $isActive={isActive}>
                      {item.count}
                    </CountBadge>
                  )}
                </DesktopNavIconContainer>
                {!isCollapsed && (
                  <DesktopNavText>
                    <DesktopNavLabel theme={theme} $isActive={isActive}>
                      {item.label}
                    </DesktopNavLabel>
                    <DesktopNavDescription theme={theme}>
                      {item.description}
                    </DesktopNavDescription>
                  </DesktopNavText>
                )}
              </DesktopNavItem>
            );
          })}
        </DesktopNavContent>

        <DesktopNavFooter theme={theme}>
          {!isCollapsed && (
            <ThemeToggle theme={theme} onClick={onThemeToggle}>
              {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'} Mode
            </ThemeToggle>
          )}
        </DesktopNavFooter>
      </DesktopNavContainer>
    </>
  );
};

// Mobile Styles (< 768px)
const MobileNavContainer = styled.div`
  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileNavOverlay = styled.div`
  display: ${props => props.$isOpen ? 'block' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
`;

const MobileNavBar = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 16px 20px 16px;
  z-index: 999;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
`;

const MobileNavItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 80px;

  ${props => props.$isActive && `
    background: ${props.theme === 'light'
      ? 'rgba(59, 130, 246, 0.1)'
      : 'rgba(96, 165, 250, 0.15)'
    };
  `}

  &:active {
    transform: scale(0.95);
  }
`;

const MobileNavIcon = styled.div`
  color: ${props => {
    if (props.$isActive) {
      return (props.theme === 'light' ? '#3B82F6' : '#60A5FA');
    }
    return props.theme === 'light' ? '#6B7280' : '#9CA3AF';
  }};
  transition: all 0.2s ease;
`;

const MobileNavLabel = styled.span`
  font-size: 11px;
  font-weight: ${props => props.$isActive ? '600' : '500'};
  color: ${props => {
    if (props.$isActive) {
      return (props.theme === 'light' ? '#3B82F6' : '#60A5FA');
    }
    return props.theme === 'light' ? '#6B7280' : '#9CA3AF';
  }};
  text-align: center;
  line-height: 1.2;
`;

// Tablet Styles (768px - 1024px)
const TabletNavContainer = styled.nav`
  display: none;

  @media (min-width: 768px) and (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    border-right: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
    z-index: 100;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  }
`;

const TabletNavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  min-height: 100px;
`;

const TabletNavContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`;

const TabletNavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  text-align: left;

  ${props => props.$isActive && `
    background: ${props.theme === 'light'
      ? 'rgba(59, 130, 246, 0.1)'
      : 'rgba(96, 165, 250, 0.15)'
    };
  `}

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    ${props => props.$isActive && `
      background: ${props.theme === 'light'
        ? 'rgba(59, 130, 246, 0.15)'
        : 'rgba(96, 165, 250, 0.2)'
      };
    `}
  }
`;

const TabletNavIcon = styled.div`
  color: ${props => {
    if (props.$isActive) {
      return (props.theme === 'light' ? '#3B82F6' : '#60A5FA');
    }
    return props.theme === 'light' ? '#6B7280' : '#9CA3AF';
  }};
  transition: all 0.2s ease;
  flex-shrink: 0;
`;

const TabletNavText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const TabletNavLabel = styled.span`
  font-size: 15px;
  font-weight: ${props => props.$isActive ? '600' : '500'};
  color: ${props => {
    if (props.$isActive) {
      return (props.theme === 'light' ? '#3B82F6' : '#60A5FA');
    }
    return props.theme === 'light' ? '#111827' : '#F9FAFB';
  }};
`;

const TabletNavDescription = styled.span`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

// Desktop Styles (> 1024px)
const DesktopNavContainer = styled.nav`
  display: none;

  @media (min-width: 1025px) {
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.$isCollapsed ? '80px' : '320px'};
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    border-right: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
    transition: width 0.3s ease;
    z-index: 100;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  }
`;

const DesktopNavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  min-height: 120px;
`;

const DesktopNavContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const DesktopNavFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const DesktopNavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: ${props => props.$isCollapsed ? '16px' : '18px'};
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 6px;
  text-align: left;
  position: relative;
  justify-content: ${props => props.$isCollapsed ? 'center' : 'flex-start'};

  ${props => props.$isActive && `
    background: ${props.theme === 'light'
      ? 'rgba(59, 130, 246, 0.1)'
      : 'rgba(96, 165, 250, 0.15)'
    };
    border: 1px solid ${props.theme === 'light'
      ? 'rgba(59, 130, 246, 0.2)'
      : 'rgba(96, 165, 250, 0.3)'
    };
  `}

  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
    transform: translateX(2px);

    ${props => props.$isActive && `
      background: ${props.theme === 'light'
        ? 'rgba(59, 130, 246, 0.15)'
        : 'rgba(96, 165, 250, 0.2)'
      };
    `}
  }
`;

const DesktopNavIcon = styled.div`
  color: ${props => {
    if (props.$isActive) {
      return (props.theme === 'light' ? '#3B82F6' : '#60A5FA');
    }
    return props.theme === 'light' ? '#6B7280' : '#9CA3AF';
  }};
  transition: all 0.2s ease;
  flex-shrink: 0;
`;

const DesktopNavText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
`;

const DesktopNavLabel = styled.span`
  font-size: 16px;
  font-weight: ${props => props.$isActive ? '600' : '500'};
  color: ${props => {
    if (props.$isActive) {
      return (props.theme === 'light' ? '#3B82F6' : '#60A5FA');
    }
    return props.theme === 'light' ? '#111827' : '#F9FAFB';
  }};
`;

const DesktopNavDescription = styled.span`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  line-height: 1.3;
`;

// Shared Components
const AppLogo = styled.div`
  font-size: ${props => props.$isCollapsed ? '18px' : '24px'};
  font-weight: 800;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  transition: all 0.3s ease;

  @media (min-width: 768px) and (max-width: 1024px) {
    font-size: 22px;
  }
`;

const CollapseButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  }

  @media (min-width: 768px) and (max-width: 1024px) {
    display: none;
  }
`;

const ThemeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#374151'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  }
`;

// Icon Containers for Count Badges
const MobileNavIconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TabletNavIconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DesktopNavIconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Count Badges
const CountBadge = styled.div`
  position: absolute;
  top: -6px;
  right: -6px;
  background: ${props =>
    props.$isInbox
      ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')  // Blue for inbox
      : (props.theme === 'light' ? '#EF4444' : '#F87171')   // Red for others
  };
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const CountBadgeInline = styled.span`
  background: ${props =>
    props.$isInbox
      ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')  // Blue for inbox
      : (props.theme === 'light' ? '#EF4444' : '#F87171')   // Red for others
  };
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export default NewNavigation;