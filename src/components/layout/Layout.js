import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { 
  FiUsers, FiBriefcase, FiLink, FiCalendar, 
  FiLogOut, FiMenu, FiX, FiClock, FiPlusCircle, 
  FiHeart, FiAlertCircle, FiDollarSign, FiTrendingUp, 
  FiUserPlus, FiChevronDown, FiChevronRight, FiList 
} from 'react-icons/fi';

// Main layout container
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #000000;
`;

// Sidebar styling
const SidebarContainer = styled.aside`
  width: 260px;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 50;
  
  @media (max-width: 768px) {
    width: ${props => (props.$isOpen ? '260px' : '0')};
    transform: ${props => (props.$isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

const SidebarHeader = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid #333333;
  display: flex;
  justify-content: center;
`;

const Logo = styled.div`
  img {
    max-width: 180px;
    height: auto;
  }
`;

const SidebarContent = styled.div`
  padding: 1rem 0;
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

// Main menu item
const MenuItem = styled.div`
  margin-bottom: 4px;
`;

// Main menu link
const MenuItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem 0.75rem 2.25rem;
  color: ${props => (props.$active ? '#00ff00' : '#ffffff')};
  background-color: ${props => (props.$active ? '#333333' : 'transparent')};
  border-left: 3px solid ${props => (props.$active ? '#444444' : 'transparent')};
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0.5px;
  position: relative;
  
  &:before {
    content: ${props => props.$active ? '"> "' : '"$ "'};
    font-family: monospace;
    color: ${props => (props.$active ? '#00ff00' : '#86c786')};
    position: absolute;
    left: 12px;
  }
  
  &:hover {
    background-color: ${props => (props.$active ? '#333333' : '#222222')};
    color: #00ff00;
  }
`;

const MenuItemLink = styled(Link)`
  display: flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
  flex: 1;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0.5px;
`;

// Submenu container
const SubMenu = styled.div`
  max-height: ${props => (props.$isOpen ? '500px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  background-color: #111111;
  border-left: 1px solid #444444;
  margin-left: 24px;
  position: relative;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    );
    pointer-events: none;
    opacity: 0.2;
  }
`;

// Submenu item
const SubMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.625rem 1.5rem 0.625rem 2.5rem;
  color: ${props => (props.$active ? '#00ff00' : '#86c786')};
  background-color: ${props => (props.$active ? '#222222' : 'transparent')};
  border-left: 3px solid ${props => (props.$active ? '#444444' : 'transparent')};
  font-size: 0.875rem;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  
  &:before {
    content: ${props => props.$active ? '">" ' : '"$ "'};
    position: absolute;
    left: 1rem;
    color: ${props => props.$active ? '#00ff00' : '#86c786'};
    font-size: 0.8rem;
  }
  
  &:hover {
    background-color: #222222;
    color: #00ff00;
    text-shadow: 0 0 2px rgba(0, 255, 0, 0.4);
  }
`;

const SidebarFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #333333;
  background-color: #111111;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
`;

const UserAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #555555;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  font-weight: bold;
  color: #ffffff;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #ffffff;
`;

const UserRole = styled.div`
  font-size: 0.75rem;
  color: #cccccc;
`;

// Main content area
const Main = styled.main`
  flex: 1;
  margin-left: 260px;
  transition: all 0.3s ease;
  width: calc(100% - 260px);
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
  }
`;

// Top header
const TopHeader = styled.header`
  background-color: black;
  border-bottom: none;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 40;
`;

const PageTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
`;

const MobileMenuButton = styled(ActionButton)`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  background-color: transparent;
  border: none;
  color: #86c786;
  padding: 0.75rem 0;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.2s;
  font-family: 'Courier New', Courier, monospace;
  position: relative;
  padding-left: 1.25rem;
  
  &:before {
    content: "$ ";
    position: absolute;
    left: 0;
  }
  
  &:hover {
    color: #00ff00;
    text-shadow: 0 0 2px rgba(0, 255, 0, 0.4);
  }
`;

// Content container
const ContentContainer = styled.div`
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  background-color: #000000;
  color: white;
`;

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // State to track which menu items are expanded
  const [expandedMenus, setExpandedMenus] = useState({
    v1: true
  });
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect handled by AuthProvider
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };
  
  // Check if a path is active or one of its children is active
  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Get current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path.includes('/contacts')) {
      if (path.includes('/last-interactions')) return 'Last Interactions';
      if (path.includes('/keep-in-touch')) return 'Keep in Touch';
      if (path.includes('/introductions')) return 'Introductions';
      if (path.includes('/email-inbox')) return 'Email Inbox';
      if (path.includes('/inbox')) return 'Contacts Inbox';
      return 'Contacts';
    }
    
    if (path.includes('/companies')) {
      if (path.includes('/deals')) return 'Deals';
      if (path.includes('/startups')) return 'Startups';
      if (path.includes('/investors')) return 'Investors';
      return 'Companies';
    }
    
    if (path.includes('/planner')) return 'Planner';
    
    return 'CRM Dashboard';
  };
  
  // Get user initials (replace with actual user data from context/auth)
  const getUserInitials = () => {
    return 'SC'; // Replace with actual user initials
  };

  return (
    <LayoutContainer>
      {/* Sidebar Navigation */}
      <SidebarContainer $isOpen={sidebarOpen}>
        <SidebarHeader>
          <Logo>
            <img 
              src="https://assets.softr-files.com/applications/4612f2ab-9299-411a-b90c-78cfdc9b1a1b/assets/9f11c75a-a815-4686-9092-c9f8af95a4e1.jpeg" 
              alt="CRM Dashboard Logo" 
            />
          </Logo>
        </SidebarHeader>
        
        <SidebarContent>
          {/* V1 Menu */}
          <MenuItem>
            <MenuItemHeader 
              $active={isPathActive('/')} 
              onClick={() => toggleMenu('v1')}
            >
              <MenuItemLink to="/">
                CRM v1
              </MenuItemLink>
              {expandedMenus.v1 ? "[open]" : "[+]"}
            </MenuItemHeader>
            
            <SubMenu $isOpen={expandedMenus.v1}>
              <SubMenuItem 
                to="/contacts/simple" 
                $active={isPathActive('/contacts/simple')}
              >
                Last Interactions
              </SubMenuItem>
              
              <SubMenuItem 
                to="/contacts/keep-in-touch" 
                $active={isPathActive('/contacts/keep-in-touch')}
              >
                Keep in Touch
              </SubMenuItem>

              <SubMenuItem 
                to="/contacts/inbox" 
                $active={isPathActive('/contacts/inbox')}
              >
                Contacts Inbox
              </SubMenuItem>
              
              <SubMenuItem 
                to="/contacts/email-inbox" 
                $active={isPathActive('/contacts/email-inbox')}
              >
                Email Inbox
              </SubMenuItem>
              
              <SubMenuItem 
                to="/companies/deals" 
                $active={isPathActive('/companies/deals')}
              >
                Deals
              </SubMenuItem>
              
              <SubMenuItem 
                to="/companies" 
                $active={isPathActive('/companies') && !isPathActive('/companies/deals') && 
                         !isPathActive('/companies/startups') && !isPathActive('/companies/investors')}
              >
                Companies
              </SubMenuItem>
            </SubMenu>
          </MenuItem>
        </SidebarContent>
        
        <SidebarFooter>
          <UserInfo>
            <UserAvatar>{getUserInitials()}</UserAvatar>
            <UserDetails>
              <UserName>Simone Cimminelli</UserName>
              <UserRole>Administrator</UserRole>
            </UserDetails>
          </UserInfo>
          <SignOutButton onClick={handleSignOut}>
            exit
          </SignOutButton>
        </SidebarFooter>
      </SidebarContainer>
      
      {/* Main Content Area */}
      <Main>
        <TopHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <MobileMenuButton onClick={toggleSidebar}>
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </MobileMenuButton>
          </div>
          
          <HeaderActions>
            {/* Add any global actions here */}
          </HeaderActions>
        </TopHeader>
        
        <ContentContainer>
          {children}
        </ContentContainer>
      </Main>
    </LayoutContainer>
  );
};

export default Layout;