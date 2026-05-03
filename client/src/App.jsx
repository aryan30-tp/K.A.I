import React, { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [pastPapersText, setPastPapersText] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [syllabusAnalysisText, setSyllabusAnalysisText] = useState('');
  const [examAnalysisText, setExamAnalysisText] = useState('');
  const [requestType, setRequestType] = useState('flashcards');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
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
    return data?.text || raw || JSON.stringify(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: url }),
      });
      const text = await parseResponse(res);
      setResult(text);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${apiBase}/api/extract-file`, {
        method: 'POST',
        body: formData,
      });

      const text = await parseResponse(res);
      setResult(text);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleMapSyllabus(e) {
    e.preventDefault();
    if (!syllabusText.trim() || !notesText.trim()) {
      setError('Please provide both syllabus and notes text.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/map-syllabus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusText, notesText }),
      });

      const text = await parseResponse(res);
      setResult(text);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyzePapers(e) {
    e.preventDefault();
    if (!syllabusText.trim() || !pastPapersText.trim()) {
      setError('Please provide both syllabus and past papers text.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/analyze-papers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusText, pastPapersText }),
      });

      const text = await parseResponse(res);
      setResult(text);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateOutput(e) {
    e.preventDefault();
    if (!rawNotes.trim()) {
      setError('Please provide raw notes for generation.');
      return;
    }

    let parsedSyllabus = null;
    let parsedExam = null;
    if (syllabusAnalysisText.trim()) {
      try {
        parsedSyllabus = JSON.parse(syllabusAnalysisText);
      } catch (err) {
        setError('Syllabus analysis must be valid JSON if provided.');
        return;
      }
    }

    if (examAnalysisText.trim()) {
      try {
        parsedExam = JSON.parse(examAnalysisText);
      } catch (err) {
        setError('Exam analysis must be valid JSON if provided.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          rawNotes,
          syllabusAnalysis: parsedSyllabus,
          examAnalysis: parsedExam,
        }),
      });

      const text = await parseResponse(res);
      setResult(text);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>K.A.I. — Extractor Test</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
        <input
          placeholder="YouTube URL or local file path"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: '60%', padding: 8, marginRight: 8 }}
        />
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Extracting…' : 'Extract'}
        </button>
      </form>

      <form onSubmit={handleFileUpload} style={{ marginBottom: 12 }}>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ marginRight: 8 }}
        />
        <button type="submit" disabled={loading || !file} style={{ padding: '8px 12px' }}>
          {loading ? 'Uploading…' : 'Upload & Extract'}
        </button>
      </form>

      <form onSubmit={handleMapSyllabus} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <textarea
            placeholder="Paste syllabus text here"
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            rows={6}
            style={{ flex: 1, padding: 8 }}
          />
          <textarea
            placeholder="Paste extracted notes text here"
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            rows={6}
            style={{ flex: 1, padding: 8 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Mapping…' : 'Map Syllabus'}
        </button>
      </form>

      <form onSubmit={handleAnalyzePapers} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <textarea
            placeholder="Paste syllabus text here"
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            rows={6}
            style={{ flex: 1, padding: 8 }}
          />
          <textarea
            placeholder="Paste past exam papers text here"
            value={pastPapersText}
            onChange={(e) => setPastPapersText(e.target.value)}
            rows={6}
            style={{ flex: 1, padding: 8 }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Analyzing…' : 'Analyze Past Papers'}
        </button>
      </form>

      <form onSubmit={handleGenerateOutput} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <textarea
            placeholder="Paste raw notes text here"
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            rows={6}
            style={{ flex: 1, padding: 8 }}
          />
          <textarea
            placeholder="Paste syllabus analysis JSON (optional)"
            value={syllabusAnalysisText}
            onChange={(e) => setSyllabusAnalysisText(e.target.value)}
            rows={6}
            style={{ flex: 1, padding: 8 }}
          />
          <textarea
            placeholder="Paste exam analysis JSON (optional)"
            value={examAnalysisText}
            onChange={(e) => setExamAnalysisText(e.target.value)}
            rows={6}
            style={{ flex: 1, padding: 8 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <label>
            Request Type:{' '}
            <select value={requestType} onChange={(e) => setRequestType(e.target.value)}>
              <option value="flashcards">Flashcards</option>
              <option value="study_plan">Study Plan</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Generating…' : 'Generate Output'}
        </button>
      </form>

      {error && <div style={{ color: 'crimson' }}>{error}</div>}

      {result && (
        <div>
          <h3>Transcript / Extracted Text</h3>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflow: 'auto' }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
