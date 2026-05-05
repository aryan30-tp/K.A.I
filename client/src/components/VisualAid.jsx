import React from 'react';

export default function VisualAid({ prompt }) {
  if (!prompt) return null;

  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `${prompt} academic diagram schematic educational style`
  )}?width=800&height=500&nologo=true`;

  return (
    <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5f5' }}>
      <div
        style={{
          background: '#eef2ff',
          color: '#312e81',
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.4,
        }}
      >
        AI-Generated Visual Aid
      </div>
      <div style={{ background: '#fafafa', padding: 8 }}>
        <img
          src={imageUrl}
          alt="Educational diagram"
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }}
          loading="lazy"
        />
      </div>
    </div>
  );
}
