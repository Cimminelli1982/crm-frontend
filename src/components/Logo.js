import React from 'react';
import styled from 'styled-components';
import logoImage from '../logo.jpeg';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoImage = styled.img`
  height: ${props => props.size || '32px'};
  width: auto;
  object-fit: contain;
`;

const Logo = ({ isCollapsed = false, size = '32px' }) => {
  return (
    <LogoContainer>
      <LogoImage
        src={logoImage}
        alt="Cimminelli Logo"
        size={size}
      />
    </LogoContainer>
  );
};

export default Logo;