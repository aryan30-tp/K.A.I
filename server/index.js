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
  extractFromImage,
  processLocalAudioViaGroq
} from './src/agents/agent1_extractor.js';
import { mapSyllabusToNotes } from './src/agents/agent2_mapper.js';
import { analyzePastPapers } from './src/agents/agent3_analyst.js';
import { generateOutput } from './src/agents/agent4_generator.js';
import { ingestDocumentToBrain } from './src/agents/agent5_rag.js';
import { generateMockExam } from './src/agents/agent7_exam_generator.js';
import { gradeExamAnswer } from './src/agents/agent6_grader.js';
import { processSocraticTurn } from './src/agents/agent8_socratic.js';
import { generateHeatmap } from './src/agents/agent9_analyst.js';
import { generateSurvivalPlan } from './src/agents/agent11_triage.js';

const app = express();
const PORT = process.env.PORT || 10000;
const MAX_EXTRACTED_CHARACTERS = 100000;

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

// --- SESSION MANAGEMENT ---
app.get('/api/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    
    const snapshot = await db.collection('users').doc(userId).collection('sessions').orderBy('lastUpdated', 'desc').get();
    const sessions = [];
    snapshot.forEach(doc => {
      sessions.push(doc.data());
    });
    
    return res.json({ ok: true, sessions });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch sessions' });
  }
});

app.get('/api/sessions/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const docRef = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }
    
    return res.json({ ok: true, session: docSnap.data() });
  } catch (error) {
    console.error('Fetch session error:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch session' });
  }
});

app.post('/api/sessions/:userId/:sessionId/append', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { newPastPapersText, newSyllabusText } = req.body;
    
    const docRef = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return res.status(404).json({ ok: false, error: 'Session not found' });
    }
    
    const currentSession = docSnap.data();
    const coreIntel = currentSession.coreIntel || {};
    
    let updatedPastPapers = coreIntel.pastPapersText || '';
    if (newPastPapersText) {
      updatedPastPapers = updatedPastPapers ? `${updatedPastPapers}\n\n--- [LATE INTEL ADDITION] ---\n\n${newPastPapersText}` : newPastPapersText;
    }
    
    let updatedSyllabus = coreIntel.syllabusText || '';
    if (newSyllabusText) {
      updatedSyllabus = updatedSyllabus ? `${updatedSyllabus}\n\n--- [LATE INTEL ADDITION] ---\n\n${newSyllabusText}` : newSyllabusText;
    }
    
    await docRef.set({
      lastUpdated: Timestamp.now(),
      coreIntel: {
        ...coreIntel,
        pastPapersText: updatedPastPapers,
        syllabusText: updatedSyllabus
      }
    }, { merge: true });
    
    return res.json({ ok: true, coreIntel: { ...coreIntel, pastPapersText: updatedPastPapers, syllabusText: updatedSyllabus } });
  } catch (error) {
    console.error('Append session error:', error);
    res.status(500).json({ ok: false, error: 'Failed to append to session' });
  }
});

