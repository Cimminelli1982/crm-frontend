import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import RecentContactsList from '../../components/contacts/RecentContactsList';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

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
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .counter {
    font-size: 1.25rem;
    color: #6b7280;
    font-weight: normal;
  }
  
  p {
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const RecentlyCreatedContacts = () => {
  const [totalCount, setTotalCount] = useState(0);
  
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { count, error } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', oneWeekAgo.toISOString())
          .neq('contact_category', 'Skip');
          
        if (error) throw error;
        setTotalCount(count || 0);
      } catch (error) {
        console.error('Error fetching count:', error);
      }
    };
    
    fetchCount();
  }, []);

  return (
    <Layout>
      <PageContainer>
        <PageHeader>
          <h1>
            Recently Created Contacts
            {totalCount > 0 && <span className="counter">({totalCount})</span>}
          </h1>
          <p>View contacts that were recently added to your CRM.</p>
        </PageHeader>
        
        <RecentContactsList defaultFilter="recent" />
      </PageContainer>
    </Layout>
  );
};

export default RecentlyCreatedContacts; 