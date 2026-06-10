import { Router } from 'express';
import * as wellnessTipController from '../controllers/wellnessTipController';

const router = Router();

// Public route to fetch all wellness tips
router.get('/', wellnessTipController.getTips);

export default router;
