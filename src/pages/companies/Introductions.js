import React, { useState } from 'react';
import styled from 'styled-components';
import { FiSearch } from 'react-icons/fi';

// Styled components - exact same as SimpleDeals
const Container = styled.div`
  padding: 0;
  height: calc(100vh - 120px);
  width: 100%;
`;

const SearchBarContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 20px;
  gap: 10px;
`;

const DealSearchInput = styled.input`
  background-color: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px 8px 40px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  width: 300px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #666;
  }
  
  &::placeholder {
    color: #666;
    font-style: normal;
    text-transform: uppercase;
  }
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIconInside = styled.div`
  position: absolute;
  left: 12px;
  color: #00ff00;
  display: flex;
  align-items: center;
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
`;

// Main component
const Introductions = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Container>
      {/* Search Bar - exact same as SimpleDeals */}
      <SearchBarContainer>
        <SearchInputContainer>
          <SearchIconInside>
            <FiSearch />
          </SearchIconInside>
          <DealSearchInput
            type="text"
            placeholder="SEARCH..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInputContainer>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00ff00',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px'
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </SearchBarContainer>
    </Container>
  );
};

export default Introductions; 