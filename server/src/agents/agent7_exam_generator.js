import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX || 'kai-semester-brain');

export async function generateMockExam(topic, workspaceId) {
  try {
    console.log(`Agent 7 generating exam for: ${topic}`);

    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    });
    const queryResult = await embeddingModel.embedContent(topic);

    const searchResponse = await index.query({
      vector: queryResult.embedding.values,
      topK: 8,
      filter: { workspaceId: { $eq: workspaceId } },
      includeMetadata: true,
    });

    if (!searchResponse.matches || searchResponse.matches.length === 0) {
      throw new Error('No study material found for this topic in your workspace.');
    }

    const sourceTruth = searchResponse.matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n---\n');

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a university professor creating a difficult mock exam.
Create a 3-question exam based ONLY on this source material:

${sourceTruth}

Include 2 Multiple Choice questions and 1 Short Answer question.

Respond STRICTLY in this JSON format, with no markdown formatting or extra text:
{
  "testTitle": "Mock Exam: ${topic}",
  "timeLimitMinutes": 15,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "questionType": "Multiple Choice",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "..."
    },
    {
      "questionNumber": 3,
      "questionText": "...",
      "questionType": "Short Answer",
      "correctAnswer": "...",
      "explanation": "..."
    }
  ]
}`;

    const response = await chatModel.generateContent(prompt);
    const rawText = response.response.text();

    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Exam generation error:', error?.message || error);
    throw new Error('Failed to generate exam.');
  }
}
