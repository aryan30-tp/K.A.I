import React, { useEffect, useState, useRef } from 'react';
import StarsBackground from './StarsBackground';
import robotImg from '../assets/ChatGPT_Image_May_8__2026__11_54_05_PM.png';

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
      // Skip typing
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
        maxWidth: '1400px',
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
            left: '50px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            opacity: sequences[sequence].layout === 'side' ? 1 : 0,
            transition: 'opacity 0.5s ease',
            zIndex: 20
          }}>
            <RobotBox 
              name="KORTEX" 
              role="DATA HARVESTER" 
              active={sequences[sequence].activeRobot === 'KORTEX' || (sequence === 4 && sequences[sequence].activeRobot === 'IGNIS') || sequence === 5} 
              accent={neonGreen}
            />
            <RobotBox 
              name="AXIOM" 
              role="ROGUE INQUISITOR" 
              active={sequences[sequence].activeRobot === 'AXIOM' || (sequence === 4 && sequences[sequence].activeRobot === 'IGNIS') || sequence === 5} 
              accent={neonGreen}
              outOfSync={sequences[sequence].activeRobot === 'AXIOM'}
            />
          </div>

          <div style={{
            position: 'absolute',
            right: '50px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: sequences[sequence].layout === 'side' ? 1 : 0,
            transition: 'opacity 0.5s ease',
            zIndex: 20
          }}>
            <RobotBox 
              name="IGNIS" 
              role="TACTICAL COMMANDER" 
              active={sequences[sequence].activeRobot === 'IGNIS' || sequence === 5} 
              accent={sequence === 4 ? '#FF4D4D' : neonGreen} 
              isIgnis={sequence === 4}
            />
          </div>

          {/* THE MASK (K.A.I.) */}
          <div style={{
            position: 'relative',
            width: 'min(65vh, 70vw)',
            height: 'min(65vh, 70vw)',
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: sequences[sequence].layout === 'side' ? 'translateY(-30px) scale(0.85)' : 'translateY(0) scale(1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* SELECTIVE TINT: Head/Shoulders only */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              height: '55%', 
              background: `radial-gradient(circle at center top, ${neonGreen}33 0%, transparent 80%)`,
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
                filter: `drop-shadow(0 0 15px ${neonGreen}33)`,
                zIndex: 6
              }} 
            />
            
            {/* EYES */}
            <div style={{
              position: 'absolute',
              top: '32.5%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '30%',
              height: '6%',
              background: `radial-gradient(ellipse, ${neonGreen} 0%, transparent 80%)`,
              opacity: sequence === 5 ? 0.9 : 0.4,
              zIndex: 8,
              filter: 'blur(10px)',
              animation: sequence === 5 ? 'eye-flare 0.5s infinite alternate' : 'eye-flicker 4s infinite'
            }} />
          </div>
        </div>

        {/* BOTTOM PANEL: TEXT & CONTROLS */}
        <div style={{
          width: '100%',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(15px)',
          borderTop: `1px solid ${neonGreen}33`,
          padding: '40px 60px',
          boxSizing: 'border-box',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 30
        }}>
          <div style={{
            width: '100%',
            maxWidth: '900px',
            color: neonGreen,
            fontSize: '18px',
            lineHeight: 1.6,
            textAlign: 'left',
            letterSpacing: '1px',
            textShadow: `0 0 5px ${neonGreen}44`,
            whiteSpace: 'pre-wrap'
          }}>
            {displayText}<span className={isTyping ? 'cursor' : ''} style={{ opacity: isTyping ? 1 : 0 }}>_</span>
          </div>

          <div style={{ marginTop: '30px', width: '100%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '10px', opacity: 0.5, letterSpacing: '2px' }}>
              SEQUENCE {sequence}/5 // NEURAL_LINK_STABLE
            </div>
            <button 
              onClick={handleNext}
              style={{
                padding: '12px 30px',
                backgroundColor: sequence === 5 && !isTyping ? neonGreen : 'transparent',
                color: sequence === 5 && !isTyping ? '#000' : neonGreen,
                border: `1px solid ${neonGreen}`,
                fontWeight: 900,
                fontSize: '12px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: sequence === 5 && !isTyping ? `0 0 30px ${neonGreen}88` : 'none'
              }}
            >
              {isTyping ? '// SKIP' : (sequence === 5 ? 'INITIALIZE WAR ROOM' : 'NEXT PROTOCOL ➔')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); filter: brightness(0.9); }
          50% { transform: scale(1.005); filter: brightness(1.1); }
        }
        .breathing-kai {
          animation: breathing 6s ease-in-out infinite;
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
          to { opacity: 1; transform: translateX(-50%) scale(1.2); }
        }
        .cursor {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes pulse-box {
          0% { box-shadow: 0 0 10px rgba(179, 255, 0, 0.2); border-color: rgba(179, 255, 0, 0.3); }
          50% { box-shadow: 0 0 25px rgba(179, 255, 0, 0.5); border-color: rgba(179, 255, 0, 0.8); }
          100% { box-shadow: 0 0 10px rgba(179, 255, 0, 0.2); border-color: rgba(179, 255, 0, 0.3); }
        }
        @keyframes pulse-box-out-of-sync {
          0% { box-shadow: 0 0 5px rgba(179, 255, 0, 0.1); transform: scale(1) translateX(0); }
          33% { box-shadow: 0 0 30px rgba(179, 255, 0, 0.6); transform: scale(1.02) translateX(2px); }
          66% { box-shadow: 0 0 15px rgba(179, 255, 0, 0.3); transform: scale(0.98) translateX(-2px); }
          100% { box-shadow: 0 0 5px rgba(179, 255, 0, 0.1); transform: scale(1) translateX(0); }
        }
      `}</style>
    </div>
  );
};

const RobotBox = ({ name, role, active, accent, outOfSync, isIgnis }) => (
  <div style={{
    width: '240px',
    padding: '20px',
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    border: `1px solid ${active ? accent : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '8px',
    opacity: active ? 1 : 0.3,
    transition: 'all 0.5s ease',
    animation: active ? (outOfSync ? 'pulse-box-out-of-sync 0.8s infinite' : 'pulse-box 3s infinite') : 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  }}>
    <div style={{ fontSize: '10px', color: active ? accent : '#777', letterSpacing: '2px', fontWeight: 900 }}>
      // {role}
    </div>
    <div style={{ fontSize: '24px', color: '#fff', fontWeight: 900, letterSpacing: '4px' }}>
      {name}
    </div>
    {isIgnis && active && (
      <div style={{ marginTop: '10px', height: '2px', width: '100%', background: `linear-gradient(90deg, ${accent}, #B3FF00)` }} />
    )}
  </div>
);

export default OnboardingWelcome;
