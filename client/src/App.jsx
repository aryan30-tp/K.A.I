import React, { useEffect, useState } from 'react';
import SocraticTutorTest from './components/SocraticTutorTest.jsx';
import VisualLabCard from './components/VisualLabCard.jsx';
import { useAuth } from './context/AuthContext.jsx';
import chatbotVideo from './assets/Live chatbot.webm';

function StarsBackground() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const starCount = 150;
    const generatedStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 3 + 2}s`,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="stars-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
          }}
        />
      ))}
    </div>
  );
}

function LoadingProgressBar({ loading, label }) {
  if (!loading) return null;
  return (
    <div style={{ width: '100%', marginTop: 24, maxWidth: 600, marginInline: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, fontWeight: 700, color: '#B3FF00', textTransform: 'uppercase', letterSpacing: 1 }}>
        <span>{label}</span>
        <span className="pulse">AI Processing...</span>
      </div>
      <div style={{ width: '100%', height: 4, backgroundColor: 'rgba(179, 255, 0, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div className="loading-bar-fill" />
      </div>
    </div>
  );
}

function RandomMovingBox({ children }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState({ x: (Math.random() - 0.5) * 0.1, y: (Math.random() - 0.5) * 0.1 });
  const [mousePos, setMousePos] = useState(null);
  const [sparkles, setSparkles] = useState([]);
  const containerRef = React.useRef(null);

  useEffect(() => {
    let animationFrameId;
    
    const update = () => {
      // Update Sparkles (fade them out)
      setSparkles(prev => prev.map(s => ({ ...s, opacity: s.opacity - 0.01 })).filter(s => s.opacity > 0));

      setPosition(prev => {
        let nextVelX = velocity.x;
        let nextVelY = velocity.y;

        // Target: Mouse or nearest sparkle
        let target = mousePos;
        if (!target && sparkles.length > 0) {
          // Find closest sparkle
          target = sparkles.reduce((prevS, currS) => {
            const dPrev = Math.sqrt((prevS.x - prev.x)**2 + (prevS.y - prev.y)**2);
            const dCurr = Math.sqrt((currS.x - prev.x)**2 + (currS.y - prev.y)**2);
            return dCurr < dPrev ? currS : prevS;
          });
        }

        if (target) {
          const dx = target.x - prev.x;
          const dy = target.y - prev.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 1) {
            const pull = target === mousePos ? 0.02 : 0.015;
            nextVelX += (dx / dist) * pull;
            nextVelY += (dy / dist) * pull;
          }

          // "Collect" sparkles if robot is very close
          if (dist < 5 && target !== mousePos) {
            setSparkles(prevS => prevS.filter(s => s.id !== target.id));
          }
        } else {
          if (Math.random() < 0.005) {
            nextVelX += (Math.random() - 0.5) * 0.05;
            nextVelY += (Math.random() - 0.5) * 0.05;
          }
        }

        const speed = Math.sqrt(nextVelX ** 2 + nextVelY ** 2);
        const maxSpeed = (mousePos || sparkles.length > 0) ? 0.25 : 0.12;
        const minSpeed = 0.04;
        if (speed > maxSpeed) {
          nextVelX = (nextVelX / speed) * maxSpeed;
          nextVelY = (nextVelY / speed) * maxSpeed;
        } else if (speed < minSpeed) {
          nextVelX = (nextVelX / speed) * minSpeed;
          nextVelY = (nextVelY / speed) * minSpeed;
        }

        let nextX = prev.x + nextVelX;
        let nextY = prev.y + nextVelY;

        if (nextX <= 10 || nextX >= 90) {
          nextVelX *= -0.8;
          nextX = prev.x + nextVelX;
        }
        if (nextY <= 10 || nextY >= 90) {
          nextVelY *= -0.8;
          nextY = prev.y + nextVelY;
        }

        setVelocity({ x: nextVelX, y: nextVelY });
        return { x: nextX, y: nextY };
      });

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [velocity, mousePos, sparkles]);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });
      
      // Add sparkle
      if (Math.random() > 0.7) {
        setSparkles(prev => [
          ...prev, 
          { x, y, id: Math.random(), opacity: 1, size: 10 + Math.random() * 10 }
        ]);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos(null)}
      style={{
        width: '100%',
        height: '500px',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '40px', 
        borderRadius: '35px',
        border: '1px solid rgba(179, 255, 0, 0.35)',
        background: 'rgba(179, 255, 0, 0.03)',
        boxShadow: 'inset 0 0 30px rgba(179, 255, 0, 0.07)',
        cursor: 'none'
      }}
    >
      {/* Sparkles */}
      {sparkles.map(s => (
        <div 
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            backgroundColor: '#B3FF00',
            opacity: s.opacity,
            boxShadow: '0 0 15px 2px #B3FF00',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      <div style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'none', 
        pointerEvents: 'none'
      }}>
        {children}
      </div>
    </div>
  );
}

function FlashcardSwiper({ cards, onReachEndThreshold }) {
  const [currentIndex, setCurrentIdx] = useState(0);

  useEffect(() => {
    // If we're at the last pair or near, trigger the fetch
    if (currentIndex >= cards.length - 4) { 
      onReachEndThreshold();
    }
  }, [currentIndex, cards.length, onReachEndThreshold]);

  if (!cards || cards.length === 0) return null;

  // We show 2 cards at a time. currentIndex represents the first card in the pair.
  const handleNext = () => {
    if (currentIndex + 2 < cards.length) {
      setCurrentIdx(prev => prev + 2);
    }
  };

  const handlePrev = () => {
    if (currentIndex - 2 >= 0) {
      setCurrentIdx(prev => prev - 2);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button 
          disabled={currentIndex === 0}
          onClick={handlePrev}
          style={{ 
            background: 'none', 
            border: `1px solid #B3FF00`, 
            color: '#B3FF00', 
            padding: '10px 20px', 
            borderRadius: 15, 
            cursor: currentIndex === 0 ? 'default' : 'pointer', 
            opacity: currentIndex === 0 ? 0.3 : 1,
            fontWeight: 700
          }}
        >
          ← Prev
        </button>
        <div style={{ fontWeight: 800, fontSize: 20, color: '#B3FF00' }}>
          {cards[currentIndex + 1] ? `Cards ${currentIndex + 1} & ${currentIndex + 2}` : `Card ${currentIndex + 1}`}
        </div>
        <button 
          disabled={currentIndex + 1 >= cards.length - 1}
          onClick={handleNext}
          style={{ 
            background: 'none', 
            border: `1px solid #B3FF00`, 
            color: '#B3FF00', 
            padding: '10px 20px', 
            borderRadius: 15, 
            cursor: currentIndex + 1 >= cards.length - 1 ? 'default' : 'pointer', 
            opacity: currentIndex + 1 >= cards.length - 1 ? 0.3 : 1,
            fontWeight: 700
          }}
        >
          Next →
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, position: 'relative', minHeight: 340 }}>
        <FlashcardComponent card={cards[currentIndex]} key={`fc-${currentIndex}`} />
        {cards[currentIndex + 1] && (
          <FlashcardComponent card={cards[currentIndex + 1]} key={`fc-${currentIndex + 1}`} />
        )}
      </div>
    </div>
  );
}