// --- ROUTE 1: EXTRACT FUEL (Agent 1) ---
app.post('/api/extract', upload.array('file', 10), async (req, res) => {
  try {
    const { youtubeUrl, forceWhisper, workspaceId, userId } = req.body;
    let rawText = "";
    let warning = '';
    const extractedSegments = [];
    const hasYoutubeUrl = Boolean(youtubeUrl);
    const hasUploadedFiles = Boolean(req.files && req.files.length > 0);

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    // Generate a unique ID for this specific study session/document
    const uploadId = uuidv4(); 

    if (hasYoutubeUrl) {
      let youtubeText = '';
      if (forceWhisper === 'true') {
        youtubeText = await extractViaWhisper(youtubeUrl);
      } else {
        youtubeText = await extractFromYoutube(youtubeUrl);
      }

      extractedSegments.push(`### YouTube Source\n\n${youtubeText}`);
    }

    if (hasUploadedFiles) {
      const extractedTexts = await Promise.all(
        req.files.map(async (file) => {
          const mimeType = file.mimetype || '';
          const originalName = file.originalname || 'uploaded-file';
          const normalizedName = originalName.toLowerCase();
          const originalExt = normalizedName.includes('.')
            ? `.${normalizedName.split('.').pop()}`
            : '';
          const filePathWithExt = originalExt ? `${file.path}${originalExt}` : file.path;

          if (filePathWithExt !== file.path) {
            fs.renameSync(file.path, filePathWithExt);
          }

          try {
            let fileText = '';
            if (mimeType === 'application/pdf' || normalizedName.endsWith('.pdf')) {
              fileText = await extractFromPdf(filePathWithExt);
            } else if (
              normalizedName.endsWith('.ppt') ||
              mimeType === 'application/vnd.ms-powerpoint'
            ) {
              throw new Error('Legacy .ppt files are not supported. Please export as .pptx.');
            } else if (
              normalizedName.endsWith('.pptx') ||
              normalizedName.endsWith('.docx') ||
              mimeType.includes('presentation') ||
              mimeType.includes('wordprocessingml')
            ) {
              fileText = await extractOfficeFile(filePathWithExt);
            } else {
              throw new Error('Unsupported file format. Please upload PDF, DOCX, or PPTX.');
            }

            return `### ${originalName}\n\n${fileText}`;
          } finally {
            if (fs.existsSync(filePathWithExt)) {
              fs.unlinkSync(filePathWithExt);
            }
          }
        })
      );

      extractedSegments.push(...extractedTexts);
    }

    if (extractedSegments.length === 0) {
      return res.status(400).json({ error: "No file or URL provided" });
    }

    rawText = extractedSegments.join('\n\n--- [NEW DOCUMENT] ---\n\n');

    if (rawText.length > MAX_EXTRACTED_CHARACTERS) {
      rawText = rawText.slice(0, MAX_EXTRACTED_CHARACTERS);
      warning =
        'Data load too heavy. Truncated extracted content to the first 100000 characters to prioritize immediate triage.';
    }

    try {
      await ingestDocumentToBrain(rawText, workspaceId, uploadId);
    } catch (ingestError) {
      console.warn(
        'Ingestion warning: skipping Pinecone upsert for this upload.',
        ingestError?.message || ingestError
      );
    }

    const resolvedUserId = userId || workspaceId;

    await db.collection('users').doc(resolvedUserId).collection('sessions').doc(uploadId).set(
      {
        sessionId: uploadId,
        workspaceId,
        userId: resolvedUserId,
        status: 'active',
        subject: `Session ${new Date().toLocaleDateString()}`,
        lastUpdated: Timestamp.now(),
        coreIntel: {
          rawNotes: rawText,
          syllabusText: '',
          pastPapersText: ''
        },
        sourceType: hasYoutubeUrl && hasUploadedFiles ? 'mixed' : hasYoutubeUrl ? 'youtube' : 'file',
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );

    res.json({ ok: true, uploadId, rawText, workspaceId, warning });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Extraction failed',
    });
  }
});

// --- ROUTE: OCR IMAGE (Syllabus/Notes) ---
app.post('/api/ocr/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Missing image file.' });
    }

    const imageName = (req.file.originalname || '').toLowerCase();
    const imageExt = imageName.includes('.') ? `.${imageName.split('.').pop()}` : '';
    const imagePathWithExt = imageExt ? `${req.file.path}${imageExt}` : req.file.path;
    if (imagePathWithExt !== req.file.path) {
      fs.renameSync(req.file.path, imagePathWithExt);
    }

    const extractedText = await extractFromImage(imagePathWithExt, req.file.mimetype);

    if (fs.existsSync(imagePathWithExt)) {
      fs.unlinkSync(imagePathWithExt);
    }

    return res.json({ ok: true, text: extractedText || "" });
  } catch (error) {
    console.error('OCR Image Error:', error?.message || error);
    if (req.file && fs.existsSync(req.file.path)) {
      const imagePath = req.file.path;
      const imageExt = (req.file.originalname || '').toLowerCase().includes('.') 
        ? `.${(req.file.originalname || '').toLowerCase().split('.').pop()}` 
        : '';
      const imagePathWithExt = imageExt ? `${imagePath}${imageExt}` : imagePath;
      
      if (fs.existsSync(imagePathWithExt)) fs.unlinkSync(imagePathWithExt);
      else if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    return res.status(500).json({ ok: true, text: "", error: 'Failed to extract text from image.' });
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
    const {
      uploadId,
      requestType,
      rawNotes,
      syllabusAnalysis,
      examAnalysis,
      specificTopic,
      workspaceId,
      userId,
      excludeTopics = [],
    } = req.body;

    // 1. Check Firebase first! 
    // If it's a batch request (excludeTopics present), we skip cache for now
    // to ensure we get fresh cards.
    const isBatchRequest = requestType === 'flashcards' && excludeTopics && excludeTopics.length > 0;

    if (!isBatchRequest) {
      const cachedData = await getCachedOutput(uploadId, requestType);
      if (cachedData) {
        return res.json({ ok: true, source: "cache", data: cachedData });
      }
    }

    // 2. If not in cache, call Agent 4 (Gemini API)
    const generatedData = await generateOutput(
      requestType, 
      rawNotes, 
      syllabusAnalysis, 
      examAnalysis, 
      specificTopic,
      excludeTopics
    );

    // 3. Save it to Firebase only if it's NOT a batch request
    // (Or we could handle batch caching, but let's keep it simple for now)
    if (!isBatchRequest) {
      await saveCachedOutput(uploadId, requestType, generatedData, {
        userId: userId || workspaceId,
        workspaceId,
      });
    }

    // 4. Send back to React
    res.json({ ok: true, source: "ai", data: generatedData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: `Failed to generate ${req.body.requestType}` });
  }
});

