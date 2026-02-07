import {
  SearchContainer,
  SearchInputWrapper,
  SearchInput,
  ClearSearchButton,
} from '../../../pages/CommandCenterPage.styles';
import { FaSearch, FaTimes } from 'react-icons/fa';

const LeftPanelSearch = ({ theme, placeholder, value, onChange, onClear }) => {
  return (
    <SearchContainer theme={theme}>
      <SearchInputWrapper theme={theme}>
        <FaSearch size={14} style={{ color: theme === 'light' ? '#9CA3AF' : '#6B7280', flexShrink: 0 }} />
        <SearchInput
          theme={theme}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <ClearSearchButton theme={theme} onClick={onClear}>
            <FaTimes size={12} />
          </ClearSearchButton>
        )}
      </SearchInputWrapper>
    </SearchContainer>
  );
};

export default LeftPanelSearch;
