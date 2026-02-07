import {
  EmailList,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaDollarSign } from 'react-icons/fa';
import CollapsibleSection from './CollapsibleSection';
import DealItem from './items/DealItem';

const DEAL_SECTION_COLORS = {
  open: null, // uses getDealCategoryColor
  monitoring: '#F59E0B',
  invested: '#10B981',
  closed: '#6B7280',
};

const DealsLeftContent = ({
  theme,
  pipelineDeals,
  selectedPipelineDeal,
  setSelectedPipelineDeal,
  dealsLoading,
  dealsSections,
  toggleDealsSection,
  filterDealsByStatus,
  getDealCategoryColor,
}) => {
  const sections = ['open', 'monitoring', 'invested', 'closed'];
  const titles = { open: 'Open', monitoring: 'Monitoring', invested: 'Invested', closed: 'Closed' };

  return (
    <EmailList>
      {dealsLoading ? (
        <EmptyState theme={theme}>Loading...</EmptyState>
      ) : pipelineDeals.length === 0 ? (
        <EmptyState theme={theme}>
          <FaDollarSign size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <span>No deals found</span>
        </EmptyState>
      ) : (
        sections.map(sectionKey => (
          <CollapsibleSection
            key={sectionKey}
            theme={theme}
            title={titles[sectionKey]}
            count={filterDealsByStatus(pipelineDeals, sectionKey).length}
            isOpen={dealsSections[sectionKey]}
            onToggle={() => toggleDealsSection(sectionKey)}
          >
            {filterDealsByStatus(pipelineDeals, sectionKey).map(deal => (
              <DealItem
                key={deal.deal_id}
                theme={theme}
                deal={deal}
                isSelected={selectedPipelineDeal?.deal_id === deal.deal_id}
                onClick={() => setSelectedPipelineDeal(deal)}
                categoryColor={sectionKey === 'open' ? getDealCategoryColor(deal.category) : DEAL_SECTION_COLORS[sectionKey]}
              />
            ))}
          </CollapsibleSection>
        ))
      )}
    </EmailList>
  );
};

export default DealsLeftContent;
