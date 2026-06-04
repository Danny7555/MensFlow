import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as wellnessTipController from '../controllers/wellnessTipController';

const router = Router();

// Public route to fetch all wellness tips
router.get('/', wellnessTipController.getTips);

// Authenticated routes to manage wellness tips
router.post('/', authenticate, wellnessTipController.createTip);
router.put('/:id', authenticate, wellnessTipController.updateTip);
router.delete('/:id', authenticate, wellnessTipController.deleteTip);

export default router;
