import React from 'react';
import {
  Header,
  TabsContainer,
  Tab,
  Badge,
  UnreadDot,
} from '../../../pages/CommandCenterPage.styles';

const DesktopHeader = ({ theme, tabs, activeTab, setActiveTab }) => {
  return (
    <Header theme={theme}>
      <TabsContainer>
        {tabs.map(tab => (
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
        ))}
      </TabsContainer>
    </Header>
  );
};

export default DesktopHeader;
