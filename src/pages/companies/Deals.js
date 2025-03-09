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

const Deals = () => {
  return (
    <Layout>
      <PageContainer>
        <PageHeader>
          <h1>Deals</h1>
          <p>Track active and potential business deals.</p>
        </PageHeader>
        
        {/* Page content would go here */}
        <p>This page will display ongoing business deals with companies.</p>
      </PageContainer>
    </Layout>
  );
};

export default Deals; 