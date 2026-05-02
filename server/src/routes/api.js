import express from 'express';
import { generateStudyPlan } from '../controllers/studyPlanController.js';
import { extract } from '../controllers/extractController.js';

const router = express.Router();

// POST /api/study-plan
router.post('/study-plan', generateStudyPlan);

// POST /api/extract
router.post('/extract', extract);

// Health
router.get('/health', (req, res) => res.json({ status: 'OK' }));

export default router;
