import React from 'react';
import styled from 'styled-components';

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
  const logoSrc = `${process.env.PUBLIC_URL}/logo.jpeg`;

  return (
    <LogoContainer>
      <LogoImage
        src={logoSrc}
        alt="Cimminelli Logo"
        size={size}
      />
    </LogoContainer>
  );
};

export default Logo;