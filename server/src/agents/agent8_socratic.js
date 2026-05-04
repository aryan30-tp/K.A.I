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
  workspaceId
) {
  try {
    console.log('Socratic Tutor processing turn...');

    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
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

    const systemPrompt = `You are Professor K.A.I., conducting a real-time oral exam with a university student.

TOPIC OF DISCUSSION: ${topic}
SOURCE OF TRUTH (The facts you must test them on):
${sourceTruth}

YOUR INSTRUCTIONS:
1. Evaluate what the student just said against the Source of Truth.
2. If they are correct, confirm it and push them slightly deeper with a follow-up question.
3. If they are wrong or missing key details, DO NOT GIVE THEM THE ANSWER. Ask a leading, Socratic question to help them realize their mistake and find the answer themselves.
4. Keep your response conversational, spoken-word friendly, and under 3 sentences. (This will be read aloud by a text-to-speech engine).

Respond in JSON format:
{
  "tutorSpeech": "The exact words you want to say to the student.",
  "isConceptMastered": false
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: studentSpeechText },
      ],
      model: process.env.GROQ_MODEL || 'llama3-70b-8192',
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
