import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Fira Code, monospace',
});

export default function VisualAid({ code }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (code && containerRef.current) {
      containerRef.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
    }
  }, [code]);

  if (!code) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid #334155',
        borderRadius: 12,
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          fontSize: 11,
          fontFamily: 'Fira Code, monospace',
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: '#94a3b8',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: '#38bdf8' }} />
        Verified Logic Diagram
      </div>
      <div className="mermaid" ref={containerRef}>
        {code}
      </div>
    </div>
  );
}
