import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StarsBackground from '../components/StarsBackground.jsx';
import CustomModal from '../components/CustomModal.jsx';
import kaiLogo from '../assets/Screenshot 2026-05-08 175656.png';

const Profile = () => {
  const { currentUser, signOutUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL ?? '';

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isAlert: false });
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ... (parseResponse and loadSessions same)

  const handleSignOutClick = () => {
    setModal({
      isOpen: true,
      title: 'SIGN OUT',
      message: 'Are you sure you want to terminate the neural link and sign out?',
      isAlert: false,
      onConfirm: async () => {
        await signOutUser();
        navigate('/');
      }
    });
  };

  const handleDeleteAccountClick = () => {
    setModal({
      isOpen: true,
      title: 'CRITICAL ACTION',
      message: 'This will permanently delete your account and all associated mission data. Proceed?',
      isAlert: false,
      onConfirm: async () => {
        try {
          await deleteAccount();
          navigate('/');
        } catch (e) {
          setModal({
            isOpen: true,
            title: 'DELETION FAILED',
            message: 'An error occurred during account synchronization. Please try again.',
            isAlert: true,
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'transparent' }}>
      <StarsBackground />
      <CustomModal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        isAlert={modal.isAlert}
        onConfirm={() => {
          modal.onConfirm();
          setModal({ ...modal, isOpen: false });
        }}
        onCancel={() => setModal({ ...modal, isOpen: false })}
      />
      <div className="app-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '25px 50px' }}>
        <img 
          src={kaiLogo} 
          alt="K.A.I. Logo" 
          style={{ height: '110px', width: 'auto', cursor: 'pointer' }} 
          onClick={() => navigate('/dashboard')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 25 }}>
          <div 
            style={{ 
              width: 52, 
              height: 52, 
              backgroundColor: 'rgba(179, 255, 0, 0.1)', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#B3FF00', 
              border: '2px solid #B3FF00',
              boxShadow: '0 0 15px rgba(179, 255, 0, 0.2)'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        </div>
      </div>

      <div style={{ padding: 40, maxWidth: 1200, marginInline: 'auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 50, borderBottom: '1px solid rgba(179, 255, 0, 0.2)', paddingBottom: 20 }}>
          <h2 style={{ color: '#B3FF00', margin: 0, fontSize: 32, letterSpacing: 2 }}>COMMANDER PROFILE</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={handleSignOutClick} style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>SIGN OUT</button>
            <button onClick={handleDeleteAccountClick} style={{ padding: '12px 24px', backgroundColor: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>DELETE ACCOUNT</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
          <div>
            <h3 style={{ color: '#B3FF00', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 25, fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 24 }}>🏗️</span> Build History</h3>
            {sessionsLoading ? <p style={{ opacity: 0.5 }}>Synchronizing...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sessions.filter(s => s.sourceType !== 'socratic').length === 0 ? <p style={{ opacity: 0.3 }}>No build data recorded.</p> : 
                  sessions.filter(s => s.sourceType !== 'socratic').map(s => (
                  <div 
                    key={s.sessionId} 
                    onClick={() => navigate(`/dashboard/${s.sessionId}`)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 25, borderRadius: 20, border: '1px solid rgba(179, 255, 0, 0.2)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    className="interactive-card"
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 5 }}>{s.subject || 'Extraction Protocol'}</div>
                    <div style={{ fontSize: 12, opacity: 0.5, fontWeight: 700 }}>{s.sessionId} • {new Date(s.lastUpdated || Date.now()).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ color: '#B3FF00', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 25, fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 24 }}>🧠</span> Tutor Sessions</h3>
            {sessionsLoading ? <p style={{ opacity: 0.5 }}>Synchronizing...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sessions.filter(s => s.sourceType === 'socratic').length === 0 ? <p style={{ opacity: 0.3 }}>No tutor interactions recorded.</p> : 
                  sessions.filter(s => s.sourceType === 'socratic').map(s => (
                  <div 
                    key={s.sessionId} 
                    onClick={() => navigate(`/dashboard/${s.sessionId}`)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 25, borderRadius: 20, border: '1px solid rgba(179, 255, 0, 0.2)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                    className="interactive-card"
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 5 }}>{s.coreIntel?.topic || 'Socratic Inquiry'}</div>
                    <div style={{ fontSize: 12, opacity: 0.5, fontWeight: 700 }}>{s.sessionId} • {new Date(s.lastUpdated || Date.now()).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
