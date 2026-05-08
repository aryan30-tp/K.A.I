import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX || 'kai-semester-brain');

export async function ingestDocumentToBrain(rawText, workspaceId, sourceName) {
  try {
    console.log(`Slicing and embedding document: ${sourceName}`);

    if (!rawText || !rawText.trim()) {
      console.warn('Skipping ingestion: empty document text.');
      return;
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments([rawText]);
    if (!chunks || chunks.length === 0) {
      console.warn('Skipping ingestion: splitter produced no chunks.');
      return;
    }
    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001',
    });

    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => {
        if (!chunk.pageContent || !chunk.pageContent.trim()) {
          return null;
        }
        const result = await embeddingModel.embedContent(chunk.pageContent);
        const embedding = result?.embedding?.values;
        if (!Array.isArray(embedding) || embedding.length === 0) {
          return null;
        }

        return {
          id: `${workspaceId}-${sourceName}-chunk-${i}`,
          values: embedding,
          metadata: {
            workspaceId,
            sessionId: sourceName, // Store session ID for isolation
            source: sourceName,
            text: chunk.pageContent,
          },
        };
      })
    );

    const filteredVectors = vectors.filter(Boolean);
    if (filteredVectors.length === 0) {
      console.warn('Skipping ingestion: no vectors produced.');
      return;
    }

    await index.upsert(filteredVectors);
    console.log(`Successfully injected ${filteredVectors.length} chunks into K.A.I. brain.`);
  } catch (error) {
    console.error('Brain ingestion error:', error?.message || error);
    throw new Error('Failed to memorize document.');
  }
}

export async function askKAI(studentQuestion, workspaceId) {
  try {
    console.log(`Searching K.A.I. brain for: "${studentQuestion}"`);

    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001',
    });
    const queryResult = await embeddingModel.embedContent(studentQuestion);
    const queryVector = queryResult.embedding.values;

    const searchResponse = await index.query({
      vector: queryVector,
      topK: 5,
      filter: { workspaceId: { $eq: workspaceId } },
      includeMetadata: true,
    });

    const contextText = (searchResponse.matches || [])
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join('\n\n---\n\n');

    const systemPrompt = `You are K.A.I., a brilliant, strict, but helpful AI tutor.
Answer the student's question using ONLY the provided course material below.
If the answer is not in the material, say "I cannot find this in your uploaded syllabus or lectures."`;

    const userPrompt = `COURSE MATERIAL:
${contextText}

STUDENT QUESTION:
${studentQuestion}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: process.env.GROQ_MODEL_TEXT || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.2,
    });

    return completion.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('Brain recall error:', error?.message || error);
    throw new Error('K.A.I. got a headache trying to recall that information.');
  }
}
