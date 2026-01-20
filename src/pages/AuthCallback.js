import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #111827;
`;

const Card = styled.div`
  max-width: 400px;
  width: 90%;
  padding: 2.5rem;
  background: #1F2937;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  text-align: center;
`;

const Title = styled.h2`
  color: #F9FAFB;
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #374151;
  border-top-color: #3B82F6;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  color: #F87171;
  margin-top: 1rem;
`;

const AuthCallback = () => {
  const { user, loading, isAuthorized, signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for auth state to settle
    if (loading) return;

    // Check if user is authenticated
    if (user) {
      // Check if user is authorized
      if (isAuthorized(user)) {
        // Authorized - redirect to command center
        navigate('/command-center', { replace: true });
      } else {
        // Not authorized - sign out and show error
        setError('Email non autorizzata. Solo gli utenti autorizzati possono accedere.');
        signOut().then(() => {
          setTimeout(() => {
            navigate('/login', { state: { error: 'Email non autorizzata' }, replace: true });
          }, 2000);
        });
      }
    } else {
      // No user - something went wrong, redirect to login
      navigate('/login', { replace: true });
    }
  }, [user, loading, isAuthorized, signOut, navigate]);

  return (
    <Container>
      <Card>
        {error ? (
          <>
            <Title>Accesso negato</Title>
            <ErrorMessage>{error}</ErrorMessage>
          </>
        ) : (
          <>
            <Spinner />
            <Title>Verifica in corso...</Title>
          </>
        )}
      </Card>
    </Container>
  );
};

export default AuthCallback;
