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

const KeepInTouch = () => {
  const [totalCount, setTotalCount] = useState(0);
  
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count, error } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .not('keep_in_touch_frequency', 'is', null)
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
            Keep in Touch
            {totalCount > 0 && <span className="counter">({totalCount})</span>}
          </h1>
          <p>Manage your follow-up schedule with important contacts.</p>
        </PageHeader>
        
        <RecentContactsList defaultFilter="keepintouch" />
      </PageContainer>
    </Layout>
  );
};

export default KeepInTouch; 