// --- ANALYTICS & PERFORMANCE ---
app.post('/api/analytics/record-test', async (req, res) => {
  try {
    const { workspaceId, topic, score, missingConcepts = [], sessionId } = req.body;

    if (!workspaceId || !topic || typeof score !== 'number') {
      return res.status(400).json({ ok: false, error: 'Missing required analytics parameters' });
    }

    await db.collection('exam_results').add({
      workspaceId,
      sessionId: sessionId || null,
      topic,
      score,
      missingConcepts,
      timestamp: Timestamp.now(),
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Record Test Error:', error);
    res.status(500).json({ ok: false, error: 'Failed to record test result.' });
  }
});

app.post('/api/analytics/onboard-flashcards', async (req, res) => {
  try {
    const { workspaceId, flashcards, sessionId } = req.body;

    if (!workspaceId || !Array.isArray(flashcards)) {
      return res.status(400).json({ ok: false, error: 'Missing workspaceId or flashcards array' });
    }

    const batch = db.batch();
    flashcards.forEach((card) => {
      // Use provided ID or generate a new one
      const cardId = card.id || uuidv4();
      const cardRef = db.collection('flashcards').doc(cardId);
      batch.set(cardRef, {
        front: card.front,
        back: card.back,
        mermaidCode: card.mermaidCode || null,
        workspaceId,
        sessionId: sessionId || null,
        repetitionCount: 0,
        easeFactor: 2.5,
        intervalDays: 0,
        nextReviewDate: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
    });

    await batch.commit();
    res.json({ ok: true });
  } catch (error) {
    console.error('Onboard Flashcards Error:', error);
    res.status(500).json({ ok: false, error: 'Failed to onboard flashcards.' });
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
    const { question, studentAnswer, workspaceId, topic, sessionId } = req.body;

    if (!question || !studentAnswer || !workspaceId || !topic) {
      return res.status(400).json({ ok: false, error: 'Missing required grading parameters' });
    }

    const gradingReport = await gradeExamAnswer(question, studentAnswer, workspaceId);

    await db.collection('exam_results').add({
      workspaceId,
      sessionId: sessionId || null,
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
    const { sessionId } = req.query; // Extract sessionId from query
    if (!workspaceId) {
      return res.status(400).json({ ok: false, error: 'Missing workspaceId' });
    }

    const heatmapData = await generateHeatmap(workspaceId, sessionId);
    return res.json({ ok: true, data: heatmapData });
  } catch (error) {
    console.error('Heatmap Generation Error:', error?.message || error);
    return res.status(500).json({ ok: false, error: 'Failed to compile analytics.' });
  }
});

// --- DEFCON 1 SURVIVAL MODE ---
app.post('/api/survival/triage', async (req, res) => {
  try {
    const { workspaceId, hoursRemaining } = req.body;
    const hours = Number(hoursRemaining);

    if (!workspaceId || Number.isNaN(hours)) {
      return res.status(400).json({ ok: false, error: 'Missing workspaceId or hoursRemaining.' });
    }

    if (hours < 1) {
      return res
        .status(400)
        .json({ ok: false, error: 'Less than 1 hour remaining. Triage impossible.' });
    }

    const battlePlan = await generateSurvivalPlan(workspaceId, hours);
    return res.json({ ok: true, data: battlePlan });
  } catch (error) {
    console.error('Triage Engine Error:', error?.message || error);
    return res
      .status(500)
      .json({ ok: false, error: 'The triage engine failed to compile a plan.' });
  }
});

// --- SOCRATIC VOICE EXAM ---
app.post('/api/socratic/turn', upload.single('audioFile'), async (req, res) => {
  try {
    const { chatHistory, topic, workspaceId, attemptCount, sessionId } = req.body;

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
      workspaceId,
      Number(attemptCount || 0)
    );

    fs.unlinkSync(audioPathWithExt);

    if (tutorResponse.isConceptMastered) {
      await db.collection('exam_results').add({
        workspaceId,
        sessionId: sessionId || null,
        topic,
        score: 100,
        missingConcepts: [],
        timestamp: Timestamp.now(),
        source: 'socratic'
      });
    }

    return res.json({
      ok: true,
      studentTranscription: transcriptionText,
      tutorSpeech: tutorResponse.tutorSpeech,
      isConceptMastered: tutorResponse.isConceptMastered,
      revealAnswer: tutorResponse.revealAnswer || null,
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
