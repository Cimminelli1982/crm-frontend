import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { 
  FiX, 
  FiSave, 
  FiDollarSign, 
  FiTag, 
  FiInfo, 
  FiAlertTriangle,
  FiCheck,
  FiList,
  FiActivity,
  FiCalendar,
  FiPlus
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Setup Modal for React
Modal.setAppElement('#root');

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;

  h2 {
    color: #00ff00;
    margin: 0;
    font-size: 1.2rem;
    font-family: 'Courier New', monospace;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #00cc00;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding: 0 15px;
  max-height: calc(100% - 130px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  color: #00ff00;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    opacity: 0.8;
  }
`;

// Base styles for all form controls to ensure consistent sizing
const formControlStyles = `
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #ccc;
  padding: 10px 12px;
  font-size: 14px;
  width: 100%;
  height: 42px; /* Fixed height for consistent appearance */
  box-sizing: border-box;
  
  &:focus {
    border-color: #00ff00;
    outline: none;
    box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.3);
  }
  
  &::placeholder {
    color: #555;
  }
`;

const FormInput = styled.input`
  ${formControlStyles}
  
  &:disabled {
    background-color: #222;
    color: #666;
    cursor: not-allowed;
  }
`;

const FormSelect = styled.select`
  ${formControlStyles}
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2300ff00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px; /* Make room for the dropdown arrow */
  
  option {
    background-color: #1a1a1a;
    color: #ccc;
  }
`;

const FormTextarea = styled.textarea`
  ${formControlStyles}
  min-height: 100px;
  height: auto;
  resize: vertical;
`;

const ErrorMessage = styled.div`
  color: #ff5555;
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    flex-shrink: 0;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const Tag = styled.div`
  background-color: rgba(0, 255, 0, 0.1);
  color: #00ff00;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  
  button {
    background: none;
    border: none;
    color: #ff5555;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 3px;
    
    &:hover {
      color: #ff0000;
    }
  }
`;

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const AddTagButton = styled.button`
  background-color: transparent;
  color: #00ff00;
  border: 1px dashed #00ff00;
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.05);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px 0;
  border-top: 1px solid #333;
  margin-top: 20px;
`;

const SaveButton = styled.button`
  background-color: rgba(0, 255, 0, 0.1);
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: rgba(0, 255, 0, 0.05);
    &:hover {
      box-shadow: none;
    }
  }
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: #cccccc;
  border: 1px solid #555;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background-color: #333;
  }
`;

const FormRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
  
  > div {
    flex: 1;
    min-width: 0; /* Prevents flex children from overflowing */
  }
`;

const SectionTitle = styled.div`
  font-size: 15px;
  color: #00ff00;
  margin: 15px 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 8px;
  }
`;

const HelpText = styled.div`
  color: #888;
  font-size: 12px;
  margin-top: 4px;
  font-style: italic;
