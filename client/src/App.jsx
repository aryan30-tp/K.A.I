import React, { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const apiBase = import.meta.env.VITE_API_URL ?? '';

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

      // Read raw text first (avoids double-reading the body), then try to parse JSON.
      const raw = await res.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (parseErr) {
        // If server returned non-JSON (HTML/error page), include a snippet in the error.
        throw new Error(`Non-JSON response from server: ${raw.slice(0, 1000)}`);
      }

      if (!res.ok) throw new Error(data?.error || 'Request failed');
      // Prefer returned JSON `text`, otherwise show full raw body.
      setResult(data?.text || raw || JSON.stringify(data));
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
