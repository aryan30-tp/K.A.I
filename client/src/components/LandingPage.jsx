import React from 'react';
import StarsBackground from './StarsBackground';
import kaiLogo from '../assets/Screenshot 2026-05-08 175656.png';
import robotBg from '../assets/ChatGPT Image May 8, 2026, 11_54_05 PM.png';

const LandingPage = ({ signInWithGoogle }) => {
  const accentColor = '#39FF14';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#121212',
      color: '#F5F5F5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Layer: Stars and Blurred Robot */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <StarsBackground />
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${robotBg}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          filter: 'blur(100px) grayscale(50%)',
          pointerEvents: 'none'
        }} />
      </div>
      
      {/* Navbar */}
      <nav style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 48px',
        borderBottom: '1px solid #333333',
        boxSizing: 'border-box',
        zIndex: 10,
        backgroundColor: 'rgba(18, 18, 18, 0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={kaiLogo} alt="K.A.I." style={{ height: '32px', width: 'auto' }} />
          <div style={{ color: accentColor, fontWeight: 'bold', fontSize: '24px', trackingWidest: '0.2em' }}>
            Knowledge AI
          </div>
        </div>
        <button 
          onClick={signInWithGoogle}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#777777',
            cursor: 'pointer',
            transition: 'color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.color = accentColor}
          onMouseLeave={(e) => e.target.style.color = '#777777'}
        >
          Operative Login
        </button>
      </nav>

      {/* Hero Section */}
      <main style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 20px',
        marginTop: '80px',
        zIndex: 1,
        maxWidth: '1000px'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 5rem)',
          fontWeight: 900,
          marginBottom: '24px',
          letterSpacing: '-1px',
          lineHeight: 1.1
        }}>
          EXAM TOMORROW.<br />
          <span style={{ color: accentColor }}>YOU ARE BLEEDING POINTS.</span>
        </h1>
        
        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          color: '#A0A0A0',
          maxWidth: '700px',
          marginBottom: '40px',
          lineHeight: 1.6
        }}>
          The tactical 1-night survival bunker. Drop your syllabus and Past Year Papers into the neural link. We'll tell you exactly what to study, and what to ignore.
        </p>

        <button 
          onClick={signInWithGoogle}
          style={{
            padding: '20px 40px',
            backgroundColor: 'transparent',
            border: `2px solid ${accentColor}`,
            color: accentColor,
            fontWeight: 'bold',
            fontSize: '18px',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: `0 0 20px rgba(57, 255, 20, 0.2)`
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = accentColor;
            e.target.style.color = '#000';
            e.target.style.boxShadow = `0 0 30px ${accentColor}`;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = accentColor;
            e.target.style.boxShadow = `0 0 20px rgba(57, 255, 20, 0.2)`;
          }}
        >
          Deploy War Room
        </button>
      </main>

      {/* The Operatives Section */}
      <section style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '120px 0 80px',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px',
        zIndex: 1,
        boxSizing: 'border-box'
      }}>
        <FeatureCard 
          title="KORTEX" 
          role="DATA HARVESTER" 
          desc="Feed him messy PDFs and YouTube links. He extracts the raw intel in seconds." 
          accent={accentColor}
        />
        <FeatureCard 
          title="IGNIS" 
          role="TACTICAL HEATMAP" 
          desc="Cross-references your syllabus with past exams. Study the glowing zones. Ignore the grey." 
          accent={accentColor}
        />
        <FeatureCard 
          title="AXIOM" 
          role="SOCRATIC TUTOR" 
          desc="Think you are ready? Axiom will interrogate you to expose weak spots before the actual exam." 
          accent={accentColor}
        />
      </section>

      {/* Footer Branding */}
      <div style={{
        padding: '40px 0',
        fontSize: '10px',
        fontWeight: 900,
        color: accentColor,
        letterSpacing: '4px',
        opacity: 0.3,
        zIndex: 1,
        textTransform: 'uppercase'
      }}>
        Knowledge AI // Tactical Defense Core
      </div>
    </div>
  );
};

const FeatureCard = ({ title, role, desc, accent }) => (
  <div style={{
    backgroundColor: '#1E1E1E',
    border: '1px solid #333333',
    padding: '40px',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    cursor: 'default'
  }} 
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = accent;
    e.currentTarget.style.transform = 'translateY(-5px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.borderColor = '#333333';
    e.currentTarget.style.transform = 'translateY(0)';
  }}
  >
    <div style={{ 
      fontSize: '11px', 
      color: '#777777', 
      marginBottom: '8px', 
      letterSpacing: '2px',
      fontWeight: 'bold'
    }}>{role}</div>
    <h3 style={{ 
      fontSize: '28px', 
      fontWeight: 'bold', 
      color: '#F5F5F5', 
      margin: '0 0 16px 0',
      letterSpacing: '1px'
    }}>{title}</h3>
    <p style={{ 
      color: '#A0A0A0', 
      lineHeight: 1.6, 
      margin: 0,
      fontSize: '15px'
    }}>{desc}</p>
  </div>
);

export default LandingPage;
