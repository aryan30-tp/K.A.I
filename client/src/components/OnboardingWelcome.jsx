import React, { useEffect, useState, useRef } from 'react';
import StarsBackground from './StarsBackground';
import robotImg from '../assets/ChatGPT_Image_May_8__2026__11_54_05_PM.png';
import kortexVideo from '../assets/Live chatbot.webm';
import axiomVideo from '../assets/Robot Ai chatbot.webm';
import ignisVideo from '../assets/Technology isometric ai robot brain.webm';

const OnboardingWelcome = ({ user, onComplete }) => {
  const neonGreen = '#B3FF00';
  const [sequence, setSequence] = useState(1);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const sequences = {
    1: {
      text: `"Neural link established. I am Knowledge AI, or K.A.I. I am not a standard web application. I am a central intelligence—a literal digital brain designed to optimize your survival in the critical time you have remaining.\n\nYou are currently bleeding points. You are staring at fifty pages of scattered text, blindly guessing what will be on your exam. That is an operational failure. I am here to stop the panic and execute a definitive triage."`,
      layout: 'center'
    },
    2: {
      text: `"To reverse-engineer your exam, I command a specialized team of robotic sub-routines.\n\nFirst is Kortex. He is the harvester. Feed Kortex your messy PDFs, your syllabus, and every Past Year Paper you can find. He parses the raw data, strips the garbage, and extracts the core intel. He is the mandatory foundation. Without Kortex, the rest of my network is blind."`,
      layout: 'side',
      activeRobot: 'KORTEX'
    },
    3: {
      text: `"Second is Axiom. Axiom operates as an independent rogue in the trenches. He is your Socratic interrogator.\n\nWhile Kortex processes documents, Axiom engages you directly. He will question you, expose your false confidence, and ruthlessly identify exactly where your logic breaks down. He will force you to actually understand the concepts before you step into the exam hall."`,
      layout: 'side',
      activeRobot: 'AXIOM'
    },
    4: {
      text: `"Finally, there is Ignis. Ignis is the tactician. He requires the raw, harvested data directly from Kortex to scan your entire syllabus and map out the statistical probabilities of your paper.\n\nBut Ignis is highly adaptive. If Axiom has interrogated you, Ignis will fetch that combat data to further expose your personal weak spots. Kortex provides the past. Axiom tests the present. Ignis predicts the future. Together, they generate your definitive survival heatmap—highlighting the exact glowing red zones where the points are hidden, and the cold grey zones you must completely ignore."`,
      layout: 'side',
      activeRobot: 'IGNIS'
    },
    5: {
      text: `"Kortex. Axiom. Ignis. Together, they form my neural network. They form K.A.I.\n\nThe clock is ticking down to zero hour. Provide the intel. Let my team take over the processing, so you can execute the mission."`,
      layout: 'center'
    }
  };

  useEffect(() => {
    startTyping(sequences[sequence].text);
  }, [sequence]);

  const startTyping = (fullText) => {
    setIsTyping(true);
    setDisplayText('');
    let index = 0;
    if (typingTimeoutRef.current) clearInterval(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setInterval(() => {
      setDisplayText(fullText.slice(0, index));
      index++;
      if (index > fullText.length) {
        clearInterval(typingTimeoutRef.current);
        setIsTyping(false);
      }
    }, 25);
  };

  const handleNext = () => {
    if (isTyping) {
      clearInterval(typingTimeoutRef.current);
      setDisplayText(sequences[sequence].text);
      setIsTyping(false);
    } else {
      if (sequence < 5) {
        setSequence(sequence + 1);
      } else {
        onComplete();
      }
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: '"Share Tech Mono", monospace'
    }}>
      <StarsBackground />

      {/* SCANLINE OVERLAY */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%',
        zIndex: 50,
        pointerEvents: 'none',
        opacity: 0.1
      }} />

      {/* MAIN CONTAINER */}
      <div style={{
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
        transition: 'all 1s ease'
      }}>
        
        {/* UPPER VISUAL AREA */}
        <div style={{
          display: 'flex',
          width: '100%',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          
          {/* ROBOT SUB-ROUTINES (LEFT/RIGHT) */}
          <div style={{
            position: 'absolute',
            left: '80px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            opacity: sequences[sequence].layout === 'side' ? 1 : 0,
            transition: 'all 0.8s ease',
            zIndex: 20
          }}>
            <RobotBox 
              name="KORTEX" 
              role="DATA HARVESTER" 
              active={sequences[sequence].activeRobot === 'KORTEX' || (sequence === 4 && sequences[sequence].activeRobot === 'IGNIS') || sequence === 5} 
              accent={neonGreen}
              videoSrc={kortexVideo}
            />
            <RobotBox 
              name="AXIOM" 
              role="ROGUE INQUISITOR" 
              active={sequences[sequence].activeRobot === 'AXIOM' || (sequence === 4 && sequences[sequence].activeRobot === 'IGNIS') || sequence === 5} 
              accent={neonGreen}
              outOfSync={sequences[sequence].activeRobot === 'AXIOM'}
              videoSrc={axiomVideo}
            />
          </div>

          <div style={{
            position: 'absolute',
            right: '80px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: sequences[sequence].layout === 'side' ? 1 : 0,
            transition: 'all 0.8s ease',
            zIndex: 20
          }}>
            <RobotBox 
              name="IGNIS" 
              role="TACTICAL COMMANDER" 
              active={sequences[sequence].activeRobot === 'IGNIS' || sequence === 5} 
              accent={sequence === 4 ? '#FF4D4D' : neonGreen} 
              isIgnis={sequence === 4}
              videoSrc={ignisVideo}
            />
          </div>

          {/* THE MASK (K.A.I.) */}
          <div style={{
            position: 'relative',
            width: 'min(65vh, 70vw)',
            height: 'min(65vh, 70vw)',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: sequences[sequence].layout === 'side' ? 'translateY(-30px) scale(0.8)' : 'translateY(0) scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            
            {/* BASE LAYER (Original Robot) */}
            <img 
              src={robotImg} 
              alt="K.A.I." 
              className="breathing-kai"
              style={{
                width: '100%',
                height: 'auto',
                zIndex: 6,
                opacity: 0.8
              }} 
            />

            {/* TINTED LAYER (Head/Shoulders only via mask) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 7,
              pointerEvents: 'none',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 60%)',
              maskImage: 'linear-gradient(to bottom, black 0%, black 45%, transparent 60%)'
            }}>
              <img 
                src={robotImg} 
                alt="K.A.I. Tint" 
                className="breathing-kai"
                style={{
                  width: '100%',
                  height: 'auto',
                  filter: `sepia(100%) hue-rotate(50deg) saturate(10) brightness(1.2) drop-shadow(0 0 20px ${neonGreen})`,
                }} 
              />
            </div>
            
            {/* EYES */}
            <div style={{
              position: 'absolute',
              top: '32.5%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '30%',
              height: '6%',
              background: `radial-gradient(ellipse, ${neonGreen} 0%, transparent 80%)`,
              opacity: (sequence === 1 || sequence === 5) ? 0.9 : 0.4,
              zIndex: 8,
              filter: 'blur(10px)',
              animation: (sequence === 1 || sequence === 5) ? 'eye-flare 0.5s infinite alternate' : 'eye-flicker 4s infinite'
            }} />
          </div>
        </div>

        {/* BOTTOM PANEL: FULL WIDTH DIALOGUE */}
        <div style={{
          width: '100%',
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: `2px solid ${neonGreen}44`,
          padding: '40px 80px',
          boxSizing: 'border-box',
          minHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          boxShadow: `0 -20px 50px rgba(0,0,0,0.8)`
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1100px',
            color: neonGreen,
            fontSize: '20px',
            lineHeight: 1.7,
            textAlign: 'left',
            letterSpacing: '1.5px',
            textShadow: `0 0 8px ${neonGreen}66`,
            whiteSpace: 'pre-wrap',
            flex: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            {displayText}<span className={isTyping ? 'cursor' : ''} style={{ opacity: isTyping ? 1 : 0 }}>_</span>
          </div>

          <div style={{ marginTop: '30px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', opacity: 0.4, letterSpacing: '3px', fontWeight: 900 }}>
              K.A.I. PROLOGUE // SECURE_LINE_0{sequence}
            </div>
            <button 
              onClick={handleNext}
              style={{
                padding: '16px 45px',
                backgroundColor: sequence === 5 && !isTyping ? neonGreen : 'transparent',
                color: sequence === 5 && !isTyping ? '#000' : neonGreen,
                border: `2px solid ${neonGreen}`,
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: (sequence === 5 && !isTyping) ? `0 0 40px ${neonGreen}` : 'none',
                borderRadius: '4px'
              }}
              className="pulse-glow"
            >
              {isTyping ? '// SKIP_INTEL' : (sequence === 5 ? 'INITIALIZE WAR ROOM' : 'NEXT PROTOCOL ➔')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); filter: brightness(0.95); }
          50% { transform: scale(1.01); filter: brightness(1.15); }
        }
        .breathing-kai {
          animation: breathing 4s ease-in-out infinite;
        }
        @keyframes eye-flicker {
          0%, 100% { opacity: 0.3; }
          45% { opacity: 0.4; }
          50% { opacity: 0.7; }
          52% { opacity: 0.2; }
          55% { opacity: 0.8; }
          60% { opacity: 0.4; }
        }
        @keyframes eye-flare {
          from { opacity: 0.6; transform: translateX(-50%) scale(1); }
          to { opacity: 1; transform: translateX(-50%) scale(1.3); }
        }
        .cursor {
          animation: blink 0.8s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes pulse-box {
          0% { box-shadow: 0 0 15px rgba(179, 255, 0, 0.2); border-color: rgba(179, 255, 0, 0.3); }
          50% { box-shadow: 0 0 35px rgba(179, 255, 0, 0.6); border-color: rgba(179, 255, 0, 1); }
          100% { box-shadow: 0 0 15px rgba(179, 255, 0, 0.2); border-color: rgba(179, 255, 0, 0.3); }
        }
        @keyframes pulse-box-out-of-sync {
          0% { box-shadow: 0 0 5px rgba(179, 255, 0, 0.1); transform: scale(1); }
          33% { box-shadow: 0 0 40px rgba(179, 255, 0, 0.8); transform: scale(1.05) rotate(1deg); }
          66% { box-shadow: 0 0 20px rgba(179, 255, 0, 0.4); transform: scale(0.95) rotate(-1deg); }
          100% { box-shadow: 0 0 5px rgba(179, 255, 0, 0.1); transform: scale(1); }
        }
        .pulse-glow:hover {
          background-color: ${neonGreen} !important;
          color: #000 !important;
          box-shadow: 0 0 50px ${neonGreen} !important;
        }
      `}</style>
    </div>
  );
};

const RobotBox = ({ name, role, active, accent, outOfSync, isIgnis, videoSrc }) => (
  <div style={{
    width: '280px',
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    border: `2px solid ${active ? accent : 'rgba(255,255,255,0.05)'}`,
    borderRadius: '16px',
    opacity: active ? 1 : 0,
    transform: active ? 'scale(1)' : 'scale(0.8) translateY(20px)',
    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
    animation: active ? (outOfSync ? 'pulse-box-out-of-sync 0.6s infinite' : 'pulse-box 2.5s infinite') : 'none',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: active ? `0 20px 40px rgba(0,0,0,0.6)` : 'none'
  }}>
    <div style={{ 
      width: '100%', 
      height: '180px', 
      backgroundColor: '#000', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <video 
        src={videoSrc} 
        autoPlay 
        loop 
        muted 
        playsInline 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          filter: active ? `brightness(1.2) drop-shadow(0 0 10px ${accent}44)` : 'grayscale(100%)',
          opacity: active ? 1 : 0.5
        }} 
      />
      {isIgnis && active && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, rgba(255, 77, 77, 0.3), transparent)', 
          zIndex: 1 
        }} />
      )}
    </div>
    <div style={{ padding: '20px', borderTop: `1px solid ${accent}33` }}>
      <div style={{ fontSize: '10px', color: active ? accent : '#777', letterSpacing: '2px', fontWeight: 900, marginBottom: '4px' }}>
        // {role}
      </div>
      <div style={{ fontSize: '26px', color: '#fff', fontWeight: 900, letterSpacing: '4px' }}>
        {name}
      </div>
    </div>
  </div>
);

export default OnboardingWelcome;
