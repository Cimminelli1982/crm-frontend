import React, { useState } from 'react';
import styled from 'styled-components';
import { FaDollarSign, FaChevronDown, FaChevronRight, FaPlus, FaBuilding } from 'react-icons/fa';

// Stage colors
const STAGE_COLORS = {
  'Lead': { bg: '#DBEAFE', color: '#1D4ED8' },
  'Evaluating': { bg: '#FEF3C7', color: '#D97706' },
  'Qualified': { bg: '#D1FAE5', color: '#059669' },
  'Closing': { bg: '#E9D5FF', color: '#7C3AED' },
  'Negotiation': { bg: '#FED7AA', color: '#C2410C' },
  'Invested': { bg: '#D1FAE5', color: '#059669' },
  'Passed': { bg: '#FEE2E2', color: '#DC2626' },
  'Monitoring': { bg: '#CFFAFE', color: '#0891B2' },
};

/**
 * MobileDealsView - Deals pipeline view optimized for mobile
 * Shows deals grouped by stage with card-based items
 */
const MobileDealsView = ({
  deals = [],
  onDealSelect,
  onCreateDeal,
  onUpdateStage,
  theme = 'dark',
}) => {
  // Group by stage
  const [expandedStages, setExpandedStages] = useState({
    'Lead': true,
    'Evaluating': true,
    'Qualified': true,
    'Closing': true,
  });

  // Stage order
  const stageOrder = ['Lead', 'Evaluating', 'Qualified', 'Closing', 'Negotiation', 'Invested', 'Monitoring', 'Passed'];

  // Group deals by stage
  const dealsByStage = deals.reduce((acc, deal) => {
    const stage = deal.stage || 'Lead';
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(deal);
    return acc;
  }, {});

  const toggleStage = (stage) => {
    setExpandedStages(prev => ({
      ...prev,
      [stage]: !prev[stage],
    }));
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return null;
    const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'PLN' ? 'zł' : '$';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  const getStageColor = (stage) => {
    return STAGE_COLORS[stage] || { bg: '#F3F4F6', color: '#6B7280' };
  };

  // Filter stages that have deals
  const activeStages = stageOrder.filter(stage => dealsByStage[stage]?.length > 0);

  if (deals.length === 0) {
    return (
      <EmptyContainer>
        <EmptyState theme={theme}>
          <FaDollarSign size={48} style={{ opacity: 0.3 }} />
          <EmptyTitle theme={theme}>No deals</EmptyTitle>
          <EmptyText theme={theme}>Start tracking your pipeline</EmptyText>
          {onCreateDeal && (
            <CreateButton onClick={onCreateDeal}>
              <FaPlus size={14} />
              <span>Create Deal</span>
            </CreateButton>
          )}
        </EmptyState>
      </EmptyContainer>
    );
  }

  return (
    <Container>
      {/* Header with Create button */}
      {onCreateDeal && (
        <HeaderActions theme={theme}>
          <ActionButton theme={theme} $primary onClick={onCreateDeal}>
            <FaPlus size={14} />
            <span>New Deal</span>
          </ActionButton>
        </HeaderActions>
      )}

      <StagesList>
        {activeStages.map(stage => {
          const stageDeals = dealsByStage[stage] || [];
          const isExpanded = expandedStages[stage] !== false;
          const stageColor = getStageColor(stage);
          const totalValue = stageDeals.reduce((sum, d) => sum + (d.total_investment || 0), 0);

          return (
            <StageSection key={stage}>
              <StageHeader
                theme={theme}
                onClick={() => toggleStage(stage)}
              >
                <StageLeft>
                  <StageBadge $bg={stageColor.bg} $color={stageColor.color}>
                    {stage}
                  </StageBadge>
                  <StageCount theme={theme}>{stageDeals.length}</StageCount>
                </StageLeft>
                <StageRight>
                  {totalValue > 0 && (
                    <StageTotal theme={theme}>
                      {formatCurrency(totalValue, 'EUR')}
                    </StageTotal>
                  )}
                  <ChevronIcon theme={theme}>
                    {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  </ChevronIcon>
                </StageRight>
              </StageHeader>

              {isExpanded && (
                <DealsContainer>
                  {stageDeals.map(deal => (
                    <DealCard
                      key={deal.deal_id}
                      theme={theme}
                      onClick={() => onDealSelect?.(deal)}
                    >
                      <DealHeader>
                        <DealIcon theme={theme}>
                          <FaDollarSign size={14} />
                        </DealIcon>
                        <DealTitle theme={theme}>{deal.opportunity || 'Untitled Deal'}</DealTitle>
                      </DealHeader>

                      <DealMeta>
                        {deal.category && (
                          <CategoryBadge theme={theme}>{deal.category}</CategoryBadge>
                        )}
                        {deal.source_category && deal.source_category !== 'Not Set' && (
                          <SourceBadge $isIntro={deal.source_category === 'Introduction'}>
                            {deal.source_category === 'Introduction' ? 'Intro' : 'Cold'}
                          </SourceBadge>
                        )}
                        {formatDate(deal.proposed_at || deal.created_at) && (
                          <DateText theme={theme}>
                            {formatDate(deal.proposed_at || deal.created_at)}
                          </DateText>
                        )}
                      </DealMeta>

                      {deal.total_investment && (
                        <DealAmount $color={stageColor.color}>
                          {formatCurrency(deal.total_investment, deal.deal_currency)}
                        </DealAmount>
                      )}

                      {deal.description && (
                        <DealDescription theme={theme}>
                          {deal.description.length > 100 
                            ? deal.description.substring(0, 100) + '...' 
                            : deal.description}
                        </DealDescription>
                      )}

                      {/* Quick Actions for active deals */}
                      {['Lead', 'Evaluating', 'Qualified', 'Closing'].includes(stage) && onUpdateStage && (
                        <QuickActions>
                          <QuickAction
                            $type="invested"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStage(deal.deal_id, 'Invested');
                            }}
                          >
                            ✓ Invested
                          </QuickAction>
                          <QuickAction
                            $type="passed"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStage(deal.deal_id, 'Passed');
                            }}
                          >
                            ✗ Passed
                          </QuickAction>
                        </QuickActions>
                      )}
                    </DealCard>
                  ))}
                </DealsContainer>
              )}
            </StageSection>
          );
        })}
      </StagesList>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  background: ${props => props.$primary ? '#10B981' : (props.theme === 'light' ? '#F3F4F6' : '#374151')};
  color: ${props => props.$primary ? '#FFFFFF' : (props.theme === 'light' ? '#374151' : '#D1D5DB')};

  &:active {
    opacity: 0.9;
  }
