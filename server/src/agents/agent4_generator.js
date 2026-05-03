import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { llm } from './llmConfig.js';

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

// --- 2. THE GENERATOR FUNCTION ---
/**
 * Generates specific outputs based on user request.
 *
 * @param {string} requestType - e.g., "flashcards", "study_plan"
 * @param {string} rawNotes - The output from Agent 1
 * @param {Object} syllabusAnalysis - The JSON output from Agent 2 (optional)
 * @param {Object} examAnalysis - The JSON output from Agent 3 (optional)
 */
export async function generateOutput(
  requestType,
  rawNotes,
  syllabusAnalysis = null,
  examAnalysis = null
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
        'You are a ruthless academic coach building a one-night study plan. Prioritize topics based on the provided Exam Analysis (focus on high likelihood) and Syllabus Analysis. Tell the student exactly what to focus on and what to skip.';
    } else {
      throw new Error('Invalid request type');
    }

    // --- 4. BIND AND EXECUTE ---
    const structuredLlm = llm.withStructuredOutput(schema, { name: requestType });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemInstructions],
      [
        'human',
        `
        RAW NOTES: {notes}
        SYLLABUS ANALYSIS: {syllabus}
        EXAM ANALYSIS: {exam}
      `,
      ],
    ]);

    const chain = prompt.pipe(structuredLlm);

    const result = await chain.invoke({
      notes: rawNotes,
      syllabus: syllabusAnalysis ? JSON.stringify(syllabusAnalysis) : 'None provided',
      exam: examAnalysis ? JSON.stringify(examAnalysis) : 'None provided',
    });

    console.log(`Agent 4: ${requestType} complete!`);
    return result;
  } catch (error) {
    console.error('Error in Agent 4:', error);
    throw new Error(`Failed to generate ${requestType}.`);
  }
}

export default { generateOutput };
