import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../components/LandingPage';
import OnboardingWelcome from '../components/OnboardingWelcome';

const AuthFlow = () => {
  const { currentUser, loadingAuth, signInWithGoogle } = useAuth();
  const [showPrologue, setShowPrologue] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in (persisted session) and we are not showing the prologue,
    // skip directly to the dashboard.
    if (!loadingAuth && currentUser && !showPrologue) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, loadingAuth, showPrologue, navigate]);

  if (loadingAuth) {
    return (
      <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', color: '#B3FF00', backgroundColor: '#000', minHeight: '100vh' }}>
        <h1>K.A.I.</h1>
        <p>Synchronizing neural link...</p>
      </div>
    );
  }

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      // After successful login, show the prologue (K.A.I. intro)
      setShowPrologue(true);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handlePrologueComplete = () => {
    navigate('/dashboard');
  };

  if (showPrologue) {
    return <OnboardingWelcome user={currentUser} onComplete={handlePrologueComplete} />;
  }

  return <LandingPage signInWithGoogle={handleLogin} />;
};

export default AuthFlow;
