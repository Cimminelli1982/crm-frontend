import React from 'react';
import { FiDollarSign } from 'react-icons/fi';

const OpportunitiesIcon = ({ size = 24, className = '' }) => {
  return (
    <FiDollarSign 
      size={size} 
      className={className}
      style={{ color: '#66ff66' }}
    />
  );
};

export default OpportunitiesIcon; 