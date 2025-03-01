import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

const Container = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const NotificationCard = styled.div`
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => (props.new ? '#f0f7ff' : 'white')};
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const ReviewButton = styled(Button)`
  background-color: #0070f3;
  color: white;
  
  &:hover {
    background-color: #0060df;
  }
`;

const MarkReviewedButton = styled(Button)`
  background-color: #28a745;
  color: white;
  
  &:hover {
    background-color: #218838;
  }
`;

const SourceBadge = styled.span`
  background-color: #6c757d;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  margin-right: 0.5rem;
`;

const DateText = styled.span`
  color: #6c757d;
  font-size: 0.85rem;
`;

const NoNotifications = styled.p`
  text-align: center;
  color: #6c757d;
  padding: 2rem 0;
`;

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchNotifications();
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('public:contact_tags')
      .on('INSERT', payload => {
        fetchNotifications();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  async function fetchNotifications() {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_tags')
      .select(`
        *,
        contacts:contact_id (
          id, 
          first_name, 
          last_name, 
          email, 
          email2,
          email3
        )
      `)
      .eq('reviewed', false)
      .order('created_at', { ascending: false });
      
    if (error) console.error("Error fetching notifications:", error);
    else setNotifications(data || []);
    
    setLoading(false);
  }
  
  async function markAsReviewed(id) {
    const { error } = await supabase
      .from('contact_tags')
      .update({ 
        reviewed: true,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) console.error("Error marking as reviewed:", error);
    else fetchNotifications();
  }
  
  return (
    <Container>
      <Header>
        <h2>New Contacts ({notifications.length})</h2>
      </Header>
      
      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <NoNotifications>No new contacts to review.</NoNotifications>
      ) : (
        <div>
          {notifications.map(notif => (
            <NotificationCard key={notif.id} new={!notif.reviewed}>
              <ContactInfo>
                <h3>{notif.contacts?.first_name || ''} {notif.contacts?.last_name || ''}</h3>
                <p>{notif.contacts?.email || 'No email'}</p>
                <div>
                  <SourceBadge>{notif.source || 'Unknown'}</SourceBadge>
                  <DateText>{format(new Date(notif.created_at), 'PPp')}</DateText>
                </div>
              </ContactInfo>
              <Actions>
                <Link to={`/contacts/edit/${notif.contact_id}`}>
                  <ReviewButton>Review</ReviewButton>
                </Link>
                <MarkReviewedButton onClick={() => markAsReviewed(notif.id)}>
                  Mark as Reviewed
                </MarkReviewedButton>
              </Actions>
            </NotificationCard>
          ))}
        </div>
      )}
    </Container>
  );
};

export default NotificationsList;