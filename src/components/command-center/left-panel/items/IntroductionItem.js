import {
  EmailItem,
  EmailSender,
  EmailSubject,
  EmailSnippet,
} from '../../../../pages/CommandCenterPage.styles';
import { FaHandshake } from 'react-icons/fa';

const STATUS_BADGE_STYLES = {
  'Requested': { background: '#FEE2E2', color: '#DC2626' },
  'Promised': { background: '#FEE2E2', color: '#DC2626' },
  'Done, but need to monitor': { background: '#FEF3C7', color: '#92400E' },
  'Done & Dust': { background: '#D1FAE5', color: '#065F46' },
  'Aborted': { background: '#7F1D1D', color: '#FCA5A5' },
};

const IntroductionItem = ({ theme, intro, isSelected, onClick }) => {
  const introducees = intro.contacts?.filter(c => c.role === 'introducee') || [];
  const person1 = introducees[0]?.name || 'Unknown';
  const person2 = introducees[1]?.name || 'Unknown';
  const badgeStyle = STATUS_BADGE_STYLES[intro.status] || STATUS_BADGE_STYLES['Aborted'];

  return (
    <EmailItem
      key={intro.introduction_id}
      theme={theme}
      $selected={isSelected}
      onClick={onClick}
    >
      <EmailSender theme={theme}>
        <FaHandshake style={{ color: '#F59E0B', marginRight: '6px' }} size={12} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person1} {'\u2194'} {person2}
        </span>
      </EmailSender>
      <EmailSubject theme={theme}>
        <span style={{
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: 500,
          background: badgeStyle.background,
          color: badgeStyle.color
        }}>
          {intro.status}
        </span>
      </EmailSubject>
      <EmailSnippet theme={theme}>
        {intro.introduction_tool} {'\u2022'} {intro.created_at ? new Date(intro.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
      </EmailSnippet>
    </EmailItem>
  );
};

export default IntroductionItem;
