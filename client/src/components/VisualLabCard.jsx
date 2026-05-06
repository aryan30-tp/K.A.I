import React, { useState, useEffect } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with a dark theme to match your Coal Grey UI
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

const VisualLabCard = ({ topic = "Concept", mermaidCode }) => {
  // States: 'parsing' | 'mermaid-ready' | 'fetching-fallback' | 'fallback-ready' | 'failed'
  const [status, setStatus] = useState('parsing');
  const [svgContent, setSvgContent] = useState('');
  const [fallbackImageUrl, setFallbackImageUrl] = useState('');

  // A unique ID for the mermaid render instance
  const renderId = `mermaid-${topic.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(Math.random() * 1000000)}`;

  useEffect(() => {
    const generateVisual = async () => {
      if (!mermaidCode) {
        setStatus('fetching-fallback');
        await tryWikipediaFallback();
        return;
      }

      try {
        setStatus('parsing');
        
        // 1. Attempt to parse and render the Mermaid code
        await mermaid.parse(mermaidCode);
        const { svg } = await mermaid.render(renderId, mermaidCode);
        
        setSvgContent(svg);
        setStatus('mermaid-ready');

      } catch (mermaidError) {
        console.warn(`Mermaid failed for ${topic}. Triggering Wikipedia fallback...`);
        setStatus('fetching-fallback');
        await tryWikipediaFallback();
      }
    };

    const tryWikipediaFallback = async () => {
      try {
        const wikiQuery = encodeURIComponent(topic);
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiQuery}`);
        const data = await response.json();

        if (data.thumbnail && data.thumbnail.source) {
          setFallbackImageUrl(data.thumbnail.source);
          setStatus('fallback-ready');
        } else {
          setStatus('failed');
        }
      } catch (wikiError) {
        console.error("Wikipedia fetch failed:", wikiError);
        setStatus('failed');
      }
    };

    generateVisual();
  }, [mermaidCode, topic]);

  return (
    <div className="visual-card-container" style={styles.card}>
      {/* State 1: Trying to render Mermaid */}
      {status === 'parsing' && (
        <p style={styles.loadingText}>Analyzing Logic Diagram...</p>
      )}

      {/* State 2: Mermaid Success! */}
      {status === 'mermaid-ready' && (
        <div 
          dangerouslySetInnerHTML={{ __html: svgContent }} 
          style={styles.diagramContainer}
        />
      )}

      {/* State 3: Mermaid Failed, searching Wikipedia */}
      {status === 'fetching-fallback' && (
        <p style={styles.warningText}>
          ⚠️ Logic Diagram Unavailable. Fetching Visual Database...
        </p>
      )}

      {/* State 4: Wikipedia Image Found */}
      {status === 'fallback-ready' && (
        <img 
          src={fallbackImageUrl} 
          alt={`Visual representation of ${topic}`} 
          style={styles.fallbackImage} 
        />
      )}

      {/* State 5: Complete Failure (No Mermaid, No Wiki Image) */}
      {status === 'failed' && (
        <p style={styles.errorText}>No visual data found for this concept.</p>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'rgba(34, 34, 34, 0.6)',
    border: '1px solid rgba(179, 255, 0, 0.3)',
    borderRadius: '20px',
    padding: '16px',
    marginTop: '12px',
    width: '100%',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    overflow: 'hidden'
  },
  loadingText: {
    color: '#B3FF00',
    fontSize: '13px'
  },
  warningText: {
    color: '#FFB800',
    textAlign: 'center',
    fontSize: '0.85rem'
  },
  errorText: {
    color: '#777777',
    fontStyle: 'italic',
    fontSize: '0.85rem'
  },
  fallbackImage: {
    maxWidth: '100%',
    maxHeight: '180px',
    borderRadius: '12px',
    border: '1px solid #B3FF00',
    objectFit: 'contain'
  },
  diagramContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    overflowX: 'auto'
  }
};

export default VisualLabCard;
