import React, { useState } from 'react';

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [pastPapersText, setPastPapersText] = useState('');
  const [uploadId, setUploadId] = useState(null);
  const [rawNotes, setRawNotes] = useState('');
  const [forceWhisper, setForceWhisper] = useState(false);
  const [syllabusAnalysis, setSyllabusAnalysis] = useState(null);
  const [examAnalysis, setExamAnalysis] = useState(null);
  const [requestType, setRequestType] = useState('flashcards');
  const [specificTopic, setSpecificTopic] = useState('');
  const [socraticAudio, setSocraticAudio] = useState(null);
  const [socraticTopic, setSocraticTopic] = useState('');
  const [socraticWorkspaceId, setSocraticWorkspaceId] = useState('');
  const [socraticHistory, setSocraticHistory] = useState('[]');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [resultSource, setResultSource] = useState('');
  const [error, setError] = useState('');

  const apiBase = import.meta.env.VITE_API_URL ?? '';

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
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }


  async function handleAnalyze(e) {
    e.preventDefault();
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
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateOutput(e) {
    e.preventDefault();
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
        }),
      });

      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      
      setResult(JSON.stringify(data.data, null, 2));
      setResultSource(`generated (from ${data.source})`);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSocraticTurn(e) {
    e.preventDefault();
    if (!socraticAudio) {
      setError('Please attach an audio file for the Socratic turn.');
      return;
    }
    if (!socraticTopic.trim() || !socraticWorkspaceId.trim()) {
      setError('Please provide topic and workspaceId.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const formData = new FormData();
      formData.append('audioFile', socraticAudio);
      formData.append('topic', socraticTopic.trim());
      formData.append('workspaceId', socraticWorkspaceId.trim());
      formData.append('chatHistory', socraticHistory.trim() || '[]');

      const res = await fetch(`${apiBase}/api/socratic/turn`, {
        method: 'POST',
        body: formData,
      });

      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);

      setResult(JSON.stringify(data, null, 2));
      setResultSource('socratic');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>🤖 K.A.I. — Study Assistant</h1>
      
      {/* Step 1: Extract */}
      <section style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
        <h2>Step 1: Extract Content</h2>
        <form onSubmit={handleExtract}>
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
            <small>{file ? `Selected: ${file.name}` : 'Or upload a PDF/DOCX file'}</small>
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
      <section style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
        <h2>Step 2: Analyze (Optional)</h2>
        <form onSubmit={handleAnalyze}>
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
      <section style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
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

      {/* Step 4: Socratic Tutor */}
      <section style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
        <h2>Step 4: Socratic Tutor (Audio)</h2>
        <form onSubmit={handleSocraticTurn}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setSocraticAudio(e.target.files?.[0] || null)}
              style={{ marginBottom: 8 }}
            />
            <small>{socraticAudio ? `Selected: ${socraticAudio.name}` : 'Upload an audio response'}</small>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Topic (e.g., Graph Algorithms)"
              value={socraticTopic}
              onChange={(e) => setSocraticTopic(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
            <input
              type="text"
              placeholder="workspaceId"
              value={socraticWorkspaceId}
              onChange={(e) => setSocraticWorkspaceId(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
          </div>
          <textarea
            placeholder='Chat history JSON array (optional). Example: [{"role":"user","parts":[{"text":"Hi"}]}]'
            value={socraticHistory}
            onChange={(e) => setSocraticHistory(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
          />
          <button type="submit" disabled={loading} style={{ padding: '10px 16px', cursor: 'pointer' }}>
            {loading ? '⏳ Sending…' : '🎙️ Send Socratic Turn'}
          </button>
        </form>
      </section>

      {/* Results */}
      {error && <div style={{ color: 'crimson', marginBottom: 12, padding: 12, backgroundColor: '#ffe6e6', borderRadius: 4 }}>❌ {error}</div>}

      {result && (
        <section style={{ marginBottom: 24, padding: 12, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#f9f9f9' }}>
          <h3>📊 Results {resultSource && `(${resultSource})`}</h3>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto', padding: 12, backgroundColor: '#fff', borderRadius: 4 }}>{result}</pre>
        </section>
      )}
    </div>
  );
}

export default App;
