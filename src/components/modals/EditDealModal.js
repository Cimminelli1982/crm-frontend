import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiSave } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Configure Modal for React
try {
  Modal.setAppElement('#root');
} catch (error) {
  console.error('Error setting app element for Modal:', error);
}

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

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  border: none;
  background-color: ${props => props.primary ? '#00ff00' : '#333'};
  color: ${props => props.primary ? '#000' : '#fff'};
  
  &:hover {
    background-color: ${props => props.primary ? '#00cc00' : '#444'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Main component
const EditDealModal = ({ isOpen, onClose, deal }) => {
  // Add debugging logs
  console.log('EditDealModal component rendering with:', { 
    isOpen, 
    deal,
    dealId: deal?.deal_id,
    hasOnClose: !!onClose
  });
  
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
  
  // Log modal open/close
  useEffect(() => {
    if (isOpen) {
      console.log('EditDealModal is OPEN', { deal });
    } else {
      console.log('EditDealModal is CLOSED');
    }
  }, [isOpen, deal]);
  
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
      
      // Close the modal after successful update
      if (onClose) onClose();
    } catch (err) {
      console.error('Exception in deal update:', err);
      toast.error('An error occurred: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle direct close event
  const handleClose = () => {
    console.log('Close button clicked');
    if (onClose) onClose();
  };
  
  const modalStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 3000,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      background: '#222',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #333',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto',
      color: '#eee',
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={modalStyles}
      contentLabel="Edit Deal Modal"
      ariaHideApp={false} // Add this to prevent the warning
    >
      <ModalHeader>
        <Title>Edit Deal</Title>
        <CloseButton onClick={handleClose}>
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
              <Button type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" primary disabled={isLoading}>
                <FiSave />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </ButtonGroup>
          </form>
        )}
      </ContentContainer>
    </Modal>
  );
};

export default EditDealModal;