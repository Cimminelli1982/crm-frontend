import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

export const ModalContainer = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  padding: 14px 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  flex-shrink: 0;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
`;

export const FileName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SizeBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  flex-shrink: 0;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  flex-shrink: 0;
  margin-left: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
    color: ${props => props.theme === 'light' ? '#374151' : '#F9FAFB'};
  }
`;

export const ModalBody = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#111827'};
  min-height: 300px;
`;

export const PreviewImage = styled.img`
  max-width: 100%;
  max-height: calc(90vh - 130px);
  object-fit: contain;
`;

export const PreviewIframe = styled.iframe`
  width: 100%;
  height: calc(90vh - 130px);
  border: none;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 14px;
`;

export const Spinner = styled.div`
  border: 3px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  border-top: 3px solid #3B82F6;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  animation: ${spin} 0.8s linear infinite;
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  font-size: 14px;
`;

export const ModalFooter = styled.div`
  padding: 12px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  flex-shrink: 0;
`;

export const FooterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$primary ? `
    background: #10B981;
    color: white;
    border: none;
    &:hover { background: #059669; }
  ` : `
    background: ${props.theme === 'light' ? '#FFFFFF' : '#374151'};
    color: ${props.theme === 'light' ? '#374151' : '#E5E7EB'};
    border: 1px solid ${props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
    &:hover { background: ${props.theme === 'light' ? '#F9FAFB' : '#4B5563'}; }
  `}
`;
