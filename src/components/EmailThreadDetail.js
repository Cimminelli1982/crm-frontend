import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FiX, FiMail, FiClock, FiUser, FiUsers, FiPaperclip, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const EmailThreadDetail = ({ threadId, onClose, theme }) => {
  const [threadData, setThreadData] = useState(null);
  const [emails, setEmails] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEmails, setExpandedEmails] = useState({});
  const [expandedContent, setExpandedContent] = useState({});

  useEffect(() => {
    if (threadId) {
      loadThreadData();
    }
  }, [threadId]);

  const loadThreadData = async () => {
    setLoading(true);
    try {
      // Fetch thread info
      const { data: threadInfo, error: threadError } = await supabase
        .from('email_threads')
        .select('*')
        .eq('email_thread_id', threadId)
        .single();

      if (threadError) throw threadError;
      setThreadData(threadInfo);

      // Fetch all emails in this thread
      const { data: emailsData, error: emailsError } = await supabase
        .from('emails')
        .select('*')
        .eq('email_thread_id', threadId)
        .order('message_timestamp', { ascending: true });

      if (emailsError) throw emailsError;

      // Fetch contact info and emails for sender display
      const enrichedEmails = await Promise.all(
        (emailsData || []).map(async (email) => {
          let senderEmail = 'Unknown Sender';
          let senderName = 'Unknown';

          if (email.sender_contact_id) {
            // Fetch sender contact info
            const { data: senderContact } = await supabase
              .from('contacts')
              .select('contact_id, first_name, last_name')
              .eq('contact_id', email.sender_contact_id)
              .single();

            if (senderContact) {
              senderName = `${senderContact.first_name || ''} ${senderContact.last_name || ''}`.trim() || 'Unknown';

              // Fetch sender email
              const { data: contactEmail } = await supabase
                .from('contact_emails')
                .select('email')
                .eq('contact_id', email.sender_contact_id)
                .eq('is_primary', true)
                .single();

              if (!contactEmail) {
                const { data: anyEmail } = await supabase
                  .from('contact_emails')
                  .select('email')
                  .eq('contact_id', email.sender_contact_id)
                  .limit(1)
                  .single();

                senderEmail = anyEmail?.email || 'Unknown Email';
              } else {
                senderEmail = contactEmail.email;
              }
            }
          }

          // Fetch all recipients from contact_email_threads (this is how the DB is structured)
          let toRecipients = [];
          let ccRecipients = [];
          let bccRecipients = [];

          try {
            // Use contact_email_threads to find all recipients for this thread
            const { data: threadContacts } = await supabase
              .from('contact_email_threads')
              .select('contact_id')
              .eq('email_thread_id', email.email_thread_id);

            if (threadContacts && threadContacts.length > 0) {
              const recipientEmails = await Promise.all(
                threadContacts.map(async (tc) => {
                  const { data: contactEmail } = await supabase
                    .from('contact_emails')
                    .select('email')
                    .eq('contact_id', tc.contact_id)
                    .eq('is_primary', true)
                    .single();

                  if (!contactEmail) {
                    const { data: anyEmail } = await supabase
                      .from('contact_emails')
                      .select('email')
                      .eq('contact_id', tc.contact_id)
                      .limit(1)
                      .single();

                    return anyEmail?.email;
                  }
                  return contactEmail?.email;
                })
              );

              // Filter out the sender from the recipients list
              const allRecipients = recipientEmails.filter(e => e !== null && e !== undefined && e !== email.senderEmail);

              // Since this appears to be a mass email to investors, they're all "To" recipients
              toRecipients = allRecipients;
            }
          } catch (err) {
            console.log('Error fetching recipients:', err);
          }

          return {
            ...email,
            senderEmail,
            senderName,
            toRecipients,
            ccRecipients,
            bccRecipients
          };
        })
      );
      
      setEmails(enrichedEmails);
      
      // Auto-expand the last email
      if (enrichedEmails.length > 0) {
        const lastEmail = enrichedEmails[enrichedEmails.length - 1];
        setExpandedEmails({ [lastEmail.email_id]: true });
      }

      // Fetch all participants - check if email_receivers table exists
      let participantsData = [];
      try {
        const { data, error } = await supabase
          .from('email_receivers')
          .select('contact_id, receiver_type')
          .in('email_id', emailsData.map(e => e.email_id));

        if (!error && data) {
          // Fetch contact details and emails for each participant
          participantsData = await Promise.all(
            data.map(async (receiver) => {
              if (receiver.contact_id) {
                const { data: contact } = await supabase
                  .from('contacts')
                  .select('contact_id, first_name, last_name')
                  .eq('contact_id', receiver.contact_id)
                  .single();

                const { data: contactEmail } = await supabase
                  .from('contact_emails')
                  .select('email')
                  .eq('contact_id', receiver.contact_id)
                  .limit(1)
                  .single();

                return {
                  receiver_email: contactEmail?.email || 'Unknown',
                  receiver_type: receiver.receiver_type,
                  contact: contact
                };
              }
              return null;
            })
          );

          participantsData = participantsData.filter(p => p !== null);
        }
      } catch (err) {
        console.log('Could not fetch participants:', err);
      }
      
      // Get unique participants
      const uniqueParticipants = [];
      const seen = new Set();
      
      participantsData?.forEach(p => {
        if (!seen.has(p.receiver_email)) {
          seen.add(p.receiver_email);
          uniqueParticipants.push({
            email: p.receiver_email,
            name: p.contact ? `${p.contact.first_name || ''} ${p.contact.last_name || ''}`.trim() : null,
            type: p.receiver_type
          });
        }
      });
      
      // Add senders to participants
      enrichedEmails.forEach(email => {
        if (email.senderEmail && !seen.has(email.senderEmail)) {
          seen.add(email.senderEmail);
          uniqueParticipants.push({
            email: email.senderEmail,
            name: email.senderName,
            type: 'sender'
          });
        }
      });
      
      setParticipants(uniqueParticipants);

    } catch (error) {
      console.error('Error loading thread data:', error);
      toast.error('Failed to load email thread');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmail = (emailId) => {
    setExpandedEmails(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };

  const toggleContentExpansion = (emailId) => {
    setExpandedContent(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getInitials = (name) => {
    if (!name || name === 'Unknown') return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRecipientsList = async (emailId) => {
    try {
      const { data, error } = await supabase
        .from('email_receivers')
        .select('receiver_email, receiver_type')
        .eq('email_id', emailId);

      if (error) {
        console.log('Could not fetch recipients:', error);
        return { to: [], cc: [], bcc: [] };
      }

      const to = data?.filter(r => r.receiver_type === 'to').map(r => r.receiver_email) || [];
      const cc = data?.filter(r => r.receiver_type === 'cc').map(r => r.receiver_email) || [];
      const bcc = data?.filter(r => r.receiver_type === 'bcc').map(r => r.receiver_email) || [];

      return { to, cc, bcc };
    } catch (err) {
      console.log('Error fetching recipients:', err);
      return { to: [], cc: [], bcc: [] };
    }
  };

  if (loading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={e => e.stopPropagation()} theme={theme}>
          <LoadingContainer>Loading email thread...</LoadingContainer>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} theme={theme}>
        <Header theme={theme}>
          <HeaderTop>
            <Subject theme={theme}>
              <FiMail />
              {threadData?.subject || 'No Subject'}
            </Subject>
            <CloseButton onClick={onClose} theme={theme}>
              <FiX />
            </CloseButton>
          </HeaderTop>
          
          {participants.length > 0 && (
            <ParticipantsBar theme={theme}>
              <FiUsers />
              <ParticipantsList>
                {participants.slice(0, 3).map((p, idx) => (
                  <Participant key={idx} theme={theme}>
                    {p.name || p.email.split('@')[0]}
                    {idx < Math.min(participants.length - 1, 2) && ','}
                  </Participant>
                ))}
                {participants.length > 3 && (
                  <Participant theme={theme}>
                    and {participants.length - 3} more
                  </Participant>
                )}
              </ParticipantsList>
            </ParticipantsBar>
          )}
        </Header>

        <EmailsContainer>
          {emails.map((email, index) => {
            const isExpanded = expandedEmails[email.email_id];
            const isLast = index === emails.length - 1;
            
            return (
              <EmailCard key={email.email_id} theme={theme} $isLast={isLast}>
                <EmailHeader
                  onClick={() => toggleEmail(email.email_id)}
                  theme={theme}
                  isExpanded={isExpanded}
                >
                  <EmailHeaderLeft>
                    <Avatar theme={theme} direction={email.direction}>
                      {getInitials(email.senderName)}
                    </Avatar>
                    <EmailMeta>
                      {email.subject && (
                        <EmailSubject theme={theme}>
                          {email.subject}
                        </EmailSubject>
                      )}
                      <SenderInfo>
                        <SenderName theme={theme}>
                          {email.senderName}
                        </SenderName>
                        <EmailAddress theme={theme}>
                          &lt;{email.senderEmail}&gt;
                        </EmailAddress>
                        {email.direction === 'sent' && (
                          <SentBadge theme={theme}>Sent</SentBadge>
                        )}
                      </SenderInfo>
                      <EmailDate theme={theme}>
                        <FiClock size={12} />
                        {formatDate(email.message_timestamp)}
                      </EmailDate>
                    </EmailMeta>
                  </EmailHeaderLeft>
                  <ExpandIcon theme={theme}>
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </ExpandIcon>
                </EmailHeader>

                {isExpanded && (
                  <EmailBody theme={theme}>
                    <RecipientInfo theme={theme}>
                      {email.senderEmail && (
                        <RecipientRow>
                          <RecipientLabel>From:</RecipientLabel>
                          <RecipientEmails>
                            {email.senderEmail}
                          </RecipientEmails>
                        </RecipientRow>
                      )}
                      {email.toRecipients && email.toRecipients.length > 0 ? (
                        <RecipientRow>
                          <RecipientLabel>To:</RecipientLabel>
                          <RecipientEmails>
                            {email.toRecipients.join(', ')}
                          </RecipientEmails>
                        </RecipientRow>
                      ) : (
                        <RecipientRow>
                          <RecipientLabel>To:</RecipientLabel>
                          <RecipientEmails>
                            Multiple recipients (see participants above)
                          </RecipientEmails>
                        </RecipientRow>
                      )}
                      {email.ccRecipients && email.ccRecipients.length > 0 && (
                        <RecipientRow>
                          <RecipientLabel>CC:</RecipientLabel>
                          <RecipientEmails>
                            {email.ccRecipients.join(', ')}
                          </RecipientEmails>
                        </RecipientRow>
                      )}
                      {email.bccRecipients && email.bccRecipients.length > 0 && (
                        <RecipientRow>
                          <RecipientLabel>BCC:</RecipientLabel>
                          <RecipientEmails>
                            {email.bccRecipients.join(', ')}
                          </RecipientEmails>
                        </RecipientRow>
                      )}
                    </RecipientInfo>
                    
                    {email.has_attachments && (
                      <AttachmentIndicator theme={theme}>
                        <FiPaperclip />
                        {email.attachment_count} attachment{email.attachment_count !== 1 ? 's' : ''}
                      </AttachmentIndicator>
                    )}
                    
                    <EmailContent theme={theme}>
                      {email.body_html ? (
                        <>
                          <HtmlContent
                            dangerouslySetInnerHTML={{
                              __html: expandedContent[email.email_id]
                                ? email.body_html
                                : (email.body_html.length > 500
                                  ? email.body_html.substring(0, 500) + '...'
                                  : email.body_html)
                            }}
                            theme={theme}
                            isTruncated={!expandedContent[email.email_id] && email.body_html.length > 500}
                          />
                          {email.body_html.length > 500 && (
                            <ShowMoreButton
                              onClick={() => toggleContentExpansion(email.email_id)}
                              theme={theme}
                            >
                              {expandedContent[email.email_id] ? 'Show less' : 'Show more'}
                            </ShowMoreButton>
                          )}
                        </>
                      ) : (
                        <>
                          <PlainContent theme={theme}>
                            {expandedContent[email.email_id]
                              ? (email.body_plain || 'No content available')
                              : ((email.body_plain || '').length > 500
                                ? (email.body_plain || '').substring(0, 500) + '...'
                                : (email.body_plain || 'No content available'))
                            }
                          </PlainContent>
                          {(email.body_plain || '').length > 500 && (
                            <ShowMoreButton
                              onClick={() => toggleContentExpansion(email.email_id)}
                              theme={theme}
                            >
                              {expandedContent[email.email_id] ? 'Show less' : 'Show more'}
                            </ShowMoreButton>
                          )}
                        </>
                      )}
                    </EmailContent>
                  </EmailBody>
                )}

                {!isExpanded && (
                  <EmailPreview theme={theme}>
                    {email.body_plain?.substring(0, 100) || 'No preview available'}...
                  </EmailPreview>
                )}
              </EmailCard>
            );
          })}
        </EmailsContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const Subject = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  margin: 0;
  
  svg {
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ParticipantsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ParticipantsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Participant = styled.span`
  color: ${props => props.theme === 'light' ? '#4B5563' : '#D1D5DB'};
`;

const EmailsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const EmailCard = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-radius: 8px;
  margin-bottom: ${props => props.$isLast ? '0' : '12px'};
  overflow: hidden;
`;

const EmailHeader = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.isExpanded 
    ? (props.theme === 'light' ? '#F9FAFB' : '#1F2937')
    : 'transparent'};
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  }
`;

const EmailHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => 
    props.direction === 'sent' 
      ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A8A')
      : (props.theme === 'light' ? '#FEE2E2' : '#7F1D1D')
  };
  color: ${props => 
    props.direction === 'sent'
      ? (props.theme === 'light' ? '#1E40AF' : '#DBEAFE')
      : (props.theme === 'light' ? '#991B1B' : '#FEE2E2')
  };
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`;

const EmailMeta = styled.div`
  flex: 1;
`;

const EmailSubject = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 6px;
  line-height: 1.4;
`;

const SenderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const SenderName = styled.span`
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const EmailAddress = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 13px;
`;

const SentBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1E40AF' : '#DBEAFE'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
`;

const EmailDate = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ExpandIcon = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmailBody = styled.div`
  padding: 0 16px 16px;
`;

const RecipientInfo = styled.div`
  padding: 12px 0;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  font-size: 13px;
`;

const RecipientRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RecipientLabel = styled.span`
  color: ${props => props.theme === 'light' ? '#4B5563' : '#9CA3AF'};
  font-weight: 600;
  min-width: 45px;
  display: inline-block;
`;

const RecipientEmails = styled.span`
  color: ${props => props.theme === 'light' ? '#111827' : '#E5E7EB'};
  font-weight: 500;
`;

const AttachmentIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#4B5563' : '#D1D5DB'};
  border-radius: 4px;
  font-size: 12px;
  margin: 8px 0;
`;

const EmailContent = styled.div`
  margin-top: 16px;
`;

const HtmlContent = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#E5E7EB'};
  line-height: 1.6;
  position: relative;
  ${props => props.isTruncated && `
    max-height: 300px;
    overflow: hidden;
    &:after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: linear-gradient(transparent, ${props.theme === 'light' ? '#FFFFFF' : '#111827'});
    }
  `}

  * {
    max-width: 100%;
  }

  img {
    height: auto;
    max-height: 200px;
  }

  a {
    color: ${props => props.theme === 'light' ? '#2563EB' : '#60A5FA'};
    text-decoration: underline;
  }

  blockquote {
    border-left: 3px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
    padding-left: 16px;
    margin-left: 0;
    color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  }
`;

const PlainContent = styled.pre`
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  color: ${props => props.theme === 'light' ? '#111827' : '#E5E7EB'};
  line-height: 1.6;
  margin: 0;
`;

const EmailPreview = styled.div`
  padding: 0 16px 12px 68px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
  line-height: 1.4;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const ShowMoreButton = styled.button`
  margin-top: 12px;
  padding: 6px 12px;
  background: none;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  color: ${props => props.theme === 'light' ? '#2563EB' : '#60A5FA'};
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
    border-color: ${props => props.theme === 'light' ? '#2563EB' : '#60A5FA'};
  }
`;

export default EmailThreadDetail;