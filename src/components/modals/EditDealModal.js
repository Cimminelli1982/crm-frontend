import React, { useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';

// Configure Modal for React
Modal.setAppElement('#root');

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
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 200px;
`;

const ComingSoonText = styled.h3`
  color: #00ffff;
  font-size: 1.5rem;
  text-align: center;
  margin: 20px 0;
`;

const EditDealModal = ({ isOpen, onClose, deal }) => {
  console.log('New EditDealModal component rendering with:', { isOpen, deal });
  
  // Add useEffect for monitoring changes
  useEffect(() => {
    console.log('EditDealModal isOpen changed to:', isOpen);
    if (isOpen) {
      console.log('MODAL IS OPENING! Deal:', deal);
    }
  }, [isOpen, deal]);
  
  // Force render at the highest level
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('FORCING MODAL TO SHOW - isOpen =', isOpen);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        console.log('Modal close requested');
        if (onClose) onClose();
      }}
      contentLabel="Edit Deal Working Modal"
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
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
        },
      }}
    >
      <ModalHeader>
        <Title>Edit Deal Working Modal</Title>
        <CloseButton onClick={onClose}>
          <FiX />
        </CloseButton>
      </ModalHeader>
      
      <ContentContainer>
        <ComingSoonText>Coming Soon</ComingSoonText>
      </ContentContainer>
    </Modal>
  );
};

export default EditDealModal;