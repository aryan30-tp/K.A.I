import React, { useState, useEffect } from 'react';
import StarsBackground from './StarsBackground';
import kaiLogo from '../assets/Screenshot 2026-05-08 175656.png';
import robotBg from '../assets/ChatGPT Image May 8, 2026, 11_54_05 PM.png';

const LandingPage = ({ signInWithGoogle }) => {
  const neonGreen = '#B3FF00';
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: '"Share Tech Mono", monospace, "Courier New", Courier, monospace',
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* GLOBAL SCANLINE EFFECT */}
      <div className="scanline" style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%',
        zIndex: 100,
        pointerEvents: 'none',
        opacity: 0.3
      }} />

      {/* BACKGROUND LAYER */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <StarsBackground />
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${robotBg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          opacity: 0.25, // Increased visibility
          filter: `blur(15px) grayscale(100%) brightness(0.4) sepia(100%) hue-rotate(45deg) saturate(3)`,
          pointerEvents: 'none',
          transition: 'all 0.5s ease'
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 30%, transparent 20%, #000 80%)`,
          pointerEvents: 'none'
        }} />
      </div>

      {/* HEADER / NAV */}
      <nav style={{
        width: '100%',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${neonGreen}33`,
        boxSizing: 'border-box',
        zIndex: 10,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={kaiLogo} alt="K.A.I." style={{ height: '35px', filter: `drop-shadow(0 0 5px ${neonGreen})` }} />
          <div style={{ 
            color: neonGreen, 
            fontWeight: 900, 
            fontSize: '20px', 
            letterSpacing: '5px',
            textShadow: `0 0 10px ${neonGreen}aa`
          }}>
            K.A.I. SYSTEM <span style={{ fontSize: '12px', opacity: 0.5 }}>[DEPLOYMENT_READY]</span>
          </div>
        </div>
        <button 
          onClick={signInWithGoogle}
          style={{
            background: 'none',
            border: `1px solid ${neonGreen}66`,
            color: neonGreen,
            padding: '8px 16px',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.3s'
          }}
          className="interactive-card"
        >
          // ACCESS_PORTAL
        </button>
      </nav>

      {/* HERO SECTION - RADAR / COMMAND CONSOLE */}
      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 20px',
        zIndex: 5,
        position: 'relative'
      }}>
        {/* RADAR DECORATION */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          border: `1px solid ${neonGreen}11`,
          borderRadius: '50%',
          pointerEvents: 'none'
        }}>
          <div className="radar-sweep" style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(from 0deg, ${neonGreen}44 0deg, transparent 90deg)`,
            borderRadius: '50%',
            animation: 'radar-spin 4s linear infinite'
          }} />
        </div>

        <div className={glitch ? 'glitch' : ''} style={{ maxWidth: '900px', position: 'relative' }}>
          <div style={{ 
            color: neonGreen, 
            fontSize: '12px', 
            fontWeight: 900, 
            letterSpacing: '8px', 
            marginBottom: '20px',
            textTransform: 'uppercase',
            opacity: 0.8
          }}>
            [ WARROOM_INITIALIZED // TARGET_LOCK_ON_EXAM ]
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight: 900,
            margin: '0 0 30px 0',
            lineHeight: 1,
            color: '#fff',
            textShadow: `0 0 20px ${neonGreen}44`,
            textTransform: 'uppercase'
          }}>
            Stop studying the noise and let historical data <span style={{ color: neonGreen }}>dictate your exact survival path.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 3.5vw, 1.4rem)',
            color: '#aaa',
            maxWidth: '750px',
            margin: '0 auto 50px auto',
            lineHeight: 1.5,
            borderLeft: `2px solid ${neonGreen}`,
            paddingLeft: '25px',
            textAlign: 'left'
          }}>
            You are bleeding points on irrelevant topics. Feed K.A.I. your messy notes and past exams. We will give you the <span style={{ color: '#fff', fontWeight: 800 }}>precise heatmap</span> of where the points are actually hidden.
          </p>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button 
              onClick={signInWithGoogle}
              style={{
                padding: '25px 60px',
                backgroundColor: neonGreen,
                color: '#000',
                border: 'none',
                fontWeight: 900,
                fontSize: '20px',
                textTransform: 'uppercase',
                letterSpacing: '4px',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: `0 0 50px ${neonGreen}aa`,
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="pulse-glow"
            >
              DEPLOY NEURAL STRIKE ➔
            </button>
          </div>
        </div>
      </main>

      {/* OPERATIVES / FEATURES GRID */}
      <section style={{
        padding: '100px 40px',
        zIndex: 5,
        background: 'linear-gradient(to bottom, transparent, rgba(179, 255, 0, 0.05))',
        borderTop: `1px solid ${neonGreen}22`
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '40px' 
        }}>
          <OperativeCard 
            id="01"
            title="KORTEX"
            sub="THE ARCHITECT"
            desc="Surgical extraction of core concepts from chaos. Feed him 200MB PDFs or 3-hour YouTube lectures—he strips away the fluff and delivers high-fidelity intelligence in seconds."
            neon={neonGreen}
          />
          <OperativeCard 
            id="02"
            title="IGNIS"
            sub="TRIAGE COMMANDER"
            desc="The heat-seeker. He cross-references your syllabus against a decade of historical exam data to highlight 'Kill Zones'. Don't study everything—study what wins."
            neon={neonGreen}
          />
          <OperativeCard 
            id="03"
            title="AXIOM"
            sub="THE INQUISITOR"
            desc="The final simulation. Axiom deploys Socratic pressure to expose your neural gaps. If you can't survive his interrogation, you won't survive the exam hall."
            neon={neonGreen}
          />
        </div>
      </section>

      {/* SYSTEM FOOTER */}
      <footer style={{
        padding: '30px 40px',
        borderTop: `1px solid ${neonGreen}22`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
        color: neonGreen,
        opacity: 0.6,
        letterSpacing: '2px',
        zIndex: 10
      }}>
        <div>KNOWLEDGE_AI_NETWORK // VER: 4.8.0</div>
        <div style={{ textAlign: 'right' }}>[ SYSTEM_STATUS: ALL_SYSTEMS_GO ] <br/> © 2026 NEURAL_CORE_DEFENSE</div>
      </footer>

      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-sweep {
          transform-origin: center;
        }
        .pulse-glow:hover {
          transform: scale(1.05);
          filter: brightness(1.2);
        }
        .glitch {
          animation: glitch-anim 0.2s infinite;
        }
        @keyframes glitch-anim {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .scanline {
          animation: scanline-anim 8s linear infinite;
        }
        @keyframes scanline-anim {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

const OperativeCard = ({ id, title, sub, desc, neon }) => (
  <div style={{
    backgroundColor: 'rgba(20, 20, 20, 0.8)',
    border: `1px solid ${neon}33`,
    padding: '40px',
    borderRadius: '4px',
    position: 'relative',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    backdropFilter: 'blur(5px)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = neon;
    e.currentTarget.style.boxShadow = `0 0 20px ${neon}22`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = `${neon}33`;
    e.currentTarget.style.boxShadow = 'none';
  }}
  >
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '20px',
      fontSize: '60px',
      fontWeight: 900,
      color: neon,
      opacity: 0.05,
      fontFamily: 'Impact, sans-serif'
    }}>{id}</div>
    
    <div style={{ color: neon, fontSize: '12px', fontWeight: 900, letterSpacing: '3px', marginBottom: '10px' }}>
      // {sub}
    </div>
    <h3 style={{ 
      fontSize: '32px', 
      fontWeight: 900, 
      color: '#fff', 
      margin: '0 0 20px 0', 
      letterSpacing: '2px'
    }}>{title}</h3>
    <p style={{ 
      color: '#ccc', 
      lineHeight: 1.7, 
      margin: 0, 
      fontSize: '14px',
      borderTop: `1px solid ${neon}22`,
      paddingTop: '20px'
    }}>{desc}</p>
    
    <div style={{
      marginTop: '25px',
      height: '2px',
      width: '40px',
      backgroundColor: neon,
      boxShadow: `0 0 10px ${neon}`
    }} />
  </div>
);

export default LandingPage;
