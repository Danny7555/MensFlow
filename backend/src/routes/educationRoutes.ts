import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as educationController from '../controllers/educationController';

const router = Router();

// Public route to fetch all articles
router.get('/', educationController.getArticles);

// Authenticated routes to manage articles
router.post('/', authenticate, educationController.createArticle);
router.put('/:id', authenticate, educationController.updateArticle);
router.delete('/:id', authenticate, educationController.deleteArticle);

export default router;
