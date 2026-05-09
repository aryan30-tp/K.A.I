import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GuestRoute = ({ children }) => {
  const { currentUser, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', color: '#B3FF00', backgroundColor: '#000', minHeight: '100vh' }}>
        <h1>K.A.I.</h1>
        <p>Synchronizing neural link...</p>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
