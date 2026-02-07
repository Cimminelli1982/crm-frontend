import {
  EmailItem,
  EmailSender,
  EmailSubject,
  EmailSnippet,
} from '../../../../pages/CommandCenterPage.styles';

const DealItem = ({ theme, deal, isSelected, onClick, categoryColor }) => {
  return (
    <EmailItem
      key={deal.deal_id}
      theme={theme}
      $selected={isSelected}
      onClick={onClick}
    >
      <EmailSender theme={theme}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {deal.deal_name || deal.opportunity}
        </span>
        {deal.category && (
          <span style={{
            marginLeft: '8px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            flexShrink: 0,
            backgroundColor: categoryColor,
            color: 'white'
          }}>
            {deal.category}
          </span>
        )}
      </EmailSender>
      <EmailSubject theme={theme} style={{ fontWeight: 600 }}>
        {deal.stage} {deal.total_investment ? `\u2022 ${deal.deal_currency || ''} ${Number(deal.total_investment).toLocaleString()}` : ''}
      </EmailSubject>
      <EmailSnippet theme={theme}>
        {new Date(deal.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </EmailSnippet>
    </EmailItem>
  );
};

export default DealItem;
