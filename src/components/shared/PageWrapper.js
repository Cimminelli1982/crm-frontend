import React, { useState } from 'react';
import { FaSync } from 'react-icons/fa';
import ContactsListDRY from '../ContactsListDRY';
import {
  PageContainer,
  PageView,
  PageHeader,
  HeaderContent,
  HeaderText,
  PageTitle,
  PageSubtitle,
  RefreshButton,
  FilterTabs,
  FilterTab,
  ContentArea,
  SubMenu,
  SubTab
} from './PageLayout';

/**
 * PageWrapper - A unified component for common page patterns
 *
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle
 * @param {string} props.theme - Theme (light/dark)
 * @param {Array} props.tabs - Main filter tabs [{key, label}]
 * @param {Object} props.subTabs - Sub tabs by main tab {tabKey: [{key, label}]}
 * @param {string} props.activeTab - Currently active main tab
 * @param {string} props.activeSubTab - Currently active sub tab
 * @param {Function} props.onTabChange - Handler for main tab changes
 * @param {Function} props.onSubTabChange - Handler for sub tab changes
 * @param {Function} props.getDataSource - Function to get data source config
 * @param {Function} props.onDataLoad - Handler for when data loads
 * @param {Object} props.emptyStateConfig - Empty state configuration
 * @param {string} props.pageContext - Page context for ContactsListDRY
 * @param {Object} props.keepInTouchConfig - Keep in touch specific config
 * @param {string} props.filterCategory - Filter category for special behaviors
 * @param {Function} props.onContactClick - Custom contact click handler
 * @param {ReactNode} props.children - Optional additional content
 * @param {ReactNode} props.headerExtra - Optional extra header content
 */
const PageWrapper = ({
  title,
  subtitle,
  theme,
  tabs = [],
  subTabs = {},
  activeTab,
  activeSubTab,
  onTabChange,
  onSubTabChange,
  getDataSource,
  onDataLoad,
  emptyStateConfig,
  pageContext,
  keepInTouchConfig,
  filterCategory,
  onContactClick,
  children,
  headerExtra
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleContactUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const currentSubTabs = subTabs[activeTab] || [];

  return (
    <PageContainer theme={theme}>
      <PageView>
        <PageHeader theme={theme}>
          <HeaderContent>
            <HeaderText>
              <PageTitle theme={theme}>{title}</PageTitle>
              <PageSubtitle theme={theme}>{subtitle}</PageSubtitle>
            </HeaderText>
            <RefreshButton
              theme={theme}
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              $isRefreshing={isRefreshing}
            >
              <FaSync />
            </RefreshButton>
          </HeaderContent>

          {tabs.length > 0 && (
            <FilterTabs theme={theme}>
              {tabs.map(tab => (
                <FilterTab
                  key={tab.key}
                  theme={theme}
                  $active={activeTab === tab.key}
                  onClick={() => onTabChange(tab.key)}
                >
                  {tab.label}
                </FilterTab>
              ))}
            </FilterTabs>
          )}

          {headerExtra}
        </PageHeader>

        {currentSubTabs.length > 0 && (
          <SubMenu theme={theme}>
            {currentSubTabs.map(subTab => (
              <SubTab
                key={subTab.key}
                theme={theme}
                $active={activeSubTab === subTab.key}
                onClick={() => onSubTabChange(subTab.key)}
              >
                {subTab.label}
                {subTab.count !== undefined && (
                  <span style={{
                    marginLeft: '6px',
                    fontSize: '12px',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF'
                  }}>
                    ({subTab.count})
                  </span>
                )}
                {subTab.hasIndicator && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#3B82F6',
                    borderRadius: '50%'
                  }} />
                )}
              </SubTab>
            ))}
          </SubMenu>
        )}

        <ContentArea>
          {children || (
            <ContactsListDRY
              dataSource={getDataSource()}
              refreshTrigger={refreshTrigger}
              theme={theme}
              emptyStateConfig={emptyStateConfig}
              onDataLoad={onDataLoad}
              onContactUpdate={handleContactUpdate}
              onContactClick={onContactClick}
              showActions={true}
              pageContext={pageContext}
              keepInTouchConfig={keepInTouchConfig}
              filterCategory={filterCategory}
              badgeType={pageContext === 'interactions' ? 'category' : 'time'}
            />
          )}
        </ContentArea>
      </PageView>
    </PageContainer>
  );
};

export default PageWrapper;