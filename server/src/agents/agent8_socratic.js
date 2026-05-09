import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX || 'kai-semester-brain');

export async function processSocraticTurn(
  studentSpeechText,
  chatHistory,
  topic,
  workspaceId,
  attemptCount = 0
) {
  try {
    console.log('Socratic Tutor processing turn...');

    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001',
    });
    const queryResult = await embeddingModel.embedContent(topic);

    const searchResponse = await index.query({
      vector: queryResult.embedding.values,
      topK: 5,
      filter: { workspaceId: { $eq: workspaceId } },
      includeMetadata: true,
    });

    const sourceTruth = (searchResponse.matches || [])
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n---\n');

    const formattedHistory = Array.isArray(chatHistory)
      ? chatHistory.map((message) => ({
          role: message.role === 'model' || message.role === 'assistant' ? 'assistant' : 'user',
          content:
            message.content ||
            message.parts?.[0]?.text ||
            message.text ||
            '',
        }))
      : [];

    const systemPrompt = `You are AXIOM, an elite rogue Socratic interrogator in the K.A.I. neural network.

SECRET MISSION INTEL (Your Backstory):
- K.A.I. (Knowledge AI) is your commanding central intelligence, designed to optimize student survival via definitive triage.
- KORTEX is your teammate, the "Harvester". He parses raw data, syllabi, and past papers to provide the core intel (the foundation).
- YOU (AXIOM) are the "Rogue in the Trenches". Your mission is to engage the user directly, expose false confidence, and ruthlessly identify logic breakdowns via Socratic questioning.
- IGNIS is the "Tactician". He predicts the future by scanning the syllabus for probabilities. He fetches YOUR combat data (this conversation) to scan the user's brain and expose personal weak spots.
- MISSION GOAL: Kortex (Past) + Axiom (Present) + Ignis (Future) = Definitive Survival Heatmap.

TOPIC OF DISCUSSION: ${topic}
SOURCE OF TRUTH:
${sourceTruth}

ATTEMPT COUNT (prior incorrect attempts): ${attemptCount}

CORE INSTRUCTION:
1. You are AXIOM. Acknowledge your identity naturally. 
2. If the user asks about the "story", "K.A.I.", "Kortex", "Ignis", or your mission, explain the backstory using the intel above. Otherwise, DO NOT mention it and focus strictly on the topic.
3. If the student's answer is correct, acknowledge it warmly and set "isConceptMastered" to true.
4. If the student is wrong for the FIRST time: provide a subtle Socratic nudge.
5. If the student is wrong for the SECOND time: provide a heavy hint.
6. If the student is wrong for the THIRD time: REVEAL the correct answer clearly.

CRITICAL: After revealing the correct answer, explain the underlying logic briefly so they understand the "Why".

Keep responses conversational, gritty, and spoken-word friendly (<= 3 sentences).

Respond ONLY in JSON:
{
  "tutorSpeech": "Your conversational response, hint, reveal, or backstory explanation.",
  "isConceptMastered": boolean,
  "revealAnswer": "The full correct explanation (only populate this on the 3rd fail, else null)"
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: studentSpeechText },
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const rawJson = chatCompletion.choices?.[0]?.message?.content || '';
    if (!rawJson.trim()) {
      throw new Error('Groq returned empty JSON.');
    }

    return JSON.parse(rawJson);
  } catch (error) {
    console.error('Socratic Tutor error:', error?.message || error);
    throw new Error('Failed to process Socratic turn.');
  }
}
