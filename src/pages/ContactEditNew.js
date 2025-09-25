import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import styled from 'styled-components';
import { FaUser, FaPhone, FaEnvelope, FaBuilding, FaArrowLeft } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const ContactEditNew = ({ theme }) => {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Quick Edit');

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  const fetchContact = async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      // Fetch basic contact data
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_id', contactId)
        .single();

      if (contactError) {
        throw contactError;
      }

      // Fetch emails
      const { data: emailsData } = await supabase
        .from('contact_emails')
        .select('email, type, is_primary')
        .eq('contact_id', contactId);

      // Fetch mobiles
      const { data: mobilesData } = await supabase
        .from('contact_mobiles')
        .select('mobile, type, is_primary')
        .eq('contact_id', contactId);

      // Fetch companies
      const { data: companiesData } = await supabase
        .from('contact_companies')
        .select(`
          company_id,
          relationship,
          is_primary,
          companies (name, website, category)
        `)
        .eq('contact_id', contactId);

      console.log('Contact data loaded successfully:', contactData);

      // Combine all data
      setContact({
        ...contactData,
        emails: emailsData || [],
        mobiles: mobilesData || [],
        companies: companiesData?.map(cc => cc.companies).filter(Boolean) || []
      });

    } catch (error) {
      console.error('Error fetching contact:', error);
      toast.error('Failed to load contact details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLegacyEdit = () => {
    // Check if we're in local development
    const isLocal = window.location.hostname === 'localhost';
    const url = isLocal
      ? `http://localhost:3000/contacts/workflow/${contactId}?step=2`
      : `/contacts/workflow/${contactId}?step=2`;

    const newTab = window.open(url, '_blank');
    if (newTab) {
      newTab.focus();
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingText theme={theme}>Loading contact...</LoadingText>
      </LoadingContainer>
    );
  }

  if (!contact) {
    return (
      <ErrorContainer>
        <ErrorText theme={theme}>Contact not found</ErrorText>
      </ErrorContainer>
    );
  }

  return (
    <PageContainer theme={theme}>
      <DetailView theme={theme}>
        <DetailHeader theme={theme}>
          <BackButton theme={theme} onClick={handleBackClick}>
            <FaArrowLeft />
            <span>Back</span>
          </BackButton>
          <ActionButtons>
            <ActionButton
              as="button"
              onClick={handleOpenLegacyEdit}
              $primary
              theme={theme}
            >
              <FiExternalLink />
              <span>Full Editor</span>
            </ActionButton>
          </ActionButtons>
        </DetailHeader>

        <DetailContent theme={theme}>
          <ProfileSection theme={theme}>
            <ProfileAvatar theme={theme}>
              {contact.profile_image_url ? (
                <img src={contact.profile_image_url} alt="Profile" />
              ) : (
                <FaUser />
              )}
            </ProfileAvatar>
            <ProfileInfo>
              <ProfileHeader>
                <ProfileName theme={theme}>
                  {contact.first_name} {contact.last_name}
                  {contact.companies?.length > 0 && (
                    <CompanyNames theme={theme}>
                      {contact.companies.map(company => company.name).join(', ')}
                    </CompanyNames>
                  )}
                </ProfileName>
              </ProfileHeader>
              {contact.job_role && (
                <ProfileRole theme={theme}>{contact.job_role}</ProfileRole>
              )}
              <ProfileBadges>
                {contact.category && (
                  <CategoryBadge theme={theme}>{contact.category}</CategoryBadge>
                )}
                {contact.score && (
                  <ScoreBadge theme={theme}>
                    {'⭐'.repeat(contact.score)}
                  </ScoreBadge>
                )}
              </ProfileBadges>
            </ProfileInfo>
          </ProfileSection>

          <NavTabs theme={theme}>
            {['Quick Edit', 'Missing Fields', 'Merge'].map(tab => (
              <NavTab
                key={tab}
                theme={theme}
                $active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </NavTab>
            ))}
          </NavTabs>

          <TabContent theme={theme}>
            {activeTab === 'Quick Edit' && (
              <ComingSoonContainer>
                <ComingSoonIcon>🚀</ComingSoonIcon>
                <ComingSoonTitle theme={theme}>Quick Edit - Coming Soon</ComingSoonTitle>
                <ComingSoonText theme={theme}>
                  We're working on a streamlined editing experience that will allow you to quickly update the most important contact fields.
                </ComingSoonText>
              </ComingSoonContainer>
            )}

            {activeTab === 'Missing Fields' && (
              <ComingSoonContainer>
                <ComingSoonIcon>📝</ComingSoonIcon>
                <ComingSoonTitle theme={theme}>Missing Fields - Coming Soon</ComingSoonTitle>
                <ComingSoonText theme={theme}>
                  This section will help you identify and fill in missing information for your contacts to ensure complete profiles.
                </ComingSoonText>
              </ComingSoonContainer>
            )}

            {activeTab === 'Merge' && (
              <ComingSoonContainer>
                <ComingSoonIcon>🔀</ComingSoonIcon>
                <ComingSoonTitle theme={theme}>Merge - Coming Soon</ComingSoonTitle>
                <ComingSoonText theme={theme}>
                  This feature will allow you to merge duplicate contacts and consolidate their information into a single comprehensive profile.
                </ComingSoonText>
              </ComingSoonContainer>
            )}
          </TabContent>
        </DetailContent>
      </DetailView>
    </PageContainer>
  );
};

