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

const KeepInTouchPage = ({ theme, onKeepInTouchCountChange }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('Touch Base');
  const [subCategory, setSubCategory] = useState('Over Due');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Create data source for ContactsListDRY
  const getDataSource = () => {
    if (filterCategory === 'Touch Base') {
      return {
        type: 'keepInTouch',
        filterCategory: 'Touch Base',
        subCategory: subCategory
      };
    } else if (filterCategory === 'Birthday') {
      return {
        type: 'keepInTouch',
        filterCategory: 'Birthday',
        subCategory: subCategory
      };
    }
    return {
      type: 'keepInTouch',
      filterCategory: filterCategory
    };
  };

  const handleDataLoad = (data) => {
    // Update keep in touch count if we have a callback
    if (onKeepInTouchCountChange) {
      onKeepInTouchCountChange(data.length);
    }
  };


  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const keepInTouchCategories = ['Touch Base', 'Birthday'];
  const touchBaseSubCategories = ['Over Due', 'Due', 'Soon', 'Relax'];
  const birthdaySubCategories = ['This Week', 'This Month', 'Next 3 Months', 'All'];

  return (
    <PageContainer theme={theme}>
      <PageView>
        <PageHeader theme={theme}>
          <HeaderContent>
            <HeaderText>
              <PageTitle theme={theme}>Keep in Touch</PageTitle>
              <PageSubtitle theme={theme}>
                Follow-up reminders
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
            {keepInTouchCategories.map(category => (
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

        {/* Touch Base Submenu - in gray area below header */}
        {filterCategory === 'Touch Base' && (
          <SubMenu theme={theme}>
            {touchBaseSubCategories.map(subCat => (
              <SubTab
                key={subCat}
                theme={theme}
                $active={subCategory === subCat}
                onClick={() => setSubCategory(subCat)}
              >
                {subCat}
              </SubTab>
            ))}
          </SubMenu>
        )}

        {/* Birthday Submenu - in gray area below header */}
        {filterCategory === 'Birthday' && (
          <SubMenu theme={theme}>
            {birthdaySubCategories.map(subCat => (
              <SubTab
                key={subCat}
                theme={theme}
                $active={subCategory === subCat}
                onClick={() => setSubCategory(subCat)}
              >
                {subCat}
              </SubTab>
            ))}
          </SubMenu>
        )}

        <ContentArea>
          <ContactsListDRY
            dataSource={getDataSource()}
            refreshTrigger={refreshTrigger}
            theme={theme}
            emptyStateConfig={{
              icon: '📞',
              title: 'No keep-in-touch contacts!',
              text: 'All contacts are up to date with follow-ups.'
            }}
            onDataLoad={handleDataLoad}
            onContactUpdate={() => setRefreshTrigger(prev => prev + 1)}
            showActions={true}
            pageContext="keepInTouch"
            keepInTouchConfig={{
              showDaysCounter: true,
              showFrequencyBadge: true
            }}
            filterCategory={filterCategory}
          />
        </ContentArea>
      </PageView>
    </PageContainer>
  );
};

export default KeepInTouchPage;