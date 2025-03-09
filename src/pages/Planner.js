import React from 'react';
import Layout from '../components/layout/Layout';
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

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 24px;
`;

const DayCell = styled.div`
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  min-height: 120px;
  
  .date {
    font-weight: 500;
    font-size: 0.9rem;
    color: #374151;
    margin-bottom: 8px;
  }
  
  &.today {
    background-color: #eff6ff;
    border-color: #3b82f6;
    
    .date {
      color: #1e40af;
      font-weight: 600;
    }
  }
  
  &.different-month {
    background-color: #f9fafb;
    color: #9ca3af;
    
    .date {
      color: #9ca3af;
    }
  }
`;

const EventItem = styled.div`
  padding: 4px 8px;
  background-color: ${props => props.type === 'meeting' ? '#dcfce7' : '#dbeafe'};
  color: ${props => props.type === 'meeting' ? '#166534' : '#1e40af'};
  border-radius: 4px;
  font-size: 0.75rem;
  margin-bottom: 4px;
  cursor: pointer;
`;

const Planner = () => {
  // Sample events data
  const events = [
    { id: 1, title: 'Meeting with Acme Corp', type: 'meeting', date: '2023-05-15' },
    { id: 2, title: 'Follow-up call', type: 'call', date: '2023-05-15' },
    { id: 3, title: 'Project review', type: 'meeting', date: '2023-05-17' },
  ];
  
  return (
    <Layout>
      <PageContainer>
        <PageHeader>
          <h1>Planner</h1>
          <p>Schedule and manage your meetings and follow-ups.</p>
        </PageHeader>
        
        <CalendarGrid>
          {Array.from({ length: 7 }).map((_, dayIndex) => (
            <DayCell 
              key={dayIndex} 
              className={dayIndex === 2 ? 'today' : ''}
            >
              <div className="date">May {dayIndex + 15}</div>
              {events
                .filter(event => new Date(event.date).getDate() === dayIndex + 15)
                .map(event => (
                  <EventItem key={event.id} type={event.type}>
                    {event.title}
                  </EventItem>
                ))
              }
            </DayCell>
          ))}
        </CalendarGrid>
      </PageContainer>
    </Layout>
  );
};

export default Planner; 