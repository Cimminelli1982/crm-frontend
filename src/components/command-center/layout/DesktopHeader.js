import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Header,
  TabsContainer,
  Tab,
  Badge,
  UnreadDot,
} from '../../../pages/CommandCenterPage.styles';

const DesktopHeader = ({ theme, tabs, activeTab, setActiveTab }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const triggerRefs = useRef({});
  const isDark = theme === 'dark';

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);

  useEffect(() => {
    if (!openDropdown) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          !triggerRefs.current[openDropdown]?.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown, closeDropdown]);

  const handleDropdownToggle = (tabId) => {
    if (openDropdown === tabId) {
      closeDropdown();
      return;
    }
    const el = triggerRefs.current[tabId];
    if (el) {
      const rect = el.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 2, left: rect.left });
    }
    setOpenDropdown(tabId);
  };

  return (
    <Header theme={theme}>
      <TabsContainer>
        {tabs.map(tab => {
          if (tab.subTabs) {
            const isActive = tab.subTabs.some(st => st.id === activeTab);
            return (
              <div key={tab.id} ref={el => triggerRefs.current[tab.id] = el} style={{ position: 'relative' }}>
                <Tab
                  theme={theme}
                  $active={isActive}
                  onClick={() => handleDropdownToggle(tab.id)}
                >
                  <tab.icon />
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge theme={theme} $active={isActive}>
                      {tab.count}
                    </Badge>
                  )}
                  {tab.hasUnread && <UnreadDot $active={isActive} />}
                </Tab>
              </div>
            );
          }

          return (
            <Tab
              key={tab.id}
              theme={theme}
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              {tab.label}
              {tab.count > 0 && (
                <Badge theme={theme} $active={activeTab === tab.id}>
                  {tab.count}
                </Badge>
              )}
              {tab.hasUnread && <UnreadDot $active={activeTab === tab.id} />}
            </Tab>
          );
        })}
      </TabsContainer>

      {/* Dropdown portal — rendered outside TabsContainer to avoid overflow clip */}
      {openDropdown && (() => {
        const parentTab = tabs.find(t => t.id === openDropdown);
        if (!parentTab?.subTabs) return null;
        return (
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 9999,
              background: isDark ? '#1e1e1e' : '#fff',
              border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: 160,
              padding: '4px 0',
            }}
          >
            {parentTab.subTabs.map(st => (
              <div
                key={st.id}
                onClick={() => { setActiveTab(st.id); closeDropdown(); }}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  color: activeTab === st.id
                    ? (isDark ? '#a78bfa' : '#7c3aed')
                    : (isDark ? '#ccc' : '#555'),
                  fontWeight: activeTab === st.id ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: activeTab === st.id
                    ? (isDark ? '#2a2a3a' : '#f3f0ff')
                    : 'transparent',
                }}
                onMouseEnter={e => {
                  if (activeTab !== st.id) e.currentTarget.style.background = isDark ? '#252525' : '#f5f5f5';
                }}
                onMouseLeave={e => {
                  if (activeTab !== st.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                {st.label}
                {st.count > 0 && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: isDark ? '#333' : '#e8e8e8',
                    color: isDark ? '#aaa' : '#666',
                    padding: '1px 6px',
                    borderRadius: 8,
                  }}>
                    {st.count}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })()}
    </Header>
  );
};

export default DesktopHeader;
