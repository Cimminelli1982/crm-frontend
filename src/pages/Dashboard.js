import React from 'react';
import Layout from '../components/layout/Layout';
import NotificationsList from '../components/contacts/NotificationsList';
import styled from 'styled-components';

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #0070f3;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #6c757d;
`;

const Dashboard = () => {
  return (
    <Layout>
      <h1>Dashboard</h1>
      <StatsContainer>
        <StatCard>
          <StatValue>0</StatValue>
          <StatLabel>New Contacts Today</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>0</StatValue>
          <StatLabel>Contacts This Week</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>0</StatValue>
          <StatLabel>Total Contacts</StatLabel>
        </StatCard>
      </StatsContainer>
      
      <NotificationsList />
    </Layout>
  );
};

export default Dashboard;