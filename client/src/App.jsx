import React, { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
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
