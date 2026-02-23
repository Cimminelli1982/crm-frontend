import React from 'react';
import styled from 'styled-components';
import useHealthData from '../hooks/command-center/useHealthData';
import HealthLeftContent from '../components/command-center/left-panel/HealthLeftContent';
import HealthCenterContent from '../components/command-center/center-panel/HealthCenterContent';
import { FaChartLine, FaUtensils, FaWeight, FaDumbbell } from 'react-icons/fa';

const HEALTH_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
  { id: 'nutrition', label: 'Nutrition', icon: FaUtensils },
  { id: 'body', label: 'Body', icon: FaWeight },
  { id: 'training', label: 'Training', icon: FaDumbbell },
];

const HealthPage = ({ theme }) => {
  // Always pass 'health' as activeTab so the hook fetches data
  const healthHook = useHealthData('health');

  return (
    <PageContainer theme={theme}>
      {/* Top Tab Bar */}
      <Header theme={theme}>
        <TabsContainer>
          {HEALTH_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = healthHook.activeHealthTab === tab.id;
            return (
              <Tab
                key={tab.id}
                theme={theme}
                $active={isActive}
                onClick={() => healthHook.setActiveHealthTab(tab.id)}
              >
                <Icon />
                {tab.label}
              </Tab>
            );
          })}
        </TabsContainer>
      </Header>

      {/* Main Content: Left Panel + Center */}
      <MainContent>
        {healthHook.activeHealthTab !== 'dashboard' && (
          <LeftPanel theme={theme}>
            <HealthLeftContent theme={theme} healthHook={healthHook} />
          </LeftPanel>
        )}
        <CenterPanel theme={theme}>
          <HealthCenterContent theme={theme} healthHook={healthHook} />
        </CenterPanel>
      </MainContent>
    </PageContainer>
  );
};

// Styled components - matching Command Center's layout
const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const Header = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 16px 24px;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  flex-shrink: 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA')
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')
  };
  color: ${props => props.$active
    ? '#FFFFFF'
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };

  &:hover {
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#2563EB' : '#3B82F6')
      : (props.theme === 'light' ? '#E5E7EB' : '#4B5563')
    };
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: 300px;
  min-width: 300px;
  border-right: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CenterPanel = styled.div`
  flex: 1;
  overflow: auto;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

export default HealthPage;
