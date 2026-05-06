import { z } from 'zod';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- 1. DEFINE THE OUTPUT SCHEMA (The Zod Magic) ---
// This forces Gemini to respond EXACTLY in this JSON format. No fluff.
const syllabusMappingSchema = z.object({
  overallCoveragePercentage: z
    .number()
    .describe('Estimated percentage of the syllabus covered by the notes, from 0 to 100.'),
  mappedTopics: z
    .array(
      z.object({
        topicName: z.string().describe('The name of the topic as written in the syllabus.'),
        isCovered: z
          .boolean()
          .describe('True if the extracted notes adequately cover this topic, false if missing.'),
        weightage: z
          .enum(['High', 'Medium', 'Low'])
          .describe('Importance weightage based on how heavily the syllabus emphasizes it.'),
        coverageDetails: z
          .string()
          .describe('A 1-2 sentence breakdown of what specific subtopics are covered and what is missing.'),
      })
    )
    .describe('A complete list of all topics extracted from the syllabus and their analysis.'),
});

// --- 2. CREATE THE AI PROMPT ---
const systemPrompt = `You are an expert academic curriculum analyzer. Your job is to cross-reference a course syllabus with a student's extracted study materials (notes, transcripts, PDFs).

RULES:
1. Be objective. If a topic is in the syllabus but barely mentioned in the notes, mark it as NOT covered (isCovered: false).
2. Determine the weightage (High/Medium/Low) based on how the syllabus describes it (e.g., if a topic has many subtopics or spans multiple weeks, it is High).
3. If the input text is messy or low-quality, try to find the closest matching keywords from the syllabus. Never return empty arrays if there's any text provided.
4. Output ONLY the requested structured JSON data.`;

// --- 4. THE EXECUTOR FUNCTION ---
/**
 * Takes the raw syllabus text and the massive string of extracted notes,
 * and returns a structured JSON map of what is covered and what is missing.
 *
 * @param {string} syllabusText - The text of the syllabus
 * @param {string} extractedNotesText - The output from Agent 1
 * @returns {Promise<Object>} - The structured JSON map
 */
export async function mapSyllabusToNotes(syllabusText, extractedNotesText) {
  const fallbackResponse = {
    overallCoveragePercentage: 0,
    mappedTopics: []
  };

  try {
    console.log('Agent 2: Analyzing syllabus mapping...');

    // SANITY CHECK: If inputs are empty, don't waste the API call
    if (!syllabusText?.trim() || !extractedNotesText?.trim()) {
      return fallbackResponse;
    }

    const userPrompt = `SYLLABUS TEXT:
${syllabusText}

STUDENT EXTRACTED MATERIALS:
${extractedNotesText}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const rawJson = completion.choices?.[0]?.message?.content || '';
    if (!rawJson.trim()) {
      return fallbackResponse;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch (parseErr) {
      console.warn('Agent 2: Failed to parse JSON, returning fallback.', parseErr);
      return fallbackResponse;
    }

    const validation = syllabusMappingSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn('Agent 2: Zod validation failed, returning fallback.', validation.error);
      return fallbackResponse;
    }

    console.log('Agent 2: Mapping complete!');
    return validation.data;
  } catch (error) {
    console.error('Error in Agent 2, returning fallback:', error);
    return fallbackResponse;
  }
}
