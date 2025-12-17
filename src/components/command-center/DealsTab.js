import React, { useState } from 'react';
import styled from 'styled-components';
import { FaDollarSign, FaRobot, FaTrash } from 'react-icons/fa';
import { ActionCard, ActionCardHeader, ActionCardContent } from '../../pages/CommandCenterPage.styles';

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

const DealsTab = ({
  theme,
  selectedThread,
  contactDeals,
  companyDeals,
  setCreateDealAIOpen,
  onDeleteDealContact,
  onUpdateDealStage,
}) => {
  const [updatingDeals, setUpdatingDeals] = useState({});

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
    <>
      {/* Add New Deal Button - AI Assisted */}
      <ActionCard theme={theme} style={{ cursor: 'pointer' }} onClick={() => setCreateDealAIOpen(true)}>
        <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
          <FaRobot style={{ color: '#8B5CF6' }} />
          <span style={{ fontWeight: 600 }}>New Deal from Email</span>
        </ActionCardContent>
      </ActionCard>

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
      {contactDeals.length === 0 && companyDeals.length === 0 && selectedThread && (
        <ActionCard theme={theme}>
          <ActionCardContent theme={theme} style={{ textAlign: 'center', opacity: 0.6, fontSize: '13px' }}>
            No deals linked to these contacts
          </ActionCardContent>
        </ActionCard>
      )}
    </>
  );
};

export default DealsTab;
