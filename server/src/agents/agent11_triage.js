import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore } from 'firebase-admin/firestore';
import Groq from 'groq-sdk';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const db = getFirestore();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX || 'kai-semester-brain');
const MAX_SYLLABUS_CHARS = 12000;

export async function generateSurvivalPlan(workspaceId, hoursRemaining, uploadId = null) {
  try {
    console.log(
      `DEFCON 1 triage for workspace: ${workspaceId}, session: ${uploadId}. Time remaining: ${hoursRemaining} hours.`
    );

    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001',
    });
    const queryResult = await embeddingModel.embedContent(
      'Core concepts, syllabus overview, main chapters, and primary formulas.'
    );

    // If uploadId is provided, filter specifically for that session in Pinecone
    const filter = { workspaceId: { $eq: workspaceId } };
    if (uploadId) {
      filter.sessionId = { $eq: uploadId };
    }

    const searchResponse = await index.query({
      vector: queryResult.embedding.values,
      topK: 8,
      filter: filter,
      includeMetadata: true,
    });

    let sourceSyllabus = (searchResponse.matches || [])
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n---\n');

    if (!sourceSyllabus.trim()) {
      // Fallback to Firestore specifically for this uploadId if available
      let query = db.collection('study_sessions').where('workspaceId', '==', workspaceId);
      if (uploadId) {
        // Check if we can find it by doc ID or field
        const docRef = db.collection('study_sessions').doc(uploadId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          sourceSyllabus = docSnap.data()?.rawText || '';
        }
      }
      
      if (!sourceSyllabus.trim()) {
        const sessionsSnap = await db
          .collection('study_sessions')
          .where('workspaceId', '==', workspaceId)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        sourceSyllabus = sessionsSnap.docs
          .map((doc) => doc.data()?.rawText)
          .filter(Boolean)
          .join('\n---\n');
      }
    }

    if (sourceSyllabus.length > MAX_SYLLABUS_CHARS) {
      sourceSyllabus = sourceSyllabus.slice(0, MAX_SYLLABUS_CHARS);
    }

    if (!sourceSyllabus.trim()) {
      throw new Error('No study material found. Upload your syllabus first.');
    }

    const prompt = `You are an emergency academic triage director. A student has ${hoursRemaining} hours until the exam.
Find the top 20% highest-yield concepts (core mechanics, key formulas, primary algorithms) and ignore everything else.

SYLLABUS DATA:
${sourceSyllabus}

  Divide the time into phases with an action, concept, triggerAgent (agent8_socratic or agent7_exam), and instruction.
  If a concept is high-visual (process, structure, cycle), include a 10-word diagram visualPrompt; otherwise set it to null.

Respond STRICTLY in JSON with this exact structure:
{
  "missionBriefing": "A brutal, 2-sentence reality check.",
  "survivalPlan": [
    {
      "phase": "Hour 1-2",
      "action": "Memorize Core Mechanic",
      "concept": "[Insert Concept]",
      "triggerAgent": "agent8_socratic",
      "instruction": "Do a voice drill on this specific mechanism.",
      "visualPrompt": null
    }
  ]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a JSON-only API. Output valid JSON for the given schema.',
        },
        { role: 'user', content: prompt },
      ],
      model: process.env.GROQ_MODEL || 'llama3-8b-8192',
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const rawJson = chatCompletion.choices?.[0]?.message?.content || '';
    if (!rawJson.trim()) {
      throw new Error('Groq returned empty JSON.');
    }

    return JSON.parse(rawJson);
  } catch (error) {
    console.error('Triage director error:', error?.message || error);
    throw new Error('Failed to generate survival plan.');
  }
}
