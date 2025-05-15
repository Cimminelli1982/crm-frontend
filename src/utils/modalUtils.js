/**
 * Utility for directly creating and managing modals
 */

import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Creates a modal without relying on component state
 */
export function createDirectModal(ModalComponent, props) {
  // Create container
  const modalContainer = document.createElement('div');
  modalContainer.className = 'direct-modal-container';
  document.body.appendChild(modalContainer);

  // Function to remove the modal
  const removeModal = () => {
    if (document.body.contains(modalContainer)) {
      // Simple DOM removal
      document.body.removeChild(modalContainer);
    }
  };

  // Create enhanced props with close handler
  const enhancedProps = {
    ...props,
    onClose: () => {
      // Call original onClose if it exists
      if (props.onClose) {
        props.onClose();
      }
      
      // Remove the container
      removeModal();
    }
  };

  // Use React createPortal to render
  const render = () => {
    const modalElement = React.createElement(ModalComponent, enhancedProps);
    const portal = createPortal(modalElement, modalContainer);
    
    // In React 18, we need to use ReactDOM.createRoot, but for simplicity
    // and to avoid complex imports, we just use document.body.appendChild to
    // add the container, and React's createPortal to render into it
    return portal;
  };

  // Return functions to manage the modal
  return {
    open: render,
    close: removeModal
  };
}