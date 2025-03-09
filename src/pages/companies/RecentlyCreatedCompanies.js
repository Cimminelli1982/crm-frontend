import React from 'react';
import Layout from '../../components/layout/Layout';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  
  p {
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const RecentlyCreatedCompanies = () => {
  return (
    <Layout>
      <PageContainer>
        <PageHeader>
          <h1>Recently Created Companies</h1>
          <p>View companies that were recently added to your CRM.</p>
        </PageHeader>
        
        {/* Page content would go here */}
        <p>This page will display recently created companies.</p>
      </PageContainer>
    </Layout>
  );
};

export default RecentlyCreatedCompanies; 