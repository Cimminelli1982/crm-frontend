import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaDollarSign, FaRobot, FaTrash, FaPlus, FaLink, FaSearch, FaChevronDown, FaPaperclip, FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel, FaDownload } from 'react-icons/fa';
import { ActionCard, ActionCardHeader, ActionCardContent } from '../../pages/CommandCenterPage.styles';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Helper function for file icons
const getFileIcon = (type, name) => {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (type?.includes('pdf') || ext === 'pdf') return FaFilePdf;
  if (type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return FaFileImage;
  if (type?.includes('word') || ['doc', 'docx'].includes(ext)) return FaFileWord;
  if (type?.includes('excel') || type?.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return FaFileExcel;
  return FaFile;
};

const DealActionsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const DealActionBtn = styled.button`
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &.invested {
    background: #D1FAE5;
    color: #059669;
    &:hover {
      background: #A7F3D0;
    }
  }

  &.passed {
    background: #FEE2E2;
    color: #DC2626;
    &:hover {
      background: #FECACA;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StageBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &.lead {
    background: #DBEAFE;
    color: #1D4ED8;
  }
  &.evaluating {
    background: #FEF3C7;
    color: #D97706;
  }
  &.closing {
    background: #E9D5FF;
    color: #7C3AED;
  }
  &.invested {
    background: #D1FAE5;
    color: #059669;
  }
  &.monitoring {
    background: #CFFAFE;
    color: #0891B2;
  }
  &.passed {
    background: #FEE2E2;
    color: #DC2626;
  }
`;

const AddDealMenu = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const MenuButton = styled.button`
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  background: ${props => props.$active
    ? (props.theme === 'dark' ? '#1F2937' : '#F3F4F6')
    : (props.theme === 'dark' ? '#111827' : '#FFFFFF')};
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#1F2937' : '#F3F4F6'};
    border-color: ${props => props.theme === 'dark' ? '#4B5563' : '#D1D5DB'};
  }
`;

const AssociatePanel = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  padding-left: 36px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#FFFFFF'};
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  font-size: 13px;
  margin-bottom: 8px;

  &:focus {
    outline: none;
    border-color: #10B981;
  }

  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#6B7280' : '#9CA3AF'};
  }
`;

const DealsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const DealOption = styled.div`
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  background: ${props => props.$selected
    ? (props.theme === 'dark' ? '#064E3B' : '#D1FAE5')
    : (props.theme === 'dark' ? '#1F2937' : '#F9FAFB')};
  border: 1px solid ${props => props.$selected ? '#10B981' : 'transparent'};

  &:hover {
    background: ${props => props.$selected
      ? (props.theme === 'dark' ? '#064E3B' : '#D1FAE5')
      : (props.theme === 'dark' ? '#374151' : '#F3F4F6')};
  }
`;

const RelationshipSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#FFFFFF'};
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  font-size: 13px;
  margin-top: 8px;

  &:focus {
    outline: none;
    border-color: #10B981;
  }
`;

const AssociateButton = styled.button`
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #10B981;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: #059669;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SectionHeader = styled.div`
  padding: 12px 16px 8px;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#9CA3AF' : '#6B7280'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AttachmentsSection = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const AttachmentItem = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#F3F4F6'};
  margin-top: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  }
