import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';
import DataIntegrityTab from './DataIntegrityTab';

const WarningBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.theme === 'dark' ? '#1e3a5f' : '#EFF6FF'};
  border: 1px solid ${props => props.theme === 'dark' ? '#1E40AF' : '#BFDBFE'};
  border-radius: 6px;
  cursor: pointer;
  margin: 8px 12px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#1e4976' : '#DBEAFE'};
  }
`;

const WarningIcon = styled(FaExclamationCircle)`
  color: #3B82F6;
  font-size: 14px;
  flex-shrink: 0;
`;

const WarningText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'dark' ? '#93C5FD' : '#1D4ED8'};
  flex: 1;
`;

const WarningCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  background: #3B82F6;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#FFFFFF'};
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'dark' ? '#9CA3AF' : '#6B7280'};
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.theme === 'dark' ? '#374151' : '#F3F4F6'};
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

/**
 * DataIntegrityWarningBar - Shows a warning bar when there are data integrity issues
 *
 * Props:
 * - theme: 'dark' | 'light'
 * - issuesCount: number - total count of issues to display
 * - All props needed by DataIntegrityTab for the modal content
 */
const DataIntegrityWarningBar = ({
  theme = 'dark',
  // Data arrays for counting and display
  notInCrmEmails = [],
  notInCrmDomains = [],
  holdContacts = [],
  holdCompanies = [],
  incompleteContacts = [],
  incompleteCompanies = [],
  duplicateContacts = [],
  duplicateCompanies = [],
  missingCompanyLinks = [],
  contactsMissingCompany = [],
  suggestionsFromMessage = [],
  potentialCompanyMatches = [],
  // All other props passed to DataIntegrityTab
  ...dataIntegrityProps
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate total issues count
  const totalIssues = useMemo(() => {
    return (
      notInCrmEmails.length +
      notInCrmDomains.length +
      holdContacts.length +
      holdCompanies.length +
      incompleteContacts.length +
      incompleteCompanies.length +
      duplicateContacts.length +
      duplicateCompanies.length +
      missingCompanyLinks.length +
      contactsMissingCompany.length +
      suggestionsFromMessage.length +
      potentialCompanyMatches.length
    );
  }, [
    notInCrmEmails, notInCrmDomains, holdContacts, holdCompanies,
    incompleteContacts, incompleteCompanies, duplicateContacts, duplicateCompanies,
    missingCompanyLinks, contactsMissingCompany, suggestionsFromMessage, potentialCompanyMatches
  ]);

  // Don't render if no issues
  if (totalIssues === 0) {
    return null;
  }

  return (
    <>
      <WarningBar theme={theme} onClick={() => setIsModalOpen(true)}>
        <WarningIcon />
        <WarningText theme={theme}>
          {totalIssues} data {totalIssues === 1 ? 'issue' : 'issues'} found
        </WarningText>
        <WarningCount>{totalIssues}</WarningCount>
      </WarningBar>

      {isModalOpen && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalContainer theme={theme} onClick={e => e.stopPropagation()}>
            <ModalHeader theme={theme}>
              <ModalTitle theme={theme}>
                <FaExclamationCircle style={{ color: '#3B82F6' }} />
                Data Integrity Issues
              </ModalTitle>
              <CloseButton theme={theme} onClick={() => setIsModalOpen(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalContent>
              <DataIntegrityTab
                theme={theme}
                notInCrmEmails={notInCrmEmails}
                notInCrmDomains={notInCrmDomains}
                holdContacts={holdContacts}
                holdCompanies={holdCompanies}
                incompleteContacts={incompleteContacts}
                incompleteCompanies={incompleteCompanies}
                duplicateContacts={duplicateContacts}
                duplicateCompanies={duplicateCompanies}
                missingCompanyLinks={missingCompanyLinks}
                contactsMissingCompany={contactsMissingCompany}
                suggestionsFromMessage={suggestionsFromMessage}
                potentialCompanyMatches={potentialCompanyMatches}
                {...dataIntegrityProps}
              />
            </ModalContent>
          </ModalContainer>
        </ModalOverlay>
      )}
    </>
  );
};

export default DataIntegrityWarningBar;
