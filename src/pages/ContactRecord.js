// src/pages/ContactRecord.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../lib/supabaseClient';
import { FiEdit, FiPhone, FiMail, FiMapPin, FiTag, FiBriefcase, FiMessageSquare, FiCalendar, FiClock } from 'react-icons/fi';

// Styled components
const Container = styled.div`
  padding: 10px 30px 30px 20px;
  width: calc(100% - 50px);
  max-width: calc(100% - 50px);
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #333;
  width: 100%;
`;

const Title = styled.h1`
  color: #00ff00;
  margin: 0;
  font-family: 'Courier New', monospace;
`;

const EditButton = styled.button`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 10px 20px;
  margin-right: 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #333;
  }
`;

const ContentGrid = styled.div`
  display: flex;
  width: 100%;
  gap: 35px;
  box-sizing: border-box;
  margin-top: 30px;
  
  @media (max-width: 992px) {
    flex-direction: column;
    
    > div {
      width: 100% !important;
    }
  }
`;

const Card = styled.div`
  background-color: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  padding: 20px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const CardTitle = styled.h2`
  font-size: 1.2rem;
  color: #00ff00;
  margin-top: 0;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    font-size: 1.2rem;
  }
`;

const InfoItem = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.div`
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 2px;
`;

const InfoValue = styled.div`
  color: #eee;
  font-size: 0.95rem;
`;

const RelatedItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  overflow-wrap: break-word;
  word-break: break-word;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #222;
  }
`;

const RelatedTitle = styled.div`
  font-weight: bold;
  color: #eee;
  margin-bottom: 4px;
`;

const RelatedSubtitle = styled.div`
  font-size: 0.85rem;
  color: #999;
`;

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 5px;
`;

const Badge = styled.span`
  background-color: #222;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 12px;
  padding: 3px 8px;
  font-size: 0.7rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #333;
  margin-bottom: 20px;
  width: 100%;
  padding-left: 10px;
`;

const Tab = styled.div`
  padding: 10px 30px;
  margin-right: 15px;
  cursor: pointer;
  color: ${props => props.active ? '#00ff00' : '#ccc'};
  border-bottom: 2px solid ${props => props.active ? '#00ff00' : 'transparent'};
  
  &:hover {
    color: ${props => props.active ? '#00ff00' : '#eee'};
  }
`;

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const Breadcrumbs = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  margin-top: -5px;
  font-size: 0.9rem;
  color: #999;
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  color: #00ff00;
`;

const ErrorScreen = styled.div`
  padding: 20px;
  background-color: #331111;
  color: #ff5555;
  border-radius: 4px;
  margin: 20px 0;
`;

const ContactRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [contact, setContact] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [tags, setTags] = useState([]);
  const [cities, setCities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [emails, setEmails] = useState([]);
  const [mobiles, setMobiles] = useState([]);
  const [keepInTouch, setKeepInTouch] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('interactions');
  
  // Fetch contact data and related info
  useEffect(() => {
    if (!id) return;
    
    const fetchContactData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get basic contact info
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('*')
          .eq('contact_id', id)
          .single();
          
        if (contactError) throw contactError;
        if (!contactData) throw new Error('Contact not found');
        
        setContact(contactData);
        
        // Fetch related data in parallel
        const [
          interactionsResult,
          tagsResult,
          citiesResult,
          companiesResult,
          emailsResult,
          mobilesResult,
          notesResult,
          kitResult
        ] = await Promise.all([
          // Get interactions
          supabase
            .from('interactions')
            .select('*')
            .eq('contact_id', id)
            .order('interaction_date', { ascending: false }),
            
          // Get tags
          supabase
            .from('contact_tags')
            .select(`
              entry_id,
              tags (
                tag_id,
                name
              )
            `)
            .eq('contact_id', id),
            
          // Get cities
          supabase
            .from('contact_cities')
            .select(`
              entry_id,
              cities (
                city_id,
                name,
                country
              )
            `)
            .eq('contact_id', id),
            
          // Get companies
          supabase
            .from('contact_companies')
            .select(`
              contact_companies_id,
              relationship,
              is_primary,
              companies (
                company_id,
                name,
                website,
                category
              )
            `)
            .eq('contact_id', id),
            
          // Get emails
          supabase
            .from('contact_emails')
            .select('*')
            .eq('contact_id', id),
            
          // Get mobiles
          supabase
            .from('contact_mobiles')
            .select('*')
            .eq('contact_id', id),
            
          // Get notes
          supabase
            .from('notes_contacts')
            .select(`
              note_contact_id,
              notes (
                note_id,
                title,
                text,
                created_at
              )
            `)
            .eq('contact_id', id)
            .order('created_at', { foreignTable: 'notes', ascending: false }),
            
          // Get keep in touch record
          supabase
            .from('keep_in_touch')
            .select('*')
            .eq('contact_id', id)
            .single()
        ]);
        
        // Set all related data
        setInteractions(interactionsResult.data || []);
        setTags(tagsResult.data?.map(t => t.tags) || []);
        setCities(citiesResult.data?.map(c => c.cities) || []);
        setCompanies(companiesResult.data || []);
        setEmails(emailsResult.data || []);
        setMobiles(mobilesResult.data || []);
        setNotes(notesResult.data?.map(n => n.notes) || []);
        setKeepInTouch(kitResult.data || null);
        
      } catch (err) {
        console.error('Error fetching contact data:', err);
        setError(err.message || 'Error loading contact data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContactData();
  }, [id]);
  
  // Handle edit button click
  const handleEdit = () => {
    navigate(`/contacts/workflow/${id}`);
  };
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Format date and time
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  
  if (loading) {
    return (
      <Container>
        <LoadingScreen>
          <div>Loading Contact Data...</div>
        </LoadingScreen>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container>
        <ErrorScreen>
          <h2>Error Loading Contact</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/contacts/simple')}>Back to Contacts</button>
        </ErrorScreen>
      </Container>
    );
  }
  
  if (!contact) {
    return (
      <Container>
        <ErrorScreen>
          <h2>Contact Not Found</h2>
          <p>The requested contact could not be found.</p>
          <button onClick={() => navigate('/contacts/simple')}>Back to Contacts</button>
        </ErrorScreen>
      </Container>
    );
  }
  
  return (
    <Container>
      <Breadcrumbs>
        <span onClick={() => navigate('/contacts/lists')} style={{ cursor: 'pointer' }}>Lists</span>
        <span style={{ margin: '0 8px' }}>/</span>
        <span 
          onClick={() => navigate(`/contacts/lists?category=${encodeURIComponent(contact.category || 'Uncategorized')}`)} 
          style={{ cursor: 'pointer' }}
        >
          {contact.category || 'Uncategorized'}
        </span>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#ccc' }}>{contact.first_name} {contact.last_name}</span>
      </Breadcrumbs>
      
      <Header>
        <div>
          <Title>{contact.first_name} {contact.last_name}</Title>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', color: '#999', fontSize: '0.85rem' }}>
            <div style={{ marginRight: '20px' }}>
              <span>Created: </span>
              <span style={{ color: '#eee' }}>{formatDateTime(contact.created_at)}</span>
            </div>
            <div>
              <span>Last modified: </span>
              <span style={{ color: '#eee' }}>{formatDateTime(contact.last_modified_at)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {mobiles.length > 0 && (
            <a 
              href={`https://wa.me/${mobiles[0].mobile.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#25D366',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <FiPhone style={{ marginRight: '5px' }} /> WhatsApp
            </a>
          )}
          
          {emails.length > 0 && (
            <a 
              href={`mailto:${emails[0].email}`}
              style={{
                backgroundColor: '#4285F4',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <FiMail style={{ marginRight: '5px' }} /> Email
            </a>
          )}
          
          {contact.linkedin && (
            <a 
              href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#0A66C2',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              <FiBriefcase style={{ marginRight: '5px' }} /> LinkedIn
            </a>
          )}
          
          <EditButton onClick={handleEdit}>
            <FiEdit /> Edit
          </EditButton>
        </div>
      </Header>
      
      <ContentGrid>
        {/* Left Column - Contact Info */}
        <div style={{ width: '20%', flexShrink: 0 }}>
          <Card>
            <CardTitle><FiMail /> Contact Information</CardTitle>
            
            {emails.length > 0 && (
              <InfoItem>
                <InfoLabel>Emails</InfoLabel>
                {emails.map((email, index) => (
                  <InfoValue key={email.email_id}>
                    {email.email} {email.is_primary && '(Primary)'}
                  </InfoValue>
                ))}
              </InfoItem>
            )}
            
            {mobiles.length > 0 && (
              <InfoItem>
                <InfoLabel>Mobile Numbers</InfoLabel>
                {mobiles.map((mobile, index) => (
                  <InfoValue key={mobile.mobile_id}>
                    {mobile.mobile} {mobile.is_primary && '(Primary)'}
                  </InfoValue>
                ))}
              </InfoItem>
            )}
            
            <InfoItem>
              <InfoLabel>LinkedIn</InfoLabel>
              <InfoValue>{contact.linkedin || '-'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Job Role</InfoLabel>
              <InfoValue>{contact.job_role || '-'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Score</InfoLabel>
              <InfoValue>{contact.score !== null ? contact.score : '-'}</InfoValue>
            </InfoItem>
            
            <InfoItem>
              <InfoLabel>Birthday</InfoLabel>
              <InfoValue>{contact.birthday ? formatDate(contact.birthday) : '-'}</InfoValue>
            </InfoItem>
          </Card>
          
          {keepInTouch && (
            <Card>
              <CardTitle><FiClock /> Keep in Touch</CardTitle>
              
              <InfoItem>
                <InfoLabel>Frequency</InfoLabel>
                <InfoValue>{keepInTouch.frequency}</InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Last Interaction</InfoLabel>
                <InfoValue>{formatDateTime(contact.last_interaction_at || '-')}</InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Next Interaction Due</InfoLabel>
                <InfoValue style={{ 
                  color: keepInTouch.next_interaction_date && 
                  new Date(keepInTouch.next_interaction_date) < new Date() ? 
                  '#ff5555' : undefined 
                }}>
                  {formatDateTime(keepInTouch.next_interaction_date || '-')}
                  {keepInTouch.days_until_next && (
                    <span style={{ 
                      marginLeft: '8px',
                      color: keepInTouch.days_until_next < 0 ? '#ff5555' : '#00ff00' 
                    }}>
                      ({keepInTouch.days_until_next > 0 ? `in ${keepInTouch.days_until_next} days` : `${Math.abs(keepInTouch.days_until_next)} days overdue`})
                    </span>
                  )}
                </InfoValue>
              </InfoItem>
              
              {keepInTouch.why_keeping_in_touch && (
                <InfoItem>
                  <InfoLabel>Why Keeping in Touch</InfoLabel>
                  <InfoValue>{keepInTouch.why_keeping_in_touch}</InfoValue>
                </InfoItem>
              )}
              
              {keepInTouch.next_follow_up_notes && (
                <InfoItem>
                  <InfoLabel>Follow-up Notes</InfoLabel>
                  <InfoValue>{keepInTouch.next_follow_up_notes}</InfoValue>
                </InfoItem>
              )}
              
              <InfoItem>
                <InfoLabel>Snooze Days</InfoLabel>
                <InfoValue>{keepInTouch.snooze_days || 0}</InfoValue>
              </InfoItem>
              
              <InfoItem>
                <InfoLabel>Special Occasions</InfoLabel>
                <InfoValue>
                  {keepInTouch.christmas !== 'no wishes set' && (
                    <Badge style={{ marginRight: '8px' }}>Christmas: {keepInTouch.christmas}</Badge>
                  )}
                  {keepInTouch.easter !== 'no wishes set' && (
                    <Badge>Easter: {keepInTouch.easter}</Badge>
                  )}
                  {keepInTouch.christmas === 'no wishes set' && keepInTouch.easter === 'no wishes set' && '-'}
                </InfoValue>
              </InfoItem>
            </Card>
          )}
          
          {tags.length > 0 && (
            <Card>
              <CardTitle><FiTag /> Tags</CardTitle>
              <BadgeContainer>
                {tags.map(tag => (
                  <Badge key={tag.tag_id}>{tag.name}</Badge>
                ))}
              </BadgeContainer>
            </Card>
          )}
          
          {cities.length > 0 && (
            <Card>
              <CardTitle><FiMapPin /> Locations</CardTitle>
              <BadgeContainer>
                {cities.map(city => (
                  <Badge key={city.city_id}>{city.name}, {city.country}</Badge>
                ))}
              </BadgeContainer>
            </Card>
          )}
          
          {companies.length > 0 && (
            <Card>
              <CardTitle><FiBriefcase /> Companies</CardTitle>
              {companies.map(company => (
                <InfoItem key={company.contact_companies_id}>
                  <InfoValue>
                    {company.companies.name} 
                    {company.is_primary && ' (Primary)'}
                  </InfoValue>
                  <InfoLabel>
                    {company.relationship || 'Associated'}
                    {company.companies.website && ` · ${company.companies.website}`}
                  </InfoLabel>
                </InfoItem>
              ))}
            </Card>
          )}
        </div>
        
        {/* Right Column - Interactions, Notes, etc */}
        <div style={{ width: '80%', flexGrow: 1, boxSizing: 'border-box', overflow: 'hidden', paddingRight: '5px' }}>
          <Tabs>
            <Tab 
              active={activeTab === 'interactions'}
              onClick={() => setActiveTab('interactions')}
            >
              Interactions
            </Tab>
            <Tab 
              active={activeTab === 'opportunities'}
              onClick={() => setActiveTab('opportunities')}
            >
              Opportunities
            </Tab>
            <Tab 
              active={activeTab === 'introductions'}
              onClick={() => setActiveTab('introductions')}
            >
              Introductions
            </Tab>
            <Tab 
              active={activeTab === 'notes'}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </Tab>
            <Tab 
              active={activeTab === 'related'}
              onClick={() => setActiveTab('related')}
            >
              Related
            </Tab>
          </Tabs>
          
          <TabContent active={activeTab === 'interactions'}>
            <Card>
              <Tabs style={{ borderBottom: '1px solid #222', marginTop: '-10px', paddingLeft: '0' }}>
                <Tab 
                  active={true}
                  onClick={() => {}}
                  style={{ fontSize: '0.9rem', padding: '8px 20px' }}
                >
                  Emails
                </Tab>
                <Tab 
                  active={false}
                  onClick={() => {}}
                  style={{ fontSize: '0.9rem', padding: '8px 20px' }}
                >
                  WhatsApp
                </Tab>
                <Tab 
                  active={false}
                  onClick={() => {}}
                  style={{ fontSize: '0.9rem', padding: '8px 20px' }}
                >
                  Meetings
                </Tab>
              </Tabs>
              <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>No interactions found</div>
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'opportunities'}>
            <Card>
              <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>Coming soon</div>
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'introductions'}>
            <Card>
              <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>Coming soon</div>
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'notes'}>
            <Card>
              {notes.length === 0 ? (
                <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>No notes found</div>
              ) : (
                notes.map(note => (
                  <RelatedItem key={note.note_id}>
                    <RelatedTitle>{note.title}</RelatedTitle>
                    <RelatedSubtitle>{formatDateTime(note.created_at)}</RelatedSubtitle>
                    <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#ddd' }}>
                      {note.text}
                    </div>
                  </RelatedItem>
                ))
              )}
            </Card>
          </TabContent>
          
          <TabContent active={activeTab === 'related'}>
            <Card>
              <div style={{ padding: '30px 0', color: '#999', textAlign: 'center' }}>Coming soon</div>
            </Card>
          </TabContent>
        </div>
      </ContentGrid>
    </Container>
  );
};

export default ContactRecord;
