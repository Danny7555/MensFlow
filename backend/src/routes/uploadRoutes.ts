import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { uploadMiddleware, handleImageUpload } from '../controllers/uploadController';

const router = Router();

// POST /api/upload?type=avatar|cover
router.post('/', authenticate, uploadMiddleware.single('image'), handleImageUpload);

export default router;
