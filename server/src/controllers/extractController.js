import path from 'node:path';
import extractor from '../agents/agent1_extractor.js';

export async function extract(req, res) {
  try {
    const { source } = req.body;
    if (!source) return res.status(400).json({ error: 'Missing source in request body' });

    // Detect HTTP(S) URLs. Only YouTube URLs are supported for remote extraction.
    const isHttpUrl = /^https?:\/\//i.test(source);
    const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(source);

    if (isHttpUrl && !isYoutube) {
      return res.status(400).json({
        error:
          'Only YouTube URLs are supported for remote HTTP sources. For other remote files, upload them to the server or provide a local path.',
      });
    }

    // If it's a local file path, resolve it; otherwise pass the URL through (YouTube)
    const inputForExtractor = isHttpUrl ? source : extractor.resolveInputPath(source);

    const text = await extractor.extractContent(inputForExtractor);
    return res.json({ ok: true, text });
  } catch (err) {
    console.error('extract error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}

export async function extractFile(req, res) {
  try {
    const uploadedFile = req.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: 'Missing file in request' });
    }

    const extension = path.extname(uploadedFile.originalname || '').toLowerCase();
    if (extension === '.pdf') {
      const text = await extractor.extractFromPdf(uploadedFile.path);
      return res.json({ ok: true, text });
    }

    if (extension === '.docx') {
      const text = await extractor.extractFromDocx(uploadedFile.path);
      return res.json({ ok: true, text });
    }

    return res.status(400).json({ ok: false, error: 'Unsupported file type' });
  } catch (err) {
    console.error('extract file error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}

export default { extract, extractFile };
