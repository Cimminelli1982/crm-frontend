import React, { useState } from 'react';
import styled from 'styled-components';
import { FaList, FaSearch, FaChevronDown, FaChevronRight, FaPlus, FaMagic, FaUsers, FaEnvelope, FaArrowLeft } from 'react-icons/fa';

/**
 * MobileListsView - Email lists management optimized for mobile
 */
const MobileListsView = ({
  lists = [],
  selectedList,
  members = [],
  onSelectList,
  onSelectMember,
  onCreateList,
  onAddMember,
  loading,
  loadingMembers,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    dynamic: true,
    static: true,
  });
  const [viewMode, setViewMode] = useState('lists'); // 'lists' | 'members'

  // Filter lists by search
  const filteredLists = lists.filter(list => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      list.name?.toLowerCase().includes(query) ||
      list.description?.toLowerCase().includes(query)
    );
  });

  // Group by type
  const dynamicLists = filteredLists.filter(l => l.list_type === 'dynamic');
  const staticLists = filteredLists.filter(l => l.list_type === 'static');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSelectList = (list) => {
    onSelectList?.(list);
    setViewMode('members');
  };

  const handleBack = () => {
    setViewMode('lists');
    onSelectList?.(null);
  };

  const getInitials = (member) => {
    const first = member.contacts?.first_name?.charAt(0) || '';
    const last = member.contacts?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Members View
  if (viewMode === 'members' && selectedList) {
    return (
      <Container theme={theme}>
        <MembersHeader theme={theme}>
          <BackButton theme={theme} onClick={handleBack}>
            <FaArrowLeft size={16} />
          </BackButton>
          <HeaderInfo>
            <ListIcon $isDynamic={selectedList.list_type === 'dynamic'}>
              {selectedList.list_type === 'dynamic' ? <FaMagic size={12} /> : <FaList size={12} />}
            </ListIcon>
            <ListTitle theme={theme}>{selectedList.name}</ListTitle>
          </HeaderInfo>
          {selectedList.list_type === 'static' && onAddMember && (
            <AddMemberButton theme={theme} onClick={onAddMember}>
              <FaPlus size={14} />
            </AddMemberButton>
          )}
        </MembersHeader>

        {selectedList.description && (
          <ListDescription theme={theme}>
            {selectedList.description}
          </ListDescription>
        )}

        <MemberCount theme={theme}>
          <FaUsers size={14} />
          <span>{members.length} members</span>
        </MemberCount>

        <MembersList>
          {loadingMembers ? (
            <LoadingState theme={theme}>
              <span>Loading members...</span>
            </LoadingState>
          ) : members.length === 0 ? (
            <EmptyState theme={theme}>
              <FaUsers size={32} style={{ opacity: 0.3 }} />
              <EmptyText theme={theme}>No members in this list</EmptyText>
            </EmptyState>
          ) : (
            members.map(member => (
              <MemberItem
                key={member.list_member_id}
                theme={theme}
                onClick={() => onSelectMember?.(member)}
              >
                <MemberAvatar theme={theme}>
                  {member.contacts?.profile_image_url ? (
                    <AvatarImage src={member.contacts.profile_image_url} alt="" />
                  ) : (
                    getInitials(member)
                  )}
                </MemberAvatar>
                <MemberContent>
                  <MemberName theme={theme}>
                    {member.contacts?.first_name} {member.contacts?.last_name}
                  </MemberName>
                  <MemberEmail theme={theme}>
                    <FaEnvelope size={10} />
                    {member.contact_emails?.email || 'No email'}
                  </MemberEmail>
                </MemberContent>
                <MemberTypeBadge $isAuto={member.membership_type === 'computed'}>
                  {member.membership_type === 'computed' ? 'Auto' : 'Manual'}
                </MemberTypeBadge>
              </MemberItem>
            ))
          )}
        </MembersList>
      </Container>
    );
  }

  // Lists View
  return (
    <Container theme={theme}>
      {/* Search Header */}
      <SearchHeader theme={theme}>
        <SearchContainer theme={theme}>
          <FaSearch size={14} />
          <SearchInput
            theme={theme}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lists..."
          />
        </SearchContainer>
        {onCreateList && (
          <CreateButton theme={theme} onClick={onCreateList}>
            <FaPlus size={14} />
          </CreateButton>
        )}
      </SearchHeader>

      {/* Lists */}
      <ListsContainer>
        {loading ? (
          <LoadingState theme={theme}>
            <FaList size={32} style={{ opacity: 0.3 }} />
            <span>Loading lists...</span>
          </LoadingState>
        ) : lists.length === 0 ? (
          <EmptyState theme={theme}>
            <FaList size={48} style={{ opacity: 0.3 }} />
            <EmptyTitle theme={theme}>No lists</EmptyTitle>
            <EmptyText theme={theme}>Create your first email list</EmptyText>
          </EmptyState>
        ) : (
          <>
            {/* Dynamic Lists Section */}
            {dynamicLists.length > 0 && (
              <Section>
                <SectionHeader
                  theme={theme}
                  onClick={() => toggleSection('dynamic')}
                >
                  <SectionLeft>
                    <SectionIcon $color="#8B5CF6">
                      <FaMagic size={12} />
                    </SectionIcon>
                    <SectionTitle theme={theme}>Dynamic</SectionTitle>
                    <SectionCount theme={theme}>{dynamicLists.length}</SectionCount>
                  </SectionLeft>
                  <ChevronIcon theme={theme}>
                    {expandedSections.dynamic ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  </ChevronIcon>
                </SectionHeader>

                {expandedSections.dynamic && (
                  <SectionContent>
                    {dynamicLists.map(list => (
                      <ListItem
                        key={list.list_id}
                        theme={theme}
                        onClick={() => handleSelectList(list)}
                      >
                        <ListItemIcon $color="#8B5CF6">
                          <FaMagic size={10} />
                        </ListItemIcon>
                        <ListItemContent>
                          <ListItemName theme={theme}>{list.name}</ListItemName>
                          {list.description && (
                            <ListItemDesc theme={theme}>
                              {list.description.length > 50 
                                ? list.description.substring(0, 50) + '...' 
                                : list.description}
                            </ListItemDesc>
                          )}
                        </ListItemContent>
                        <ChevronIcon theme={theme}>
                          <FaChevronRight size={12} />
                        </ChevronIcon>
                      </ListItem>
                    ))}
                  </SectionContent>
                )}
              </Section>
            )}

            {/* Static Lists Section */}
            {staticLists.length > 0 && (
              <Section>
                <SectionHeader
                  theme={theme}
                  onClick={() => toggleSection('static')}
                >
                  <SectionLeft>
                    <SectionIcon $color="#3B82F6">
                      <FaList size={12} />
                    </SectionIcon>
                    <SectionTitle theme={theme}>Static</SectionTitle>
                    <SectionCount theme={theme}>{staticLists.length}</SectionCount>
                  </SectionLeft>
                  <ChevronIcon theme={theme}>
                    {expandedSections.static ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  </ChevronIcon>
                </SectionHeader>

                {expandedSections.static && (
                  <SectionContent>
                    {staticLists.map(list => (
                      <ListItem
                        key={list.list_id}
                        theme={theme}
                        onClick={() => handleSelectList(list)}
                      >
                        <ListItemIcon $color="#3B82F6">
                          <FaList size={10} />
                        </ListItemIcon>
                        <ListItemContent>
                          <ListItemName theme={theme}>{list.name}</ListItemName>
                          {list.description && (
                            <ListItemDesc theme={theme}>
                              {list.description.length > 50 
                                ? list.description.substring(0, 50) + '...' 
                                : list.description}
                            </ListItemDesc>
                          )}
                        </ListItemContent>
                        <ChevronIcon theme={theme}>
                          <FaChevronRight size={12} />
                        </ChevronIcon>
                      </ListItem>
                    ))}
                  </SectionContent>
                )}
              </Section>
            )}
          </>
        )}
      </ListsContainer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const SearchHeader = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const SearchContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const CreateButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: none;
  background: #8B5CF6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:active {
    opacity: 0.9;
  }
`;

const ListsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const Section = styled.div`
  margin-bottom: 4px;
`;

const SectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border: none;
  cursor: pointer;
`;

const SectionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SectionTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const SectionCount = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 2px 8px;
  border-radius: 10px;
`;

const ChevronIcon = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SectionContent = styled.div``;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  cursor: pointer;

  &:active {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  }
`;

const ListItemIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.$color}20;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ListItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ListItemName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const ListItemDesc = styled.div`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

// Members View Styles
const MembersHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const BackButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:active {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const ListIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.$isDynamic ? '#8B5CF620' : '#3B82F620'};
  color: ${props => props.$isDynamic ? '#8B5CF6' : '#3B82F6'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ListTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
`;

const AddMemberButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:active {
    opacity: 0.9;
  }
`;

const ListDescription = styled.div`
  padding: 8px 16px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const MemberCount = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const MembersList = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  cursor: pointer;

  &:active {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  }
`;

const MemberAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const MemberContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const MemberEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-top: 2px;
`;

const MemberTypeBadge = styled.span`
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 10px;
  background: ${props => props.$isAuto
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A5F')
    : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  color: ${props => props.$isAuto
    ? (props.theme === 'light' ? '#2563EB' : '#60A5FA')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 16px 0 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
`;

export default MobileListsView;