`;

const AttachmentName = styled.span`
  flex: 1;
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#D1D5DB' : '#374151'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DealsTab = ({
  theme,
  selectedThread,
  contactDeals,
  companyDeals,
  setCreateDealAIOpen,
  setCreateDealModalOpen,
  onDeleteDealContact,
  onUpdateDealStage,
  contactId, // The contact to associate deals with
  onDealAssociated, // Callback after associating a deal
}) => {
  const [updatingDeals, setUpdatingDeals] = useState({});
  const [showAssociate, setShowAssociate] = useState(false);
  const [allDeals, setAllDeals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [relationship, setRelationship] = useState('proposer');
  const [associating, setAssociating] = useState(false);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // Fetch all deals when associate panel opens
  useEffect(() => {
    if (showAssociate) {
      fetchAllDeals();
    }
  }, [showAssociate]);

  const fetchAllDeals = async () => {
    setLoadingDeals(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('deal_id, opportunity, stage, category')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllDeals(data || []);
    } catch (err) {
      console.error('Error fetching deals:', err);
      toast.error('Failed to load deals');
    } finally {
      setLoadingDeals(false);
    }
  };

  const handleAssociate = async () => {
    if (!selectedDeal || !contactId) return;

    setAssociating(true);
    try {
      const { error } = await supabase
        .from('deals_contacts')
        .insert({
          deal_id: selectedDeal.deal_id,
          contact_id: contactId,
          relationship: relationship
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Contact already associated with this deal');
        } else {
          throw error;
        }
      } else {
        toast.success('Contact associated with deal');
        setShowAssociate(false);
        setSelectedDeal(null);
        setSearchQuery('');
        onDealAssociated?.();
      }
    } catch (err) {
      console.error('Error associating deal:', err);
      toast.error('Failed to associate deal');
    } finally {
      setAssociating(false);
    }
  };

  // Filter deals by search query
  const filteredDeals = allDeals.filter(deal =>
    deal.opportunity?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get already associated deal IDs to filter them out
  const associatedDealIds = [...contactDeals, ...companyDeals].map(d => d.deal_id);

  const handleStageUpdate = async (dealId, newStage) => {
    if (!onUpdateDealStage) return;
    setUpdatingDeals(prev => ({ ...prev, [dealId]: true }));
    await onUpdateDealStage(dealId, newStage);
    setUpdatingDeals(prev => ({ ...prev, [dealId]: false }));
  };

  // Check if deal is in an active stage (show buttons only for active deals)
  const isActiveStage = (stage) => {
    const activeStages = ['Lead', 'Evaluating', 'Closing'];
    return !stage || activeStages.includes(stage);
  };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {/* Add Deal Menu */}
      <AddDealMenu theme={theme}>
        <MenuButton
          theme={theme}
          $active={showAssociate}
          onClick={() => setShowAssociate(!showAssociate)}
        >
          <FaLink size={12} /> Associate
        </MenuButton>
        <MenuButton
          theme={theme}
          onClick={() => setCreateDealModalOpen(true)}
        >
          <FaPlus size={12} /> Create New
        </MenuButton>
      </AddDealMenu>

      {/* Associate Panel */}
      {showAssociate && (
        <AssociatePanel theme={theme}>
          <div style={{ position: 'relative' }}>
            <FaSearch
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '12px',
                color: theme === 'dark' ? '#6B7280' : '#9CA3AF'
              }}
            />
            <SearchInput
              theme={theme}
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DealsList>
            {loadingDeals ? (
              <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
                Loading deals...
              </div>
            ) : filteredDeals.filter(d => !associatedDealIds.includes(d.deal_id)).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
                {searchQuery ? 'No deals found' : 'No deals available'}
              </div>
            ) : (
              filteredDeals
                .filter(d => !associatedDealIds.includes(d.deal_id))
                .map(deal => (
                  <DealOption
                    key={deal.deal_id}
                    theme={theme}
                    $selected={selectedDeal?.deal_id === deal.deal_id}
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                      {deal.opportunity || 'Untitled Deal'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <StageBadge className={deal.stage?.toLowerCase() || 'lead'}>
                        {deal.stage || 'Lead'}
                      </StageBadge>
                      {deal.category && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: theme === 'dark' ? '#374151' : '#F3F4F6',
                          color: theme === 'dark' ? '#D1D5DB' : '#374151'
                        }}>
                          {deal.category}
                        </span>
                      )}
                    </div>
                  </DealOption>
                ))
            )}
          </DealsList>

          {selectedDeal && (
            <>
              <RelationshipSelect
                theme={theme}
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                <option value="proposer">Proposer</option>
                <option value="introducer">Introducer</option>
                <option value="co-investor">Co-investor</option>
                <option value="advisor">Advisor</option>
                <option value="other">Other</option>
              </RelationshipSelect>

              <AssociateButton
                onClick={handleAssociate}
                disabled={associating}
              >
                <FaLink size={12} />
                {associating ? 'Associating...' : 'Associate Contact'}
              </AssociateButton>
            </>
          )}
        </AssociatePanel>
      )}

      {/* From Contacts Section */}
      {contactDeals.length > 0 && (
        <>
          <div style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 600,
            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            From Contacts
          </div>
          {contactDeals.map(deal => (
            <ActionCard key={deal.deal_id} theme={theme}>
              <ActionCardHeader theme={theme} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaDollarSign style={{ color: '#10B981' }} /> {deal.opportunity || 'Untitled Deal'}
                </span>
                <span style={{ display: 'flex', gap: '4px' }}>
                  {deal.category && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: theme === 'light' ? '#F3F4F6' : '#374151',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      fontWeight: 500
                    }}>
                      {deal.category}
                    </span>
                  )}
                  {deal.source_category && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: deal.source_category === 'Introduction' ? '#FEE2E2' : '#DBEAFE',
                      color: deal.source_category === 'Introduction' ? '#DC2626' : '#1D4ED8',
                      fontWeight: 500
                    }}>
                      {deal.source_category === 'Introduction' ? 'Intro' : 'Cold'}
                    </span>
                  )}
                </span>
              </ActionCardHeader>
              <ActionCardContent theme={theme}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <StageBadge className={deal.stage?.toLowerCase() || 'lead'}>
                    {deal.stage || 'Lead'}
                  </StageBadge>
                  {(deal.proposed_at || deal.created_at) && (
                    <span style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                      {new Date(deal.proposed_at || deal.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                {deal.total_investment && (
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#10B981' }}>
                    {deal.deal_currency === 'EUR' ? '€' : deal.deal_currency === 'GBP' ? '£' : deal.deal_currency === 'PLN' ? 'zł' : '$'}{deal.total_investment.toLocaleString()}
                  </div>
                )}
                {deal.description && (
                  <div style={{ fontSize: '12px', color: theme === 'light' ? '#4B5563' : '#D1D5DB', marginTop: '6px', lineHeight: '1.4' }}>
                    {deal.description.length > 360 ? deal.description.substring(0, 360) + '...' : deal.description}
                  </div>
                )}
                {deal.contacts && deal.contacts.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {deal.contacts.map(c => (
                      <div key={c.contact_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                        <span>{c.name} <span style={{ opacity: 0.7 }}>({c.relationship})</span></span>
                        <FaTrash
                          size={10}
                          style={{ cursor: 'pointer', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginLeft: '8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDealContact(deal.deal_id, c.contact_id);
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                          onMouseLeave={e => e.currentTarget.style.color = theme === 'light' ? '#9CA3AF' : '#6B7280'}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {/* Attachments */}
                {deal.deal_attachments && deal.deal_attachments.length > 0 && (
                  <AttachmentsSection theme={theme}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaPaperclip size={9} /> {deal.deal_attachments.length} attachment{deal.deal_attachments.length > 1 ? 's' : ''}
                    </div>
                    {deal.deal_attachments.map(da => {
                      const att = da.attachments;
                      if (!att) return null;
                      const Icon = getFileIcon(att.file_type, att.file_name);
                      return (
                        <AttachmentItem
                          key={da.attachment_id}
                          theme={theme}
                          href={att.permanent_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon size={14} style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', flexShrink: 0 }} />
                          <AttachmentName theme={theme}>{att.file_name}</AttachmentName>
                          <FaDownload size={10} style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', flexShrink: 0 }} />
                        </AttachmentItem>
                      );
                    })}
                  </AttachmentsSection>
                )}
                {/* Invested/Passed buttons - only for active stages */}
                {isActiveStage(deal.stage) && onUpdateDealStage && (
                  <DealActionsRow>
                    <DealActionBtn
                      className="invested"
                      disabled={updatingDeals[deal.deal_id]}
                      onClick={() => handleStageUpdate(deal.deal_id, 'Invested')}
                    >
                      {updatingDeals[deal.deal_id] ? '...' : '✓ Invested'}
                    </DealActionBtn>
                    <DealActionBtn
                      className="passed"
                      disabled={updatingDeals[deal.deal_id]}
                      onClick={() => handleStageUpdate(deal.deal_id, 'Passed')}
                    >
                      {updatingDeals[deal.deal_id] ? '...' : '✗ Passed'}
                    </DealActionBtn>
                  </DealActionsRow>
                )}
              </ActionCardContent>
            </ActionCard>
          ))}
        </>
      )}

      {/* From Companies Section */}
      {companyDeals.length > 0 && (
        <>
          <div style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 600,
            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            From Companies
          </div>
          {companyDeals.map(deal => (
            <ActionCard key={deal.deal_id} theme={theme}>
              <ActionCardHeader theme={theme} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaDollarSign style={{ color: '#8B5CF6' }} /> {deal.opportunity || 'Untitled Deal'}
                </span>
                <span style={{ display: 'flex', gap: '4px' }}>
                  {deal.category && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: theme === 'light' ? '#F3F4F6' : '#374151',
                      color: theme === 'light' ? '#374151' : '#D1D5DB',
                      fontWeight: 500
                    }}>
                      {deal.category}
                    </span>
                  )}
                  {deal.source_category && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: deal.source_category === 'Introduction' ? '#FEE2E2' : '#DBEAFE',
                      color: deal.source_category === 'Introduction' ? '#DC2626' : '#1D4ED8',
                      fontWeight: 500
                    }}>
                      {deal.source_category === 'Introduction' ? 'Intro' : 'Cold'}
                    </span>
                  )}
                </span>
              </ActionCardHeader>
              <ActionCardContent theme={theme}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <StageBadge className={deal.stage?.toLowerCase() || 'lead'}>
                    {deal.stage || 'Lead'}
                  </StageBadge>
                  {(deal.proposed_at || deal.created_at) && (
                    <span style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                      {new Date(deal.proposed_at || deal.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                {deal.total_investment && (
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#8B5CF6' }}>
                    {deal.deal_currency === 'EUR' ? '€' : deal.deal_currency === 'GBP' ? '£' : deal.deal_currency === 'PLN' ? 'zł' : '$'}{deal.total_investment.toLocaleString()}
                  </div>
                )}
                {deal.description && (
                  <div style={{ fontSize: '12px', color: theme === 'light' ? '#4B5563' : '#D1D5DB', marginTop: '6px', lineHeight: '1.4' }}>
                    {deal.description.length > 360 ? deal.description.substring(0, 360) + '...' : deal.description}
                  </div>
                )}
                {deal.companyName && (
                  <div style={{ fontSize: '11px', color: theme === 'light' ? '#9CA3AF' : '#6B7280', marginTop: '4px' }}>
                    via {deal.companyName}
                  </div>
                )}
                {/* Attachments */}
                {deal.deal_attachments && deal.deal_attachments.length > 0 && (
                  <AttachmentsSection theme={theme}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: theme === 'light' ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaPaperclip size={9} /> {deal.deal_attachments.length} attachment{deal.deal_attachments.length > 1 ? 's' : ''}
                    </div>
                    {deal.deal_attachments.map(da => {
                      const att = da.attachments;
                      if (!att) return null;
                      const Icon = getFileIcon(att.file_type, att.file_name);
                      return (
                        <AttachmentItem
                          key={da.attachment_id}
                          theme={theme}
                          href={att.permanent_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon size={14} style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF', flexShrink: 0 }} />
                          <AttachmentName theme={theme}>{att.file_name}</AttachmentName>
                          <FaDownload size={10} style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', flexShrink: 0 }} />
                        </AttachmentItem>
                      );
                    })}
                  </AttachmentsSection>
                )}
                {/* Invested/Passed buttons - only for active stages */}
                {isActiveStage(deal.stage) && onUpdateDealStage && (
                  <DealActionsRow>
                    <DealActionBtn
                      className="invested"
                      disabled={updatingDeals[deal.deal_id]}
                      onClick={() => handleStageUpdate(deal.deal_id, 'Invested')}
                    >
                      {updatingDeals[deal.deal_id] ? '...' : '✓ Invested'}
                    </DealActionBtn>
                    <DealActionBtn
                      className="passed"
                      disabled={updatingDeals[deal.deal_id]}
                      onClick={() => handleStageUpdate(deal.deal_id, 'Passed')}
                    >
                      {updatingDeals[deal.deal_id] ? '...' : '✗ Passed'}
                    </DealActionBtn>
                  </DealActionsRow>
                )}
              </ActionCardContent>
            </ActionCard>
          ))}
        </>
      )}

      {/* Empty State - only show when no deals at all */}
      {contactDeals.length === 0 && companyDeals.length === 0 && !showAssociate && (
        <ActionCard theme={theme}>
          <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6, fontSize: '13px' }}>
            No deals linked to this contact
          </ActionCardContent>
        </ActionCard>
      )}
    </div>
  );
};

export default DealsTab;
