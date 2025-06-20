import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import ContactsIcon from '../icons/ContactsIcon';
import OpportunitiesIcon from '../icons/OpportunitiesIcon';
import { 
  FiUsers, FiBriefcase, FiLink, FiCalendar, 
  FiLogOut, FiMenu, FiX, FiClock, FiPlusCircle, 
  FiHeart, FiAlertCircle, FiDollarSign, FiTrendingUp, 
  FiUserPlus, FiChevronDown, FiChevronRight, FiList,
  FiInbox, FiMail
} from 'react-icons/fi';

// Main layout container
const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #000000;
`;

// Sidebar styling
const SidebarContainer = styled.aside`
  width: ${props => props.$isOpen ? '260px' : '60px'};
  background-color: #000000;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: fixed;
  height: 100vh;
  z-index: 50;
  overflow: hidden;
  
  @media (max-width: 768px) {
    width: ${props => (props.$isOpen ? '260px' : '0')};
    transform: ${props => (props.$isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

const SidebarHeader = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid #333333;
  display: flex;
  justify-content: ${props => props.$isOpen ? 'center' : 'center'};
  align-items: center;
  position: relative;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #333333;
    color: #00ff00;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Logo = styled.div`
  img {
    max-width: ${props => props.$isOpen ? '180px' : '40px'};
    height: auto;
    transition: all 0.3s ease;
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
  justify-content: ${props => props.$isOpen ? 'space-between' : 'flex-start'};
  padding: ${props => props.$isOpen ? '0.75rem 1.5rem 0.75rem 2.25rem' : '0.75rem 0.5rem'};
  color: ${props => (props.$active ? '#00ff00' : '#ffffff')};
  background-color: ${props => (props.$active ? '#333333' : 'transparent')};
  border-left: 3px solid ${props => (props.$active ? '#444444' : 'transparent')};
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0.5px;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
  
  &:hover {
    background-color: ${props => (props.$active ? '#333333' : '#222222')};
    color: #00ff00;
  }
`;

const MenuItemLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isOpen ? 'flex-start' : 'center'};
  color: inherit;
  text-decoration: none;
  flex: 1;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
`;

const MenuText = styled.span`
  opacity: ${props => props.$isOpen ? '1' : '0'};
  width: ${props => props.$isOpen ? 'auto' : '0'};
  transition: all 0.3s ease;
  overflow: hidden;
  white-space: nowrap;
`;

const MenuIcon = styled.span`
  font-size: 1.2rem;
  margin-right: ${props => props.$isOpen ? '0.5rem' : '0'};
  transition: all 0.3s ease;
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
  
  &:hover {
    background-color: #222222;
    color: #00ff00;
    text-shadow: 0 0 2px rgba(0, 255, 0, 0.4);
  }
`;

const SidebarFooter = styled.div`
  padding: 1rem ${props => props.$isOpen ? '1.5rem' : '0.5rem'};
  border-top: 1px solid #333333;
  background-color: #111111;
  transition: all 0.3s ease;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isOpen ? 'flex-start' : 'center'};
`;

const UserAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #555555;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${props => props.$isOpen ? '0.75rem' : '0'};
  font-weight: bold;
  color: #ffffff;
  transition: all 0.3s ease;
`;

const UserDetails = styled.div`
  flex: 1;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  width: ${props => props.$isOpen ? 'auto' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
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
  margin-left: ${props => props.$sidebarOpen ? '260px' : '60px'};
  transition: all 0.3s ease;
  width: ${props => props.$sidebarOpen ? 'calc(100% - 260px)' : 'calc(100% - 60px)'};
  padding-left: 0;
  
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
  background: none;
  border: none;
  color: #86c786;
  cursor: pointer;
  padding: 0.5rem 0;
  font-family: 'Courier New', Courier, monospace;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  width: ${props => props.$isOpen ? 'auto' : '0'};
  overflow: hidden;
  
  &:hover {
    color: #00ff00;
  }
`;

// Content container
const ContentContainer = styled.div`
  padding: 0;
  max-width: 1600px;
  margin: 0;
  background-color: #000000;
  color: white;
`;

const MenuExpandIcon = styled.div`
  color: #666666;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  opacity: 0.7;
  
  &:hover {
    color: #00ff00;
    opacity: 1;
  }
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
    
    if (path.includes('/inbox')) return 'Inbox';
    
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
        <SidebarHeader $isOpen={sidebarOpen}>
          <ToggleButton onClick={toggleSidebar}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </ToggleButton>
          <Logo $isOpen={sidebarOpen}>
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
              $isOpen={sidebarOpen}
              onClick={() => sidebarOpen && toggleMenu('v1')}
            >
              <MenuItemLink to="/" $isOpen={sidebarOpen}>
                <MenuIcon $isOpen={sidebarOpen}>
                  <ContactsIcon size={20} />
                </MenuIcon>
                <MenuText $isOpen={sidebarOpen}>Contacts</MenuText>
              </MenuItemLink>
              {sidebarOpen && (
                <MenuExpandIcon>
                  {expandedMenus.v1 ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </MenuExpandIcon>
              )}
            </MenuItemHeader>
            
            {sidebarOpen && (
            <SubMenu $isOpen={expandedMenus.v1}>
              <SubMenuItem 
                to="/contacts/interactions" 
                $active={isPathActive('/contacts/interactions')}
              >
                Interactions
              </SubMenuItem>
              
              <SubMenuItem 
                to="/contacts/lists" 
                $active={isPathActive('/contacts/lists')}
              >
                Lists
              </SubMenuItem>
              
              <SubMenuItem 
                to="/inbox" 
                $active={isPathActive('/inbox')}
              >
                Processing
              </SubMenuItem>
            </SubMenu>
            )}
          </MenuItem>

          {/* Opportunities Menu */}
          <MenuItem>
            <MenuItemHeader 
              $active={isPathActive('/opportunities')} 
              $isOpen={sidebarOpen}
              onClick={() => sidebarOpen && toggleMenu('opportunities')}
            >
              <MenuItemLink to="/opportunities" $isOpen={sidebarOpen}>
                <MenuIcon $isOpen={sidebarOpen}>
                  <OpportunitiesIcon size={20} />
                </MenuIcon>
                <MenuText $isOpen={sidebarOpen}>Opportunities</MenuText>
              </MenuItemLink>
              {sidebarOpen && (
                <MenuExpandIcon>
                  {expandedMenus.opportunities ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </MenuExpandIcon>
              )}
            </MenuItemHeader>
            
            {sidebarOpen && (
            <SubMenu $isOpen={expandedMenus.opportunities}>
              <SubMenuItem 
                to="/companies/deals" 
                $active={isPathActive('/companies/deals')}
              >
                Deals
              </SubMenuItem>
              
              <SubMenuItem 
                to="/companies" 
                $active={isPathActive('/companies') && !isPathActive('/companies/deals')}
              >
                Companies
              </SubMenuItem>
            </SubMenu>
            )}
          </MenuItem>


        </SidebarContent>
        
        <SidebarFooter $isOpen={sidebarOpen}>
          <UserInfo $isOpen={sidebarOpen}>
            <UserAvatar $isOpen={sidebarOpen}>{getUserInitials()}</UserAvatar>
            <UserDetails $isOpen={sidebarOpen}>
              <UserName>Simone Cimminelli</UserName>
              <UserRole>Administrator</UserRole>
            </UserDetails>
          </UserInfo>
          <SignOutButton $isOpen={sidebarOpen} onClick={handleSignOut}>
            exit
          </SignOutButton>
        </SidebarFooter>
      </SidebarContainer>
      
      {/* Main Content Area */}
      <Main $sidebarOpen={sidebarOpen}>
        <ContentContainer>
          {children}
        </ContentContainer>
      </Main>
    </LayoutContainer>
  );
};

export default Layout;