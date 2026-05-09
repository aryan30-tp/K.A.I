import React from 'react';

const CustomModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'CONFIRM', 
  cancelText = 'ABORT',
  isAlert = false 
}) => {
  if (!isOpen) return null;

  const accentColor = '#B3FF00';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 11000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#111',
        border: `2px solid ${accentColor}`,
        borderRadius: '30px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center',
        boxShadow: `0 0 30px rgba(179, 255, 0, 0.2), inset 0 0 20px rgba(0,0,0,0.5)`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Futuristic Corner Accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 20, borderTop: `4px solid ${accentColor}`, borderLeft: `4px solid ${accentColor}`, margin: 15 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderBottom: `4px solid ${accentColor}`, borderRight: `4px solid ${accentColor}`, margin: 15 }} />

        <div style={{ 
          fontSize: 12, 
          fontWeight: 900, 
          color: accentColor, 
          textTransform: 'uppercase', 
          letterSpacing: 4, 
          marginBottom: 15 
        }}>
          SYSTEM NOTIFICATION
        </div>

        <h2 style={{ 
          color: '#fff', 
          fontSize: 22, 
          marginBottom: 15,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          {title}
        </h2>

        <p style={{ 
          color: 'rgba(255,255,255,0.7)', 
          fontSize: 16, 
          lineHeight: 1.6,
          marginBottom: 35 
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
          {!isAlert && (
            <button 
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '15px',
                backgroundColor: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                fontWeight: 800,
                cursor: 'pointer',
                fontSize: 13,
                letterSpacing: 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            style={{
              flex: isAlert ? '0 1 200px' : 1,
              padding: '14px',
              borderRadius: '15px',
              backgroundColor: accentColor,
              color: '#000',
              border: 'none',
              fontWeight: 900,
              cursor: 'pointer',
              fontSize: 13,
              letterSpacing: 1,
              boxShadow: `0 5px 15px rgba(179, 255, 0, 0.3)`
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
