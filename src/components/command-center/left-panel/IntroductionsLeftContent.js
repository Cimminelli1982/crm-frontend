import {
  EmailList,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaHandshake } from 'react-icons/fa';
import CollapsibleSection from './CollapsibleSection';
import IntroductionItem from './items/IntroductionItem';

const IntroductionsLeftContent = ({
  theme,
  introductionsList,
  introductionsLoading,
  selectedIntroductionItem,
  setSelectedIntroductionItem,
  introductionsSections,
  setIntroductionsSections,
  filterIntroductionsBySection,
}) => {
  const sectionConfigs = [
    { key: 'inbox', title: 'Inbox', variant: 'danger' },
    { key: 'monitoring', title: 'Monitoring', variant: 'warning' },
    { key: 'closed', title: 'Closed', variant: 'default' },
  ];

  return (
    <EmailList>
      {introductionsLoading ? (
        <EmptyState theme={theme}>Loading...</EmptyState>
      ) : introductionsList.length === 0 ? (
        <EmptyState theme={theme}>
          <FaHandshake size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <span>No introductions yet</span>
        </EmptyState>
      ) : (
        sectionConfigs.map(({ key, title, variant }) => (
          <CollapsibleSection
            key={key}
            theme={theme}
            title={title}
            count={filterIntroductionsBySection(introductionsList, key).length}
            isOpen={introductionsSections[key]}
            onToggle={() => setIntroductionsSections(prev => ({ ...prev, [key]: !prev[key] }))}
            variant={variant}
          >
            {filterIntroductionsBySection(introductionsList, key).map(intro => (
              <IntroductionItem
                key={intro.introduction_id}
                theme={theme}
                intro={intro}
                isSelected={selectedIntroductionItem?.introduction_id === intro.introduction_id}
                onClick={() => setSelectedIntroductionItem(intro)}
              />
            ))}
          </CollapsibleSection>
        ))
      )}
    </EmailList>
  );
};

export default IntroductionsLeftContent;
