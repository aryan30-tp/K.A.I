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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Robot Stage */}
      <div style={{ 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: 'rgba(20, 20, 20, 0.4)',
        borderRadius: '40px',
        border: `1px solid ${isRecording ? accentColor : 'rgba(255,255,255,0.1)'}`,
        boxShadow: isRecording ? `0 0 60px rgba(179, 255, 0, 0.2)` : 'none',
        transition: 'all 0.4s ease',
        cursor: 'pointer',
        marginBottom: '30px',
        overflow: 'hidden'
      }}
      onClick={handleRobotClick}
      >
        <video 
          src={robotVideo} 
          autoPlay 
          loop 
          muted 
          playsInline 
          style={{ 
            width: '350px', 
            height: '350px', 
            filter: isRecording ? `drop-shadow(0 0 30px ${accentColor})` : 'none',
            transition: 'filter 0.3s ease'
          }} 
        />
        
        <div style={{ 
          marginTop: '20px', 
          fontSize: '18px', 
          fontWeight: '700', 
          letterSpacing: '1px',
          color: isRecording ? accentColor : '#fff',
          textTransform: 'uppercase',
          textAlign: 'center'
        }}>
          {isRecording ? '● Recording... Click to Stop' : 'Click me to talk'}
        </div>
        <div style={{ opacity: 0.6, fontSize: '13px', marginTop: '8px' }}>
          {statusText}
        </div>
      </div>

      {/* Chat History Box */}
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
        borderRadius: '30px', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '30px',
        minHeight: '200px',
        maxHeight: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        {parsedHistory.length === 0 ? (
          <div style={{ textAlign: 'center', opacity: 0.4, marginTop: '60px' }}>
            No transcript yet. Start talking to your tutor!
          </div>
        ) : (
          parsedHistory.map((msg, i) => (
            <div key={i} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '16px 24px',
              borderRadius: msg.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
              backgroundColor: msg.role === 'user' ? accentColor : 'rgba(255,255,255,0.08)',
              color: msg.role === 'user' ? '#000' : '#fff',
              fontWeight: 500,
              lineHeight: 1.5,
              fontSize: '15px'
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
