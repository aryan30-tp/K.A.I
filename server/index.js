import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import axios from 'axios';

// Import Firebase config (initializes Admin SDK)
import './src/config/firebase.js';
import { getCachedOutput, saveCachedOutput } from './src/services/dbService.js';

// Import our Agents
import { 
  extractContent, 
  extractFromPdf, 
  extractFromDocx, 
  extractFromYoutube, 
  extractViaWhisper,
  extractOfficeFile 
} from './src/agents/agent1_extractor.js';
import { mapSyllabusToNotes } from './src/agents/agent2_mapper.js';
import { analyzePastPapers } from './src/agents/agent3_analyst.js';
import { generateOutput } from './src/agents/agent4_generator.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for requests from the frontend. Set CORS_ORIGIN (comma-separated) to restrict.
const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = corsOrigins.includes('*')
  ? { origin: '*' }
  : {
      origin: (origin, callback) => {
        // Allow same-origin or non-browser requests without Origin header.
        if (!origin || corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
    };

app.use(cors(corsOptions));

// Set up Multer to temporarily save uploaded files to an /uploads folder
const upload = multer({ dest: 'uploads/' });

// --- ROUTE 1: EXTRACT FUEL (Agent 1) ---
app.post('/api/extract', upload.array('file', 10), async (req, res) => {
  try {
    const { youtubeUrl, forceWhisper } = req.body;
    let rawText = "";

    // Generate a unique ID for this specific study session/document
    const uploadId = uuidv4(); 

    if (youtubeUrl) {
      if (forceWhisper === 'true') {
        rawText = await extractViaWhisper(youtubeUrl);
      } else {
        rawText = await extractFromYoutube(youtubeUrl);
      }
    } else if (req.files && req.files.length > 0) {
      const extractedTexts = [];

      for (const file of req.files) {
        const mimeType = file.mimetype;
        const originalName = file.originalname.toLowerCase();
        const originalExt = originalName.includes('.')
          ? `.${originalName.split('.').pop()}`
          : '';
        const filePathWithExt = originalExt ? `${file.path}${originalExt}` : file.path;

        if (filePathWithExt !== file.path) {
          fs.renameSync(file.path, filePathWithExt);
        }

        let fileText = '';
        if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
          fileText = await extractFromPdf(filePathWithExt);
        } else if (
          originalName.endsWith('.ppt') ||
          mimeType === 'application/vnd.ms-powerpoint'
        ) {
          fs.unlinkSync(filePathWithExt);
          return res
            .status(400)
            .json({ error: 'Legacy .ppt files are not supported. Please export as .pptx.' });
        } else if (
          originalName.endsWith('.pptx') ||
          originalName.endsWith('.docx') ||
          mimeType.includes('presentation') ||
          mimeType.includes('wordprocessingml')
        ) {
          fileText = await extractOfficeFile(filePathWithExt);
        } else {
          fs.unlinkSync(filePathWithExt);
          return res
            .status(400)
            .json({ error: 'Unsupported file format. Please upload PDF, DOCX, or PPTX.' });
        }

        extractedTexts.push(`### ${originalName}\n\n${fileText}`);

        // Clean up the temporary file immediately after reading it
        fs.unlinkSync(filePathWithExt);
      }

      rawText = extractedTexts.join('\n\n---\n\n');
    } else {
      return res.status(400).json({ error: "No file or URL provided" });
    }

    res.json({ ok: true, uploadId, rawText });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Extraction failed',
    });
  }
});

// --- ROUTE 2: ANALYZE CONTEXT (Agents 2 & 3) ---
app.post('/api/analyze', async (req, res) => {
  try {
    const { rawNotes, syllabusText, pastPapersText } = req.body;
    
    let syllabusAnalysis = null;
    let examAnalysis = null;

    if (syllabusText) {
      syllabusAnalysis = await mapSyllabusToNotes(syllabusText, rawNotes);
    }
    if (pastPapersText) {
      examAnalysis = await analyzePastPapers(syllabusText, pastPapersText);
    }

    res.json({ ok: true, syllabusAnalysis, examAnalysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Analysis failed" });
  }
});

// --- ROUTE 3: THE GENERATOR & CACHE (Agent 4 + Firebase) ---
app.post('/api/generate', async (req, res) => {
  try {
    const { uploadId, requestType, rawNotes, syllabusAnalysis, examAnalysis, specificTopic } = req.body;

    // 1. Check Firebase first! 
    const cachedData = await getCachedOutput(uploadId, requestType);
    if (cachedData) {
      return res.json({ ok: true, source: "cache", data: cachedData });
    }

    // 2. If not in cache, call Agent 4 (Gemini API)
    const generatedData = await generateOutput(
      requestType, 
      rawNotes, 
      syllabusAnalysis, 
      examAnalysis, 
      specificTopic
    );

    // 3. Save it to Firebase so we never pay for it again
    await saveCachedOutput(uploadId, requestType, generatedData);

    // 4. Send back to React
    res.json({ ok: true, source: "ai", data: generatedData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: `Failed to generate ${req.body.requestType}` });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Debug RapidAPI availability without touching the extractor pipeline
app.get('/api/debug-rapidapi', async (req, res) => {
  try {
    const videoUrl = req.query?.url;
    if (!videoUrl) {
      return res.status(400).json({ ok: false, error: 'Missing url query param' });
    }

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: 'RAPIDAPI_KEY is not set' });
    }

    const match = String(videoUrl).match(
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    );
    const videoId = match && match[2]?.length === 11 ? match[2] : null;
    if (!videoId) {
      return res.status(400).json({ ok: false, error: 'Invalid YouTube URL' });
    }

    const response = await axios.request({
      method: 'GET',
      url: 'https://youtube-transcript3.p.rapidapi.com/api/transcript',
      params: { videoId },
      headers: {
        'x-rapidapi-host': 'youtube-transcript3.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return res.json({
      ok: true,
      status: response.status,
      isArray: Array.isArray(response.data),
      sample: Array.isArray(response.data) ? response.data.slice(0, 2) : response.data,
    });
  } catch (error) {
    const status = error.response?.status || null;
    const data = error.response?.data || null;
    return res.status(500).json({
      ok: false,
      status,
      data,
      message: error.message,
      code: error.code || null,
    });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to K.A.I. Backend!' });
});

// Server
app.listen(PORT, () => {
  console.log(`🚀 K.A.I. Backend is running on http://localhost:${PORT}`);
});
