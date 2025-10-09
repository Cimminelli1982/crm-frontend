import styled from 'styled-components';

// Modal Components
export const ModalContent = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 12px;
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  }
`;

export const ModalBody = styled.div``;

// Tab Components
export const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 500px;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
`;

export const TabButton = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover {
    background: ${props => props.$active
      ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
      : (props.theme === 'light' ? '#F9FAFB' : '#374151')
    };
    color: ${props => props.$active
      ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
      : (props.theme === 'light' ? '#4B5563' : '#D1D5DB')
    };
  }
`;

export const TabContent = styled.div`
  height: 460px;
  overflow-y: auto;
  padding: 20px 20px 0 20px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
    border-radius: 3px;
  }
`;

// Form Components
export const FormGroup = styled.div`
  margin-bottom: 20px;
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

export const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

// Section Components
export const Section = styled.div`
  margin-bottom: 32px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const SectionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

// List Components
export const ListContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  font-size: 14px;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
`;

export const ListItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: ${props =>
    props.$first ? '6px 6px 0 0' :
    props.$last ? '0 0 6px 6px' : '0'
  };
`;

export const ItemText = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  text-align: center;
  gap: 8px;
`;

// Button Components
export const AddItemRow = styled.div`
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const AddButton = styled.button`
  padding: 10px 16px;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const DeleteButton = styled.button`
  padding: 4px;
  background-color: transparent;
  color: #EF4444;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background-color: #FEE2E2;
  }
`;

export const SetPrimaryButton = styled.button`
  padding: 4px 6px;
  background-color: transparent;
  color: #10B981;
  border: 1px solid #10B981;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;

  &:hover {
    background-color: #10B981;
    color: white;
  }
`;

export const ManageButton = styled.button`
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background: #2563EB;
  }
`;

export const SaveButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #3B82F6;
  color: #FFFFFF;
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #2563EB;
  }
`;

export const ClearButton = styled.button`
  padding: 4px 6px;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.theme === 'light' ? '#EF4444' : '#DC2626'};
  color: #FFFFFF;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-weight: 500;

  &:hover {
    background-color: ${props => props.theme === 'light' ? '#DC2626' : '#B91C1C'};
  }
`;

// Badge Components
export const PrimaryBadge = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background-color: #10B981;
  color: white;
  border-radius: 10px;
  font-weight: 600;
`;

// Company Components
export const CompaniesContainer = styled.div`
  padding: 16px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  font-size: 14px;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
`;

export const CompanyItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 4px;
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

export const CompanyName = styled.div`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CompanyFieldGroup = styled.div`
  margin-top: 8px;
  margin-bottom: 4px;
`;

export const CompanyFieldLabel = styled.label`
  font-size: 10px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin-bottom: 2px;
  display: block;
`;

export const CompanySelect = styled.select`
  width: 100%;
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 4px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-family: inherit;
  cursor: pointer;
`;

// Tag Components
export const TagsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 6px;
  background-color: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  font-size: 14px;
  min-height: 100px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
`;

export const TagItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

export const TagDeleteButton = styled.button`
  padding: 2px;
  background-color: transparent;
  color: #EF4444;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #FEE2E2;
  }
`;

// Action Buttons
export const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-radius: 0 0 12px 12px;
  margin: 0;
`;

// Toggle Switch
export const ToggleSwitch = styled.button`
  position: relative;
  width: 48px;
  height: 24px;
  background-color: ${props => props.$checked ? '#3B82F6' :
    (props.theme === 'light' ? '#D1D5DB' : '#4B5563')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 2px;

  &:hover {
    background-color: ${props => props.$checked ? '#2563EB' :
      (props.theme === 'light' ? '#9CA3AF' : '#6B7280')};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A8A'};
  }
`;

export const ToggleSlider = styled.div`
  position: absolute;
  top: 2px;
  left: ${props => props.$checked ? '26px' : '2px'};
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 10px;
  transition: left 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;