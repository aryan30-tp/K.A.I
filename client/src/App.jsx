import React, { useEffect, useState } from 'react';
import SocraticTutorTest from './components/SocraticTutorTest.jsx';
import VisualLabCard from './components/VisualLabCard.jsx';
import { useAuth } from './context/AuthContext.jsx';
import chatbotVideo from './assets/Live chatbot.webm';
import ignisVideo from './assets/Technology isometric ai robot brain.webm';

function StarsBackground() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const starCount = 150;
    const generatedStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="stars-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
          }}
        />
      ))}
    </div>
  );
}

function LoadingProgressBar({ loading, label }) {
  if (!loading) return null;
  return (
    <div style={{ width: '100%', marginTop: 24, maxWidth: 600, marginInline: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, fontWeight: 700, color: '#B3FF00', textTransform: 'uppercase', letterSpacing: 1 }}>
        <span>{label}</span>
        <span className="pulse">AI Processing...</span>
      </div>
      <div style={{ width: '100%', height: 4, backgroundColor: 'rgba(179, 255, 0, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div className="loading-bar-fill" />
      </div>
    </div>
  );
}

function RandomMovingBox({ children }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState({ x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1 });
  const [mousePos, setMousePos] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const containerRef = React.useRef(null);

  useEffect(() => {
    let animationFrameId;
    
    const update = () => {
      // Update Sparkles (fade them out)
      setSparkles(prev => prev.map(s => ({ ...s, opacity: s.opacity - 0.01 })).filter(s => s.opacity > 0));

      setPosition(prev => {
        let nextVelX = velocity.x;
        let nextVelY = velocity.y;

        // Target: Mouse or nearest sparkle
        let target = mousePos;
        if (!target && sparkles.length > 0) {
          // Find closest sparkle
          target = sparkles.reduce((prevS, currS) => {
            const dPrev = Math.sqrt((prevS.x - prev.x)**2 + (prevS.y - prev.y)**2);
            const dCurr = Math.sqrt((currS.x - prev.x)**2 + (currS.y - prev.y)**2);
            return dCurr < dPrev ? currS : prevS;
          });
        }

        if (target) {
          const dx = target.x - prev.x;
          const dy = target.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 1) {
            const pull = target === mousePos ? 0.02 : 0.015;
            nextVelX += (dx / dist) * pull;
            nextVelY += (dy / dist) * pull;
          }

          // "Collect" sparkles if robot is very close
          if (dist < 5 && target !== mousePos) {
            setSparkles(prevS => prevS.filter(s => s.id !== target.id));
          }
        } else {
          if (Math.random() < 0.005) {
            nextVelX += (Math.random() - 0.5) * 0.05;
            nextVelY += (Math.random() - 0.5) * 0.05;
          }
        }

        const speed = Math.sqrt(nextVelX ** 2 + nextVelY ** 2);
        const maxSpeed = (mousePos || sparkles.length > 0) ? 0.25 : 0.12;
        const minSpeed = 0.04;
        if (speed > maxSpeed) {
          nextVelX = (nextVelX / speed) * maxSpeed;
          nextVelY = (nextVelY / speed) * maxSpeed;
        } else if (speed < minSpeed) {
          nextVelX = (nextVelX / speed) * minSpeed;
          nextVelY = (nextVelY / speed) * minSpeed;
        }

        let nextX = prev.x + nextVelX;
        let nextY = prev.y + nextVelY;

        if (nextX <= 10 || nextX >= 90) {
          nextVelX *= -0.8;
          nextX = prev.x + nextVelX;
        }
        if (nextY <= 10 || nextY >= 90) {
          nextVelY *= -0.8;
          nextY = prev.y + nextVelY;
        }

        setVelocity({ x: nextVelX, y: nextVelY });
        return { x: nextX, y: nextY };
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [velocity, mousePos, sparkles]);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
      
      // Add sparkle
      if (Math.random() > 0.7) {
        setSparkles(prev => [...prev, { id: Date.now(), x, y, opacity: 1 }]);
      }
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'none',
        pointerEvents: 'auto'
      }}>
        {children}
      </div>
      {sparkles.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: '4px',
          height: '4px',
          backgroundColor: '#B3FF00',
          borderRadius: '50%',
          opacity: s.opacity,
          boxShadow: '0 0 8px #B3FF00'
        }} />
      ))}
    </div>
  );
}

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadId, setUploadId] = useState(null);
  const [rawNotes, setRawNotes] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [pastPapersText, setPastPapersText] = useState('');
  const [workspaceId, setWorkspaceId] = useState('user_123');
  const [sessionId, setSessionId] = useState(''); 
  const [forceWhisper, setForceWhisper] = useState(false);
  const [syllabusAnalysis, setSyllabusAnalysis] = useState(null);
  const [examAnalysis, setExamAnalysis] = useState(null);
  const [requestType, setRequestType] = useState('flashcards');
  const [specificTopic, setSpecificTopic] = useState('');
  
  // Decoupled Loading States
  const [extractLoading, setExtractLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [survivalLoading, setSurvivalLoading] = useState(false);

  const [result, setResult] = useState('');
  const [resultSource, setResultSource] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [heatmapError, setHeatmapError] = useState('');
  const [heatmapResult, setHeatmapResult] = useState(null);

  const [socraticHistory, setSocraticHistory] = useState('[]');
  const [socraticTopic, setSocraticTopic] = useState('');
  const [socraticConfirmedTopic, setSocraticConfirmedTopic] = useState('');
  const [socraticAttemptCount, setSocraticAttemptCount] = useState(0);

  const [hoursRemaining, setHoursRemaining] = useState('6');
  const [survivalError, setSurvivalError] = useState('');
  const [survivalPlan, setSurvivalPlan] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [flashcards, setFlashcards] = useState([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [survivalSeconds, setSurvivalSeconds] = useState(0);
  const [showSurvivalModal, setShowSurvivalModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let interval;
    if (isEmergencyActive && isVaultOpen) {
      interval = setInterval(() => {
        setSurvivalSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isEmergencyActive) {
      setSurvivalSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isEmergencyActive, isVaultOpen]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const { currentUser, loadingAuth, signInWithGoogle, signOutUser, deleteAccount } = useAuth();

  const apiBase = import.meta.env.VITE_API_URL ?? '';

  const fetchMoreFlashcards = React.useCallback(async () => {
    if (isFetchingMore || !uploadId || !rawNotes || !currentUser) return;
    setIsFetchingMore(true);
    try {
      const excludeTopics = flashcards.map(f => f.front);
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          requestType: 'flashcards',
          rawNotes,
          syllabusAnalysis,
          examAnalysis,
          workspaceId: workspaceId.trim(),
          userId: currentUser.uid,
          excludeTopics
        }),
      });
      const data = await parseResponse(res);
      if (data.ok && data.data && data.data.flashcards) {
        const newCards = data.data.flashcards.map(c => ({
          ...c,
          id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
        }));
        setFlashcards(prev => [...prev, ...newCards]);
        try {
          await fetch(`${apiBase}/api/analytics/onboard-flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: workspaceId.trim(),
              sessionId,
              flashcards: newCards
            }),
          });
        } catch (onboardErr) {
          console.warn("Failed to onboard additional flashcards", onboardErr);
        }
      }
    } catch (err) {
      console.error("Failed to fetch more flashcards", err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, uploadId, rawNotes, currentUser, flashcards, apiBase, syllabusAnalysis, examAnalysis, workspaceId]);

  const heatmapStatusStyles = {
    Green: { backgroundColor: '#d6f5d6', color: '#1f7a1f' },
    Yellow: { backgroundColor: '#fff3bf', color: '#8a6d00' },
    Red: { backgroundColor: '#ffe3e3', color: '#a61e1e' },
  };
  const accentColor = '#B3FF00';
  const translucentPanelStyle = {
    marginBottom: 36,
    padding: '30px 28px 26px',
    border: '1px solid rgba(179, 255, 0, 0.75)',
    borderRadius: 50,
    backgroundColor: 'rgba(34, 34, 34, 0.84)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 0 1px rgba(179, 255, 0, 0.34), 0 0 22px rgba(179, 255, 0, 0.16), 0 18px 40px rgba(0, 0, 0, 0.22)',
  };
  const glassyInputStyle = {
    width: '100%',
    minHeight: 56,
    padding: '16px 18px',
    boxSizing: 'border-box',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    background: 'rgba(71, 71, 71, 0.72)',
    color: '#F5F5F5',
    backdropFilter: 'blur(10px)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 24px rgba(0, 0, 0, 0.18)',
  };
  const glassyTextAreaStyle = {
    ...glassyInputStyle,
    minHeight: 148,
    resize: 'vertical',
  };
  const glassySelectStyle = {
    ...glassyInputStyle,
    width: 'auto',
    minWidth: 180,
    padding: '12px 16px',
  };
  const getActionButtonStyle = (disabled = false) => ({
    padding: '14px 22px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    backgroundColor: accentColor,
    color: '#000000',
    border: 'none',
    borderRadius: 18,
    opacity: disabled ? 0.45 : 1,
    boxShadow: disabled ? 'none' : '0 10px 24px rgba(179, 255, 0, 0.22)',
  });
  const uploadPickerButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    padding: '0 20px',
    backgroundColor: accentColor,
    color: '#000000',
    borderRadius: 18,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(179, 255, 0, 0.22)',
  };
  const fileCarouselStyle = {
    display: 'flex',
    gap: 14,
    overflowX: 'auto',
    paddingBottom: 8,
    WebkitOverflowScrolling: 'touch',
    scrollSnapType: 'x proximity',
  };
  const fileCardStyle = {
    minWidth: 220,
    maxWidth: 220,
    minHeight: 190,
    padding: '18px 18px 16px',
    borderRadius: 22,
    border: '1px solid rgba(179, 255, 0, 0.45)',
    background: 'rgba(71, 71, 71, 0.78)',
    color: '#F5F5F5',
    boxSizing: 'border-box',
    scrollSnapAlign: 'start',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 12px 26px rgba(0, 0, 0, 0.2)',
  };

  function getFileTypeMeta(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (extension === 'pdf') return { label: 'PDF', color: '#FF4D4D', accent: 'rgba(255, 77, 77, 0.24)' };
    if (extension === 'docx' || extension === 'doc') return { label: 'WORD', color: '#2F80ED', accent: 'rgba(47, 128, 237, 0.24)' };
    if (extension === 'pptx' || extension === 'ppt') return { label: 'PPT', color: '#FF7A1A', accent: 'rgba(255, 122, 26, 0.24)' };
    return { label: extension.toUpperCase() || 'DOC', color: accentColor, accent: 'rgba(179, 255, 0, 0.2)' };
  }

  useEffect(() => {
    if (currentUser?.uid) setWorkspaceId(currentUser.uid);
  }, [currentUser]);

  useEffect(() => {
    setUploadId(null);
    setRawNotes('');
    setSyllabusAnalysis(null);
    setExamAnalysis(null);
    setGeneratedData(null);
    setFlashcards([]);
    setResult('');
    setResultSource('');
    setNotice('');
  }, [youtubeUrl, files]);

  async function parseResponse(res) {
    const raw = await res.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; } catch (parseErr) { throw new Error(`Non-JSON response: ${raw.slice(0, 1000)}`); }
    if (!res.ok) throw new Error(data?.error || 'Request failed');
    return data;
  }

  async function handleExtract(e) {
    e.preventDefault();
    if (!youtubeUrl && files.length === 0) { setError('Please provide a YouTube URL or upload a file.'); return; }
    if (!currentUser?.uid) { setError('Please sign in to continue.'); return; }
    if (!workspaceId.trim()) { setError('Please provide a workspaceId.'); return; }
    setExtractLoading(true);
    setError('');
    setNotice('');
    setResult('');
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    try {
      const formData = new FormData();
      if (youtubeUrl) formData.append('youtubeUrl', youtubeUrl);
      if (files.length > 0) files.forEach(f => formData.append('file', f));
      formData.append('workspaceId', workspaceId.trim());
      formData.append('userId', currentUser.uid);
      formData.append('forceWhisper', forceWhisper ? 'true' : 'false');
      const res = await fetch(`${apiBase}/api/extract`, { method: 'POST', body: formData });
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setUploadId(data.uploadId);
      setRawNotes(data.rawText);
      setResult(data.rawText);
      setResultSource('extracted');
      setGeneratedData(null);
      setNotice(data.warning || '');
    } catch (err) { setError(err.message || String(err)); }
    finally { setExtractLoading(false); }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!currentUser?.uid) { setError('Please sign in to continue.'); return; }
    if (!rawNotes.trim()) { setError('Please extract notes first.'); return; }
    if (!syllabusText.trim()) { setError('Please provide syllabus text.'); return; }
    setAnalyzeLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/map-syllabus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, rawNotes, syllabusText, pastPapersText, workspaceId: workspaceId.trim() }),
      });
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setSyllabusAnalysis(data.data);
      setResult(JSON.stringify(data.data, null, 2));
      setResultSource('analysis');
    } catch (err) { setError(err.message || String(err)); }
    finally { setAnalyzeLoading(false); }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!currentUser?.uid) { setError('Please sign in to continue.'); return; }
    if (!syllabusAnalysis) { setError('Please map context first.'); return; }
    setGenerateLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, requestType, rawNotes, syllabusAnalysis, examAnalysis, workspaceId: workspaceId.trim(), userId: currentUser.uid, specificTopic }),
      });
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setGeneratedData(data.data);
      if (requestType === 'flashcards' && data.data?.flashcards) {
        const newCards = data.data.flashcards.map(c => ({
          ...c,
          id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
        }));
        setFlashcards(newCards);
        try {
          await fetch(`${apiBase}/api/analytics/onboard-flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId: workspaceId.trim(), sessionId, flashcards: newCards }),
          });
        } catch (onboardErr) { console.warn("Failed to onboard flashcards", onboardErr); }
      } else { setFlashcards([]); }
    } catch (err) { setError(err.message || String(err)); }
    finally { setGenerateLoading(false); }
  }

  async function handleFetchHeatmap(e) {
    e.preventDefault();
    if (!currentUser?.uid) { setHeatmapError('Please sign in to continue.'); return; }
    if (!workspaceId.trim()) { setHeatmapError('Please provide a workspaceId.'); return; }
    setHeatmapLoading(true);
    setHeatmapError('');
    setHeatmapResult(null);
    try {
      const res = await fetch(`${apiBase}/api/analytics/heatmap/${encodeURIComponent(workspaceId.trim())}?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setHeatmapResult(data.data);
    } catch (err) { setHeatmapError(err.message || String(err)); }
    finally { setHeatmapLoading(false); }
  }

  async function handleSurvivalPlan(e) {
    e.preventDefault();
    if (!currentUser?.uid) { setSurvivalError('Please sign in to continue.'); return; }
    const trimmedWorkspaceId = workspaceId.trim();
    const hoursValue = Number(hoursRemaining);
    if (!trimmedWorkspaceId) { setSurvivalError('Please provide a workspaceId.'); return; }
    if (!hoursRemaining.trim() || Number.isNaN(hoursValue)) { setSurvivalError('Please provide a valid hoursRemaining value.'); return; }
    setSurvivalLoading(true);
    setSurvivalError('');
    setSurvivalPlan(null);
    try {
      const res = await fetch(`${apiBase}/api/survival/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: trimmedWorkspaceId, hoursRemaining: hoursValue }),
      });
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setSurvivalPlan(data.data);
      setIsEmergencyActive(true);
      setIsVaultOpen(true);
    } catch (err) { setSurvivalError(err.message || String(err)); }
    finally { setSurvivalLoading(false); }
  }

  async function handleSurvivalModalSubmit(hrs) {
    if (!hrs) return;
    setHoursRemaining(hrs);
    const trimmedWorkspaceId = workspaceId.trim();
    const hoursValue = Number(hrs);
    if (trimmedWorkspaceId && !Number.isNaN(hoursValue)) {
      setSurvivalLoading(true);
      setSurvivalError('');
      setSurvivalPlan(null);
      setIsVaultOpen(false);
      setIsEmergencyActive(true); 
      setIsSyncing(true); 
      setShowSurvivalModal(false);
      try {
        const res = await fetch(`${apiBase}/api/survival/triage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId: trimmedWorkspaceId, hoursRemaining: hoursValue }),
        });
        const data = await parseResponse(res);
        if (!data.ok) throw new Error(data.error);
        setSurvivalPlan(data.data);
        setTimeout(() => {
          setIsSyncing(false);
          setIsVaultOpen(true);
        }, 4200); 
      } catch (err) {
        setSurvivalError(err.message || String(err));
        setIsEmergencyActive(false);
        setIsSyncing(false);
      } finally { setSurvivalLoading(false); }
    }
  }

  function handleStopSurvival() {
    setIsEmergencyActive(false);
    setIsVaultOpen(false);
    setIsSyncing(false);
    setSurvivalPlan(null);
    setSurvivalSeconds(0);
  }

  const loadSessions = React.useCallback(async () => {
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
    if (activeTab === 3) loadSessions();
  }, [activeTab, loadSessions]);

  const handleSessionClick = async (session) => {
    setUploadId(session.sessionId);
    setSessionId(session.sessionId);
    setWorkspaceId(session.workspaceId || 'user_123');
    setRawNotes(session.coreIntel?.rawNotes || '');
    setSyllabusText(session.coreIntel?.syllabusText || '');
    setPastPapersText(session.coreIntel?.pastPapersText || '');
    if (session.sourceType === 'socratic') {
      setSocraticHistory(JSON.stringify(session.coreIntel?.socraticChat || []));
      setSocraticTopic(session.coreIntel?.topic || '');
      setSocraticConfirmedTopic(session.coreIntel?.topic || '');
      setActiveTab(1);
    } else { setActiveTab(0); }
  };

  if (loadingAuth) return <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}><h1>K.A.I.</h1><p>Checking session...</p></div>;
  if (!currentUser) return <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', textAlign: 'center' }}><h1 style={{ color: '#B3FF00' }}>K.A.I. Emergency Triage</h1><p style={{ color: '#E8E8E8' }}>Sign in to continue.</p><button onClick={signInWithGoogle} style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 600, backgroundColor: '#B3FF00', color: '#000', border: 'none', borderRadius: 4 }}>Sign in with Google</button></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'transparent', transition: 'all 0.5s ease' }}>
      <StarsBackground />
      {isEmergencyActive && <div className="emergency-overlay" />}
      <div className="app-header" style={{ position: 'relative' }}>
        {isEmergencyActive && isVaultOpen && (
          <div className="header-timer">
            <span style={{ fontSize: 12, opacity: 0.8, letterSpacing: 1 }}>SURVIVAL CLOCK</span>
            {formatTime(survivalSeconds)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 25, marginLeft: 'auto', marginRight: 20 }}>
          <div onClick={() => setActiveTab(3)} style={{ fontSize: 24, cursor: 'pointer', width: 48, height: 48, backgroundColor: '#444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B3FF00', fontWeight: 800, transition: 'all 0.3s ease', border: activeTab === 3 ? '2px solid #B3FF00' : '1px solid rgba(255,255,255,0.1)', boxShadow: activeTab === 3 ? '0 0 15px rgba(179, 255, 0, 0.4)' : 'none' }}>K</div>
        </div>
      </div>
      <div className="tab-bar">
        <button className={`tab-button ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>Build</button>
        <button className={`tab-button ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>Study Lab</button>
        <button className={`tab-button ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>Survival Mode</button>
      </div>
      <div className="tab-content" style={{ flex: 1 }}>
        {activeTab === 0 && (
          <div>
            <div className="step-one-shell" style={{ marginTop: 50 }}>
              <RandomMovingBox><video src={chatbotVideo} autoPlay loop muted playsInline style={{ width: '280px', height: '280px', filter: 'drop-shadow(0 0 30px rgba(179, 255, 0, 0.4))' }} /></RandomMovingBox>
              <section style={{ ...translucentPanelStyle, minHeight: 280, paddingTop: 55, paddingBottom: 15 }}>
                <h2 style={{ textAlign: 'center', marginBottom: 24, marginTop: 0 }}>Step 1: Extract Content</h2>
                <form onSubmit={handleExtract}>
                  <div style={{ marginBottom: 18, maxWidth: 980, marginInline: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 640px', minWidth: 320 }}><input type="text" placeholder="YouTube URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} style={glassyInputStyle} /></div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '0 18px', borderRadius: 18, background: 'rgba(71, 71, 71, 0.72)', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#E8E8E8', fontWeight: 600, whiteSpace: 'nowrap' }}><input type="checkbox" checked={forceWhisper} onChange={(e) => setForceWhisper(e.target.checked)} />Force AI Audio</label>
                  </div>
                  <div style={{ marginBottom: 22, width: '100%', textAlign: 'center' }}>
                    <input id="study-material-upload" type="file" accept=".pdf,.docx,.pptx" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}><label htmlFor="study-material-upload" style={uploadPickerButtonStyle}>📁 Local Context</label></div>
                  </div>
                  {files.length > 0 && <div style={{ maxWidth: 980, marginInline: 'auto', marginTop: 20 }}><div className="file-carousel" style={fileCarouselStyle}>{files.map((f, i) => { const meta = getFileTypeMeta(f.name); return <div key={i} style={fileCardStyle}><div><div style={{ fontSize: 11, fontWeight: 900, color: meta.color, marginBottom: 8, letterSpacing: 1.5 }}>{meta.label}</div><div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{f.name}</div></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, opacity: 0.5 }}>{(f.size / 1024 / 1024).toFixed(2)} MB</span><button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>✕</button></div></div>; })}</div></div>}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}><button type="submit" disabled={extractLoading} style={getActionButtonStyle(extractLoading)}>{extractLoading ? '⚡ Syncing...' : '⚡ Initialize'}</button></div>
                </form>
                <LoadingProgressBar loading={extractLoading} label="Extracting..." />
              </section>
            </div>
            {notice && <div style={{ marginTop: 20, padding: 18, borderRadius: 20, border: '1px solid #FFAA00', color: '#FFAA00', textAlign: 'center' }}>⚠️ {notice}</div>}
            {error && <div style={{ marginTop: 20, padding: 18, borderRadius: 20, border: '1px solid #FF4D4D', color: '#FF4D4D', textAlign: 'center' }}>❌ {error}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24, marginTop: 40, maxWidth: 1200, marginInline: 'auto' }}>
              <section style={{ ...translucentPanelStyle, opacity: rawNotes ? 1 : 0.4 }}><h2>Map Context</h2><form onSubmit={handleAnalyze}><textarea placeholder="Syllabus..." value={syllabusText} onChange={(e) => setSyllabusText(e.target.value)} style={glassyTextAreaStyle} /><button type="submit" disabled={analyzeLoading || !rawNotes} style={getActionButtonStyle(analyzeLoading || !rawNotes)}>🎯 Deploy Mapper</button></form></section>
              <section style={{ ...translucentPanelStyle, opacity: syllabusAnalysis ? 1 : 0.4 }}><h2>Forge Study Intel</h2><form onSubmit={handleGenerate}><select value={requestType} onChange={(e) => setRequestType(e.target.value)} style={glassySelectStyle}><option value="flashcards">Flashcards</option><option value="summary">Summary</option></select><button type="submit" disabled={generateLoading || !syllabusAnalysis} style={getActionButtonStyle(generateLoading || !syllabusAnalysis)}>⚒️ Ignite Forge</button></form></section>
            </div>
          </div>
        )}
        {activeTab === 1 && <SocraticTutorTest apiBase={apiBase} workspaceId={workspaceId} sessionId={sessionId} chatHistory={socraticHistory} setChatHistory={setSocraticHistory} topic={socraticTopic} setTopic={setSocraticTopic} confirmedTopic={socraticConfirmedTopic} setConfirmedTopic={setSocraticConfirmedTopic} attemptCount={socraticAttemptCount} setAttemptCount={setSocraticAttemptCount} />}
        {activeTab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, height: '100%', padding: '20px 40px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30, height: '100%' }}>
              <div className="fade-in" style={{ backgroundColor: 'rgba(25, 25, 25, 0.7)', borderRadius: '40px', border: `2px solid ${isEmergencyActive ? '#ff4d4d' : 'rgba(179, 255, 0, 0.4)'}`, padding: '30px', backdropFilter: 'blur(25px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative', overflow: 'hidden' }}>
                <video src={ignisVideo} autoPlay loop muted playsInline className={`ignis-visual ${isEmergencyActive ? 'emergency' : ''}`} onClick={() => setShowSurvivalModal(true)} style={{ width: '70%', height: 'auto', maxWidth: 400, cursor: 'pointer', zIndex: 2, imageRendering: 'crisp-edges' }} />
                <div style={{ position: 'absolute', inset: 0, background: isEmergencyActive ? 'radial-gradient(circle, rgba(255, 77, 77, 0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(179, 255, 0, 0.05) 0%, transparent 70%)', zIndex: 1 }} />
                <div style={{ position: 'absolute', bottom: 30, right: 30, opacity: 0.5, fontSize: 12, fontWeight: 900, color: isEmergencyActive ? '#ff4d4d' : '#B3FF00', letterSpacing: 2, zIndex: 3 }}>IGNIS NEURAL CORE v4.1.2</div>
              </div>
              <div className="fade-in" style={{ backgroundColor: 'rgba(25, 25, 25, 0.7)', borderRadius: '40px', border: `2px solid ${isEmergencyActive ? '#ff4d4d' : 'rgba(179, 255, 0, 0.4)'}`, padding: '35px', backdropFilter: 'blur(25px)', lineHeight: 1.6, minHeight: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}><div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: isEmergencyActive ? '#ff4d4d' : '#B3FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>I</div><div style={{ color: isEmergencyActive ? '#ff4d4d' : '#B3FF00', fontWeight: 900, fontSize: 22, textTransform: 'uppercase', letterSpacing: 1 }}>System Profile: Ignis</div></div>
                <div style={{ fontSize: 16, opacity: 0.9, marginBottom: 15 }}>Greetings, Commander. I am <span style={{ color: isEmergencyActive ? '#ff4d4d' : '#B3FF00', fontWeight: 800 }}>Ignis</span>, your emergency triage strategist.</div>
                <div style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.8 }}>When time is your enemy, I am your architect. Click my neural core above to initialize a maximum-efficiency survival protocol.</div>
                {isEmergencyActive && <button onClick={handleStopSurvival} style={{ marginTop: 30, width: '100%', padding: '15px', borderRadius: '20px', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2, boxShadow: '0 0 20px rgba(255, 77, 77, 0.4)' }}>Terminate Mission</button>}
              </div>
            </div>
            <div className={`vault-container ${isVaultOpen ? 'vault-open' : ''}`} style={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', borderRadius: '50px', border: `2px solid ${isEmergencyActive ? '#ff4d4d' : 'rgba(179, 255, 0, 0.25)'}`, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
              <div className="vault-door-left"><div className="vault-lock-ring" style={{ right: '-60px' }}><div style={{ color: '#ff4d4d', fontWeight: 900, fontSize: 10 }}>K.A.I.</div></div></div>
              <div className="vault-door-right"><div className="vault-lock-ring" style={{ left: '-60px' }}><div style={{ color: '#ff4d4d', fontWeight: 900, fontSize: 10 }}>SECURE</div></div></div>
              {!isVaultOpen && isSyncing && (<div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 12, textAlign: 'center', width: '80%' }}><div style={{ color: '#ff4d4d', fontWeight: 900, fontSize: 20, letterSpacing: 5, marginBottom: 10 }}>MISSION SYNCHRONIZATION</div><div className="sync-bar"><div className="sync-bar-fill" /></div><div style={{ color: '#ff4d4d', fontSize: 12, marginTop: 15, opacity: 0.6, fontWeight: 700 }}>UPLOADING SURVIVAL PARAMETERS...</div></div>)}
              <div className="vault-content" style={{ padding: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexShrink: 0 }}><h2 style={{ color: '#ff4d4d', margin: 0, textTransform: 'uppercase', letterSpacing: 4 }}>Tactical Battle Plan</h2><div style={{ padding: '8px 15px', backgroundColor: 'rgba(255, 77, 77, 0.2)', border: '1px solid #ff4d4d', borderRadius: 10, color: '#ff4d4d', fontWeight: 800, fontSize: 12 }}>DECODED</div></div>
                <div style={{ flex: 1, overflowY: 'auto' }}>{survivalPlan && (<div><div style={{ marginBottom: 30, padding: 25, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 25, borderLeft: '5px solid #ff4d4d' }}><div style={{ fontSize: 12, opacity: 0.5, textTransform: 'uppercase', fontWeight: 900 }}>Mission Briefing</div><div style={{ fontSize: 16, lineHeight: 1.7 }}>{survivalPlan.missionBriefing}</div></div><table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}><thead><tr>{['Phase', 'Action', 'Target', 'Agent', 'Instruction'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 20px', fontSize: 11, textTransform: 'uppercase', opacity: 0.5 }}>{h}</th>)}</tr></thead><tbody>{survivalPlan.survivalPlan.map((row, idx) => <tr key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}><td style={{ padding: '25px 20px', borderRadius: '20px 0 0 20px', fontWeight: 900, color: '#ff4d4d' }}>{row.phase}</td><td style={{ padding: '25px 20px' }}>{row.action}</td><td style={{ padding: '25px 20px' }}>{row.concept}</td><td style={{ padding: '25px 20px', color: '#B3FF00', fontWeight: 800 }}>{row.triggerAgent}</td><td style={{ padding: '25px 20px', borderRadius: '0 20px 20px 0', fontSize: 14 }}>{row.instruction}</td></tr>)}</tbody></table></div>)}</div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 3 && (
          <div style={{ padding: 24, maxWidth: 800, marginInline: 'auto' }}>
            <h2 style={{ color: '#B3FF00' }}>Commander Profile</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}><button onClick={signOutUser} style={{ padding: '10px 16px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Sign Out</button><button onClick={async () => { if (window.confirm("Delete account?")) { try { await deleteAccount(); } catch (e) { alert("Failed"); } } }} style={{ padding: '10px 16px', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>Delete Account</button></div>
            <h3>Session History</h3>
            {sessionsLoading ? <p>Loading...</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{sessions.map(s => <div key={s.sessionId} onClick={() => handleSessionClick(s)} style={{ backgroundColor: 'rgba(34,34,34,0.8)', padding: 20, borderRadius: 12, border: '1px solid #B3FF00', cursor: 'pointer' }}><div style={{ fontSize: 18, fontWeight: 'bold', color: '#B3FF00' }}>{s.subject || 'Session'}</div></div>)}</div>}
          </div>
        )}
      </div>
      {showSurvivalModal && (<div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}><div style={{ backgroundColor: '#1a1a1a', borderRadius: '40px', border: '2px solid #ff4d4d', padding: '50px', maxWidth: '500px', width: '90%', textAlign: 'center' }}><div style={{ fontSize: 12, fontWeight: 900, color: '#ff4d4d', textTransform: 'uppercase', letterSpacing: 5, marginBottom: 20 }}>MISSION PARAMETERS</div><h2 style={{ color: '#fff', fontSize: 24, marginBottom: 10 }}>Operational Duration</h2><div style={{ position: 'relative', marginBottom: 40 }}><input type="number" defaultValue="6" id="survival-hrs-input" autoFocus style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 77, 77, 0.4)', padding: '20px', borderRadius: '20px', fontSize: '32px', fontWeight: 900, color: '#ff4d4d', textAlign: 'center', outline: 'none' }} /><div style={{ position: 'absolute', right: 25, top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#ff4d4d', opacity: 0.5 }}>HRS</div></div><div style={{ display: 'flex', gap: 20 }}><button onClick={() => setShowSurvivalModal(false)} style={{ flex: 1, padding: '18px', borderRadius: '18px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, cursor: 'pointer' }}>ABORT</button><button onClick={() => handleSurvivalModalSubmit(document.getElementById('survival-hrs-input').value)} style={{ flex: 2, padding: '18px', borderRadius: '18px', backgroundColor: '#ff4d4d', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' }}>INITIALIZE ➔</button></div></div></div>)}
    </div>
  );
}

export default App;
