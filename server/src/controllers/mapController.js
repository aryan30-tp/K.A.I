import { mapSyllabusToNotes } from '../agents/agent2_mapper.js';

export async function mapSyllabus(req, res) {
  try {
    const { syllabusText, notesText } = req.body;
    if (!syllabusText || !notesText) {
      return res.status(400).json({ error: 'Missing syllabusText or notesText in request body' });
    }

    const result = await mapSyllabusToNotes(syllabusText, notesText);
    return res.json({ ok: true, result });
  } catch (err) {
    console.error('map syllabus error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}

export default { mapSyllabus };