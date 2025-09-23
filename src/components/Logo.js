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
  const logoSrc = isCollapsed
    ? "https://assets.softr-files.com/applications/4612f2ab-9299-411a-b90c-78cfdc9b1a1b/assets/9f11c75a-a815-4686-9092-c9f8af95a4e1.jpeg"
    : "https://assets.softr-files.com/applications/4612f2ab-9299-411a-b90c-78cfdc9b1a1b/assets/9f11c75a-a815-4686-9092-c9f8af95a4e1.jpeg";

  return (
    <LogoContainer>
      <LogoImage
        src={logoSrc}
        alt={isCollapsed ? "Cimminelli Logo Small" : "Cimminelli Logo"}
        size={size}
      />
    </LogoContainer>
  );
};

export default Logo;