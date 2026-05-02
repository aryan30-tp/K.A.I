import express from 'express';
import multer from 'multer';
import { generateStudyPlan } from '../controllers/studyPlanController.js';
import { extract, extractFile } from '../controllers/extractController.js';
import { mapSyllabus } from '../controllers/mapController.js';
import { listModels } from '../controllers/modelsController.js';
import { analyzePapers } from '../controllers/analysisController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /api/study-plan
router.post('/study-plan', generateStudyPlan);

// POST /api/extract
router.post('/extract', extract);

// POST /api/extract-file
router.post('/extract-file', upload.single('file'), extractFile);

// POST /api/map-syllabus
router.post('/map-syllabus', mapSyllabus);

// POST /api/analyze-papers
router.post('/analyze-papers', analyzePapers);

// GET /api/list-models
router.get('/list-models', listModels);

// Health
router.get('/health', (req, res) => res.json({ status: 'OK' }));

export default router;
