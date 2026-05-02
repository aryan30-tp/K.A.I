import { analyzePastPapers } from '../agents/agent3_analyst.js';

export async function analyzePapers(req, res) {
  try {
    const { syllabusText, pastPapersText } = req.body;
    if (!syllabusText || !pastPapersText) {
      return res.status(400).json({ error: 'Missing syllabusText or pastPapersText in request body' });
    }

    const result = await analyzePastPapers(syllabusText, pastPapersText);
    return res.json({ ok: true, result });
  } catch (err) {
    console.error('analyze papers error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}

export default { analyzePapers };