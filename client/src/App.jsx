import React, { useEffect, useState } from 'react';
import SocraticTutorTest from './components/SocraticTutorTest.jsx';
import VisualAid from './components/VisualAid.jsx';
import { useAuth } from './context/AuthContext.jsx';

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [pastPapersText, setPastPapersText] = useState('');
  const [syllabusImage, setSyllabusImage] = useState(null);
  const [notesImage, setNotesImage] = useState(null);
  const [syllabusImageLoading, setSyllabusImageLoading] = useState(false);
  const [notesImageLoading, setNotesImageLoading] = useState(false);
  const [syllabusImageError, setSyllabusImageError] = useState('');
  const [notesImageError, setNotesImageError] = useState('');
  const [uploadId, setUploadId] = useState(null);
  const [rawNotes, setRawNotes] = useState('');
  const [workspaceId, setWorkspaceId] = useState('user_123');
  const [forceWhisper, setForceWhisper] = useState(false);
  const [syllabusAnalysis, setSyllabusAnalysis] = useState(null);
  const [examAnalysis, setExamAnalysis] = useState(null);
  const [requestType, setRequestType] = useState('flashcards');
  const [specificTopic, setSpecificTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [resultSource, setResultSource] = useState('');
  const [error, setError] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState('');
  const [heatmapResult, setHeatmapResult] = useState(null);
  const [hoursRemaining, setHoursRemaining] = useState('6');
  const [survivalLoading, setSurvivalLoading] = useState(false);
  const [survivalError, setSurvivalError] = useState('');
  const [survivalPlan, setSurvivalPlan] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const { currentUser, loadingAuth, signInWithGoogle, signOutUser } = useAuth();

  const heatmapStatusStyles = {
    Green: { backgroundColor: '#d6f5d6', color: '#1f7a1f' },
    Yellow: { backgroundColor: '#fff3bf', color: '#8a6d00' },
    Red: { backgroundColor: '#ffe3e3', color: '#a61e1e' },
  };
  const translucentPanelStyle = {
    marginBottom: 24,
    padding: 12,
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: 50,
    backgroundColor: 'rgba(44, 46, 42, 0.72)',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 0 0 1px rgba(179, 255, 0, 0.18), 0 18px 40px rgba(0, 0, 0, 0.22)',
  };

  const apiBase = import.meta.env.VITE_API_URL ?? '';

  useEffect(() => {
    if (currentUser?.uid) {
      setWorkspaceId(currentUser.uid);
    }
  }, [currentUser]);

  async function parseResponse(res) {
    const raw = await res.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (parseErr) {
      throw new Error(`Non-JSON response from server: ${raw.slice(0, 1000)}`);
    }

    if (!res.ok) throw new Error(data?.error || 'Request failed');
    return data;
  }

  async function handleExtract(e) {
    e.preventDefault();
    if (!youtubeUrl && !file) {
      setError('Please provide a YouTube URL or upload a file.');
      return;
    }
    if (!currentUser?.uid) {
      setError('Please sign in to continue.');
      return;
    }
    if (!workspaceId.trim()) {
      setError('Please provide a workspaceId.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const formData = new FormData();
      if (youtubeUrl) {
        formData.append('youtubeUrl', youtubeUrl);
      }
      if (file) {
        formData.append('file', file);
      }
      formData.append('workspaceId', workspaceId.trim());
      formData.append('userId', currentUser.uid);
      formData.append('forceWhisper', forceWhisper ? 'true' : 'false');

      const res = await fetch(`${apiBase}/api/extract`, {
        method: 'POST',
        body: formData,
      });

      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      
      setUploadId(data.uploadId);
      setRawNotes(data.rawText);
      setResult(data.rawText);
      setResultSource('extracted');
      setGeneratedData(null);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }


  async function handleAnalyze(e) {
    e.preventDefault();
    if (!currentUser?.uid) {
      setError('Please sign in to continue.');
      return;
    }
    if (!rawNotes.trim()) {
      setError('Please extract notes first.');
      return;
    }

    if (!syllabusText.trim()) {
      setError('Please provide syllabus text.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes,
          syllabusText,
          pastPapersText: pastPapersText.trim() || null,
        }),
      });

      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      
      setSyllabusAnalysis(data.syllabusAnalysis);
      setExamAnalysis(data.examAnalysis);
      setResult(JSON.stringify(data, null, 2));
      setResultSource('analyzed');
      setGeneratedData(null);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleOcrImage(target) {
    const fileToUse = target === 'syllabus' ? syllabusImage : notesImage;
    if (!fileToUse) {
      if (target === 'syllabus') {
        setSyllabusImageError('Please select a syllabus image.');
      } else {
        setNotesImageError('Please select a notes image.');
      }
      return;
    }

    if (target === 'syllabus') {
      setSyllabusImageLoading(true);
      setSyllabusImageError('');
    } else {
      setNotesImageLoading(true);
      setNotesImageError('');
    }

    try {
      const formData = new FormData();
      formData.append('image', fileToUse);

      const res = await fetch(`${apiBase}/api/ocr/image`, {
        method: 'POST',
        body: formData,
      });
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);

      if (target === 'syllabus') {
        setSyllabusText((prev) => {
          const trimmed = (data.text || '').trim();
          if (!trimmed) return prev;
          return prev ? `${prev}\n\n${trimmed}` : trimmed;
        });
      } else {
        setRawNotes((prev) => {
          const trimmed = (data.text || '').trim();
          if (!trimmed) return prev;
          return prev ? `${prev}\n\n${trimmed}` : trimmed;
        });
      }
    } catch (err) {
      if (target === 'syllabus') {
        setSyllabusImageError(err.message || String(err));
      } else {
        setNotesImageError(err.message || String(err));
      }
    } finally {
      if (target === 'syllabus') {
        setSyllabusImageLoading(false);
      } else {
        setNotesImageLoading(false);
      }
    }
  }

  async function handleGenerateOutput(e) {
    e.preventDefault();
    if (!currentUser?.uid) {
      setError('Please sign in to continue.');
      return;
    }
    if (!uploadId) {
      setError('Please extract content first to get an uploadId.');
      return;
    }

    if (!rawNotes.trim()) {
      setError('Please provide raw notes for generation.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          requestType,
          rawNotes,
          syllabusAnalysis,
          examAnalysis,
          specificTopic: specificTopic.trim() ? specificTopic.trim() : null,
          workspaceId: workspaceId.trim(),
          userId: currentUser.uid,
        }),
      });

      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      
      setResult(JSON.stringify(data.data, null, 2));
      setResultSource(`generated (from ${data.source})`);
      setGeneratedData(data.data);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchHeatmap(e) {
    e.preventDefault();
    if (!currentUser?.uid) {
      setHeatmapError('Please sign in to continue.');
      return;
    }
    if (!workspaceId.trim()) {
      setHeatmapError('Please provide a workspaceId.');
      return;
    }

    setHeatmapLoading(true);
    setHeatmapError('');
    setHeatmapResult(null);

    try {
      const res = await fetch(
        `${apiBase}/api/analytics/heatmap/${encodeURIComponent(workspaceId.trim())}`
      );
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setHeatmapResult(data.data);
    } catch (err) {
      setHeatmapError(err.message || String(err));
    } finally {
      setHeatmapLoading(false);
    }
  }

  async function handleSurvivalPlan(e) {
    e.preventDefault();
    if (!currentUser?.uid) {
      setSurvivalError('Please sign in to continue.');
      return;
    }
    const trimmedWorkspaceId = workspaceId.trim();
    const hoursValue = Number(hoursRemaining);

    if (!trimmedWorkspaceId) {
      setSurvivalError('Please provide a workspaceId.');
      return;
    }

    if (!hoursRemaining.trim() || Number.isNaN(hoursValue)) {
      setSurvivalError('Please provide a valid hoursRemaining value.');
      return;
    }

    setSurvivalLoading(true);
    setSurvivalError('');
    setSurvivalPlan(null);

    try {
      const res = await fetch(`${apiBase}/api/survival/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: trimmedWorkspaceId,
          hoursRemaining: hoursValue,
        }),
      });
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setSurvivalPlan(data.data);
    } catch (err) {
      setSurvivalError(err.message || String(err));
    } finally {
      setSurvivalLoading(false);
    }
  }


  if (loadingAuth) {
    return (
      <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <h1>🤖 K.A.I. — Study Assistant</h1>
        <p>Checking session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <h1 style={{ color: '#B3FF00' }}>🚨 K.A.I. Emergency Triage</h1>
        <p style={{ color: '#E8E8E8' }}>Sign in with Google to start your survival plan.</p>
        <button
          onClick={signInWithGoogle}
          style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 600, backgroundColor: '#B3FF00', color: '#000', border: 'none', borderRadius: 4 }}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'transparent' }}>
      {/* Header */}
      <div className="app-header">
        <div style={{ 
          fontSize: 28, 
          cursor: 'pointer',
          width: 48,
          height: 48,
          backgroundColor: '#444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 'auto'
        }}>👤</div>
        {/* <div className="app-header-user">
          <span>{currentUser.email || currentUser.uid}</span>
          <button onClick={signOutUser}>Sign out</button>
        </div> */}
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab-button ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => setActiveTab(0)}
        >
          📚 Build
        </button>
        <button
          className={`tab-button ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => setActiveTab(1)}
        >
          🎙️ Study Lab
        </button>
        <button
          className={`tab-button ${activeTab === 2 ? 'active' : ''}`}
          onClick={() => setActiveTab(2)}
        >
          🚨 Survival Mode
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content" style={{ flex: 1 }}>
        {/* Tab 0: Build */}
        {activeTab === 0 && (
          <div>
      
      {/* Step 1: Extract */}
      <section style={translucentPanelStyle}>
        <h2>Step 1: Extract Content</h2>
        <form onSubmit={handleExtract}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Workspace ID"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              readOnly
              style={{ width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="YouTube URL (or leave blank for file upload)"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              style={{ width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <input
              type="file"
              accept=".pdf,.docx,.pptx"
              multiple
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ marginBottom: 8 }}
            />
            <small>
              {file ? `Selected: ${file.name}` : 'Or upload PDF/DOCX/PPTX'}
            </small>
          </div>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={forceWhisper}
              onChange={(e) => setForceWhisper(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Force Groq Whisper (skip RapidAPI)
          </label>
          <button type="submit" disabled={loading || (!youtubeUrl && !file)} style={{ padding: '10px 16px', cursor: 'pointer' }}>
            {loading ? '⏳ Extracting…' : '📤 Extract Content'}
          </button>
          {uploadId && <p style={{ color: 'green', marginTop: 8 }}>✅ Extracted! Upload ID: {uploadId.slice(0, 8)}...</p>}
        </form>
      </section>

      {/* Step 2: Analyze */}
      <section style={translucentPanelStyle}>
        <h2>Step 2: Analyze (Optional)</h2>
        <form onSubmit={handleAnalyze}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Syllabus Image (optional)</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => setSyllabusImage(e.target.files?.[0] || null)}
                style={{ marginBottom: 8 }}
              />
              <button
                type="button"
                onClick={() => handleOcrImage('syllabus')}
                disabled={syllabusImageLoading}
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                {syllabusImageLoading ? '⏳ OCR Syllabus…' : '🖼️ OCR Syllabus'}
              </button>
              {syllabusImageError && (
                <div style={{ color: 'crimson', marginTop: 8 }}>{syllabusImageError}</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>Notes Image (optional)</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => setNotesImage(e.target.files?.[0] || null)}
                style={{ marginBottom: 8 }}
              />
              <button
                type="button"
                onClick={() => handleOcrImage('notes')}
                disabled={notesImageLoading}
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                {notesImageLoading ? '⏳ OCR Notes…' : '🖼️ OCR Notes'}
              </button>
              {notesImageError && (
                <div style={{ color: 'crimson', marginTop: 8 }}>{notesImageError}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <textarea
              placeholder="Paste syllabus text here (required)"
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              rows={4}
              style={{ flex: 1, padding: 8 }}
            />
            <textarea
              placeholder="Paste past exam papers (optional)"
              value={pastPapersText}
              onChange={(e) => setPastPapersText(e.target.value)}
              rows={4}
              style={{ flex: 1, padding: 8 }}
            />
          </div>
          <button type="submit" disabled={loading || !rawNotes.trim()} style={{ padding: '10px 16px', cursor: 'pointer' }}>
            {loading ? '⏳ Analyzing…' : '🔍 Analyze Content'}
          </button>
          {syllabusAnalysis && <p style={{ color: 'green', marginTop: 8 }}>✅ Syllabus mapped!</p>}
          {examAnalysis && <p style={{ color: 'green', marginTop: 8 }}>✅ Exam patterns analyzed!</p>}
        </form>
      </section>

      {/* Step 3: Generate */}
      <section style={translucentPanelStyle}>
        <h2>Step 3: Generate Output</h2>
        <form onSubmit={handleGenerateOutput}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <label>
              Output Type:{' '}
              <select value={requestType} onChange={(e) => setRequestType(e.target.value)} style={{ padding: 6 }}>
                <option value="flashcards">📇 Flashcards</option>
                <option value="study_plan">📋 Study Plan</option>
                <option value="summary">📝 Summary</option>
                <option value="mock_test">❓ Mock Test</option>
                <option value="eli5">🧒 ELI5</option>
              </select>
            </label>
            <input
              type="text"
              placeholder="Specific topic for ELI5 (optional)"
              value={specificTopic}
              onChange={(e) => setSpecificTopic(e.target.value)}
              style={{ flex: 1, padding: 6 }}
            />
          </div>
          <button type="submit" disabled={loading || !uploadId} style={{ padding: '10px 16px', cursor: 'pointer' }}>
            {loading ? '⏳ Generating…' : '✨ Generate Output'}
          </button>
        </form>
      </section>

      {/* Results */}
      {error && <div style={{ color: 'crimson', marginBottom: 12, padding: 12, backgroundColor: '#ffe6e6', borderRadius: 4 }}>❌ {error}</div>}

      {generatedData && (
        <section
          style={{
            ...translucentPanelStyle,
            border: '1px solid rgba(255, 255, 255, 0.35)',
            backgroundColor: 'rgba(253, 247, 255, 0.76)',
          }}
        >
          <h3 style={{ marginTop: 0 }}>🧠 Visual Outputs</h3>

          {requestType === 'flashcards' && Array.isArray(generatedData.flashcards) && (
            <div>
              {generatedData.flashcards.map((card, idx) => (
                <div key={`flashcard-${idx}`} style={{ padding: 12, marginBottom: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{card.front}</div>
                  <div style={{ marginBottom: 8 }}>{card.back}</div>
                  <VisualAid code={card.mermaidCode} />
                </div>
              ))}
            </div>
          )}

          {requestType === 'summary' && generatedData.keyTakeaways && (
            <div>
              <h4 style={{ marginBottom: 6 }}>{generatedData.title}</h4>
              <p style={{ marginTop: 0 }}>{generatedData.executiveSummary}</p>
              {generatedData.keyTakeaways.map((takeaway, idx) => (
                <div key={`summary-${idx}`} style={{ padding: 12, marginBottom: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                  <div style={{ fontWeight: 700 }}>{takeaway.topic}</div>
                  <div style={{ marginBottom: 6 }}>{takeaway.summary}</div>
                  {takeaway.mnemonic && (
                    <div style={{ fontStyle: 'italic', marginBottom: 6 }}>Mnemonic: {takeaway.mnemonic}</div>
                  )}
                  <VisualAid code={takeaway.mermaidCode} />
                </div>
              ))}
            </div>
          )}

          {requestType === 'eli5' && generatedData.simpleExplanation && (
            <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{generatedData.topic}</div>
              <div style={{ marginBottom: 6 }}>{generatedData.theAnalogy}</div>
              <div style={{ marginBottom: 6 }}>{generatedData.simpleExplanation}</div>
              <div style={{ marginBottom: 6 }}>{generatedData.whyItMatters}</div>
              <VisualAid code={generatedData.mermaidCode} />
            </div>
          )}

          {requestType === 'mock_test' && Array.isArray(generatedData.questions) && (
            <div>
              <h4 style={{ marginBottom: 6 }}>{generatedData.testTitle}</h4>
              {generatedData.questions.map((question, idx) => (
                <div key={`question-${idx}`} style={{ padding: 12, marginBottom: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    Q{question.questionNumber}: {question.questionText}
                  </div>
                  <VisualAid code={question.questionMermaidCode} />
                  {Array.isArray(question.options) && question.options.length > 0 && (
                    <ul style={{ marginTop: 0, paddingLeft: 18 }}>
                      {question.options.map((option, optIdx) => (
                        <li key={`opt-${optIdx}`}>{option}</li>
                      ))}
                    </ul>
                  )}
                  <div style={{ marginBottom: 6 }}>Answer: {question.correctAnswer}</div>
                  <div style={{ marginBottom: 6 }}>{question.explanation}</div>
                  <VisualAid code={question.explanationMermaidCode} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {result && (
        <section
          style={{
            ...translucentPanelStyle,
            border: '1px solid rgba(255, 255, 255, 0.35)',
            backgroundColor: 'rgba(249, 249, 249, 0.76)',
          }}
        >
          <h3>📊 Results {resultSource && `(${resultSource})`}</h3>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto', padding: 12, backgroundColor: '#fff', borderRadius: 4 }}>{result}</pre>
        </section>
      )}

      {/* Heatmap Test Panel */}
      <section style={translucentPanelStyle}>
        <h2>📈 Heatmap Analytics</h2>
        <form onSubmit={handleFetchHeatmap}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="Workspace ID"
              style={{ flex: 1, padding: 8 }}
            />
            <button
              type="submit"
              disabled={heatmapLoading || !workspaceId.trim()}
              style={{ padding: '10px 16px', cursor: 'pointer' }}
            >
              {heatmapLoading ? '⏳ Fetching…' : '📈 Fetch Heatmap'}
            </button>
          </div>
        </form>

        {heatmapError && (
          <div
            style={{
              color: 'crimson',
              marginBottom: 12,
              padding: 12,
              backgroundColor: '#ffe6e6',
              borderRadius: 4,
            }}
          >
            ❌ {heatmapError}
          </div>
        )}

        {heatmapResult && (
          <div style={{ backgroundColor: '#f7f7f7', padding: 12, borderRadius: 4 }}>
            <h3 style={{ marginTop: 0 }}>Overview</h3>
            <pre style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {JSON.stringify(heatmapResult.overview, null, 2)}
            </pre>
            <h3 style={{ marginTop: 0 }}>Heatmap</h3>
            {Array.isArray(heatmapResult.heatmap) && heatmapResult.heatmap.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Topic</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Avg Score</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Missed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapResult.heatmap.map((row, idx) => {
                      const heatmapStatusStyles = {
                        Green: { backgroundColor: '#d6f5d6', color: '#1f7a1f' },
                        Yellow: { backgroundColor: '#fff3bf', color: '#8a6d00' },
                        Red: { backgroundColor: '#ffe3e3', color: '#a61e1e' },
                      };
                      const statusStyle = heatmapStatusStyles[row.status] || {
                        backgroundColor: '#f0f0f0',
                        color: '#333',
                      };
                      return (
                        <tr key={`${row.topic}-${idx}`}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.topic}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {typeof row.avgScore === 'number' ? `${row.avgScore}%` : row.avgScore}
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: 12,
                                fontWeight: 600,
                                ...statusStyle,
                              }}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                            {row.missed || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ margin: 0 }}>No heatmap data yet. Grade at least one exam with a topic.</p>
            )}
          </div>
        )}
      </section>
          </div>
        )}

        {/* Tab 1: Study Lab */}
        {activeTab === 1 && (
          <div>
            <SocraticTutorTest
              apiBase={import.meta.env.VITE_API_URL ?? ''}
              workspaceId={workspaceId}
              onWorkspaceIdChange={setWorkspaceId}
            />
          </div>
        )}

        {/* Tab 2: Survival Mode */}
        {activeTab === 2 && (
          <div>
            <section style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
              <h2>🚨 Survival Mode (Agent 11)</h2>
              <form onSubmit={handleSurvivalPlan}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={hoursRemaining}
                    onChange={(e) => setHoursRemaining(e.target.value)}
                    placeholder="Hours Remaining"
                    style={{ width: 160, padding: 8 }}
                  />
                  <button
                    type="submit"
                    disabled={survivalLoading}
                    style={{ padding: '10px 16px', cursor: 'pointer' }}
                  >
                    {survivalLoading ? '⏳ Planning…' : '🚨 Generate Plan'}
                  </button>
                </div>
              </form>

              {survivalError && (
                <div
                  style={{
                    color: 'crimson',
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: '#ffe6e6',
                    borderRadius: 4,
                  }}
                >
                  ❌ {survivalError}
                </div>
              )}

              {survivalPlan && (
                <div style={{ backgroundColor: '#f7f7f7', padding: 12, borderRadius: 4 }}>
                  <h3 style={{ marginTop: 0 }}>Mission Briefing</h3>
                  <p style={{ marginTop: 0 }}>{survivalPlan.missionBriefing}</p>

                  <h3>Survival Plan</h3>
                  {Array.isArray(survivalPlan.survivalPlan) && survivalPlan.survivalPlan.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Phase</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Action</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Concept</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Trigger</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Instruction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {survivalPlan.survivalPlan.map((row, idx) => (
                            <tr key={`${row.phase}-${idx}`}>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.phase}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.action}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.concept}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.triggerAgent}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.instruction}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ margin: 0 }}>No plan items returned.</p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
