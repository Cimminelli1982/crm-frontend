import {
  EmailList,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaCheckCircle } from 'react-icons/fa';
import CollapsibleSection from './CollapsibleSection';
import DataQualityContactItem from './items/DataQualityContactItem';

const SECTIONS = [
  { key: 'b', title: 'Needs Input', variant: 'warning' },
  { key: 'c', title: 'Fixable', variant: 'default' },
  { key: 'a', title: 'Review', variant: 'success' },
];

const DataQualityLeftContent = ({
  theme,
  dqContacts,
  dqLoading,
  selectedDqContact,
  onSelectContact,
  dqSections,
  toggleDqSection,
  filterByBucket,
}) => {
  return (
    <EmailList>
      {dqLoading ? (
        <EmptyState theme={theme}>Loading...</EmptyState>
      ) : dqContacts.length === 0 ? (
        <EmptyState theme={theme}>
          <FaCheckCircle size={40} style={{ marginBottom: '16px', opacity: 0.5, color: '#10B981' }} />
          <span>All contacts processed!</span>
        </EmptyState>
      ) : (
        SECTIONS.map(({ key, title, variant }) => {
          const items = filterByBucket(dqContacts, key);
          if (items.length === 0) return null;
          return (
            <CollapsibleSection
              key={key}
              theme={theme}
              title={title}
              count={items.length}
              isOpen={dqSections[key]}
              onToggle={() => toggleDqSection(key)}
              variant={variant}
            >
              {items.map(contact => (
                <DataQualityContactItem
                  key={contact.id}
                  theme={theme}
                  contact={contact}
                  isSelected={selectedDqContact?.id === contact.id}
                  onClick={() => onSelectContact(contact)}
                />
              ))}
            </CollapsibleSection>
          );
        })
      )}
    </EmailList>
  );
};

export default DataQualityLeftContent;
