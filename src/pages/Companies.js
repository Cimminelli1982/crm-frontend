import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
    margin-bottom: 8px;
  }
  
  p {
    color: white;
    font-size: 0.875rem;
  }
`;

const CompaniesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const CompanyCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  
  .category {
    font-size: 0.8rem;
    color: #6b7280;
    background-color: #f3f4f6;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 12px;
  }
  
  p {
    color: #4b5563;
    font-size: 0.875rem;
    margin-bottom: 16px;
  }
`;

const Companies = () => {
  // Sample company data
  const sampleCompanies = [
    { id: 1, name: 'Acme Corp', category: 'Enterprise', description: 'Leading provider of industrial solutions' },
    { id: 2, name: 'TechStart', category: 'Startup', description: 'Innovative tech startup in the AI space' },
    { id: 3, name: 'Capital Ventures', category: 'Investor', description: 'Venture capital firm focusing on early-stage startups' },
    { id: 4, name: 'Global Solutions', category: 'Enterprise', description: 'International business solutions provider' },
  ];

  return (
    <>
      <PageContainer>
        <PageHeader>
          <h1>Companies</h1>
          <p>View and manage all your company relationships.</p>
        </PageHeader>
        
        <CompaniesGrid>
          {sampleCompanies.map(company => (
            <CompanyCard key={company.id}>
              <h3>{company.name}</h3>
              <div className="category">{company.category}</div>
              <p>{company.description}</p>
            </CompanyCard>
          ))}
        </CompaniesGrid>
      </PageContainer>
    </>
  );
};

export default Companies; 