function FlashcardComponent({ card }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const accentColor = '#B3FF00';

  const cardSideStyle = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    borderRadius: 24,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    overflowY: 'auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  };

  return (
    <div 
      onClick={() => setIsFlipped(!isFlipped)}
      className="interactive-card"
      style={{
        perspective: '1000px',
        cursor: 'pointer',
        marginBottom: 20,
        width: '100%',
        height: 320,
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transition: 'transform 0.6s',
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
      }}>
        {/* Front */}
        <div style={{
          ...cardSideStyle,
          backgroundColor: 'rgba(34, 34, 34, 0.95)',
          border: `1px solid ${accentColor}`,
        }}>
          <div style={{ color: accentColor, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Question</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#F5F5F5' }}>{card.front}</div>
          <div style={{ position: 'absolute', bottom: 20, fontSize: 11, opacity: 0.5, letterSpacing: 1 }}>TAP TO FLIP</div>
        </div>
        {/* Back */}
        <div style={{
          ...cardSideStyle,
          backgroundColor: 'rgba(45, 45, 45, 0.98)',
          border: `1px solid ${accentColor}`,
          transform: 'rotateY(180deg)',
        }}>
          <div style={{ color: accentColor, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Answer</div>
          <div style={{ fontSize: 16, color: '#E8E8E8', marginBottom: 10, lineHeight: 1.5 }}>{card.back}</div>
          <VisualLabCard topic={card.front} mermaidCode={card.mermaidCode} />
          <div style={{ position: 'absolute', bottom: 20, fontSize: 11, opacity: 0.5, letterSpacing: 1 }}>TAP TO REVERT</div>
        </div>
      </div>
    </div>
  );
}

function MockTestComponent({ testData, workspaceId, apiBase }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const accentColor = '#B3FF00';

  if (!testData || !testData.questions) return null;
  const question = testData.questions[currentIdx];

  const handleNext = () => {
    if (currentIdx < testData.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
      setShowExplanation(false);
    }
  };

  const handleSelect = async (opt) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(opt);
    setShowExplanation(true);

    // Record performance for heatmap
    try {
      const isCorrect = opt === question.correctAnswer;
      await fetch(`${apiBase}/api/analytics/record-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspaceId.trim(),
          topic: testData.testTitle || 'General',
          score: isCorrect ? 100 : 0,
          missingConcepts: isCorrect ? [] : [question.questionText]
        }),
      });
    } catch (err) {
      console.error("Failed to record test result", err);
    }
  };

  return (
    <div style={{ backgroundColor: 'rgba(34, 34, 34, 0.84)', border: `1px solid ${accentColor}`, borderRadius: 30, padding: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h4 style={{ margin: 0, color: accentColor }}>{testData.testTitle}</h4>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Question {currentIdx + 1} of {testData.questions.length}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{question.questionText}</div>
        <VisualLabCard topic={question.questionText} mermaidCode={question.questionMermaidCode} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {question.options.map((opt, idx) => {
          let bgColor = 'rgba(71, 71, 71, 0.72)';
          let borderColor = 'rgba(255, 255, 255, 0.14)';
          
          if (selectedOpt !== null) {
            if (opt === question.correctAnswer) {
              bgColor = 'rgba(0, 255, 0, 0.15)';
              borderColor = '#00ff00';
            } else if (opt === selectedOpt) {
              bgColor = 'rgba(255, 0, 0, 0.15)';
              borderColor = '#ff0000';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(opt)}
              style={{
                textAlign: 'left',
                padding: '16px 20px',
                borderRadius: 16,
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                color: '#F5F5F5',
                cursor: selectedOpt === null ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div style={{ marginTop: 24, padding: 20, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontWeight: 700, color: accentColor, marginBottom: 8 }}>Explanation</div>
          <div style={{ marginBottom: 12 }}>{question.explanation}</div>
          <VisualLabCard topic={`Explanation: ${question.questionText}`} mermaidCode={question.explanationMermaidCode} />
          
          {currentIdx < testData.questions.length - 1 && (
            <button 
              onClick={handleNext}
              style={{
                marginTop: 16,
                padding: '10px 24px',
                backgroundColor: accentColor,
                color: '#000',
                border: 'none',
                borderRadius: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Next Question →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryComponent({ data }) {
  const accentColor = '#B3FF00';
  return (
    <div style={{ backgroundColor: 'rgba(34, 34, 34, 0.84)', border: `1px solid ${accentColor}`, borderRadius: 30, padding: 30 }}>
      <h3 style={{ color: accentColor, marginTop: 0 }}>{data.title}</h3>
      <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>{data.executiveSummary}</p>
      
      <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {data.keyTakeaways.map((item, idx) => (
          <div key={idx} style={{ padding: 20, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, color: accentColor }}>{item.topic}</div>
            <div style={{ marginBottom: 15, lineHeight: 1.5 }}>{item.summary}</div>
            {item.mnemonic && (
              <div style={{ padding: '8px 16px', backgroundColor: 'rgba(179, 255, 0, 0.1)', borderRadius: 12, fontSize: 14, fontStyle: 'italic', display: 'inline-block' }}>
                💡 Mnemonic: {item.mnemonic}
              </div>
            )}
            <VisualLabCard topic={item.topic} mermaidCode={item.mermaidCode} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ELI5Component({ data }) {
  const accentColor = '#B3FF00';
  return (
    <div style={{ backgroundColor: 'rgba(34, 34, 34, 0.84)', border: `1px solid ${accentColor}`, borderRadius: 30, padding: 30 }}>
      <h3 style={{ color: accentColor, marginTop: 0 }}>Explain Like I'm 5: {data.topic}</h3>
      <div style={{ fontSize: 24, fontStyle: 'italic', marginBottom: 20, color: accentColor, opacity: 0.8 }}>"{data.theAnalogy}"</div>
      <div style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 24 }}>{data.simpleExplanation}</div>
      <div style={{ padding: 20, backgroundColor: 'rgba(179, 255, 0, 0.05)', borderRadius: 20, border: `1px solid ${accentColor}` }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Why it matters:</div>
        <div>{data.whyItMatters}</div>
      </div>
      <VisualLabCard topic={data.topic} mermaidCode={data.mermaidCode} />
    </div>
  );
}

function StudyPlanComponent({ planData }) {
  const accentColor = '#B3FF00';
  if (!planData || !planData.tasks) return null;

  return (
    <div style={{ backgroundColor: 'rgba(34, 34, 34, 0.84)', border: `1px solid ${accentColor}`, borderRadius: 30, padding: 30 }}>
      <h3 style={{ color: accentColor, marginTop: 0 }}>📅 {planData.planTitle || 'Your Study Plan'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {planData.tasks.sort((a, b) => a.order - b.order).map((task, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            gap: 20, 
            padding: 20, 
            backgroundColor: 'rgba(255, 255, 255, 0.03)', 
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: '50%', 
              backgroundColor: accentColor, 
              color: '#000', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 18,
              flexShrink: 0
            }}>
              {task.order}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: accentColor }}>{task.topic}</div>
                <div style={{ 
                  fontSize: 12, 
                  padding: '4px 12px', 
                  borderRadius: 12, 
                  backgroundColor: task.priority.includes('Critical') ? 'rgba(255,0,0,0.2)' : 'rgba(179,255,0,0.1)',
                  color: task.priority.includes('Critical') ? '#ff4d4d' : accentColor,
                  border: `1px solid ${task.priority.includes('Critical') ? '#ff4d4d' : accentColor}`
                }}>
                  {task.priority}
                </div>
              </div>
              <div style={{ marginBottom: 12, opacity: 0.9, lineHeight: 1.5 }}>{task.actionableAdvice}</div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>⏱️ Estimated time: {task.estimatedMinutes} mins</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrollReveal({ children, isLocked }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = React.useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setIsVisible(true);
      });
    }, { threshold: 0.1 });
    if (domRef.current) observer.observe(domRef.current);
    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        marginInline: 'auto',
        width: '100%',
        marginBottom: isLocked ? 20 : 40,
        position: 'relative',
        minHeight: isLocked ? '120px' : 'auto'
      }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        {/* The content that gets blurred */}
        <div style={{
          filter: isLocked ? 'blur(10px) grayscale(100%)' : 'none',
          pointerEvents: isLocked ? 'none' : 'auto',
          transition: 'filter 0.5s ease',
          opacity: isLocked ? 0.4 : 1
        }}>
          {children}
        </div>

        {/* The Lock Overlay - Outside the blur filter */}
        {isLocked && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 50,
            pointerEvents: 'none'
          }}>
            <div style={{ 
              backgroundColor: 'rgba(0,0,0,0.85)', 
              color: '#B3FF00',
              padding: '15px 30px', 
              borderRadius: 30, 
              boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(179, 255, 0, 0.2)',
              fontWeight: 700,
              fontSize: 20,
              border: '1px solid rgba(179, 255, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              pointerEvents: 'none',
              transform: 'translateY(-10px)'
            }}>
              <span style={{ fontSize: 24 }}>🔒</span> Step 1 Completion Required
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [syllabusText, setSyllabusText] = useState('');
  const [pastPapersText, setPastPapersText] = useState('');
  const [syllabusImage, setSyllabusImage] = useState(null);
  const [notesImage, setNotesImage] = useState(null);
  const [syllabusImageLoading, setSyllabusImageLoading] = useState(false);
  const [notesImageLoading, setNotesImageLoading] = useState(false);
  const [syllabusImageError, setSyllabusImageError] = useState('');
  const [notesImageError, setNotesImageError] = useState('');
  const [uploadId, setUploadId] = useState(null);
  const [rawNotes, setRawNotes] = useState('');
  const [workspaceId, setWorkspaceId] = useState('user_123');
  const [forceWhisper, setForceWhisper] = useState(false);
  const [syllabusAnalysis, setSyllabusAnalysis] = useState(null);
  const [examAnalysis, setExamAnalysis] = useState(null);
  const [requestType, setRequestType] = useState('flashcards');
  const [specificTopic, setSpecificTopic] = useState('');
  
  // Decoupled Loading States
  const [extractLoading, setExtractLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [survivalLoading, setSurvivalLoading] = useState(false);

  const [result, setResult] = useState('');
  const [resultSource, setResultSource] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generatedData, setGeneratedData] = useState(null);
  const [heatmapError, setHeatmapError] = useState('');
  const [heatmapResult, setHeatmapResult] = useState(null);
  const [hoursRemaining, setHoursRemaining] = useState('6');
  const [survivalError, setSurvivalError] = useState('');
  const [survivalPlan, setSurvivalPlan] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [flashcards, setFlashcards] = useState([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const { currentUser, loadingAuth, signInWithGoogle, signOutUser } = useAuth();

  const apiBase = import.meta.env.VITE_API_URL ?? '';

  const fetchMoreFlashcards = React.useCallback(async () => {
    if (isFetchingMore || !uploadId || !rawNotes || !currentUser) return;
    setIsFetchingMore(true);
    try {
      const excludeTopics = flashcards.map(f => f.front);
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          requestType: 'flashcards',
          rawNotes,
          syllabusAnalysis,
          examAnalysis,
          workspaceId: workspaceId.trim(),
          userId: currentUser.uid,
          excludeTopics
        }),
      });
      const data = await parseResponse(res);
      if (data.ok && data.data && data.data.flashcards) {
        setFlashcards(prev => [...prev, ...data.data.flashcards]);
        // Onboard for analytics
        try {
          await fetch(`${apiBase}/api/analytics/onboard-flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: workspaceId.trim(),
              flashcards: data.data.flashcards
            }),
          });
        } catch (onboardErr) {
          console.warn("Failed to onboard additional flashcards", onboardErr);
        }
      }
    } catch (err) {
      console.error("Failed to fetch more flashcards", err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, uploadId, rawNotes, currentUser, flashcards, apiBase, syllabusAnalysis, examAnalysis, workspaceId]);

  const heatmapStatusStyles = {
    Green: { backgroundColor: '#d6f5d6', color: '#1f7a1f' },
    Yellow: { backgroundColor: '#fff3bf', color: '#8a6d00' },
    Red: { backgroundColor: '#ffe3e3', color: '#a61e1e' },
  };
  const accentColor = '#B3FF00';
  const translucentPanelStyle = {
    marginBottom: 36,
    padding: '30px 28px 26px',
    border: '1px solid rgba(179, 255, 0, 0.75)',
    borderRadius: 50,
    backgroundColor: 'rgba(34, 34, 34, 0.84)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 0 1px rgba(179, 255, 0, 0.34), 0 0 22px rgba(179, 255, 0, 0.16), 0 18px 40px rgba(0, 0, 0, 0.22)',
  };
  const glassyInputStyle = {
    width: '100%',
    minHeight: 56,
    padding: '16px 18px',
    boxSizing: 'border-box',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    background: 'rgba(71, 71, 71, 0.72)',
    color: '#F5F5F5',
    backdropFilter: 'blur(10px)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 24px rgba(0, 0, 0, 0.18)',
  };
  const glassyTextAreaStyle = {
    ...glassyInputStyle,
    minHeight: 148,
    resize: 'vertical',
  };
  const glassySelectStyle = {
    ...glassyInputStyle,
    width: 'auto',
    minWidth: 180,
    padding: '12px 16px',
  };
  const getActionButtonStyle = (disabled = false) => ({
    padding: '14px 22px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    backgroundColor: accentColor,
    color: '#000000',
    border: 'none',
    borderRadius: 18,
    opacity: disabled ? 0.45 : 1,
    boxShadow: disabled ? 'none' : '0 10px 24px rgba(179, 255, 0, 0.22)',
  });
  const uploadPickerButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    padding: '0 20px',
    backgroundColor: accentColor,
    color: '#000000',
    borderRadius: 18,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 24px rgba(179, 255, 0, 0.22)',
  };
  const fileCarouselStyle = {
    display: 'flex',
    gap: 14,
    overflowX: 'auto',
    paddingBottom: 8,
    WebkitOverflowScrolling: 'touch',
    scrollSnapType: 'x proximity',
  };
  const fileCardStyle = {
    minWidth: 220,
    maxWidth: 220,
    minHeight: 190,
    padding: '18px 18px 16px',
    borderRadius: 22,
    border: '1px solid rgba(179, 255, 0, 0.45)',
    background: 'rgba(71, 71, 71, 0.78)',
    color: '#F5F5F5',
    boxSizing: 'border-box',
    scrollSnapAlign: 'start',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 12px 26px rgba(0, 0, 0, 0.2)',
  };

  function getFileTypeMeta(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (extension === 'pdf') {
      return { label: 'PDF', color: '#FF4D4D', accent: 'rgba(255, 77, 77, 0.24)' };
    }

    if (extension === 'docx' || extension === 'doc') {
      return { label: 'WORD', color: '#2F80ED', accent: 'rgba(47, 128, 237, 0.24)' };
    }

    if (extension === 'pptx' || extension === 'ppt') {
      return { label: 'PPT', color: '#FF7A1A', accent: 'rgba(255, 122, 26, 0.24)' };
    }

    return { label: extension.toUpperCase() || 'DOC', color: accentColor, accent: 'rgba(179, 255, 0, 0.2)' };
  }

  useEffect(() => {
    if (currentUser?.uid) {
      setWorkspaceId(currentUser.uid);
    }
  }, [currentUser]);

  // Reset downstream state when Step 1 inputs change to "lock" Step 2 & 3
  useEffect(() => {
    setUploadId(null);
    setRawNotes('');
    setSyllabusAnalysis(null);
    setExamAnalysis(null);
    setGeneratedData(null);
    setFlashcards([]);
    setResult('');
    setResultSource('');
    setNotice('');
  }, [youtubeUrl, files]);

  async function parseResponse(res) {
    const raw = await res.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (parseErr) {
      throw new Error(`Non-JSON response from server: ${raw.slice(0, 1000)}`);
    }

    if (!res.ok) throw new Error(data?.error || 'Request failed');
    return data;
  }

  async function handleExtract(e) {
    e.preventDefault();
    if (!youtubeUrl && files.length === 0) {
      setError('Please provide a YouTube URL or upload a file.');
      return;
    }
    if (!currentUser?.uid) {
      setError('Please sign in to continue.');
      return;
    }
    if (!workspaceId.trim()) {
      setError('Please provide a workspaceId.');
      return;
    }

    setExtractLoading(true);
    setError('');
    setNotice('');
    setResult('');
    try {
      const formData = new FormData();
      if (youtubeUrl) {
        formData.append('youtubeUrl', youtubeUrl);
      }
      if (files.length > 0) {
        files.forEach((selectedFile) => {
          formData.append('file', selectedFile);
        });
      }
      formData.append('workspaceId', workspaceId.trim());
      formData.append('userId', currentUser.uid);
      formData.append('forceWhisper', forceWhisper ? 'true' : 'false');

      const res = await fetch(`${apiBase}/api/extract`, {
        method: 'POST',
        body: formData,
      });

      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      
      setUploadId(data.uploadId);
      setRawNotes(data.rawText);
      setResult(data.rawText);
      setResultSource('extracted');
      setGeneratedData(null);
      setNotice(data.warning || '');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setExtractLoading(false);
    }
  }


  async function handleAnalyze(e) {
    e.preventDefault();
    if (!currentUser?.uid) {
      setError('Please sign in to continue.');
      return;
    }
    if (!rawNotes.trim()) {
      setError('Please extract notes first.');
      return;
    }

    if (!syllabusText.trim()) {
      setError('Please provide syllabus text.');
      return;
    }

    setAnalyzeLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes,
          syllabusText,
          pastPapersText: pastPapersText.trim() || null,
        }),
      });

      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      
      setSyllabusAnalysis(data.syllabusAnalysis);
      setExamAnalysis(data.examAnalysis);
      setResult(JSON.stringify(data, null, 2));
      setResultSource('analyzed');
      setGeneratedData(null);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function handleOcrImage(target) {
    const fileToUse = target === 'syllabus' ? syllabusImage : notesImage;
    if (!fileToUse) {
      if (target === 'syllabus') {
        setSyllabusImageError('Please select a syllabus image.');
      } else {
        setNotesImageError('Please select a past papers image.');
      }
      return;
    }

    if (target === 'syllabus') {
      setSyllabusImageLoading(true);
      setSyllabusImageError('');
    } else {
      setNotesImageLoading(true);
      setNotesImageError('');
    }

    try {
      const formData = new FormData();
      formData.append('image', fileToUse);

      const res = await fetch(`${apiBase}/api/ocr/image`, {
        method: 'POST',
        body: formData,
      });
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);

      if (target === 'syllabus') {
        setSyllabusText((prev) => {
          const trimmed = (data.text || '').trim();
          if (!trimmed) return prev;
          return prev ? `${prev}\n\n${trimmed}` : trimmed;
        });
      } else {
        setPastPapersText((prev) => {
          const trimmed = (data.text || '').trim();
          if (!trimmed) return prev;
          return prev ? `${prev}\n\n${trimmed}` : trimmed;
        });
      }
    } catch (err) {
      if (target === 'syllabus') {
        setSyllabusImageError(err.message || String(err));
      } else {
        setNotesImageError(err.message || String(err));
      }
    } finally {
      if (target === 'syllabus') {
        setSyllabusImageLoading(false);
      } else {
        setNotesImageLoading(false);
      }
    }
  }

  async function handleGenerateOutput(e) {
    e.preventDefault();
    if (!currentUser?.uid) {
      setError('Please sign in to continue.');
      return;
    }
    if (!uploadId) {
      setError('Please extract content first to get an uploadId.');
      return;
    }

    if (!rawNotes.trim()) {
      setError('Please provide raw notes for generation.');
      return;
    }

    setGenerateLoading(true);
    setError('');
    setResult('');
    try {
      const res = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          requestType,
          rawNotes,
          syllabusAnalysis,
          examAnalysis,
          specificTopic: specificTopic.trim() ? specificTopic.trim() : null,
          workspaceId: workspaceId.trim(),
          userId: currentUser.uid,
        }),
      });

      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      
      setResult(JSON.stringify(data.data, null, 2));
      setResultSource(`generated (from ${data.source})`);
      setGeneratedData(data.data);

      if (requestType === 'flashcards' && data.data.flashcards) {
        setFlashcards(data.data.flashcards);
        // Onboard for analytics
        try {
          await fetch(`${apiBase}/api/analytics/onboard-flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: workspaceId.trim(),
              flashcards: data.data.flashcards
            }),
          });
        } catch (onboardErr) {
          console.warn("Failed to onboard flashcards for analytics", onboardErr);
        }
      } else {
        setFlashcards([]);
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setGenerateLoading(false);
    }
  }

  async function handleFetchHeatmap(e) {
    e.preventDefault();
    if (!currentUser?.uid) {
      setHeatmapError('Please sign in to continue.');
      return;
    }
    if (!workspaceId.trim()) {
      setHeatmapError('Please provide a workspaceId.');
      return;
    }

    setHeatmapLoading(true);
    setHeatmapError('');
    setHeatmapResult(null);

    try {
      const res = await fetch(
        `${apiBase}/api/analytics/heatmap/${encodeURIComponent(workspaceId.trim())}`
      );
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setHeatmapResult(data.data);
    } catch (err) {
      setHeatmapError(err.message || String(err));
    } finally {
      setHeatmapLoading(false);
    }
  }

  async function handleSurvivalPlan(e) {
    e.preventDefault();
    if (!currentUser?.uid) {
      setSurvivalError('Please sign in to continue.');
      return;
    }
    const trimmedWorkspaceId = workspaceId.trim();
    const hoursValue = Number(hoursRemaining);

    if (!trimmedWorkspaceId) {
      setSurvivalError('Please provide a workspaceId.');
      return;
    }

    if (!hoursRemaining.trim() || Number.isNaN(hoursValue)) {
      setSurvivalError('Please provide a valid hoursRemaining value.');
      return;
    }

    setSurvivalLoading(true);
    setSurvivalError('');
    setSurvivalPlan(null);

    try {
      const res = await fetch(`${apiBase}/api/survival/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: trimmedWorkspaceId,
          hoursRemaining: hoursValue,
        }),
      });
      const data = await parseResponse(res);
      if (!data.ok) throw new Error(data.error);
      setSurvivalPlan(data.data);
    } catch (err) {
      setSurvivalError(err.message || String(err));
    } finally {
      setSurvivalLoading(false);
    }
  }


  if (loadingAuth) {
    return (
      <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <h1>K.A.I. — Study Assistant</h1>
        <p>Checking session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ padding: 24, fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <h1 style={{ color: '#B3FF00' }}>K.A.I. Emergency Triage</h1>
        <p style={{ color: '#E8E8E8' }}>Sign in with Google to start your survival plan.</p>
        <button
          onClick={signInWithGoogle}
          style={{ padding: '10px 16px', cursor: 'pointer', fontWeight: 600, backgroundColor: '#B3FF00', color: '#000', border: 'none', borderRadius: 4 }}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'transparent' }}>
      <StarsBackground />
      {/* Header */}
      <div className="app-header">
        <div style={{ 
          fontSize: 24, 
          cursor: 'pointer',
          width: 48,
          height: 48,
          backgroundColor: '#444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 'auto',
          color: '#B3FF00',
          fontWeight: 800
        }}>K</div>
        {/* <div className="app-header-user">
          <span>{currentUser.email || currentUser.uid}</span>
          <button onClick={signOutUser}>Sign out</button>
        </div> */}
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab-button ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => setActiveTab(0)}
        >
          Build
        </button>
        <button
          className={`tab-button ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => setActiveTab(1)}
        >
          Study Lab
        </button>
        <button
          className={`tab-button ${activeTab === 2 ? 'active' : ''}`}
          onClick={() => setActiveTab(2)}
        >
          Survival Mode
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content" style={{ flex: 1 }}>
        {/* Tab 0: Build */}
        {activeTab === 0 && (
          <div>
      
      {/* Step 1: Extract */}
      <div className="step-one-shell" style={{ marginTop: 50 }}>
        <RandomMovingBox>
          <video 
            src={chatbotVideo} 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ 
              width: '280px', 
              height: '280px',
              filter: 'drop-shadow(0 0 30px rgba(179, 255, 0, 0.4))'
            }} 
          />
        </RandomMovingBox>
        <section style={{ ...translucentPanelStyle, minHeight: 280, paddingTop: 55, paddingBottom: 15 }}>
          <h2 style={{ textAlign: 'center', marginBottom: 24, marginTop: 0 }}>Step 1: Extract Content</h2>
          <form onSubmit={handleExtract}>
          <div
            style={{
              marginBottom: 18,
              maxWidth: 980,
              marginInline: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 640px', minWidth: 320 }}>
              <input
                type="text"
                placeholder="YouTube URL (or leave blank for file upload)"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                style={glassyInputStyle}
              />
            </div>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                minHeight: 56,
                padding: '0 18px',
                borderRadius: 18,
                background: 'rgba(71, 71, 71, 0.72)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#E8E8E8',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <input
                type="checkbox"
                checked={forceWhisper}
                onChange={(e) => setForceWhisper(e.target.checked)}
              />
              Force Groq Whisper
            </label>
          </div>
          <div style={{ marginBottom: 22, width: '100%', textAlign: 'center' }}>
            <input
              id="study-material-upload"
              type="file"
              accept=".pdf,.docx,.pptx"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
              <label htmlFor="study-material-upload" style={uploadPickerButtonStyle}>
                Choose Files
              </label>
              <span style={{ color: '#D6D6D6', fontWeight: 600 }}>
                {files.length > 0 ? `${files.length} file${files.length === 1 ? '' : 's'} ready` : 'Upload PDF, DOCX, or PPTX'}
              </span>
            </div>
            {files.length > 0 && (
              <div className="file-carousel" style={fileCarouselStyle}>
                {files.map((selectedFile, index) => (
                  <div key={`${selectedFile.name}-${index}`} style={fileCardStyle}>
                    {(() => {
                      const fileType = getFileTypeMeta(selectedFile.name);
                      return (
                        <>
                          <div
                            style={{
                              width: 86,
                              height: 86,
                              marginInline: 'auto',
                              borderRadius: 24,
                              background: `linear-gradient(135deg, ${fileType.color} 0%, ${fileType.color} 62%, ${fileType.accent} 62%, ${fileType.accent} 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: fileType.label.length > 3 ? 18 : 24,
                              letterSpacing: 0.6,
                              boxShadow: `0 10px 24px ${fileType.accent}`,
                            }}
                          >
                            {fileType.label}
                          </div>
                          <div style={{ color: accentColor, fontWeight: 700, fontSize: 13, textAlign: 'center', marginTop: 14 }}>
                            Document {index + 1}
                          </div>
                        </>
                      );
                    })()}
                    <div
                      style={{
                        fontWeight: 600,
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textAlign: 'center',
                      }}
                    >
                      {selectedFile.name}
                    </div>
                    <div style={{ color: '#BDBDBD', fontSize: 12, textAlign: 'center' }}>
                      {Math.max(1, Math.round(selectedFile.size / 1024))} KB
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button type="submit" disabled={extractLoading || (!youtubeUrl && files.length === 0)} style={getActionButtonStyle(extractLoading || (!youtubeUrl && files.length === 0))}>
              {extractLoading ? 'Extracting…' : 'Extract Content'}
            </button>
            <LoadingProgressBar loading={extractLoading} label="Extracting Content" />
            {uploadId && <p style={{ color: 'green', marginTop: 8, textAlign: 'center' }}>✅ Extracted! Upload ID: {uploadId.slice(0, 8)}...</p>}
          </div>
          </form>
        </section>
      </div>

      {/* Step 2: Analyze */}
      <ScrollReveal isLocked={!uploadId}>
        <section style={translucentPanelStyle}>
          <h2>Step 2: Analyze (Optional)</h2>
          <form onSubmit={handleAnalyze}>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 10 }}>Syllabus Image (optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input
                    id="syllabus-image-upload"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={(e) => setSyllabusImage(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="syllabus-image-upload" style={uploadPickerButtonStyle}>
                    {syllabusImage ? '✅ Selected' : 'Choose Image'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOcrImage('syllabus')}
                    disabled={syllabusImageLoading || !syllabusImage}
                    style={getActionButtonStyle(syllabusImageLoading || !syllabusImage)}
                  >
                    {syllabusImageLoading ? 'Extracting…' : 'Extract from image'}
                  </button>
                  {syllabusImage && <span style={{ fontSize: 12, opacity: 0.7, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{syllabusImage.name}</span>}
                </div>
                <LoadingProgressBar loading={syllabusImageLoading} label="OCR Syllabus" />
                {syllabusImageError && (
                  <div style={{ color: 'crimson', marginTop: 8 }}>{syllabusImageError}</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 10 }}>Past Papers Image (optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <input
                    id="notes-image-upload"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={(e) => setNotesImage(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="notes-image-upload" style={uploadPickerButtonStyle}>
                    {notesImage ? '✅ Selected' : 'Choose Image'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOcrImage('notes')}
                    disabled={notesImageLoading || !notesImage}
                    style={getActionButtonStyle(notesImageLoading || !notesImage)}
                  >
                    {notesImageLoading ? 'Extracting…' : 'Extract from image'}
                  </button>
                  {notesImage && <span style={{ fontSize: 12, opacity: 0.7, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notesImage.name}</span>}
                </div>
                <LoadingProgressBar loading={notesImageLoading} label="OCR Past Papers" />
                {notesImageError && (
                  <div style={{ color: 'crimson', marginTop: 8 }}>{notesImageError}</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18, flexWrap: 'wrap' }}>
              <textarea
                placeholder="Paste syllabus text here (required)"
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                rows={4}
                style={{ ...glassyTextAreaStyle, flex: 1 }}
              />
              <textarea
                placeholder="Paste past exam papers (optional)"
                value={pastPapersText}
                onChange={(e) => setPastPapersText(e.target.value)}
                rows={4}
                style={{ ...glassyTextAreaStyle, flex: 1 }}
              />
            </div>
            <button type="submit" disabled={analyzeLoading || !rawNotes.trim() || !syllabusText.trim()} style={getActionButtonStyle(analyzeLoading || !rawNotes.trim() || !syllabusText.trim())}>
              {analyzeLoading ? 'Analyzing…' : 'Analyze Content'}
            </button>
            <LoadingProgressBar loading={analyzeLoading} label="Analyzing Context" />
            {syllabusAnalysis && <p style={{ color: 'green', marginTop: 8 }}>✅ Syllabus mapped!</p>}
            {examAnalysis && <p style={{ color: 'green', marginTop: 8 }}>✅ Exam patterns analyzed!</p>}
          </form>
        </section>
      </ScrollReveal>

      {/* Step 3: Generate */}
      <ScrollReveal isLocked={!uploadId}>
        <section style={translucentPanelStyle}>
          <h2>Step 3: Generate Output</h2>
          <form onSubmit={handleGenerateOutput}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <label>
                Output Type:{' '}
                <select value={requestType} onChange={(e) => setRequestType(e.target.value)} style={glassySelectStyle}>
                  <option value="flashcards">Flashcards</option>
                  <option value="study_plan">Study Plan</option>
                  <option value="summary">Summary</option>
                  <option value="mock_test">Mock Test</option>
                  <option value="eli5">ELI5</option>
                </select>
              </label>
              <input
                type="text"
                placeholder="Specific topic for ELI5 (optional)"
                value={specificTopic}
                onChange={(e) => setSpecificTopic(e.target.value)}
                style={{ ...glassyInputStyle, flex: 1 }}
              />
            </div>
            <button type="submit" disabled={generateLoading || !uploadId} style={getActionButtonStyle(generateLoading || !uploadId)}>
              {generateLoading ? 'Generating…' : 'Generate Output'}
            </button>
            <LoadingProgressBar loading={generateLoading} label={`Generating ${requestType.replace('_', ' ')}`} />
          </form>
        </section>
      </ScrollReveal>

      {/* Results */}
      {notice && (
        <div
          style={{
            color: '#000000',
            marginBottom: 24,
            padding: '16px 24px',
            backgroundColor: '#B3FF00',
            borderRadius: 20,
            fontWeight: 700,
            boxShadow: '0 10px 25px rgba(179, 255, 0, 0.2)',
          }}
        >
          {notice}
        </div>
      )}

      {error && (
        <div style={{ 
          color: '#ff4d4d', 
          marginBottom: 24, 
          padding: '16px 24px', 
          backgroundColor: 'rgba(255, 77, 77, 0.1)', 
          border: '1px solid #ff4d4d',
          borderRadius: 20,
          fontWeight: 600
        }}>
          Error: {error}
        </div>
      )}

      {generatedData && (
        <section className="fade-in" style={{ marginBottom: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <h2 style={{ margin: 0 }}>Visual Learning Lab</h2>
          </div>

          {requestType === 'flashcards' && flashcards.length > 0 && (
            <FlashcardSwiper 
              cards={flashcards} 
              onReachEndThreshold={fetchMoreFlashcards} 
            />
          )}

          {requestType === 'summary' && generatedData.keyTakeaways && (
            <SummaryComponent data={generatedData} />
          )}

          {requestType === 'eli5' && generatedData.simpleExplanation && (
            <ELI5Component data={generatedData} />
          )}

          {requestType === 'mock_test' && Array.isArray(generatedData.questions) && (
            <MockTestComponent testData={generatedData} workspaceId={workspaceId} apiBase={apiBase} />
          )}

          {requestType === 'study_plan' && generatedData.tasks && (
            <StudyPlanComponent planData={generatedData} />
          )}
        </section>
      )}

      {/* Analytics */}
      <section style={translucentPanelStyle}>
        <h2 style={{ color: accentColor }}>Performance Heatmap</h2>
        <form onSubmit={handleFetchHeatmap}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="Workspace ID"
              style={{ ...glassyInputStyle, flex: 1 }}
            />
            <button
              type="submit"
              disabled={heatmapLoading || !workspaceId.trim()}
              style={getActionButtonStyle(heatmapLoading || !workspaceId.trim())}
            >
              {heatmapLoading ? 'Fetching…' : 'Fetch Heatmap'}
            </button>
          </div>
          <LoadingProgressBar loading={heatmapLoading} label="Compiling Analytics" />
        </form>

        {heatmapError && (
          <div
            style={{
              color: '#ff4d4d',
              marginBottom: 12,
              padding: 16,
              backgroundColor: 'rgba(255, 77, 77, 0.1)',
              borderRadius: 20,
              border: '1px solid #ff4d4d',
              fontWeight: 600
            }}
          >
            Error: {heatmapError}
          </div>
        )}

        {heatmapResult && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
               <div style={{ padding: 24, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 30, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: accentColor, fontSize: 13, textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Memory Retention</div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>{heatmapResult.overview.memoryRetentionRate}%</div>
               </div>
               <div style={{ padding: 24, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 30, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: accentColor, fontSize: 13, textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 }}>Mastered Facts</div>
                  <div style={{ fontSize: 36, fontWeight: 800 }}>{heatmapResult.overview.totalCards} total</div>
               </div>
            </div>

            <div style={{ padding: 24, backgroundColor: 'rgba(179, 255, 0, 0.08)', borderRadius: 30, border: `1px solid ${accentColor}`, marginBottom: 30 }}>
               <div style={{ fontWeight: 800, color: accentColor, marginBottom: 10 }}>AI Action Plan</div>
               <div style={{ lineHeight: 1.6 }}>{heatmapResult.overview.aiActionPlan}</div>
            </div>

            {Array.isArray(heatmapResult.heatmap) && heatmapResult.heatmap.length > 0 ? (
              <div style={{ overflowX: 'auto', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(34,34,34,0.6)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                      <th style={{ textAlign: 'left', padding: '16px 20px', color: accentColor, fontSize: 12, textTransform: 'uppercase' }}>Topic</th>
                      <th style={{ textAlign: 'left', padding: '16px 20px', color: accentColor, fontSize: 12, textTransform: 'uppercase' }}>Score</th>
                      <th style={{ textAlign: 'left', padding: '16px 20px', color: accentColor, fontSize: 12, textTransform: 'uppercase' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '16px 20px', color: accentColor, fontSize: 12, textTransform: 'uppercase' }}>Weak Concepts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapResult.heatmap.map((row, idx) => {
                      const rowStatusStyle = heatmapStatusStyles[row.status] || {
                        backgroundColor: '#f0f0f0',
                        color: '#333',
                      };
                      return (
                        <tr key={`${row.topic}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 600 }}>{row.topic}</td>
                          <td style={{ padding: '16px 20px' }}>{row.avgScore}%</td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{ 
                                padding: '6px 12px', 
                                borderRadius: 12, 
                                fontSize: 11, 
                                fontWeight: 800, 
                                ...rowStatusStyle,
                                textTransform: 'uppercase'
                            }}>
                              {row.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', fontSize: 13, opacity: 0.7 }}>{row.missed || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
                No detailed topic data yet. Solve a test to see your heatmap.
              </div>
            )}
          </div>
        )}
      </section>
          </div>
        )}

        {/* Tab 1: Study Lab */}
        {activeTab === 1 && (
          <div>
            <SocraticTutorTest
              apiBase={import.meta.env.VITE_API_URL ?? ''}
              workspaceId={workspaceId}
              onWorkspaceIdChange={setWorkspaceId}
            />
          </div>
        )}

        {/* Tab 2: Survival Mode */}
        {activeTab === 2 && (
          <div>
            <section style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 4 }}>
              <h2>🚨 Survival Mode (Agent 11)</h2>
              <form onSubmit={handleSurvivalPlan}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={hoursRemaining}
                    onChange={(e) => setHoursRemaining(e.target.value)}
                    placeholder="Hours Remaining"
                    style={{ width: 160, padding: 8 }}
                  />
                  <button
                    type="submit"
                    disabled={survivalLoading}
                    style={{ padding: '10px 16px', cursor: 'pointer' }}
                  >
                    {survivalLoading ? '⏳ Planning…' : '🚨 Generate Plan'}
                  </button>
                </div>
              </form>

              {survivalError && (
                <div
                  style={{
                    color: 'crimson',
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: '#ffe6e6',
                    borderRadius: 4,
                  }}
                >
                  ❌ {survivalError}
                </div>
              )}

              {survivalPlan && (
                <div style={{ backgroundColor: '#f7f7f7', padding: 12, borderRadius: 4 }}>
                  <h3 style={{ marginTop: 0 }}>Mission Briefing</h3>
                  <p style={{ marginTop: 0 }}>{survivalPlan.missionBriefing}</p>

                  <h3>Survival Plan</h3>
                  {Array.isArray(survivalPlan.survivalPlan) && survivalPlan.survivalPlan.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Phase</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Action</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Concept</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Trigger</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Instruction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {survivalPlan.survivalPlan.map((row, idx) => (
                            <tr key={`${row.phase}-${idx}`}>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.phase}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.action}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.concept}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.triggerAgent}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{row.instruction}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ margin: 0 }}>No plan items returned.</p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
