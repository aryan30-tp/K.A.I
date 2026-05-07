import React, { useRef, useState, useEffect } from 'react';
import robotVideo from '../assets/Robot Ai chatbot.webm';
import aiFlowVideo from '../assets/ai animation Flow 1.webm';

export default function SocraticTutorTest({
  apiBase = '',
  workspaceId = '',
  sessionId = '',
  onWorkspaceIdChange = () => {},
}) {
  // Persistence Keys
  const STORAGE_KEY_TOPIC = `kai_tutor_topic_${workspaceId}`;
  const STORAGE_KEY_HISTORY = `kai_tutor_history_${workspaceId}`;

  const [topic, setTopic] = useState(() => localStorage.getItem(STORAGE_KEY_TOPIC) || '');
  const [confirmedTopic, setConfirmedTopic] = useState(() => localStorage.getItem(STORAGE_KEY_TOPIC) || '');
  const [chatHistory, setChatHistory] = useState(() => localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('Ready for input.');
  const [output, setOutput] = useState(null);
  const [parsedHistory, setParsedHistory] = useState([]);
  const [isFirstMount, setIsFirstMount] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatEndRef = useRef(null);

  const accentColor = '#B3FF00';

  // Parse history from string state
  useEffect(() => {
    try {
      const history = JSON.parse(chatHistory);
      setParsedHistory(history);
      localStorage.setItem(STORAGE_KEY_HISTORY, chatHistory);
    } catch (err) {
      console.error('Failed to parse history', err);
    }
  }, [chatHistory, STORAGE_KEY_HISTORY]);

  // Scroll to bottom when history updates
  useEffect(() => {
    if (isFirstMount) {
      setIsFirstMount(false);
      return;
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [parsedHistory]);

  const speakSocraticResponse = (textToSpeak) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) => voice.name.includes('Google') || voice.lang === 'en-US' || voice.name.includes('Natural')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    if (!confirmedTopic) {
      alert("Please confirm a topic first.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setStatusText('Decoding your response...');

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'live-recording.webm', {
          type: 'audio/webm',
        });

        const formData = new FormData();
        formData.append('audioFile', audioFile);
        formData.append('topic', confirmedTopic);
        formData.append('workspaceId', workspaceId);
        formData.append('sessionId', sessionId);
        formData.append('chatHistory', chatHistory);
        formData.append('attemptCount', String(attemptCount));

        try {
          const response = await fetch(`${apiBase}/api/socratic/turn`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          setOutput(data);
          
          if (data.tutorSpeech) {
            setStatusText('Listen to your tutor...');
            speakSocraticResponse(data.tutorSpeech);
          } else {
            setStatusText('Ready for next input.');
          }

          if (data.studentTranscription && data.tutorSpeech) {
            const updatedHistory = [
              ...parsedHistory,
              { role: 'user', parts: [{ text: data.studentTranscription }] },
              { role: 'model', parts: [{ text: data.tutorSpeech }] },
            ];
            setChatHistory(JSON.stringify(updatedHistory));
          }

          if (data.isConceptMastered) {
            setAttemptCount(0);
          } else {
            setAttemptCount((prev) => prev + 1);
          }
        } catch (error) {
          setStatusText('Error connecting to backend.');
          console.error(error);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatusText('Listening... Click robot to stop.');
    } catch (err) {
      alert('Microphone access denied. Please allow mic permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRobotClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleConfirmTopic = () => {
    if (!topic.trim()) return;
    setConfirmedTopic(topic);
    localStorage.setItem(STORAGE_KEY_TOPIC, topic);
    setStatusText(`Topic confirmed: ${topic}`);
  };

  return (
    <div style={{ 
      maxWidth: '100%', 
      width: '100%',
      margin: '0 auto', 
      padding: '20px 40px', 
      color: '#fff', 
      fontFamily: 'Inter, sans-serif',
      display: 'grid',
      gridTemplateColumns: '380px 1fr 350px',
      gap: '30px',
      alignItems: 'stretch',
      height: 'calc(100vh - 160px)',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* Left Panel: Session Intel */}
      <div className="fade-in" style={{
        backgroundColor: 'rgba(25, 25, 25, 0.7)',
        borderRadius: '40px',
        border: `1px solid rgba(179, 255, 0, 0.4)`,
        padding: '35px',
        backdropFilter: 'blur(25px)',
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(179, 255, 0, 0.05)`,
        display: 'flex',
        flexDirection: 'column',
        gap: '25px',
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
          <h3 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 900, 
            color: accentColor, 
            textTransform: 'uppercase', 
            letterSpacing: '3px',
          }}>
            Intel
          </h3>
        </div>
        
        <div style={{ height: '1px', background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

        <div style={{ position: 'relative', marginLeft: '-10px' }}>
          <label style={{ fontSize: '11px', opacity: 0.5, display: 'block', marginBottom: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Mission Objective</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Focus topic..."
              style={{ 
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)', 
                border: `1px solid ${confirmedTopic === topic && topic ? accentColor : 'rgba(179, 255, 0, 0.3)'}`, 
                padding: '18px', 
                borderRadius: '20px', 
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                outline: 'none',
                boxShadow: `inset 0 0 15px rgba(179, 255, 0, 0.1)`,
                transition: 'all 0.3s ease'
              }}
            />
            <button 
              onClick={handleConfirmTopic}
              style={{
                backgroundColor: accentColor,
                color: '#000',
                border: 'none',
                borderRadius: '15px',
                padding: '0 20px',
                fontWeight: '900',
                fontSize: '12px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Set
            </button>
          </div>
        </div>

        <div style={{ 
          padding: '25px', 
          backgroundColor: 'rgba(179, 255, 0, 0.08)', 
          borderRadius: '30px', 
          border: `1px solid rgba(179, 255, 0, 0.2)`,
          boxShadow: `0 10px 20px rgba(0,0,0,0.2)`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase' }}>Mastery Level</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: accentColor }}>LVL {Math.floor(attemptCount / 5) + 1}</div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: accentColor, marginBottom: '15px' }}>
            {attemptCount > 0 ? `${Math.min(100, attemptCount * 15)}%` : '0%'}
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, attemptCount * 15)}%`, height: '100%', backgroundColor: accentColor, boxShadow: `0 0 15px ${accentColor}`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>

        <div style={{ 
          fontSize: '13px', 
          opacity: 0.6, 
          lineHeight: 1.6, 
          fontStyle: 'italic',
          padding: '15px',
          borderLeft: `2px solid ${accentColor}`,
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          "Knowledge is the only weapon that grows sharper with use." - K.A.I. System
        </div>

        <div style={{ 
          marginTop: 'auto',
          padding: '25px', 
          backgroundColor: 'rgba(179, 255, 0, 0.05)', 
          borderRadius: '30px', 
          border: `1px solid rgba(179, 255, 0, 0.15)`,
          lineHeight: 1.5
        }}>
          <div style={{ color: accentColor, fontWeight: 900, fontSize: '16px', marginBottom: '10px', textTransform: 'uppercase' }}>Meet Axiom</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            Hi, I am <span style={{ color: accentColor, fontWeight: 'bold' }}>Axiom</span>, your neural-linked tutor. I'm engineered to dismantle complex concepts and rebuild them in your mind until you ace your goals. Let's sync and conquer.
          </div>
        </div>
      </div>

      {/* Center Column: Robot + Chat */}
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        
        {/* Robot Stage */}
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '30px 40px',
          backgroundColor: 'rgba(15, 15, 15, 0.8)',
          borderRadius: '50px',
          border: `2px solid ${isRecording ? accentColor : 'rgba(179, 255, 0, 0.5)'}`,
          boxShadow: isRecording 
            ? `0 0 100px rgba(179, 255, 0, 0.5), inset 0 0 60px rgba(179, 255, 0, 0.15)` 
            : `0 0 60px rgba(179, 255, 0, 0.2), inset 0 0 30px rgba(179, 255, 0, 0.05)`,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: 'pointer',
          overflow: 'hidden',
          backdropFilter: 'blur(30px)',
          animation: isRecording ? 'pulseGlow 2s infinite ease-in-out' : 'none',
          flexShrink: 0
        }}
        onClick={handleRobotClick}
        >
          <style>{`
            @keyframes pulseGlow {
              0%, 100% { box-shadow: 0 0 100px rgba(179, 255, 0, 0.5), inset 0 0 60px rgba(179, 255, 0, 0.15); }
              50% { box-shadow: 0 0 140px rgba(179, 255, 0, 0.7), inset 0 0 80px rgba(179, 255, 0, 0.25); }
            }
          `}</style>

          {/* Ambient Green Background Glow */}
          <div style={{
            position: 'absolute',
            width: '120%',
            height: '120%',
            background: `radial-gradient(circle, rgba(179, 255, 0, 0.15) 0%, transparent 75%)`,
            zIndex: 0,
            pointerEvents: 'none'
          }} />

          <video 
            src={robotVideo} 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ 
              width: '320px', 
              height: '320px', 
              zIndex: 1,
              filter: `drop-shadow(0 0 45px rgba(179, 255, 0, ${isRecording ? '0.8' : '0.5'})) brightness(1.25)`,
              transition: 'all 0.5s ease',
              transform: isRecording ? 'scale(1.05)' : 'scale(1)'
            }} 
          />
          
          <div style={{ 
            marginTop: '20px', 
            fontSize: '24px', 
            fontWeight: '1000', 
            letterSpacing: '5px',
            color: isRecording ? accentColor : '#fff',
            textTransform: 'uppercase',
            textAlign: 'center',
            zIndex: 1,
            textShadow: `0 0 25px ${isRecording ? accentColor : 'rgba(179, 255, 0, 0.6)'}`
          }}>
            {isRecording ? '● SYSTEM ACTIVE' : 'INITIALIZE NEURAL LINK'}
          </div>
          <div style={{ 
            opacity: 0.9, 
            fontSize: '14px', 
            marginTop: '10px', 
            zIndex: 1, 
            fontWeight: 700, 
            color: isRecording ? accentColor : '#fff',
            letterSpacing: '1px'
          }}>
            {statusText}
          </div>
        </div>

        {/* Chat History Box */}
        <div style={{ 
          backgroundColor: 'rgba(30, 30, 30, 0.6)', 
          borderRadius: '50px', 
          border: `1px solid rgba(179, 255, 0, 0.25)`,
          padding: '40px',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), inset 0 0 50px rgba(0,0,0,0.3)'
        }}>
          {parsedHistory.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.3, marginTop: 'auto', marginBottom: 'auto', fontSize: '20px', fontWeight: 900, letterSpacing: '4px' }}>
              WAITING FOR SYNC...
            </div>
          ) : (
            parsedHistory.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '24px 32px',
                borderRadius: msg.role === 'user' ? '35px 35px 5px 35px' : '35px 35px 35px 5px',
                backgroundColor: msg.role === 'user' ? accentColor : 'rgba(255,255,255,0.1)',
                color: msg.role === 'user' ? '#000' : '#fff',
                fontWeight: msg.role === 'user' ? 800 : 600,
                lineHeight: 1.7,
                fontSize: '16px',
                border: msg.role === 'user' ? 'none' : `1px solid rgba(179, 255, 0, 0.3)`,
                boxShadow: msg.role === 'user' 
                  ? `0 15px 35px rgba(179, 255, 0, 0.35), 0 0 25px rgba(179, 255, 0, 0.15)` 
                  : `0 12px 25px rgba(0,0,0,0.3)`
              }}>
                {msg.parts[0].text}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Right Panel: Diagnostics */}
      <div className="fade-in" style={{
        backgroundColor: 'rgba(25, 25, 25, 0.7)',
        borderRadius: '40px',
        border: `1px solid rgba(179, 255, 0, 0.4)`,
        padding: '35px',
        backdropFilter: 'blur(25px)',
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(179, 255, 0, 0.05)`,
        display: 'flex',
        flexDirection: 'column',
        gap: '25px',
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
          <h3 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 900, 
            color: accentColor, 
            textTransform: 'uppercase', 
            letterSpacing: '3px',
          }}>
            Status
          </h3>
        </div>

        <div style={{ height: '1px', background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

        <div>
          <label style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', display: 'block', fontWeight: 800, letterSpacing: '1px' }}>Core Sync ID</label>
          <div style={{ 
            fontSize: '13px', 
            fontFamily: 'monospace', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            padding: '15px', 
            borderRadius: '15px',
            border: '1px solid rgba(179, 255, 0, 0.2)',
            wordBreak: 'break-all',
            color: accentColor,
            fontWeight: 'bold'
          }}>
            {workspaceId || 'OFFLINE'}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', marginBottom: '10px', display: 'block', fontWeight: 800, letterSpacing: '1px' }}>Voice Core</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>Neural-V2 (Active)</span>
          </div>
        </div>

        <div style={{ 
          padding: '25px', 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          borderRadius: '30px', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `inset 0 0 20px rgba(0,0,0,0.2)`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', fontWeight: 800 }}>Neural Load</div>
            <div style={{ fontSize: '11px', color: accentColor, fontWeight: 900 }}>64%</div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} style={{ 
                flex: 1, 
                height: '24px', 
                backgroundColor: i < 7 ? accentColor : 'rgba(255,255,255,0.1)', 
                borderRadius: '3px',
                boxShadow: i < 7 ? `0 0 10px ${accentColor}44` : 'none'
              }} />
            ))}
          </div>
        </div>

        {/* Cool AI Flow Animation */}
        <div style={{ marginTop: 'auto', marginBottom: '10px', display: 'flex', justifyContent: 'center', overflow: 'hidden', borderRadius: '20px' }}>
          <video 
            src={aiFlowVideo} 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 0 20px rgba(179, 255, 0, 0.3))' }} 
          />
        </div>

        <div style={{ 
          marginTop: 'auto',
          fontSize: '10px', 
          opacity: 0.4, 
          textAlign: 'center', 
          letterSpacing: '2px',
          fontWeight: 800,
          textTransform: 'uppercase'
        }}>
          K.A.I. Neural Interface V2.4.9
        </div>
      </div>

    </div>
  );
}
