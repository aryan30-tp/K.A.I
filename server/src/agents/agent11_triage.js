import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore } from 'firebase-admin/firestore';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const db = getFirestore();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX || 'kai-semester-brain');

export async function generateSurvivalPlan(workspaceId, hoursRemaining) {
  try {
    console.log(
      `DEFCON 1 triage for workspace: ${workspaceId}. Time remaining: ${hoursRemaining} hours.`
    );

    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    });
    const queryResult = await embeddingModel.embedContent(
      'Core concepts, syllabus overview, main chapters, and primary formulas.'
    );

    const searchResponse = await index.query({
      vector: queryResult.embedding.values,
      topK: 15,
      filter: { workspaceId: { $eq: workspaceId } },
      includeMetadata: true,
    });

    let sourceSyllabus = (searchResponse.matches || [])
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n---\n');

    if (!sourceSyllabus.trim()) {
      const sessionsSnap = await db
        .collection('study_sessions')
        .where('workspaceId', '==', workspaceId)
        .limit(5)
        .get();

      sourceSyllabus = sessionsSnap.docs
        .map((doc) => doc.data()?.rawText)
        .filter(Boolean)
        .join('\n---\n');
    }

    if (!sourceSyllabus.trim()) {
      throw new Error('No study material found. Upload your syllabus first.');
    }

    const chatModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'models/gemini-2.0-flash',
    });

    const prompt = `You are an emergency academic triage director. A university student has exactly ${hoursRemaining} hours until their final exam.
They know very little. If they study everything, they will fail.

You must identify the absolute highest-yield 20% of this syllabus that will generate 80% of their exam grade.
Ignore history, edge cases, and deep theory. Focus ONLY on core mechanics, heavy-weight formulas, and primary algorithms.

SYLLABUS DATA:
${sourceSyllabus}

Divide their remaining ${hoursRemaining} hours into a strict, minute-by-minute survival plan.
For each phase, assign an "action" and a "triggerAgent" (either "agent8_socratic" for voice drills, or "agent7_exam" for practice tests).

Respond STRICTLY in this JSON format, with no markdown formatting or extra text:
{
  "missionBriefing": "A brutal, 2-sentence reality check about what they must do to pass.",
  "survivalPlan": [
    {
      "phase": "Hour 1-2",
      "action": "Memorize Core Mechanic",
      "concept": "[Insert High Yield Concept]",
      "triggerAgent": "agent8_socratic",
      "instruction": "Do a voice drill on this specific mechanism."
    },
    {
      "phase": "Hour 3",
      "action": "Application Test",
      "concept": "[Insert High Yield Concept]",
      "triggerAgent": "agent7_exam",
      "instruction": "Take a 3-question short-answer exam to secure partial credit."
    }
  ]
}`;

    const response = await chatModel.generateContent(prompt);
    const rawText = response.response.text();
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Triage director error:', error?.message || error);
    throw new Error('Failed to generate survival plan.');
  }
}
