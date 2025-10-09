import React, { useState } from 'react';
import { FaSync } from 'react-icons/fa';
import ContactsListDRY from '../components/ContactsListDRY';
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
} from '../components/shared/PageLayout';

const InteractionsPage = ({ theme }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [timeFilter, setTimeFilter] = useState('Today'); // Today, This Week, This Month
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const interactionCategories = ['All', 'Founders', 'Investors', 'Family and Friends'];

  return (
    <PageContainer theme={theme}>
      <PageView>
        <PageHeader theme={theme}>
          <HeaderContent>
            <HeaderText>
              <PageTitle theme={theme}>Interactions</PageTitle>
              <PageSubtitle theme={theme}>
                View and manage all contact interactions
              </PageSubtitle>
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

          <FilterTabs theme={theme}>
            {interactionCategories.map(category => (
              <FilterTab
                key={category}
                theme={theme}
                $active={filterCategory === category}
                onClick={() => setFilterCategory(category)}
              >
                {category}
              </FilterTab>
            ))}
          </FilterTabs>
        </PageHeader>

        {/* Time Filter Submenu - in gray area below header */}
        {filterCategory === 'All' && (
          <SubMenu theme={theme}>
            <SubTab
              theme={theme}
              $active={timeFilter === 'Today'}
              onClick={() => setTimeFilter('Today')}
            >
              Today
            </SubTab>
            <SubTab
              theme={theme}
              $active={timeFilter === 'This Week'}
              onClick={() => setTimeFilter('This Week')}
            >
              This Week
            </SubTab>
            <SubTab
              theme={theme}
              $active={timeFilter === 'This Month'}
              onClick={() => setTimeFilter('This Month')}
            >
              This Month
            </SubTab>
          </SubMenu>
        )}

        <ContentArea>
          <ContactsListDRY
            dataSource={{
              type: 'interactions',
              timeFilter: filterCategory === 'All' ? timeFilter : 'Today',
              filterCategory: filterCategory
            }}
            refreshTrigger={refreshTrigger}
            theme={theme}
            emptyStateConfig={{
              icon: '🔄',
              title: 'No recent interactions',
              text: 'No contacts have had interactions in the last 30 days.'
            }}
            onContactUpdate={() => setRefreshTrigger(prev => prev + 1)}
            showActions={true}
            badgeType="category"
            pageContext="interactions"
          />
        </ContentArea>
      </PageView>
    </PageContainer>
  );
};

export default InteractionsPage;