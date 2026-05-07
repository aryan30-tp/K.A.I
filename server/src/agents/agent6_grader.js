import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
      model: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001',
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
  "referenceAnswer": "...",
  "missingConcepts": ["..."]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You output valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const rawJson = completion.choices?.[0]?.message?.content || '';
    if (!rawJson.trim()) {
      throw new Error('Groq returned empty JSON.');
    }

    return JSON.parse(rawJson);
  } catch (error) {
    console.error('Exam grading error:', error?.message || error);
    throw new Error('Failed to grade exam answer.');
  }
}
