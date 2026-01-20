import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthorized, signOut } = useAuth();
  const location = useLocation();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // If user is logged in but not authorized, sign them out
    if (user && !isAuthorized(user)) {
      setAuthError('Email non autorizzata');
      signOut();
    }
  }, [user, isAuthorized, signOut]);

  // Show loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#111827',
        color: '#F9FAFB'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location, error: authError }} replace />;
  }

  // User is authenticated but not authorized
  if (!isAuthorized(user)) {
    return <Navigate to="/login" state={{ error: 'Email non autorizzata' }} replace />;
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;
