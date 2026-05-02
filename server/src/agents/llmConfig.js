import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

dotenv.config();

export const llm = new ChatGoogleGenerativeAI({
  // Use `model` for the google-genai client (modelName can be undefined in newer versions).
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  maxOutputTokens: 8192,
  temperature: 0.2,
  apiKey: process.env.GOOGLE_API_KEY,
});

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY in environment. Set it in Render env vars.');
}