import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Import Firebase config (initializes Admin SDK)
import './src/config/firebase.js';
import { getCachedOutput, saveCachedOutput } from './src/services/dbService.js';

// Import our Agents
import { 
  extractContent, 
  extractFromPdf, 
  extractFromDocx, 
  extractFromYoutube 
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
app.post('/api/extract', upload.single('file'), async (req, res) => {
  try {
    const { youtubeUrl } = req.body;
    let rawText = "";

    // Generate a unique ID for this specific study session/document
    const uploadId = uuidv4(); 

    if (youtubeUrl) {
      rawText = await extractFromYoutube(youtubeUrl);
    } else if (req.file) {
      const type = req.file.mimetype === 'application/pdf' ? 'pdf' : 'docx';
      if (type === 'pdf') {
        rawText = await extractFromPdf(req.file.path);
      } else {
        rawText = await extractFromDocx(req.file.path);
      }
      
      // Clean up the temporary file immediately after reading it
      fs.unlinkSync(req.file.path); 
    } else {
      return res.status(400).json({ error: "No file or URL provided" });
    }

    res.json({ ok: true, uploadId, rawText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: "Extraction failed" });
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

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to K.A.I. Backend!' });
});

// Server
app.listen(PORT, () => {
  console.log(`🚀 K.A.I. Backend is running on http://localhost:${PORT}`);
});
