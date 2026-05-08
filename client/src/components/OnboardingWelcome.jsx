import React, { useEffect, useState } from 'react';
import robotImg from '../assets/ChatGPT Image May 8, 2026, 11_54_05 PM.png';

const OnboardingWelcome = ({ user, onComplete }) => {
  const neonGreen = '#B3FF00';
  const [text, setText] = useState('');
  const fullText = `WELCOME, OPERATIVE ${user?.displayName?.toUpperCase() || 'UNKNOWN'}. NEURAL LINK ESTABLISHED. INITIALIZING SURVIVAL PROTOCOLS...`;

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(timer);
        // Wait a bit after typing is done before transitioning
        setTimeout(onComplete, 2000);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [user, onComplete]);

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
      {/* SCANLINE / CRT OVERLAY */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%',
        zIndex: 10,
        pointerEvents: 'none',
        opacity: 0.2
      }} />

      {/* K.A.I. VISUAL */}
      <div style={{
        position: 'relative',
        width: 'min(80vh, 80vw)',
        height: 'min(80vh, 80vw)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img 
          src={robotImg} 
          alt="K.A.I." 
          className="breathing-kai"
          style={{
            width: '100%',
            height: 'auto',
            filter: `drop-shadow(0 0 30px ${neonGreen}aa) sepia(100%) hue-rotate(45deg) saturate(3) brightness(0.8)`,
            zIndex: 5
          }} 
        />
        
        {/* EYE GLOW OVERLAY */}
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40%',
          height: '10%',
          background: `radial-gradient(ellipse, ${neonGreen} 0%, transparent 70%)`,
          opacity: 0.6,
          zIndex: 6,
          filter: 'blur(20px)',
          animation: 'eye-flicker 2s infinite'
        }} />
      </div>

      {/* WELCOME TEXT */}
      <div style={{
        marginTop: '40px',
        color: neonGreen,
        fontFamily: '"Share Tech Mono", monospace',
        fontSize: '20px',
        letterSpacing: '3px',
        textAlign: 'center',
        maxWidth: '800px',
        padding: '0 20px',
        textShadow: `0 0 10px ${neonGreen}88`,
        zIndex: 11
      }}>
        {text}<span className="cursor">_</span>
      </div>

      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); filter: brightness(0.8) drop-shadow(0 0 30px ${neonGreen}aa) sepia(100%) hue-rotate(45deg) saturate(3); }
          50% { transform: scale(1.02); filter: brightness(1.1) drop-shadow(0 0 50px ${neonGreen}) sepia(100%) hue-rotate(45deg) saturate(4); }
        }
        .breathing-kai {
          animation: breathing 4s ease-in-out infinite;
        }
        @keyframes eye-flicker {
          0%, 100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.8; transform: translateX(-50%) scale(1.1); }
          90% { opacity: 0.4; }
          95% { opacity: 1; }
        }
        .cursor {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default OnboardingWelcome;
