import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

/**
 * ActionSheet - Mobile bottom sheet component
 * Replaces the right panel on mobile devices
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the sheet is open
 * @param {function} props.onClose - Callback when sheet closes
 * @param {string} props.title - Optional title for the sheet
 * @param {React.ReactNode} props.children - Content to render inside
 * @param {string} props.theme - 'light' or 'dark'
 * @param {string} props.height - '50%' | '75%' | '90%' | 'auto' (default: '75%')
 */
const ActionSheet = ({
  isOpen,
  onClose,
  title,
  children,
  theme = 'dark',
  height = '75%'
}) => {
  // Close on escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <Overlay
        $isOpen={isOpen}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <Sheet
        $isOpen={isOpen}
        $height={height}
        theme={theme}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <Handle theme={theme} />
        {title && (
          <SheetHeader theme={theme}>
            <SheetTitle theme={theme}>{title}</SheetTitle>
            <CloseButton onClick={onClose} theme={theme}>
              <FaTimes />
            </CloseButton>
          </SheetHeader>
        )}
        <SheetContent>
          {children}
        </SheetContent>
      </Sheet>
    </>
  );
};

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

const Sheet = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${props => props.$height};
  max-height: 90vh;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  z-index: 1000;
  transform: translateY(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
`;

const Handle = styled.div`
  width: 40px;
  height: 4px;
  background: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 2px;
  margin: 12px auto 8px;
  flex-shrink: 0;
`;

const SheetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 16px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  flex-shrink: 0;
`;

const SheetTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const SheetContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export default ActionSheet;
