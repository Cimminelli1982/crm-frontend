import {
  EmailListPanel,
  ListHeader,
  CollapseButton,
  PendingCount,
} from '../../../pages/CommandCenterPage.styles';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const LeftPanelShell = ({
  theme,
  collapsed,
  setCollapsed,
  headerActions,
  searchBar,
  counter,
  children,
}) => {
  return (
    <EmailListPanel theme={theme} $collapsed={collapsed}>
      <ListHeader theme={theme}>
        {!collapsed && headerActions}
        <CollapseButton theme={theme} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </CollapseButton>
      </ListHeader>

      {!collapsed && searchBar}

      {!collapsed && children}

      {!collapsed && counter && (
        <PendingCount theme={theme}>
          {counter}
        </PendingCount>
      )}
    </EmailListPanel>
  );
};

export default LeftPanelShell;
