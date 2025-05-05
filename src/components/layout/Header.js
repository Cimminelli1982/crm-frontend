import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import logo from '../../logo.jpeg'; // Import the new logo

const HeaderContainer = styled.header`
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  
  img {
    height: 40px;
    width: auto;
  }
`;

const NavMenu = styled.nav`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #333;
  &:hover {
    color: #0070f3;
  }
`;

const Header = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <HeaderContainer>
      <Logo>
        <Link to="/" style={{ textDecoration: 'none', color: '#0070f3', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logo} alt="Cimminnelli Holding" />
          Cimminnelli Holding CRM
        </Link>
      </Logo>
      <NavMenu>
        <NavLink to="/contacts">Contacts</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/new-contacts">New Contacts</NavLink>
        <button onClick={handleSignOut}>Sign Out</button>
      </NavMenu>
    </HeaderContainer>
  );
};

export default Header;