// Styled Components (matching ContactDetail.js exactly)
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

const DetailView = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  display: flex;
  flex-direction: column;
  border-radius: 0;

  @media (min-width: 768px) {
    margin: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    min-height: calc(100vh - 40px);
  }
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    gap: 0;
    padding: 8px 4px;

    span {
      display: none;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: ${props =>
    props.$primary ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA') :
    props.$secondary ? (props.theme === 'light' ? '#10B981' : '#34D399') :
    props.$edit ? (props.theme === 'light' ? '#F59E0B' : '#FBBF24') :
    props.$delete ? '#EF4444' :
    props.theme === 'light' ? '#F3F4F6' : '#374151'
  };
  color: ${props =>
    props.$primary || props.$secondary || props.$edit || props.$delete ? 'white' :
    props.theme === 'light' ? '#374151' : '#F9FAFB'
  };
  border: 1px solid ${props =>
    props.$primary ? (props.theme === 'light' ? '#3B82F6' : '#60A5FA') :
    props.$secondary ? (props.theme === 'light' ? '#10B981' : '#34D399') :
    props.$edit ? (props.theme === 'light' ? '#F59E0B' : '#FBBF24') :
    props.$delete ? '#EF4444' :
    props.theme === 'light' ? '#D1D5DB' : '#4B5563'
  };
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 640px) {
    gap: 0;
    padding: 8px 12px;

    span {
      display: none;
    }
  }
`;

const DetailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  -webkit-overflow-scrolling: touch;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const ProfileAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#6B7280'};

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  svg {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#D1D5DB'};
    font-size: 32px;
  }

  @media (min-width: 768px) {
    width: 100px;
    height: 100px;

    svg {
      font-size: 40px;
    }
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (min-width: 768px) {
    font-size: 28px;
  }
`;

const CompanyNames = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};

  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

const ProfileRole = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 8px;

  @media (min-width: 768px) {
    font-size: 18px;
  }
`;

const ProfileBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const CategoryBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#EBF4FF' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
`;

const ScoreBadge = styled.span`
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#92400E'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#FEF3C7'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
`;

const NavTabs = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 600px;
  margin: 24px auto;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 12px;
  padding: 6px;
  width: fit-content;
  box-shadow: ${props => props.theme === 'light'
    ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
    : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
  };
`;

const NavTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  font-size: 15px;
  font-weight: ${props => props.$active ? '600' : '500'};
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
      ? '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)'
      : '0 2px 4px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
      : (props.theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(31, 41, 55, 0.7)')
    };
  }
`;

const TabContent = styled.div`
  flex: 1;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  min-height: 50vh;
`;

const LoadingText = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  min-height: 50vh;
`;

const ErrorText = styled.div`
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  font-size: 18px;
  font-weight: 600;
`;

const ComingSoonContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
  padding: 60px 20px;
`;

const ComingSoonIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
`;

const ComingSoonTitle = styled.h2`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
`;

const ComingSoonText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
`;

export default ContactEditNew;