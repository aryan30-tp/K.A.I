import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX || 'kai-semester-brain');

export async function ingestDocumentToBrain(rawText, workspaceId, sourceName) {
  try {
    console.log(`Slicing and embedding document: ${sourceName}`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments([rawText]);
    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    });

    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => {
        const result = await embeddingModel.embedContent(chunk.pageContent);
        const embedding = result.embedding.values;

        return {
          id: `${workspaceId}-${sourceName}-chunk-${i}`,
          values: embedding,
          metadata: {
            workspaceId,
            source: sourceName,
            text: chunk.pageContent,
          },
        };
      })
    );

    await index.upsert(vectors);
    console.log(`Successfully injected ${vectors.length} chunks into K.A.I. brain.`);
  } catch (error) {
    console.error('Brain ingestion error:', error?.message || error);
    throw new Error('Failed to memorize document.');
  }
}

export async function askKAI(studentQuestion, workspaceId) {
  try {
    console.log(`Searching K.A.I. brain for: "${studentQuestion}"`);

    const embeddingModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
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

    const chatModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'models/gemini-2.5-flash',
    });
    const prompt = `You are K.A.I., a brilliant, strict, but helpful AI tutor.
Answer the student's question using ONLY the provided course material below.
If the answer is not in the material, say "I cannot find this in your uploaded syllabus or lectures."

COURSE MATERIAL:
${contextText}

STUDENT QUESTION:
${studentQuestion}`;

    const finalAnswer = await chatModel.generateContent(prompt);
    return finalAnswer.response.text();
  } catch (error) {
    console.error('Brain recall error:', error?.message || error);
    throw new Error('K.A.I. got a headache trying to recall that information.');
  }
}
