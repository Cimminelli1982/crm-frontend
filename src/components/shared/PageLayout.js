import styled from 'styled-components';
import { FaSync } from 'react-icons/fa';

// Shared Page Layout Components
export const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
  transition: background-color 0.3s ease;
`;

export const PageView = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const PageHeader = styled.div`
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 24px 20px 24px 20px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

export const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto 20px auto;
`;

export const HeaderText = styled.div`
  flex: 1;
`;

export const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0 0 8px 0;
`;

export const PageSubtitle = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
  font-size: 16px;
`;

export const RefreshButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$isRefreshing && `
    svg {
      animation: spin 1s linear infinite;
    }
  `}

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  &:hover {
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export const FilterTabs = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 1200px;
  margin: 20px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  border-radius: 12px;
  padding: 6px;
  width: fit-content;
  box-shadow: ${props => props.theme === 'light'
    ? '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
    : '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)'
  };
`;

export const FilterTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  font-size: 15px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: fit-content;
  white-space: nowrap;
  position: relative;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)'
        : '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    transform: translateY(-1px);
    box-shadow: ${props => props.theme === 'light'
      ? '0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
      : '0 2px 8px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active {
    transform: translateY(0);
  }
`;

export const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

export const SubMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  max-width: 90%;
  margin: 15px auto 0 auto;
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  padding: 4px;
  width: fit-content;
  flex-wrap: wrap;

  @media (max-width: 1024px) {
    max-width: 95%;
    gap: 1px;
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    max-width: 100%;
  }
`;

export const SubTab = styled.button`
  background: ${props => props.$active
    ? (props.theme === 'light' ? '#FFFFFF' : '#1F2937')
    : 'transparent'
  };
  color: ${props => props.$active
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
  };
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: fit-content;
  white-space: nowrap;
  box-shadow: ${props => props.$active
    ? (props.theme === 'light'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '0 1px 2px rgba(0, 0, 0, 0.3)')
    : 'none'
  };

  &:hover {
    background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    box-shadow: ${props => props.theme === 'light'
      ? '0 1px 3px rgba(0, 0, 0, 0.12)'
      : '0 1px 3px rgba(0, 0, 0, 0.4)'
    };
  }

  &:active {
    transform: scale(0.98);
  }
`;