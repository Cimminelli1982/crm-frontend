import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiSave } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Styled components
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
`;

const ModalContainer = styled.div`
  background: #222;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #333;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
  color: #eee;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.4rem;
  color: #00ff00;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ccc;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #fff;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #aaa;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    border-color: #00ff00;
    outline: none;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    border-color: #00ff00;
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 10px;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    border-color: #00ff00;
    outline: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

// Create two separate button components to avoid the "primary" prop warning
const BaseButton = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  border: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(BaseButton)`
  background-color: #333;
  color: #fff;
  
  &:hover {
    background-color: #444;
  }
`;

const PrimaryButton = styled(BaseButton)`
  background-color: #00ff00;
  color: #000;
  
  &:hover {
    background-color: #00cc00;
  }
`;

// Main component
const DirectEditDealModal = ({ onClose, deal, onUpdate }) => {
  console.log('DirectEditDealModal rendering with deal:', deal);

  // Setup form state
  const [formData, setFormData] = useState({
    name: '',
    stage: '',
    category: '',
    source: '',
    value: '',
    description: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Stage options - using the database enum values
  const dealStages = [
    'Lead', 'Evaluating', 'Closing', 'Invested', 'Monitoring', 'Passed'
  ];
  
  // Category options - using the database enum values
  const dealCategories = [
    'Inbox', 'Startup', 'Fund', 'Real Estate', 'Private Debt', 'Private Equity', 'Other'
  ];
  
  // Source options - using the database enum values
  const dealSourceCategories = [
    'Not Set', 'Cold Contacting', 'Introduction'
  ];
  
  // Initialize form with deal data when the deal changes
  useEffect(() => {
    if (deal) {
      console.log('Setting form data from deal:', deal);
      setFormData({
        name: deal.opportunity || '',
        stage: deal.stage || 'Lead',
        category: deal.category || 'Inbox',
        source: deal.source_category || 'Not Set',
        value: deal.total_investment ? String(deal.total_investment) : '',
        description: deal.description || ''
      });
    }
  }, [deal]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!deal || !deal.deal_id) {
      toast.error('No deal selected for editing');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare the data for update
      const updateData = {
        opportunity: formData.name,
        stage: formData.stage, 
        category: formData.category, 
        source_category: formData.source,
        total_investment: formData.value ? parseFloat(formData.value) : null,
        description: formData.description,
        last_modified_at: new Date().toISOString(),
        last_modified_by: 'User'
      };
      
      console.log('Updating deal with data:', updateData);
      
      const { data, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('deal_id', deal.deal_id)
        .select();
      
      if (error) {
        console.error('Error updating deal:', error);
        toast.error('Failed to update deal: ' + error.message);
        return;
      }
      
      console.log('Deal updated successfully:', data);
      toast.success('Deal updated successfully');
      
      // Call onUpdate callback
      if (onUpdate) onUpdate();
      
      // Close the modal after successful update
      if (onClose) onClose();
    } catch (err) {
      console.error('Exception in deal update:', err);
      toast.error('An error occurred: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close with ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (onClose) onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (onClose) onClose();
    }
  };

  return (
    <ModalBackdrop onClick={handleBackdropClick}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <Title>Edit Deal</Title>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <ContentContainer>
          {!deal ? (
            <div>No deal selected for editing</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Deal Name</Label>
                <Input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <FormGroup>
                  <Label>Stage</Label>
                  <Select name="stage" value={formData.stage} onChange={handleChange}>
                    {dealStages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>Value</Label>
                  <Input 
                    type="number" 
                    name="value" 
                    value={formData.value} 
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="Deal value"
                  />
                </FormGroup>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <FormGroup>
                  <Label>Category</Label>
                  <Select name="category" value={formData.category} onChange={handleChange}>
                    {dealCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>Source</Label>
                  <Select name="source" value={formData.source} onChange={handleChange}>
                    {dealSourceCategories.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </Select>
                </FormGroup>
              </div>
              
              <FormGroup>
                <Label>Description</Label>
                <TextArea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange}
                  placeholder="Deal description"
                />
              </FormGroup>
              
              <ButtonGroup>
                <SecondaryButton type="button" onClick={onClose}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isLoading}>
                  <FiSave />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </PrimaryButton>
              </ButtonGroup>
            </form>
          )}
        </ContentContainer>
      </ModalContainer>
    </ModalBackdrop>
  );
};

export default DirectEditDealModal;