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

const LastInteractions = () => {
  const [totalCount, setTotalCount] = useState(0);
  
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count, error } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .gte('last_interaction', today.toISOString())
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
    <>
      <PageContainer>
        <PageHeader>
          <h1>Last Interactions</h1>
          <p>View and manage your recent contact interactions.</p>
        </PageHeader>
        
        <RecentContactsList defaultFilter="today" />
      </PageContainer>
    </>
  );
};

export default LastInteractions; 