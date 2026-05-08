import React, { useEffect, useState } from 'react';
import StarsBackground from './StarsBackground';
import robotImg from '../assets/ChatGPT_Image_May_8__2026__11_54_05_PM.png';

const OnboardingWelcome = ({ user, onComplete }) => {
  const neonGreen = '#B3FF00';
  const [text, setText] = useState('');
  const [showButton, setShowButton] = useState(false);
  const fullText = `WELCOME, OPERATIVE ${user?.displayName?.toUpperCase() || 'UNKNOWN'}. NEURAL LINK ESTABLISHED. INITIALIZING SURVIVAL PROTOCOLS...`;

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer);
        setShowButton(true);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [user]);

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <StarsBackground />

      {/* SCANLINE / CRT OVERLAY */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%',
        zIndex: 10,
        pointerEvents: 'none',
        opacity: 0.1
      }} />

      {/* K.A.I. VISUAL */}
      <div style={{
        position: 'relative',
        width: 'min(75vh, 85vw)',
        height: 'min(75vh, 85vw)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5
      }}>
        {/* TINT OVERLAY (Only top part) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60%', // Focus on head/shoulders
          background: `linear-gradient(to bottom, ${neonGreen}44 0%, transparent 100%)`,
          zIndex: 7,
          pointerEvents: 'none',
          mixBlendMode: 'color-dodge',
          borderRadius: '50% 50% 0 0'
        }} />

        <img 
          src={robotImg} 
          alt="K.A.I." 
          className="breathing-kai"
          style={{
            width: '100%',
            height: 'auto',
            filter: `drop-shadow(0 0 20px ${neonGreen}44)`,
            zIndex: 6
          }} 
        />
        
        {/* EYE GLOW */}
        <div style={{
          position: 'absolute',
          top: '32%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '35%',
          height: '8%',
          background: `radial-gradient(ellipse, ${neonGreen} 0%, transparent 80%)`,
          opacity: 0.4,
          zIndex: 8,
          filter: 'blur(15px)',
          animation: 'eye-flicker 3s infinite'
        }} />
      </div>

      {/* WELCOME TEXT PANEL */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
        zIndex: 15
      }}>
        <div style={{
          color: neonGreen,
          fontFamily: '"Share Tech Mono", monospace',
          fontSize: '18px',
          letterSpacing: '2px',
          textAlign: 'center',
          maxWidth: '700px',
          padding: '0 20px',
          textShadow: `0 0 10px ${neonGreen}88`,
          minHeight: '60px'
        }}>
          {text}<span className="cursor">_</span>
        </div>

        {showButton && (
          <button 
            onClick={onComplete}
            style={{
              padding: '15px 40px',
              backgroundColor: neonGreen,
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 900,
              fontSize: '14px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: `0 0 30px ${neonGreen}66`,
              animation: 'fade-in 1s forwards'
            }}
            className="pulse-glow"
          >
            // INITIALIZE_CORE
          </button>
        )}
      </div>

      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); filter: brightness(0.9) drop-shadow(0 0 20px ${neonGreen}44); }
          50% { transform: scale(1.01); filter: brightness(1.1) drop-shadow(0 0 40px ${neonGreen}88); }
        }
        .breathing-kai {
          animation: breathing 5s ease-in-out infinite;
        }
        @keyframes eye-flicker {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
          55% { opacity: 0.2; }
          60% { opacity: 0.8; }
        }
        .cursor {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pulse-glow:hover {
          filter: brightness(1.2);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default OnboardingWelcome;
