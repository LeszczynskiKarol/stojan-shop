// backend/src/routes/ai.routes.ts
import express from 'express';
import { AIController } from '../controllers/ai.controller';

const router = express.Router();
const aiController = new AIController();

router.post('/generate-description', aiController.generateProductDescription);

export default router;
