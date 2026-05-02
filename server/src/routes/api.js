import express from 'express';
import { generateStudyPlan } from '../controllers/studyPlanController.js';

const router = express.Router();

// POST /api/study-plan
router.post('/study-plan', generateStudyPlan);

// Health
router.get('/health', (req, res) => res.json({ status: 'OK' }));

export default router;