`;

const StagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const StageSection = styled.div`
  margin-bottom: 4px;
`;

const StageHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border: none;
  cursor: pointer;
`;

const StageLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StageBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  background: ${props => props.$bg};
  color: ${props => props.$color};
`;

const StageCount = styled.span`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const StageRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StageTotal = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#059669' : '#34D399'};
`;

const ChevronIcon = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const DealsContainer = styled.div`
  padding: 8px 16px;
`;

const DealCard = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;

  &:active {
    opacity: 0.95;
  }
`;

const DealHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const DealIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#D1FAE5' : '#064E3B'};
  color: #10B981;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DealTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  flex: 1;
`;

const DealMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const CategoryBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
`;

const SourceBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => props.$isIntro ? '#FEE2E2' : '#DBEAFE'};
  color: ${props => props.$isIntro ? '#DC2626' : '#1D4ED8'};
`;

const DateText = styled.span`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

const DealAmount = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: ${props => props.$color || '#10B981'};
  margin-bottom: 8px;
`;

const DealDescription = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  line-height: 1.4;
  margin-bottom: 12px;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const QuickAction = styled.button`
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 40px;
  background: ${props => props.$type === 'invested' ? '#D1FAE5' : '#FEE2E2'};
  color: ${props => props.$type === 'invested' ? '#059669' : '#DC2626'};

  &:active {
    opacity: 0.8;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  height: 100%;
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
  margin: 0 0 20px 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: #10B981;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:active {
    opacity: 0.9;
  }
`;

export default MobileDealsView;
