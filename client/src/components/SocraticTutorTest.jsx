import React, { useRef, useState, useEffect } from 'react';
import robotVideo from '../assets/Robot Ai chatbot.webm';

export default function SocraticTutorTest({
  apiBase = '',
  workspaceId = '',
  sessionId = '',
  onWorkspaceIdChange = () => {},
}) {
  const [topic, setTopic] = useState('Graph Algorithms');
  const [chatHistory, setChatHistory] = useState('[]');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('Ready for input.');
  const [output, setOutput] = useState(null);
  const [parsedHistory, setParsedHistory] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatEndRef = useRef(null);

  const accentColor = '#B3FF00';

  useEffect(() => {
    try {
      const history = JSON.parse(chatHistory);
      setParsedHistory(history);
    } catch (err) {
      console.error('Failed to parse history', err);
    }
  }, [chatHistory]);

  useEffect(() => {
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
        formData.append('topic', topic);
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

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Robot Stage */}
      <div style={{ 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px 40px',
        backgroundColor: 'rgba(20, 20, 20, 0.6)',
        borderRadius: '50px',
        border: `2px solid ${isRecording ? accentColor : 'rgba(179, 255, 0, 0.15)'}`,
        boxShadow: isRecording 
          ? `0 0 80px rgba(179, 255, 0, 0.25), inset 0 0 40px rgba(179, 255, 0, 0.05)` 
          : `0 0 40px rgba(179, 255, 0, 0.05)`,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        marginBottom: '40px',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)'
      }}
      onClick={handleRobotClick}
      >
        {/* Ambient Green Background Glow */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, rgba(179, 255, 0, 0.08) 0%, transparent 70%)`,
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
            width: '450px', 
            height: '450px', 
            zIndex: 1,
            filter: `drop-shadow(0 0 25px rgba(179, 255, 0, ${isRecording ? '0.5' : '0.2'})) brightness(1.1)`,
            transition: 'all 0.4s ease'
          }} 
        />
        
        <div style={{ 
          marginTop: '30px', 
          fontSize: '22px', 
          fontWeight: '800', 
          letterSpacing: '2px',
          color: isRecording ? accentColor : '#fff',
          textTransform: 'uppercase',
          textAlign: 'center',
          zIndex: 1,
          textShadow: isRecording ? `0 0 15px ${accentColor}` : 'none'
        }}>
          {isRecording ? '● System Active: Listening' : 'Initialize Voice Sync'}
        </div>
        <div style={{ opacity: 0.7, fontSize: '14px', marginTop: '10px', zIndex: 1, fontWeight: 500 }}>
          {statusText}
        </div>
      </div>

      {/* Chat History Box */}
      <div style={{ 
        backgroundColor: 'rgba(34, 34, 34, 0.4)', 
        borderRadius: '40px', 
        border: `1px solid rgba(179, 255, 0, 0.1)`,
        padding: '40px',
        minHeight: '250px',
        maxHeight: '500px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backdropFilter: 'blur(15px)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
      }}>
        {parsedHistory.length === 0 ? (
          <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '80px', fontSize: '16px' }}>
            Translink empty. Synchronize with K.A.I. to begin.
          </div>
        ) : (
          parsedHistory.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '20px 28px',
              borderRadius: msg.role === 'user' ? '30px 30px 4px 30px' : '30px 30px 30px 4px',
              backgroundColor: msg.role === 'user' ? accentColor : 'rgba(255,255,255,0.05)',
              color: msg.role === 'user' ? '#000' : '#fff',
              fontWeight: msg.role === 'user' ? 700 : 500,
              lineHeight: 1.6,
              fontSize: '16px',
              border: msg.role === 'user' ? 'none' : `1px solid rgba(179, 255, 0, 0.1)`,
              boxShadow: msg.role === 'user' ? `0 10px 20px rgba(179, 255, 0, 0.2)` : 'none'
            }}>
              {msg.parts[0].text}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Debug/Settings Area - Shifted Down */}
      <div style={{ marginTop: '100px', padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ margin: '0 0 16px 0', opacity: 0.5, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Debug Settings</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Current Topic</label>
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Workspace ID</label>
            <input 
              type="text" 
              value={workspaceId} 
              onChange={(e) => onWorkspaceIdChange(e.target.value)}
              style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
            />
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ fontSize: '11px', opacity: 0.6, display: 'block', marginBottom: '6px' }}>Raw Chat JSON</label>
          <textarea 
            value={chatHistory} 
            onChange={(e) => setChatHistory(e.target.value)}
            style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
