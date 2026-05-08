import React from 'react';
import StarsBackground from './StarsBackground';
import kaiLogo from '../assets/Screenshot 2026-05-08 175656.png';
import chatbotVideo from '../assets/Live chatbot.webm';

export default function LandingPage({ signInWithGoogle }) {
  const accentColor = '#B3FF00';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#E8E8E8',
      textAlign: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflowX: 'hidden',
      backgroundColor: '#000'
    }}>
      <StarsBackground />
      
      {/* Hero Section */}
      <div className="fade-in" style={{
        maxWidth: '900px',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <img 
          src={kaiLogo} 
          alt="K.A.I. Logo" 
          style={{ 
            height: '140px', 
            width: 'auto',
            filter: `drop-shadow(0 0 20px ${accentColor}44)`,
            marginBottom: '10px'
          }} 
        />
        
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight: 900,
          margin: 0,
          letterSpacing: '-2px',
          lineHeight: 1.1,
          color: '#fff',
          textTransform: 'uppercase'
        }}>
          Knowledge AI <br/>
          <span style={{ color: accentColor }}>Neural Core</span>
        </h1>
        
        <p style={{
          fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
          maxWidth: '650px',
          opacity: 0.9,
          lineHeight: 1.6,
          fontWeight: 500,
          color: '#ccc'
        }}>
          When time is your enemy, we are your architect. <br/>
          Deploy tactical learning distributions to conquer complex syllabi in hours, not weeks.
        </p>

        <div style={{ marginTop: '40px' }}>
          <button 
            onClick={signInWithGoogle}
            style={{
              padding: '20px 50px',
              fontSize: '20px',
              fontWeight: 900,
              backgroundColor: accentColor,
              color: '#000',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              boxShadow: `0 0 40px ${accentColor}88`,
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}
            className="interactive-card"
          >
            Initialize Access ➔
          </button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="fade-in" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '30px',
        width: '100%',
        maxWidth: '1200px',
        marginTop: '100px',
        zIndex: 2,
        padding: '0 20px'
      }}>
        <FeatureCard 
          icon="📊" 
          title="EXTRACT" 
          desc="Instantly ingest lectures, PDFs, and YouTube content into high-fidelity core intel." 
          accent={accentColor}
        />
        <FeatureCard 
          icon="🎯" 
          title="ANALYZE" 
          desc="Cross-reference notes with syllabi to identify mission-critical exam patterns." 
          accent={accentColor}
        />
        <FeatureCard 
          icon="⚡" 
          title="SURVIVE" 
          desc="Execute survival protocols for extreme compression of study material under pressure." 
          accent={accentColor}
        />
      </div>

      {/* Background Visual Overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.15,
        zIndex: 1,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <video
          src={chatbotVideo}
          autoPlay
          loop
          muted
          playsInline
          style={{
            minWidth: '120%',
            minHeight: '120%',
            objectFit: 'cover',
            filter: `blur(40px) brightness(0.5)`
          }} 
        />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '30px',
        fontSize: '12px',
        fontWeight: 900,
        color: accentColor,
        letterSpacing: '4px',
        opacity: 0.5,
        zIndex: 2,
        textTransform: 'uppercase'
      }}>
        System Ready // K.A.I. Defence Network
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, accent }) {
  return (
    <div style={{
      backgroundColor: 'rgba(20, 20, 20, 0.7)',
      backdropFilter: 'blur(15px)',
      border: `1px solid rgba(179, 255, 0, 0.3)`,
      borderRadius: '40px',
      padding: '40px 30px',
      textAlign: 'left',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }} className="interactive-card">
      <div style={{ 
        fontSize: '40px',
        backgroundColor: 'rgba(179, 255, 0, 0.1)',
        width: '70px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '20px',
        border: `1px solid ${accent}44`
      }}>{icon}</div>
      <h3 style={{ 
        color: accent, 
        margin: 0, 
        fontSize: '22px', 
        fontWeight: 900, 
        letterSpacing: '2px',
        textTransform: 'uppercase'
      }}>{title}</h3>
      <p style={{ 
        margin: 0, 
        fontSize: '15px', 
        opacity: 0.8, 
        lineHeight: 1.6,
        color: '#eee'
      }}>{desc}</p>
    </div>
  );
}
