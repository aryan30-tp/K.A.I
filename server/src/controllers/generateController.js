import agent4 from '../agents/agent4_generator.js';

export async function generateContent(req, res) {
  try {
    const { requestType, rawNotes, syllabusAnalysis, examAnalysis } = req.body;
    if (!requestType || !rawNotes) {
      return res.status(400).json({ error: 'Missing requestType or rawNotes in request body' });
    }

    const { generateOutput } = agent4;
    const result = await generateOutput(requestType, rawNotes, syllabusAnalysis, examAnalysis);
    return res.json({ ok: true, result });
  } catch (err) {
    console.error('generate content error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}

export default { generateContent };