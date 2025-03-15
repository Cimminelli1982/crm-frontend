import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { 
  FiUsers, FiBriefcase, FiLink, FiCalendar, 
  FiLogOut, FiMenu, FiX, FiClock, FiPlusCircle, 
  FiHeart, FiAlertCircle, FiDollarSign, FiTrendingUp, 
  FiUserPlus, FiChevronDown, FiChevronRight 
} from 'react-icons/fi';

// Main layout container
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
`;

// Sidebar styling
const Sidebar = styled.aside`
  width: 260px;
  background-color: #1e293b;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 50;
  
  @media (max-width: 768px) {
    width: ${props => (props.isOpen ? '260px' : '0')};
    transform: ${props => (props.isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
`;

const SidebarContent = styled.div`
  padding: 1rem 0;
  flex: 1;
  overflow-y: auto;
`;

// Main menu item
const MenuItem = styled.div`
  margin-bottom: 0.5rem;
`;

// Main menu link
const MenuItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  color: ${props => (props.active ? '#ffffff' : '#cbd5e1')};
  background-color: ${props => (props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent')};
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
  }
`;

const MenuItemLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
  flex: 1;

  svg {
    font-size: 1.25rem;
  }
`;

// Submenu container
const SubMenu = styled.div`
  max-height: ${props => (props.isOpen ? '500px' : '0')};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

// Submenu item
const SubMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.625rem 1.5rem 0.625rem 3.25rem;
  color: ${props => (props.active ? '#ffffff' : '#94a3b8')};
  background-color: ${props => (props.active ? 'rgba(255, 255, 255, 0.05)' : 'transparent')};
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.025);
    color: white;
  }
`;

const SidebarFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
`;

const UserAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  font-weight: bold;
  color: white;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 600;
`;

const UserRole = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
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
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 40;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const PageTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
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
  gap: 0.5rem;
  background-color: transparent;
  border: none;
  color: #cbd5e1;
  padding: 0.75rem 0;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.2s;
  
  &:hover {
    color: white;
  }
  
  svg {
    font-size: 1.25rem;
  }
`;

// Content container
const ContentContainer = styled.div`
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // State to track which menu items are expanded
  const [expandedMenus, setExpandedMenus] = useState({
    contacts: true,
    companies: true
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
      <Sidebar isOpen={sidebarOpen}>
        <SidebarHeader>
          <Logo>CRM Dashboard</Logo>
        </SidebarHeader>
        
        <SidebarContent>
          {/* Contacts Menu */}
          <MenuItem>
            <MenuItemHeader 
              active={isPathActive('/contacts')} 
              onClick={() => toggleMenu('contacts')}
            >
              <MenuItemLink to="/contacts">
                <FiUsers />
                <span>Contacts</span>
              </MenuItemLink>
              {expandedMenus.contacts ? <FiChevronDown /> : <FiChevronRight />}
            </MenuItemHeader>
            
            <SubMenu isOpen={expandedMenus.contacts}>
              <SubMenuItem 
                to="/contacts/last-interactions" 
                active={isPathActive('/contacts/last-interactions')}
              >
                <FiClock style={{ marginRight: '0.5rem', fontSize: '0.875rem' }} />
                Last Interactions
              </SubMenuItem>
              
              <SubMenuItem 
                to="/contacts/keep-in-touch" 
                active={isPathActive('/contacts/keep-in-touch')}
              >
                <FiHeart style={{ marginRight: '0.5rem', fontSize: '0.875rem' }} />
                Keep in Touch
              </SubMenuItem>
              
              <SubMenuItem 
                to="/contacts/introductions" 
                active={isPathActive('/contacts/introductions')}
              >
                <FiLink style={{ marginRight: '0.5rem', fontSize: '0.875rem' }} />
                Introductions
              </SubMenuItem>
            </SubMenu>
          </MenuItem>
          
          {/* Companies Menu */}
          <MenuItem>
            <MenuItemHeader 
              active={isPathActive('/companies')} 
              onClick={() => toggleMenu('companies')}
            >
              <MenuItemLink to="/companies">
                <FiBriefcase />
                <span>Companies</span>
              </MenuItemLink>
              {expandedMenus.companies ? <FiChevronDown /> : <FiChevronRight />}
            </MenuItemHeader>
            
            <SubMenu isOpen={expandedMenus.companies}>
              <SubMenuItem 
                to="/companies/deals" 
                active={isPathActive('/companies/deals')}
              >
                <FiDollarSign style={{ marginRight: '0.5rem', fontSize: '0.875rem' }} />
                Deals
              </SubMenuItem>
              
              <SubMenuItem 
                to="/companies/startups" 
                active={isPathActive('/companies/startups')}
              >
                <FiTrendingUp style={{ marginRight: '0.5rem', fontSize: '0.875rem' }} />
                Startups
              </SubMenuItem>
              
              <SubMenuItem 
                to="/companies/investors" 
                active={isPathActive('/companies/investors')}
              >
                <FiUserPlus style={{ marginRight: '0.5rem', fontSize: '0.875rem' }} />
                Investors
              </SubMenuItem>
            </SubMenu>
          </MenuItem>
          
          {/* Single-level menu items */}
          <MenuItem>
            <MenuItemHeader active={isPathActive('/planner')}>
              <MenuItemLink to="/planner">
                <FiCalendar />
                <span>Planner</span>
              </MenuItemLink>
            </MenuItemHeader>
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
            <FiLogOut />
            Sign Out
          </SignOutButton>
        </SidebarFooter>
      </Sidebar>
      
      {/* Main Content Area */}
      <Main>
        <TopHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <MobileMenuButton onClick={toggleSidebar}>
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </MobileMenuButton>
            <PageTitle>{getPageTitle()}</PageTitle>
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