import React, { useRef, useState } from 'react';

export default function SocraticTutorTest({ apiBase = '' }) {
  const [topic, setTopic] = useState('Graph Algorithms');
  const [workspaceId, setWorkspaceId] = useState('user_123');
  const [chatHistory, setChatHistory] = useState('[]');
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('Ready for input.');
  const [output, setOutput] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const speakSocraticResponse = (textToSpeak) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) => voice.name.includes('Google') || voice.lang === 'en-US'
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
        setStatusText('Processing audio and asking Pinecone...');

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'live-recording.webm', {
          type: 'audio/webm',
        });

        const formData = new FormData();
        formData.append('audioFile', audioFile);
        formData.append('topic', topic);
        formData.append('workspaceId', workspaceId);
        formData.append('chatHistory', chatHistory);

        try {
          const response = await fetch(`${apiBase}/api/socratic/turn`, {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          setOutput(data);
          setStatusText('Response received!');

          if (data.tutorSpeech) {
            speakSocraticResponse(data.tutorSpeech);
          }

          if (data.studentTranscription && data.tutorSpeech) {
            try {
              const currentHistory = JSON.parse(chatHistory);
              const updatedHistory = [
                ...currentHistory,
                { role: 'user', parts: [{ text: data.studentTranscription }] },
                { role: 'model', parts: [{ text: data.tutorSpeech }] },
              ];
              setChatHistory(JSON.stringify(updatedHistory, null, 2));
            } catch (parseErr) {
              console.error('Failed to parse chat history', parseErr);
            }
          }
        } catch (error) {
          setStatusText('Error connecting to backend.');
          setOutput({ error: error.toString() });
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatusText('Listening... Speak your answer!');
    } catch (err) {
      alert('Microphone access denied. Please allow mic permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gray-50 min-h-screen font-sans">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          🎙️ Agent 8: Live Voice Tutor
        </h2>

        <div className="space-y-4 mb-6">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Topic (e.g., Graph Algorithms)"
          />
          <input
            type="text"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Workspace ID"
          />

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-2">
              Chat History (JSON Array)
            </label>
            <textarea
              value={chatHistory}
              onChange={(e) => setChatHistory(e.target.value)}
              rows="5"
              className="w-full p-3 border border-gray-300 rounded font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`flex-1 font-bold py-3 px-4 rounded text-white transition ${
              isRecording ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            🎤 Start Recording
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`flex-1 font-bold py-3 px-4 rounded text-white transition ${
              !isRecording ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            🛑 Stop & Send
          </button>
        </div>

        <div className="mb-6 flex items-center text-gray-700 font-medium">
          <span
            className={`inline-block w-3 h-3 rounded-full mr-3 ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
            }`}
          ></span>
          {statusText}
        </div>

        <div>
          <h3 className="text-lg font-bold mb-2 text-gray-800">API Response:</h3>
          <pre className="bg-slate-900 text-sky-400 p-4 rounded overflow-x-auto text-sm font-mono">
            {output ? JSON.stringify(output, null, 2) : 'Waiting for data...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
