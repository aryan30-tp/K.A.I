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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const toggleExpand = (e) => {
    e.stopPropagation(); // Prevent flashcard flip
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* State 2: Mermaid Success! */}
      {status === 'mermaid-ready' && (
        <div 
          className="visual-card-container" 
          style={styles.card} 
          onClick={toggleExpand}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: svgContent }} 
            style={styles.diagramContainer}
          />
        </div>
      )}

      {/* State 4: Wikipedia Image Found */}
      {status === 'fallback-ready' && (
        <div 
          className="visual-card-container" 
          style={styles.card} 
          onClick={toggleExpand}
        >
          <img 
            src={fallbackImageUrl} 
            alt={`Visual representation of ${topic}`} 
            style={styles.fallbackImage} 
          />
        </div>
      )}

      {/* Expanded Modal */}
      {isExpanded && (
        <div 
          style={styles.modalOverlay}
          onClick={toggleExpand}
        >
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={toggleExpand}>✕</button>
            <h3 style={{ color: '#B3FF00', marginBottom: 20 }}>{topic}</h3>
            {status === 'mermaid-ready' ? (
              <div 
                dangerouslySetInnerHTML={{ __html: svgContent }} 
                style={styles.expandedDiagram}
              />
            ) : (
              <img 
                src={fallbackImageUrl} 
                alt={topic} 
                style={styles.expandedImage} 
              />
            )}
          </div>
        </div>
      )}
    </>
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
    overflow: 'hidden',
    cursor: 'zoom-in',
    transition: 'transform 0.2s',
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
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    cursor: 'zoom-out'
  },
  modalContent: {
    position: 'relative',
    backgroundColor: '#1a1a1a',
    padding: '40px',
    borderRadius: '30px',
    border: '1px solid #B3FF00',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: '#B3FF00',
    fontSize: '24px',
    cursor: 'pointer'
  },
  expandedImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '15px',
    boxShadow: '0 0 40px rgba(179, 255, 0, 0.2)'
  },
  expandedDiagram: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  }
};

export default VisualLabCard;
