export async function listModels(req, res) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing GOOGLE_API_KEY in environment.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: payload?.error || payload });
    }

    // Filter to models that support generateContent.
    const models = (payload.models || []).map((model) => ({
      name: model.name,
      supportedMethods: model.supportedGenerationMethods || [],
    }));

    const generateContentModels = models.filter((model) =>
      model.supportedMethods.includes('generateContent')
    );

    return res.json({ ok: true, models: generateContentModels });
  } catch (err) {
    console.error('list models error', err);
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}

export default { listModels };