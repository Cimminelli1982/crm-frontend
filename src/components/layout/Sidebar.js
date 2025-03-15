import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAddressBook,
  faBuilding,
  faHandshake,
  faCalendarAlt,
  faChevronDown,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

// Styled Components
const SidebarContainer = styled.div`
  width: 250px;
  height: 100vh;
  background-color: #fff;
  border-right: 1px solid #e5e7eb;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  padding-top: 64px; /* Adjust based on your header height */
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.05);
`;

const Logo = styled.div`
  padding: 24px 20px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f3f4f6;
`;

const NavSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  flex: 1;
  overflow-y: auto;
`;

const MenuItem = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
`;

const MainMenuLink = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #374151;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border-left: 3px solid transparent;
  
  ${props => props.isActive && `
    color: #3b82f6;
    background-color: #eff6ff;
    border-left-color: #3b82f6;
  `}
  
  &:hover {
    background-color: ${props => props.isActive ? '#eff6ff' : '#f9fafb'};
  }
  
  .icon {
    width: 24px;
    margin-right: 12px;
  }
  
  .chevron {
    margin-left: auto;
    font-size: 0.8rem;
    transition: transform 0.2s ease;
    transform: ${props => props.isOpen ? 'rotate(90deg)' : 'rotate(0deg)'};
  }
`;

const SubMenuContainer = styled.div`
  overflow: hidden;
  max-height: ${props => props.isOpen ? '500px' : '0'};
  transition: max-height 0.3s ease;
`;

const SubMenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 10px 20px 10px 56px;
  color: #6b7280;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  
  &.active {
    color: #3b82f6;
    background-color: #f3f4f6;
    border-left-color: #3b82f6;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const UserSection = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  border-top: 1px solid #f3f4f6;
  margin-top: auto;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: 600;
  color: #4b5563;
`;

const UserInfo = styled.div`
  flex: 1;
  overflow: hidden;
  
  .name {
    font-weight: 500;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .role {
    font-size: 0.8rem;
    color: #6b7280;
  }
`;

const SignOutButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: #f3f4f6;
    color: #ef4444;
  }
`;

const Sidebar = ({ user, onSignOut }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({
    contacts: true,
    companies: false,
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Check if a main menu should be active based on current path
  const isMainMenuActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // Menu structure
  const menuItems = [
    {
      id: 'contacts',
      name: 'Contacts',
      icon: faAddressBook,
      path: '/contacts',
      subItems: [
        { name: 'Last Interactions', path: '/contacts/last-interactions' },
        { name: 'Keep in Touch', path: '/contacts/keep-in-touch' },
        { name: 'Introductions', path: '/contacts/introductions' }
      ]
    },
    {
      id: 'companies',
      name: 'Companies',
      icon: faBuilding,
      path: '/companies',
      subItems: [
        { name: 'Deals', path: '/companies/deals' },
        { name: 'Startups', path: '/companies/startups' },
        { name: 'Investors', path: '/companies/investors' }
      ]
    },
    {
      id: 'planner',
      name: 'Planner',
      icon: faCalendarAlt,
      path: '/planner',
      subItems: []
    }
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return '';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <SidebarContainer>
      <Logo>
        CRM Dashboard
      </Logo>
      
      <NavSection>
        {menuItems.map((item) => (
          <MenuItem key={item.id}>
            {/* Main menu item */}
            {item.subItems.length > 0 ? (
              // With submenu
              <>
                <MainMenuLink 
                  isActive={isMainMenuActive(item.path)}
                  isOpen={openMenus[item.id]}
                  onClick={() => toggleMenu(item.id)}
                >
                  <FontAwesomeIcon icon={item.icon} className="icon" />
                  {item.name}
                  <FontAwesomeIcon 
                    icon={openMenus[item.id] ? faChevronDown : faChevronRight} 
                    className="chevron" 
                  />
                </MainMenuLink>
                
                <SubMenuContainer isOpen={openMenus[item.id]}>
                  {item.subItems.map((subItem) => (
                    <SubMenuItem 
                      key={subItem.path} 
                      to={subItem.path}
                      className={({ isActive }) => isActive ? 'active' : ''}
                    >
                      {subItem.name}
                    </SubMenuItem>
                  ))}
                </SubMenuContainer>
              </>
            ) : (
              // Without submenu
              <NavLink 
                to={item.path} 
                style={{ textDecoration: 'none' }}
              >
                <MainMenuLink isActive={location.pathname === item.path}>
                  <FontAwesomeIcon icon={item.icon} className="icon" />
                  {item.name}
                </MainMenuLink>
              </NavLink>
            )}
          </MenuItem>
        ))}
      </NavSection>
      
      <UserSection>
        <Avatar>{getUserInitials()}</Avatar>
        <UserInfo>
          <div className="name">{user?.name || 'User'}</div>
          <div className="role">{user?.role || 'Admin'}</div>
        </UserInfo>
        <SignOutButton onClick={onSignOut}>
          Sign Out
        </SignOutButton>
      </UserSection>
    </SidebarContainer>
  );
};

export default Sidebar;