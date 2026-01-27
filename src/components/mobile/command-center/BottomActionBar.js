import React from 'react';
import styled from 'styled-components';
import {
  FaArrowLeft,
  FaPlus,
  FaEllipsisH,
  FaPen,
  FaReply,
  FaCheck,
} from 'react-icons/fa';

/**
 * Primary action icons by tab
 */
const PRIMARY_ACTIONS = {
  email: { icon: FaPen, label: 'Compose' },
  whatsapp: { icon: FaPen, label: 'New Message' },
  calendar: { icon: FaPlus, label: 'New Event' },
  tasks: { icon: FaPlus, label: 'New Task' },
  deals: { icon: FaPlus, label: 'New Deal' },
  keepintouch: { icon: FaCheck, label: 'Mark Done' },
  introductions: { icon: FaPlus, label: 'New Intro' },
  notes: { icon: FaPlus, label: 'New Note' },
  lists: { icon: FaPlus, label: 'New List' },
};

/**
 * BottomActionBar - Fixed bottom bar for mobile
 * Shows back button, primary action FAB, and more actions
 *
 * @param {Object} props
 * @param {string} props.activeTab - Current tab for context-aware primary action
 * @param {boolean} props.showBack - Whether to show back button
 * @param {function} props.onBack - Callback for back button
 * @param {function} props.onPrimaryAction - Callback for primary action (compose, new, etc.)
 * @param {function} props.onMoreActions - Callback to open ActionSheet
 * @param {string} props.theme - 'light' or 'dark'
 * @param {boolean} props.hasSelection - Whether something is selected (shows reply instead of compose for email)
 */
const BottomActionBar = ({
  activeTab,
  showBack = false,
  onBack,
  onPrimaryAction,
  onMoreActions,
  theme = 'dark',
  hasSelection = false,
}) => {
  const primaryAction = PRIMARY_ACTIONS[activeTab] || PRIMARY_ACTIONS.email;

  // For email with selection, show Reply instead of Compose
  const displayIcon = (activeTab === 'email' && hasSelection)
    ? FaReply
    : primaryAction.icon;

  const displayLabel = (activeTab === 'email' && hasSelection)
    ? 'Reply'
    : primaryAction.label;

  return (
    <Container theme={theme}>
      {/* Left: Back button or spacer */}
      <LeftSection>
        {showBack ? (
          <ActionButton onClick={onBack} theme={theme} aria-label="Back">
            <FaArrowLeft size={20} />
          </ActionButton>
        ) : (
          <Spacer />
        )}
      </LeftSection>

      {/* Center: Primary Action FAB */}
      <CenterSection>
        <PrimaryButton onClick={onPrimaryAction} aria-label={displayLabel}>
          {React.createElement(displayIcon, { size: 24 })}
        </PrimaryButton>
      </CenterSection>

      {/* Right: More Actions */}
      <RightSection>
        <ActionButton onClick={onMoreActions} theme={theme} aria-label="More actions">
          <FaEllipsisH size={20} />
        </ActionButton>
      </RightSection>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  position: fixed;
  bottom: 70px; /* Above app's bottom navigation */
  left: 0;
  right: 0;
  height: 56px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
`;

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-start;
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const RightSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-end;
`;

const Spacer = styled.div`
  width: 44px;
  height: 44px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  transition: all 0.2s ease;

  &:active {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    transform: scale(0.95);
  }
`;

const PrimaryButton = styled.button`
  background: #3B82F6;
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 24px;
  color: #FFFFFF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }
`;

export default BottomActionBar;
