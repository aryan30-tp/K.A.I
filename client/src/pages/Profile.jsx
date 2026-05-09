import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StarsBackground from '../components/StarsBackground.jsx';
import kaiLogo from '../assets/Screenshot 2026-05-08 175656.png';

const Profile = () => {
  const { currentUser, signOutUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL ?? '';

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const parseResponse = async (res) => {
    const raw = await res.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; } catch (parseErr) { throw new Error(`Non-JSON response: ${raw.slice(0, 1000)}`); }
    if (!res.ok) throw new Error(data?.error || 'Request failed');
    return data;
  };

  const loadSessions = useCallback(async () => {
    if (!currentUser?.uid) return;
    setSessionsLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/sessions/${encodeURIComponent(currentUser.uid)}`);
      const data = await parseResponse(res);
      if (data.ok) setSessions(data.sessions || []);
    } catch (err) { console.error('Sessions error', err); }
    finally { setSessionsLoading(false); }
  }, [currentUser, apiBase]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSignOut = async () => {
    await signOutUser();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Delete account permanently?")) {
      try {
        await deleteAccount();
        navigate('/');
      } catch (e) {
        alert("Deletion failed");
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'transparent' }}>
      <StarsBackground />
      <div className="app-header" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '25px 50px' }}>
        <img 
          src={kaiLogo} 
          alt="K.A.I. Logo" 
          style={{ height: '110px', width: 'auto', cursor: 'pointer' }} 
          onClick={() => navigate('/dashboard')}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 25 }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: 'transparent', 
              color: '#B3FF00', 
              border: '1px solid #B3FF00', 
              borderRadius: 12, 
              cursor: 'pointer', 
              fontWeight: 700 
            }}
          >
            DASHBOARD
          </button>
        </div>
      </div>

      <div style={{ padding: 40, maxWidth: 1200, marginInline: 'auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 50, borderBottom: '1px solid rgba(179, 255, 0, 0.2)', paddingBottom: 20 }}>
          <h2 style={{ color: '#B3FF00', margin: 0, fontSize: 32, letterSpacing: 2 }}>COMMANDER PROFILE</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={handleSignOut} style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>SIGN OUT</button>
            <button onClick={handleDeleteAccount} style={{ padding: '12px 24px', backgroundColor: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>DELETE ACCOUNT</button>
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
