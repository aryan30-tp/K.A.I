import { getFirestore } from 'firebase-admin/firestore';
import Groq from 'groq-sdk';

const db = getFirestore();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateHeatmap(workspaceId, sessionId = null) {
  try {
    console.log(`Compiling Heatmap for workspace: ${workspaceId}${sessionId ? ` (Session: ${sessionId})` : ''}`);

    let cardsRef = db.collection('flashcards').where('workspaceId', '==', workspaceId);
    if (sessionId && sessionId.trim() !== '') {
      cardsRef = cardsRef.where('sessionId', '==', sessionId);
    }
    const cardsSnap = await cardsRef.get();

    let totalCards = 0;
    let strongCards = 0;
    let weakCards = 0;

    cardsSnap.forEach((doc) => {
      totalCards += 1;
      const data = doc.data();
      // Any card reviewed at least once (interval > 0) shows retention.
      // Mastered cards (long term) are interval > 5.
      if ((data.intervalDays || 0) > 0) strongCards += 1;
      else weakCards += 1;
    });

    let examsRef = db.collection('exam_results').where('workspaceId', '==', workspaceId);
    if (sessionId && sessionId.trim() !== '') {
      examsRef = examsRef.where('sessionId', '==', sessionId);
    }
    const examsSnap = await examsRef.get();

    const topicStats = {};

    examsSnap.forEach((doc) => {
      const data = doc.data();
      if (!data.topic) return;

      if (!topicStats[data.topic]) {
        topicStats[data.topic] = { totalScore: 0, attempts: 0, missingConcepts: new Set() };
      }

      topicStats[data.topic].totalScore += data.score || 0;
      topicStats[data.topic].attempts += 1;

      const missing = Array.isArray(data.missingConcepts) ? data.missingConcepts : [];
      missing.forEach((concept) => topicStats[data.topic].missingConcepts.add(concept));
    });

    let rawStatsText = `OVERALL MEMORY: ${strongCards} mastered facts, ${weakCards} weak facts out of ${totalCards} total.\n\nEXAM PERFORMANCE BY TOPIC:\n`;

    const formattedTopics = [];
    for (const [topic, stats] of Object.entries(topicStats)) {
      const avgScore = stats.attempts
        ? Math.round(stats.totalScore / stats.attempts)
        : 0;
      const missed = Array.from(stats.missingConcepts).join(', ');
      rawStatsText += `- ${topic}: Average Score ${avgScore}%. Weak concepts: ${missed}\n`;

      let status = 'Red';
      if (avgScore >= 85) status = 'Green';
      else if (avgScore >= 65) status = 'Yellow';

      formattedTopics.push({ topic, avgScore, status, missed });
    }

    let aiSummary = '';
    try {
      const prompt = `You are a data-driven academic advisor analyzing a student's performance metrics.

RAW STUDENT DATA:
${rawStatsText}

Write a brief, punchy, and highly analytical summary (max 3 sentences) telling the student exactly what their probability of passing is, and what one specific thing they need to study immediately to avoid failing. Do not be overly encouraging. Be clinical and direct.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'Be direct and concise.' },
          { role: 'user', content: prompt },
        ],
        model: process.env.GROQ_MODEL_TEXT || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.2,
      });

      aiSummary = completion.choices?.[0]?.message?.content?.trim() || '';
    } catch (aiError) {
      console.warn(
        'Heatmap summary fallback: Groq unavailable.',
        aiError?.message || aiError
      );
      aiSummary =
        'Model busy. Review the red topics first and retake the heatmap later for a full plan.';
    }

    return {
      overview: {
        totalCards,
        memoryRetentionRate: totalCards > 0 ? Math.round((strongCards / totalCards) * 100) : 0,
        aiActionPlan: aiSummary,
      },
      heatmap: formattedTopics,
    };
  } catch (error) {
    console.error('Heatmap generation error:', error?.message || error);
    throw new Error('Failed to compile analytics.');
  }
}
