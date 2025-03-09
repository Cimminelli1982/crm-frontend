import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
`;

const Main = styled.main`
  flex: 1;
  padding: 24px;
  background-color: #fff;
  margin-left: 250px; /* Match the sidebar width */
  min-height: calc(100vh - 64px); /* Adjust based on header height */
  padding-top: 24px;
`;

const Layout = ({ children }) => {
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  // Mock user object - replace with your actual user data
  const user = {
    name: 'John Doe',
    role: 'Admin'
  };

  return (
    <LayoutContainer>
      <Header />
      <ContentWrapper>
        <Sidebar user={user} onSignOut={handleSignOut} />
        <Main>{children}</Main>
      </ContentWrapper>
    </LayoutContainer>
  );
};

export default Layout;