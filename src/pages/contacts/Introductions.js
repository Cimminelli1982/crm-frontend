import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';

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

const IntroductionsTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 24px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHead = styled.thead`
  background: #f9fafb;
  th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 500;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
  }
`;

const TableBody = styled.tbody`
  tr {
    &:hover {
      background-color: #f9fafb;
    }
    &:not(:last-child) {
      border-bottom: 1px solid #e5e7eb;
    }
  }
  td {
    padding: 12px 16px;
    font-size: 0.875rem;
    color: #1f2937;
    vertical-align: middle;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => {
    switch (props.status) {
      case 'pending': return '#FEF3C7';
      case 'accepted': return '#DCFCE7';
      case 'declined': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'pending': return '#92400E';
      case 'accepted': return '#166534';
      case 'declined': return '#991B1B';
      default: return '#374151';
    }
  }};
`;

const Button = styled.button`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #2563eb;
  }
`;

const Introductions = () => {
  // Sample data
  const sampleIntroductions = [
    { id: 1, from: 'John Smith', to: 'Maria Garcia', company: 'Acme Corp', purpose: 'Potential investment', status: 'pending', date: '2023-05-15' },
    { id: 2, from: 'Alice Johnson', to: 'David Chen', company: 'TechStart', purpose: 'Partnership discussion', status: 'accepted', date: '2023-05-10' },
    { id: 3, from: 'Mike Wilson', to: 'Sarah Brown', company: 'Capital Ventures', purpose: 'Funding opportunity', status: 'declined', date: '2023-05-05' },
    { id: 4, from: 'Emily Davis', to: 'James Miller', company: 'Global Solutions', purpose: 'Advisory role', status: 'accepted', date: '2023-05-01' },
  ];

  return (
    <PageContainer>
      <PageHeader>
        <h1>Introductions</h1>
        <p>Manage your professional introductions and networking connections.</p>
      </PageHeader>
      
      <Button>New Introduction</Button>
      
      <IntroductionsTable>
        <TableHead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>Company</th>
            <th>Purpose</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </TableHead>
        <TableBody>
          {sampleIntroductions.map(intro => (
            <tr key={intro.id}>
              <td>{intro.from}</td>
              <td>{intro.to}</td>
              <td>{intro.company}</td>
              <td>{intro.purpose}</td>
              <td>
                <StatusBadge status={intro.status}>
                  {intro.status.charAt(0).toUpperCase() + intro.status.slice(1)}
                </StatusBadge>
              </td>
              <td>{intro.date}</td>
              <td>
                <Button>View</Button>
              </td>
            </tr>
          ))}
        </TableBody>
      </IntroductionsTable>
    </PageContainer>
  );
};

export default Introductions; 