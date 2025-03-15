import React, { useState, useEffect } from 'react';
import KeepInTouchTable from '../../components/contacts/KeepInTouchTable';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

const PageContainer = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const PageHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
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

const ContentSection = styled.div`
  padding: 0;
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
    <PageContainer>
      <PageHeader>
        <h1>
          Keep in Touch
          {totalCount > 0 && <span className="counter">({totalCount})</span>}
        </h1>
        <p>View and manage your follow-up schedule with important contacts.</p>
      </PageHeader>
      
      <ContentSection>
        <KeepInTouchTable />
      </ContentSection>
    </PageContainer>
  );
};

export default KeepInTouch; 