`;

const EditDealFinalModal = ({
  isOpen,
  onClose,
  dealData,
  onSave
}) => {
  // Form state
  const [formData, setFormData] = useState({
    opportunity: '',
    source_category: 'Not Set',
    category: 'Inbox',
    stage: 'Lead',
    description: '',
    total_investment: '',
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Tags state (placeholder - would be populated from the database)
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  
  // Deal category options
  const categoryOptions = [
    'Inbox', 
    'Startup', 
    'Fund', 
    'Real Estate', 
    'Private Debt', 
    'Private Equity', 
    'Other'
  ];
  
  // Deal stage options
  const stageOptions = [
    'Lead', 
    'Evaluating', 
    'Closing', 
    'Invested', 
    'Monitoring', 
    'Passed'
  ];
  
  // Deal source category options
  const sourceOptions = [
    'Not Set',
    'Cold Contacting',
    'Introduction'
  ];
  
  // Load deal data into form when modal opens
  useEffect(() => {
    if (dealData) {
      setFormData({
        opportunity: dealData.opportunity || '',
        source_category: dealData.source_category || 'Not Set',
        category: dealData.category || 'Inbox',
        stage: dealData.stage || 'Lead',
        description: dealData.description || '',
        total_investment: dealData.total_investment ? String(dealData.total_investment) : '',
      });
      
      // Reset errors
      setErrors({});
    }
  }, [dealData, isOpen]);
  
  // Form change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Opportunity is required
    if (!formData.opportunity.trim()) {
      newErrors.opportunity = 'Deal name is required';
    }
    
    // Total investment must be a valid number or empty
    if (formData.total_investment && isNaN(Number(formData.total_investment))) {
      newErrors.total_investment = 'Investment amount must be a valid number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for submission
      const updatedDeal = {
        ...dealData,
        opportunity: formData.opportunity,
        source_category: formData.source_category,
        category: formData.category,
        stage: formData.stage,
        description: formData.description,
        total_investment: formData.total_investment ? Number(formData.total_investment) : null,
        last_modified_at: new Date().toISOString(),
        last_modified_by: 'User'
      };
      
      // Update deal in database
      const { supabase } = await import('../../lib/supabaseClient');
      
      const { error } = await supabase
        .from('deals')
        .update(updatedDeal)
        .eq('deal_id', dealData.deal_id);
      
      if (error) {
        throw error;
      }
      
      // Show success message
      toast.success('Deal updated successfully');
      
      // Call onSave callback with updated deal
      if (onSave) {
        onSave(updatedDeal);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast.error(`Failed to update deal: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle key press in tag input
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '25px',
          width: '805px', /* 700px increased by 15% */
          maxWidth: '90%',
          maxHeight: '85vh',
          backgroundColor: '#121212',
          border: '1px solid #333',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          color: '#e0e0e0',
          zIndex: 1001,
          overflow: 'hidden'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <ModalHeader>
        <h2>Edit Deal</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <SaveButton 
            onClick={handleSubmit}
            disabled={isLoading}
            style={{ padding: '5px 10px', height: 'auto' }}
          >
            {isLoading ? 'Saving...' : <FiSave />}
          </SaveButton>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </div>
      </ModalHeader>
      
      <FormContainer>
        <SectionTitle>
          <FiInfo size={16} /> Basic Information
        </SectionTitle>
        
        <FormGroup>
          <FormLabel htmlFor="opportunity">
            <FiInfo size={14} /> Deal Name
          </FormLabel>
          <FormInput
            id="opportunity"
            name="opportunity"
            value={formData.opportunity}
            onChange={handleInputChange}
            placeholder="Enter deal name"
          />
          {errors.opportunity && (
            <ErrorMessage>
              <FiAlertTriangle size={12} /> {errors.opportunity}
            </ErrorMessage>
          )}
        </FormGroup>
        
        <FormRow>
          <FormGroup>
            <FormLabel htmlFor="category">
              <FiList size={14} /> Category
            </FormLabel>
            <FormSelect
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              {categoryOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
          
          <FormGroup>
            <FormLabel htmlFor="stage">
              <FiActivity size={14} /> Stage
            </FormLabel>
            <FormSelect
              id="stage"
              name="stage"
              value={formData.stage}
              onChange={handleInputChange}
            >
              {stageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
        </FormRow>
        
        <FormRow>
          <FormGroup>
            <FormLabel htmlFor="source_category">
              <FiCalendar size={14} /> Source
            </FormLabel>
            <FormSelect
              id="source_category"
              name="source_category"
              value={formData.source_category}
              onChange={handleInputChange}
            >
              {sourceOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
          
          <FormGroup>
            <FormLabel htmlFor="total_investment">
              <FiDollarSign size={14} /> Investment Amount
            </FormLabel>
            <FormInput
              id="total_investment"
              name="total_investment"
              value={formData.total_investment}
              onChange={handleInputChange}
              placeholder="Enter investment amount"
              type="text"
            />
            {errors.total_investment && (
              <ErrorMessage>
                <FiAlertTriangle size={12} /> {errors.total_investment}
              </ErrorMessage>
            )}
            <HelpText>Enter numeric value only (no currency symbols)</HelpText>
          </FormGroup>
        </FormRow>
        
        <FormGroup>
          <FormLabel htmlFor="description">
            <FiInfo size={14} /> Description
          </FormLabel>
          <FormTextarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter description"
          />
        </FormGroup>
        
        <SectionTitle>
          <FiTag size={16} /> Tags
        </SectionTitle>
        
        <FormGroup>
          <FormLabel>Deal Tags</FormLabel>
          <TagsContainer>
            {tags.map(tag => (
              <Tag key={tag}>
                {tag}
                <button onClick={() => handleRemoveTag(tag)}>
                  <FiX size={12} />
                </button>
              </Tag>
            ))}
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <div style={{ flex: '1' }}>
                <FormInput
                  placeholder="Add new tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                />
              </div>
              <AddTagButton onClick={handleAddTag}>
                <PlusIcon /> Add
              </AddTagButton>
            </div>
          </TagsContainer>
          <HelpText>Press Enter to add a tag</HelpText>
        </FormGroup>
      </FormContainer>
      
      <ButtonGroup>
        <CancelButton onClick={onClose}>
          <FiX /> Cancel
        </CancelButton>
        <SaveButton 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (
            <>
              <FiSave /> Save Changes
            </>
          )}
        </SaveButton>
      </ButtonGroup>
    </Modal>
  );
};

export default EditDealFinalModal;