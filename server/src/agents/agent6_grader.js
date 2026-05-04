import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX || 'kai-semester-brain');

export async function gradeExamAnswer(question, studentAnswer, workspaceId) {
  try {
    const questionText =
      typeof question === 'string' ? question : question?.questionText || '';

    if (!questionText) {
      throw new Error('Question text is required for grading.');
    }

    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    });
    const queryResult = await embeddingModel.embedContent(questionText);

    const searchResponse = await index.query({
      vector: queryResult.embedding.values,
      topK: 5,
      filter: { workspaceId: { $eq: workspaceId } },
      includeMetadata: true,
    });

    const contextText = (searchResponse.matches || [])
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n\n---\n\n');

    const chatModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'models/gemini-2.5-flash',
    });

    const prompt = `You are K.A.I., a strict exam grader.
Grade the student's answer using ONLY the course material below.
Return STRICT JSON with no extra text.

COURSE MATERIAL:
${contextText}

QUESTION:
${questionText}

MODEL ANSWER:
${question?.correctAnswer || 'Not provided'}

STUDENT ANSWER:
${studentAnswer}

JSON FORMAT:
{
  "score": 0,
  "maxScore": 5,
  "verdict": "Correct | Partially Correct | Incorrect",
  "feedback": "...",
  "referenceAnswer": "..."
}`;

    const response = await chatModel.generateContent(prompt);
    const rawText = response.response.text();
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Exam grading error:', error?.message || error);
    throw new Error('Failed to grade exam answer.');
  }
}
