// Agent 3: exam pattern analyzer
import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { llm } from './llmConfig.js';

// --- 1. DEFINE THE STRICT SCHEMA ---
const examAnalysisSchema = z.object({
  recurringPatterns: z
    .array(
      z.object({
        topicName: z.string().describe('The name of the topic found in the past papers.'),
        frequency: z
          .number()
          .describe('How many times this topic appeared across the provided past papers.'),
        likelihood: z
          .enum(['Very High', 'High', 'Moderate', 'Low'])
          .describe('The predicted probability of this topic appearing in the next exam.'),
        commonQuestionTypes: z
          .array(z.string())
          .describe("Examples: 'Multiple Choice', 'Short Definition', 'Long Essay', 'Numerical Problem'."),
        exampleQuestion: z
          .string()
          .describe('Formulate one realistic predicted question based on how it was historically tested.'),
      })
    )
    .describe('A list of topics that repeatedly show up in the past papers, sorted by likelihood.'),
  examinerNotes: z
    .string()
    .describe(
      "A 1-2 sentence summary of the examiner's overall style (e.g., 'Heavily favors application-based questions over pure memorization')."
    ),
});

// --- 2. BIND SCHEMA TO THE LLM ---
const structuredLlm = llm.withStructuredOutput(examAnalysisSchema, {
  name: 'ExamAnalysis',
});

// --- 3. CREATE THE AI PROMPT ---
const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert exam pattern analyst. Your objective is to analyze historical exam papers against a curriculum syllabus to predict future exam questions.

RULES:
1. Identify which topics from the syllabus appear most frequently in the past papers.
2. Analyze the 'style' of the questions. Are they asking for definitions, or are they asking the student to apply concepts?
3. Generate a highly probable predicted question for the most recurring topics.
4. Output ONLY the requested structured JSON data.`,
  ],
  [
    'human',
    `SYLLABUS TEXT:
    {syllabus}

    PAST EXAM PAPERS TEXT:
    {pastPapers}`,
  ],
]);

// --- 4. THE EXECUTOR FUNCTION ---
export async function analyzePastPapers(syllabusText, pastPapersText) {
  try {
    console.log('Agent 3: Analyzing past exam patterns...');

    const chain = prompt.pipe(structuredLlm);
    const result = await chain.invoke({
      syllabus: syllabusText,
      pastPapers: pastPapersText,
    });

    console.log('Agent 3: Analysis complete!');
    return result;
  } catch (error) {
    console.error('Error in Agent 3:', error);
    throw new Error('Failed to analyze past papers.');
  }
}
