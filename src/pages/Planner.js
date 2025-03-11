import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';

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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
`;

const TableHeader = styled.th`
  background-color: #f9fafb;
  color: #374151;
  font-weight: 600;
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f3f4f6;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
`;

const Planner = () => {
  const [meetings, setMeetings] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const { data: meetingsData, error: meetingsError } = await supabase
          .from('meetings')
          .select('id, meeting_date, meeting_name, meeting_record, meeting_score, meeting_note');
        if (meetingsError) throw meetingsError;

        const { data: contactsData, error: contactsError } = await supabase
          .from('meetings_contacts')
          .select('meeting_id, contact_id');
        if (contactsError) throw contactsError;

        const { data: contactNamesData, error: contactNamesError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name');
        if (contactNamesError) throw contactNamesError;

        const meetingsWithContacts = meetingsData.map(meeting => {
          const relatedContacts = contactsData
            .filter(contact => contact.meeting_id === meeting.id)
            .map(contact => {
              const contactName = contactNamesData.find(cn => cn.id === contact.contact_id);
              return contactName ? `${contactName.first_name} ${contactName.last_name}` : 'Unknown';
            });
          return { ...meeting, meeting_contacts: relatedContacts };
        });

        const sortedMeetings = meetingsWithContacts.sort((a, b) => new Date(a.meeting_date) - new Date(b.meeting_date));
        setMeetings(sortedMeetings);
        setDebugInfo(JSON.stringify(sortedMeetings, null, 2));
      } catch (error) {
        console.error('Error fetching meetings:', error.message);
        setDebugInfo(`Error: ${error.message}`);
      }
    };

    fetchMeetings();
  }, []);

  return (
    <>
      <PageContainer>
        <PageHeader>
          <h1>Planner</h1>
          <p>Schedule and manage your meetings and follow-ups.</p>
        </PageHeader>
        <Table>
          <thead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>Meeting</TableHeader>
              <TableHeader>Attendees</TableHeader>
              <TableHeader>Tags</TableHeader>
              <TableHeader>Record</TableHeader>
              <TableHeader>Score</TableHeader>
              <TableHeader>Note</TableHeader>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting, index) => (
              <TableRow key={index}>
                <TableCell>{meeting.meeting_date}</TableCell>
                <TableCell>{meeting.meeting_name}</TableCell>
                <TableCell>{meeting.meeting_contacts.join(', ')}</TableCell>
                <TableCell>{meeting.meeting_tags ? meeting.meeting_tags.join(', ') : 'N/A'}</TableCell>
                <TableCell>{meeting.meeting_record}</TableCell>
                <TableCell>{'⭐'.repeat(meeting.meeting_score)}</TableCell>
                <TableCell>{meeting.meeting_note}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </PageContainer>
    </>
  );
};

export default Planner; 