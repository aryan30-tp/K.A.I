import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import axios from 'axios';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Import Firebase config (initializes Admin SDK)
import './src/config/firebase.js';
import { getCachedOutput, saveCachedOutput } from './src/services/dbService.js';

const db = getFirestore();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Import our Agents
import { 
  extractContent, 
  extractFromPdf, 
  extractFromDocx, 
  extractFromYoutube, 
  extractViaWhisper,
  extractOfficeFile,
  processLocalAudioViaGroq
} from './src/agents/agent1_extractor.js';
import { mapSyllabusToNotes } from './src/agents/agent2_mapper.js';
import { analyzePastPapers } from './src/agents/agent3_analyst.js';
import { generateOutput } from './src/agents/agent4_generator.js';
import { generateMockExam } from './src/agents/agent7_exam_generator.js';
import { gradeExamAnswer } from './src/agents/agent6_grader.js';
import { processSocraticTurn } from './src/agents/agent8_socratic.js';
import { generateHeatmap } from './src/agents/agent9_analyst.js';

const app = express();
const PORT = process.env.PORT || 10000;

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

// --- EXAM ENGINE ---
app.post('/api/exam/generate', async (req, res) => {
  try {
    const { topic, workspaceId } = req.body;

    if (!topic || !workspaceId) {
      return res.status(400).json({ ok: false, error: 'Missing topic or workspaceId' });
    }

    const examJson = await generateMockExam(topic, workspaceId);
    return res.json({ ok: true, exam: examJson });
  } catch (error) {
    console.error('Exam Generation Error:', error?.message || error);
    return res.status(500).json({ ok: false, error: 'Failed to generate exam.' });
  }
});

app.post('/api/exam/grade', async (req, res) => {
  try {
    const { question, studentAnswer, workspaceId, topic } = req.body;

    if (!question || !studentAnswer || !workspaceId || !topic) {
      return res.status(400).json({ ok: false, error: 'Missing required grading parameters' });
    }

    const gradingReport = await gradeExamAnswer(question, studentAnswer, workspaceId);

    await db.collection('exam_results').add({
      workspaceId,
      topic,
      score: gradingReport.score,
      missingConcepts: gradingReport.missingConcepts || [],
      timestamp: Timestamp.now(),
    });

    return res.json({ ok: true, report: gradingReport });
  } catch (error) {
    console.error('Exam Grading Error:', error?.message || error);
    return res.status(500).json({ ok: false, error: 'Agent 6 failed to grade the answer.' });
  }
});

// --- PREDICTIVE HEATMAP ---
app.get('/api/analytics/heatmap/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) {
      return res.status(400).json({ ok: false, error: 'Missing workspaceId' });
    }

    const heatmapData = await generateHeatmap(workspaceId);
    return res.json({ ok: true, data: heatmapData });
  } catch (error) {
    console.error('Heatmap Generation Error:', error?.message || error);
    return res.status(500).json({ ok: false, error: 'Failed to compile analytics.' });
  }
});

// --- SOCRATIC VOICE EXAM ---
app.post('/api/socratic/turn', upload.single('audioFile'), async (req, res) => {
  try {
    const { chatHistory, topic, workspaceId } = req.body;

    if (!req.file || !topic || !workspaceId) {
      return res.status(400).json({ ok: false, error: 'Missing audio file, topic, or workspaceId' });
    }

    const audioName = (req.file.originalname || '').toLowerCase();
    const audioExt = audioName.includes('.') ? `.${audioName.split('.').pop()}` : '';
    const audioPathWithExt = audioExt ? `${req.file.path}${audioExt}` : req.file.path;
    if (audioPathWithExt !== req.file.path) {
      fs.renameSync(req.file.path, audioPathWithExt);
    }

    const transcriptionResult = await processLocalAudioViaGroq(audioPathWithExt);
    const transcriptionText =
      typeof transcriptionResult === 'string'
        ? transcriptionResult
        : transcriptionResult?.text || String(transcriptionResult || '');
    const parsedHistory = chatHistory ? JSON.parse(chatHistory) : [];

    const tutorResponse = await processSocraticTurn(
      transcriptionText,
      parsedHistory,
      topic,
      workspaceId
    );

    fs.unlinkSync(audioPathWithExt);

    return res.json({
      ok: true,
      studentTranscription: transcriptionText,
      tutorSpeech: tutorResponse.tutorSpeech,
      isConceptMastered: tutorResponse.isConceptMastered,
    });
  } catch (error) {
    console.error('Socratic Turn Error:', error?.message || error);
    if (req.file) {
      const cleanupPath = req.file.path;
      if (fs.existsSync(cleanupPath)) {
        fs.unlinkSync(cleanupPath);
      }
    }
    return res.status(500).json({ ok: false, error: 'The tutor lost connection.' });
  }
});

// --- FLASHCARD SRS REVIEW ---
app.post('/api/flashcards/review', async (req, res) => {
  try {
    const { cardId, qualityScore } = req.body;

    if (!cardId || typeof qualityScore !== 'number') {
      return res.status(400).json({ ok: false, error: 'cardId and qualityScore are required.' });
    }

    const cardRef = db.collection('flashcards').doc(cardId);
    const doc = await cardRef.get();

    if (!doc.exists) {
      return res.status(404).json({ ok: false, error: 'Flashcard not found.' });
    }

    let { repetitionCount, easeFactor, intervalDays } = doc.data();

    repetitionCount = repetitionCount || 0;
    easeFactor = easeFactor || 2.5;
    intervalDays = intervalDays || 0;

    if (qualityScore < 3) {
      repetitionCount = 0;
      intervalDays = 1;
    } else {
      if (repetitionCount === 0) {
        intervalDays = 1;
      } else if (repetitionCount === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitionCount += 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);

    await cardRef.update({
      repetitionCount,
      easeFactor,
      intervalDays,
      nextReviewDate: Timestamp.fromDate(nextDate),
    });

    res.json({ ok: true, nextReviewDate: nextDate.toISOString() });
  } catch (error) {
    console.error('SRS Calculation Error:', error?.message || error);
    res.status(500).json({ ok: false, error: 'Failed to update flashcard interval.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// List available Gemini models for debugging
app.get('/api/list-models', async (req, res) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(400).json({ ok: false, error: 'GOOGLE_API_KEY is not set.' });
    }
    const response = await axios.get(
      'https://generativelanguage.googleapis.com/v1beta/models',
      {
        params: { key: process.env.GOOGLE_API_KEY },
      }
    );
    const models = response.data?.models || [];

    const formatted = models.map((model) => ({
      name: model.name,
      displayName: model.displayName,
      supportedGenerationMethods: model.supportedGenerationMethods,
    }));

    res.json({ ok: true, models: formatted });
  } catch (error) {
    const message = error?.message || String(error || 'Unknown error');
    console.error('List models error:', message);
    res.status(500).json({ ok: false, error: message });
  }
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 K.A.I. Backend is running on port ${PORT}`);
});
