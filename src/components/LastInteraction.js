import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FiClock, FiMessageCircle, FiMail, FiPhone, FiUser, FiCalendar, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { FaWhatsapp, FaLinkedin } from 'react-icons/fa';

const LastInteraction = ({ contactId, theme }) => {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInteractions = async () => {
      if (!contactId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all interactions for this contact
        const { data, error } = await supabase
          .from('interactions')
          .select(`
            interaction_id,
            interaction_type,
            interaction_date,
            summary,
            direction,
            created_at
          `)
          .eq('contact_id', contactId)
          .order('interaction_date', { ascending: false })
          .limit(20); // Get last 20 interactions

        if (error) {
          throw error;
        }

        // Set interactions array
        setInteractions(data || []);
      } catch (err) {
        console.error('Error fetching last interaction:', err);
        setError('Failed to load interaction data');
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [contactId]);

  const getInteractionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return <FiMail />;
      case 'whatsapp':
        return <FaWhatsapp />;
      case 'phone':
      case 'call':
        return <FiPhone />;
      case 'linkedin':
        return <FaLinkedin />;
      case 'meeting':
        return <FiUser />;
      default:
        return <FiMessageCircle />;
    }
  };

  const getDirectionIcon = (direction) => {
    if (direction?.toLowerCase() === 'inbound') {
      return <FiArrowLeft style={{ color: '#10B981', fontSize: '14px' }} />;
    } else if (direction?.toLowerCase() === 'outbound') {
      return <FiArrowRight style={{ color: '#3B82F6', fontSize: '14px' }} />;
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };


  if (loading) {
    return (
      <Container theme={theme}>
        <LoadingState theme={theme}>
          <FiClock style={{ fontSize: '20px', marginBottom: '8px' }} />
          Loading interaction data...
        </LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container theme={theme}>
        <ErrorState theme={theme}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          {error}
        </ErrorState>
      </Container>
    );
  }

  if (!interactions || interactions.length === 0) {
    return (
      <Container theme={theme}>
        <EmptyState theme={theme}>
          <EmptyIcon>
            <FiClock />
          </EmptyIcon>
          <EmptyTitle>No Interactions Yet</EmptyTitle>
          <EmptyText>This contact has no recorded interactions</EmptyText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container theme={theme}>
      <InteractionsList theme={theme}>
        {interactions.map((interaction, index) => (
          <InteractionCard key={interaction.interaction_id} theme={theme} $isFirst={index === 0}>
            <InteractionHeader theme={theme}>
              <InteractionType theme={theme}>
                <TypeIcon>{getInteractionIcon(interaction.interaction_type)}</TypeIcon>
                <TypeText>{interaction.interaction_type || 'Interaction'}</TypeText>
                {getDirectionIcon(interaction.direction)}
              </InteractionType>
              <InteractionDate theme={theme}>
                <FiCalendar style={{ fontSize: '14px', marginRight: '4px' }} />
                {formatDate(interaction.interaction_date)}
              </InteractionDate>
            </InteractionHeader>

            {interaction.summary && (
              <InteractionSummary theme={theme}>
                {interaction.summary}
              </InteractionSummary>
            )}

            <InteractionFooter theme={theme}>
              <MetaItem theme={theme}>
                {interaction.direction === 'inbound' ? 'Received' : 'Sent'}
              </MetaItem>
            </InteractionFooter>
          </InteractionCard>
        ))}
      </InteractionsList>

      {interactions.length > 0 && (
        <HistoryNote theme={theme}>
          <FiClock style={{ fontSize: '12px', marginRight: '4px' }} />
          {interactions.length} interaction{interactions.length > 1 ? 's' : ''} found
        </HistoryNote>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme === 'light' ? '#DC2626' : '#F87171'};
  font-size: 14px;
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  color: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
`;

const InteractionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
    border-radius: 3px;
  }
`;

const InteractionCard = styled.div`
  background: ${props => props.$isFirst
    ? (props.theme === 'light' ? '#EEF2FF' : '#1E1B4B')
    : (props.theme === 'light' ? '#F9FAFB' : '#111827')};
  border: 1px solid ${props => props.$isFirst
    ? (props.theme === 'light' ? '#C7D2FE' : '#4338CA')
    : (props.theme === 'light' ? '#E5E7EB' : '#374151')};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const InteractionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const InteractionType = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const TypeIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 6px;
  color: #3B82F6;
  font-size: 14px;
`;

const TypeText = styled.span`
  text-transform: capitalize;
`;

const InteractionDate = styled.div`
  display: flex;
  align-items: center;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const InteractionSummary = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 6px;
  padding: 10px;
  margin-top: 8px;
  margin-bottom: 8px;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  font-size: 13px;
  line-height: 1.4;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const InteractionFooter = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const HistoryNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  padding: 12px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#111827'};
  border-radius: 8px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

export default LastInteraction;