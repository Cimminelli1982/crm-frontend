import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { FaGoogle } from 'react-icons/fa';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #111827;
`;

const LoginCard = styled.div`
  max-width: 400px;
  width: 90%;
  padding: 2.5rem;
  background: #1F2937;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  text-align: center;
`;

const Title = styled.h1`
  color: #F9FAFB;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #9CA3AF;
  font-size: 0.9rem;
  margin-bottom: 2rem;
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #FFFFFF;
  color: #1F2937;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s ease;

  &:hover {
    background: #F3F4F6;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #F87171;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
`;

const NewCRMLogin = () => {
  const { user, loading, signInWithGoogle, isAuthorized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Check for error passed from ProtectedRoute or auth callback
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location.state]);

  // Redirect if already logged in and authorized
  useEffect(() => {
    if (!loading && user && isAuthorized(user)) {
      const from = location.state?.from?.pathname || '/command-center';
      navigate(from, { replace: true });
    }
  }, [user, loading, isAuthorized, navigate, location.state]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message);
      setIsSigningIn(false);
    }
    // If successful, the page will redirect to Google OAuth
  };

  if (loading) {
    return (
      <LoginContainer>
        <LoginCard>
          <Title>Loading...</Title>
        </LoginCard>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      <LoginCard>
        <Title>CRM Login</Title>
        <Subtitle>Accedi con il tuo account Google autorizzato</Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <GoogleButton onClick={handleGoogleSignIn} disabled={isSigningIn}>
          <FaGoogle size={18} />
          {isSigningIn ? 'Reindirizzamento...' : 'Continua con Google'}
        </GoogleButton>
      </LoginCard>
    </LoginContainer>
  );
};

export default NewCRMLogin;
