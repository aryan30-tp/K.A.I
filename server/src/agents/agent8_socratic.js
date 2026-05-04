import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('kai-semester-brain');

export async function processSocraticTurn(
  studentSpeechText,
  chatHistory,
  topic,
  workspaceId
) {
  try {
    console.log('Socratic Tutor processing turn...');

    const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
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

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = chatModel.startChat({
      history: chatHistory,
    });

    const prompt = `You are Professor K.A.I., conducting a real-time oral exam with a university student.

TOPIC OF DISCUSSION: ${topic}
SOURCE OF TRUTH (The facts you must test them on):
${sourceTruth}

THE STUDENT JUST SAID: "${studentSpeechText}"

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

    const response = await chat.sendMessage(prompt);
    const rawText = response.response.text();
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Socratic Tutor error:', error?.message || error);
    throw new Error('Failed to process Socratic turn.');
  }
}
