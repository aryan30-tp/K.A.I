import { z } from 'zod';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MAX_INPUT_CHARS = 9000;

function clampText(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (trimmed.length <= MAX_INPUT_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_INPUT_CHARS)}\n\n[TRUNCATED]`;
}

// --- 1. DEFINE DYNAMIC SCHEMAS ---
const flashcardSchema = z.object({
  flashcards: z
    .array(
      z.object({
        front: z.string().describe('The concept, term, or question.'),
        back: z.string().describe('The concise answer or definition.'),
      })
    )
    .describe('A list of flashcards optimized for active recall.'),
});

const studyPlanSchema = z.object({
  planTitle: z.string(),
  tasks: z
    .array(
      z.object({
        order: z.number().describe('The chronological order to study this in.'),
        topic: z.string().describe('The topic name.'),
        priority: z.enum(['Critical (Do Now)', 'High', 'Medium', 'Skip if out of time']),
        estimatedMinutes: z
          .number()
          .describe('Realistic time in minutes to spend on this tonight.'),
        actionableAdvice: z
          .string()
          .describe(
            "What exactly to do (e.g., 'Memorize the 7 layers', 'Practice 2 derivation problems')."
          ),
      })
    )
    .describe('An aggressively prioritized study plan for a night-before cram session.'),
});

const summarySchema = z.object({
  title: z.string(),
  executiveSummary: z
    .string()
    .describe('A 3-4 sentence high-level overview of everything extracted.'),
  keyTakeaways: z
    .array(
      z.object({
        topic: z.string(),
        summary: z.string().describe('Crisp, no-fluff summary of the topic. Bullet point style.'),
        mnemonic: z
          .string()
          .optional()
          .describe('A clever memory trick or acronym to remember this topic easily.'),
      })
    )
    .describe('The core notes, organized by topic severity.'),
});

const mockTestSchema = z.object({
  testTitle: z.string(),
  timeLimitMinutes: z.number().describe('Suggested time to complete this mock test.'),
  questions: z
    .array(
      z.object({
        questionNumber: z.number(),
        questionText: z.string(),
        questionType: z.enum(['Multiple Choice', 'Short Answer', 'Essay']),
        options: z
          .array(z.string())
          .optional()
          .describe('Provide 4 options ONLY if the type is Multiple Choice.'),
        correctAnswer: z.string().describe('The exact answer key.'),
        explanation: z.string().describe('Brief explanation of why the answer is correct.'),
      })
    )
    .describe("A realistic practice exam heavily weighted toward 'Very High' likelihood topics from the past papers."),
});

const eli5Schema = z.object({
  topic: z.string(),
  theAnalogy: z
    .string()
    .describe('Explain the core concept using an everyday situation (e.g., ordering pizza, traffic, video games).'),
  simpleExplanation: z
    .string()
    .describe('Break down the mechanics without using ANY academic jargon.'),
  whyItMatters: z
    .string()
    .describe('Explain why this concept is actually useful or why the professor cares about it.'),
});

// --- 2. THE GENERATOR FUNCTION ---
/**
 * Generates specific outputs based on user request.
 *
 * @param {string} requestType - "flashcards", "study_plan", "summary", "mock_test", "eli5"
 * @param {string} rawNotes - The output from Agent 1
 * @param {Object} syllabusAnalysis - The JSON output from Agent 2 (optional)
 * @param {Object} examAnalysis - The JSON output from Agent 3 (optional)
 * @param {string} specificTopic - (Optional) Only used for ELI5 to specify what to explain
 */
export async function generateOutput(
  requestType,
  rawNotes,
  syllabusAnalysis = null,
  examAnalysis = null,
  specificTopic = null
) {
  try {
    console.log(`Agent 4: Generating ${requestType}...`);

    let schema;
    let systemInstructions;

    // --- 3. ROUTE BASED ON REQUEST ---
    if (requestType === 'flashcards') {
      schema = flashcardSchema;
      systemInstructions =
        "You are an expert tutor creating highly effective flashcards. Use the provided notes to extract key concepts. Keep the 'back' of the card concise and easy to memorize.";
    } else if (requestType === 'study_plan') {
      schema = studyPlanSchema;
      systemInstructions =
        'You are a ruthless academic coach building a one-night study plan. Prioritize topics based on the Exam Analysis (focus on high likelihood). Tell the student exactly what to focus on and what to skip.';
    } else if (requestType === 'summary') {
      schema = summarySchema;
      systemInstructions =
        'You are a master synthesizer. Condense the raw notes into a crisp, high-yield summary. Include clever mnemonics where appropriate to help the student memorize complex lists or concepts.';
    } else if (requestType === 'mock_test') {
      schema = mockTestSchema;
      systemInstructions =
        "You are a strict examiner. Generate a realistic mock test. If an Exam Analysis is provided, aggressively test the topics marked as 'Very High' likelihood. Include a mix of question types and provide the answer key.";
    } else if (requestType === 'eli5') {
      schema = eli5Schema;
      systemInstructions =
        `You are an incredibly empathetic tutor known for breaking down complex topics. The user wants you to explain the concept of '${
          specificTopic || 'the most complex topic in the notes'
        }'. Explain it using brilliant, relatable everyday analogies. ZERO jargon.`;
    } else {
      throw new Error('Invalid request type');
    }

    // --- 4. EXECUTE VIA GROQ ---
    const userPrompt = `RAW NOTES:
  ${clampText(rawNotes)}

  SYLLABUS ANALYSIS:
  ${clampText(syllabusAnalysis ? JSON.stringify(syllabusAnalysis) : 'None provided')}

  EXAM ANALYSIS:
  ${clampText(examAnalysis ? JSON.stringify(examAnalysis) : 'None provided')}

  Return JSON that matches the required schema for: ${requestType}.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: userPrompt },
      ],
      model:
        process.env.GROQ_MODEL_GENERATOR ||
        process.env.GROQ_MODEL ||
        'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const rawJson = completion.choices?.[0]?.message?.content || '';
    if (!rawJson.trim()) {
      throw new Error('Groq returned empty JSON.');
    }

    const parsed = JSON.parse(rawJson);
    const result = schema.parse(parsed);

    console.log(`Agent 4: ${requestType} complete!`);
    return result;
  } catch (error) {
    console.error('Error in Agent 4:', error);
    throw new Error(`Failed to generate ${requestType}.`);
  }
}

// --- QUICK TEST ---
// Uncomment the block below to test the ELI5 or Mock Test specifically.
/*
const mockNotes = "ACID stands for Atomicity, Consistency, Isolation, Durability. Deadlocks happen when processes wait on each other indefinitely. The OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.";

generateOutput("eli5", mockNotes, null, null, "Deadlocks").then(result => {
  console.log(JSON.stringify(result, null, 2));
});
*/

export default { generateOutput };
