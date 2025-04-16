import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAddressBook,
  faBuilding,
  faHandshake,
  faCalendarAlt,
  faInbox,
  faChevronDown,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

// Styled Components
const SidebarContainer = styled.div`
  width: 250px;
  height: 100vh;
  background-color: #000000;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  padding-top: 64px; /* Adjust based on your header height */
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.15);
`;

const Logo = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #333333;
  
  img {
    max-width: 180px;
    height: auto;
  }
`;

const NavSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  flex: 1;
  overflow-y: auto;
  
  /* Custom scrollbar for dark background */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333333;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #555555;
    border-radius: 3px;
  }
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
  color: #ffffff;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  border-left: 3px solid transparent;
  
  ${props => props.isActive && `
    color: #ffffff;
    background-color: #555555;
    border-left-color: #999999;
  `}
  
  &:hover {
    background-color: ${props => props.isActive ? '#555555' : '#333333'};
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
  background-color: #111111;
`;

const SubMenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 10px 20px 10px 56px;
  color: #cccccc;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  
  &.active {
    color: #ffffff;
    background-color: #333333;
    border-left-color: #999999;
  }
  
  &:hover {
    background-color: #222222;
  }
`;

const UserSection = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  border-top: 1px solid #333333;
  margin-top: auto;
  background-color: #111111;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #555555;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: 600;
  color: #ffffff;
`;

const UserInfo = styled.div`
  flex: 1;
  overflow: hidden;
  
  .name {
    font-weight: 500;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .role {
    font-size: 0.8rem;
    color: #cccccc;
  }
`;

const SignOutButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #cccccc;
  font-size: 0.875rem;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: #333333;
    color: #ef4444;
  }
`;

const Sidebar = ({ user, onSignOut }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({
    contacts: true,
    companies: false,
    admin: false,
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
        { name: 'Recent Interactions', path: '/contacts/last-interactions' },
        { name: 'Keep in Touch', path: '/contacts/keep-in-touch' },
        { name: 'Keep in Touch Inbox', path: '/contacts/keep-in-touch-inbox' },
        { name: 'Introductions', path: '/contacts/introductions' },
        { name: 'Duplicate Manager', path: '/contacts/duplicate-manager' }
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
    },
    {
      id: 'inbox',
      name: 'Processing',
      icon: faInbox,
      path: '/inbox',
      subItems: []
    },
    {
      id: 'admin',
      name: 'Admin Tools',
      icon: faHandshake,
      path: '/admin',
      subItems: [
        { name: 'HubSpot Migration', path: '/admin/hubspot-migration' },
        { name: 'HubSpot Test', path: '/admin/hubspot-test' },
        { name: 'Contact Enrichment', path: '/admin/contact-enrichment' }
      ]
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
        <img 
          src="https://assets.softr-files.com/applications/4612f2ab-9299-411a-b90c-78cfdc9b1a1b/assets/9f11c75a-a815-4686-9092-c9f8af95a4e1.jpeg" 
          alt="CRM Dashboard Logo" 
        />
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